"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Settings, HelpCircle, LogOut, ChevronDown, BrainCircuit } from "lucide-react";
import AvatarImage from "@/components/AvatarImage";

interface Props {
  email: string;
  fullName: string;
  photo?: string;
  onProfile: () => void;
  onSettings: () => void;
  onHelp: () => void;
  onLogout: () => void;
}

export default function ProfileDropdown({ email, fullName, photo, onProfile, onSettings, onHelp, onLogout }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const items = [
    { icon: User,     label: "Profile",  action: onProfile },
    { icon: Settings, label: "Settings", action: onSettings },
    { icon: HelpCircle, label: "Help",   action: onHelp },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        id="profile-dropdown-btn"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 p-1 pr-3 rounded-full transition-all cursor-pointer"
        style={{ border: "1px solid var(--kyxun-border)", background: "var(--kyxun-input-bg)" }}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden kyxun-text shrink-0 shadow-sm"
          style={{ background: photo ? "transparent" : "linear-gradient(135deg, #a855f7, #6366f1)" }}
        >
          {photo ? (
            <AvatarImage
              src={photo}
              alt={fullName}
              className="w-full h-full object-cover"
              fallback={<BrainCircuit className="w-4 h-4 kyxun-text" />}
              fallbackClassName="w-full h-full flex items-center justify-center"
            />
          ) : (
            <BrainCircuit className="w-4 h-4 kyxun-text" />
          )}
        </div>
        <span className="hidden sm:inline text-xs font-semibold kyxun-text truncate max-w-[120px] ml-0.5">
          {fullName}
        </span>
        <ChevronDown
          className="w-3.5 h-3.5 kyxun-text-muted transition-transform shrink-0"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden z-50 shadow-2xl"
            style={{ background: "var(--kyxun-surface)", border: "1px solid var(--kyxun-border)" }}
          >
            {/* User info */}
            <div className="p-4 border-b" style={{ borderColor: "var(--kyxun-border-soft)" }}>
              <p className="text-sm font-semibold kyxun-text truncate">{fullName}</p>
              <p className="text-xs kyxun-text-subtle truncate">{email}</p>
            </div>

            {/* Menu items */}
            <div className="p-2">
              {items.map(({ icon: Icon, label, action }) => (
                <button
                  key={label}
                  onClick={() => { action(); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm kyxun-text transition-all cursor-pointer text-left"
                  style={{ background: "transparent" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--kyxun-hover-bg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <Icon className="w-4 h-4 kyxun-text-muted" />
                  {label}
                </button>
              ))}
            </div>

            <div className="p-2 pt-0">
              <div className="h-px mb-2" style={{ background: "var(--kyxun-border-soft)" }} />
              <button
                onClick={() => { onLogout(); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all cursor-pointer text-left text-red-400"
                style={{ background: "transparent" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
