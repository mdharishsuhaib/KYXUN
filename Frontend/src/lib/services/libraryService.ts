import { supabase } from "../supabase";
import { subjectService } from "./subjectService";

const DOCUMENT_BUCKET = "documents";

function formatBytes(size?: number | string | null) {
  const bytes = typeof size === "string" ? Number(size) : size;
  if (!bytes || Number.isNaN(bytes)) return undefined;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

const logSupabaseError = (context: string, payload: unknown, error: unknown) => {
  const err = error as { message?: string; details?: unknown; hint?: string; code?: string } | undefined;
  console.error(`[libraryService] ${context}`, {
    payload,
    error: err ? {
      message: err.message,
      details: err.details,
      hint: err.hint,
      code: err.code,
    } : error,
  });
};

export interface LibraryFile {
  id: string;
  user_id: string;
  subject_id?: string | null;
  file_name: string;
  original_name: string;
  file_size?: string;
  file_type?: string;
  sha256_hash: string;
  version: number;
  extraction_text?: string;
  page_count?: number;
  analyzed: boolean;
  uploaded_at: string;
  storage_path?: string;
  status?: string;
  processing_progress?: number;
  summary_available?: boolean;
  flashcards_available?: boolean;
}

export interface UploadDocumentParams {
  userId: string;
  subjectId: string | null;
  file: File;
  sha256Hash: string;
}

function toLibraryFile(row: Record<string, any>): LibraryFile {
  return {
    id: row.id,
    user_id: row.user_id,
    subject_id: row.subject_id,
    file_name: row.filename || row.file_name,
    original_name: row.filename || row.file_name,
    file_size: formatBytes(row.size || row.file_size),
    file_type: row.mime_type || row.file_type,
    sha256_hash: row.sha256 || row.sha256_hash,
    version: 1,
    extraction_text: row.extraction_text,
    analyzed: row.status === "analyzed",
    uploaded_at: row.created_at,
    storage_path: row.storage_path,
    status: row.status,
    processing_progress: row.processing_progress,
    summary_available: row.summary_available,
    flashcards_available: row.flashcards_available,
  };
}

export const libraryService = {
  async uploadFile(params: UploadDocumentParams | Record<string, any>): Promise<LibraryFile> {
    const { userId, subjectId, file, sha256Hash } = params as UploadDocumentParams;
    if (!file) {
      throw new Error("Metadata-only uploads are disabled. Provide the original file for Supabase Storage upload.");
    }
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${userId}/${crypto.randomUUID()}-${safeName}`;
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      throw new Error(`Supabase session lookup failed before upload: ${sessionError.message}`);
    }
    if (!session?.user?.id || !session.access_token) {
      throw new Error("Upload requires an authenticated Supabase session. Please sign in again.");
    }
    if (session.user.id !== userId) {
      throw new Error("Upload session mismatch. Please refresh and sign in again.");
    }

    const { error: bucketError } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .list(userId, { limit: 1 });

    if (bucketError) {
      throw new Error(`Storage bucket "${DOCUMENT_BUCKET}" is not accessible: ${bucketError.message}`);
    }

    const { error: uploadError } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .upload(storagePath, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("[libraryService] Supabase Storage upload failed", {
        currentUserId: session.user.id,
        sessionExists: Boolean(session),
        accessTokenExists: Boolean(session.access_token),
        uploadPath: storagePath,
        bucketName: DOCUMENT_BUCKET,
        storageError: uploadError,
      });
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    const payload = {
      user_id: userId,
      subject_id: subjectId,
      filename: file.name,
      file_name: file.name,
      storage_path: storagePath,
      mime_type: file.type || "application/octet-stream",
      file_type: file.type || "application/octet-stream",
      file_size: file.size,
      sha256: sha256Hash,
      sha256_hash: sha256Hash,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("documents")
      .insert(payload)
      .select()
      .single();

    if (error) {
      await supabase.storage.from(DOCUMENT_BUCKET).remove([storagePath]);
      throw new Error(`Document row insert failed: ${error.message}`);
    }

    if (subjectId) {
      await subjectService.recalculateProgress(subjectId, userId);
    }

    return toLibraryFile(data);
  },

  async replaceFile(..._args: unknown[]): Promise<LibraryFile> {
    throw new Error("Metadata-only replacement is disabled. Delete the Storage-backed document and upload again.");
  },

  async createVersion(..._args: unknown[]): Promise<LibraryFile> {
    throw new Error("Metadata-only versioning is disabled. Rename the file and upload it to Supabase Storage.");
  },

  async getFileByHash(userId: string, hash: string): Promise<LibraryFile | null> {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", userId)
      .eq("sha256", hash)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) throw new Error(`Supabase duplicate lookup failed: ${error.message}`);
    if (!data || data.length === 0) return null;
    return toLibraryFile(data[0]);
  },

  async getFiles(userId: string, subjectId?: string): Promise<LibraryFile[]> {
    let query = supabase
      .from("documents")
      .select("*")
      .eq("user_id", userId);
    if (subjectId) query = query.eq("subject_id", subjectId);
    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw new Error(`Supabase documents load failed: ${error.message}`);
    return (data || []).map(toLibraryFile);
  },

  async renameFile(fileId: string, newName: string): Promise<LibraryFile> {
    const { data, error } = await supabase
      .from("documents")
      .update({ filename: newName, file_name: newName })
      .eq("id", fileId)
      .select()
      .single();
    if (error) throw new Error(`Supabase rename failed: ${error.message}`);
    return toLibraryFile(data);
  },

  async markAnalyzed(fileId: string) {
    const { error } = await supabase
      .from("documents")
      .update({ status: "analyzed", processing_progress: 100 })
      .eq("id", fileId);
    if (error) throw new Error(`Supabase analysis status update failed: ${error.message}`);
  },

  async deleteFile(fileId: string) {
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("id,storage_path,subject_id")
      .eq("id", fileId)
      .single();
    if (docError) throw new Error(`Supabase document lookup failed before delete: ${docError.message}`);

    const { data: plans, error: plansError } = await supabase
      .from("study_plans")
      .select("id")
      .contains("source_document_ids", JSON.stringify([fileId]));
    if (plansError) throw new Error(`Supabase related plan lookup failed: ${plansError.message}`);

    const planIds = (plans || []).map((plan) => plan.id);
    if (planIds.length > 0) {
      const { error: flashcardError } = await supabase.from("flashcards").delete().in("plan_id", planIds);
      if (flashcardError) throw new Error(`Supabase flashcard cleanup failed: ${flashcardError.message}`);

      const { error: readinessError } = await supabase.from("readiness_scores").delete().in("plan_id", planIds);
      if (readinessError) throw new Error(`Supabase readiness cleanup failed: ${readinessError.message}`);

      const { error: resourceError } = await supabase.from("generated_resources").delete().in("plan_id", planIds);
      if (resourceError) throw new Error(`Supabase generated resource cleanup failed: ${resourceError.message}`);

      const { error: planError } = await supabase.from("study_plans").delete().in("id", planIds);
      if (planError) throw new Error(`Supabase study plan cleanup failed: ${planError.message}`);
    }

    const { error: chunkError } = await supabase.from("document_chunks").delete().eq("document_id", fileId);
    if (chunkError) throw new Error(`Supabase chunk cleanup failed: ${chunkError.message}`);

    if (doc?.storage_path) {
      const { error: storageError } = await supabase.storage.from("documents").remove([doc.storage_path]);
      if (storageError) throw new Error(`Storage object delete failed: ${storageError.message}`);
    }

    const { error } = await supabase.from("documents").delete().eq("id", fileId);
    if (error) throw new Error(`Supabase document delete failed: ${error.message}`);
    
    if (doc?.subject_id) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await subjectService.recalculateProgress(doc.subject_id, user.id);
    }
  },

  async getTotalFilesCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    if (error) {
      logSupabaseError("getTotalFilesCount failed", { userId }, error);
      return 0;
    }
    return count || 0;
  },
};
