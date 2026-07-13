"use client";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut } from "lucide-react";

interface Props {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function LogoutModal({ open, onCancel, onConfirm }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} />
          <motion.div
            className="relative w-full max-w-sm rounded-2xl p-8 text-center z-10"
            style={{ background: "var(--kyxun-surface)", border: "1px solid var(--kyxun-border)" }}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(239,68,68,0.12)" }}
            >
              <LogOut className="w-6 h-6 text-red-400" />
            </div>
            <h2 id="logout-modal-title" className="font-outfit text-xl font-bold kyxun-text mb-2">
              Sign Out?
            </h2>
            <p className="text-sm kyxun-text-muted mb-8">
              You will need to sign in again to access your account.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3 rounded-xl font-semibold text-sm kyxun-text transition-all cursor-pointer"
                style={{ background: "var(--kyxun-input-bg)", border: "1px solid var(--kyxun-border)" }}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer hover:opacity-80"
                style={{ background: "rgba(239,68,68,0.12)", color: "var(--kyxun-danger)" }}
              >
                Sign Out
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
