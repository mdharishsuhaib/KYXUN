import { getSupabaseAdmin } from "@/lib/supabase";
import { documentService } from "@/lib/services/documentService";
import { geminiJsonModel, generateTextWithRetry } from "@/lib/gemini";

function detectIntent(query: string): string {
  const q = query.toLowerCase().trim();
  if (/\b(questions?|exam_prediction|predict|important)\b/i.test(q)) {
    return "exam_prediction";
  }
  if (/\b(revision|revise|short notes|notes)\b/i.test(q)) {
    return "revision_notes";
  }
  if (/\b(teach|explain|tutor|module|chapter|concept)\b/i.test(q)) {
    return "tutor_mode";
  }
  if (/\b(mcq|quiz|quiz me|test)\b/i.test(q)) {
    return "quiz_generator";
  }
  if (/\b(flashcard|cards)\b/i.test(q)) {
    return "flashcard_generator";
  }
  if (/\b(summary|summarize)\b/i.test(q)) {
    return "summarizer";
  }
  if (/\b(mind map)\b/i.test(q)) {
    return "concept_mapper";
  }
  if (/\b(formula|formulae|sheet)\b/i.test(q)) {
    return "formula_extractor";
  }
  if (/\b(cheat sheet|cheat)\b/i.test(q)) {
    return "condensed_revision";
  }
  if (/\b(compare|comparison|difference|contrast)\b/i.test(q)) {
    return "comparison_mode";
  }
  if (/\b(definition|definitions|meaning)\b/i.test(q)) {
    return "definition_extractor";
  }
  return "general_academic_tutor";
}

function scoreConceptMatch(node: string, description: string, relationships: string[], query: string): number {
  const q = query.toLowerCase();
  let score = 0;
  if (node.toLowerCase().split(/\s+/).some(w => q.includes(w))) score += 40;
  if (description.toLowerCase().split(/\s+/).some(w => w.length > 4 && q.includes(w))) score += 20;
  relationships.forEach(r => { if (q.includes(r.toLowerCase())) score += 10; });
  return score;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
}

function rankChunkRows(chunks: { content: string }[], query: string, limit: number): string[] {
  if (chunks.length === 0) return [];

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return chunks.slice(0, limit).map((chunk) => chunk.content);

  const scored = chunks.map((chunk) => {
    const contentTokens = tokenize(chunk.content);
    const contentSet = new Set(contentTokens);
    const contentLower = chunk.content.toLowerCase();
    let score = 0;

    for (const queryToken of queryTokens) {
      if (contentSet.has(queryToken)) {
        const frequency = contentTokens.filter((token) => token === queryToken).length;
        score += frequency * (queryToken.length > 5 ? 2 : 1);
      }
    }

    const queryPhrase = queryTokens.join(" ");
    if (contentLower.includes(queryPhrase)) score += 10;
    if (/is\s+defined\s+as|refers?\s+to|is\s+called/i.test(chunk.content)) score += 3;
    if (/formula|equation|=|∑|∫/i.test(chunk.content)) score += 2;

    return { content: chunk.content, score };
  });

  const matched = scored.filter((chunk) => chunk.score > 0);
  return (matched.length > 0 ? matched.sort((a, b) => b.score - a.score) : scored)
    .slice(0, limit)
    .map((chunk) => chunk.content);
}

