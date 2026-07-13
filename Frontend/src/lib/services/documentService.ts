import { supabase } from "../supabase";

export interface DocumentMetadata {
  id?: string;
  file_name: string;
  file_size?: number;
  file_type?: string;
  extraction_text: string;
}

export const documentService = {
  /**
   * Save a document and its semantic chunks to the database.
   * Chunks are 800-1200 token segments for precise RAG retrieval.
   */
  async uploadDocument(userId: string, doc: DocumentMetadata) {
    const { data: document, error: docError } = await supabase
      .from("documents")
      .insert({
        user_id: userId,
        file_name: doc.file_name,
        file_size: doc.file_size,
        file_type: doc.file_type,
        extraction_text: doc.extraction_text,
      })
      .select()
      .single();

    if (docError) throw docError;
    if (!document) throw new Error("Failed to insert document");

    // Use semantic chunk sizes (900 chars avg per chunk ≈ 225 tokens)
    // The actual pipeline uses 3600 chars ≈ 900 tokens, but DB chunks are smaller
    // for more granular retrieval.
    const chunks = chunkTextSemantic(doc.extraction_text, 3600, 540);

    if (chunks.length > 0) {
      const chunkInserts = chunks.map((content, i) => ({
        document_id: document.id,
        user_id: userId,
        content,
        chunk_index: i,
      }));
      const { error: chunkError } = await supabase
        .from("document_chunks")
        .insert(chunkInserts);
      if (chunkError) console.error("[documentService] Chunk insert error:", chunkError);
    }

    return document;
  },

  /**
   * Retrieve the most relevant chunks for a given query.
   * Uses TF-IDF-style keyword scoring for ranking without a vector DB.
   */
  async retrieveRelevantChunks(userId: string, query: string, limit = 8): Promise<string[]> {
    const { data: chunks, error } = await supabase
      .from("document_chunks")
      .select("content")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(500); // Pull recent 500 chunks for scoring

    if (error || !chunks) return [];
    if (chunks.length === 0) return [];

    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) {
      return chunks.slice(0, limit).map(c => c.content);
    }

    // Score each chunk by TF-IDF-inspired relevance
    const scored = chunks.map(chunk => {
      const contentTokens = tokenize(chunk.content);
      const contentSet = new Set(contentTokens);
      const contentLower = chunk.content.toLowerCase();

      let score = 0;

      // Exact token matches (weighted by rarity proxy: shorter = more common = lower weight)
      for (const qt of queryTokens) {
        if (contentSet.has(qt)) {
          const freq = contentTokens.filter(t => t === qt).length;
          const idfProxy = qt.length > 5 ? 2 : 1; // longer words are more specific
          score += freq * idfProxy;
        }
      }

      // Phrase match bonus (exact substring match of multi-word query)
      const queryPhrase = queryTokens.join(" ");
      if (contentLower.includes(queryPhrase)) score += 10;

      // Structural bonus: chunks with definitions/formulas are more valuable
      if (/is\s+defined\s+as|refers?\s+to|is\s+called/i.test(chunk.content)) score += 3;
      if (/formula|equation|=|∑|∫/i.test(chunk.content)) score += 2;

      return { content: chunk.content, score };
    });

    const filtered = scored.filter(s => s.score > 0);

    if (filtered.length === 0) {
      // No keyword matches — return most recent chunks as fallback
      return chunks.slice(0, limit).map(c => c.content);
    }

    return filtered
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.content);
  },

  /**
   * Delete all documents and chunks for a user (for re-upload scenarios).
   */
  async deleteUserDocuments(userId: string): Promise<void> {
    await supabase.from("document_chunks").delete().eq("user_id", userId);
    await supabase.from("documents").delete().eq("user_id", userId);
  },

  /**
   * Get all document metadata for a user (without text content for listing).
   */
  async listDocuments(userId: string) {
    const { data, error } = await supabase
      .from("documents")
      .select("id, file_name, file_size, file_type, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Tokenize text into lowercase words for relevance scoring */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(t => t.length > 2); // skip very short stop words
}

/**
 * Split text into semantic chunks at paragraph boundaries,
 * targeting a given size with overlap.
 */
function chunkTextSemantic(text: string, targetSize = 3600, overlap = 540): string[] {
  if (!text || text.trim().length === 0) return [];

  const paragraphs = text.split(/\n{2,}/);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    const candidate = current ? current + "\n\n" + trimmed : trimmed;

    if (candidate.length > targetSize && current.length > 0) {
      chunks.push(current.trim());
      // Start next chunk with overlap from end of previous
      const overlapText = current.slice(-overlap);
      current = overlapText ? overlapText + "\n\n" + trimmed : trimmed;
    } else {
      current = candidate;
    }
  }

  if (current.trim().length > 0) {
    chunks.push(current.trim());
  }

  return chunks;
}
