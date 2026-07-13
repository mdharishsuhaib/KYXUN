/**
 * KYXUN RAG PIPELINE ORCHESTRATOR
 *
 * Runs the complete 5-stage pipeline:
 *   File(s) → Extract → Clean → Chunk → Rank → Build Context
 *
 * Usage:
 *   const result = await runPipeline([file1, file2]);
 *   const prompt = buildAnalysisPrompt(result.context, params);
 */

import { extractFile, type ExtractionResult } from "./extractor";
import { cleanPages } from "./cleaner";
import { chunkPages, type Chunk } from "./chunker";
import { rankChunks, selectTopChunks, type RankedChunk } from "./ranker";
import { buildContext, type DocumentContext, type BuildContextOptions } from "./contextBuilder";

export interface PipelineResult {
  context: DocumentContext;
  allChunks: RankedChunk[];
  selectedChunks: RankedChunk[];
  extractions: ExtractionResult[];
  stats: PipelineStats;
}

export interface PipelineStats {
  filesProcessed: number;
  filesFailedExtraction: number;
  rawPages: number;
  cleanedPages: number;
  totalChunks: number;
  selectedChunks: number;
  totalTokens: number;
  contextTokens: number;
  coveragePercent: number;
  processingMs: number;
}

export interface PipelineOptions {
  maxContextTokens?: number;   // default: 24000 tokens (~96k chars)
  topChunkTokenBudget?: number; // same as maxContextTokens by default
}

// ── Main pipeline ─────────────────────────────────────────────────────────────

export async function runPipeline(
  files: File[],
  options: PipelineOptions = {}
): Promise<PipelineResult> {
  const startMs = Date.now();
  const { maxContextTokens = 24000 } = options;

  // ── Stage 1: Extract ────────────────────────────────────────────────────────
  const extractions: ExtractionResult[] = [];
  let filesFailedExtraction = 0;

  for (const file of files) {
    const result = await extractFile(file);
    if (result && result.pages.length > 0) {
      extractions.push(result);
    } else {
      filesFailedExtraction++;
      console.warn(`[pipeline] Failed to extract: ${file.name}`);
    }
  }

  // Collect all raw pages
  const allRawPages = extractions.flatMap(e => e.pages);

  // ── Stage 2: Clean ──────────────────────────────────────────────────────────
  const cleanedPages = cleanPages(allRawPages);

  // ── Stage 3: Chunk ──────────────────────────────────────────────────────────
  const chunks: Chunk[] = chunkPages(cleanedPages);

  // ── Stage 4: Rank ───────────────────────────────────────────────────────────
  const rankedChunks: RankedChunk[] = rankChunks(chunks);

  // ── Stage 5: Select top chunks within token budget ──────────────────────────
  const selectedChunks = selectTopChunks(rankedChunks, maxContextTokens);

  // ── Stage 6: Build context ──────────────────────────────────────────────────
  const contextOptions: BuildContextOptions = {
    maxContextTokens,
    includeMetadata: false,
  };
  const context = buildContext(selectedChunks, rankedChunks, contextOptions);

  const processingMs = Date.now() - startMs;

  const stats: PipelineStats = {
    filesProcessed: extractions.length,
    filesFailedExtraction,
    rawPages: allRawPages.length,
    cleanedPages: cleanedPages.length,
    totalChunks: rankedChunks.length,
    selectedChunks: selectedChunks.length,
    totalTokens: context.totalDocumentTokens,
    contextTokens: context.totalTokensUsed,
    coveragePercent: context.coveragePercent,
    processingMs,
  };

  console.log(`[pipeline] Processed ${stats.filesProcessed} files | `
    + `${stats.rawPages} raw pages → ${stats.cleanedPages} cleaned → `
    + `${stats.totalChunks} chunks → ${stats.selectedChunks} selected | `
    + `${stats.contextTokens} tokens | ${stats.processingMs}ms`);

  return {
    context,
    allChunks: rankedChunks,
    selectedChunks,
    extractions,
    stats,
  };
}

// ── Re-export types for convenience ───────────────────────────────────────────
export type { DocumentContext, RankedChunk };
export { buildAnalysisPrompt } from "./contextBuilder";
