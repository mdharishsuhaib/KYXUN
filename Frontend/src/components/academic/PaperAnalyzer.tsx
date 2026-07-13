"use client";

import { useState, useMemo } from "react";
import { 
  FileSearch, Sparkles, RefreshCw, UploadCloud, 
  Trash2, Loader2, Flame, BookOpen, Layers, Target 
} from "lucide-react";
import type { StudyPlan, PYQAnalysisData } from "@/lib/academic";
import FeatureCard from "./FeatureCard";

interface Props {
  plan: StudyPlan;
  subject: string;
  onPyqAnalysisChange?: (data: PYQAnalysisData | null) => void;
}

export default function PaperAnalyzer({ plan, subject, onPyqAnalysisChange }: Props) {
  const [paperText, setPaperText] = useState("");
  const [pyqFiles, setPyqFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pyqData = plan.pyqAnalysis;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setPyqFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    e.target.value = "";
  };

  const removeFile = (idx: number) => {
    setPyqFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRunAnalysis = async () => {
    if (!paperText.trim() && pyqFiles.length === 0) {
      setError("Please paste question text or upload exam files to analyze.");
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("subject", subject);
      fd.append("paperText", paperText);
      pyqFiles.forEach((file) => fd.append("files", file));

      const res = await fetch("/api/analyze-paper", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error("Failed to scan papers.");
      const data = (await res.json()) as PYQAnalysisData;
      if (onPyqAnalysisChange) {
        onPyqAnalysisChange(data);
      }
      setPaperText("");
      setPyqFiles([]);
    } catch (err) {
      setError("Failed to run AI Trend analysis. Please verify your connection.");
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "border-red-500/30 bg-red-500/10 text-red-400";
      case "High Yield":
        return "border-purple-500/30 kyxun-badge-indigo ";
      case "Medium Yield":
        return "border-blue-500/30 bg-blue-500/10 text-blue-400";
      default:
        return "border-gray-500/30 bg-gray-500/10 text-gray-400";
    }
  };

  const maxFrequency = useMemo(() => {
    if (!pyqData || pyqData.frequentlyAskedTopics.length === 0) return 1;
    return Math.max(...pyqData.frequentlyAskedTopics.map((t) => t.frequency), 1);
  }, [pyqData]);

  return (
    <FeatureCard eyebrow="Pattern Scanner" title="PYQ Prediction Intelligence" icon={FileSearch}>
      {pyqData ? (
        <div className="space-y-6">
          
          {/* Predicted Chapters & General Patterns row */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6">
            
            {/* Predicted High-Value Chapters */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold kyxun-text uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4  " />
                Predicted High-Value Chapter Weights
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pyqData.predictedHighValueChapters.map((ch, idx) => (
                  <div key={idx} className="rounded-2xl p-4.5 border kyxun-border bg-[var(--kyxun-hover-bg)] relative overflow-hidden flex flex-col justify-between min-h-[130px]">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-xs font-bold kyxun-text leading-normal truncate pr-6" title={ch.chapterName}>
                        {ch.chapterName}
                      </h4>
                      <span className="text-xs font-mono font-black   kyxun-badge-indigo px-2 py-0.5 rounded">
                        {ch.predictedWeightage}
                      </span>
                    </div>
                    <p className="text-[10px] kyxun-text-muted leading-relaxed mt-2.5 font-medium">
                      {ch.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pattern Tricks Observations */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold kyxun-text uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Syllabus Question Patterns
              </h3>
              
              <div className="rounded-2xl p-4.5 border kyxun-border bg-[var(--kyxun-hover-bg)] h-[130px] overflow-y-auto space-y-2.5">
                {pyqData.questionPatterns.map((pat, idx) => (
                  <div key={idx} className="flex gap-2 text-[10px] kyxun-text-muted leading-relaxed font-medium">
                    <span className="font-mono text-emerald-400 select-none">[{idx + 1}]</span>
                    <span>{pat}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Topic Heatmap & Custom Chart Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
            
            {/* Heatmap Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold kyxun-text uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4  " />
                Topic Occurrence Heatmap
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[195px] overflow-y-auto pr-1">
                {pyqData.frequentlyAskedTopics.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="p-3 rounded-xl border kyxun-border bg-slate-950/20 flex flex-col justify-between hover:scale-[1.01] transition-transform group relative cursor-pointer"
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-[9px] font-bold kyxun-text-muted truncate">Topic {idx + 1}</span>
                      <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getPriorityColor(item.studyPriority)}`}>
                        {item.studyPriority}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold kyxun-text mt-1.5 mb-2 truncate" title={item.topic}>
                      {item.topic}
                    </h4>
                    <p className="text-[9px] kyxun-text-muted leading-normal line-clamp-1 group-hover:line-clamp-none transition-all duration-300">
                      {item.patternDetails}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom SVG Frequency Chart */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold kyxun-text uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                Weightage Distribution
              </h3>
              
              <div className="rounded-2xl p-4.5 border kyxun-border bg-[var(--kyxun-hover-bg)] h-[195px] flex flex-col justify-between">
                <div className="h-28 flex items-end justify-between bg-slate-950/20 border kyxun-border rounded-xl px-4 py-2 relative">
                  <span className="absolute left-2.5 top-1.5 text-[8px] font-bold kyxun-text-muted uppercase tracking-widest font-mono">PYQ Mentions</span>
                  
                  {pyqData.frequentlyAskedTopics.map((t, idx) => {
                    const heightPercent = Math.max(10, (t.frequency / maxFrequency) * 100);
                    return (
                      <div key={idx} className="flex flex-col items-center group w-9">
                        <span className="text-[8px] font-mono font-bold   opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                          {t.frequency}x
                        </span>
                        <div 
                          className="w-4 rounded-t bg-gradient-to-t from-indigo-600 to-purple-500 hover:from-indigo-500 hover:to-purple-400 transition-all duration-500 shadow-md shadow-indigo-500/10"
                          style={{ height: `${heightPercent}px` }}
                          title={`${t.topic}: ${t.frequency} hits`}
                        />
                        <span className="text-[8px] kyxun-text-muted font-bold font-mono mt-1.5 truncate w-full text-center">
                          T{idx + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                <div className="grid grid-cols-5 gap-1 text-[8px] font-mono kyxun-text-muted font-bold leading-normal truncate">
                  {pyqData.frequentlyAskedTopics.map((t, idx) => (
                    <div key={idx} className="truncate text-center" title={t.topic}>
                      T{idx + 1}: {t.topic.slice(0, 10)}...
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Importance Ranking List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold kyxun-text uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4.5 h-4.5 text-amber-500" />
              Prioritized Concept Rankings
            </h3>
            
            <div className="space-y-2">
              {pyqData.frequentlyAskedTopics
                .slice()
                .sort((a, b) => b.frequency - a.frequency)
                .map((topic, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border kyxun-border bg-[var(--kyxun-hover-bg)] hover:bg-[var(--kyxun-hover-bg)] transition-colors">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="w-5 h-5 rounded-lg kyxun-badge-indigo flex items-center justify-center text-[10px] font-mono font-bold   shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold kyxun-text truncate" title={topic.topic}>
                          {topic.topic}
                        </h4>
                        <p className="text-[10px] kyxun-text-muted mt-1 font-medium leading-relaxed">
                          {topic.patternDetails}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0 sm:self-center">
                      <span className="text-[9px] font-mono font-bold   kyxun-badge-indigo px-2.5 py-1 rounded-lg">
                        Weight: {topic.examWeightage}
                      </span>
                      <span className={`text-[9px] font-mono font-bold px-2.5 py-1 rounded-lg border ${getPriorityColor(topic.studyPriority)}`}>
                        {topic.studyPriority}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Action Footer: Analyze another PYQ */}
          <div className="border-t kyxun-border pt-4 mt-6 flex justify-between items-center flex-wrap gap-4">
            <p className="text-[10px] kyxun-text-muted font-medium">
              Calibrated using Gemini AI predictive reasoning matrices.
            </p>
            <button 
              onClick={() => onPyqAnalysisChange?.(null)}
              className="px-4 py-2 rounded-xl border kyxun-border hover:bg-[var(--kyxun-hover-bg)] kyxun-text-muted hover:kyxun-text font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Analyze Another Paper
            </button>
          </div>

        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.9fr] gap-6">
          
          {/* Ingestion Console */}
          <div className="flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <p className="text-xs leading-relaxed kyxun-text-muted font-medium">
                Pasting raw previous year papers or scanning exam question files extracts recurring high-yield concepts using AI reasoning.
              </p>
              
              <div className="relative">
                <textarea
                  value={paperText}
                  onChange={(e) => setPaperText(e.target.value)}
                  placeholder={`Paste PYQ question text here...\n\ne.g.,\nQ1. State Gauss law of electromagnetism and derive wave equation.\nQ2. Explain the physical significance of Schrödinger wave equation.\nQ3. State the first law of thermodynamics.`}
                  className="input-field min-h-56 resize-y leading-relaxed font-sans text-xs focus:ring-purple-500/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-1 px-1">
              <p className="text-[10px] kyxun-text-muted font-mono">
                <span className="  font-bold">
                  {paperText.trim().split(/\s+/).filter(Boolean).length}
                </span> words input
              </p>
              <button
                type="button"
                onClick={() => setPaperText("")}
                className="text-[10px] uppercase font-bold kyxun-text-muted hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Clear Text
              </button>
            </div>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div className="rounded-2xl p-5 border kyxun-border bg-slate-950/20 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--kyxun-hover-bg)] rounded-full blur-xl pointer-events-none" />
            
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2 border-b kyxun-border pb-3">
                <Sparkles className="w-4 h-4   animate-pulse" />
                <p className="text-xs font-bold kyxun-text uppercase tracking-wider">Exam File Ingestor</p>
              </div>

              {/* Upload input button */}
              <div className="border border-dashed kyxun-border rounded-2xl p-6 text-center hover:bg-[var(--kyxun-hover-bg)] transition-all cursor-pointer relative group">
                <input 
                  type="file" 
                  accept="image/*,.pdf,.doc,.docx,.txt" 
                  multiple 
                  onChange={handleFileSelect} 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                />
                <UploadCloud className="w-8 h-8   mx-auto mb-2 group-hover:scale-105 transition-transform" />
                <p className="text-xs font-bold kyxun-text">Upload Question Papers</p>
                <p className="text-[9px] kyxun-text-muted mt-1">PDF, DOCX, TXT, or Snapshots</p>
              </div>

              {pyqFiles.length > 0 && (
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                  {pyqFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg border kyxun-border bg-[var(--kyxun-hover-bg)] text-[10px]">
                      <span className="kyxun-text truncate font-medium max-w-[170px]">{file.name}</span>
                      <button onClick={() => removeFile(idx)} className="kyxun-text-muted hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] font-mono leading-normal">
                  {error}
                </div>
              )}
            </div>

            <div className="pt-4 border-t kyxun-border mt-4">
              <button onClick={handleRunAnalysis} disabled={isAnalyzing} className="w-full py-3 rounded-xl font-extrabold text-white bg-[var(--kyxun-accent)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50" >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Scanning Trends...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Run AI Trend Analysis
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      )}
    </FeatureCard>
  );
}
