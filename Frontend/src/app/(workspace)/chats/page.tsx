"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MessageSquare, Search, Trash2, Plus, Clock, ArrowRight
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { chatService, type ChatSession } from "@/lib/services/chatService";
import { subjectService, type Subject } from "@/lib/services/subjectService";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 2) return "Just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d === 1) return "Yesterday";
  return `${d} days ago`;
}

export default function ChatsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [groupingTime, setGroupingTime] = useState(0);

  useEffect(() => {
    let alive = true;
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      if (!alive) return;

      const [sessRes, subRes] = await Promise.allSettled([
        chatService.getChatSessions(user.id),
        subjectService.getSubjects(user.id),
      ]);

      if (!alive) return;
      if (sessRes.status === "fulfilled") setSessions(sessRes.value);
      if (subRes.status === "fulfilled") setSubjects(subRes.value);
      setGroupingTime(Date.now());
      setLoading(false);
    };
    init();
    return () => { alive = false; };
  }, [router]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this chat session?")) return;
    try {
      await chatService.deleteChatSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch (e) { console.error(e); }
  };

  const filtered = sessions.filter(s =>
    (s.title || "").toLowerCase().includes(search.toLowerCase())
  );

  // Group by date label
  const groups: { label: string; items: ChatSession[] }[] = [];
  const today: ChatSession[] = [];
  const yesterday: ChatSession[] = [];
  const older: ChatSession[] = [];

  filtered.forEach(s => {
    const d = Math.floor((groupingTime - new Date(s.created_at!).getTime()) / 86400000);
    if (d === 0) today.push(s);
    else if (d === 1) yesterday.push(s);
    else older.push(s);
  });

  if (today.length) groups.push({ label: "Today", items: today });
  if (yesterday.length) groups.push({ label: "Yesterday", items: yesterday });
  if (older.length) groups.push({ label: "Earlier", items: older });

  if (loading) return (
    <div className="min-h-screen kyxun-page flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen kyxun-page">
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="w-4 h-4 text-[#3730a3]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#3730a3]">AI Chats</span>
            </div>
            <h1 className="font-outfit text-2xl font-black kyxun-text">
              {sessions.length} Conversation{sessions.length !== 1 ? "s" : ""}
            </h1>
          </div>
          <Link
            href="/chat"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl kyxun-badge-indigo border-purple-500/25   text-xs font-bold hover:kyxun-badge-indigo transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> New Chat
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 kyxun-text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] kyxun-text text-sm placeholder:kyxun-text-muted focus:outline-none focus:border-purple-500/40 transition-all"
          />
        </div>

        {/* Chat list */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-white/[0.08] rounded-2xl">
            <MessageSquare className="w-10 h-10 kyxun-text-muted mx-auto mb-4" />
            <p className="kyxun-text-muted font-bold">
              {search ? "No chats match your search." : "No conversations yet."}
            </p>
            <p className="kyxun-text-muted text-sm mt-1 mb-5">
              Start a chat from any study plan or subject workspace.
            </p>
            {!search && (
              <Link href="/chat"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl kyxun-badge-indigo text-sm font-bold hover:kyxun-badge-indigo transition-all">
                <MessageSquare className="w-3.5 h-3.5" /> Start First Chat
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map(group => (
              <div key={group.label}>
                <p className="text-[10px] font-black uppercase tracking-widest kyxun-text-muted mb-2">
                  {group.label}
                </p>
                <div className="space-y-2">
                  {group.items.map((s, i) => {
                    const subj = subjects.find(sub => sub.id === (s as any).subject_id);
                    return (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="group flex items-center gap-3 p-4 border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] rounded-xl transition-all"
                      >
                        <div className="w-9 h-9 rounded-xl kyxun-badge-indigo flex items-center justify-center shrink-0">
                          <MessageSquare className="w-4 h-4  " />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold kyxun-text group-hover:  transition-colors truncate">
                            {s.title || "Untitled Chat"}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Clock className="w-2.5 h-2.5 kyxun-text-muted" />
                            <span className="text-[9px] kyxun-text-muted">{timeAgo(s.created_at!)}</span>
                            {subj && (
                              <>
                                <span className="kyxun-text-muted">•</span>
                                <span className="text-[9px] font-bold" style={{ color: subj.color }}>
                                  {subj.icon} {subj.name}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href="/chat"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg kyxun-badge-indigo text-[10px] font-bold hover:kyxun-badge-indigo transition-all">
                            Open <ArrowRight className="w-2.5 h-2.5" />
                          </Link>
                          <button onClick={() => handleDelete(s.id!)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
