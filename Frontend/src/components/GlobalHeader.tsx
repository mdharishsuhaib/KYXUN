"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sun, Moon } from "lucide-react";
import ProfileDropdown from "@/components/ProfileDropdown";
import ProfileModal from "@/components/ProfileModal";
import SettingsModal from "@/components/SettingsModal";
import HelpModal from "@/components/HelpModal";
import LogoutModal from "@/components/LogoutModal";
import { getSession, clearSession, type Session as LocalSession } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

type ModalType = "profile" | "settings" | "help" | "logout" | null;

export default function GlobalHeader() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const [session, setSession] = useState<LocalSession | null>(null);
  const [modal, setModal] = useState<ModalType>(null);

  useEffect(() => {
    setSession(getSession());
  }, []);

  const handleLogout = async () => {
    clearSession();
    router.push("/");
  };

  if (!session) return null;

  return (
    <>
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleTheme} 
          className="w-9 h-9 flex items-center justify-center rounded-xl kyxun-hover kyxun-text-muted transition-all cursor-pointer border border-[var(--kyxun-border-soft)]" 
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-4 h-4  "/> : <Moon className="w-4 h-4  "/>}
        </button>
        <ProfileDropdown
          email={session.email} 
          fullName={session.fullName} 
          photo={session.photo}
          onProfile={() => setModal("profile")}
          onSettings={() => setModal("settings")}
          onHelp={() => setModal("help")}
          onLogout={() => setModal("logout")}
        />
      </div>

      <ProfileModal open={modal === "profile"} email={session.email} fullName={session.fullName} onClose={() => setModal(null)} onSaved={() => { setSession(getSession()); setModal(null); }} />
      <SettingsModal open={modal === "settings"} email={session.email} onClose={() => setModal(null)} />
      <HelpModal open={modal === "help"} onClose={() => setModal(null)} />
      <LogoutModal open={modal === "logout"} onCancel={() => setModal(null)} onConfirm={handleLogout} />
    </>
  );
}
