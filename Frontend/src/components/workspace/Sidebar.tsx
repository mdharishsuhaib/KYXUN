"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BookOpen, FolderOpen, Calendar, MessageSquare,
  BarChart3, Settings, ChevronLeft, ChevronRight,
  Upload, BrainCircuit,
  LogOut, PlusCircle, Menu, X
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────
interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
}

interface RecentSubject {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface RecentChat {
  id: string;
  title: string;
}

interface UserInfo {
  name: string;
  email: string;
  initials: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/subjects",  icon: BookOpen,         label: "Subjects" },
  { href: "/library",   icon: FolderOpen,        label: "Library" },
  { href: "/plan",      icon: Calendar,          label: "Study Plans" },
  { href: "/chats",     icon: MessageSquare,     label: "AI Chats" },
  { href: "/progress",  icon: BarChart3,          label: "Progress" },
  { href: "/settings",  icon: Settings,           label: "Settings" },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("kyxun_sidebar_collapsed") === "true";
    }
    return false;
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [recentSubjects, setRecentSubjects] = useState<RecentSubject[]>([]);
  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);

  // ── Persist collapse state via CSS custom property ─────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem("kyxun_sidebar_collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("kyxun_sidebar_collapsed", String(collapsed));
    document.documentElement.style.setProperty(
      "--sidebar-w",
      collapsed ? "68px" : "260px"
    );
  }, [collapsed]);

  // Close mobile on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // ── Load user + recent data ────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!alive || !u) return;

      const name = u.user_metadata?.full_name || u.user_metadata?.name || u.email || "User";
      setUser({ name, email: u.email || "", initials: getInitials(name) });

      // Recent subjects
      try {
        const { data: subjects } = await supabase
          .from("subjects")
          .select("id, name, icon, color")
          .eq("user_id", u.id)
          .order("last_opened_at", { ascending: false })
          .limit(4);
        if (alive && subjects) setRecentSubjects(subjects as RecentSubject[]);
      } catch { /* table might not exist yet */ }

      // Recent chats
      try {
        const { data: chats } = await supabase
          .from("chat_sessions")
          .select("id, title")
          .eq("user_id", u.id)
          .order("created_at", { ascending: false })
          .limit(5);
        if (alive && chats) setRecentChats(chats as RecentChat[]);
      } catch { /* table might not exist yet */ }
    };
    load();
    return () => { alive = false; };
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("kyxun_session");
    router.replace("/");
  }, [router]);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  // ── Inner sidebar content ──────────────────────────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full py-4 overflow-hidden">
      {/* Logo + collapse button */}
      <div className={`flex px-3 mb-6 ${collapsed ? "flex-col items-center gap-4" : "items-center justify-between"}`}>
        <div className="flex items-center gap-2.5 cursor-default">
          <div className="w-8 h-8 flex items-center justify-center shrink-0 drop-shadow-sm dark:drop-shadow-[0_0_12px_rgba(163,230,53,0.65)]">
            <img 
              src="/logo_white_icon.png" 
              alt="Kyxun Logo" 
              className="w-full h-full object-contain dark:hidden" 
            />
            <img 
              src="/logo_white_icon.png" 
              alt="Kyxun Logo" 
              className="w-full h-full object-contain hidden dark:block" 
            />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <span className="font-outfit font-black text-xl kyxun-text tracking-tight whitespace-nowrap">Kyxun</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={() => setCollapsed(p => !p)}
          className="hidden lg:flex w-8 h-8 items-center justify-center rounded-xl kyxun-text-muted hover:kyxun-text hover:bg-[var(--kyxun-hover-bg)] transition-all cursor-pointer shrink-0"
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Nav */}
      <nav className="flex flex-col gap-0.5 px-2 mb-4">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative ${
                active
                  ? "kyxun-badge-indigo "
                  : "kyxun-text-muted hover:kyxun-text hover:bg-[var(--kyxun-hover-bg)] border border-transparent"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? label : undefined}
            >
              <Icon className={`w-4.5 h-4.5 shrink-0 ${active ? " " : ""}`} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.12 }}
                    className="text-xs font-semibold whitespace-nowrap"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute right-2 w-1.5 h-1.5 rounded-full bg-[var(--kyxun-accent)]"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-3 border-t kyxun-border mb-3" />

      {/* Recent Subjects */}
      {recentSubjects.length > 0 && !collapsed && (
        <div className="px-3 mb-3">
          <p className="text-[9px] font-black uppercase tracking-widest kyxun-text-muted mb-2 px-1">
            Recent Subjects
          </p>
          <div className="flex flex-col gap-0.5">
            {recentSubjects.map(s => (
              <Link
                key={s.id}
                href={`/subjects/${s.id}`}
                className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[var(--kyxun-hover-bg)] transition-all group"
              >
                <span className="text-sm shrink-0">{s.icon}</span>
                <span className="text-[11px] font-medium kyxun-text-muted group-hover:kyxun-text truncate transition-colors">
                  {s.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Chats */}
      {recentChats.length > 0 && !collapsed && (
        <div className="px-3 mb-3">
          <p className="text-[9px] font-black uppercase tracking-widest kyxun-text-muted mb-2 px-1">
            Recent Chats
          </p>
          <div className="flex flex-col gap-0.5">
            {recentChats.slice(0, 4).map(c => (
              <Link
                key={c.id}
                href={`/chat`}
                className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[var(--kyxun-hover-bg)] transition-all group"
              >
                <MessageSquare className="w-3 h-3 kyxun-text-muted shrink-0" />
                <span className="text-[11px] font-medium kyxun-text-muted group-hover:kyxun-text truncate transition-colors">
                  {c.title || "Untitled Chat"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}


      {/* Spacer */}
      <div className="flex-1" />

    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--kyxun-bg-secondary)] border kyxun-border kyxun-text-muted hover:kyxun-text backdrop-blur-xl transition-all cursor-pointer"
        aria-label="Open menu"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-64 z-50 bg-[var(--kyxun-bg-secondary)] border-r kyxun-border overflow-y-auto"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg kyxun-text-muted hover:kyxun-text hover:bg-[var(--kyxun-hover-bg)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar — fixed */}
      <motion.aside
        animate={{ width: collapsed ? 68 : 260 }}
        transition={{ type: "spring", damping: 30, stiffness: 250 }}
        className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-40 kyxun-page border-r border-white/[0.04] backdrop-blur-xl overflow-hidden"
        style={{ boxShadow: "1px 0 20px rgba(0,0,0,0.5)" }}
      >
        <SidebarContent />
      </motion.aside>
    </>
  );
}
