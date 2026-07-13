"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Plus, X, Search, ArrowRight,
  FileText, Calendar, Clock, Trash2, BrainCircuit, MessageSquare
} from "lucide-react";
import ChatPage from "@/app/chat/page";
import PlanPage from "@/app/(workspace)/plan/page";
import { supabase } from "@/lib/supabase";
import { subjectService, type Subject } from "@/lib/services/subjectService";

const COLORS = [
  "#6366f1", "#a855f7", "#ec4899", "#f59e0b",
  "#10b981", "#06b6d4", "#f97316", "#8b5cf6",
  "#ef4444", "#14b8a6"
];

const ICONS = ["📘", "📗", "📙", "📕", "📒", "📓", "🧪", "⚗️", "🔬", "💻", "🧮", "📐", "🎓", "🏛️", "⚖️"];

function timeAgo(dateStr: string) {
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  return `${d} days ago`;
}

function SubjectsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSemester, setNewSemester] = useState("");
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [newIcon, setNewIcon] = useState(ICONS[0]);
  const [creating, setCreating] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);

  useEffect(() => {
    let alive = true;
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      if (!alive) return;
      setUserId(user.id);
      try {
        const subs = await subjectService.getSubjects(user.id);
        if (alive) setSubjects(subs);
      } catch { /* ignore */ }
      if (alive) setLoading(false);
    };
    init();
    return () => { alive = false; };
  }, [router]);

  // Auto-open create modal if ?new=1
  useEffect(() => {
    if (searchParams.get("new") === "1") setShowNew(true);
  }, [searchParams]);

  const handleCreate = async () => {
    if (!userId || !newName.trim()) return;
    setCreating(true);
    try {
      const s = await subjectService.createSubject(userId, newName.trim(), newSemester.trim() || undefined, newColor, newIcon);
      setSubjects(prev => [s, ...prev]);
      setShowNew(false);
      setNewName(""); setNewSemester(""); setNewColor(COLORS[0]); setNewIcon(ICONS[0]);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      console.error("[SubjectsPage] create subject failed", {
        userId,
        name: newName.trim(),
        semester: newSemester.trim() || undefined,
        color: newColor,
        icon: newIcon,
        error: e,
      });
      alert(`Failed to create subject. ${message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this subject and all its data?")) return;
    try {
      await subjectService.deleteSubject(id);
      setSubjects(prev => prev.filter(s => s.id !== id));
    } catch (e) { console.error(e); }
  };

  const filtered = subjects.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.semester || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen kyxun-page flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen kyxun-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-[#7C3AED]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#7C3AED]">My Subjects</span>
            </div>
            <h1 className="font-outfit text-2xl font-black kyxun-text">{subjects.length} Subject{subjects.length !== 1 ? "s" : ""}</h1>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3B0764] text-white border border-transparent text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> New Subject
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 kyxun-text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search subjects…"
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] kyxun-text text-sm placeholder:kyxun-text-muted focus:outline-none focus:border-indigo-500/40 transition-all"
          />
        </div>

        {/* Subject Grid */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <BookOpen className="w-10 h-10 kyxun-text-muted mx-auto mb-4" />
            <p className="kyxun-text-muted font-bold mb-1">{search ? "No subjects match your search." : "No subjects yet."}</p>
            <p className="kyxun-text-muted text-sm mb-6">Create your first subject workspace to organize study materials.</p>
            {!search && (
              <button onClick={() => setShowNew(true)}
                className="px-6 py-2.5 rounded-xl bg-[#3B0764] text-white border border-transparent text-sm font-bold hover:opacity-90 transition-all cursor-pointer">
                Create Subject
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group relative"
              >
                <Link
                  href={`/subjects/${s.id}`}
                  className="block p-5 border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl transition-all hover:kyxun-border"
                  onClick={() => subjectService.updateLastOpened(s.id)}
                >
                  {/* Color accent top bar */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: s.color }} />

                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{s.icon}</span>
                      <div>
                        <h3 className="font-black kyxun-text text-sm group-hover:  transition-colors">
                          {s.name}
                        </h3>
                        {s.semester && (
                          <p className="text-[9px] kyxun-text-muted font-medium mt-0.5">{s.semester}</p>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 kyxun-text-muted group-hover:  transition-all group-hover:translate-x-0.5" />
                  </div>

                  {/* Quick stats row */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { icon: FileText, label: "Files", val: "–" },
                      { icon: BookOpen, label: "Flashcards", val: "–" },
                      { icon: Calendar, label: "Plans", val: "–" },
                    ].map((stat) => (
                      <div key={stat.label} className="text-center p-2 bg-white/[0.03] rounded-xl">
                        <stat.icon className="w-3 h-3 kyxun-text-muted mx-auto mb-1" />
                        <p className="text-[10px] font-black kyxun-text-muted">{stat.val}</p>
                        <p className="text-[8px] kyxun-text-muted">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] kyxun-text-muted font-medium">Progress</span>
                      <span className="text-[9px] font-black" style={{ color: s.color }}>{s.progress}%</span>
                    </div>
                    <div className="h-1 bg-[var(--kyxun-hover-bg)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${s.progress}%`, background: s.color }} />
                    </div>
                  </div>

                  <p className="text-[9px] kyxun-text-muted flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> Last opened {timeAgo(s.last_opened_at)}
                  </p>
                </Link>

                {/* Delete button */}
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(s.id); }}
                  className="absolute top-3 right-10 w-7 h-7 flex items-center justify-center rounded-lg kyxun-text-muted group-hover:text-red-400/60 hover:!text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                  title="Delete subject"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </motion.div>
            ))}


          </div>
        )}
      </div>

      {/* Create Subject Modal */}
      <AnimatePresence>
        {showNew && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowNew(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[var(--kyxun-bg-secondary)] border kyxun-border rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-outfit text-lg font-black kyxun-text">New Subject</h2>
                <button onClick={() => setShowNew(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg kyxun-text-muted hover:kyxun-text hover:bg-[var(--kyxun-hover-bg)] cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider kyxun-text-muted mb-1.5 block">
                    Subject Name *
                  </label>
                  <input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCreate()}
                    placeholder="e.g. Logistics Information Systems"
                    className="w-full px-3 py-2.5 rounded-xl bg-[var(--kyxun-hover-bg)] border kyxun-border kyxun-text text-sm placeholder:kyxun-text-muted focus:outline-none focus:border-indigo-500/40"
                    autoFocus
                  />
                </div>

                {/* Semester */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider kyxun-text-muted mb-1.5 block">
                    Semester / Year (optional)
                  </label>
                  <input
                    value={newSemester}
                    onChange={e => setNewSemester(e.target.value)}
                    placeholder="e.g. Semester 4"
                    className="w-full px-3 py-2.5 rounded-xl bg-[var(--kyxun-hover-bg)] border kyxun-border kyxun-text text-sm placeholder:kyxun-text-muted focus:outline-none focus:border-indigo-500/40"
                  />
                </div>

                {/* Icon picker */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider kyxun-text-muted mb-1.5 block">Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {ICONS.map(ic => (
                      <button key={ic} onClick={() => setNewIcon(ic)}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all cursor-pointer ${newIcon === ic ? "kyxun-badge-indigo border-indigo-500/40 scale-110" : "bg-[var(--kyxun-hover-bg)] border border-transparent hover:bg-[var(--kyxun-hover-bg)]"}`}>
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color picker */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider kyxun-text-muted mb-1.5 block">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setNewColor(c)}
                        className={`w-7 h-7 rounded-full transition-all cursor-pointer ${newColor === c ? "scale-125 ring-2 ring-white/50 ring-offset-1 ring-offset-[#0d0d18]" : "hover:scale-110"}`}
                        style={{ background: c }} />
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="p-3 rounded-xl bg-white/[0.03] border kyxun-border flex items-center gap-3">
                  <span className="text-xl">{newIcon}</span>
                  <div>
                    <p className="text-sm font-black kyxun-text">{newName || "Subject Name"}</p>
                    {newSemester && <p className="text-[9px] kyxun-text-muted">{newSemester}</p>}
                  </div>
                  <div className="ml-auto w-3 h-3 rounded-full" style={{ background: newColor }} />
                </div>

                <button
                  onClick={handleCreate}
                  disabled={!newName.trim() || creating}
                  className="w-full py-3 rounded-xl bg-[#3B0764] text-white text-sm font-black hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  {creating ? "Creating…" : "Create Subject"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Inline Modals */}
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

export default function SubjectsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen kyxun-page flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SubjectsPageInner />
    </Suspense>
  );
}
