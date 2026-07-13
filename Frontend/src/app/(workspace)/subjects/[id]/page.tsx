"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, FileText, Calendar, MessageSquare, Upload,
  Sparkles, Plus, ExternalLink, Trash2, BrainCircuit, X
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { subjectService, type Subject } from "@/lib/services/subjectService";
import { libraryService, type LibraryFile } from "@/lib/services/libraryService";
import { computeSHA256 } from "@/lib/fileHash";
import ChatPage from "@/app/chat/page";
import PlanPage from "@/app/(workspace)/plan/page";

type TabId = "files" | "plans" | "chats";

function timeAgo(dateStr: string) {
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  return `${d} days ago`;
}

export default function SubjectWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: subjectId } = use(params);
  const router = useRouter();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [files, setFiles] = useState<LibraryFile[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("files");
  const [loading, setLoading] = useState(true);

  // New inline states
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.replace("/login"); return; }
        if (!alive) return;

        // Load subject
        const sub = await subjectService.getSubject(user.id, subjectId);
        if (!sub) { router.replace("/subjects"); return; }
        if (!alive) return;
        setSubject(sub);
        
        try {
          await subjectService.updateLastOpened(subjectId);
        } catch (e) {
          console.warn("Failed to update last opened", e);
        }

        // Load files, plans, chats in parallel
        const [filesRes, plansRes, chatsRes] = await Promise.allSettled([
          libraryService.getFiles(user.id, subjectId),
          subjectService.getStudyPlans(user.id, subjectId),
          subjectService.getChatSessions(user.id, subjectId),
        ]);

        if (alive) {
          if (filesRes.status === "fulfilled") setFiles(filesRes.value);
          if (plansRes.status === "fulfilled") setPlans(plansRes.value);
          if (chatsRes.status === "fulfilled") setChats(chatsRes.value);
          setLoading(false);
        }
      } catch (err) {
        console.error("Init failed:", err);
        if (alive) setLoading(false);
      }
    };
    init();
    return () => { alive = false; };
  }, [subjectId, router]);

  const deleteFile = async (fileId: string) => {
    if (!confirm("Delete this file?")) return;
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length || !subject) return;
    e.target.value = "";
    
    setUploading(true);
    for (const file of selectedFiles) {
      try {
        setUploadProgress(`Uploading ${file.name}...`);
        const hash = await computeSHA256(file);
        
        // Check for duplicates
        const existing = await libraryService.getFileByHash(subject.user_id, hash);
        if (existing) {
           console.log("File already exists", existing);
           continue; 
        }

        const saved = await libraryService.uploadFile({
          userId: subject.user_id,
          subjectId: subject.id,
          file,
          sha256Hash: hash,
        });
        setFiles(prev => [saved, ...prev]);
        
        // Refresh progress natively by refetching subject
        const updatedSub = await subjectService.getSubject(subject.user_id, subject.id);
        if (updatedSub) setSubject(updatedSub);
      } catch (err) {
        console.error("Upload failed", err);
      }
    }
    setUploading(false);
    setUploadProgress("");
  };

  if (loading || !subject) {
    return (
      <div className="min-h-screen kyxun-page flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs: { id: TabId; label: string; icon: React.ElementType; count?: number }[] = [
    { id: "files", label: "Files", icon: FileText, count: files.length },
    { id: "plans", label: "Study Plans", icon: Calendar, count: plans.length },
    { id: "chats", label: "AI Chats", icon: MessageSquare, count: chats.length },
  ];

  return (
    <div className="min-h-screen kyxun-page">
      {/* Subject header */}
      <div className="relative overflow-hidden border-b kyxun-border">
        <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(ellipse at 30% 50%, ${subject.color}60 0%, transparent 70%)` }} />
        <div className="relative max-w-5xl mx-auto px-6 py-6">
          <Link href="/subjects"
            className="flex items-center gap-1.5 kyxun-text-muted hover:kyxun-text text-xs font-medium mb-4 w-fit transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> All Subjects
          </Link>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border"
                style={{ background: `${subject.color}15`, borderColor: `${subject.color}30` }}>
                {subject.icon}
              </div>
              <div>
                <h1 className="font-outfit text-2xl font-black kyxun-text">{subject.name}</h1>
                {subject.semester && <p className="text-xs kyxun-text-muted mt-0.5">{subject.semester}</p>}
              </div>
            </div>

            {/* Stats strip */}
            <div className="flex items-center gap-4 flex-wrap">
              {[
                { label: "Files", value: files.length },
                { label: "Plans", value: plans.length },
                { label: "Chats", value: chats.length },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-xl font-black kyxun-text">{s.value}</p>
                  <p className="text-[9px] kyxun-text-muted uppercase tracking-wide">{s.label}</p>
                </div>
              ))}

              {/* Progress */}
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-[var(--kyxun-hover-bg)] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${subject.progress}%`, background: subject.color }} />
                </div>
                <span className="text-xs font-black" style={{ color: subject.color }}>{subject.progress}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 bg-white/[0.03] border border-white/[0.05] rounded-xl p-1 w-fit">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === t.id
                  ? "bg-[var(--kyxun-hover-bg)] kyxun-text"
                  : "kyxun-text-muted hover:kyxun-text hover:bg-[var(--kyxun-hover-bg)]"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              {(t.count ?? 0) > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--kyxun-hover-bg)] font-black">{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab: Files */}
        {activeTab === "files" && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black kyxun-text">Uploaded Files</h2>
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="flex items-center gap-2 px-3 py-2 rounded-xl kyxun-badge-indigo text-xs font-bold hover:kyxun-badge-indigo transition-all disabled:opacity-50 cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> Upload to this Subject
              </button>
            </div>

            {files.length === 0 ? (
              <div className="py-16 border border-dashed border-white/[0.08] rounded-2xl text-center">
                <FileText className="w-8 h-8 kyxun-text-muted mx-auto mb-3" />
                <p className="kyxun-text-muted font-bold text-sm mb-1">No files yet</p>
                <p className="kyxun-text-muted text-xs mb-4">Upload your notes, syllabus, and past papers.</p>
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl kyxun-badge-indigo text-xs font-bold cursor-pointer disabled:opacity-50">
                  <Upload className="w-3.5 h-3.5" /> Upload Files
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {files.map(f => (
                  <div key={f.id} className="flex items-center gap-3 p-3 border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] rounded-xl transition-all group">
                    <div className="w-9 h-9 rounded-xl kyxun-badge-indigo flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4  " />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p 
                        className="text-sm font-bold kyxun-text truncate cursor-pointer hover:underline hover:text-amber-500 transition-colors"
                        onClick={() => handleOpenFile(f)}
                      >
                        {f.file_name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] kyxun-text-muted">{timeAgo(f.uploaded_at)}</span>
                        {f.file_size && <span className="text-[9px] kyxun-text-muted">• {f.file_size}</span>}
                        {f.page_count && <span className="text-[9px] kyxun-text-muted">• {f.page_count} pages</span>}
                        {f.version > 1 && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 font-bold">v{f.version}</span>
                        )}
                        {f.analyzed && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold">✓ Analyzed</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href="/plan"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg kyxun-badge-indigo text-[10px] font-bold hover:kyxun-badge-indigo transition-all">
                        <BrainCircuit className="w-3 h-3" /> Analyze
                      </Link>
                      <button onClick={() => deleteFile(f.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Tab: Study Plans */}
        {activeTab === "plans" && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black kyxun-text">Study Plans</h2>
              <button onClick={() => setShowPlanModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl kyxun-badge-indigo text-xs font-bold cursor-pointer transition-all hover:scale-[1.02]">
                <Plus className="w-3.5 h-3.5" /> New Plan
              </button>
            </div>
            {plans.length === 0 ? (
              <div className="py-16 border border-dashed border-white/[0.08] rounded-2xl text-center">
                <Calendar className="w-8 h-8 kyxun-text-muted mx-auto mb-3" />
                <p className="kyxun-text-muted font-bold text-sm">No study plans yet</p>
                <p className="kyxun-text-muted text-xs mt-1">Generate a plan from your uploaded materials.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {plans.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-4 border kyxun-border bg-white/[0.02] rounded-xl">
                    <div>
                      <p className="text-sm font-bold kyxun-text">{p.subject}</p>
                      <p className="text-xs kyxun-text-muted">{p.goal} • {timeAgo(p.created_at)}</p>
                    </div>
                    <button onClick={() => setShowPlanModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg kyxun-badge-indigo text-xs font-bold hover:kyxun-badge-indigo transition-all cursor-pointer hover:scale-[1.02]">
                      Open <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Tab: AI Chats */}
        {activeTab === "chats" && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black kyxun-text">AI Chat Sessions</h2>
              <button onClick={() => setShowChatModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl kyxun-badge-indigo text-xs font-bold cursor-pointer transition-all hover:scale-[1.02]">
                <MessageSquare className="w-3.5 h-3.5" /> New Chat
              </button>
            </div>
            {chats.length === 0 ? (
              <div className="py-16 border border-dashed border-white/[0.08] rounded-2xl text-center">
                <MessageSquare className="w-8 h-8 kyxun-text-muted mx-auto mb-3" />
                <p className="kyxun-text-muted font-bold text-sm">No chat sessions yet</p>
                <p className="kyxun-text-muted text-xs mt-1">Start an AI chat from the sidebar or study plan.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {chats.map((c: any) => (
                  <button key={c.id} onClick={() => setShowChatModal(true)}
                    className="flex items-center gap-3 p-3 border kyxun-border bg-white/[0.02] hover:bg-white/[0.04] rounded-xl transition-all group cursor-pointer w-full text-left">
                    <div className="w-8 h-8 rounded-xl kyxun-badge-indigo flex items-center justify-center shrink-0">
                      <MessageSquare className="w-3.5 h-3.5  " />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold kyxun-text group-hover:  transition-colors">{c.title}</p>
                      <p className="text-[10px] kyxun-text-muted">{timeAgo(c.created_at)}</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 kyxun-text-muted group-hover:  transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      <AnimatePresence>
        {(uploading || uploadProgress) && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            className="fixed bottom-6 left-1/2 z-50 p-3 rounded-xl kyxun-badge-indigo flex items-center gap-3 shadow-2xl"
          >
            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
            <p className="text-xs font-medium">{uploadProgress || "Uploading files…"}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPlanModal && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-[100] bg-[var(--kyxun-bg)] overflow-y-auto"
          >
            <button onClick={() => {
                setShowPlanModal(false);
                subjectService.getStudyPlans(subject.user_id, subject.id).then(setPlans).catch(console.error);
                subjectService.getSubject(subject.user_id, subject.id).then(sub => sub && setSubject(sub)).catch(console.error);
            }} className="fixed top-4 right-4 z-[110] p-2 hover:bg-red-500/10 text-red-400 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-red-500/20 bg-[var(--kyxun-hover-bg)]">
              <X className="w-5 h-5" />
            </button>
            <div className="pt-8 relative z-[105]">
               <PlanPage />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showChatModal && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-[100] bg-[var(--kyxun-bg)] overflow-y-auto"
          >
            <button onClick={() => {
                setShowChatModal(false);
                subjectService.getChatSessions(subject.user_id, subject.id).then(setChats).catch(console.error);
                subjectService.getSubject(subject.user_id, subject.id).then(sub => sub && setSubject(sub)).catch(console.error);
            }} className="fixed top-4 right-4 z-[110] p-2 hover:bg-red-500/10 text-red-400 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-red-500/20 bg-[var(--kyxun-hover-bg)]">
              <X className="w-5 h-5" />
            </button>
            <div className="pt-8 relative z-[105]">
               <ChatPage isInline={true} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
