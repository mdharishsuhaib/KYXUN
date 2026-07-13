"use client";

import { useMemo, useState, useEffect } from "react";
import { Brain, FlipHorizontal2, Award, ChevronLeft, ChevronRight, Filter, Bookmark } from "lucide-react";
import type { StudyPlan } from "@/lib/academic";
import { buildFlashcards } from "@/lib/academic";
import FeatureCard from "./FeatureCard";

interface Props {
  plan: StudyPlan;
  subject: string;
  onKnownCountChange?: (count: number) => void;
}

export default function FlashcardGenerator({ plan, subject, onKnownCountChange }: Props) {
  const localCards = useMemo(() => buildFlashcards(plan, subject), [plan, subject]);
  const [dbCards, setDbCards] = useState<Array<{ id: string, front: string, back: string, tag?: string, difficulty?: string, isMastered?: boolean }>>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<string>>(() => new Set());
  const [filterMode, setFilterMode] = useState<"all" | "memorized" | "review">("all");

  // Fetch cards from Supabase on mount
  useEffect(() => {
    const fetchCards = async () => {
      if (!plan || !plan.id) {
        setDbCards(localCards);
        return;
      }
      try {
        const { supabase } = await import("@/lib/supabase");
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) {
          setDbCards(localCards);
          return;
        }

        const { flashcardService } = await import("@/lib/services/flashcardService");
        const data = await flashcardService.getFlashcards(user.id, plan.id);
        
        if (data && data.length > 0) {
          setDbCards(data as any);
          const masteredSet = new Set<string>();
          data.forEach(c => {
            if (c.isMastered) {
              masteredSet.add(c.id as string);
            }
          });
          setKnown(masteredSet);
          if (onKnownCountChange) onKnownCountChange(masteredSet.size);
        } else {
          setDbCards(localCards);
        }
      } catch (err) {
        console.error("Failed to fetch flashcards from database:", err);
        setDbCards(localCards);
      }
    };
    fetchCards();
  }, [plan, subject, localCards, onKnownCountChange]);

  const rawCards = dbCards.length > 0 ? dbCards : localCards;

  // Filtered list based on state
  const filteredCards = useMemo(() => {
    return rawCards.filter(c => {
      const isKnown = known.has(c.id);
      if (filterMode === "memorized") return isKnown;
      if (filterMode === "review") return !isKnown;
      return true;
    });
  }, [rawCards, known, filterMode]);

  const cardsCount = filteredCards.length;
  const current = cardsCount ? filteredCards[index % cardsCount] : null;
  const progress = rawCards.length ? Math.round((known.size / rawCards.length) * 100) : 0;

  const move = (direction: number) => {
    if (cardsCount === 0) return;
    setIndex((value) => (value + direction + cardsCount) % cardsCount);
    setFlipped(false);
  };

  const toggleKnown = async () => {
    if (!current) return;
    const cardId = current.id;
    const isCurrentlyKnown = known.has(cardId);

    setKnown((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      if (onKnownCountChange) onKnownCountChange(next.size);
      return next;
    });

    // Update local state isMastered
    setDbCards(p => p.map(c => c.id === cardId ? { ...c, isMastered: !isCurrentlyKnown } : c));

    // If card is saved in Supabase
    if (plan?.id && cardId.includes("-") && cardId.length > 10) {
      try {
        const { flashcardService } = await import("@/lib/services/flashcardService");
        await flashcardService.updateFlashcardMastery(cardId, !isCurrentlyKnown);
      } catch (e) {
        console.error("Failed to sync card mastery state to Supabase:", e);
      }
    }
  };

  const setCardDifficulty = async (difficulty: "Easy" | "Medium" | "Hard") => {
    if (!current) return;
    const cardId = current.id;

    // Update local card difficulty
    setDbCards(prev => prev.map(c => c.id === cardId ? { ...c, difficulty } : c));

    if (plan?.id && cardId.includes("-") && cardId.length > 10) {
      try {
        const { supabase } = await import("@/lib/supabase");
        await supabase
          .from("flashcards")
          .update({ difficulty })
          .eq("id", cardId);
      } catch (e) {
        console.error("Failed to sync card difficulty to Supabase:", e);
      }
    }
  };

  const getDifficultyBadgeColor = (diff?: string) => {
    switch (diff) {
      case "Easy": return "bg-green-500/10 border-green-500/20 text-green-400";
      case "Hard": return "bg-red-500/10 border-red-500/20 text-red-400";
      default: return "bg-blue-500/10 border-blue-500/20 text-blue-400";
    }
  };

  return (
    <FeatureCard eyebrow="Recall Engine" title="Active Recall Flashcards" icon={Brain}>
      <div className="space-y-4">
        
        {/* State filters row */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b kyxun-border pb-3">
          <div className="flex items-center gap-1.5 text-xs kyxun-text-muted">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </div>
          <div className="flex gap-1.5">
            {[
              { id: "all", label: "Show All" },
              { id: "review", label: "Needs Review" },
              { id: "memorized", label: "Memorized" }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setFilterMode(tab.id as "all" | "memorized" | "review"); setIndex(0); setFlipped(false); }}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                  filterMode === tab.id
                    ? "border-indigo-500/35 kyxun-badge-indigo "
                    : "kyxun-border bg-[var(--kyxun-hover-bg)] kyxun-text-muted hover:bg-[var(--kyxun-hover-bg)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {cardsCount === 0 ? (
          <div className="min-h-64 flex flex-col items-center justify-center text-center p-6 border kyxun-border bg-[var(--kyxun-hover-bg)] rounded-3xl">
            <Bookmark className="w-8 h-8 kyxun-text-muted mb-3" />
            <p className="text-sm font-semibold kyxun-text-muted">No flashcards match this filter.</p>
            <p className="text-xs kyxun-text-muted mt-1 leading-normal">
              {filterMode === "memorized" ? "Mark cards as memorized to see them here." : "All cards have been memorized! Great job."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
            
            {/* 3D perspective flip card container */}
            <div className="min-h-64 h-64 w-full perspective-1000">
              <div 
                onClick={() => setFlipped(f => !f)}
                className={`w-full h-full relative transform-style-3d transition-transform duration-500 cursor-pointer ${
                  flipped ? "rotate-y-180" : ""
                }`}
              >
                {/* FRONT OF THE CARD */}
                <div 
                  className="absolute inset-0 backface-hidden rounded-3xl p-6 flex flex-col justify-between text-left border kyxun-border bg-[var(--kyxun-hover-bg)] shadow-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-transparent rounded-3xl pointer-events-none" />
                  <div className="flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider   kyxun-badge-indigo ">
                        {current?.tag || "Must Study"}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getDifficultyBadgeColor((current as any)?.difficulty)}`}>
                        {(current as any)?.difficulty || "Medium"}
                      </span>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs kyxun-text-muted font-bold hover:kyxun-text transition-colors">
                      <FlipHorizontal2 className="w-3.5 h-3.5" /> Tap to Flip
                    </span>
                  </div>
                  <div className="my-auto z-10">
                    <p className="text-[10px] font-bold uppercase tracking-widest kyxun-text-muted mb-2">Question</p>
                    <p className="font-outfit text-xl sm:text-2xl font-black kyxun-text leading-snug">
                      {current?.front}
                    </p>
                  </div>
                  <div className="text-[10px] kyxun-text-muted font-medium z-10">Click physically anywhere on this card to turn it around.</div>
                </div>

                {/* BACK OF THE CARD */}
                <div 
                  className="absolute inset-0 backface-hidden rotate-y-180 rounded-3xl p-6 flex flex-col justify-between text-left border   bg-indigo-950/20 shadow-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-transparent rounded-3xl pointer-events-none" />
                  <div className="flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider   kyxun-badge-indigo ">
                        Model Explanation
                      </span>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs kyxun-text-muted font-bold hover:kyxun-text transition-colors">
                      <FlipHorizontal2 className="w-3.5 h-3.5" /> Tap to Flip
                    </span>
                  </div>
                  <div className="my-auto z-10">
                    <p className="text-[10px] font-bold uppercase tracking-widest kyxun-text-muted mb-2">Answer</p>
                    <p className="font-sans text-sm sm:text-base font-medium kyxun-text-muted leading-relaxed">
                      {current?.back}
                    </p>
                  </div>
                  <div className="text-[10px] kyxun-text-muted font-medium z-10">Click anywhere to flip back to the question.</div>
                </div>

              </div>
            </div>

            {/* Action console sidebar */}
            <div className="space-y-4 flex flex-col justify-between">
              
              {/* Mastery bar */}
              <div className="rounded-2xl p-4 border kyxun-border bg-[var(--kyxun-hover-bg)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-12 h-12 bg-[var(--kyxun-hover-bg)] rounded-full blur-lg pointer-events-none" />
                <p className="text-[10px] kyxun-text-muted uppercase font-bold tracking-wider mb-1">Retrieval Mastery</p>
                <p className="text-3xl font-black kyxun-text font-outfit">
                  {progress}<span className="text-sm kyxun-text-muted font-bold ml-1">%</span>
                </p>
                <div className="h-1.5 w-full bg-[var(--kyxun-hover-bg)] rounded-full overflow-hidden mt-3">
                  <div className="h-full bg-green-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>

              {/* Difficulty grade select */}
              {current && (
                <div className="space-y-1.5">
                  <p className="text-[9px] kyxun-text-muted uppercase font-bold tracking-wider">Set Retention Difficulty</p>
                  <div className="grid grid-cols-3 gap-1">
                    {["Easy", "Medium", "Hard"].map(diff => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setCardDifficulty(diff as "Easy" | "Medium" | "Hard")}
                        className={`py-1.5 rounded-lg text-[9px] font-bold uppercase border transition-all cursor-pointer ${
                          (current as any).difficulty === diff
                            ? diff === "Easy"
                              ? "border-green-500/30 bg-green-500/10 text-green-400"
                              : diff === "Hard"
                              ? "border-red-500/30 bg-red-500/10 text-red-400"
                              : "border-blue-500/30 bg-blue-500/10 text-blue-400"
                            : "kyxun-border bg-[var(--kyxun-hover-bg)] kyxun-text-muted hover:bg-[var(--kyxun-hover-bg)]"
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* General actions */}
              <div className="space-y-2">
                {current && (
                  <button type="button" onClick={toggleKnown} className=" text-white bg-[var(--kyxun-accent)]" style={{ background: known.has(current.id) ? "rgba(16,185,129,0.1)" : "var(--kyxun-accent)", color: known.has(current.id) ? "#10b981" : "#fff", borderColor: known.has(current.id) ? "rgba(16,185,129,0.25)" : "transparent", }} >
                    <Award className="w-4 h-4" />
                    {known.has(current.id) ? "Concept Verified" : "Mark as Memorized"}
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button" 
                    onClick={() => move(-1)} 
                    className="py-2.5 rounded-xl text-xs font-bold kyxun-text-muted hover:kyxun-text hover:bg-[var(--kyxun-hover-bg)] border kyxun-border transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  <button 
                    type="button" 
                    onClick={() => move(1)} 
                    className="py-2.5 rounded-xl text-xs font-bold kyxun-text-muted hover:kyxun-text hover:bg-[var(--kyxun-hover-bg)] border kyxun-border transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-[10px] kyxun-text-muted text-center font-mono font-bold tracking-wider">
                Card {cardsCount ? index + 1 : 0} of {cardsCount}
              </p>
            </div>

          </div>
        )}

      </div>
    </FeatureCard>
  );
}
