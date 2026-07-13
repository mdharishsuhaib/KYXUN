/**
 * KYXUN CHUNK RANKER
 *
 * Stage 4: Score and rank chunks by academic importance.
 *
 * Scoring signals (each 0-1, weighted):
 *  - Position score:    Earlier chunks score higher (introductions, chapter openers)
 *  - Heading bonus:     Chunks that start with a detected heading
 *  - Keyword density:   Density of high-value academic keywords
 *  - Formula presence:  Contains equations, formulas, mathematical notation
 *  - Definition presence: Contains "defined as", "is called", "refers to" etc.
 *  - Table presence:    Contains table-like structures
 *  - Length score:      Prefer chunks close to target length (not too short)
 *  - Structural signals: Numbered lists, bullet points (exam-relevant structure)
 */

import type { Chunk } from "./chunker";

export interface RankedChunk extends Chunk {
  score: number;
  signals: {
    position: number;
    heading: number;
    keywords: number;
    formula: number;
    definition: number;
    table: number;
    length: number;
    structure: number;
  };
}

// ── Weights ────────────────────────────────────────────────────────────────────

const WEIGHTS = {
  position:   0.12,
  heading:    0.15,
  keywords:   0.25,
  formula:    0.15,
  definition: 0.13,
  table:      0.10,
  length:     0.05,
  structure:  0.05,
};

// ── Academic keyword list ──────────────────────────────────────────────────────

const HIGH_VALUE_KEYWORDS = new Set([
  // Structural
  "definition", "define", "defined", "theorem", "lemma", "corollary", "proof",
  "formula", "equation", "algorithm", "method", "procedure", "principle",
  "concept", "theory", "law", "rule", "property", "characteristic",
  // Importance signals
  "important", "critical", "key", "fundamental", "essential", "primary",
  "significant", "major", "core", "basic", "advanced",
  // Exam signals
  "exam", "question", "marks", "unit", "chapter", "module", "section",
  "objective", "outcome", "topic", "syllabus",
  // Academic content signals
  "example", "application", "case study", "problem", "solution", "analysis",
  "compare", "difference", "advantage", "disadvantage", "limitation",
  "classification", "type", "category", "diagram", "figure", "table",
  "steps", "process", "flow", "cycle", "model", "framework",
]);

// ── Formula detection ─────────────────────────────────────────────────────────

const FORMULA_PATTERNS = [
  /[A-Za-z]\s*=\s*[A-Za-z0-9(][^.]{2,40}/,    // x = expression
  /\b\d+\s*[+\-*/÷×]\s*\d+/,                   // arithmetic
  /∑|∫|∂|√|∞|∝|≤|≥|≠|±|∈|∉|⊂|⊃/,            // math symbols
  /\b(?:sin|cos|tan|log|ln|exp|lim|max|min)\b/i, // math functions
  /\(\s*[A-Za-z0-9]+\s*[+\-*/]\s*[A-Za-z0-9]+\s*\)/, // (a + b)
];

function hasFormula(text: string): boolean {
  return FORMULA_PATTERNS.some(p => p.test(text));
}

// ── Definition detection ──────────────────────────────────────────────────────

const DEFINITION_PATTERNS = [
  /is\s+defined\s+as/i,
  /refers?\s+to/i,
  /is\s+called/i,
  /is\s+known\s+as/i,
  /can\s+be\s+defined/i,
  /means?:/i,
  /definition:/i,
  /:\s+[A-Z][a-z]/, // "Term: Definition" style
];

function hasDefinition(text: string): boolean {
  return DEFINITION_PATTERNS.some(p => p.test(text));
}

// ── Table detection ───────────────────────────────────────────────────────────

function hasTable(text: string): boolean {
  // Look for pipe-separated or tab-separated structures
  const lines = text.split("\n");
  let tableLines = 0;
  for (const line of lines) {
    if (
      (line.includes("|") && line.split("|").length >= 3) ||
      (line.split("\t").length >= 3) ||
      /^\s*[-+]{3,}/.test(line) // separator lines
    ) {
      tableLines++;
    }
  }
  return tableLines >= 2;
}

// ── Structural signals ────────────────────────────────────────────────────────

function hasStructure(text: string): boolean {
  const lines = text.split("\n");
  let structuredLines = 0;
  for (const line of lines) {
    if (
      /^\s*[\d]+[.)]\s/.test(line) ||    // numbered list: "1. " or "1)"
      /^\s*[a-z][.)]\s/i.test(line) ||   // lettered list: "a. " or "a)"
      /^\s*[-•*►▪]\s/.test(line) ||      // bullet points
      /^\s*Step\s+\d+/i.test(line)       // Step 1:
    ) {
      structuredLines++;
    }
  }
  return structuredLines >= 2;
}

// ── Keyword density ───────────────────────────────────────────────────────────

function keywordDensity(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  if (words.length === 0) return 0;
  let hits = 0;
  for (const word of words) {
    const clean = word.replace(/[^a-z]/g, "");
    if (HIGH_VALUE_KEYWORDS.has(clean)) hits++;
  }
  // Cap at 0.08 density (8% keyword rate) → map to 0-1
  return Math.min(1, hits / Math.max(1, words.length) / 0.08);
}

// ── Main ranker ───────────────────────────────────────────────────────────────

export function rankChunks(chunks: Chunk[]): RankedChunk[] {
  const total = chunks.length;
  if (total === 0) return [];

  // Target length for length scoring
  const TARGET_LEN = 3600; // ~900 tokens

  const ranked: RankedChunk[] = chunks.map((chunk, i) => {
    const position = 1 - (i / Math.max(1, total - 1)) * 0.6; // front-loaded
    const heading  = chunk.isHeading ? 1 : 0;
    const keywords = keywordDensity(chunk.text);
    const formula  = hasFormula(chunk.text) ? 1 : 0;
    const definition = hasDefinition(chunk.text) ? 1 : 0;
    const table    = hasTable(chunk.text) ? 1 : 0;
    const length   = chunk.text.length >= TARGET_LEN * 0.5 && chunk.text.length <= TARGET_LEN * 1.3 ? 1 : 0.4;
    const structure = hasStructure(chunk.text) ? 1 : 0;

    const score =
      position   * WEIGHTS.position   +
      heading    * WEIGHTS.heading    +
      keywords   * WEIGHTS.keywords   +
      formula    * WEIGHTS.formula    +
      definition * WEIGHTS.definition +
      table      * WEIGHTS.table      +
      length     * WEIGHTS.length     +
      structure  * WEIGHTS.structure;

    return {
      ...chunk,
      score: Math.round(score * 1000) / 1000,
      signals: { position, heading, keywords, formula, definition, table, length, structure },
    };
  });

  // Sort by score descending
  return ranked.sort((a, b) => b.score - a.score);
}

/**
 * Select the top-K chunks while preserving document order for context coherence.
 * The returned array is sorted by chunkIndex (document order), not score.
 */
export function selectTopChunks(rankedChunks: RankedChunk[], maxTokens: number): RankedChunk[] {
  let tokenBudget = maxTokens;
  const selected: RankedChunk[] = [];

  for (const chunk of rankedChunks) {
    if (tokenBudget <= 0) break;
    if (chunk.tokenEstimate <= tokenBudget) {
      selected.push(chunk);
      tokenBudget -= chunk.tokenEstimate;
    }
  }

  // Re-sort by document order for coherent reading
  return selected.sort((a, b) => a.chunkIndex - b.chunkIndex);
}
