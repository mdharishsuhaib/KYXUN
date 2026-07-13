"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, UploadCloud, FileText, CheckCircle2, Trash2, BrainCircuit,
  Skull, Zap, Image as ImageIcon,
  Target, Sparkles, Sun, Moon, Flame, LayoutDashboard, Calendar,
  Mic, Search, BookOpen, AlertCircle, CheckSquare, Square, Award
} from "lucide-react";
import Link from "next/link";

import { getSession, clearSession, type Session } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme";
import ProfileDropdown from "@/components/ProfileDropdown";
import ProfileModal   from "@/components/ProfileModal";
import SettingsModal  from "@/components/SettingsModal";
import HelpModal      from "@/components/HelpModal";
import LogoutModal from "@/components/LogoutModal";
import GlobalHeader from "@/components/GlobalHeader";
import type { StudyPlan, PYQAnalysisData } from "@/lib/academic";
import { sharedData } from "@/lib/store";

import PaperAnalyzer from "@/components/academic/PaperAnalyzer";
import VivaSimulator from "@/components/academic/VivaSimulator";
import FlashcardGenerator from "@/components/academic/FlashcardGenerator";
import ReadinessDashboard from "@/components/academic/ReadinessDashboard";
import Sidebar from "@/components/workspace/ClientSidebarWrapper";

interface UploadedFile { id:string;file:File;name:string;size:string;isImage:boolean;previewUrl?:string; }
type PageState = "form"|"analyzing"|"loading-sequence"|"mission-complete"|"result";
type Modal = "profile"|"settings"|"help"|"logout"|null;
type ActiveTab = "overview" | "timeline" | "viva" | "analyzer" | "flashcards" | "notes" | "practice";

const analyzingMessages = [
  "Initializing premium multimodal parser...",
  "Running token alignment & layout analysis...",
  "Applying Optical Character Recognition (OCR)...",
  "Segmenting semantic weights across syllabus...",
  "Injecting contextual data into reasoning vector...",
  "Consulting study probability matrices...",
  "Laying out Indian Standard Time chronologies...",
  "Minimizing study noise, maximizing focus yield...",
  "Finalizing your high-tech survival dashboard...",
];

function useTypewriter(text:string,speed=14){
  const [displayed,setDisplayed]=useState("");
  const [done,setDone]=useState(false);
  useEffect(()=>{
    if(!text)return;
    setDisplayed("");
    setDone(false);
    let i=0;
    const id=setInterval(()=>{
      setDisplayed(()=>{
        i++;
        if(i>=text.length){setDone(true);clearInterval(id);}
        return text.slice(0,i);
      });
    },speed);
    return()=>clearInterval(id);
  },[text,speed]);
  return {displayed,done};
}