function retrieveFromKnowledgeBase(kb: any, query: string): string {
  if (!kb) return "";
  const q = query.toLowerCase();
  const sections: string[] = [];

  // 1. Concept Graph — find matching nodes
  const matchedNodes = (kb.conceptGraph || [])
    .map((n: any) => ({ ...n, score: scoreConceptMatch(n.node, n.description, n.relationships || [], q) }))
    .filter((n: any) => n.score > 0)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 5);

  if (matchedNodes.length > 0) {
    sections.push(`[CONCEPT GRAPH MATCHES]\n` + matchedNodes.map((n: any) =>
      `• ${n.node} (${n.module}, ${n.page})\n  ${n.description}\n  Related: ${(n.relationships || []).join(", ")}`
    ).join("\n\n"));
  }

  // 2. Module sections — scan for keyword matches
  const matchedModules = (kb.modules || []).filter((m: any) => {
    const txt = [m.title, m.summary, ...(m.importantTopics || []), ...(m.keywords || [])].join(" ").toLowerCase();
    return q.split(/\s+/).some(w => w.length > 3 && txt.includes(w));
  }).slice(0, 3);

  if (matchedModules.length > 0) {
    sections.push(`[MODULE KNOWLEDGE]\n` + matchedModules.map((m: any) => {
      const parts = [`Module: ${m.title}`, `Summary: ${m.summary}`];
      if (m.definitions?.length) parts.push(`Definitions:\n${m.definitions.map((d: string) => `  - ${d}`).join("\n")}`);
      if (m.formulae?.length) parts.push(`Formulae:\n${m.formulae.map((f: string) => `  - ${f}`).join("\n")}`);
      if (m.algorithms?.length) parts.push(`Algorithms:\n${m.algorithms.map((a: string) => `  - ${a}`).join("\n")}`);
      if (m.tables?.length) parts.push(`Tables:\n${m.tables.join("\n")}`);
      if (m.flowcharts?.length) parts.push(`Flowcharts:\n${m.flowcharts.map((f: string) => `  - ${f}`).join("\n")}`);
      if (m.diagrams?.length) parts.push(`Diagrams:\n${m.diagrams.map((d: string) => `  - ${d}`).join("\n")}`);
      if (m.commonExamQuestions?.length) parts.push(`Common Exam Questions:\n${m.commonExamQuestions.map((e: string) => `  - ${e}`).join("\n")}`);
      if (m.frequentMistakes?.length) parts.push(`Frequent Mistakes:\n${m.frequentMistakes.map((e: string) => `  - ${e}`).join("\n")}`);
      if (m.mnemonics?.length) parts.push(`Mnemonics: ${m.mnemonics.join(" | ")}`);
      return parts.join("\n");
    }).join("\n\n---\n\n"));
  }

  // 3. Glossary — find term matches
  const matchedTerms = (kb.glossary || []).filter((g: any) =>
    q.includes(g.term.toLowerCase()) || g.term.toLowerCase().split(/\s+/).some((w: string) => q.includes(w))
  ).slice(0, 8);

  if (matchedTerms.length > 0) {
    sections.push(`[GLOSSARY]\n` + matchedTerms.map((g: any) => `• ${g.term}: ${g.definition}`).join("\n"));
  }

  if (sections.length === 0) {
    // Broad fallback: return first module + all glossary
    if (kb.modules?.length > 0) {
      const m = kb.modules[0];
      sections.push(`[FALLBACK MODULE: ${m.title}]\n${m.summary}\nTopics: ${(m.importantTopics || []).join(", ")}`);
    }
    if (kb.glossary?.length > 0) {
      sections.push(`[FULL GLOSSARY]\n` + kb.glossary.slice(0, 10).map((g: any) => `• ${g.term}: ${g.definition}`).join("\n"));
    }
  }

  return sections.join("\n\n");
}

