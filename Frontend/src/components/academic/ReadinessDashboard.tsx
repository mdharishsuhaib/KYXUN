"use client";

import { useState, useEffect } from "react";
import { Activity, AlertTriangle, CheckCircle2, Award, BookOpen, Clock, Sparkles } from "lucide-react";
import type { StudyPlan } from "@/lib/academic";
import { calculateReadiness } from "@/lib/readiness";
import FeatureCard from "./FeatureCard";

interface Props {
  plan: StudyPlan;
  totalChapters?: number;
  completedChapters?: number;
  completedTasks?: Record<string, boolean>;
  vivaScore?: number;
  flashcardCount?: number;
  uploadedFilesCount?: number;
}

export default function ReadinessDashboard({
  plan,
  totalChapters = 0,
  completedChapters = 0,
  completedTasks = {},
  vivaScore = 0,
  flashcardCount = 0,
  uploadedFilesCount = 0,
}: Props) {
  const [history, setHistory] = useState<Record<string, unknown>[]>([]);

  // Fetch assessment logs from Supabase
  useEffect(() => {
    const fetchHistory = async () => {
      if (!plan || !plan.id) return;
      try {
        const { supabase } = await import("@/lib/supabase");
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) return;
        
        const { readinessService } = await import("@/lib/services/readinessService");
        const data = await readinessService.getReadinessHistory(user.id, plan.id);
        setHistory(data);
      } catch (err) {
        console.error("Failed to load readiness history:", err);
      }
    };
    
    fetchHistory();
  }, [plan, completedTasks, vivaScore, flashcardCount]);

  // Compute exam readiness telemetry
  const stats = calculateReadiness({
    plan,
    totalChapters,
    completedChapters,
    completedTasks,
    vivaScore,
    flashcardCount,
    uploadedFilesCount,
  });

  const getToneColor = (score: number) => {
    if (score >= 75) return "#10b981"; // Emerald
    if (score >= 50) return "#f59e0b"; // Amber
    return "#f43f5e"; // Rose
  };

  const getRiskBg = (level: "Low" | "Medium" | "High") => {
    if (level === "Low") return "border-green-500/20 bg-green-500/5 text-green-400";
    if (level === "Medium") return "border-amber-500/20 bg-amber-500/5  ";
    return "border-red-500/20 bg-red-500/5 text-red-400";
  };

  const mainColor = getToneColor(stats.readinessScore);

  // Render SVG historical trend line
  const renderTrendChart = () => {
    if (history.length < 2) return null;
    
    const width = 500;
    const height = 80;
    const padding = 10;
    
    const points = history.map((item, idx) => {
      const x = padding + (idx / (history.length - 1)) * (width - padding * 2);
      const y = padding + ((100 - (item as any).readiness_score) / 100) * (height - padding * 2);
      return {
        x,
        y,
        score: (item as any).readiness_score,
        date: new Date((item as any).created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    });
    
    const d = points.reduce((acc, p, idx) => {
      return acc + (idx === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
    }, "");
    
    return (
      <div className="rounded-2xl p-5 border kyxun-border bg-slate-950/20 mb-6 relative overflow-hidden">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider kyxun-text-muted">Readiness History Trend</span>
          <span className="text-[9px] font-mono   font-bold">{history.length} assessments logged</span>
        </div>
        
        <div className="relative w-full h-24">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
            <line x1={0} y1={height/2} x2={width} y2={height/2} stroke="rgba(255,255,255,0.03)" strokeWidth={1} strokeDasharray="4 4" />
            <defs>
              <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--kyxun-accent)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="var(--kyxun-accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {d && (
              <path
                d={`${d} L ${points[points.length-1].x} ${height} L ${points[0].x} ${height} Z`}
                fill="url(#chart-grad)"
              />
            )}
            <path
              d={d}
              fill="none"
              stroke="var(--kyxun-accent)"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.map((p, idx) => (
              <g key={idx} className="group cursor-pointer">
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={3.5}
                  fill="var(--kyxun-accent-secondary)"
                  stroke="var(--kyxun-accent)"
                  strokeWidth={1}
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={7}
                  fill="transparent"
                  className="hover:fill-indigo-500/10 transition-colors"
                />
                <title>{`Assessment ${idx + 1}: ${p.score}% at ${p.date}`}</title>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <FeatureCard eyebrow="Exam intelligence" title="Academic Telemetry Console" icon={Activity}>
      
      {/* Telemetry Gauge & Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        
        {/* Readiness Gauge */}
        <div className="rounded-2xl p-5 border kyxun-border bg-slate-950/20 relative overflow-hidden flex flex-col items-center justify-between text-center min-h-[220px]">
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          <p className="text-[10px] font-bold uppercase tracking-wider kyxun-text-muted">Readiness Score</p>
          
          <div className="relative w-28 h-28 my-3 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="56" cy="56" r="44" stroke="rgba(255,255,255,0.03)" strokeWidth="6.5" fill="transparent" />
              <circle 
                cx="56" cy="56" r="44" 
                stroke={mainColor} 
                strokeWidth="6.5" 
                fill="transparent" 
                strokeDasharray={276}
                strokeDashoffset={276 - (276 * stats.readinessScore) / 100}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black font-outfit kyxun-text leading-none">{stats.readinessScore}%</span>
              <span className="text-[9px] font-bold kyxun-text-muted uppercase tracking-widest mt-1">Readiness</span>
            </div>
          </div>

          <span className={`text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full border ${getRiskBg(stats.riskLevel)}`}>
            {stats.riskLabel}
          </span>
        </div>

        {/* Knowledge Coverage */}
        <div className="rounded-2xl p-5 border kyxun-border bg-slate-950/20 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider kyxun-text-muted">Knowledge Coverage</p>
              <h3 className="text-2xl font-black font-outfit kyxun-text mt-1.5">{stats.knowledgeCoverage}%</h3>
            </div>
            <BookOpen className="w-4 h-4  " />
          </div>
          
          <div className="my-4">
            <div className="h-2 w-full bg-[var(--kyxun-hover-bg)] rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                style={{ width: `${stats.knowledgeCoverage}%` }} 
              />
            </div>
            <div className="flex justify-between text-[10px] kyxun-text-muted font-bold mt-2 font-mono">
              <span>Syllabus: {completedChapters}/{totalChapters} Ch</span>
              <span>Timeline Boost</span>
            </div>
          </div>

          <p className="text-[11px] kyxun-text-muted leading-relaxed font-medium">
            Calculated from self-reported syllabus coverage plus high-yield modules completed on your plan timeline.
          </p>
        </div>

        {/* Revision Readiness */}
        <div className="rounded-2xl p-5 border kyxun-border bg-slate-950/20 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider kyxun-text-muted">Revision Readiness</p>
              <h3 className="text-2xl font-black font-outfit kyxun-text mt-1.5">{stats.revisionReadiness}%</h3>
            </div>
            <Award className="w-4 h-4  " />
          </div>
          
          <div className="my-4">
            <div className="h-2 w-full bg-[var(--kyxun-hover-bg)] rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 rounded-full transition-all duration-500" 
                style={{ width: `${stats.revisionReadiness}%` }} 
              />
            </div>
            <div className="flex justify-between text-[10px] kyxun-text-muted font-bold mt-2 font-mono">
              <span>Cards: {flashcardCount}</span>
              <span>Viva Score: {vivaScore}</span>
            </div>
          </div>

          <p className="text-[11px] kyxun-text-muted leading-relaxed font-medium">
            Measures retention based on flashcards mastered in active recall and oral exam simulation scores.
          </p>
        </div>

        {/* Predicted Marks Range */}
        <div className="rounded-2xl p-5 border kyxun-border bg-slate-950/20 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider kyxun-text-muted">Predicted Range</p>
              <h3 className="text-2xl font-black font-outfit text-emerald-400 mt-1.5">{stats.predictedMarksRange}</h3>
            </div>
            <Sparkles className="w-4.5 h-4.5 text-emerald-400" />
          </div>
          
          <div className="my-3 py-2 bg-slate-900/50 border kyxun-border rounded-xl px-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[10px] font-bold kyxun-text-muted leading-none">Pass Chance:</span>
            </div>
            <span className="text-xs font-black font-mono" style={{ color: getToneColor(stats.passingProbability) }}>
              {stats.passingProbability}%
            </span>
          </div>

          <p className="text-[11px] kyxun-text-muted leading-relaxed font-medium">
            AI-modeled score outcome calibrated against syllabus weightings, plan completion, and active revision scores.
          </p>
        </div>

      </div>

      {/* SVG Trend History Chart */}
      {renderTrendChart()}

      {/* Diagnostics: Health Status, Strong & Weak Topics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Copilot Risk Diagnostics */}
        <div className="rounded-2xl p-4 border kyxun-border bg-slate-950/20 flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4   shrink-0" />
            <p className="text-xs font-bold kyxun-text uppercase tracking-wider">Plan Safety Metrics</p>
          </div>
          
          <div className="space-y-1.5 text-[11px] kyxun-text-muted leading-normal font-medium">
            <div className="flex justify-between">
              <span>Sleep Hours:</span>
              <span className={plan.sleepHours < 6 ? "text-red-400 font-bold" : "text-emerald-400"}>
                {plan.sleepHours}h/day {plan.sleepHours < 6 && "(Penalty)"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Daily Study Load:</span>
              <span className={plan.studyHours > 10 ? "text-red-400 font-bold" : "text-emerald-400"}>
                {plan.studyHours}h/day {plan.studyHours > 10 && "(Fatigue)"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Reference Context:</span>
              <span className={uploadedFilesCount === 0 ? "text-red-400 font-bold" : "text-emerald-400"}>
                {uploadedFilesCount} File{uploadedFilesCount === 1 ? "" : "s"} {uploadedFilesCount === 0 && "(Low)"}
              </span>
            </div>
          </div>
        </div>

        {/* Strong Topics */}
        <div className="rounded-2xl p-4 border border-green-500/10 bg-green-500/5 flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
            <p className="text-xs font-bold text-green-400 uppercase tracking-wider">Active Strengths</p>
          </div>
          <ul className="space-y-1.5 flex-1 mt-1">
            {stats.strongTopics.map((topic, i) => (
              <li key={i} className="text-[11px] kyxun-text-muted font-bold flex items-center gap-1.5 truncate">
                <span className="w-1 h-1 rounded-full bg-green-400 shrink-0" />
                <span className="truncate" title={topic}>{topic}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weak Topics */}
        <div className="rounded-2xl p-4 border border-red-500/10 bg-red-500/5 flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Urgent Gaps</p>
          </div>
          <ul className="space-y-1.5 flex-1 mt-1">
            {stats.weakTopics.map((topic, i) => (
              <li key={i} className="text-[11px] kyxun-text-muted font-bold flex items-center gap-1.5 truncate">
                <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
                <span className="truncate" title={topic}>{topic}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

    </FeatureCard>
  );
}
