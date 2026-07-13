"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen, FolderOpen, MessageSquare, Sparkles, Plus,
  Upload, Calendar, Clock, ArrowRight,
  BrainCircuit, Flame, FileText
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { subjectService, type Subject } from "@/lib/services/subjectService";

interface Stats {
  subjects: number;
  files: number;
  chats: number;
  plans: number;
}

interface RecentActivity {
  id: string;
  type: "chat" | "plan" | "file";
  label: string;
  time: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d === 1) return "Yesterday";
  return `${d} days ago`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; id: string } | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [stats, setStats] = useState<Stats>({ subjects: 0, files: 0, chats: 0, plans: 0 });
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const init = async () => {
      // Auth
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) { router.replace("/login"); return; }
      if (!alive) return;

      const name = u.user_metadata?.full_name || u.user_metadata?.name || u.email || "Student";
      setUser({ name: name.split(" ")[0], id: u.id });

      // Load subjects
      try {
        const subs = await subjectService.getSubjects(u.id);
        if (!alive) return;
        setSubjects(subs.slice(0, 6));
        setStats(prev => ({ ...prev, subjects: subs.length }));
      } catch { /* table may not exist yet */ }

      // Stats
      try {
        const [filesRes, chatsRes, plansRes] = await Promise.allSettled([
          supabase.from("documents").select("id", { count: "exact", head: true }).eq("user_id", u.id),
          supabase.from("chat_sessions").select("id", { count: "exact", head: true }).eq("user_id", u.id),
          supabase.from("study_plans").select("id", { count: "exact", head: true }).eq("user_id", u.id),
        ]);
        if (!alive) return;
        const files = filesRes.status === "fulfilled" ? (filesRes.value.count || 0) : 0;
        const chats = chatsRes.status === "fulfilled" ? (chatsRes.value.count || 0) : 0;
        const plans = plansRes.status === "fulfilled" ? (plansRes.value.count || 0) : 0;
        setStats(prev => ({ ...prev, files, chats, plans }));
      } catch { /* ignore */ }

      // Recent activity
      try {
        const [recentChats, recentPlans] = await Promise.allSettled([
          supabase.from("chat_sessions").select("id, title, created_at").eq("user_id", u.id)
            .order("created_at", { ascending: false }).limit(3),
          supabase.from("study_plans").select("id, subject, created_at").eq("user_id", u.id)
            .order("created_at", { ascending: false }).limit(3),
        ]);
        const acts: RecentActivity[] = [];
        if (recentChats.status === "fulfilled" && recentChats.value.data) {
          recentChats.value.data.forEach((c: any) => acts.push({ id: c.id, type: "chat", label: c.title || "Chat session", time: timeAgo(c.created_at) }));
        }
        if (recentPlans.status === "fulfilled" && recentPlans.value.data) {
          recentPlans.value.data.forEach((p: any) => acts.push({ id: p.id, type: "plan", label: `Study plan — ${p.subject}`, time: timeAgo(p.created_at) }));
        }
        if (alive) setActivity(acts.slice(0, 5));
      } catch { /* ignore */ }

      if (alive) setLoading(false);
    };
    init();
    return () => { alive = false; };
  }, [router]);

  const statCards = [
    { label: "Subjects", value: stats.subjects, icon: BookOpen, color: "indigo", href: "/subjects" },
    { label: "Files", value: stats.files, icon: FolderOpen, color: "amber", href: "/library" },
    { label: "AI Chats", value: stats.chats, icon: MessageSquare, color: "purple", href: "/chats" },
    { label: "Study Plans", value: stats.plans, icon: Calendar, color: "emerald", href: "/plan" },
  ];

  const colorMap: Record<string, string> = {
    indigo: "bg-[var(--kyxun-card-indigo-bg)] border-[var(--kyxun-card-indigo-border)] text-indigo-700 dark:text-indigo-400",
    amber: "bg-[var(--kyxun-card-amber-bg)] border-[var(--kyxun-card-amber-border)] text-amber-700 dark:text-amber-400",
    purple: "bg-[var(--kyxun-card-purple-bg)] border-[var(--kyxun-card-purple-border)] text-purple-700 dark:text-purple-400",
    emerald: "bg-[var(--kyxun-card-emerald-bg)] border-[var(--kyxun-card-emerald-border)] text-emerald-700 dark:text-emerald-400",
  };

  if (loading) {
    return (
      <div className="min-h-screen kyxun-page flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-xl kyxun-badge-indigo flex items-center justify-center animate-pulse">
            <BrainCircuit className="w-4 h-4  " />
          </div>
          <p className="text-xs kyxun-text-muted font-medium">Loading workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen kyxun-page relative overflow-x-hidden">
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-[#CA8A04]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#CA8A04]">Workspace</span>
          </div>
          <h1 className="font-outfit text-3xl font-black kyxun-text">
            Welcome back, {user?.name || "Student"} 👋
          </h1>
          <p className="text-sm kyxun-text-muted mt-1 font-medium">
            Your personal AI study workspace — everything in one place.
          </p>
        </motion.div>

        {/* Stat cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {statCards.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className={`group p-4 rounded-2xl border ${colorMap[s.color]} hover:scale-[1.02] transition-all`}
            >
              <div className="flex items-center justify-between mb-3">
                <s.icon className="w-4 h-4" />
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-2xl font-black kyxun-text mb-0.5">{s.value}</p>
              <p className="text-[10px] font-bold kyxun-text-muted uppercase tracking-wide">{s.label}</p>
            </Link>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent Subjects */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="lg:col-span-2"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black kyxun-text flex items-center gap-2">
                <BookOpen className="w-4 h-4  " /> My Subjects
              </h2>
              <Link href="/subjects" className="text-[11px] font-semibold   hover:  transition-colors flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {subjects.length === 0 ? (
              <div className="p-8 border kyxun-border rounded-2xl text-center">
                <BookOpen className="w-8 h-8 kyxun-text-muted mx-auto mb-3" />
                <p className="text-sm font-bold kyxun-text-muted mb-1">No subjects yet</p>
                <p className="text-xs kyxun-text-muted mb-4">Create your first subject workspace to get started.</p>
                <Link
                  href="/subjects?new=1"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#A16207] text-white border border-transparent text-xs font-bold hover:opacity-90 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Create Subject
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {subjects.map((s) => (
                  <Link
                    key={s.id}
                    href={`/subjects/${s.id}`}
                    className="group p-4 border kyxun-border bg-white/[0.02] hover:bg-white/[0.04] hover:kyxun-border rounded-2xl transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{s.icon}</span>
                        <div>
                          <p className="text-sm font-black kyxun-text group-hover:  transition-colors truncate max-w-[120px]">
                            {s.name}
                          </p>
                          {s.semester && (
                            <p className="text-[9px] kyxun-text-muted font-medium">{s.semester}</p>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 kyxun-text-muted group-hover:  transition-colors shrink-0 mt-1" />
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-1 bg-[var(--kyxun-hover-bg)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${s.progress}%`, background: s.color }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[9px] kyxun-text-muted">{s.progress}% progress</span>
                    </div>
                  </Link>
                ))}

                {/* Add new subject card */}
                <Link
                  href="/subjects?new=1"
                  className="p-4 border border-dashed kyxun-border hover:border-indigo-500/30 hover:bg-indigo-500/5 rounded-2xl transition-all flex flex-col items-center justify-center gap-2 kyxun-text-muted hover:  group"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-xs font-semibold">New Subject</span>
                </Link>
              </div>
            )}
          </motion.div>

          {/* Right column */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="flex flex-col gap-4"
          >
            {/* Quick Actions */}
            <div className="p-4 border kyxun-border bg-white/[0.02] rounded-2xl">
              <h3 className="text-xs font-black kyxun-text mb-3 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5  " /> Quick Start
              </h3>
              <div className="flex flex-col gap-2">
                <Link href="/plan"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-all group">
                  <BrainCircuit className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">Generate Study Plan</span>
                  <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                <Link href="/chat"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all group">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">Start AI Chat</span>
                  <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                <Link href="/library?upload=1"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20 hover:bg-orange-500/20 transition-all group">
                  <Upload className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">Upload Material</span>
                  <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="p-4 border kyxun-border bg-white/[0.02] rounded-2xl flex-1">
              <h3 className="text-xs font-black kyxun-text mb-3 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5  " /> Recent Activity
              </h3>
              {activity.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs kyxun-text-muted">No activity yet.</p>
                  <p className="text-[10px] kyxun-text-muted mt-1">Start studying to see it here.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activity.map(a => (
                    <div key={a.id} className="flex items-start gap-2">
                      <div className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center shrink-0 ${
                        a.type === "chat" ? "kyxun-badge-" :
                        a.type === "plan" ? "kyxun-badge-" : "bg-amber-500/10"
                      }`}>
                        {a.type === "chat" ? <MessageSquare className="w-2.5 h-2.5  " /> :
                         a.type === "plan" ? <Calendar className="w-2.5 h-2.5  " /> :
                         <FileText className="w-2.5 h-2.5  " />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium kyxun-text-muted truncate">{a.label}</p>
                        <p className="text-[9px] kyxun-text-muted">{a.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
