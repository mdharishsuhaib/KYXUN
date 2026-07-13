"use client";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, Upload, BrainCircuit, FileText, Star } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const tips = [
  {
    icon: Upload,
    title: "Upload Your Syllabus",
    desc: "Drag in a PDF, photo of your notes, or Word document. The AI reads every topic and builds your plan around it.",
  },
  {
    icon: BookOpen,
    title: "Fill in Your Situation",
    desc: "Tell us how many days you have, your daily study hours, total chapters, and how many you've completed.",
  },
  {
    icon: BrainCircuit,
    title: "AI Analyses Everything",
    desc: "The AI calculates your pass probability and identifies exactly which chapters are worth your limited time.",
  },
  {
    icon: FileText,
    title: "Get Your Attack Plan",
    desc: "Receive a personalised hourly schedule, must-study topics, topics to skip, and a tactical study tip.",
  },
  {
    icon: Star,
    title: "Export and Execute",
    desc: "Print or save your plan. Stick to it ruthlessly. The AI has already done the hard thinking for you.",
  },
];

export default function HelpModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }} />
          <motion.div
            className="relative w-full max-w-lg rounded-3xl overflow-hidden z-10 max-h-[90vh] overflow-y-auto"
            style={{ background: "var(--kyxun-surface)", border: "1px solid var(--kyxun-border)" }}
            initial={{ scale: 0.92, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 24 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-modal-title"
          >
            {/* Accent bar */}
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, var(--kyxun-accent), var(--kyxun-accent-secondary))" }} />
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 id="help-modal-title" className="font-outfit text-2xl font-bold kyxun-text">
                  Help &amp; Tutorial
                </h2>
                <button
                  onClick={onClose}
                  className="w-9 h-9 flex items-center justify-center rounded-full kyxun-text-muted cursor-pointer transition-all"
                  style={{ border: "1px solid var(--kyxun-border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--kyxun-hover-bg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  aria-label="Close help"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-5">
                {tips.map(({ icon: Icon, title, desc }, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "var(--kyxun-input-bg)", border: "1px solid var(--kyxun-border-soft)" }}
                    >
                      <Icon className="w-5 h-5" style={{ color: "var(--kyxun-accent)" }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold kyxun-text mb-1">{title}</p>
                      <p className="text-sm kyxun-text-muted leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>


            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
