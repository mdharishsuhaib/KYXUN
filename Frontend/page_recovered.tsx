"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BrainCircuit, Upload, Sun, Moon,
  Sparkles, FileText, Cpu, Volume2,
  Terminal, Check, Shield
} from "lucide-react";
import { useTheme } from "@/lib/theme";

// OCR scanner formulas
const ocrFormulas = [
  { name: "Schrödinger Wave Equation", formula: "iħ ∂ψ/∂t = Ĥψ", module: "Quantum Mechanics", conf: "99.4%" },
  { name: "Faraday Electrodynamics", formula: "∮ E · dl = -dΦB/dt", module: "Electromagnetism", conf: "98.7%" },
  { name: "Entropy Constraint", formula: "dS ≥ δQ/T", module: "Thermodynamics", conf: "96.2%" },
  { name: "Euler Fluid Dynamics", formula: "∂u/∂t + (u · ∇)u = -∇p", module: "Fluid Mechanics", conf: "94.8%" },
];

// Student testimonials removed to avoid unused variable warning

export default function HomePage() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  // State
  const [ocrHighlight, setOcrHighlight] = useState(0);

  useEffect(() => {
    // Force scroll to top on reload without smooth scrolling animation
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    setTimeout(() => {
      document.documentElement.style.scrollBehavior = '';
    }, 50);
  }, []);


  return (
    <main id="main-content" className="kyxun-page relative w-full overflow-hidden min-h-screen">
      {/* Dynamic Backgrounds */}
      {/* ══════════════════════════════════════════════════════════════════════
         BACKGROUND — theme-aware, no hardcoded dark color
         ══════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 bg-[var(--kyxun-bg)] pointer-events-none z-0" />

      {/* Aurora blobs — only rendered in dark mode to avoid light-mode contrast issues */}
      {isDark && (
        <>
          <div
            className="absolute top-[-15%] left-[-15%] w-[75vw] h-[75vw] rounded-full blur-[160px] pointer-events-none opacity-45 animate-aurora-spin z-0"
            style={{ background: "radial-gradient(circle, rgba(99,102,241,0.3) 0%, rgba(168,85,247,0.15) 50%, transparent 100%)", animationDuration: "25s" }}
          />
          <div
            className="absolute top-[40%] right-[-10%] w-[65vw] h-[65vw] rounded-full blur-[160px] pointer-events-none opacity-35 animate-aurora-spin z-0"
            style={{ background: "radial-gradient(circle, rgba(6,182,212,0.22) 0%, rgba(99,102,241,0.1) 50%, transparent 100%)", animationDirection: "reverse", animationDuration: "30s" }}
          />
          <div
            className="absolute bottom-[0%] left-[-10%] w-[70vw] h-[70vw] rounded-full blur-[170px] pointer-events-none opacity-40 animate-aurora-spin z-0"
            style={{ background: "radial-gradient(circle, rgba(168,85,247,0.22) 0%, rgba(6,182,212,0.1) 50%, transparent 100%)", animationDuration: "35s" }}
          />
        </>
      )}

      {/* Glowing Tech Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(128,128,128,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(128,128,128,0.04)_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)] pointer-events-none z-0" />
      
      {/* ══════════════════════════════════════════════════════════════════════
         HEADER — Claude-inspired Navbar
         ══════════════════════════════════════════════════════════════════════ */}
      <header className="kyxun-header sticky top-0 z-50 w-full border-b border-[var(--kyxun-border)] bg-[var(--kyxun-bg)]">
        <div className="w-full px-4 sm:px-8 py-4 flex justify-between items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 drop-shadow-md dark:drop-shadow-[0_0_15px_rgba(163,230,53,0.65)]">
              <img 
                src="/logo_white_icon.png" 
                alt="Kyxun Logo" 
                className="w-full h-full object-contain dark:hidden" 
              />
              <img 
                src="/logo_dark_icon.png" 
                alt="Kyxun Logo" 
                className="w-full h-full object-contain hidden dark:block" 
              />
            </div>
            <span className="font-outfit text-2xl font-bold leading-none text-[var(--kyxun-text)]">
              Kyxun
            </span>
          </div>
          {/* Right action group */}
          <div className="flex items-center gap-6 shrink-0">
            <nav className="hidden md:flex items-center gap-5 mr-2" aria-label="Main navigation">
              <a href="#survival-plans" className="flex items-center gap-1 text-sm font-medium text-[var(--kyxun-text)] hover:opacity-70 transition-opacity">Features</a>
              <a href="#how-it-works" className="flex items-center gap-1 text-sm font-medium text-[var(--kyxun-text)] hover:opacity-70 transition-opacity">Platform</a>
              <a href="#pricing" className="text-sm font-medium text-[var(--kyxun-text)] hover:opacity-70 transition-opacity">Pricing</a>
              <a href="#contact" className="flex items-center gap-1 text-sm font-medium text-[var(--kyxun-text)] hover:opacity-70 transition-opacity">Contact</a>
            </nav>
            <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer hover:bg-[var(--kyxun-hover-bg)] transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4  " /> : <Moon className="w-4 h-4  " />}
            </button>
            <Link
              href="/signup"
              className="hidden sm:flex px-4 py-2 rounded-lg text-sm font-medium text-[var(--kyxun-text)] transition-colors border border-[var(--kyxun-border)] hover:bg-[var(--kyxun-hover-bg)]"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--kyxun-bg)] transition-opacity bg-[var(--kyxun-text)] hover:opacity-90"
            >
              Login
            </Link>
          </div>
        </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
         SECTION 1: HERO — plain-language copy, contrast-safe background
         ══════════════════════════════════════════════════════════════════════ */}
      <section id="hero" className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-16 z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center min-h-[85vh]">

        {/* Left Column — 8 cols on large, full on mobile */}
        <div className="lg:col-span-8 flex flex-col items-start text-left space-y-6">
          {/* POLISH FIX: Friendlier badge label, not error-badge style */}
          <span className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-xs font-black border kyxun-badge-indigo shadow-[0_0_35px_rgba(168,85,247,0.15)]">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span className="uppercase tracking-wider font-mono font-bold">AI-Powered Exam Copilot</span>
          </span>

          <h1 className="font-outfit text-5xl sm:text-6xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-black leading-none tracking-tighter text-[var(--kyxun-text)] pb-4">
            Dream Big.
            <br />
            Study Smart.
            <br />
            <span className="whitespace-nowrap inline-block pb-4 pt-2 pr-4 leading-tight" style={{ background: "linear-gradient(135deg, #a855f7, #6366f1, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Graduate Strong.
            </span>
          </h1>

          {/* MAJOR FIX: Plain-language copy replacing jargon */}
          <p className="text-lg sm:text-xl text-[var(--kyxun-text-muted)] max-w-xl leading-relaxed font-semibold">
            Upload your notes or syllabus. Kyxun&apos;s AI finds exactly what&apos;s worth studying, skips what&apos;s not, and builds you an hour-by-hour exam plan — in under 2 minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto pt-4">
            {/* POLISH FIX: Unified CTA label */}
            <Link
              href="/signup"
              className="px-9 py-5 rounded-2xl font-black text-xl kyxun-text text-center transition-all hover:scale-[1.03] active:scale-[0.97] shadow-[0_0_45px_rgba(99,102,241,0.5)]"
              style={{ background: "linear-gradient(135deg, var(--kyxun-accent), var(--kyxun-accent-secondary))" }}
            >
              Create Plan
            </Link>
            {/* C2 FIX (separate fix): bg-[var(--kyxun-surface)] gives #fff in light mode, ensuring text is always visible */}
            <Link
              href="/login"
              className="px-9 py-5 rounded-2xl font-bold text-xl text-center text-[var(--kyxun-text)] border border-[var(--kyxun-border)] bg-[var(--kyxun-surface)] hover:bg-[var(--kyxun-hover-bg)] transition-all"
            >
              Build Plan
            </Link>
          </div>
        </div>

        {/* Right Column — 4 cols on large, full on mobile */}
        <div className="lg:col-span-4 relative w-full flex items-center justify-center lg:justify-end">
          {/* Main Console Box */}
          <div className="w-full glass-panel rounded-3xl p-6 border border-[var(--kyxun-border)] bg-[var(--kyxun-glass)] shadow-[0_0_60px_rgba(99,102,241,0.2)] relative z-20 overflow-hidden">

            {/* POLISH FIX: Browser chrome mockup instead of macOS traffic lights */}
            <div className="flex items-center gap-2 border-b border-[var(--kyxun-border)] pb-4 mb-5">
              <div className="flex-1 flex items-center gap-2 bg-[var(--kyxun-input-bg)] border border-[var(--kyxun-border)] rounded-lg px-3 py-1.5 min-w-0">
                <Shield className="w-3.5 h-3.5 text-green-500 shrink-0" />
                <span className="text-[10px] font-mono text-[var(--kyxun-text-subtle)] font-bold truncate">kyxun.app/dashboard</span>
              </div>
              <span className="text-[11px] font-mono   font-bold uppercase tracking-widest shrink-0">dropzone scanner</span>
            </div>

            {/* Simulated file drop container */}
            <div className="border-2 border-dashed border-[var(--kyxun-border)] rounded-2xl p-9 text-center bg-[var(--kyxun-input-bg)] hover:bg-[var(--kyxun-hover-bg)] hover:border-[var(--kyxun-accent)] transition-all cursor-pointer group relative overflow-hidden">
              <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

              <div className="w-16 h-16 rounded-2xl kyxun-badge-indigo flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-7 h-7   animate-bounce" />
              </div>
              <h3 className="text-base font-black text-[var(--kyxun-text)] mb-2">Drag Syllabus &amp; Notes Here</h3>
              <p className="text-xs text-[var(--kyxun-text-muted)] max-w-[240px] mx-auto leading-relaxed">Supports PDF, PPTX, Docx, or mobile photo snapshots.</p>

              <div className="mt-5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full kyxun-badge-indigo text-[10px] font-mono   font-bold shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                <Cpu className="w-3.5 h-3.5 animate-pulse" /> AI Processing Engine
              </div>
            </div>

            {/* Status grid */}
            <div className="mt-4 space-y-2.5">
              <div className="p-4 rounded-xl border border-[var(--kyxun-border)] bg-[var(--kyxun-surface)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg kyxun-badge-indigo flex items-center justify-center">
                    <Check className="w-5 h-5  " />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[var(--kyxun-text)]">Parser Core Ready</h4>
                    <p className="text-[10px] text-[var(--kyxun-text-subtle)] font-mono">Files processed in temporary memory only</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono   kyxun-badge-indigo px-3 py-1 rounded-lg font-bold">SECURE</span>
              </div>
            </div>
          </div>


        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
         SECTION 2: VISION OCR SCANNER — click affordance added
         ══════════════════════════════════════════════════════════════════════ */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-24 relative z-10 border-t border-[var(--kyxun-border)]">
        {/* Title Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-8">
          <div className="lg:col-span-7">
            <span className="  kyxun-badge-indigo text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border font-mono shadow-[0_0_12px_rgba(99,102,241,0.2)]">
              VISION OCR LAYER
            </span>
            <h2 className="font-outfit text-4xl sm:text-5xl lg:text-6xl font-black text-[var(--kyxun-text)] mt-4 tracking-tight leading-tight">
              Real-Time Mathematical Symbol Scanner
            </h2>
            <p className="text-[var(--kyxun-text-muted)] mt-3 text-base leading-relaxed font-semibold">
              Click any formula card below to see how Kyxun reads your handwritten notes and instantly identifies what you need to study.
            </p>
          </div>
        </div>

        {/* Content Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Block */}
          <div className="lg:col-span-7">
            {/* Document sheet mockup */}
            <div className="glass-panel rounded-3xl p-6 border border-[var(--kyxun-border)] bg-[var(--kyxun-glass)] relative overflow-hidden shadow-2xl">
              {/* Laser beam scan line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400 shadow-[0_0_18px_#22d3ee] animate-laser z-10 pointer-events-none" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 z-20">
                {ocrFormulas.map((item, idx) => {
                  const isHighlighted = ocrHighlight === idx;
                  return (
                    /* MINOR FIX: cursor-pointer explicit, hover shadow, aria-label for accessibility */
                    <button
                      key={item.name}
                      onClick={() => setOcrHighlight(idx)}
                      aria-label={`Scan formula: ${item.name}`}
                      className={`p-4 rounded-2xl text-left border cursor-pointer select-none transition-all ${
                        isHighlighted
                          ? "bg-[var(--kyxun-surface-hover)] border-cyan-500 shadow-[0_0_25px_rgba(34,211,238,0.3)] scale-[1.02] ring-1 ring-cyan-400/30"
                          : "bg-[var(--kyxun-surface)] border-[var(--kyxun-border)] hover:border-cyan-500/60 hover:bg-[var(--kyxun-surface-hover)] hover:shadow-[0_0_12px_rgba(34,211,238,0.15)] hover:scale-[1.01]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono text-[var(--kyxun-text-subtle)] font-bold">{item.name}</span>
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      </div>
                      <p className="font-mono text-base sm:text-lg font-black text-[var(--kyxun-text)] text-center py-2.5 bg-[var(--kyxun-input-bg)] rounded-xl border border-[var(--kyxun-border)]">
                        {item.formula}
                      </p>
                      <div className="flex justify-between items-center mt-2 text-[9px] font-mono text-[var(--kyxun-text-subtle)]">
                        <span>CONFIDENCE</span>
                        <span className="text-green-500 font-black">{item.conf}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Page footer — MINOR FIX: click affordance label added */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-t border-[var(--kyxun-border)] pt-3 mt-4 gap-1 text-[10px] font-mono text-[var(--kyxun-text-subtle)]">
                <span>OCR Vision Scanner: ACTIVE</span>
                <span className="text-cyan-500 font-bold">↑ Click any card to scan it</span>
              </div>
            </div>
          </div>

          {/* Right Block: Telemetry logs */}
          <div className="lg:col-span-5">
            <div className="glass-panel rounded-3xl p-6 border border-[var(--kyxun-border)] bg-[var(--kyxun-glass)] shadow-2xl relative overflow-hidden h-full min-h-[420px] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[var(--kyxun-border)] pb-3 mb-4 text-[var(--kyxun-text-subtle)] text-[10px] font-mono">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Terminal className="w-4 h-4 text-indigo-500 dark: " /> symbol_diagnostics.telemetry
                  </span>
                  <span>Vision parser</span>
                </div>

                <div className="space-y-3 font-mono text-xs text-[var(--kyxun-text)] select-text leading-relaxed">
                  <p className="text-cyan-600 dark:  font-bold">{"[OCR PARSER MATCHING]"}</p>
                  <p className="text-[var(--kyxun-text-subtle)] opacity-50 font-bold">{"-----------------------------------------"}</p>
                  <p>DETECTED TERM: <span className="font-black bg-[var(--kyxun-surface-hover)] px-2.5 py-1 rounded border border-[var(--kyxun-border)]">{ocrFormulas[ocrHighlight].formula}</span></p>
                  <p>CLASSIFICATION: <span className="text-purple-600 dark:  font-black">{ocrFormulas[ocrHighlight].name}</span></p>
                  <p>MODULE DOMAIN: <span className="text-amber-600 dark:  font-black">{ocrFormulas[ocrHighlight].module}</span></p>
                  <p>OCR CONFIDENCE: <span className="text-green-600 dark:text-green-400 font-black">{ocrFormulas[ocrHighlight].conf}</span></p>
                  <p className="text-[var(--kyxun-text-subtle)] opacity-50 font-bold">{"-----------------------------------------"}</p>
                  <p className="text-indigo-600 dark:  font-bold">{"⚡ Correlating past exam frequencies..."}</p>
                  <p className="text-green-600 dark:text-green-400 font-black">{"[SUCCESS] Matches syllabus weight candidates."}</p>
                </div>
              </div>

              <div className="border-t border-[var(--kyxun-border)] pt-3 text-[10px] font-mono text-[var(--kyxun-text-subtle)] mt-6">
                Click on the formulas above to scan another card.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
         SECTION 3: HOW IT WORKS — generic step labels, plain copy
         ══════════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 py-24 relative z-10 border-t border-[var(--kyxun-border)]">
        <div className="text-center mb-16">
          <span className="  kyxun-badge-indigo text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border font-mono shadow-[0_0_12px_rgba(168,85,247,0.2)]">
            VISUAL STORYTELLING
          </span>
          <h2 className="font-outfit text-4xl sm:text-5xl lg:text-6xl font-black text-[var(--kyxun-text)] mt-4 tracking-tight leading-tight">
            How to Survive the Night Before
          </h2>
          <p className="text-[var(--kyxun-text-muted)] mt-3 text-base font-semibold max-w-lg mx-auto">
            Traditional tools force you to reread everything. Kyxun runs a smart pipeline to build your exact strategy.
          </p>
        </div>

        {/* Asymmetrical storyboard grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch max-w-6xl mx-auto">
          {/* Card 1 */}
          <div className="md:col-span-7 glass-panel glass-panel-hover rounded-3xl p-7 border border-[var(--kyxun-border)] bg-[var(--kyxun-glass)] relative overflow-hidden min-h-[260px] flex flex-col justify-between group shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 kyxun-badge-indigo rounded-full blur-2xl group-hover:kyxun-badge-indigo transition-all" />
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-[11px] font-mono   kyxun-badge-indigo px-3 py-1 rounded-full font-bold shadow-[0_0_8px_rgba(99,102,241,0.2)]">
                  Step 1 // Upload
                </span>
                <span className="text-[10px] font-mono text-[var(--kyxun-text-subtle)] font-bold">Ingest Syllabus</span>
              </div>
              <h3 className="font-outfit text-2xl font-black text-[var(--kyxun-text)] mb-2 leading-snug">Upload Your Notes &amp; Syllabus</h3>
              <p className="text-sm text-[var(--kyxun-text-muted)] leading-relaxed font-semibold max-w-md">
                Drop your PDFs, lecture slides, or phone photos. Kyxun reads them instantly — no typing or reformatting needed.
              </p>
            </div>
            <div className="flex items-center gap-3 mt-5 font-mono text-[10px] text-[var(--kyxun-text-muted)] bg-[var(--kyxun-input-bg)] border border-[var(--kyxun-border)] p-3 rounded-xl">
              <FileText className="w-5 h-5  " />
              <span>Parsed: your_notes.pdf (1.42MB)</span>
              <span className="  kyxun-badge-indigo px-2.5 py-0.5 rounded font-black ml-auto">✓ SECURE</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="md:col-span-5 glass-panel glass-panel-hover rounded-3xl p-7 border border-[var(--kyxun-border)] bg-[var(--kyxun-glass)] relative overflow-hidden min-h-[260px] flex flex-col justify-between group shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 kyxun-badge-indigo rounded-full blur-2xl group-hover:kyxun-badge-indigo transition-all" />
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-[11px] font-mono   kyxun-badge-indigo px-3 py-1 rounded-full font-bold shadow-[0_0_8px_rgba(168,85,247,0.2)]">
                  Step 2 // AI Analysis
                </span>
                <span className="text-[10px] font-mono text-[var(--kyxun-text-subtle)] font-bold">Yield Classifier</span>
              </div>
              <h3 className="font-outfit text-2xl font-black text-[var(--kyxun-text)] mb-2 leading-snug">AI Finds What&apos;s Worth Studying</h3>
              <p className="text-sm text-[var(--kyxun-text-muted)] leading-relaxed font-semibold">
                Kyxun ranks every topic by exam likelihood, then marks what to skip — saving you hours on low-priority content.
              </p>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-[9px] font-mono">
              <span className="px-3 py-1.5 rounded-lg   kyxun-badge-indigo font-bold shadow-[0_0_8px_rgba(244,63,94,0.15)]">
                SKIP: Low-weight appendix (Saved 3h)
              </span>
              <span className="px-3 py-1.5 rounded-lg   kyxun-badge-indigo font-bold">
                FOCUS: Core Theorems
              </span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="md:col-span-5 glass-panel glass-panel-hover rounded-3xl p-7 border border-[var(--kyxun-border)] bg-[var(--kyxun-glass)] relative overflow-hidden min-h-[260px] flex flex-col justify-between group shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl group-hover:bg-pink-500/15 transition-all" />
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-[11px] font-mono   kyxun-badge-indigo px-3 py-1 rounded-full font-bold shadow-[0_0_8px_rgba(244,63,94,0.2)]">
                  Step 3 // Practice
                </span>
                <span className="text-[10px] font-mono text-[var(--kyxun-text-subtle)] font-bold">Active Recall</span>
              </div>
              <h3 className="font-outfit text-2xl font-black text-[var(--kyxun-text)] mb-2 leading-snug">Flashcards &amp; Active Recall</h3>
              <p className="text-sm text-[var(--kyxun-text-muted)] leading-relaxed font-semibold">
                Auto-generated flashcard decks from your most important topics. Study smarter with spaced repetition built into your plan.
              </p>
            </div>
            <div className="mt-5 flex justify-between items-center border border-[var(--kyxun-border)] bg-[var(--kyxun-input-bg)] p-3 rounded-xl text-[10px] font-mono">
              <span className="text-[var(--kyxun-text-muted)] font-bold">Flashcard Deck: Active</span>
              <span className="  font-black">48 cards generated</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="md:col-span-7 glass-panel glass-panel-hover rounded-3xl p-7 border border-[var(--kyxun-border)] bg-[var(--kyxun-glass)] relative overflow-hidden min-h-[260px] flex flex-col justify-between group shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/15 transition-all" />
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-[11px] font-mono   kyxun-badge-indigo px-3 py-1 rounded-full font-bold shadow-[0_0_8px_rgba(6,182,212,0.2)]">
                  Step 4 // Simulate
                </span>
                <span className="text-[10px] font-mono text-[var(--kyxun-text-subtle)] font-bold">Viva Practice</span>
              </div>
              <h3 className="font-outfit text-2xl font-black text-[var(--kyxun-text)] mb-2 leading-snug">AI Oral Exam Simulator</h3>
              <p className="text-sm text-[var(--kyxun-text-muted)] leading-relaxed font-semibold max-w-md">
                Plug in your microphone and let the AI coach voice-interview you on weak subjects. It evaluates your answers and pushes your readiness score up in real time.
              </p>
            </div>
            <div className="mt-5 flex items-center justify-between border border-[var(--kyxun-border)] bg-[var(--kyxun-input-bg)] p-3 rounded-xl text-[10px] font-mono">
              <span className="flex items-center gap-2   font-black">
                <Volume2 className="w-5 h-5 animate-pulse" /> Oral Coach Online
              </span>
              <span className="text-[var(--kyxun-text-muted)] font-bold">Ready to transcribe speech</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
         SECTION 6: COMPARISON TABLE
         MINOR FIX: overflow-x-auto ensures all rows always visible on mobile
         ══════════════════════════════════════════════════════════════════════ */}
      <section id="survival-plans" className="max-w-7xl mx-auto px-4 sm:px-6 py-24 relative z-10 border-t border-[var(--kyxun-border)]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-outfit text-4xl sm:text-5xl lg:text-6xl font-black text-[var(--kyxun-text)] tracking-tight leading-tight">
              We build survival plans, not static summaries
            </h2>
            <p className="text-[var(--kyxun-text-muted)] mt-3 text-base font-semibold">
              Why exam-stressed students choose Kyxun over standard AI chat tools.
            </p>
          </div>

          {/* MINOR FIX: overflow-x-auto added, min-w on table ensures mobile scrollability */}
          <div className="glass-panel rounded-3xl overflow-hidden border border-[var(--kyxun-border)] bg-[var(--kyxun-glass)] shadow-2xl overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-[var(--kyxun-border)] bg-[var(--kyxun-bg-secondary)]">
                  <th className="p-6 font-outfit font-black text-base text-[var(--kyxun-text)]">Feature</th>
                  <th className="p-6 font-outfit font-black text-base text-[var(--kyxun-accent)]">Kyxun AI Copilot</th>
                  <th className="p-6 font-outfit font-black text-base text-[var(--kyxun-text-subtle)]">Standard AI Chatbots</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--kyxun-border)] font-bold text-[var(--kyxun-text-muted)]">
                <tr>
                  <td className="p-6 text-[var(--kyxun-text)] font-black">Reads images &amp; handwritten notes</td>
                  <td className="p-6   kyxun-badge-">✓ Parses photos, PDFs &amp; slides</td>
                  <td className="p-6 text-[var(--kyxun-text-subtle)] font-normal">Converts image to unformatted text</td>
                </tr>
                <tr>
                  <td className="p-6 text-[var(--kyxun-text)] font-black">Knows what&apos;s on the exam</td>
                  <td className="p-6   kyxun-badge-">✓ Cross-referenced with 15-year past paper data</td>
                  <td className="p-6 text-[var(--kyxun-text-subtle)] font-normal">No connection to academic statistics</td>
                </tr>
                <tr>
                  <td className="p-6 text-[var(--kyxun-text)] font-black">Tells you what to skip</td>
                  <td className="p-6   kyxun-badge-">✓ Saves 5+ hours on low-weight content</td>
                  <td className="p-6 text-[var(--kyxun-text-subtle)] font-normal">Tells you to read everything</td>
                </tr>
                <tr>
                  <td className="p-6 text-[var(--kyxun-text)] font-black">Oral exam practice</td>
                  <td className="p-6   kyxun-badge-">✓ Voice viva simulation with scoring</td>
                  <td className="p-6 text-[var(--kyxun-text-subtle)] font-normal">Text-only responses</td>
                </tr>
                <tr>
                  <td className="p-6 text-[var(--kyxun-text)] font-black">Your data is private</td>
                  <td className="p-6   kyxun-badge-">✓ Cleared from memory after each session</td>
                  <td className="p-6 text-[var(--kyxun-text-subtle)] font-normal">May store inputs for model training</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
         SECTION 7: PRICING — new section, fully responsive
         ══════════════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 py-24 relative z-10 border-t border-[var(--kyxun-border)]">
        <div className="text-center mb-16">
          <span className="  kyxun-badge-indigo text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border font-mono shadow-[0_0_12px_rgba(168,85,247,0.2)]">
            SIMPLE PRICING
          </span>
          <h2 className="font-outfit text-4xl sm:text-5xl lg:text-6xl font-black text-[var(--kyxun-text)] mt-4 tracking-tight leading-tight">
            Start free. Upgrade before exams.
          </h2>
          <p className="text-[var(--kyxun-text-muted)] mt-3 text-base font-semibold max-w-md mx-auto">
            No subscription traps. Pay only when you need it most.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {/* Free Plan */}
          <div className="glass-panel rounded-3xl p-8 border border-[var(--kyxun-border)] bg-[var(--kyxun-glass)] flex flex-col shadow-xl">
            <div className="mb-6">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--kyxun-text-subtle)]">FREE FOREVER</span>
              <h3 className="font-outfit text-3xl font-black text-[var(--kyxun-text)] mt-2">Free</h3>
              <div className="flex items-end gap-1 mt-3">
                <span className="text-5xl font-mono font-black text-[var(--kyxun-text)]">$0</span>
                <span className="text-[var(--kyxun-text-subtle)] font-semibold mb-2">/month</span>
              </div>
            </div>
            <ul className="space-y-3 flex-1 mb-8">
              {[
                "3 study plan generations per month",
                "PDF & image upload (up to 10MB)",
                "AI topic prioritisation",
                "Basic flashcard generation",
                "Secure session — no data stored",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-[var(--kyxun-text-muted)] font-semibold">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="w-full py-4 rounded-2xl font-black text-base text-center text-[var(--kyxun-text)] border border-[var(--kyxun-border)] bg-[var(--kyxun-surface)] hover:bg-[var(--kyxun-hover-bg)] transition-all"
            >
              Get Started
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="glass-panel rounded-3xl p-8 border-2 border-[var(--kyxun-accent)] bg-[var(--kyxun-glass)] flex flex-col shadow-[0_0_60px_rgba(99,102,241,0.2)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 kyxun-badge-indigo rounded-full blur-3xl" />
            <div className="mb-6">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest   kyxun-badge-indigo px-3 py-1 rounded-full">
                <Sparkles className="w-3.5 h-3.5" /> MOST POPULAR
              </span>
              <h3 className="font-outfit text-3xl font-black text-[var(--kyxun-text)] mt-2">Pro</h3>
              <div className="flex items-end gap-1 mt-3">
                <span className="text-5xl font-mono font-black text-[var(--kyxun-text)]">$9</span>
                <span className="text-[var(--kyxun-text-subtle)] font-semibold mb-2">/month</span>
              </div>
              <p className="text-xs text-[var(--kyxun-text-subtle)] font-mono mt-1">or $24 for exam season (3 months)</p>
            </div>
            <ul className="space-y-3 flex-1 mb-8">
              {[
                "Unlimited study plan generations",
                "All file types up to 50MB",
                "Advanced AI with 15-year exam data",
                "Unlimited flashcards + oral viva coach",
                "Priority processing",
                "Everything in Free",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-[var(--kyxun-text-muted)] font-semibold">
                  <Check className="w-4 h-4 text-[var(--kyxun-accent)] mt-0.5 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="w-full py-4 rounded-2xl font-black text-base kyxun-text text-center transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_rgba(99,102,241,0.3)]"
              style={{ background: "linear-gradient(135deg, var(--kyxun-accent), var(--kyxun-accent-secondary))" }}
            >
              Grab Pro
            </Link>
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════════════
         FOOTER — rebuilt with Privacy Policy, Terms, Contact, About
         ══════════════════════════════════════════════════════════════════════ */}
      <footer className="relative z-50 bg-[var(--kyxun-bg)] border-t border-[var(--kyxun-border)] pt-16 pb-12 w-full mt-auto">
        <div className="w-full px-4 sm:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
          {/* Brand */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, var(--kyxun-accent), var(--kyxun-accent-secondary))" }}
              >
                <BrainCircuit className="w-4 h-4 kyxun-text" />
              </div>
              <span className="font-outfit font-black text-xl text-[var(--kyxun-text)]">Kyxun</span>
            </div>
            <p className="text-sm text-[var(--kyxun-text-subtle)] font-semibold leading-relaxed">
              AI-powered exam copilot for students who study smart, not hard.
            </p>
          </div>

          {/* Links Section */}
          <div className="flex gap-12 sm:gap-24">
            <div>
              <h4 className="text-[10px] font-mono font-black uppercase tracking-widest text-[var(--kyxun-text-subtle)] mb-5">PRODUCT</h4>
              <ul className="space-y-4">
                {[["Features", "#survival-plans"], ["How It Works", "#how-it-works"], ["Pricing", "#pricing"]].map(([label, href]) => (
                  <li key={label}>
                    <a href={href} className="text-sm font-semibold text-[var(--kyxun-text-muted)] hover:text-[var(--kyxun-text)] transition-colors">{label}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div id="contact">
              <h4 className="text-[10px] font-mono font-black uppercase tracking-widest text-[var(--kyxun-text-subtle)] mb-5">CONTACT</h4>
              <ul className="space-y-4">
                <li>
                  <a href="https://mail.google.com/mail/?view=cm&fs=1&to=zoqelcorp@gmail.com" target="_blank" rel="noopener noreferrer" className="block text-sm font-semibold text-[var(--kyxun-text-muted)] hover:text-[var(--kyxun-text)] transition-colors cursor-pointer">zoqelcorp@gmail.com</a>
                </li>
                <li>
                  <a href="https://wa.me/919841161900" target="_blank" rel="noopener noreferrer" className="block text-sm font-semibold text-[var(--kyxun-text-muted)] hover:text-[var(--kyxun-text)] transition-colors cursor-pointer">+91 9841161900</a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar - horizontally aligned critical links & clear status badge */}
        <div className="border-t border-[var(--kyxun-border)] pt-8 flex flex-col items-center justify-center gap-6 relative">
          <p className="text-xs font-semibold text-[var(--kyxun-text-subtle)] text-center">
            © 2026 Kyxun Pvt Ltd. All rights reserved.
          </p>
          
          {/* Green dot wrapped in a clear badge so it doesn't look like a random dot */}
          <div className="flex lg:absolute lg:right-0 lg:top-8 items-center gap-2.5 px-4 py-2 rounded-full bg-[var(--kyxun-input-bg)] border border-[var(--kyxun-border)] shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
            <span className="text-[10px] font-mono font-black text-[var(--kyxun-text)] uppercase tracking-widest">System Operational</span>
          </div>
        </div>
        </div>
      </footer>
    </main>
  );
}
