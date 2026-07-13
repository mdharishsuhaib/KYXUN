"use client";

/**
 * KYXUN CHAT PAGE — PERFORMANCE OPTIMIZED
 *
 * Root state rule:
 *   ONLY `messages`, `isLoading`, `files`, `activeSessionId`, `session`
 *   live here. `input` (the textarea value) lives ONLY in <ChatInput>
 *   via an internal ref, so keystrokes NEVER reach the root and can
 *   never trigger a re-render of MessageList, flashcards, or quiz cards.
 *
 * Memoization layers:
 *   - <MessageList>        → React.memo, re-renders only when messages/isLoading changes
 *   - <AssistantMessage>   → React.memo, re-renders only when its own content changes
 *   - <ChatInput>          → React.memo, receives stable callbacks via useCallback
 *   - submitMessage        → useCallback (stable reference across renders)
 *   - clearChat            → useCallback
 *   - removeFile           → useCallback
 */

import {
  useState, useRef, useEffect, useCallback, useMemo, memo
} from "react";
import {
  BrainCircuit, Send, User, ArrowLeft, Sun, Moon, Trash2, Paperclip,
  FileText, X, Image as ImageIcon
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getSession, type Session } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { sharedData } from "@/lib/store";
import { chatService } from "@/lib/services/chatService";
import Sidebar from "@/components/workspace/ClientSidebarWrapper";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Message {
  role: "user" | "assistant";
  content: string;
  attachments?: { name: string; url?: string; type: string }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Static constant — defined OUTSIDE component so it never causes re-renders
// ─────────────────────────────────────────────────────────────────────────────
const SUGGESTED_PROMPTS = [
  { label: "Summarize focus areas", text: "Please summarize the core focus areas of my syllabus and list the three most common exam traps." },
  { label: "Create a cheat sheet", text: "Draft a high-weightage cheat sheet containing the key formulas and core definitions." },
  { label: "Draft 5 practice questions", text: "Create 5 practice viva questions (warm-up, core, and pressure difficulty) with answers." },
  { label: "Debug my logic", text: "I have a concept I don't understand, can you explain it simply?" },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components (all memoized)
// ─────────────────────────────────────────────────────────────────────────────

/** Renders a single AI assistant message with rich cards.
 *  Memoized so it only re-renders when this message's content changes. */
const AssistantMessage = memo(function AssistantMessage({
  content, isLast, isLoading,
  onFollowUp,
}: {
  content: string;
  isLast: boolean;
  isLoading: boolean;
  onFollowUp: (text: string) => void;
}) {
  // Per-message interactive state lives HERE, not in root
  const [revealedCards, setRevealedCards] = useState<Record<string, boolean>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [activeCardIdx, setActiveCardIdx] = useState(0);

  const flipCard = useCallback((key: string, current: boolean) => {
    setRevealedCards(p => ({ ...p, [key]: !current }));
  }, []);

  const answerQuiz = useCallback((key: string, answer: string) => {
    setQuizAnswers(p => ({ ...p, [key]: answer }));
  }, []);

  const prevCard = useCallback(() => {
    setActiveCardIdx(i => Math.max(0, i - 1));
    setRevealedCards(p => ({ ...p, [`card_${activeCardIdx - 1}`]: false }));
  }, [activeCardIdx]);

  const nextCard = useCallback((flashcards: unknown[]) => {
    setActiveCardIdx(i => Math.min((flashcards.length - 1), i + 1));
    setRevealedCards(p => ({ ...p, [`card_${activeCardIdx + 1}`]: false }));
  }, [activeCardIdx]);

  if (!content.trim()) {
    if (isLoading && isLast) {
      return (
        <div className="flex flex-col gap-2.5 py-2 font-mono text-[10px] kyxun-text-muted">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border border-indigo-400 border-t-transparent animate-spin shrink-0" />
            <span>IIT Professor is formulating exam response...</span>
          </div>
          <span className="text-[9px] uppercase tracking-wider  /60 animate-pulse">
            Retrieving relevant notes context
          </span>
        </div>
      );
    }
    return null;
  }

  let data: Record<string, unknown> | null = null;
  let parseError = false;
  try {
    data = JSON.parse(content);
    if (!data || typeof data !== "object") throw new Error("Not an object");
  } catch {
    parseError = true;
  }

  if (parseError || !data) {
    if (isLoading && isLast) {
      return (
        <div className="flex flex-col gap-2.5 py-2 font-mono text-[10px] kyxun-text-muted">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border border-indigo-400 border-t-transparent animate-spin shrink-0" />
            <span>IIT Professor is formulating exam response...</span>
          </div>
          <span className="text-[9px] uppercase tracking-wider  /60 animate-pulse">
            Running document retrieval
          </span>
        </div>
      );
    }
    return (
      <p className="text-xs leading-relaxed whitespace-pre-wrap font-medium break-words font-sans kyxun-text-muted">
        {content}
      </p>
    );
  }

  const title = (data.title as string) || "Study Strategy Insights";
  const grounding = (data.grounding as Record<string, any>) || {};
  const body = (data.content as Record<string, any>) || {};
  const flashcards: { front: string, back: string }[] = (data.flashcards as { front: string, back: string }[]) || [];
  const quiz: { question: string, options?: string[], answer: string, explanation?: string }[] = (data.quiz as { question: string, options?: string[], answer: string, explanation?: string }[]) || [];
  const followUps: string[] = (data.follow_ups as string[]) || [];

  const confidence = (grounding.confidence as number) || 0;
  const confidenceColor = confidence >= 80
    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-bold"
    : confidence >= 50
      ? "bg-amber-500/10 border-amber-500/20   font-bold"
      : "bg-red-500/10 border-red-500/20 text-red-400";

  const activeCard = flashcards[activeCardIdx];
  const cardKey = `card_${activeCardIdx}`;
  const isFlipped = !!revealedCards[cardKey];

  return (
    <div className="space-y-4 w-full">
      {/* Grounding badges */}
      <div className="flex flex-wrap gap-2 items-center">
        {grounding.module && grounding.module !== "N/A" && (
          <span className="px-2 py-0.5 rounded-lg kyxun-badge-indigo border-indigo-500/30 text-[9px] font-bold   font-mono">
            {String(grounding.module)}
          </span>
        )}
        {grounding.chapter && grounding.chapter !== "N/A" && (
          <span className="px-2 py-0.5 rounded-lg kyxun-badge-indigo border-purple-500/30 text-[9px] font-bold   font-mono truncate max-w-[140px]">
            {String(grounding.chapter)}
          </span>
        )}
        {grounding.page && grounding.page !== "N/A" && (
          <span className="px-2 py-0.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-[9px] font-bold text-blue-300 font-mono">
            Page {String(grounding.page)}
          </span>
        )}
        <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-mono ${confidenceColor}`}>
          Confidence: {confidence}%
        </span>
      </div>

      {/* Main content card */}
      <div className="glass-panel rounded-2xl p-5 border kyxun-border bg-[var(--kyxun-hover-bg)] space-y-4 w-full">
        <div>
          <h3 className="font-outfit text-base font-black kyxun-text">{title}</h3>
          {body.summary && body.summary !== "N/A" && (
            <p className="text-[11px] kyxun-text-muted font-medium italic mt-1 leading-normal">{String(body.summary)}</p>
          )}
        </div>

        {body.details && (
          <p className="text-xs kyxun-text-muted leading-relaxed font-sans font-medium whitespace-pre-wrap break-words">
            {String(body.details)}
          </p>
        )}

        {Array.isArray(body.items) && body.items.length > 0 && (
          <ul className="space-y-2 pl-1">
            {body.items.map((item: unknown, idx: number) => (
              <li key={idx} className="text-xs kyxun-text-muted leading-relaxed flex gap-2 font-medium">
                <span className="  select-none font-bold">•</span>
                <span>{String(item)}</span>
              </li>
            ))}
          </ul>
        )}

        {Array.isArray(body.tables) && body.tables.length > 0 && (
          <div className="space-y-3 pt-2">
            {body.tables.map((table: unknown, idx: number) => (
              <pre key={idx} className="p-3 bg-[var(--kyxun-hover-bg)] border kyxun-border rounded-xl font-mono text-[9px] kyxun-text-muted overflow-x-auto whitespace-pre leading-normal">
                {String(table)}
              </pre>
            ))}
          </div>
        )}

        {Array.isArray(body.diagrams) && body.diagrams.length > 0 && (
          <div className="space-y-3 pt-2">
            {body.diagrams.map((diag: unknown, idx: number) => (
              <pre key={idx} className="p-3 bg-[var(--kyxun-hover-bg)] border kyxun-border rounded-xl font-mono text-[9px] kyxun-text-muted overflow-x-auto whitespace-pre leading-normal">
                {String(diag)}
              </pre>
            ))}
          </div>
        )}

        {Array.isArray(body.common_traps) && body.common_traps.length > 0 && (
          <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl space-y-2 mt-2">
            <span className="text-[9px] font-bold uppercase tracking-wider text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
              Exam Trap Alert
            </span>
            <ul className="space-y-1.5 pl-1">
              {body.common_traps.map((trap: unknown, idx: number) => (
                <li key={idx} className="text-xs text-red-300 leading-normal flex gap-2 font-medium">
                  <span className="select-none font-bold">!</span>
                  <span>{String(trap)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Flashcard slider */}
      {flashcards.length > 0 && activeCard && (
        <div className="p-5 glass-panel rounded-2xl border kyxun-border bg-[var(--kyxun-hover-bg)] space-y-4 w-full">
          <span className="text-[9px] font-bold uppercase tracking-wider   kyxun-badge-indigo px-2 py-0.5 rounded-full">
            Active Recall Deck
          </span>

          <div className="space-y-4">
            <div
              onClick={() => flipCard(cardKey, isFlipped)}
              className="h-28 rounded-xl border kyxun-border bg-[var(--kyxun-hover-bg)] hover:bg-[var(--kyxun-hover-bg)] transition-colors p-4 flex flex-col justify-center items-center text-center cursor-pointer relative overflow-hidden select-none"
            >
              <span className="absolute top-2 right-2 text-[8px] uppercase tracking-wide kyxun-text-muted font-bold">
                Click to flip
              </span>
              {isFlipped ? (
                <p className="text-xs   font-bold leading-normal px-2">{activeCard.back}</p>
              ) : (
                <p className="text-xs kyxun-text font-bold leading-normal px-2">{activeCard.front}</p>
              )}
            </div>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                disabled={activeCardIdx === 0}
                onClick={() => prevCard()}
                className="px-3 py-1.5 rounded-lg border kyxun-border bg-[var(--kyxun-hover-bg)] hover:bg-[var(--kyxun-hover-bg)] disabled:opacity-30 kyxun-text font-bold cursor-pointer transition-colors"
              >
                Prev
              </button>
              <span className="text-[10px] kyxun-text-muted font-bold">
                {activeCardIdx + 1} of {flashcards.length}
              </span>
              <button
                type="button"
                disabled={activeCardIdx === flashcards.length - 1}
                onClick={() => nextCard(flashcards)}
                className="px-3 py-1.5 rounded-lg border kyxun-border bg-[var(--kyxun-hover-bg)] hover:bg-[var(--kyxun-hover-bg)] disabled:opacity-30 kyxun-text font-bold cursor-pointer transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz panel */}
      {quiz.length > 0 && (
        <div className="p-5 glass-panel rounded-2xl border kyxun-border bg-[var(--kyxun-hover-bg)] space-y-4 w-full">
          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            Practice Quiz Sheets
          </span>

          <div className="space-y-4">
            {quiz.map((q, quizIdx: number) => {
              const qKey = `q_${quizIdx}`;
              const selectedOpt = quizAnswers[qKey];
              const hasAnswered = !!selectedOpt;

              return (
                <div key={quizIdx} className="space-y-2 p-3 bg-[var(--kyxun-hover-bg)] border kyxun-border rounded-xl text-left">
                  <p className="text-xs font-bold kyxun-text leading-normal">
                    Q{quizIdx + 1}: {q.question}
                  </p>

                  {q.options && q.options.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      {q.options.map((opt: string, optIdx: number) => {
                        const letter = String.fromCharCode(65 + optIdx);
                        const isSelected = selectedOpt === letter;
                        const isCorrect = q.answer === letter;

                        let optStyle = "kyxun-border bg-[var(--kyxun-hover-bg)] hover:bg-[var(--kyxun-hover-bg)] kyxun-text-muted";
                        if (hasAnswered) {
                          if (isCorrect) optStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold";
                          else if (isSelected) optStyle = "border-red-500 bg-red-500/10 text-red-400 font-bold";
                          else optStyle = "kyxun-border bg-[var(--kyxun-hover-bg)] kyxun-text-muted cursor-not-allowed";
                        }

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            disabled={hasAnswered}
                            onClick={() => answerQuiz(qKey, letter)}
                            className={`w-full p-2.5 rounded-xl border text-left text-xs transition-colors flex items-center gap-3 cursor-pointer ${optStyle}`}
                          >
                            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center shrink-0 text-[10px] font-bold">
                              {letter}
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex gap-3 mt-2">
                      {["True", "False"].map((opt) => {
                        const isSelected = selectedOpt === opt;
                        const isCorrect = q.answer === opt;

                        let optStyle = "kyxun-border bg-[var(--kyxun-hover-bg)] hover:bg-[var(--kyxun-hover-bg)] kyxun-text-muted";
                        if (hasAnswered) {
                          if (isCorrect) optStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold";
                          else if (isSelected) optStyle = "border-red-500 bg-red-500/10 text-red-400 font-bold";
                          else optStyle = "kyxun-border bg-[var(--kyxun-hover-bg)] kyxun-text-muted cursor-not-allowed";
                        }

                        return (
                          <button
                            key={opt}
                            type="button"
                            disabled={hasAnswered}
                            onClick={() => answerQuiz(qKey, opt)}
                            className={`flex-1 p-2.5 rounded-xl border text-center text-xs transition-colors cursor-pointer ${optStyle}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {hasAnswered && (
                    <div className="text-[10px] kyxun-text-muted leading-relaxed mt-2 pt-2 border-t kyxun-border">
                      <span className="font-bold kyxun-text-muted">Explanation: </span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Follow-up suggestions */}
      {followUps.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {followUps.map((action: string, idx: number) => (
            <button
              key={idx}
              type="button"
              onClick={() => onFollowUp(action)}
              className="px-3 py-1.5 rounded-full border kyxun-border bg-[var(--kyxun-hover-bg)] hover:bg-[var(--kyxun-hover-bg)] hover:border-indigo-500/30 text-[10px] font-bold   tracking-wide transition-colors cursor-pointer"
            >
              {action}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// MessageList — memoized to avoid re-renders while typing
// ─────────────────────────────────────────────────────────────────────────────
const MessageList = memo(function MessageList({
  messages,
  isLoading,
  onFollowUp,
  onSuggestedPrompt,
  endRef,
}: {
  messages: Message[];
  isLoading: boolean;
  onFollowUp: (text: string) => void;
  onSuggestedPrompt: (text: string) => void;
  endRef: React.RefObject<HTMLDivElement | null>;
}) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-6 max-w-md mx-auto my-auto py-12">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl overflow-hidden">
          <img src="/logo_white_icon.png" alt="Kyxun Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="font-outfit text-3xl font-black kyxun-text tracking-tight">Ask Kyxun AI</h1>
          <p className="kyxun-text-muted text-xs font-normal mt-2 leading-relaxed">
            Query your exam strategy plan, draft high-speed explanations, or request practice testing questions on specific units.
          </p>
        </div>

        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 text-left">
          {SUGGESTED_PROMPTS.map(p => (
            <button
              key={p.label}
              type="button"
              onClick={() => onSuggestedPrompt(p.text)}
              className="p-3.5 rounded-2xl border kyxun-border bg-[var(--kyxun-hover-bg)] hover:kyxun-border hover:bg-[var(--kyxun-hover-bg)] hover:scale-[1.01] transition-all cursor-pointer flex flex-col items-start gap-1"
            >
              <span className="text-[10px] font-bold   uppercase tracking-wider">{p.label}</span>
              <span className="text-xs kyxun-text-muted leading-normal truncate w-full">{p.text}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {messages.map((msg, index) => {
        const isAssistant = msg.role === "assistant";
        return (
          // NOTE: no framer-motion on existing messages — only on NEW ones
          // We use a simple div to avoid re-animating ALL messages on every state change
          <div
            key={`${msg.role}-${index}`}
            className={`flex gap-4 ${!isAssistant ? "justify-end" : "justify-start"}`}
          >
            {isAssistant && (
              <div className="w-8 h-8 rounded-xl border kyxun-border flex items-center justify-center shrink-0 bg-[var(--kyxun-hover-bg)] shadow-md mt-1">
                <BrainCircuit className="w-4 h-4  " />
              </div>
            )}

            <div className="max-w-[85%] flex flex-col gap-2">
              {/* Citation strip */}
              {isAssistant && (
                <div className="flex flex-wrap gap-2 mb-1">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded kyxun-badge-indigo text-[9px] font-bold   font-mono">
                    [1] Study Plan Index
                  </div>
                  {msg.attachments?.map((att, attIdx) => (
                    <div key={attIdx} className="flex items-center gap-1.5 px-2 py-1 rounded kyxun-badge-indigo text-[9px] font-bold   font-mono">
                      [{attIdx + 2}] {att.name.slice(0, 16)}
                    </div>
                  ))}
                </div>
              )}

              <div className={`rounded-2xl p-4 border ${
                !isAssistant
                  ? "bg-indigo-600/90 border-indigo-500 text-white rounded-tr-sm"
                  : "glass-panel rounded-tl-sm kyxun-border kyxun-text-muted"
              }`}>
                {isAssistant ? (
                  <AssistantMessage
                    content={msg.content}
                    isLast={index === messages.length - 1}
                    isLoading={isLoading}
                    onFollowUp={onFollowUp}
                  />
                ) : (
                  <p className="text-xs leading-relaxed whitespace-pre-wrap font-medium break-words font-sans">
                    {msg.content}
                  </p>
                )}

                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {msg.attachments.map((att, i) => (
                      <div key={i} className={`flex items-center gap-2 p-1.5 pr-3 rounded-lg text-[10px] font-bold ${!isAssistant ? "bg-[var(--kyxun-hover-bg)] kyxun-text" : "bg-[var(--kyxun-hover-bg)] border kyxun-border kyxun-text-muted"}`}>
                        {att.url ? (
                          <img src={att.url} alt="attachment" className="w-7 h-7 object-cover rounded" />
                        ) : (
                          <FileText className="w-3.5 h-3.5   ml-1" />
                        )}
                        <span className="truncate max-w-[120px] font-mono">{att.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {!isAssistant && (
              <div className="w-8 h-8 rounded-xl border kyxun-border flex items-center justify-center shrink-0 bg-[var(--kyxun-hover-bg)] shadow-sm mt-1">
                <User className="w-4 h-4 kyxun-text-muted" />
              </div>
            )}
          </div>
        );
      })}

      {/* Typing indicator */}
      {isLoading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
        <div className="flex gap-4 justify-start">
          <div className="w-8 h-8 rounded-xl border kyxun-border flex items-center justify-center shrink-0 bg-[var(--kyxun-hover-bg)] shadow-md mt-1 animate-pulse">
            <BrainCircuit className="w-4 h-4  " />
          </div>
          <div className="glass-panel kyxun-border rounded-2xl p-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0s" }} />
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0.2s" }} />
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0.4s" }} />
          </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// ChatInput — fully isolated, input state never reaches root
// ─────────────────────────────────────────────────────────────────────────────
const ChatInput = memo(function ChatInput({
  files,
  isLoading,
  hasMessages,
  onSubmit,
  onFileSelect,
  onRemoveFile,
}: {
  files: File[];
  isLoading: boolean;
  hasMessages: boolean;
  onSubmit: (text: string, files: File[]) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
}) {
  // Input lives ONLY here — keystrokes NEVER escape this component
  const [input, setInput] = useState("");

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || (!input.trim() && files.length === 0)) return;
    onSubmit(input, files);
    setInput("");
  }, [input, files, isLoading, onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isLoading || (!input.trim() && files.length === 0)) return;
      onSubmit(input, files);
      setInput("");
    }
  }, [input, files, isLoading, onSubmit]);

  const canSend = (input.trim().length > 0 || files.length > 0) && !isLoading;

  return (
    <div className="pt-4 border-t kyxun-border relative z-10" style={{ background: "var(--kyxun-bg)" }}>
      <div className="max-w-3xl mx-auto">
        {/* Chip row — only shown when there are messages */}
        {hasMessages && (
          <div className="flex gap-2 overflow-x-auto pb-3 pt-1">
            {SUGGESTED_PROMPTS.slice(0, 3).map(p => (
              <button
                key={p.label}
                type="button"
                onClick={() => { onSubmit(p.text, []); }}
                className="px-3 py-1.5 rounded-full border kyxun-border bg-[var(--kyxun-hover-bg)] hover:bg-[var(--kyxun-hover-bg)] text-[10px] kyxun-text-muted hover:kyxun-text transition-colors shrink-0 cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="relative flex flex-col gap-2 rounded-2xl p-2 transition-colors border kyxun-border bg-[var(--kyxun-hover-bg)] focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/20"
        >
          {/* Attached file chips */}
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 px-2 pt-2">
              {files.map((file, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold kyxun-badge-indigo ">
                  {file.type.startsWith("image/") ? (
                    <ImageIcon className="w-3 h-3" />
                  ) : (
                    <FileText className="w-3 h-3" />
                  )}
                  <span className="max-w-[120px] truncate">{file.name}</span>
                  <button type="button" onClick={() => onRemoveFile(i)} className="hover:text-red-500 cursor-pointer ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Kyxun AI... (try: 'summarize focus areas')"
            className="w-full max-h-48 resize-none py-3 px-3 rounded-xl text-xs bg-transparent focus:outline-none"
            style={{ color: "var(--kyxun-text)", minHeight: "52px" }}
            rows={1}
          />

          <div className="flex items-center justify-between px-2 pb-1">
            <div className="flex gap-1.5">
              <input type="file" id="doc-upload" className="hidden" onChange={onFileSelect} accept=".pdf,.doc,.docx,.txt,.csv" />
              <label htmlFor="doc-upload" className="w-9 h-9 flex items-center justify-center rounded-xl border border-transparent hover:kyxun-border hover:bg-[var(--kyxun-hover-bg)] kyxun-text-muted hover:kyxun-text transition-colors cursor-pointer" title="Attach Document">
                <Paperclip className="w-4 h-4 cursor-pointer" />
              </label>

              <input type="file" id="img-upload" className="hidden" onChange={onFileSelect} accept="image/*" />
              <label htmlFor="img-upload" className="w-9 h-9 flex items-center justify-center rounded-xl border border-transparent hover:kyxun-border hover:bg-[var(--kyxun-hover-bg)] kyxun-text-muted hover:kyxun-text transition-colors cursor-pointer" title="Attach Image">
                <ImageIcon className="w-4 h-4 cursor-pointer" />
              </label>
            </div>

            <button
              type="submit"
              disabled={!canSend}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors disabled:opacity-30 cursor-pointer"
              style={{
                background: canSend ? "var(--kyxun-accent)" : "rgba(255,255,255,0.05)",
                color: "#fff",
              }}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 kyxun-border border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4 ml-0.5 cursor-pointer" />
              )}
            </button>
          </div>
        </form>

        <div className="text-center mt-2 pb-2">
          <p className="text-[10px] kyxun-text-muted font-medium">
            Kyxun AI parses query datasets in real-time. Verify critical exam thresholds.
          </p>
        </div>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Root page — manages ONLY session, messages, files, loading state
// ─────────────────────────────────────────────────────────────────────────────
import GlobalHeader from "@/components/GlobalHeader";

export default function ChatPage(props: any) {
  const isInline = props.isInline === true;
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [session, setSession] = useState<Session | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Derived — memoized so it never causes extra renders
  const isDark = useMemo(() => theme === "dark", [theme]);
  const hasMessages = useMemo(() => messages.length > 0, [messages.length]);

  // Smooth scroll on new message — but only when messages length changes
  const prevMsgCount = useRef(0);
  useEffect(() => {
    if (messages.length !== prevMsgCount.current) {
      prevMsgCount.current = messages.length;
      // Use requestAnimationFrame to avoid blocking the paint
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, [messages.length]);

  // Auth init
  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | null = null;

    const initAuth = async () => {
      const { supabase } = await import("@/lib/supabase");
      const { saveSession } = await import("@/lib/auth");

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const s = {
          email: user.email!,
          fullName: user.user_metadata?.full_name || user.user_metadata?.name || user.email || "",
          photo: typeof user.user_metadata?.avatar_url === "string" && user.user_metadata.avatar_url.trim()
            ? user.user_metadata.avatar_url.trim()
            : typeof user.user_metadata?.picture === "string" && user.user_metadata.picture.trim()
              ? user.user_metadata.picture.trim()
              : "",
          id: user.id,
        };
        saveSession(s);
        if (active) setSession(s);
      }

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
            id: u.id,
          };
          saveSession(syncedSession);
          setSession(syncedSession);
        } else if (event === "SIGNED_OUT") {
          localStorage.removeItem("kyxun_session");
          router.replace("/login");
        }
      });

      unsubscribe = authListener.subscription.unsubscribe;

      setTimeout(async () => {
        if (!active) return;
        const currentSession = getSession();
        if (!currentSession) router.replace("/login");
      }, 800);
    };

    initAuth();
    return () => { active = false; if (unsubscribe) unsubscribe(); };
  }, [router]);

  // Load chat history
  useEffect(() => {
    if (!session?.id) return;
    const userId = session.id;

    const loadHistory = async () => {
      try {
        const sessions = await chatService.getChatSessions(userId);
        if (sessions.length > 0) {
          const latest = sessions[0];
          setActiveSessionId(latest.id!);
          const msgs = await chatService.getChatMessages(latest.id!);
          setMessages(msgs.map(m => ({
            role: m.role as "user" | "assistant",
            content: m.content,
            attachments: (m.attachments as any) || undefined,
          })));
        }
      } catch (err) {
        console.warn("Failed to load chat history:", err);
      }
    };

    loadHistory();
  }, [session]);

  // One-time pending form handoff from /plan
  useEffect(() => {
    if (sharedData.pendingChatForm) {
      const fd = sharedData.pendingChatForm;
      sharedData.pendingChatForm = null;
      const days = fd.get("days") as string;
      const hours = fd.get("hours") as string;
      const subject = fd.get("subject") as string;
      const total = fd.get("totalChapters") as string;
      const done = fd.get("completedChapters") as string;
      const goal = fd.get("goal") as string;
      const initialPrompt = `I need a study plan for ${subject}. I have ${days} days until the exam and can study ${hours} hours/day. I've completed ${done} out of ${total} chapters. My goal is: ${goal}. Please analyze my situation and any attached syllabus/notes to give me a detailed strategy.`;
      const attachedFiles = fd.getAll("files") as File[];
      submitMessage(initialPrompt, attachedFiles);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Stable callbacks ────────────────────────────────────────────────────────

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const submitMessage = useCallback(async (userMsg: string, attachedFiles: File[] = []) => {
    if (!userMsg.trim() && attachedFiles.length === 0) return;
    const activeUser = session || getSession();
    if (!activeUser?.id) return;
    const userId = activeUser.id;

    const attachmentRecords = attachedFiles.map(f => ({
      name: f.name,
      type: f.type,
      url: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
    }));

    // Append user message immediately
    setMessages(prev => [...prev, { role: "user", content: userMsg, attachments: attachmentRecords }]);
    setIsLoading(true);
    setFiles([]);

    let currentSessionId = activeSessionId;
    try {
      if (!currentSessionId) {
        const title = userMsg.slice(0, 30) || "New Chat";
        const { analysisService } = await import("@/lib/services/analysisService");
        const latestPlan = await analysisService.getLatestStudyPlan(userId);
        const planId = latestPlan ? latestPlan.id : null;
        const newSession = await chatService.createChatSession(userId, planId, title);
        currentSessionId = newSession.id!;
        setActiveSessionId(currentSessionId);
      }
      await chatService.saveChatMessage(currentSessionId, userId, "user", userMsg, attachmentRecords);
    } catch (dbErr) {
      console.error("Failed to initialize session or save user message:", dbErr);
    }

    try {
      const fd = new FormData();
      // snapshot current messages for API (before state update)
      const apiMessages = [
        ...messages,
        { role: "user" as const, content: userMsg },
      ];
      fd.append("messages", JSON.stringify(apiMessages));
      attachedFiles.forEach(f => fd.append("files", f));

      const response = await fetch("/api/chat", {
        method: "POST",
        body: fd,
        headers: { "x-user-id": userId },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errStr = errorData.details || errorData.error || "Failed to fetch response from AI";
        if (typeof errStr === "object") errStr = JSON.stringify(errStr);
        throw new Error(errStr);
      }
      if (!response.body) throw new Error("No body returned from server.");

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let fullAssistantContent = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          fullAssistantContent += chunk;
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
            }
            return prev;
          });
        }
      }

      if (currentSessionId) {
        try {
          await chatService.saveChatMessage(currentSessionId, userId, "assistant", fullAssistantContent);
        } catch (dbErr) {
          console.error("Failed to save assistant message:", dbErr);
        }
      }
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : String(error);
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${message}` }]);
    } finally {
      setIsLoading(false);
    }
  }, [session, activeSessionId, messages]);

  const clearChat = useCallback(async () => {
    if (activeSessionId) {
      try { await chatService.deleteChatSession(activeSessionId); } catch { /* ignore */ }
    }
    setActiveSessionId(null);
    setMessages([]);
    setFiles([]);
    sharedData.pendingChatForm = null;
  }, [activeSessionId]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    e.target.value = "";
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  if (!session) return null;

  return (
    <div className="flex min-h-screen kyxun-page">
      <Sidebar />
      <main
        id="main-content"
        className="kyxun-page min-h-screen flex flex-col relative overflow-hidden flex-1 min-w-0 transition-all duration-300"
        style={{ marginLeft: "var(--sidebar-w, 260px)" }}
      >
        {/* Header */}
        <header className="kyxun-header sticky top-0 z-50 w-full border-b border-[var(--kyxun-border)]">
          <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              {!isInline && (
                <Link
                  href="/chats"
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] transition-all"
                >
                  <ArrowLeft className="w-4 h-4 kyxun-text" />
                </Link>
              )}
            </div>

            <div className="flex items-center gap-3">
              {hasMessages && (
                <button
                  onClick={clearChat}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-red-500/20 text-red-500 hover:bg-red-500/10 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear Chat
                </button>
              )}
              <GlobalHeader />
            </div>
          </div>
        </header>

        {/* Workspace */}
        <div
          className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 overflow-y-auto flex flex-col justify-between"
          style={{ height: "calc(100vh - 145px)" }}
        >
          <div className="flex-1 overflow-y-auto pr-1">
            <MessageList
              messages={messages}
              isLoading={isLoading}
              onFollowUp={submitMessage}
              onSuggestedPrompt={submitMessage}
              endRef={messagesEndRef}
            />
          </div>

          <ChatInput
            files={files}
            isLoading={isLoading}
            hasMessages={hasMessages}
            onSubmit={submitMessage}
            onFileSelect={handleFileSelect}
            onRemoveFile={handleRemoveFile}
          />
        </div>
      </main>
    </div>
  );
}
