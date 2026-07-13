"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BarChart3, BookOpen, ArrowRight, BrainCircuit } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { subjectService, type Subject } from "@/lib/services/subjectService";

export default function ProgressPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [masteredCards, setMasteredCards] = useState(0);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    let alive = true;
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      
      try {
        const [chatsRes, plansRes, cardsRes] = await Promise.allSettled([
          supabase.from("chat_sessions").select("created_at", { count: "exact" }).eq("user_id", user.id),
          supabase.from("study_plans").select("created_at", { count: "exact" }).eq("user_id", user.id),
          supabase.from("flashcards").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_mastered", true)
        ]);

        let chatDates: string[] = [];
        let planDates: string[] = [];
        let totalCount = 0;

        if (chatsRes.status === "fulfilled" && chatsRes.value.data) {
          totalCount += chatsRes.value.count || 0;
          chatDates = chatsRes.value.data.map((c: Record<string, unknown>) => c.created_at as string);
        }
        if (plansRes.status === "fulfilled" && plansRes.value.data) {
          totalCount += plansRes.value.count || 0;
          planDates = plansRes.value.data.map((p: Record<string, unknown>) => p.created_at as string);
        }
        if (alive) setTotalSessions(totalCount);

        if (cardsRes.status === "fulfilled" && alive) {
          setMasteredCards(cardsRes.value.count || 0);
        }

        const allDates = [...chatDates, ...planDates]
          .map(d => new Date(d).toISOString().split('T')[0])
          .sort((a, b) => b.localeCompare(a));
        
        const uniqueDates = Array.from(new Set(allDates));
        
        let currentStreak = 0;
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        
        if (uniqueDates.includes(today) || uniqueDates.includes(yesterday)) {
          const checkDate = uniqueDates.includes(today) ? new Date() : new Date(Date.now() - 86400000);
          for (const d of uniqueDates) {
            if (d === checkDate.toISOString().split('T')[0]) {
              currentStreak++;
              checkDate.setDate(checkDate.getDate() - 1);
            } else {
              break;
            }
          }
        }
        if (alive) setStreak(currentStreak);

        const subs = await subjectService.getSubjects(user.id);
        if (alive) setSubjects(subs);

      } catch (err) {
        console.warn("Failed to load progress data:", err);
      } finally {
        if (alive) setLoading(false);
      }
    };
    init();
    return () => { alive = false; };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen kyxun-page flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-xl kyxun-badge-indigo flex items-center justify-center animate-pulse">
            <BrainCircuit className="w-4 h-4  " />
          </div>
          <p className="text-xs kyxun-text-muted font-medium">Loading progress data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen kyxun-page">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Progress</span>
        </div>
        <h1 className="font-outfit text-2xl font-black kyxun-text mb-8">Your Progress</h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Study Streak", value: `${streak} day${streak === 1 ? '' : 's'}`, icon: "🔥", color: "amber" },
            { label: "Total Sessions", value: totalSessions.toString(), icon: "📚", color: "indigo" },
            { label: "Flashcards Mastered", value: masteredCards.toString(), icon: "⚡", color: "purple" },
          ].map(s => (
            <div key={s.label} className={`p-5 rounded-2xl border ${
              s.color === "amber" ? "bg-[var(--kyxun-card-amber-bg)] border-[var(--kyxun-card-amber-border)]" :
              s.color === "indigo" ? "bg-[var(--kyxun-card-indigo-bg)] border-[var(--kyxun-card-indigo-border)]" :
              "bg-[var(--kyxun-card-purple-bg)] border-[var(--kyxun-card-purple-border)]"
            }`}>
              <p className="text-2xl mb-2">{s.icon}</p>
              <p className="text-2xl font-black kyxun-text">{s.value}</p>
              <p className="text-[10px] kyxun-text-muted uppercase tracking-wide font-bold">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="p-6 border kyxun-border bg-white/[0.02] rounded-2xl">
          <h2 className="text-sm font-black kyxun-text mb-4">Subject Progress</h2>
          {subjects.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm font-bold kyxun-text-muted mb-1">No subjects found</p>
              <p className="text-xs kyxun-text-muted">Your subject mastery analytics will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {subjects.map(subject => (
                <div key={subject.id} className="p-4 bg-white/[0.02] border kyxun-border rounded-xl hover:bg-white/[0.04] transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{subject.icon}</span>
                      <span className="text-xs font-bold kyxun-text">{subject.name}</span>
                    </div>
                    <span className="text-xs font-black" style={{ color: subject.color }}>{subject.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--kyxun-hover-bg)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${subject.progress}%`, background: subject.color }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-6 flex justify-center">
            <Link href="/subjects" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold hover:bg-emerald-500/15 transition-all">
              <BookOpen className="w-3.5 h-3.5" /> View Subjects <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
