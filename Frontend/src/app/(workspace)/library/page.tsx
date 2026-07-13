"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen, Upload, Search, Trash2, Edit3,
  X, Check, AlertTriangle, BrainCircuit,
  Grid3X3, List
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { libraryService, type LibraryFile } from "@/lib/services/libraryService";
import { subjectService, type Subject } from "@/lib/services/subjectService";
import { computeSHA256 } from "@/lib/fileHash";

type DuplicateAction = "replace" | "keep-both" | "new-version" | "open-existing";

interface DuplicateState {
  existing: LibraryFile;
  newFile: File;
  newHash: string;
  newExtraction: string;
}

function timeAgo(dateStr: string) {
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  return `${d} days ago`;
}

function fileIcon(type: string | undefined) {
  if (!type) return "📄";
  if (type.includes("pdf")) return "📕";
  if (type.includes("word") || type.includes("doc")) return "📘";
  if (type.includes("image")) return "🖼️";
  if (type.includes("text")) return "📄";
  if (type.includes("presentation") || type.includes("ppt")) return "📊";
  return "📁";
}

function LibraryPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [files, setFiles] = useState<LibraryFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");

  const [duplicateState, setDuplicateState] = useState<DuplicateState | null>(null);

  // Selected subject for upload (from query param)
  const preselectedSubject = searchParams.get("subject") || "";

  useEffect(() => {
    let alive = true;
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      if (!alive) return;
      setUserId(user.id);

      const [subs, libFiles] = await Promise.allSettled([
        subjectService.getSubjects(user.id),
        libraryService.getFiles(user.id),
      ]);

      if (!alive) return;
      if (subs.status === "fulfilled") setSubjects(subs.value);
      if (libFiles.status === "fulfilled") setFiles(libFiles.value);
      setLoading(false);
    };
    init();
    return () => { alive = false; };
  }, [router]);

  // Auto-open upload on ?upload=1
  useEffect(() => {
    if (searchParams.get("upload") === "1" && !loading) {
      fileInputRef.current?.click();
    }
  }, [searchParams, loading]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length || !userId) return;
    e.target.value = "";

    for (const file of selectedFiles) {
      await processStoredFile(file);
    }
  };

  const processStoredFile = async (file: File) => {
    if (!userId) return;
    setUploading(true);

    try {
      setUploadProgress(`Computing hash for ${file.name}...`);
      const hash = await computeSHA256(file);
      const existing = await libraryService.getFileByHash(userId, hash);
      if (existing) {
        setDuplicateState({ existing, newFile: file, newHash: hash, newExtraction: "" });
        return;
      }

      const subjectId = preselectedSubject || null;
      setUploadProgress(`Uploading ${file.name}...`);
      const saved = await libraryService.uploadFile({
        userId,
        subjectId,
        file,
        sha256Hash: hash,
      });

      console.info("[LibraryPage] uploaded document", { id: saved.id, storagePath: saved.storage_path });
      setFiles(prev => [saved, ...prev]);
      setUploadProgress("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed without a detailed Storage or Supabase message.";
      setUploadProgress(`Upload failed: ${message}`);
      setTimeout(() => setUploadProgress(""), 5000);
      console.error("[LibraryPage] storage upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  const processFile = async (file: File) => {
    if (!userId) return;
    setUploading(true);

    try {
      setUploadProgress(`Computing hash for ${file.name}…`);
      const hash = await computeSHA256(file);

      // Check for duplicate
      const existing = await libraryService.getFileByHash(userId, hash);
      if (existing) {
        // Need to extract text first for comparison
        setUploadProgress(`Extracting text from ${file.name}…`);
        const extraction = await extractText(file);
        setDuplicateState({ existing, newFile: file, newHash: hash, newExtraction: extraction });
        setUploading(false);
        return;
      }

      // Extract text
      setUploadProgress(`Extracting content from ${file.name}…`);
      const extraction = await extractText(file);

      const subjectId = preselectedSubject || null;
      const fileSize = formatFileSize(file.size);
      const fileType = file.type;

      setUploadProgress(`Saving ${file.name} to library…`);
      console.info("[LibraryPage] uploading file", {
        userId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        subjectId,
        sha256Hash: hash,
        extractionLength: extraction.length,
      });
      const saved = await libraryService.uploadFile({
        userId,
        subjectId,
        fileName: file.name,
        originalName: file.name,
        fileSize,
        fileType,
        sha256Hash: hash,
        extractionText: extraction,
      });

      console.info("[LibraryPage] file saved", { id: saved.id, fileName: saved.file_name });
      setFiles(prev => [saved, ...prev]);
      setUploadProgress("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[LibraryPage] upload failed", {
        userId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        subjectId: preselectedSubject || null,
        error: err,
      });
      setUploadProgress(`Upload failed: ${message}`);
      setTimeout(() => setUploadProgress(""), 3000);
    } finally {
      setUploading(false);
    }
  };

  const handleDuplicateAction = async (action: DuplicateAction) => {
    if (!duplicateState || !userId) return;
    const { existing, newFile, newHash, newExtraction } = duplicateState;
    setDuplicateState(null);
    setUploading(true);

    try {
      if (action === "replace") {
        const updated = await libraryService.replaceFile(existing.id, newExtraction, newHash);
        setFiles(prev => prev.map(f => f.id === existing.id ? updated : f));
      } else if (action === "new-version") {
        const versioned = await libraryService.createVersion({
          existingFileId: existing.id,
          userId,
          subjectId: existing.subject_id || null,
          fileName: newFile.name.replace(/\.[^/.]+$/, ""),
          originalName: newFile.name,
          fileSize: formatFileSize(newFile.size),
          fileType: newFile.type,
          sha256Hash: newHash,
          extractionText: newExtraction,
        });
        setFiles(prev => [versioned, ...prev]);
      } else if (action === "keep-both") {
        const saved = await libraryService.uploadFile({
          userId,
          subjectId: existing.subject_id || null,
          fileName: `${newFile.name} (copy)`,
          originalName: newFile.name,
          fileSize: formatFileSize(newFile.size),
          fileType: newFile.type,
          sha256Hash: newHash + "_copy",
          extractionText: newExtraction,
        });
        setFiles(prev => [saved, ...prev]);
      }
      // "open-existing" — do nothing, already in library
    } catch (err) {
      console.error("Duplicate action error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleRename = async (fileId: string) => {
    if (!renameName.trim()) return;
    try {
      const updated = await libraryService.renameFile(fileId, renameName.trim());
      setFiles(prev => prev.map(f => f.id === fileId ? updated : f));
      setRenameId(null);
      setRenameName("");
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm("Delete this file from your library?")) return;
    try {
      await libraryService.deleteFile(fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (e) { console.error(e); }
  };

  const handleOpenFile = async (file: LibraryFile) => {
    if (!file.storage_path) return;
    try {
      const { data, error } = await supabase.storage.from("documents").createSignedUrl(file.storage_path, 3600);
      if (error || !data) {
        const { data: publicData } = supabase.storage.from("documents").getPublicUrl(file.storage_path);
        if (publicData?.publicUrl) window.open(publicData.publicUrl, "_blank");
      } else {
        window.open(data.signedUrl, "_blank");
      }
    } catch (e) { console.error(e); }
  };

  const filtered = files.filter(f => {
    const matchSearch = f.file_name.toLowerCase().includes(search.toLowerCase()) ||
      (f.original_name || "").toLowerCase().includes(search.toLowerCase());
    const matchSubject = filterSubject === "all" || f.subject_id === filterSubject;
    return matchSearch && matchSubject;
  });

  if (loading) return (
    <div className="min-h-screen kyxun-page flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen kyxun-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FolderOpen className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Library</span>
            </div>
            <h1 className="font-outfit text-2xl font-black kyxun-text">
              {files.length} File{files.length !== 1 ? "s" : ""}
            </h1>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#92400E] text-white border border-transparent text-xs font-bold hover:bg-[#78350F] transition-all cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" /> Upload Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Upload progress */}
        <AnimatePresence>
          {(uploading || uploadProgress) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 rounded-xl kyxun-badge-indigo flex items-center gap-3"
            >
              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
              <p className="text-xs   font-medium">{uploadProgress || "Processing…"}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search + Filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 kyxun-text-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search files…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] kyxun-text text-sm placeholder:kyxun-text-muted focus:outline-none focus:border-amber-500/40 transition-all"
            />
          </div>

          <select
            value={filterSubject}
            onChange={e => setFilterSubject(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] kyxun-text text-xs focus:outline-none focus:border-amber-500/40 transition-all cursor-pointer"
          >
            <option value="all">All Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
            ))}
          </select>

          <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
            <button onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "list" ? "bg-[var(--kyxun-hover-bg)] kyxun-text" : "kyxun-text-muted hover:kyxun-text"}`}>
              <List className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "grid" ? "bg-[var(--kyxun-hover-bg)] kyxun-text" : "kyxun-text-muted hover:kyxun-text"}`}>
              <Grid3X3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Files */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-white/[0.08] rounded-2xl">
            <FolderOpen className="w-10 h-10 kyxun-text-muted mx-auto mb-4" />
            <p className="kyxun-text-muted font-bold">{search ? "No files match your search." : "Your library is empty."}</p>
            <p className="kyxun-text-muted text-sm mt-1">Upload your notes, syllabuses, and past papers to get started.</p>
            {!search && (
              <button onClick={() => fileInputRef.current?.click()}
                className="mt-4 px-5 py-2.5 rounded-xl bg-[#92400E] text-white border border-transparent text-sm font-bold hover:bg-[#78350F] transition-all cursor-pointer inline-flex items-center gap-2">
                <Upload className="w-3.5 h-3.5" /> Upload First File
              </button>
            )}
          </div>
        ) : viewMode === "list" ? (
          <div className="space-y-2">
            {filtered.map((f, i) => {
              const subj = subjects.find(s => s.id === f.subject_id);
              const isRenaming = renameId === f.id;
              return (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 p-3.5 border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] rounded-xl transition-all group"
                >
                  <div className="text-xl shrink-0">{fileIcon(f.file_type)}</div>

                  <div className="flex-1 min-w-0">
                    {isRenaming ? (
                      <form onSubmit={e => { e.preventDefault(); handleRename(f.id); }} className="flex items-center gap-2">
                        <input
                          value={renameName}
                          onChange={e => setRenameName(e.target.value)}
                          className="flex-1 bg-[var(--kyxun-hover-bg)] border kyxun-border rounded-lg px-2 py-1 text-sm kyxun-text focus:outline-none"
                          autoFocus
                        />
                        <button type="submit" className="w-6 h-6 flex items-center justify-center rounded bg-emerald-500/20 text-emerald-400 cursor-pointer"><Check className="w-3 h-3" /></button>
                        <button type="button" onClick={() => setRenameId(null)} className="w-6 h-6 flex items-center justify-center rounded bg-[var(--kyxun-hover-bg)] kyxun-text-muted cursor-pointer"><X className="w-3 h-3" /></button>
                      </form>
                    ) : (
                      <p 
                        className="text-sm font-bold kyxun-text truncate cursor-pointer hover:underline hover:text-amber-500 transition-colors"
                        onClick={() => handleOpenFile(f)}
                      >
                        {f.file_name}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {subj && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: `${subj.color}20`, color: subj.color }}>
                          {subj.icon} {subj.name}
                        </span>
                      )}
                      <span className="text-[9px] kyxun-text-muted">{timeAgo(f.uploaded_at)}</span>
                      {f.file_size && <span className="text-[9px] kyxun-text-muted">• {f.file_size}</span>}
                      {f.page_count && <span className="text-[9px] kyxun-text-muted">• {f.page_count}p</span>}
                      {f.version > 1 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 font-bold">v{f.version}</span>}
                      {f.analyzed && <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold">✓ Analyzed</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Link href="/plan"
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg kyxun-badge-indigo text-[10px] font-bold hover:kyxun-badge-indigo transition-all">
                      <BrainCircuit className="w-3 h-3" /> Analyze
                    </Link>
                    <button
                      onClick={() => { setRenameId(f.id); setRenameName(f.file_name); }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg kyxun-text-muted hover:kyxun-text hover:bg-[var(--kyxun-hover-bg)] transition-all cursor-pointer"
                      title="Rename">
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button onClick={() => handleDelete(f.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                      title="Delete">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* Grid view */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((f, i) => {
              const subj = subjects.find(s => s.id === f.subject_id);
              return (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="p-4 border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl transition-all group relative"
                >
                  <div 
                    className="text-3xl mb-3 cursor-pointer hover:scale-105 transition-transform inline-block"
                    onClick={() => handleOpenFile(f)}
                  >
                    {fileIcon(f.file_type)}
                  </div>
                  <p 
                    className="text-xs font-bold kyxun-text truncate mb-1 cursor-pointer hover:underline hover:text-amber-500 transition-colors"
                    onClick={() => handleOpenFile(f)}
                  >
                    {f.file_name}
                  </p>
                  <p className="text-[9px] kyxun-text-muted">{timeAgo(f.uploaded_at)}</p>
                  {subj && (
                    <div className="mt-2">
                      <span className="text-[8px] px-1.5 py-0.5 rounded font-bold" style={{ background: `${subj.color}20`, color: subj.color }}>
                        {subj.icon} {subj.name}
                      </span>
                    </div>
                  )}
                  {f.analyzed && (
                    <div className="mt-1">
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold">✓ Analyzed</span>
                    </div>
                  )}
                  <button onClick={() => handleDelete(f.id)}
                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Duplicate Detection Modal */}
      <AnimatePresence>
        {duplicateState && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[var(--kyxun-bg-secondary)] border border-amber-500/20 rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5  " />
                </div>
                <div>
                  <h2 className="font-outfit font-black kyxun-text">File Already Exists</h2>
                  <p className="text-xs kyxun-text-muted">Identical file detected in your library.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[var(--kyxun-hover-bg)] border kyxun-border mb-5">
                <p className="text-xs font-bold kyxun-text">{duplicateState.existing.file_name}</p>
                <p className="text-[10px] kyxun-text-muted mt-0.5">
                  Uploaded {timeAgo(duplicateState.existing.uploaded_at)} • Version {duplicateState.existing.version}
                </p>
              </div>

              <p className="text-xs kyxun-text-muted mb-4">What would you like to do?</p>

              <div className="space-y-2">
                {[
                  { action: "open-existing" as DuplicateAction, label: "Open Existing File", desc: "Go to the already analyzed version", color: "emerald" },
                  { action: "new-version" as DuplicateAction, label: "Create New Version", desc: "Save as v2, v3… alongside the original", color: "indigo" },
                  { action: "replace" as DuplicateAction, label: "Replace Existing", desc: "Overwrite with this new upload", color: "amber" },
                  { action: "keep-both" as DuplicateAction, label: "Keep Both", desc: "Save a separate copy", color: "white" },
                ].map(opt => (
                  <button
                    key={opt.action}
                    onClick={() => handleDuplicateAction(opt.action)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer hover:scale-[1.01] ${
                      opt.color === "emerald" ? "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10" :
                      opt.color === "indigo" ? "  bg-indigo-500/5 hover:kyxun-badge-" :
                      opt.color === "amber" ? "border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10" :
                      "kyxun-border bg-[var(--kyxun-hover-bg)] hover:bg-[var(--kyxun-hover-bg)]"
                    }`}
                  >
                    <p className={`text-xs font-bold ${
                      opt.color === "emerald" ? "text-emerald-300" :
                      opt.color === "indigo" ? " " :
                      opt.color === "amber" ? " " : "kyxun-text-muted"
                    }`}>{opt.label}</p>
                    <p className="text-[10px] kyxun-text-muted mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setDuplicateState(null)}
                className="mt-3 w-full py-2 rounded-xl kyxun-text-muted text-xs font-medium hover:kyxun-text-muted transition-colors cursor-pointer">
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen kyxun-page flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LibraryPageInner />
    </Suspense>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
async function extractText(file: File): Promise<string> {
  // For images: return description placeholder
  if (file.type.startsWith("image/")) {
    return `[Image: ${file.name}]`;
  }
  // For text-based files: read as text
  if (file.type === "text/plain") {
    return await file.text();
  }
  // For PDFs/DOCX: return placeholder (actual extraction happens server-side during analysis)
  return `[${file.type || "document"}: ${file.name}]`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}
