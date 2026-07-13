/**
 * KYXUN SEMANTIC CHUNKER
 *
 * Stage 3: Split cleaned pages into semantic chunks of 800–1200 tokens.
 * 
 * Strategy:
 * - Prefer splitting at heading boundaries (lines that look like chapter/section titles)
 * - Fall back to paragraph boundaries
 * - Fall back to sentence boundaries
 * - Target 900 tokens per chunk (≈ 3600 chars), max 1200 (≈ 4800 chars)
 * - 15% overlap between adjacent chunks for context continuity
 */

import type { CleanedPage } from "./cleaner";

export interface Chunk {
  id: string;
  text: string;
  tokenEstimate: number;
  pageStart: number;
  pageEnd: number;
  source: string;
  headingContext: string;   // nearest heading above this chunk
  chunkIndex: number;
  totalChunks: number;      // filled in after all chunks known
  isHeading: boolean;       // true if chunk starts with a heading
}

// Token approximation: 1 token ≈ 4 characters (conservative for academic text)
const CHARS_PER_TOKEN = 4;
const TARGET_TOKENS = 900;
const MAX_TOKENS = 1200;
const MIN_TOKENS = 100;
const OVERLAP_TOKENS = 135;  // ~15% of target

const TARGET_CHARS = TARGET_TOKENS * CHARS_PER_TOKEN;
const MAX_CHARS = MAX_TOKENS * CHARS_PER_TOKEN;
const MIN_CHARS = MIN_TOKENS * CHARS_PER_TOKEN;
const OVERLAP_CHARS = OVERLAP_TOKENS * CHARS_PER_TOKEN;

// Heading detection heuristics
const HEADING_PATTERNS = [
  /^(chapter|unit|module|section|part)\s+[\d\.]+/i,
  /^[\d]+\.\s+[A-Z][A-Za-z\s]{3,60}$/,
  /^[\d]+\.\d+\s+[A-Z][A-Za-z\s]{3,60}$/,
  /^[A-Z][A-Z\s]{4,60}$/,   // ALL CAPS line (common in textbooks)
  /^(introduction|conclusion|summary|overview|objectives|references|bibliography)/i,
];

function isHeadingLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 3 || trimmed.length > 80) return false;
  return HEADING_PATTERNS.some(p => p.test(trimmed));
}

// ── Main chunker ──────────────────────────────────────────────────────────────

export function chunkPages(pages: CleanedPage[]): Chunk[] {
  if (pages.length === 0) return [];

  // Step 1: Merge all pages into a sequence of segments tagged with page numbers
  const segments: Array<{ text: string; page: number; source: string }> = [];
  for (const page of pages) {
    const paragraphs = page.text.split(/\n{2,}/);
    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (trimmed.length > 0) {
        segments.push({ text: trimmed, page: page.pageNumber, source: page.source });
      }
    }
  }

  // Step 2: Build chunks by accumulating segments until we hit the target size
  const rawChunks: Omit<Chunk, "totalChunks">[] = [];
  let currentText = "";
  let currentPageStart = segments[0]?.page ?? 1;
  let currentPageEnd = currentPageStart;
  let currentSource = segments[0]?.source ?? "";
  let lastHeading = "";
  let chunkIndex = 0;
  let overlapBuffer = ""; // text to prepend to next chunk for overlap

  function flushChunk(forceText?: string) {
    const text = (forceText ?? currentText).trim();
    if (text.length < MIN_CHARS) return;
    rawChunks.push({
      id: `chunk-${chunkIndex}`,
      text,
      tokenEstimate: Math.round(text.length / CHARS_PER_TOKEN),
      pageStart: currentPageStart,
      pageEnd: currentPageEnd,
      source: currentSource,
      headingContext: lastHeading,
      chunkIndex: chunkIndex++,
      isHeading: isHeadingLine(text.split("\n")[0]),
    });
    // Build overlap: take the last OVERLAP_CHARS from current text
    overlapBuffer = text.slice(-OVERLAP_CHARS);
  }

  for (const seg of segments) {
    const isHeading = isHeadingLine(seg.text);

    // Update last known heading
    if (isHeading) lastHeading = seg.text.slice(0, 80);

    const wouldBe = currentText ? currentText + "\n\n" + seg.text : seg.text;

    if (wouldBe.length > MAX_CHARS && currentText.length > MIN_CHARS) {
      // Flush current chunk
      flushChunk();
      // Start new chunk with overlap + current segment
      currentText = overlapBuffer ? overlapBuffer + "\n\n" + seg.text : seg.text;
      currentPageStart = seg.page;
      currentPageEnd = seg.page;
      currentSource = seg.source;
    } else {
      // Flush at heading boundaries if we've already accumulated enough
      if (isHeading && currentText.length > TARGET_CHARS) {
        flushChunk();
        currentText = overlapBuffer ? overlapBuffer + "\n\n" + seg.text : seg.text;
        currentPageStart = seg.page;
        currentPageEnd = seg.page;
        currentSource = seg.source;
      } else {
        currentText = wouldBe;
        currentPageEnd = seg.page;
      }
    }
  }

  // Flush remaining text
  if (currentText.trim().length >= MIN_CHARS) {
    flushChunk();
  }

  // Step 3: Fill in totalChunks
  const total = rawChunks.length;
  const chunks: Chunk[] = rawChunks.map(c => ({ ...c, totalChunks: total }));

  return chunks;
}

// ── Export token estimator for use in ranker/context builder ─────────────────
export function estimateTokens(text: string): number {
  return Math.round(text.length / CHARS_PER_TOKEN);
}