function buildIntentPrompt(intent: string, query: string, context: string, academicContext: string) {
  let specificInstructions = "";

  switch (intent) {
    case "exam_prediction":
      specificInstructions = `
Identify concepts and questions with the highest probability of appearing in the examination from the material.
For the "content" section:
- "items": List the most probable 2-mark, 5-mark, and 10/15-mark questions.
- "common_traps": List 2 common exam pitfalls or conceptual mistakes students make.
For the "quiz" or "flashcards" section, generate 2-3 matching questions or cards based on these predicted topics.
Explain in "content.details" why these topics are high-yield and their relative weightage.`;
      break;

    case "revision_notes":
      specificInstructions = `
Extract a structured revision guide from the notes.
For the "content" section:
- "summary": Executive summary of the material.
- "items": List key points, bullet summaries, and revision milestones.
- "common_traps": List common test pitfalls.
Provide a clean overview in "content.details".`;
      break;

    case "tutor_mode":
      specificInstructions = `
Explain the requested module or topic in depth, acting as an elite IIT Professor.
Explain derivations, concepts, and applications clearly in "content.details".
List key takeaways in "content.items".
Provide common mistakes in "content.common_traps".`;
      break;

    case "quiz_generator":
      specificInstructions = `
Generate a practice quiz based on the material.
You MUST populate the "quiz" array with 3-5 exam-quality practice questions.
Include a mix of MCQs (with 4 options) and True/False questions.
For each question, provide the "question", "options" (if MCQ, else empty), "answer", and a detailed "explanation".
Explain the overall test scope in "content.details".`;
      break;

    case "flashcard_generator":
      specificInstructions = `
Generate active recall flashcards from the notes.
You MUST populate the "flashcards" array with 4-6 cards.
Each card must have a clear conceptual "front" (question/prompt) and a concise, high-yield explanation "back".
List the topics covered in "content.items".`;
      break;

    case "summarizer":
      specificInstructions = `
Create an executive summary of the retrieved material.
Populate "content.summary" with a high-level summary.
List 3-5 key sub-topics or chapters covered in "content.items".
Outline details in "content.details".`;
      break;

    case "concept_mapper":
      specificInstructions = `
Create a logical mind map or structural outline of the concepts in the notes.
Represent the mind map using text indentation or structured hierarchy in "content.details".
List key nodes in "content.items".`;
      break;

    case "formula_extractor":
      specificInstructions = `
Extract all formulas, mathematical models, or equations found in the retrieved material.
List each formula with its variables and definitions in "content.items".
Explain how they are applied in "content.details".
If no formulas are present in the document, explicitly set content.details to "Not found in uploaded notes." and do not invent any.`;
      break;

    case "condensed_revision":
      specificInstructions = `
Create a condensed cheat sheet containing the most critical formulas, constants, and definitions.
List cheat sheet items in "content.items".
Provide exam tips in "content.details".
List common pitfalls in "content.common_traps".`;
      break;

    case "comparison_mode":
      specificInstructions = `
Compare and contrast competing concepts, definitions, or methodologies in the material.
You MUST compile a comparison grid/table and put it in the "content.tables" array.
Highlight differences in "content.items".
Describe the comparisons in "content.details".`;
      break;

    case "definition_extractor":
      specificInstructions = `
Extract core definitions and vocabulary terms from the notes.
List terms and their exact definitions in "content.items".
Explain the main glossary outline in "content.details".`;
      break;

    default:
      specificInstructions = `
Provide general academic assistance based strictly on the notes.
Populate "content.details" and "content.items" with your response.`;
  }

  return `You are Kyxun AI — an AI Knowledge Engine (like NotebookLM), NOT a chatbot.
You have been given a precomputed, structured Knowledge Base built from the student's uploaded study material.
Your answers must come EXCLUSIVELY from this Knowledge Base. You are FORBIDDEN from using outside knowledge.

You are forbidden from using outside knowledge. Every summary, flashcard, question, definition, mnemonic, exam tip, study plan, and practice question MUST be derived only from the uploaded document. If information does not exist in the uploaded material, respond with "Not found in uploaded notes." Never invent formulas. Never invent definitions. Never output generic study advice.

STUDENT STUDY PLAN CONTEXT:
${academicContext}

RETRIEVED KNOWLEDGE BASE CONTEXT (This is your ONLY allowed knowledge source — derived from concept graph, module definitions, and glossary):
${context}

USER REQUEST:
"${query}"

CLASSIFIED INTENT:
${intent}

YOUR TASK:
Optimize the user request under the classified intent. You must respond ONLY with a valid JSON object matching the required schema.

REQUIRED JSON FORMAT:
{
  "intent": "${intent}",
  "title": "<Short title of response>",
  "grounding": {
    "module": "<Module number/name from retrieved document excerpt, or 'N/A'>",
    "chapter": "<Chapter name from retrieved document excerpt, or 'N/A'>",
    "page": "<Source Page number if visible in retrieved document excerpt, else 'N/A'>",
    "confidence": <confidence score: 0 to 100 based on topic recurrence and citation details>
  },
  "content": {
    "summary": "<high-level summary, or 'N/A'>",
    "details": "<detailed text response centered on marks maximization>",
    "items": ["<bullet point 1>", "<bullet point 2>"],
    "tables": ["<text table comparison grid if applicable>"],
    "diagrams": ["<diagram text description or flow chart outline if applicable>"],
    "common_traps": ["<common exam mistake or trap 1>", "<common exam mistake 2>"]
  },
  "flashcards": [
    { "front": "<front of card>", "back": "<back of card>" }
  ],
  "quiz": [
    { "question": "<question>", "options": ["A", "B", "C", "D"], "answer": "<correct letter>", "explanation": "<explanation>" }
  ],
  "follow_ups": [
    "<custom contextual follow-up action pill 1>",
    "<custom contextual follow-up action pill 2>",
    "<custom contextual follow-up action pill 3>"
  ]
}

SPECIFIC INTENT DIRECTIONS:
${specificInstructions}

CRITICAL RULES:
- Return ONLY valid JSON.
- Never use outside textbook knowledge. Only use the Retrieved Knowledge Base Context above.
- Follow-ups must be relevant to the context. E.g., if the user asked for a summary, show follow-ups like: "Generate Flashcards", "Create MCQ Test", "Explain Difficult Concepts".
- Cite exact pages and modules where possible.
- If information is missing from the Knowledge Base Context, return "Not found in uploaded notes." inside the details.`;
}

