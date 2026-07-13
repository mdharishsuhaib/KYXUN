/**
 * KYXUN DOCUMENT CLEANER
 *
 * Stage 2: Clean raw extracted pages.
 * - Remove repeated headers / footers (lines that appear on 40%+ of pages)
 * - Remove noise: page numbers, watermarks, excessive whitespace
 * - Deduplicate identical paragraphs across pages
 * - Normalize unicode and encoding artifacts
 */

import type { RawPage } from "./extractor";

export interface CleanedPage {
  pageNumber: number;
  text: string;
  source: string;
  wordCount: number;
}

// ── Main cleaner ───────────────────────────────────────────────────────────────

export function cleanPages(pages: RawPage[]): CleanedPage[] {
  if (pages.length === 0) return [];

  // 1. Detect repeated lines (headers/footers) across pages
  const repeatedLines = detectRepeatedLines(pages);

  // 2. Build a deduplication set for identical paragraphs
  const seenParagraphs = new Set<string>();

  const cleaned: CleanedPage[] = [];

  for (const page of pages) {
    let text = page.text;

    // 3. Remove repeated header/footer lines
    text = removeRepeatedLines(text, repeatedLines);

    // 4. Remove common noise patterns
    text = removeNoise(text);

    // 5. Normalize whitespace and encoding artifacts
    text = normalizeText(text);

    // 6. Deduplicate paragraphs seen across pages
    const paragraphs = text.split(/\n{2,}/);
    const uniqueParagraphs = paragraphs.filter(para => {
      const key = para.trim().toLowerCase();
      if (key.length < 40) return true; // keep short items (headings)
      if (seenParagraphs.has(key)) return false;
      seenParagraphs.add(key);
      return true;
    });
    text = uniqueParagraphs.join("\n\n");

    // Skip pages that became empty after cleaning
    const trimmed = text.trim();
    if (trimmed.length < 30) continue;

    const wordCount = trimmed.split(/\s+/).filter(w => w.length > 0).length;
    cleaned.push({
      pageNumber: page.pageNumber,
      text: trimmed,
      source: page.source,
      wordCount,
    });
  }

  return cleaned;
}

// ── Repeated line detection ────────────────────────────────────────────────────

/**
 * Finds lines that appear on more than 40% of pages — these are likely
 * headers, footers, page numbers, or watermarks.
 */
function detectRepeatedLines(pages: RawPage[]): Set<string> {
  const lineFrequency = new Map<string, number>();
  const totalPages = pages.length;

  for (const page of pages) {
    const lines = page.text.split("\n");
    // Only check first 3 and last 3 lines for headers/footers
    const candidateLines = [
      ...lines.slice(0, 3),
      ...lines.slice(-3),
    ];

    const seenOnThisPage = new Set<string>();
    for (const line of candidateLines) {
      const normalized = line.trim().toLowerCase();
      if (normalized.length < 3 || normalized.length > 120) continue;
      if (seenOnThisPage.has(normalized)) continue;
      seenOnThisPage.add(normalized);
      lineFrequency.set(normalized, (lineFrequency.get(normalized) || 0) + 1);
    }
  }

  // Threshold: appears on 40%+ of pages
  const threshold = Math.max(2, Math.floor(totalPages * 0.4));
  const repeated = new Set<string>();

  for (const [line, count] of lineFrequency.entries()) {
    if (count >= threshold) {
      repeated.add(line);
    }
  }

  return repeated;
}

/**
 * Remove lines from text that match the repeated set.
 */
function removeRepeatedLines(text: string, repeated: Set<string>): string {
  if (repeated.size === 0) return text;
  const lines = text.split("\n");
  const filtered = lines.filter(line => {
    const normalized = line.trim().toLowerCase();
    return !repeated.has(normalized);
  });
  return filtered.join("\n");
}

// ── Noise removal ─────────────────────────────────────────────────────────────

const NOISE_PATTERNS: RegExp[] = [
  /^\s*\d+\s*$/m,                         // Lone page numbers
  /^\s*-\s*\d+\s*-\s*$/m,                 // — 12 — style page numbers
  /^\s*page\s+\d+\s*(of\s+\d+)?\s*$/im,  // "Page 1 of 20"
  /^\s*www\.[a-z0-9.-]+\.[a-z]{2,}\s*$/im, // bare URLs on own line
  /[\uFFFD\uFFFE\uFFFF]/g,                // Replacement characters
  /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g,  // Control characters
  /(.)\1{5,}/g,                           // Repeated single chars (garbled OCR)
];

function removeNoise(text: string): string {
  let result = text;
  for (const pattern of NOISE_PATTERNS) {
    result = result.replace(pattern, "");
  }
  return result;
}

// ── Text normalization ────────────────────────────────────────────────────────

function normalizeText(text: string): string {
  return text
    // Fix common OCR ligature artifacts
    .replace(/ﬁ/g, "fi")
    .replace(/ﬂ/g, "fl")
    .replace(/ﬀ/g, "ff")
    .replace(/ﬃ/g, "ffi")
    .replace(/ﬄ/g, "ffl")
    // Normalize dashes
    .replace(/[–—]/g, "-")
    // Normalize quotes
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    // Collapse more than 3 consecutive blank lines into 2
    .replace(/\n{4,}/g, "\n\n\n")
    // Collapse tabs and multiple spaces (but not newlines)
    .replace(/[ \t]{3,}/g, " ")
    // Trim each line
    .split("\n")
    .map(l => l.trimEnd())
    .join("\n")
    .trim();
}
