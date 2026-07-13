/**
 * KYXUN CONTEXT BUILDER
 *
 * Stage 5: Assemble the ranked chunks into a structured context string
 * that will be injected into the Gemini prompt.
 *
 * The context is formatted so the AI can:
 * - Know exactly which page/section each piece of content came from
 * - Understand the heading hierarchy
 * - Quote back source references accurately
 */

import type { RankedChunk } from "./ranker";

export interface BuildContextOptions {
  maxContextTokens?: number; // hard cap (default 24000 tokens ≈ 96000 chars)
  includeMetadata?: boolean; // include chunk scores in context (for debugging)
}

export interface DocumentContext {
  contextText: string;        // the formatted string for the prompt
  totalTokensUsed: number;
  chunksUsed: number;
  chunksAvailable: number;
  sourceFiles: string[];
  pageRange: string;          // e.g. "pages 1-42"
  coveragePercent: number;    // % of total document tokens included
  totalDocumentTokens: number;
}

// ── Main context builder ───────────────────────────────────────────────────────

export function buildContext(
  selectedChunks: RankedChunk[],
  allChunks: RankedChunk[],
  options: BuildContextOptions = {}
): DocumentContext {
  const { maxContextTokens = 24000, includeMetadata = false } = options;

  if (selectedChunks.length === 0) {
    return {
      contextText: "[NO DOCUMENT CONTENT AVAILABLE]",
      totalTokensUsed: 0,
      chunksUsed: 0,
      chunksAvailable: allChunks.length,
      sourceFiles: [],
      pageRange: "N/A",
      coveragePercent: 0,
      totalDocumentTokens: 0,
    };
  }

  const sourceFiles = [...new Set(selectedChunks.map(c => c.source))];
  const minPage = Math.min(...selectedChunks.map(c => c.pageStart));
  const maxPage = Math.max(...selectedChunks.map(c => c.pageEnd));
  const totalDocumentTokens = allChunks.reduce((s, c) => s + c.tokenEstimate, 0);
  const selectedTokens = selectedChunks.reduce((s, c) => s + c.tokenEstimate, 0);
  const coveragePercent = totalDocumentTokens > 0
    ? Math.round((selectedTokens / totalDocumentTokens) * 100)
    : 100;

  // Build the formatted context
  const lines: string[] = [
    "═══════════════════════════════════════════════════════════════",
    "DOCUMENT CONTEXT — EXTRACTED FROM UPLOADED MATERIAL",
    `Source(s): ${sourceFiles.join(", ")}`,
    `Pages included: ${minPage}–${maxPage} | Chunks: ${selectedChunks.length}/${allChunks.length} | Coverage: ${coveragePercent}%`,
    "═══════════════════════════════════════════════════════════════",
    "",
  ];

  let tokensUsed = 0;
  const CHARS_PER_TOKEN = 4;

  for (const chunk of selectedChunks) {
    const header = buildChunkHeader(chunk, includeMetadata);
    const entry = header + "\n" + chunk.text;
    const entryTokens = Math.round(entry.length / CHARS_PER_TOKEN);

    if (tokensUsed + entryTokens > maxContextTokens) break;

    lines.push(entry);
    lines.push(""); // blank separator
    tokensUsed += entryTokens;
  }

  lines.push("═══════════════════════════════════════════════════════════════");
  lines.push("END OF DOCUMENT CONTEXT");
  lines.push("═══════════════════════════════════════════════════════════════");

  return {
    contextText: lines.join("\n"),
    totalTokensUsed: tokensUsed,
    chunksUsed: selectedChunks.length,
    chunksAvailable: allChunks.length,
    sourceFiles,
    pageRange: `pages ${minPage}-${maxPage}`,
    coveragePercent,
    totalDocumentTokens,
  };
}

function buildChunkHeader(chunk: RankedChunk, includeMetadata: boolean): string {
  const pageRef = chunk.pageStart === chunk.pageEnd
    ? `Page ${chunk.pageStart}`
    : `Pages ${chunk.pageStart}-${chunk.pageEnd}`;

  const parts = [
    `[CHUNK ${chunk.chunkIndex + 1}/${chunk.totalChunks}]`,
    `[${pageRef}]`,
    `[${chunk.source}]`,
  ];

  if (chunk.headingContext) {
    parts.push(`[Section: ${chunk.headingContext}]`);
  }

  if (includeMetadata) {
    parts.push(`[Score: ${chunk.score}]`);
  }

  return "─── " + parts.join(" ") + " ───";
}