export default function PlanPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [session, setSession] = useState<Session | null>(null);
  const [pageState, setPageState] = useState<PageState>("form");
  const [plan,setPlan]=useState<StudyPlan|null>(null);
  const [uploadedSyllabusFiles, setUploadedSyllabusFiles] = useState<UploadedFile[]>([]);
  const [uploadedPyqFiles, setUploadedPyqFiles] = useState<UploadedFile[]>([]);
  const [msgIndex,setMsgIndex]=useState(0);
  const [error,setError]=useState("");
  const [modal,setModal]=useState<Modal>(null);
  const [days,setDays]=useState("2");
  const [hours,setHours]=useState("8");
  const [subject,setSubject]=useState("");
  const [totalChapters,setTotalChapters]=useState("15");
  const [completedChapters,setCompletedChapters]=useState("2");
  const [goal,setGoal]=useState("Just Pass (Survival)");
  const syllabusFileInputRef = useRef<HTMLInputElement>(null);
  const syllabusCameraInputRef = useRef<HTMLInputElement>(null);
  const pyqFileInputRef = useRef<HTMLInputElement>(null);
  const pyqCameraInputRef = useRef<HTMLInputElement>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  
  // Interactive Task Completion
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [streakCount, setStreakCount] = useState(5);
  const [heatmapGrid, setHeatmapGrid] = useState<number[]>(() => {
    return Array.from({ length: 28 }, (_, idx) => {
      if (idx === 27 || idx === 26) return 2;
      if (idx === 25) return 3;
      if (idx === 22) return 1;
      return 0;
    });
  });

  const [flashcardCount, setFlashcardCount] = useState(0);
  const [vivaScore, setVivaScore] = useState(0);
  const [activeQuestionFilter, setActiveQuestionFilter] = useState("All");
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);

  const loadingSteps = [
    "Reading uploaded documents",
    "Detecting syllabus",
    "Extracting concepts",
    "Identifying high-weightage chapters",
    "Building personalized strategy",
    "Creating flashcards",
    "Generating practice questions",
    "Preparing viva",
    "Calculating readiness"
  ];

  useEffect(() => {
    if (pageState !== "loading-sequence") return;
    setLoadingStepIndex(0);
    const interval = setInterval(() => {
      setLoadingStepIndex((prev) => {
        if (prev >= loadingSteps.length - 1) {
          clearInterval(interval);
          setTimeout(() => {
            setPageState("mission-complete");
          }, 800);
          return prev + 1;
        }
        return prev + 1;
      });
    }, 450);
    return () => clearInterval(interval);
  }, [pageState, loadingSteps.length]);

  const openModule = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    setPageState("result");
  };

  const achievements = useMemo(() => {
    const totalTasks = plan ? plan.schedule.filter(t => t.type !== "break" && t.type !== "skip").length : 0;
    const completedCount = Object.values(completedTasks).filter(Boolean).length;
    return [
      { id: "plan-fused", label: "Plan Fused", desc: "Strategy compiled by Gemini model", unlocked: !!plan, icon: "🛡️" },
      { id: "first-step", label: "First Step", desc: "Checked first timeline block", unlocked: completedCount >= 1, icon: "⚡" },
      { id: "recall-prodigy", label: "Recall Prodigy", desc: "Memorized 3+ flashcards", unlocked: flashcardCount >= 3, icon: "📚" },
      { id: "viva-champion", label: "Viva Survivor", desc: "Scored 80+ in simulator", unlocked: vivaScore >= 80, icon: "🎤" },
      { id: "survival-complete", label: "Ultimate Survivor", desc: "Checked all timeline tasks", unlocked: totalTasks > 0 && completedCount === totalTasks, icon: "🏁" }
    ];
  }, [plan, completedTasks, flashcardCount, vivaScore]);

  const filteredQuestions = useMemo(() => {
    if (!plan || !plan.practiceQuestions) return [];
    if (activeQuestionFilter === "All") return plan.practiceQuestions;
    return plan.practiceQuestions.filter(q => q.type === activeQuestionFilter);
  }, [plan, activeQuestionFilter]);

  const aiMessage=useMemo(()=>{
    if(!plan)return"";
    return(
      (plan.introMessage || "") + "\n\n" +
      (plan.harshTruths?.slice(0,2).join(" ")??"") +
      (plan.tacticalTip?`\n\n💡 ${plan.tacticalTip}`:"")
    );
  },[plan]);

  const {displayed,done}=useTypewriter(aiMessage,12);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | null = null;

    const initAuth = async () => {
      const { supabase } = await import("@/lib/supabase");
      const { saveSession } = await import("@/lib/auth");

      // 1. Check current Supabase session directly first (source of truth)
      const { data: { user } } = await supabase.auth.getUser();
      let s = null;
      if (user) {
        s = {
          email: user.email!,
          fullName: user.user_metadata?.full_name || user.user_metadata?.name || user.email || "",
          photo: typeof user.user_metadata?.avatar_url === "string" && user.user_metadata.avatar_url.trim()
            ? user.user_metadata.avatar_url.trim()
            : typeof user.user_metadata?.picture === "string" && user.user_metadata.picture.trim()
              ? user.user_metadata.picture.trim()
              : "",
          id: user.id
        };
        saveSession(s);
        if (active) setSession(s);
      } else {
        // If Supabase has no user session (e.g. email unconfirmed), clear local and redirect
        clearSession();
        if (active) router.replace("/login");
        return;
      }

      // 2. Set up a listener for auth state changes (helps parse OAuth redirect hash async)
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!active) return;
        if (session?.user) {
          const u = session.user;
          const syncedSession = {
            email: u.email!,
            fullName: u.user_metadata?.full_name || u.user_metadata?.name || u.email || "",
            photo: typeof u.user_metadata?.avatar_url === "string" && u.user_metadata.avatar_url.trim()
              ? u.user_metadata.avatar_url.trim()
              : typeof u.user_metadata?.picture === "string" && u.user_metadata.picture.trim()
                ? u.user_metadata.picture.trim()
                : "",
            id: u.id
          };
          saveSession(syncedSession);
          setSession(syncedSession);
        } else if (event === "SIGNED_OUT") {
          localStorage.removeItem("kyxun_session");
          router.replace("/login");
        }
      });
      
      unsubscribe = authListener.subscription.unsubscribe;

      // 3. Give the hash parser a brief window to resolve the session before redirecting
      setTimeout(async () => {
        if (!active) return;
        const currentSession = getSession();
        if (!currentSession) {
          router.replace("/login");
        }
      }, 800);
    };

    initAuth();

    return () => {
      active = false;
      if (unsubscribe) unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (!session || !session.id) return;
    const userId = session.id;
    
    const loadLatestPlan = async () => {
      try {
        const { analysisService } = await import("@/lib/services/analysisService");
        const latestPlan = await analysisService.getLatestStudyPlan(userId);
        if (latestPlan) {
          setPlan({ ...latestPlan.plan_data, id: latestPlan.id });
          setDays(latestPlan.days.toString());
          setHours(latestPlan.hours_per_day.toString());
          setSubject(latestPlan.subject);
          setTotalChapters(latestPlan.total_chapters.toString());
          setCompletedChapters(latestPlan.completed_chapters.toString());
          setGoal(latestPlan.goal);
          setCompletedTasks(latestPlan.plan_data.completedTasks || {});
          setPageState("result");

          // Fetch real flashcards to calculate mastered count
          try {
            const { flashcardService } = await import("@/lib/services/flashcardService");
            const cards = await flashcardService.getFlashcards(userId, latestPlan.id);
            const masteredCount = cards.filter((c: any) => c.isMastered).length;
            setFlashcardCount(masteredCount);
          } catch (fcErr) {
            console.warn("Failed to load flashcards on mount:", fcErr);
          }

          // Fetch real viva attempts to calculate average accuracy score
          try {
            const { vivaService } = await import("@/lib/services/vivaService");
            const attempts = await vivaService.getVivaAttempts(userId, latestPlan.id);
            if (attempts.length > 0) {
              const avgScore = Math.round(attempts.reduce((sum: number, att: { accuracy_score: number }) => sum + att.accuracy_score, 0) / attempts.length);
              setVivaScore(avgScore);
            } else {
              setVivaScore(0);
            }
          } catch (vivaErr) {
            console.warn("Failed to load viva attempts on mount:", vivaErr);
          }
        }
      } catch (err) {
        console.warn("Failed to load latest plan on mount:", err);
      }
    };
    
    loadLatestPlan();
  }, [session]);

  useEffect(() => {
    if (!session?.id || !plan?.id) return;
    const userId = session.id;
    const planId = plan.id;
    
    const syncReadiness = async () => {
      try {
        const { calculateReadiness } = await import("@/lib/readiness");
        const nextStats = calculateReadiness({
          plan,
          totalChapters: parseInt(totalChapters) || 0,
          completedChapters: parseInt(completedChapters) || 0,
          completedTasks,
          vivaScore,
          flashcardCount,
          uploadedFilesCount: uploadedSyllabusFiles.length + uploadedPyqFiles.length
        });
        const { readinessService } = await import("@/lib/services/readinessService");
        await readinessService.saveReadinessScore(userId, planId, nextStats);
      } catch (e) {
        console.warn("Failed to auto-sync readiness score to Supabase:", e);
      }
    };
    
    const timeout = setTimeout(syncReadiness, 1000);
    return () => clearTimeout(timeout);
  }, [completedTasks, vivaScore, flashcardCount, session, plan, totalChapters, completedChapters, uploadedSyllabusFiles.length, uploadedPyqFiles.length]);
  
  useEffect(()=>{
    if(pageState!=="analyzing")return;
    const iv=setInterval(()=>setMsgIndex(i=>(i+1)%analyzingMessages.length),1200);
    return()=>clearInterval(iv);
  },[pageState]);

  // Exam Live Countdown Timer Effect
  const [countdownText, setCountdownText] = useState("");
  useEffect(() => {
    if (!plan || pageState !== "result") return;
    const studyDays = parseInt(days) || 2;
    // Target is now + studyDays
    const targetTime = Date.now() + studyDays * 24 * 60 * 60 * 1000;
    
    const interval = setInterval(() => {
      const remaining = targetTime - Date.now();
      if (remaining <= 0) {
        setCountdownText("00d : 00h : 00m : 00s");
        clearInterval(interval);
        return;
      }
      const d = Math.floor(remaining / (24 * 60 * 60 * 1000));
      const h = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const m = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      const s = Math.floor((remaining % (60 * 1000)) / 1000);
      
      const pad = (num: number) => String(num).padStart(2, "0");
      setCountdownText(`${pad(d)}d : ${pad(h)}h : ${pad(m)}m : ${pad(s)}s`);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [plan, pageState, days]);

  const handleSyllabusFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const nf: UploadedFile[] = Array.from(e.target.files).map(f => ({
      id: Math.random().toString(36).slice(2), file: f, name: f.name,
      size: (f.size / 1024 / 1024).toFixed(2) + " MB", isImage: f.type.startsWith("image/"),
      previewUrl: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
    }));
    setUploadedSyllabusFiles(p => [...p, ...nf]); e.target.value = "";
  };

  const removeSyllabusFile = (id: string) => {
    setUploadedSyllabusFiles(p => { const f = p.find(x => x.id === id); if (f?.previewUrl) URL.revokeObjectURL(f.previewUrl); return p.filter(x => x.id !== id); });
  };

  const handlePyqFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const nf: UploadedFile[] = Array.from(e.target.files).map(f => ({
      id: Math.random().toString(36).slice(2), file: f, name: f.name,
      size: (f.size / 1024 / 1024).toFixed(2) + " MB", isImage: f.type.startsWith("image/"),
      previewUrl: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
    }));
    setUploadedPyqFiles(p => [...p, ...nf]); e.target.value = "";
  };

  const removePyqFile = (id: string) => {
    setUploadedPyqFiles(p => { const f = p.find(x => x.id === id); if (f?.previewUrl) URL.revokeObjectURL(f.previewUrl); return p.filter(x => x.id !== id); });
  };

  const handlePyqAnalysisChange = (data: PYQAnalysisData | null) => {
    setPlan(prev => {
      if (!prev) return null;
      return { ...prev, pyqAnalysis: data || undefined };
    });
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadedSyllabusFiles.length === 0) {
      setError("Please upload syllabus photos or files to begin the AI analysis.");
      return;
    }
    setError(""); setPageState("analyzing"); setMsgIndex(0);
    try {
      const fd = new FormData();
      fd.append("days", days); fd.append("hours", hours); fd.append("subject", subject);
      fd.append("totalChapters", totalChapters); fd.append("completedChapters", completedChapters);
      fd.append("goal", goal);
      uploadedSyllabusFiles.forEach(uf => fd.append("syllabusFiles", uf.file));
      uploadedPyqFiles.forEach(uf => fd.append("pyqFiles", uf.file));
      
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: fd,
        headers: session?.id ? { "x-user-id": session.id } : {}
      });
      const rawResponseText = await res.text();
      let data: any = null;
      try {
        data = rawResponseText ? JSON.parse(rawResponseText) : null;
      } catch (parseError) {
        console.error("[PlanPage] /api/analyze response JSON parse failed", {
          status: res.status,
          statusText: res.statusText,
          rawResponseText,
          parseError,
        });
      }
      if (!res.ok) {
        console.error("[PlanPage] /api/analyze failed", {
          status: res.status,
          statusText: res.statusText,
          parsedBody: data,
          rawResponseText,
        });
        const backendMessage = data?.details || data?.error?.message || data?.error || data?.message || rawResponseText;
        throw new Error(backendMessage || "Failed to compile study plan. Please verify uploads.");
      }
      setPlan(data);
      setCompletedTasks({}); // Reset completed tasks on new plan
      setUserAnswers({}); // Reset practice answers on new plan
      setPageState("loading-sequence");
    } catch (error) {
      console.error("[PlanPage] study plan compilation exception", error);
      setError(error instanceof Error ? error.message : "Failed to compile study plan. Please verify uploads.");
      setPageState("form");
    }
  };

  const handleLogout=()=>{clearSession();router.push("/");};

  const toggleTask = async (taskId: string) => {
    const wasCompleted = !!completedTasks[taskId];
    const nextState = { ...completedTasks, [taskId]: !wasCompleted };
    
    setCompletedTasks(nextState);
    
    // Update Streak and Heatmap if checking off task
    if (!wasCompleted) {
      setStreakCount(s => s + 1);
      setHeatmapGrid(h => {
        const updated = [...h];
        updated[27] = Math.min(3, (updated[27] || 0) + 1);
        return updated;
      });
    } else {
      setStreakCount(s => Math.max(0, s - 1));
    }

    if (session?.id && plan?.id) {
      try {
        const { supabase } = await import("@/lib/supabase");
        await supabase
          .from("study_plans")
          .update({ plan_data: { ...plan, completedTasks: nextState } })
          .eq("id", plan.id);
      } catch (e) {
        console.warn("Failed to sync task toggle to Supabase:", e);
      }
    }
  };

  // Recalculated dynamic readiness
  const statsMetrics = useMemo(() => {
    if (!plan) return { readiness: 0, coverage: 0, completedCount: 0, totalTasks: 0 };
    const tasks = plan.schedule.filter(t => t.type !== "break" && t.type !== "skip");
    const total = tasks.length;
    const completed = tasks.filter((_, idx) => completedTasks[`task-${idx}`]).length;
    const baseProb = plan.passProbability || 50;
    
    // Linearly scale readiness towards 100% based on checked tasks
    const coverage = total ? Math.round((completed / total) * 100) : 0;
    const readiness = Math.min(100, Math.round(baseProb + (100 - baseProb) * (completed / Math.max(1, total))));
    
    return {
      readiness,
      coverage,
      completedCount: completed,
      totalTasks: total
    };
  }, [plan, completedTasks]);

  const typeColors: Record<string, string> = {
    urgent: "border-red-500 bg-red-500/10 text-red-400",
    focus: "border-purple-500 kyxun-badge-indigo ",
    break: "border-green-500 bg-green-500/10 text-green-400",
    skip: "border-gray-500 bg-gray-500/10 text-gray-400 line-through"
  };

  if (!session) return null;
  const isDark = theme === "dark";

  return(
    <main id="main-content" className="min-h-screen kyxun-page">

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-[#EC4899]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#EC4899]">Study Plans</span>
          </div>
          <h1 className="font-outfit text-2xl font-black kyxun-text">
            Prepare the Exam Plan with Kyxun
          </h1>
        </div>
        
        <div className="flex flex-col">
          <AnimatePresence mode="wait">

          {/* FORM STATE (Modern Workspace onboarding panel) */}
          {pageState === "form" && (
            <motion.div key="form" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -25, filter: "blur(6px)" }} transition={{ duration: 0.4 }} className="max-w-2xl mx-auto w-full">
              <div className="glass-panel rounded-3xl relative overflow-hidden glass-panel-glow">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-[var(--kyxun-accent)]"/>
                <div className="p-8 sm:p-12">
                  <span className="text-[10px] font-bold uppercase tracking-widest   kyxun-badge-indigo px-3 py-1 rounded-full">Preparation Wizard</span>
                  <h1 className="font-outfit text-3xl font-black mt-4 mb-2 tracking-tight kyxun-text">Target Parameters</h1>
                  <p className="kyxun-text-muted mb-8 text-sm font-normal">Input your academic timeline. All scheduling is calibrated dynamically.</p>
                  
                  {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-xs font-mono">{error}</div>}
                  
                  <form onSubmit={handleAnalyze} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider kyxun-text-muted">Days until exam</label>
                        <input type="number" min="1" max="14" value={days} onChange={e=>setDays(e.target.value)} className="input-field" required/>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider kyxun-text-muted">Daily study hours</label>
                        <input type="number" min="1" max="18" value={hours} onChange={e=>setHours(e.target.value)} className="input-field" required/>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider kyxun-text-muted">Subject / Module Title</label>
                      <input type="text" placeholder="e.g. Advanced Quantum Mechanics, Corporate Law" value={subject} onChange={e=>setSubject(e.target.value)} className="input-field" required/>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider kyxun-text-muted">Total Syllabus Units</label>
                        <input type="number" min="1" value={totalChapters} onChange={e=>setTotalChapters(e.target.value)} className="input-field" required/>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider kyxun-text-muted">Units Completed</label>
                        <input type="number" min="0" value={completedChapters} onChange={e=>setCompletedChapters(e.target.value)} className="input-field" required/>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <label className="text-xs font-bold uppercase tracking-wider kyxun-text-muted">Target Objective</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {["Just Pass (Survival)", "Score Well (Excellence)"].map(g=>(
                          <label key={g} className="flex items-center gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all hover:bg-[var(--kyxun-hover-bg)]" style={goal===g?{borderColor:"var(--kyxun-accent)",background:"rgba(132,204,22,0.08)"}:{borderColor:"var(--kyxun-border)",background:"var(--kyxun-input-bg)"}}>
                            <input type="radio" name="goal" value={g} checked={goal===g} onChange={()=>setGoal(g)} className="sr-only"/>
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center transition-all shrink-0 ${goal === g ? 'bg-[var(--kyxun-accent)]' : 'border border-[var(--kyxun-text-muted)] bg-transparent'}`}>
                              {goal === g && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                            <span className="text-xs font-bold kyxun-text">{g}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Syllabus Ingestor */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-wider kyxun-text-muted">Upload Syllabus / Materials <span className="text-red-500">*</span></label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button type="button" onClick={()=>syllabusCameraInputRef.current?.click()}
                          className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl transition-all group cursor-pointer border border-[var(--kyxun-border)] bg-[var(--kyxun-input-bg)] hover:kyxun-border hover:bg-[var(--kyxun-hover-bg)]">
                          <Camera className="w-6 h-6   group-hover:scale-105 transition-transform"/>
                          <div className="text-center"><p className="text-xs font-bold kyxun-text">Camera Capture</p><p className="text-[10px] kyxun-text-muted mt-1">Scan sheet using camera</p></div>
                        </button>
                        <input type="file" accept="image/*" capture="environment" className="hidden" ref={syllabusCameraInputRef} onChange={handleSyllabusFileSelect}/>

                        <button type="button" onClick={()=>syllabusFileInputRef.current?.click()}
                          className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl transition-all group cursor-pointer border border-[var(--kyxun-border)] bg-[var(--kyxun-input-bg)] hover:kyxun-border hover:bg-[var(--kyxun-hover-bg)]">
                          <UploadCloud className="w-6 h-6   group-hover:scale-105 transition-transform"/>
                          <div className="text-center"><p className="text-xs font-bold kyxun-text">File Upload</p><p className="text-[10px] kyxun-text-muted mt-1">PDF, DOCX, TXT, Images</p></div>
                        </button>
                        <input type="file" accept="image/*,.pdf,.doc,.docx,.txt,.csv" multiple className="hidden" ref={syllabusFileInputRef} onChange={handleSyllabusFileSelect}/>
                      </div>
                    </div>

                    {uploadedSyllabusFiles.length>0&&(
                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider kyxun-text-muted">Target Syllabus Inventory</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {uploadedSyllabusFiles.map(uf=>(
                            <div key={uf.id} className="flex items-center justify-between p-3 rounded-xl border kyxun-border bg-[var(--kyxun-hover-bg)]">
                              <div className="flex items-center gap-2.5 min-w-0">
                                {uf.isImage?<ImageIcon className="w-4 h-4   shrink-0"/>:<FileText className="w-4 h-4   shrink-0"/>}
                                <div className="min-w-0">
                                  <p className="text-xs font-bold kyxun-text truncate">{uf.name}</p>
                                  <p className="text-[10px] kyxun-text-muted">{uf.size}</p>
                                </div>
                              </div>
                              <button type="button" onClick={()=>removeSyllabusFile(uf.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 kyxun-text-muted hover:text-red-400 transition-all cursor-pointer">
                                <Trash2 className="w-4 h-4"/>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* PYQ Ingestor */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-wider kyxun-text-muted">Upload Previous Year Question Papers (PYQs) <span className="kyxun-text-muted font-normal">(Optional)</span></label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button type="button" onClick={()=>pyqCameraInputRef.current?.click()}
                          className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl transition-all group cursor-pointer border border-[var(--kyxun-border)] bg-[var(--kyxun-input-bg)] hover:kyxun-border hover:bg-[var(--kyxun-hover-bg)]">
                          <Camera className="w-6 h-6   group-hover:scale-105 transition-transform"/>
                          <div className="text-center"><p className="text-xs font-bold kyxun-text">Camera Capture</p><p className="text-[10px] kyxun-text-muted mt-1">Scan sheet using camera</p></div>
                        </button>
                        <input type="file" accept="image/*" capture="environment" className="hidden" ref={pyqCameraInputRef} onChange={handlePyqFileSelect}/>

                        <button type="button" onClick={()=>pyqFileInputRef.current?.click()}
                          className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl transition-all group cursor-pointer border border-[var(--kyxun-border)] bg-[var(--kyxun-input-bg)] hover:kyxun-border hover:bg-[var(--kyxun-hover-bg)]">
                          <UploadCloud className="w-6 h-6   group-hover:scale-105 transition-transform"/>
                          <div className="text-center"><p className="text-xs font-bold kyxun-text">File Upload</p><p className="text-[10px] kyxun-text-muted mt-1">PDF, DOCX, TXT, Images</p></div>
                        </button>
                        <input type="file" accept="image/*,.pdf,.doc,.docx,.txt,.csv" multiple className="hidden" ref={pyqFileInputRef} onChange={handlePyqFileSelect}/>
                      </div>
                    </div>

                    {uploadedPyqFiles.length>0&&(
                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider kyxun-text-muted">Target PYQ Inventory</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {uploadedPyqFiles.map(uf=>(
                            <div key={uf.id} className="flex items-center justify-between p-3 rounded-xl border kyxun-border bg-[var(--kyxun-hover-bg)]">
                              <div className="flex items-center gap-2.5 min-w-0">
                                {uf.isImage?<ImageIcon className="w-4 h-4   shrink-0"/>:<FileText className="w-4 h-4   shrink-0"/>}
                                <div className="min-w-0">
                                  <p className="text-xs font-bold kyxun-text truncate">{uf.name}</p>
                                  <p className="text-[10px] kyxun-text-muted">{uf.size}</p>
                                </div>
                              </div>
                              <button type="button" onClick={()=>removePyqFile(uf.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 kyxun-text-muted hover:text-red-400 transition-all cursor-pointer">
                                <Trash2 className="w-4 h-4"/>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button type="submit" id="analyze-btn" className="w-full py-4 rounded-xl font-extrabold text-white bg-[#65A30D] transition-all mt-4 cursor-pointer flex items-center justify-center gap-2">
                      {uploadedSyllabusFiles.length > 0 ? "Compile Target Parameters" : "Generate Study Schedule"}
                      <Zap className="w-4.5 h-4.5 fill-current"/>
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          )}

          {/* ANALYZING STATE (Radar-like scanning dashboard) */}
          {pageState === "analyzing" && (
            <motion.div key="analyzing" role="status" aria-live="polite" aria-label="Compiling schedule parameters" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-28 text-center max-w-md mx-auto">
              <div className="relative w-32 h-32 mb-10 flex items-center justify-center">
                {/* Simulated Radar Scanner Glows */}
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border-t border-indigo-500/40 border-r border-transparent" />
                <motion.div animate={{ rotate: -360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute inset-2 rounded-full border-b border-purple-500/40 border-l border-transparent" />
                <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-4 rounded-full border border-blue-500/20 bg-indigo-500/5" />
                <BrainCircuit className="w-10 h-10   animate-pulse relative z-10" />
              </div>
              <motion.p key={msgIndex} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="font-outfit text-lg font-black kyxun-text mb-2">{analyzingMessages[msgIndex]}</motion.p>
              <p className="kyxun-text-muted text-xs font-mono tracking-widest uppercase">Gemini Volatile Cache</p>
            </motion.div>
          )}

          {/* PREMIUM LOADING SEQUENCE STATE */}
          {pageState === "loading-sequence" && (
            <motion.div key="loading-sequence" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-md mx-auto w-full">
              <div className="glass-panel rounded-3xl p-8 sm:p-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 animate-pulse" />
                
                <h3 className="font-outfit text-xl font-black kyxun-text mb-6 text-center tracking-tight flex items-center justify-center gap-2">
                  <BrainCircuit className="w-5 h-5   animate-spin" />
                  Building Exam Survival Kit...
                </h3>

                <div className="space-y-4 font-mono text-xs">
                  {loadingSteps.map((step, idx) => {
                    const isCompleted = idx < loadingStepIndex;
                    const isActive = idx === loadingStepIndex;
                    const opacity = isCompleted ? "text-emerald-400 font-bold" : isActive ? "kyxun-text animate-pulse font-bold" : "kyxun-text-muted";
                    
                    return (
                      <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, x: -5 }} 
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`flex items-center gap-3.5 ${opacity}`}
                      >
                        {isCompleted ? (
                          <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[10px] text-emerald-400 font-bold shrink-0">
                            ✓
                          </div>
                        ) : isActive ? (
                          <div className="w-4 h-4 rounded-full border border-indigo-400 border-t-transparent animate-spin shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-[var(--kyxun-hover-bg)] border kyxun-border flex items-center justify-center text-[10px] kyxun-text-muted shrink-0">
                            •
                          </div>
                        )}
                        <span>{step}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* MISSION COMPLETE SCREEN */}
          {pageState === "mission-complete" && plan && (
            <motion.div key="mission-complete" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto w-full">
              <div className="glass-panel rounded-3xl p-8 sm:p-12 relative overflow-hidden glass-panel-glow text-center">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500 animate-pulse" />
                
                {/* Glowing check circle */}
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>

                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 rounded-full">
                  Mission Complete
                </span>
                
                <h1 className="font-outfit text-3xl font-black mt-4 mb-2 tracking-tight kyxun-text">
                  Exam Survival Kit Ready
                </h1>
                
                <p className="kyxun-text-muted mb-8 text-xs max-w-sm mx-auto">
                  AI compiler has mapped your syllabus against past papers and compiled prep materials. Launch any module below.
                </p>

                {/* Modules Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {[
                    { title: "Study Plan Generated", desc: "Timeline hourly strategy blocks", tab: "timeline", icon: Calendar, color: " " },
                    { title: "Flashcards Ready", desc: `${plan.flashcards?.length || 6} active recall cards compiled`, tab: "flashcards", icon: BookOpen, color: " " },
                    { title: "Practice Questions Ready", desc: "10 exam-quality test sheets ready", tab: "practice", icon: Award, color: "text-emerald-400" },
                    { title: "Revision Notes Ready", desc: "Key concepts, formulas, mnemonics", tab: "notes", icon: FileText, color: "text-blue-400" },
                    { title: "Readiness Analysis Complete", desc: "Calibrated passing odds & telemetry", tab: "overview", icon: LayoutDashboard, color: " " }
                  ].map((module, i) => {
                    const Icon = module.icon;
                    return (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-panel p-4 rounded-2xl border kyxun-border bg-[var(--kyxun-hover-bg)] hover:kyxun-border transition-all flex flex-col justify-between text-left"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-xl bg-[var(--kyxun-hover-bg)] border kyxun-border ${module.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold kyxun-text">{module.title}</h4>
                            <p className="text-[10px] kyxun-text-muted mt-0.5">{module.desc}</p>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => openModule(module.tab as ActiveTab)}
                          className="mt-4 w-full py-2 rounded-xl bg-[var(--kyxun-hover-bg)] border kyxun-border hover:bg-[var(--kyxun-hover-bg)] kyxun-text font-bold text-[10px] tracking-wide uppercase transition-all cursor-pointer text-center"
                        >
                          Launch Module
                        </button>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Primary console entry CTA */}
                <button 
                  type="button" 
                  onClick={() => openModule("overview")}
                  className="px-8 py-3.5 rounded-xl kyxun-text font-extrabold text-xs transition-all shadow-lg hover:shadow-indigo-500/15 cursor-pointer"
                  style={{ background: "linear-gradient(135deg, var(--kyxun-accent), var(--kyxun-accent-secondary))" }}
                >
                  Enter Prep Console
                </button>
              </div>
            </motion.div>
          )}

          {/* RESULT STATE (Funded AI Startup Dashboard layout) */}
          {pageState === "result" && plan && (
            <motion.div key="result" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="w-full flex flex-col md:grid md:grid-cols-[240px_1fr] gap-6 items-start">
              
              {/* Dashboard Side Navigation Panel */}
              <aside className="w-full md:sticky md:top-20 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 shrink-0 border-b md:border-b-0 md:border-r kyxun-border md:pr-4">
                <div className="hidden md:flex items-center gap-2 px-3 pb-4 mb-2 border-b kyxun-border">
                  <Flame className="w-4 h-4  " />
                  <span className="text-xs font-bold uppercase tracking-widest kyxun-text-muted">Plan Console</span>
                </div>
                
                {[
                  { id: "overview", label: "Overview", icon: LayoutDashboard },
                  { id: "timeline", label: "Timeline Feed", icon: Calendar },
                  { id: "viva", label: "Viva Simulator", icon: Mic },
                  { id: "analyzer", label: "Paper Scanner", icon: Search },
                  { id: "flashcards", label: "Flashcard Deck", icon: BookOpen },
                  { id: "notes", label: "AI Study Notes", icon: FileText },
                  { id: "practice", label: "Practice Test", icon: Award }
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as ActiveTab)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        isActive 
                          ? "bg-[var(--kyxun-hover-bg)] kyxun-text border kyxun-border shadow-sm" 
                          : "kyxun-text-muted hover:kyxun-text hover:bg-[var(--kyxun-hover-bg)] border border-transparent"
                      }`}
                    >
                      <Icon className="w-4.5 h-4.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}

                <div className="hidden md:block mt-8 pt-4 border-t kyxun-border">
                  <button 
                    type="button"
                    onClick={() => { setPageState("form"); setPlan(null); }} 
                    className="w-full py-2.5 rounded-xl border kyxun-border text-xs kyxun-text-muted font-bold hover:bg-[var(--kyxun-hover-bg)] hover:kyxun-text transition-all cursor-pointer text-center"
                  >
                    Adjust Plan
                  </button>
                </div>
              </aside>

              {/* Central Workspace */}
              <section className="flex-1 w-full min-w-0 space-y-6">

                {/* Dashboard Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b kyxun-border pb-4">
                  <div>
                    <h2 className="font-outfit text-2xl font-black kyxun-text">{subject} prep console</h2>
                    <p className="text-xs kyxun-text-muted mt-0.5">Custom layout configured for {days} days remaining ({hours}h/day)</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => window.print()} className="px-4 py-2 rounded-xl border kyxun-border bg-[var(--kyxun-hover-bg)] hover:bg-[var(--kyxun-hover-bg)] kyxun-text font-bold text-xs transition-all cursor-pointer">
                      Export Plan
                    </button>
                    <Link
                      href="/chat"
                      onClick={() => {
                        const fd = new FormData();
                        fd.append("days", days);
                        fd.append("hours", hours);
                        fd.append("subject", subject);
                        fd.append("totalChapters", totalChapters);
                        fd.append("completedChapters", completedChapters);
                        fd.append("goal", goal);
                        uploadedSyllabusFiles.forEach(uf => fd.append("syllabusFiles", uf.file));
                        uploadedPyqFiles.forEach(uf => fd.append("pyqFiles", uf.file));
                        sharedData.pendingChatForm = fd;
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/10 transition-all flex items-center gap-1.5"
                    >
                      <BrainCircuit className="w-4 h-4" /> Chat Co-pilot
                    </Link>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  
                  {/* TAB 1: OVERVIEW */}
                  {activeTab === "overview" && (
                    <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                          {/* Top Metrics Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        
                        {/* Exam Live Countdown Widget */}
                        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--kyxun-hover-bg)] rounded-full blur-xl pointer-events-none" />
                          <span className="text-[10px] uppercase font-bold kyxun-text-muted tracking-wider">Exam Countdown</span>
                          
                          <div className="py-4">
                            <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight kyxun-text animate-pulse">
                              {countdownText || `${days}d : 00h : 00m : 00s`}
                            </p>
                            <p className="text-[10px] kyxun-text-muted mt-1 font-mono uppercase tracking-wider">Time remaining to study</p>
                          </div>

                          <div className="p-3.5 rounded-2xl bg-[var(--kyxun-hover-bg)] border kyxun-border text-xs kyxun-text-muted">
                            <span className="font-bold  ">IST Timing Mode:</span> Calibrated to Indian Standard Time (IST) 12-hour slots.
                          </div>
                        </div>

                        {/* Study Streak Tracker */}
                        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--kyxun-hover-bg)] rounded-full blur-xl pointer-events-none" />
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold kyxun-text-muted tracking-wider">Retention Streak</span>
                            <span className="flex items-center gap-1 text-orange-400 font-black text-sm">
                              <Flame className="w-4 h-4 fill-current animate-bounce" /> {streakCount} Days
                            </span>
                          </div>

                          {/* GitHub-style retention density tracker grid */}
                          <div className="py-2">
                            <p className="text-[10px] kyxun-text-muted mb-2 font-bold uppercase tracking-wider">Consistency Matrix</p>
                            <div className="grid grid-cols-7 gap-1.5 max-w-[170px]">
                              {heatmapGrid.map((val, i) => {
                                const opacity = val === 0 ? "bg-[var(--kyxun-hover-bg)]" : val === 1 ? "bg-indigo-900/40" : val === 2 ? "bg-indigo-600/70" : "bg-purple-500";
                                return (
                                  <div 
                                    key={i} 
                                    className={`w-3.5 h-3.5 rounded-sm ${opacity} border kyxun-border transition-all`} 
                                    title={`Activity level: ${val}`}
                                  />
                                );
                              })}
                            </div>
                          </div>

                          <p className="text-[9px] kyxun-text-muted">Checked timeline tasks increment grid density.</p>
                        </div>
                      </div>

                      {/* Exam Readiness Engine Dashboard Widget */}
                      <ReadinessDashboard 
                        plan={plan}
                        totalChapters={parseInt(totalChapters) || 0}
                        completedChapters={parseInt(completedChapters) || 0}
                        completedTasks={completedTasks}
                        vivaScore={vivaScore}
                        flashcardCount={flashcardCount}
                        uploadedFilesCount={uploadedSyllabusFiles.length + uploadedPyqFiles.length}
                      />

                      {/* Copilot Greeting Message */}
                      <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500" />
                        <div className="flex items-start gap-4">
                          <div className=" text-white bg-[var(--kyxun-accent)]">
                            <Sparkles className="w-4.5 h-4.5 kyxun-text" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-widest   mb-1.5">Survival Strategist AI</p>
                            <p className="text-xs leading-relaxed kyxun-text-muted whitespace-pre-line font-medium">
                              {displayed}
                              {!done && <span className="inline-block w-0.5 h-3.5 ml-0.5 animate-blink align-middle bg-indigo-500" />}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Achievements & Milestones */}
                      <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-4">
                          <Flame className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
                          <h3 className="text-xs font-bold kyxun-text uppercase tracking-wider">Performance Milestones</h3>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          {achievements.map((ach) => (
                            <div 
                              key={ach.id} 
                              className={`p-3.5 rounded-2xl border transition-all flex flex-col items-center text-center justify-between min-h-[140px] ${
                                ach.unlocked 
                                  ? "border-amber-500/35 bg-amber-500/5 kyxun-text shadow-md shadow-amber-500/5" 
                                  : "kyxun-border bg-[var(--kyxun-hover-bg)] opacity-35"
                              }`}
                            >
                              <span className="text-3xl filter-none">{ach.icon}</span>
                              <div className="mt-2.5">
                                <h4 className="text-[11px] font-bold kyxun-text truncate max-w-[110px]">{ach.label}</h4>
                                <p className="text-[9px] kyxun-text-muted mt-1 leading-normal font-medium">{ach.desc}</p>
                              </div>
                              <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-3 border ${
                                ach.unlocked ? "border-amber-500/20 bg-amber-500/10  " : "kyxun-border bg-[var(--kyxun-hover-bg)] kyxun-text-muted"
                              }`}>
                                {ach.unlocked ? "Unlocked" : "Locked"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Priorities & Skips */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="glass-panel rounded-3xl p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <Target className="w-4 h-4 text-green-400" />
                            <p className="text-xs font-bold text-green-400 uppercase tracking-widest">High-Yield Must Study</p>
                          </div>
                          <ul className="space-y-2.5">
                            {plan.mustStudy.map((t,i)=>(
                              <li key={i} className="flex items-start gap-2.5 text-xs kyxun-text-muted font-medium">
                                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                <span>{t}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="glass-panel rounded-3xl p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <Skull className="w-4 h-4 text-red-400" />
                            <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Skip Blocks (Low Weight)</p>
                          </div>
                          <ul className="space-y-2.5 mb-4">
                            {plan.shouldSkip.map((t,i)=>(
                              <li key={i} className="flex items-start gap-2.5 text-xs kyxun-text-muted line-through font-medium">
                                <Skull className="w-4 h-4 kyxun-text-muted shrink-0 mt-0.5 no-underline" />
                                <span>{t}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">💡 Tactical Instruction</p>
                            <p className="text-[11px] kyxun-text-muted leading-relaxed font-medium">{plan.tacticalTip}</p>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Visual Analytics Row */}
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.1fr] gap-4">
                        
                        {/* Concept Security Analyzer (Weak Topics) */}
                        <div className="glass-panel rounded-3xl p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4.5 h-4.5  " />
                              <h3 className="text-xs font-bold kyxun-text uppercase tracking-wider">Concept Security</h3>
                            </div>
                            <span className="text-[10px] kyxun-text-muted">Weight mapping</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[170px] overflow-y-auto pr-1">
                            {plan.mustStudy.map((topic, i) => (
                              <div key={i} className="p-3 rounded-xl border kyxun-border bg-[var(--kyxun-hover-bg)] flex flex-col justify-between">
                                <span className="text-[9px] font-bold kyxun-text-muted truncate">Topic {i+1}</span>
                                <h4 className="text-xs font-bold kyxun-text mt-1 mb-2.5 truncate" title={topic}>{topic}</h4>
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px]   font-bold kyxun-badge-indigo px-2 py-0.5 rounded-full">High Yield</span>
                                  <span className="text-[9px] text-red-400 font-bold font-mono">Unsolved</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Cognitive Productivity Chart (SVG Focus decay curve) */}
                        <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--kyxun-hover-bg)] rounded-full blur-xl pointer-events-none" />
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <BrainCircuit className="w-4.5 h-4.5   animate-pulse" />
                              <h3 className="text-xs font-bold kyxun-text uppercase tracking-wider">AI Productivity Curve</h3>
                            </div>
                            <span className="text-[10px]   font-bold">Focus Decay Reset</span>
                          </div>

                          <div className="h-28 flex items-center justify-center bg-black/30 border kyxun-border rounded-2xl p-2 relative">
                            <svg className="w-full h-full" viewBox="0 0 280 80">
                              <line x1="20" y1="10" x2="20" y2="70" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                              <line x1="20" y1="70" x2="270" y2="70" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                              
                              <path 
                                d="M 20 15 Q 100 65 260 68" 
                                fill="transparent" 
                                stroke="#f43f5e" 
                                strokeWidth="1.5" 
                                strokeDasharray="3,3" 
                              />
                              
                              <path 
                                d="M 20 15 L 80 35 L 82 20 L 140 38 L 142 22 L 200 40 L 202 24 L 260 42" 
                                fill="transparent" 
                                stroke="#10b981" 
                                strokeWidth="2" 
                              />
                              
                              <circle cx="210" cy="15" r="3" fill="#10b981" />
                              <text x="217" y="18" fill="rgba(255,255,255,0.5)" fontSize="6" className="font-mono">Kyxun</text>
                              
                              <circle cx="210" cy="25" r="3" fill="#f43f5e" />
                              <text x="217" y="28" fill="rgba(255,255,255,0.5)" fontSize="6" className="font-mono">No-Break</text>
                              
                              <text x="260" y="77" fill="rgba(255,255,255,0.2)" fontSize="6" textAnchor="end" className="font-mono">Study Hours →</text>
                              <text x="8" y="14" fill="rgba(255,255,255,0.2)" fontSize="6" textAnchor="start" className="font-mono">Focus ↑</text>
                            </svg>
                          </div>
                          
                          <p className="text-[9px] kyxun-text-muted mt-3 leading-normal font-medium">
                            Tactical breaks scheduled on your timeline maintain memory retention above the fatigue baseline.
                          </p>
                        </div>

                      </div>

                    </motion.div>
                  )}

                  {/* TAB 2: TIMELINE FEED */}
                  {activeTab === "timeline" && (
                    <motion.div key="timeline" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                      
                      <div className="glass-panel rounded-3xl p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b kyxun-border pb-4">
                          <div>
                            <h3 className="font-outfit text-xl font-bold kyxun-text">Attack Timeline</h3>
                            <p className="text-xs kyxun-text-muted">Complete sequence blocks to dynamically boost your readiness metric</p>
                          </div>
                          <div className="px-3.5 py-1.5 rounded-2xl bg-[var(--kyxun-hover-bg)] border kyxun-border text-xs   font-bold">
                            Completed: {statsMetrics.completedCount} / {statsMetrics.totalTasks} tasks
                          </div>
                        </div>

                        {/* Chronological Grid */}
                        <div className="space-y-6">
                          {Array.from(new Set(plan.schedule.map(s => s.day || 1))).map(day => (
                            <div key={day} className="space-y-3">
                              <h4 className="text-xs font-bold uppercase tracking-wider kyxun-text-muted flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                Day {day} Attack Feed
                              </h4>
                              
                              <div className="space-y-2">
                                {plan.schedule.filter(s => (s.day || 1) === day).map((item, idx) => {
                                  const taskId = `task-${idx}`;
                                  const isChecked = !!completedTasks[taskId];
                                  const isBreak = item.type === "break";
                                  const isSkip = item.type === "skip";
                                  
                                  return (
                                    <div 
                                      key={idx} 
                                      onClick={() => !isBreak && !isSkip && toggleTask(taskId)}
                                      className={`flex items-center gap-4 p-3.5 rounded-2xl border transition-all ${
                                        isBreak || isSkip 
                                          ? "opacity-60 cursor-default bg-[var(--kyxun-hover-bg)]" 
                                          : isChecked 
                                            ? "border-green-500/30 bg-green-500/5 cursor-pointer" 
                                            : "kyxun-border bg-[var(--kyxun-hover-bg)] hover:kyxun-border hover:bg-[var(--kyxun-hover-bg)] cursor-pointer"
                                      }`}
                                    >
                                      {/* Custom checkbox */}
                                      {!isBreak && !isSkip && (
                                        <button type="button" className="shrink-0 kyxun-text-muted hover:  transition-colors">
                                          {isChecked 
                                            ? <CheckSquare className="w-5 h-5 text-green-400" /> 
                                            : <Square className="w-5 h-5" />
                                          }
                                        </button>
                                      )}

                                      {/* Visual indicator for breaks and skips */}
                                      {(isBreak || isSkip) && (
                                        <div className="w-5 h-5 flex items-center justify-center shrink-0">
                                          <div className={`w-2 h-2 rounded-full ${isBreak ? "bg-green-500" : "bg-gray-500"}`} />
                                        </div>
                                      )}

                                      <span className="text-[10px] font-mono kyxun-text-muted shrink-0 w-[65px]">{item.time}</span>
                                      
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-semibold leading-relaxed truncate ${
                                          isSkip || isChecked ? "line-through kyxun-text-muted" : "kyxun-text"
                                        }`}>
                                          {item.title}
                                        </p>
                                      </div>

                                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                                        isChecked ? "border-green-500/20 bg-green-500/10 text-green-400" : typeColors[item.type] || "kyxun-border bg-[var(--kyxun-hover-bg)] kyxun-text-muted"
                                      }`}>
                                        {isChecked ? "Done" : item.type}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </motion.div>
                  )}

                  {/* TAB 3: VIVA SIMULATOR */}
                  {activeTab === "viva" && (
                    <motion.div key="viva" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      <VivaSimulator plan={plan} subject={subject} onScoreSubmit={setVivaScore} />
                    </motion.div>
                  )}

                  {/* TAB 4: PAPER SCANNER */}
                  {activeTab === "analyzer" && (
                    <motion.div key="analyzer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      <PaperAnalyzer plan={plan} subject={subject} onPyqAnalysisChange={handlePyqAnalysisChange} />
                    </motion.div>
                  )}

                  {/* TAB 5: FLASHCARDS */}
                  {activeTab === "flashcards" && (
                    <motion.div key="flashcards" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      <FlashcardGenerator plan={plan} subject={subject} onKnownCountChange={setFlashcardCount} />
                    </motion.div>
                  )}

                  {/* TAB 6: AI STUDY NOTES */}
                  {activeTab === "notes" && (
                    <motion.div key="notes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                      <div className="rounded-3xl p-6 border kyxun-border bg-[var(--kyxun-hover-bg)] backdrop-blur-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                        <h2 className="text-xl font-black kyxun-text font-outfit mb-2 flex items-center gap-2">
                          <FileText className="w-5 h-5  " />
                          AI Knowledge Engine
                        </h2>
                        <p className="text-xs kyxun-text-muted mb-6">
                          Precomputed structured knowledge base built from your uploaded notes — concept graph, module deep-dives, and full glossary.
                        </p>

                        {/* ── V3: KNOWLEDGE BASE ─────────────────────────────────────── */}
                        {(plan as any).knowledgeBase ? (() => {
                          const kb = (plan as any).knowledgeBase as Record<string, any>;
                          return (
                            <div className="space-y-8">
                              {/* Course Header Banner */}
                              <div className="p-5 rounded-2xl border   bg-indigo-500/5 flex flex-wrap gap-4 items-center justify-between">
                                <div>
                                  <p className="text-[9px] font-bold uppercase tracking-widest   mb-1">Knowledge Base Active</p>
                                  <h3 className="font-outfit text-lg font-black kyxun-text">{kb.courseName}</h3>
                                  <p className="text-xs kyxun-text-muted mt-0.5">{kb.subject}</p>
                                </div>
                                <div className="flex gap-4">
                                  <div className="text-center">
                                    <p className="text-2xl font-black  ">{kb.difficultyScore}</p>
                                    <p className="text-[9px] kyxun-text-muted uppercase tracking-wide">Difficulty</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-2xl font-black text-emerald-400">{kb.examProbability}%</p>
                                    <p className="text-[9px] kyxun-text-muted uppercase tracking-wide">Exam Prob.</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-2xl font-black  ">{kb.modules?.length || 0}</p>
                                    <p className="text-[9px] kyxun-text-muted uppercase tracking-wide">Modules</p>
                                  </div>
                                </div>
                              </div>

                              {/* Concept Graph */}
                              {kb.conceptGraph && kb.conceptGraph.length > 0 && (
                                <div className="space-y-3">
                                  <h3 className="text-xs font-bold kyxun-text uppercase tracking-wider flex items-center gap-2">
                                    <Sparkles className="w-4 h-4  " /> Concept Knowledge Graph
                                  </h3>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {kb.conceptGraph.map((node: any, idx: number) => (
                                      <div key={idx} className="p-4 border kyxun-border bg-[var(--kyxun-hover-bg)] rounded-2xl hover:border-indigo-500/30 hover:bg-[var(--kyxun-hover-bg)] transition-all group">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                          <span className="text-xs font-black kyxun-text group-hover:  transition-colors">{node.node}</span>
                                          <div className="flex gap-1 shrink-0">
                                            {node.module && node.module !== "N/A" && (
                                              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded kyxun-badge-indigo ">{node.module}</span>
                                            )}
                                            {node.page && node.page !== "N/A" && (
                                              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-blue-500/15 border border-blue-500/25 text-blue-300">{node.page}</span>
                                            )}
                                          </div>
                                        </div>
                                        <p className="text-[10px] kyxun-text-muted leading-relaxed mb-2">{node.description}</p>
                                        {node.relationships && node.relationships.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-2">
                                            {node.relationships.map((rel: string, rIdx: number) => (
                                              <span key={rIdx} className="text-[8px] font-bold px-1.5 py-0.5 rounded-full border kyxun-border bg-[var(--kyxun-hover-bg)] kyxun-text-muted">
                                                → {rel}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Module Deep-Dives */}
                              {kb.modules && kb.modules.length > 0 && (
                                <div className="space-y-4">
                                  <h3 className="text-xs font-bold kyxun-text uppercase tracking-wider flex items-center gap-2">
                                    <BookOpen className="w-4 h-4  " /> Module Knowledge Cards
                                  </h3>
                                  {kb.modules.map((mod: any, mIdx: number) => (
                                    <div key={mIdx} className="border kyxun-border bg-[var(--kyxun-hover-bg)] rounded-2xl overflow-hidden">
                                      <div className="p-4 border-b kyxun-border flex items-start justify-between gap-2">
                                        <div>
                                          <p className="text-[9px] font-bold uppercase tracking-wider   mb-0.5">Module {mIdx + 1}</p>
                                          <h4 className="text-sm font-black kyxun-text">{mod.title}</h4>
                                          <p className="text-[10px] kyxun-text-muted mt-1 leading-relaxed">{mod.summary}</p>
                                        </div>
                                        {mod.importantTopics && mod.importantTopics.length > 0 && (
                                          <div className="flex flex-wrap gap-1 shrink-0 max-w-[40%]">
                                            {mod.importantTopics.slice(0, 3).map((t: string, tIdx: number) => (
                                              <span key={tIdx} className="text-[7px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20   whitespace-nowrap">{t}</span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/5">
                                        {/* Formulae */}
                                        {mod.formulae && mod.formulae.length > 0 && (
                                          <div className="p-3 space-y-1.5">
                                            <p className="text-[8px] font-bold uppercase tracking-widest  ">Formulae</p>
                                            {mod.formulae.map((f: string, fIdx: number) => (
                                              <div key={fIdx} className="font-mono text-[9px]   p-1.5 bg-amber-500/5 rounded-lg">{f}</div>
                                            ))}
                                          </div>
                                        )}
                                        {/* Definitions */}
                                        {mod.definitions && mod.definitions.length > 0 && (
                                          <div className="p-3 space-y-1.5">
                                            <p className="text-[8px] font-bold uppercase tracking-widest text-emerald-400">Definitions</p>
                                            {mod.definitions.slice(0, 3).map((d: string, dIdx: number) => (
                                              <p key={dIdx} className="text-[9px] kyxun-text-muted leading-relaxed">• {d}</p>
                                            ))}
                                          </div>
                                        )}
                                        {/* Exam Questions */}
                                        {mod.commonExamQuestions && mod.commonExamQuestions.length > 0 && (
                                          <div className="p-3 space-y-1.5">
                                            <p className="text-[8px] font-bold uppercase tracking-widest text-red-400">Exam Questions</p>
                                            {mod.commonExamQuestions.slice(0, 3).map((eq: string, eIdx: number) => (
                                              <p key={eIdx} className="text-[9px] kyxun-text-muted leading-relaxed">Q: {eq}</p>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      {/* Mistakes + Mnemonics footer */}
                                      {((mod.frequentMistakes && mod.frequentMistakes.length > 0) || (mod.mnemonics && mod.mnemonics.length > 0)) && (
                                        <div className="px-4 py-3 border-t kyxun-border flex flex-wrap gap-4">
                                          {mod.frequentMistakes && mod.frequentMistakes.length > 0 && (
                                            <div className="flex-1 min-w-0">
                                              <p className="text-[8px] font-bold uppercase tracking-widest text-red-400 mb-1">Common Mistakes</p>
                                              {mod.frequentMistakes.slice(0, 2).map((m: string, mEIdx: number) => (
                                                <p key={mEIdx} className="text-[9px] text-red-300/70">! {m}</p>
                                              ))}
                                            </div>
                                          )}
                                          {mod.mnemonics && mod.mnemonics.length > 0 && (
                                            <div className="flex-1 min-w-0">
                                              <p className="text-[8px] font-bold uppercase tracking-widest   mb-1">Mnemonics</p>
                                              {mod.mnemonics.slice(0, 2).map((mn: string, mnIdx: number) => (
                                                <p key={mnIdx} className="text-[9px]  /70 font-mono">{mn}</p>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Glossary Grid */}
                              {kb.glossary && kb.glossary.length > 0 && (
                                <div className="space-y-3">
                                  <h3 className="text-xs font-bold kyxun-text uppercase tracking-wider flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Full Glossary ({kb.glossary.length} terms)
                                  </h3>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {kb.glossary.map((g: any, gIdx: number) => (
                                      <div key={gIdx} className="p-3 border kyxun-border bg-[var(--kyxun-hover-bg)] rounded-xl">
                                        <span className="text-[9px] font-black  ">{g.term}</span>
                                        <p className="text-[9px] kyxun-text-muted mt-0.5 leading-relaxed">{g.definition}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })() : plan.documentSummary ? (
                          <div className="space-y-6">
                            {/* Executive Summary */}
                            <div className="p-5 border kyxun-border bg-[var(--kyxun-hover-bg)] rounded-2xl">
                              <h3 className="text-xs font-bold kyxun-text uppercase tracking-wider mb-2">Executive Summary</h3>
                              <p className="text-xs kyxun-text-muted leading-relaxed font-medium">
                                {plan.documentSummary.summary}
                              </p>
                            </div>

                            {/* Key concepts & formulas grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Key Concepts */}
                              <div className="p-5 border kyxun-border bg-[var(--kyxun-hover-bg)] rounded-2xl space-y-3">
                                <h3 className="text-xs font-bold kyxun-text uppercase tracking-wider flex items-center gap-2">
                                  <Sparkles className="w-4 h-4  " /> Key Concepts
                                </h3>
                                <ul className="space-y-2">
                                  {plan.documentSummary.keyConcepts.map((item, idx) => (
                                    <li key={idx} className="text-xs kyxun-text-muted leading-relaxed flex gap-2 font-medium">
                                      <span className="  select-none">•</span>
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Formulas & Equations */}
                              <div className="p-5 border kyxun-border bg-[var(--kyxun-hover-bg)] rounded-2xl space-y-3">
                                <h3 className="text-xs font-bold kyxun-text uppercase tracking-wider flex items-center gap-2">
                                  <Zap className="w-4 h-4  " /> Important Formulas
                                </h3>
                                <div className="space-y-2">
                                  {plan.documentSummary.formulas && plan.documentSummary.formulas.length > 0 ? (
                                    plan.documentSummary.formulas.map((item, idx) => (
                                      <div key={idx} className="p-2 border kyxun-border bg-[var(--kyxun-hover-bg)] rounded-xl font-mono text-[10px]  ">
                                        {item}
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-xs kyxun-text-muted font-medium">No major formulas detected.</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Definitions & Short Notes */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Definitions */}
                              <div className="p-5 border kyxun-border bg-[var(--kyxun-hover-bg)] rounded-2xl space-y-3">
                                <h3 className="text-xs font-bold kyxun-text uppercase tracking-wider flex items-center gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Definitions
                                </h3>
                                <ul className="space-y-2">
                                  {plan.documentSummary.definitions.map((item, idx) => (
                                    <li key={idx} className="text-xs kyxun-text-muted leading-relaxed flex gap-2 font-medium">
                                      <span className="text-emerald-400 select-none">•</span>
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Short Revision Notes */}
                              <div className="p-5 border kyxun-border bg-[var(--kyxun-hover-bg)] rounded-2xl space-y-3">
                                <h3 className="text-xs font-bold kyxun-text uppercase tracking-wider flex items-center gap-2">
                                  <Target className="w-4 h-4 text-pink-400" /> Quick Revision Notes
                                </h3>
                                <ul className="space-y-2">
                                  {plan.documentSummary.shortNotes.map((item, idx) => (
                                    <li key={idx} className="text-xs kyxun-text-muted leading-relaxed flex gap-2 font-medium">
                                      <span className="text-pink-400 select-none">•</span>
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {/* Mnemonics & Exam Tips */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Mnemonics */}
                              <div className="p-5 border kyxun-border bg-[var(--kyxun-hover-bg)] rounded-2xl space-y-3">
                                <h3 className="text-xs font-bold kyxun-text uppercase tracking-wider flex items-center gap-2">
                                  <Skull className="w-4 h-4  " /> Mnemonics
                                </h3>
                                <div className="space-y-2">
                                  {plan.documentSummary.mnemonics.map((item, idx) => (
                                    <div key={idx} className="p-2.5 border border-purple-500/10 bg-purple-500/5 rounded-xl text-xs   font-medium">
                                      {item}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Exam Tips */}
                              <div className="p-5 border kyxun-border bg-[var(--kyxun-hover-bg)] rounded-2xl space-y-3">
                                <h3 className="text-xs font-bold kyxun-text uppercase tracking-wider flex items-center gap-2">
                                  <Flame className="w-4 h-4 text-red-400" /> Exam Day Tips
                                </h3>
                                <ul className="space-y-2">
                                  {plan.documentSummary.examTips.map((item, idx) => (
                                    <li key={idx} className="text-xs kyxun-text-muted leading-relaxed flex gap-2 font-medium">
                                      <span className="text-red-400 select-none">•</span>
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {/* Mind Map Outlines */}
                            {plan.documentSummary.mindMap && (
                              <div className="p-5 border kyxun-border bg-[var(--kyxun-hover-bg)] rounded-2xl space-y-3">
                                <h3 className="text-xs font-bold kyxun-text uppercase tracking-wider">Mind Map Logical Outline</h3>
                                <pre className="p-4 border kyxun-border bg-[var(--kyxun-hover-bg)] rounded-xl font-mono text-[10px] kyxun-text-muted whitespace-pre-wrap leading-relaxed">
                                  {plan.documentSummary.mindMap}
                                </pre>
                              </div>
                            )}

                            {/* Important Tables */}
                            {plan.documentSummary.importantTables && plan.documentSummary.importantTables.length > 0 && (
                              <div className="p-5 border kyxun-border bg-[var(--kyxun-hover-bg)] rounded-2xl space-y-3">
                                <h3 className="text-xs font-bold kyxun-text uppercase tracking-wider">Key Synthesized Tables</h3>
                                <div className="space-y-3">
                                  {plan.documentSummary.importantTables.map((item, idx) => (
                                    <div key={idx} className="p-3 bg-[var(--kyxun-hover-bg)] border kyxun-border rounded-xl font-mono text-[10px] kyxun-text-muted whitespace-pre-wrap leading-normal">
                                      {item}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Important Diagrams */}
                            {plan.documentSummary.importantDiagrams && plan.documentSummary.importantDiagrams.length > 0 && (
                              <div className="p-5 border kyxun-border bg-[var(--kyxun-hover-bg)] rounded-2xl space-y-3">
                                <h3 className="text-xs font-bold kyxun-text uppercase tracking-wider">Key Synthesized Diagram Outlines</h3>
                                <div className="space-y-3">
                                  {plan.documentSummary.importantDiagrams.map((item, idx) => (
                                    <div key={idx} className="p-3 bg-[var(--kyxun-hover-bg)] border kyxun-border rounded-xl text-xs kyxun-text-muted leading-relaxed">
                                      {item}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-12 text-center kyxun-text-muted font-medium">
                            No study material insights compiled for this plan yet. Use custom uploads to trigger extraction.
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 7: PRACTICE TEST */}
                  {activeTab === "practice" && (
                    <motion.div key="practice" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                      <div className="rounded-3xl p-6 border kyxun-border bg-[var(--kyxun-hover-bg)] backdrop-blur-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                        <h2 className="text-xl font-black kyxun-text font-outfit mb-2 flex items-center gap-2">
                          <Award className="w-5 h-5  " />
                          AI Active Recall Practice
                        </h2>
                        <p className="text-xs kyxun-text-muted mb-6">
                          Test your understanding of high-yield topics with automatic grading and logical explanation maps.
                        </p>

                        {/* Dynamic category filter tabs */}
                        <div className="flex flex-wrap gap-1.5 mb-6 pb-4 border-b kyxun-border">
                          {["All", "MCQ", "True/False", "One Mark", "Two Marks", "Five Marks", "Ten Marks", "Viva Question", "Application", "Numerical", "Case Study"].map(cat => {
                            const isCatActive = activeQuestionFilter === cat;
                            const count = plan.practiceQuestions ? (cat === "All" ? plan.practiceQuestions.length : plan.practiceQuestions.filter(q => q.type === cat).length) : 0;
                            if (cat !== "All" && count === 0) return null; // hide categories that have no questions
                            
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => setActiveQuestionFilter(cat)}
                                className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                                  isCatActive 
                                    ? "bg-indigo-600 border-indigo-500 text-white" 
                                    : "bg-[var(--kyxun-hover-bg)] kyxun-border kyxun-text-muted hover:kyxun-text"
                                }`}
                              >
                                {cat} ({count})
                              </button>
                            );
                          })}
                        </div>

                        {filteredQuestions.length > 0 ? (
                          <div className="space-y-6">
                            {filteredQuestions.map((q, idx) => {
                              const uniqueKey = `q-${idx}`;
                              const selectedAnswer = userAnswers[uniqueKey];
                              const isChecked = selectedAnswer !== undefined;

                              return (
                                <div key={idx} className="p-5 border kyxun-border bg-[var(--kyxun-hover-bg)] rounded-2xl space-y-4">
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <span className="text-[9px] font-black uppercase tracking-wider   kyxun-badge-indigo px-2 py-0.5 rounded">
                                      Question {idx + 1} • {q.type}
                                    </span>
                                    <span className="text-[9px] kyxun-text-muted font-bold uppercase">
                                      Bloom&apos;s: {q.bloomsLevel} • {q.marks} Mark{q.marks === 1 ? "" : "s"}
                                    </span>
                                  </div>

                                  <h4 className="text-sm font-bold kyxun-text leading-snug">
                                    {q.question}
                                  </h4>

                                  {/* Options rendering for MCQ */}
                                  {q.type === "MCQ" && q.options && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {q.options.map((opt, oIdx) => {
                                        const isSelected = selectedAnswer === opt;
                                        const isCorrectOpt = opt === q.answer;
                                        const showSuccess = isChecked && isCorrectOpt;
                                        const showDanger = isChecked && isSelected && !isCorrectOpt;

                                        return (
                                          <button
                                            key={oIdx}
                                            type="button"
                                            onClick={() => !isChecked && setUserAnswers(prev => ({ ...prev, [uniqueKey]: opt }))}
                                            disabled={isChecked}
                                            className={`p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                                              showSuccess
                                                ? "border-green-500/30 bg-green-500/10 text-green-400"
                                                : showDanger
                                                ? "border-red-500/30 bg-red-500/10 text-red-400"
                                                : isSelected
                                                ? "border-indigo-500/30 kyxun-badge-indigo "
                                                : "kyxun-border bg-[var(--kyxun-hover-bg)] kyxun-text-muted hover:bg-[var(--kyxun-hover-bg)]"
                                            } ${!isChecked ? "cursor-pointer" : "cursor-default"}`}
                                          >
                                            {opt}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {/* Option rendering for True/False */}
                                  {q.type === "True/False" && (
                                    <div className="flex gap-2">
                                      {["True", "False"].map((opt) => {
                                        const isSelected = selectedAnswer === opt;
                                        const isCorrectOpt = opt.toLowerCase() === q.answer.toString().toLowerCase();
                                        const showSuccess = isChecked && isCorrectOpt;
                                        const showDanger = isChecked && isSelected && !isCorrectOpt;

                                        return (
                                          <button
                                            key={opt}
                                            type="button"
                                            onClick={() => !isChecked && setUserAnswers(prev => ({ ...prev, [uniqueKey]: opt }))}
                                            disabled={isChecked}
                                            className={`px-6 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                                              showSuccess
                                                ? "border-green-500/30 bg-green-500/10 text-green-400"
                                                : showDanger
                                                ? "border-red-500/30 bg-red-500/10 text-red-400"
                                                : isSelected
                                                ? "border-indigo-500/30 kyxun-badge-indigo "
                                                : "kyxun-border bg-[var(--kyxun-hover-bg)] kyxun-text-muted hover:bg-[var(--kyxun-hover-bg)]"
                                            } ${!isChecked ? "cursor-pointer" : "cursor-default"}`}
                                          >
                                            {opt}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {/* Option rendering for Descriptive/Written Response */}
                                  {q.type !== "MCQ" && q.type !== "True/False" && (
                                    <div className="space-y-3">
                                      <textarea
                                        placeholder="Type your response summary here..."
                                        rows={3}
                                        disabled={isChecked}
                                        value={selectedAnswer || ""}
                                        onChange={(e) => setUserAnswers(prev => ({ ...prev, [uniqueKey]: e.target.value }))}
                                        className="w-full p-3 border kyxun-border bg-[var(--kyxun-hover-bg)] rounded-xl text-xs kyxun-text placeholder-white/20 focus:outline-none focus:border-indigo-500/50 resize-none font-medium"
                                      />
                                      {!isChecked && (
                                        <button
                                          type="button"
                                          onClick={() => setUserAnswers(prev => ({ ...prev, [uniqueKey]: selectedAnswer || "" }))}
                                          className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all hover:bg-indigo-600 animate-pulse"
                                        >
                                          Submit Answer
                                        </button>
                                      )}
                                    </div>
                                  )}

                                  {/* Explanation block revealed after submission */}
                                  {isChecked && (
                                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="p-3.5 bg-[var(--kyxun-hover-bg)] border kyxun-border rounded-xl space-y-1.5 animate-fadeIn">
                                      <p className="text-[9px] font-black uppercase  ">Explanation & Ideal Answer</p>
                                      <p className="text-xs kyxun-text-muted font-medium leading-relaxed">
                                        <span className="font-bold kyxun-text">Ideal:</span> {q.answer}
                                      </p>
                                      <p className="text-xs kyxun-text-muted font-medium leading-relaxed">
                                        {q.explanation}
                                      </p>
                                    </motion.div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-12 text-center kyxun-text-muted">
                            No practice questions generated for this syllabus yet. Use custom uploads to trigger test generation.
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>

              </section>

            </motion.div>
          )}

        </AnimatePresence>
        </div>
      </div>

      {/* Modals */}
      <ProfileModal  open={modal === "profile"}  email={session.email} fullName={session.fullName} onClose={()=>setModal(null)} onSaved={()=>{ setSession(getSession()); setModal(null); }}/>
      <SettingsModal open={modal === "settings"} email={session.email} onClose={()=>setModal(null)}/>
      <HelpModal     open={modal === "help"}     onClose={()=>setModal(null)}/>
      <LogoutModal   open={modal === "logout"}   onCancel={()=>setModal(null)} onConfirm={handleLogout}/>
    </main>);}