export async function POST(req: Request) {
  try {
    const userId = req.headers.get("x-user-id") || null;
    const fd = await req.formData();
    const messagesJson = fd.get("messages") as string;
    const messages = messagesJson ? JSON.parse(messagesJson) : [];
    
    const files = fd.getAll("files") as File[];
    const supabase = userId ? getSupabaseAdmin() : null;

    const fileTexts: string[] = [];

    // Process newly uploaded files in this request (if any)
    if (files.length > 0) {
      const { extractFile } = await import("@/lib/pipeline/extractor");
      const results = await Promise.all(files.map(async (file) => {
        const extraction = await extractFile(file);
        return extraction ? extraction.pages.map((p) => p.text).join("\n\n") : null;
      }));
      results.forEach((t) => t && fileTexts.push(t));

      if (userId && fileTexts.length > 0) {
        for (let i = 0; i < files.length; i++) {
          if (results[i]) {
            await documentService.uploadDocument(userId, {
              file_name: files[i].name,
              file_size: files[i].size,
              file_type: files[i].type,
              extraction_text: results[i]!
            });
          }
        }
      }
    }

    let rawUserQuery = "";
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === "user") {
        rawUserQuery = lastMsg.content;
      }
    }

    const intent = detectIntent(rawUserQuery);

    let academicContext = "";
    let knowledgeBaseContext = "";
    let canonicalContext = "";
    let latestPlan: any = null;
    let sourceDocumentIds: string[] = [];
    let documentsFound = 0;
    let chunksFound = 0;
    let totalExtractedCharacters = 0;

    if (userId && supabase) {
      try {
        const { data: plans, error: planError } = await supabase
          .from("study_plans")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1);
        if (planError) throw new Error(`Chat study plan lookup failed: ${planError.message}`);

        latestPlan = plans?.[0] ?? null;
        if (latestPlan) {
          sourceDocumentIds = Array.isArray(latestPlan.source_document_ids)
            ? latestPlan.source_document_ids.filter((id: unknown): id is string => typeof id === "string")
            : [];

          academicContext += `\n[ACTIVE STUDY PLAN:\nSubject: ${latestPlan.subject}\nGoal: ${latestPlan.goal}\nMust Study: ${latestPlan.plan_data.mustStudy?.join(", ") || ""}\nShould Skip: ${latestPlan.plan_data.shouldSkip?.join(", ") || ""}\n]`;

          const planData = latestPlan.plan_data || {};
          const canonicalPlanText = [
            planData.documentSummary?.summary,
            planData.documentSummary?.keyConcepts?.join("\n"),
            planData.documentSummary?.definitions?.join("\n"),
            planData.documentSummary?.formulas?.join("\n"),
            planData.practiceQuestions?.map((q: any) => `${q.type}: ${q.question} | Answer: ${q.answer}`).join("\n"),
            planData.flashcards?.map((c: any) => `${c.front} -> ${c.back}`).join("\n"),
            planData.knowledgeBase?.modules?.map((m: any) => `${m.title}: ${m.summary}`).join("\n"),
          ].filter(Boolean).join("\n\n");

          if (canonicalPlanText) {
            canonicalContext = `[CANONICAL STUDY PLAN CONTENT]\n${canonicalPlanText}`;
          }

          // ── V3: KNOWLEDGE BASE RETRIEVAL (PRIMARY) ──────────────────────────
          // Query structured KB: concept graph → modules → glossary
          if (latestPlan.plan_data.knowledgeBase) {
            const kb = latestPlan.plan_data.knowledgeBase;
            knowledgeBaseContext = retrieveFromKnowledgeBase(kb, rawUserQuery);

            // Append KB metadata to academic context
            academicContext += `\n[KNOWLEDGE BASE:\nCourse: ${kb.courseName}\nSubject: ${kb.subject}\nDifficulty: ${kb.difficultyScore}/100\nExam Probability: ${kb.examProbability}%\nModules: ${kb.modules?.map((m: any) => m.title).join(", ")}\n]`;
          }

          // ── LEGACY: Flat documentSummary (if KB not built yet) ───────────────
          if (!latestPlan.plan_data.knowledgeBase && latestPlan.plan_data.documentSummary) {
            const ds = latestPlan.plan_data.documentSummary;
            academicContext += `\n[REVISION NOTES & EXTRACTED SYLLABUS DETAIL:\nSummary: ${ds.summary || ""}\nKey Concepts: ${ds.keyConcepts?.join(", ") || ""}\nFormulas: ${ds.formulas?.join(", ") || ""}\nDefinitions: ${ds.definitions?.join(", ") || ""}\nShort Notes: ${ds.shortNotes?.join(", ") || ""}\nExam Tips: ${ds.examTips?.join(", ") || ""}\nMnemonics: ${ds.mnemonics?.join(", ") || ""}\n]`;
          }

          if (latestPlan.plan_data.practiceQuestions && latestPlan.plan_data.practiceQuestions.length > 0) {
            const questList = latestPlan.plan_data.practiceQuestions.map((q: any, i: number) => 
              `Q${i+1} (${q.type}): ${q.question} (Ideal: ${q.answer})`
            ).join("\n");
            academicContext += `\n[GENERATED PRACTICE QUESTIONS:\n${questList}\n]`;
          }

          const { data: cardRows } = await supabase
            .from("flashcards")
            .select("*")
            .eq("user_id", userId)
            .eq("plan_id", latestPlan.id);
          const cards = cardRows || [];
          if (cards.length > 0) {
            const cardList = cards.map((c: any, i: number) => 
              `Card ${i+1}: Front: ${c.front} | Back: ${c.back} | Mastered: ${c.isMastered}`
            ).join("\n");
            academicContext += `\n[ACTIVE FLASHCARDS:\n${cardList}\n]`;
          }

          const { data: attemptRows } = await supabase
            .from("viva_attempts")
            .select("*")
            .eq("user_id", userId)
            .eq("plan_id", latestPlan.id);
          const attempts = attemptRows || [];
          if (attempts.length > 0) {
            const attemptList = attempts.slice(0, 3).map((a: any, i: number) => 
              `Viva ${i+1}: Q: ${a.question} | Student: ${a.user_answer} | Score: ${a.accuracy_score}/100`
            ).join("\n");
            academicContext += `\n[VIVA Simulator HISTORY:\n${attemptList}\n]`;
          }

          const { data: historyRows } = await supabase
            .from("readiness_scores")
            .select("*")
            .eq("user_id", userId)
            .eq("plan_id", latestPlan.id)
            .order("created_at", { ascending: true });
          const history = historyRows || [];
          if (history && history.length > 0) {
            const readiness = history[history.length - 1];
            academicContext += `\n[READINESS SCORE ANALYSIS:\nReadiness Score: ${readiness.readiness_score}%\nKnowledge Coverage: ${readiness.knowledge_coverage}%\nRevision Readiness: ${readiness.revision_readiness}%\nWeak Chapters (Urgent Gaps): ${readiness.weak_topics?.join(", ") || ""}\nStrong Chapters (Active Strengths): ${readiness.strong_topics?.join(", ") || ""}\nPredicted Range: ${readiness.predicted_marks || ""}\n]`;
          }
        }
      } catch (contextErr) {
        console.error("Failed to load academic context in chat:", contextErr);
      }
    }

    // ── FALLBACK: Raw OCR similarity search when no Knowledge Base exists ─────
    if (!knowledgeBaseContext && userId && rawUserQuery) {
      const relevantChunks = await documentService.retrieveRelevantChunks(userId, rawUserQuery, 6);
      if (relevantChunks.length > 0) {
        knowledgeBaseContext = `[DOCUMENT EXCERPTS (Legacy RAG — Upload new notes to build Knowledge Base):\n${relevantChunks.join("\n\n")}\n]`;
      }
    }

    if (userId && supabase) {
      let documentsQuery = supabase
        .from("documents")
        .select("id,user_id,subject_id,filename,file_name,extraction_text,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (sourceDocumentIds.length > 0) {
        documentsQuery = documentsQuery.in("id", sourceDocumentIds);
      }

      const { data: documentRows, error: documentsError } = await documentsQuery;
      if (documentsError) console.error("[api/chat] document retrieval failed", documentsError);
      const documents = documentRows || [];

      documentsFound = documents.length;
      totalExtractedCharacters = documents.reduce(
        (sum: number, document: any) => sum + (document.extraction_text?.length || 0),
        0
      );

      let chunksQuery = supabase
        .from("document_chunks")
        .select("document_id,user_id,content,chunk_index,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(500);

      if (sourceDocumentIds.length > 0) {
        chunksQuery = chunksQuery.in("document_id", sourceDocumentIds);
      }

      const { data: retrievedChunkRows, error: chunksError } = await chunksQuery;
      if (chunksError) console.error("[api/chat] document chunk retrieval failed", chunksError);
      const chunkRows = retrievedChunkRows || [];

      chunksFound = chunkRows.length;

      const relevantChunks = rawUserQuery ? rankChunkRows(chunkRows, rawUserQuery, 8) : [];
      if (relevantChunks.length > 0) {
        knowledgeBaseContext = [
          knowledgeBaseContext,
          `[UPLOADED DOCUMENT CHUNKS]\n${relevantChunks.join("\n\n")}`,
        ].filter(Boolean).join("\n\n");
      } else if (documents.length > 0 && totalExtractedCharacters > 0) {
        const extractedFallback = documents
          .map((document: any) => `[${document.filename || document.file_name || document.id}]\n${document.extraction_text || ""}`)
          .join("\n\n")
          .slice(0, 16000);
        knowledgeBaseContext = [
          knowledgeBaseContext,
          `[UPLOADED DOCUMENT EXTRACTION FALLBACK]\n${extractedFallback}`,
        ].filter(Boolean).join("\n\n");
        console.warn("[api/chat] zero chunks returned; using documents.extraction_text fallback", {
          cause: "document_chunks query returned zero usable rows in /api/chat retrieval",
          documentsFound,
          chunksFound,
          totalExtractedCharacters,
        });
      } else {
        console.warn("[api/chat] retrieval returned no uploaded notes", {
          cause: "No document_chunks rows and no documents.extraction_text content found for this user/source_document_ids",
          userId,
          sourceDocumentIds,
          documentsFound,
          chunksFound,
          totalExtractedCharacters,
        });
      }
    }

    // Also include any files uploaded directly in this chat message
    if (fileTexts.length > 0) {
      knowledgeBaseContext = fileTexts.join("\n\n") + (knowledgeBaseContext ? "\n\n" + knowledgeBaseContext : "");
    }

    const contextText = [canonicalContext, knowledgeBaseContext].filter(Boolean).join("\n\n") || "[No knowledge base found. Please upload your study notes first.]";
    const systemPromptContent = buildIntentPrompt(intent, rawUserQuery, contextText, academicContext);
    console.info("[api/chat] retrieval diagnostics", {
      userId,
      latestPlanId: latestPlan?.id || null,
      sourceDocumentIds,
      documentsFound,
      chunksFound,
      totalExtractedCharacters,
      promptContextLength: contextText.length,
      systemPromptLength: systemPromptContent.length,
    });

    // Keep chat history clean and sanitized
    const sanitizedMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content
    }));

    const historyContext = sanitizedMessages
      .slice(0, -1)
      .map((message: any) => `${message.role}: ${message.content}`)
      .join("\n")
      .slice(-4000);

    const responseText = await generateTextWithRetry(
      geminiJsonModel,
      [
        systemPromptContent,
        historyContext ? `\nRECENT CHAT HISTORY:\n${historyContext}` : "",
        `\nClassified Intent: ${intent}. User Query: "${rawUserQuery}". Exclusively utilize retrieved notes to generate structured JSON.`,
      ].join("\n")
    );

    return new Response(responseText, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error: unknown) {
    console.error("[api/chat] Error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat request", details: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