// ── Prompt template builder ───────────────────────────────────────────────────

export function buildAnalysisPrompt(
  context: DocumentContext,
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
  const totalHours = parseInt(days) * parseInt(hours);
  const remaining = Math.max(0, parseInt(totalChapters) - parseInt(completedChapters));
  const seed = Date.now(); // Uniqueness seed for varied outputs

  const hasContent = context.chunksUsed > 0;

  return `You are an elite IIT Professor AI. You ONLY answer from the uploaded document below.

════════════════ ABSOLUTE RULES ════════════════
RULE 1: Every single output item MUST be directly derived from the DOCUMENT CONTEXT below.
RULE 2: If information does not exist in the document, output exactly: "Not found in uploaded material."
RULE 3: NEVER invent formulas. NEVER invent definitions. NEVER use general knowledge.
RULE 4: NEVER mention generic study advice (active recall, Pomodoro, spaced repetition) unless those words appear in the uploaded document.
RULE 5: Every question, flashcard, definition, and formula MUST reference specific content from the document.
RULE 6: The uniqueness seed is ${seed}. Use this to ensure completely different outputs for repeated uploads.
═══════════════════════════════════════════════

STUDENT CONTEXT:
- Subject: "${subject}"
- Exam in: ${days} day(s) | Available: ${hours} h/day → ${totalHours} total hours
- Chapters: ${totalChapters} total, ${completedChapters} completed, ${remaining} remaining
- Goal: ${goal}

${hasContent ? context.contextText : "[WARNING: No document uploaded. All outputs must say 'Not found in uploaded material.']"}

════════════════ YOUR TASK ════════════════
Produce a complete AI Study OS output in strict JSON format.
ALL fields below MUST be populated from the document above.
If a field's content doesn't appear in the document, use: "Not found in uploaded material."

Generate EXACTLY the following in the JSON:

1. Executive summary of the document (documentSummary.summary)
2. Chapter-by-chapter summaries (documentSummary.chapterSummaries) — one per detected module/chapter
3. Key concepts from the document (documentSummary.keyConcepts) — minimum 5
4. All definitions found in the document (documentSummary.definitions) — verbatim or closely paraphrased
5. All formulas/equations in the document (documentSummary.formulas) — exact as written
6. All important tables (documentSummary.importantTables) — formatted as plain text grids
7. All important diagrams described in text (documentSummary.importantDiagrams)
8. Exam weightage per topic (documentSummary.examWeightage) — based only on document content
9. High-frequency topics (documentSummary.frequentlyRepeatedTopics)
10. Short revision notes (documentSummary.shortNotes) — 3-5 bullet points per chapter
11. Mind map of the document (documentSummary.mindMap) — ASCII tree structure
12. Timeline of events/concepts if applicable (documentSummary.timeline)
13. Exactly 10 practice questions from the document (practiceQuestions) — types: MCQ, True/False, One Mark, Two Marks, Five Marks, Ten Marks, Viva, Application, Numerical, Case Study
14. Exactly 8 flashcards from document content (flashcards)
15. Exactly 5 viva questions from document content (vivaQuestions)
16. Study schedule based on document chapters (schedule)
17. Must-study topics from document (mustStudy — exactly 5)
18. Skip topics from document (shouldSkip — exactly 2)
19. PYQ analysis based on document content (pyqAnalysis)
20. Full knowledge base from document (knowledgeBase)

Return ONLY valid JSON. No markdown. No commentary. No explanation text.

JSON FORMAT:
{
  "introMessage": "<greeting acknowledging the specific subject from document>",
  "passProbability": <0-100>,
  "riskLevel": "<High Risk|Medium Risk|Low Risk|Critical>",
  "riskLabel": "<label>",
  "harshTruths": ["<truth from document content 1>", "<truth 2>", "<truth 3>"],
  "mustStudy": ["<topic from doc 1>", "<topic 2>", "<topic 3>", "<topic 4>", "<topic 5>"],
  "shouldSkip": ["<low-yield topic from doc 1>", "<topic 2>"],
  "schedule": [{"day": 1, "time": "08:00 AM", "title": "<chapter/topic from document>", "type": "urgent"}],
  "studyHours": ${hours},
  "sleepHours": 6,
  "tacticalTip": "<tip derived from document content>",
  "pyqAnalysis": {
    "frequentlyAskedTopics": [{"topic": "<from doc>", "frequency": <n>, "examWeightage": "<pct>", "studyPriority": "<Critical|High Yield|Medium Yield|Skip>", "patternDetails": "<how it appears>"}],
    "questionPatterns": ["<pattern 1>", "<pattern 2>"],
    "predictedHighValueChapters": [{"chapterName": "<from doc>", "predictedWeightage": "<pct>", "reason": "<reason>"}]
  },
  "documentSummary": {
    "summary": "<executive summary from document>",
    "chapterSummaries": [{"chapter": "<chapter title from doc>", "summary": "<2-3 sentences from doc content>", "keyPoints": ["<point 1>", "<point 2>"]}],
    "keyConcepts": ["<concept from doc 1>", "<concept 2>"],
    "definitions": ["<definition exactly from doc 1>", "<def 2>"],
    "formulas": ["<formula exactly from doc 1>", "<formula 2>"],
    "shortNotes": ["<note from doc 1>", "<note 2>"],
    "examTips": ["<tip from doc 1>", "<tip 2>"],
    "mnemonics": ["<mnemonic for doc content 1>", "<mnemonic 2>"],
    "mindMap": "<ASCII tree of doc topics>",
    "timeline": ["<event/concept with date or sequence from doc>"],
    "frequentlyRepeatedTopics": ["<topic from doc 1>", "<topic 2>"],
    "importantTables": ["<table from doc in plain text grid>"],
    "importantDiagrams": ["<diagram description from doc>"],
    "examWeightage": [{"topic": "<from doc>", "weightage": "<pct>", "marks": <n>}],
    "revisionNotes": {"<chapter from doc>": ["<bullet 1>", "<bullet 2>", "<bullet 3>"]}
  },
  "practiceQuestions": [
    {"type": "<MCQ|True/False|One Mark|Two Marks|Five Marks|Ten Marks|Viva Question|Application|Numerical|Case Study>", "question": "<from document>", "options": ["<A>","<B>","<C>","<D>"], "answer": "<answer>", "explanation": "<from document>", "difficulty": "<Easy|Medium|Hard>", "bloomsLevel": "<Remembering|Understanding|Applying|Analyzing|Evaluating|Creating>", "topic": "<from document>", "marks": <n>}
  ],
  "flashcards": [
    {"front": "<question from document>", "back": "<answer from document>", "tag": "<Must Study|Skip|Technique>"}
  ],
  "vivaQuestions": [
    {"question": "<from document>", "modelAnswer": "<from document>", "difficulty": "<Warm-up|Core|Pressure>"}
  ],
  "knowledgeBase": {
    "courseName": "<course name from document>",
    "subject": "<subject from document>",
    "difficultyScore": <0-100>,
    "examProbability": <0-100>,
    "modules": [
      {
        "title": "<module/chapter title exactly from document>",
        "summary": "<2-3 sentence summary from document text>",
        "importantTopics": ["<topic 1 from doc>"],
        "definitions": ["<definition from doc>"],
        "keywords": ["<keyword from doc>"],
        "examples": ["<example from doc>"],
        "algorithms": ["<algorithm step from doc>"],
        "formulae": ["<formula from doc>"],
        "derivations": ["<derivation from doc>"],
        "diagrams": ["<diagram description from doc>"],
        "flowcharts": ["<flowchart from doc>"],
        "tables": ["<table from doc>"],
        "mnemonics": ["<mnemonic>"],
        "commonExamQuestions": ["<question from doc>"],
        "frequentMistakes": ["<mistake related to doc content>"],
        "relatedConcepts": ["<concept from doc>"]
      }
    ],
    "glossary": [{"term": "<term from doc>", "definition": "<definition from doc>"}],
    "conceptGraph": [{"node": "<concept from doc>", "description": "<1-line from doc>", "relationships": ["<related concept from doc>"], "module": "<module title>", "page": "<page ref>"}]
  }
}`;
}
