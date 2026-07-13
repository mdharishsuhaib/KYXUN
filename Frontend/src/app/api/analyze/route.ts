import { runPipeline, type PipelineResult } from "@/lib/pipeline";
import { buildContext } from "@/lib/pipeline/contextBuilder";
import { calculateReadiness } from "@/lib/readiness";
import { GEMINI_MODEL_NAME, geminiJsonModel, generateTextWithRetry, parseGeminiJson } from "@/lib/gemini";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { StudyPlan } from "@/lib/academic";

const DOCUMENT_BUCKET = "documents";
const CHARS_PER_TOKEN = 4;
const MAX_GEMINI_PROMPT_CHARS = 12000;
const TARGET_CONTEXT_TOKENS = 1800;

type ExtractionPersistenceStats = {
  extractedCharacterCount: number;
  documentsUpdated: number;
  chunksInserted: number;
};

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, any>;
    return record.error?.message || record.message || JSON.stringify(record);
  }
  return String(error);
}

function parseJsonArray(value: FormDataEntryValue | null): string[] {
  if (!value || typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function buildCompactAnalysisPrompt(
  contextText: string,
  params: {
    subject: string;
    days: string;
    hours: string;
    totalChapters: string;
    completedChapters: string;
    goal: string;
  }
): string {
  const { subject, days, hours, totalChapters, completedChapters, goal } = params;

  return [
    "Use only the uploaded material below. If something is missing, write exactly: Not found in uploaded material.",
    "Return only valid compact JSON. Keep every string concise.",
    "",
    `Student: subject=${subject}; exam_in_days=${days}; hours_per_day=${hours}; chapters=${completedChapters}/${totalChapters}; goal=${goal}.`,
    "",
    "Uploaded material:",
    contextText,
    "",
    "JSON shape:",
    "{",
    '"introMessage": string,',
    '"passProbability": number,',
    '"riskLevel": "High Risk|Medium Risk|Low Risk|Critical",',
    '"riskLabel": string,',
    '"harshTruths": [string, string, string],',
    '"mustStudy": [string, string, string, string, string],',
    '"shouldSkip": [string, string],',
    '"schedule": [{"day": number, "time": string, "title": string, "type": "urgent|focus|break|skip"}],',
    `"studyHours": ${hours},`,
    '"sleepHours": 6,',
    '"tacticalTip": string,',
    '"pyqAnalysis": {"frequentlyAskedTopics": [{"topic": string, "frequency": number, "examWeightage": string, "studyPriority": string, "patternDetails": string}], "questionPatterns": [string], "predictedHighValueChapters": [{"chapterName": string, "predictedWeightage": string, "reason": string}]},',
    '"documentSummary": {"summary": string, "chapterSummaries": [{"chapter": string, "summary": string, "keyPoints": [string]}], "keyConcepts": [string], "definitions": [string], "formulas": [string], "shortNotes": [string], "examTips": [string], "mnemonics": [string], "mindMap": string, "timeline": [string]},',
    '"practiceQuestions": [{"type": string, "question": string, "answer": string}],',
    '"flashcards": [{"front": string, "back": string, "tag": string}],',
    '"vivaQuestions": [{"question": string, "answer": string}],',
    '"knowledgeBase": {"topics": [{"title": string, "notes": [string]}]}',
    "}",
    "",
    "Limits: max 5 schedule items, 5 practice questions, 6 flashcards, 5 viva questions. Prefer high-yield content from the provided chunks.",
  ].join("\n");
}

function buildPromptWithinBudget(
  pipeline: PipelineResult,
  params: {
    subject: string;
    days: string;
    hours: string;
    totalChapters: string;
    completedChapters: string;
    goal: string;
  }
) {
  const originalContextChars = pipeline.context.contextText.length;
  const originalPrompt = buildCompactAnalysisPrompt(pipeline.context.contextText, params);
  const originalPromptChars = originalPrompt.length;

  let contextTokenBudget = Math.min(TARGET_CONTEXT_TOKENS, Math.max(600, pipeline.context.totalTokensUsed));
  let prompt = originalPrompt;
  let budgetedContext = pipeline.context;

  while (prompt.length > MAX_GEMINI_PROMPT_CHARS && contextTokenBudget >= 600) {
    budgetedContext = buildContext(pipeline.selectedChunks, pipeline.allChunks, {
      maxContextTokens: contextTokenBudget,
      includeMetadata: false,
    });
    prompt = buildCompactAnalysisPrompt(budgetedContext.contextText, params);
    contextTokenBudget = Math.floor(contextTokenBudget * 0.75);
  }

  if (prompt.length > MAX_GEMINI_PROMPT_CHARS) {
    const overflow = prompt.length - MAX_GEMINI_PROMPT_CHARS;
    const allowedContextChars = Math.max(4000, budgetedContext.contextText.length - overflow - 500);
    const truncatedContextText = budgetedContext.contextText.slice(0, allowedContextChars)
      + "\n\n[Context truncated to fit Gemini context budget. Use only the included material.]";
    budgetedContext = {
      ...budgetedContext,
      contextText: truncatedContextText,
      totalTokensUsed: estimateTokens(truncatedContextText),
      coveragePercent: Math.round((truncatedContextText.length / Math.max(1, originalContextChars)) * 100),
    };
    prompt = buildCompactAnalysisPrompt(budgetedContext.contextText, params);
  }

  if (prompt.length > MAX_GEMINI_PROMPT_CHARS) {
    prompt = prompt.slice(0, MAX_GEMINI_PROMPT_CHARS)
      + "\n\nReturn valid JSON using only the included uploaded material.";
  }

  const finalPrompt = prompt.slice(0, MAX_GEMINI_PROMPT_CHARS);
  const finalEstimatedTokens = estimateTokens(finalPrompt);

  console.info("[api/analyze] Gemini prompt budget", {
    originalCharacterCount: originalPromptChars,
    originalContextCharacterCount: originalContextChars,
    truncatedCharacterCount: finalPrompt.length,
    truncatedContextCharacterCount: budgetedContext.contextText.length,
    estimatedTokens: finalEstimatedTokens,
    selectedChunks: budgetedContext.chunksUsed,
    availableChunks: budgetedContext.chunksAvailable,
  });

  return {
    prompt: finalPrompt,
    estimatedTokens: finalEstimatedTokens,
  };
}

async function updateDocumentsStatus(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  ids: string[],
  status: string,
  progress: number
) {
  if (ids.length === 0) return;
  const { error } = await supabase
    .from("documents")
    .update({ status, processing_progress: progress })
    .in("id", ids);
  if (error) throw new Error(`Supabase document status update failed: ${error.message}`);
}

async function loadStorageFiles(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  documentIds: string[]
) {
  const { data: docs, error } = await supabase
    .from("documents")
    .select("id,user_id,subject_id,filename,file_name,storage_path,mime_type,file_type,file_size")
    .eq("user_id", userId)
    .in("id", documentIds);

  if (error) throw new Error(`Supabase document lookup failed: ${error.message}`);
  if (!docs || docs.length === 0) throw new Error("No uploaded documents were found for analysis.");

  const docsById = new Map(docs.map((doc) => [doc.id, doc]));
  const orderedDocs = documentIds
    .map((id) => docsById.get(id))
    .filter((doc): doc is NonNullable<typeof doc> => Boolean(doc));
  if (orderedDocs.length !== documentIds.length) {
    throw new Error("One or more uploaded documents were not found for analysis.");
  }

  const files: File[] = [];
  for (const doc of orderedDocs) {
    if (!doc.storage_path) throw new Error(`Document ${doc.id} has no Storage path.`);

    const { data: blob, error: downloadError } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .download(doc.storage_path);

    if (downloadError || !blob) {
      throw new Error(`Storage download failed for ${doc.filename || doc.file_name}: ${downloadError?.message || "No file returned"}`);
    }

    files.push(new File([await blob.arrayBuffer()], doc.filename || doc.file_name || "document", {
      type: doc.mime_type || doc.file_type || "application/octet-stream",
    }));
  }

  return { docs: orderedDocs, files };
}

async function persistExtractionArtifacts(params: {
  supabase: ReturnType<typeof getSupabaseAdmin>;
  userId: string;
  documentIds: string[];
  documentFileNames: string[];
  pipeline: PipelineResult;
}): Promise<ExtractionPersistenceStats> {
  const {
    supabase,
    userId,
    documentIds,
    documentFileNames,
    pipeline,
  } = params;

  const extractedByName = new Map(
    pipeline.extractions.map((extraction) => [
      extraction.fileName,
      extraction.pages.map((page) => page.text).join("\n\n"),
    ])
  );
  const documentNameById = new Map(documentIds.map((id, index) => [id, documentFileNames[index] || ""]));
  const extractedCharacterCount = Array.from(extractedByName.values()).reduce(
    (sum, text) => sum + text.length,
    0
  );

  let documentsUpdated = 0;
  for (const documentId of documentIds) {
    const docName = documentNameById.get(documentId);
    const extractionText = docName ? extractedByName.get(docName) : "";
    const { error: updateError } = await supabase
      .from("documents")
      .update({
        extraction_text: extractionText || null,
        status: "extracted",
        processing_progress: 70,
      })
      .eq("id", documentId);
    if (updateError) throw new Error(`Supabase document extraction update failed: ${updateError.message}`);
    documentsUpdated++;
  }

  const chunksByDocument = pipeline.allChunks
    .map((chunk) => {
      const docIndex = documentFileNames.findIndex((name) => name === chunk.source);
      const documentId = docIndex >= 0 ? documentIds[docIndex] : documentIds[0];
      return {
        document_id: documentId,
        user_id: userId,
        content: chunk.text,
        chunk_index: chunk.chunkIndex,
      };
    })
    .filter((chunk) => Boolean(chunk.document_id && chunk.content));

  if (documentIds.length > 0) {
    const { error: deleteOldChunksError } = await supabase
      .from("document_chunks")
      .delete()
      .in("document_id", documentIds);
    if (deleteOldChunksError) throw new Error(`Supabase old chunk cleanup failed: ${deleteOldChunksError.message}`);
  }

  if (chunksByDocument.length > 0) {
    const { error: chunkError } = await supabase.from("document_chunks").insert(chunksByDocument);
    if (chunkError) throw new Error(`Supabase document chunk insert failed: ${chunkError.message}`);
  }

  const stats = {
    extractedCharacterCount,
    documentsUpdated,
    chunksInserted: chunksByDocument.length,
  };

  console.info("[api/analyze] extraction persistence", stats);

  return stats;
}

async function persistResults(params: {
  supabase: ReturnType<typeof getSupabaseAdmin>;
  userId: string;
  subject: string;
  days: number;
  hours: number;
  totalChapters: number;
  completedChapters: number;
  goal: string;
  data: StudyPlan;
  documentIds: string[];
  pipeline: PipelineResult;
}) {
  const {
    supabase,
    userId,
    subject,
    days,
    hours,
    totalChapters,
    completedChapters,
    goal,
    data,
    documentIds,
    pipeline,
  } = params;

  (data as StudyPlan & { documentIds?: string[] }).documentIds = documentIds;

  const { data: planRecord, error: planError } = await supabase
    .from("study_plans")
    .insert({
      user_id: userId,
      subject,
      days,
      hours_per_day: hours,
      total_chapters: totalChapters,
      completed_chapters: completedChapters,
      goal,
      plan_data: data,
      source_document_ids: documentIds,
    })
    .select()
    .single();

  if (planError) throw new Error(`Supabase study plan insert failed: ${planError.message}`);
  data.id = planRecord.id;

  for (const documentId of documentIds) {
    const { error: updateError } = await supabase
      .from("documents")
      .update({
        status: "analyzed",
        processing_progress: 100,
        summary_available: Boolean(data.documentSummary?.summary),
        flashcards_available: Array.isArray(data.flashcards) && data.flashcards.length > 0,
      })
      .eq("id", documentId);
    if (updateError) throw new Error(`Supabase document update failed: ${updateError.message}`);
  }

  const cards = Array.isArray(data.flashcards) ? data.flashcards : [];
  if (cards.length > 0) {
    const { error: flashcardError } = await supabase.from("flashcards").insert(
      cards.map((card) => ({
        user_id: userId,
        plan_id: planRecord.id,
        front: card.front,
        back: card.back,
        tag: card.tag,
        is_mastered: false,
      }))
    );
    if (flashcardError) throw new Error(`Supabase flashcard insert failed: ${flashcardError.message}`);
  }

  const readiness = calculateReadiness({
    plan: data,
    totalChapters,
    completedChapters,
    completedTasks: {},
    vivaScore: 0,
    flashcardCount: 0,
    uploadedFilesCount: documentIds.length,
  });

  const { error: readinessError } = await supabase.from("readiness_scores").insert({
    user_id: userId,
    plan_id: planRecord.id,
    readiness_score: readiness.readinessScore,
    knowledge_coverage: readiness.knowledgeCoverage,
    revision_readiness: readiness.revisionReadiness,
    predicted_marks: readiness.predictedMarksRange,
    strong_topics: readiness.strongTopics,
    weak_topics: readiness.weakTopics,
    exam_risk_level: readiness.riskLevel,
  });
  if (readinessError) throw new Error(`Supabase readiness insert failed: ${readinessError.message}`);

  const resources = [
    data.documentSummary && {
      user_id: userId,
      plan_id: planRecord.id,
      resource_type: "document_summary",
      content: JSON.stringify(data.documentSummary),
      pipeline_stats: JSON.stringify(pipeline.stats),
    },
    data.knowledgeBase && {
      user_id: userId,
      plan_id: planRecord.id,
      resource_type: "knowledge_base",
      content: JSON.stringify(data.knowledgeBase),
      pipeline_stats: JSON.stringify(pipeline.stats),
    },
    data.practiceQuestions && {
      user_id: userId,
      plan_id: planRecord.id,
      resource_type: "practice_questions",
      content: JSON.stringify(data.practiceQuestions),
      pipeline_stats: JSON.stringify(pipeline.stats),
    },
  ].filter((resource): resource is {
    user_id: string;
    plan_id: string;
    resource_type: string;
    content: string;
    pipeline_stats: string;
  } => Boolean(resource));

  if (resources.length > 0) {
    const { error: resourceError } = await supabase.from("generated_resources").insert(resources);
    if (resourceError) throw new Error(`Supabase generated resource insert failed: ${resourceError.message}`);
  }

  return { planRecord, readiness };
}

export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return Response.json({ error: "User session is required for document analysis." }, { status: 401 });
  }

  try {
    const fd = await request.formData();
    const documentIds = parseJsonArray(fd.get("documentIds"));
    const syllabusFiles = fd.getAll("syllabusFiles").filter((entry): entry is File => entry instanceof File);
    const pyqFiles = fd.getAll("pyqFiles").filter((entry): entry is File => entry instanceof File);

    const days = Number(fd.get("days") || 2);
    const hours = Number(fd.get("hours") || 8);
    const subject = String(fd.get("subject") || "Uploaded Material");
    const totalChapters = Number(fd.get("totalChapters") || 1);
    const completedChapters = Number(fd.get("completedChapters") || 0);
    const goal = String(fd.get("goal") || "Study uploaded material");

    console.info("[api/analyze] request body", {
      userId,
      documentIds,
      days,
      hours,
      subject,
      totalChapters,
      completedChapters,
      goal,
      syllabusFiles: syllabusFiles.map((file) => ({ name: file.name, size: file.size, type: file.type })),
      pyqFiles: pyqFiles.map((file) => ({ name: file.name, size: file.size, type: file.type })),
    });
    console.info("[api/analyze] syllabus files received", syllabusFiles.length);

    if (documentIds.length === 0 && syllabusFiles.length === 0) {
      throw new Error("No syllabus files or uploaded document IDs were received for analysis.");
    }

    const supabase = getSupabaseAdmin();
    await updateDocumentsStatus(supabase, documentIds, "extracting", 20);

    const storageResult = documentIds.length > 0
      ? await loadStorageFiles(supabase, userId, documentIds)
      : { docs: [], files: [] };
    const storageFiles = storageResult.files;
    const documentFileNames = storageResult.docs.map((doc: any) => doc.filename || doc.file_name || "document");
    const files = [...storageFiles, ...syllabusFiles, ...pyqFiles];
    console.info("[api/analyze] files sent to pipeline", files.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
    })));

    const pipeline = await runPipeline(files, { maxContextTokens: 24000 });
    console.info("[api/analyze] pipeline result", pipeline.stats);
    if (pipeline.context.chunksUsed === 0) {
      throw new Error("Extraction completed, but no readable text was found in the uploaded document.");
    }

    const extractionStats = await persistExtractionArtifacts({
      supabase,
      userId,
      documentIds,
      documentFileNames,
      pipeline,
    });
    console.info("[api/analyze] extraction ready before Gemini", {
      extractedCharacterCount: extractionStats.extractedCharacterCount,
      documentsUpdated: extractionStats.documentsUpdated,
      chunksInserted: extractionStats.chunksInserted,
    });

    const { prompt, estimatedTokens } = buildPromptWithinBudget(pipeline, {
      subject,
      days: `${days}`,
      hours: `${hours}`,
      totalChapters: `${totalChapters}`,
      completedChapters: `${completedChapters}`,
      goal,
    });

    await updateDocumentsStatus(supabase, documentIds, "generating", 80);

    let data: StudyPlan | null = null;
    try {
      console.info("[api/analyze] Gemini request", {
        model: GEMINI_MODEL_NAME,
        estimatedPromptTokens: estimatedTokens,
      });

      const responseText = await generateTextWithRetry(
        geminiJsonModel,
        [
          "You are Kyxun's grounded academic engine.",
          "Use only the uploaded document context.",
          "If an answer cannot be found, write exactly: I couldn't find that in your uploaded material.",
          "Return only valid JSON.",
          "",
          prompt,
        ].join("\n")
      );
      console.info("[api/analyze] Gemini response", {
        model: GEMINI_MODEL_NAME,
        responseCharacters: responseText.length,
        contentPreview: responseText.slice(0, 1200),
      });

      if (!responseText.trim()) {
        throw new Error("Gemini returned an empty analysis response.");
      }

      data = parseGeminiJson<StudyPlan>(responseText);
      if (!data) {
        console.error("[api/analyze] Gemini JSON parse failed", {
          model: GEMINI_MODEL_NAME,
          responseText,
        });
        throw new Error("Gemini returned invalid JSON.");
      }
    } catch (aiError) {
      const aiMessage = errorMessage(aiError);
      console.error("[api/analyze] Gemini analysis failed after extraction persistence", {
        model: GEMINI_MODEL_NAME,
        message: aiMessage,
        extractionStats,
        error: aiError,
      });
      await updateDocumentsStatus(supabase, documentIds, "extracted", 70);
      return Response.json(
        {
          error: "AI analysis failed after document extraction.",
          details: aiMessage,
          extractionPersisted: true,
          extraction: extractionStats,
          geminiModel: GEMINI_MODEL_NAME,
        },
        { status: 502 }
      );
    }

    await updateDocumentsStatus(supabase, documentIds, "saving", 90);
    const { readiness } = await persistResults({
      supabase,
      userId,
      subject,
      days,
      hours,
      totalChapters,
      completedChapters,
      goal,
      data,
      documentIds,
      pipeline,
    });

    return Response.json({
      ...data,
      readiness,
      _pipeline: pipeline.stats,
    });
  } catch (error) {
    const message = errorMessage(error) || "Analysis failed for an unknown reason.";
    console.error("[api/analyze] caught exception before response", {
      message,
      error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return Response.json({
      error: message,
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
