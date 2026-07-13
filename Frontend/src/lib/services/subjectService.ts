import { supabase } from "../supabase";

const logSupabaseError = (context: string, payload: unknown, error: unknown) => {
  const err = error as { message?: string; details?: unknown; hint?: string; code?: string } | undefined;
  console.error(`[subjectService] ${context}`, {
    payload,
    error: err ? {
      message: err.message,
      details: err.details,
      hint: err.hint,
      code: err.code,
    } : error,
  });
};

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  semester?: string;
  color: string;
  icon: string;
  progress: number;
  created_at: string;
  last_opened_at: string;
}

export const subjectService = {
  async createSubject(
    userId: string,
    name: string,
    semester?: string,
    color = "#6366f1",
    icon = "📘"
  ): Promise<Subject> {
    const payload = { user_id: userId, name, semester, color, icon, progress: 0 };
    console.info("[subjectService] createSubject payload", payload);

    const { data, error } = await supabase
      .from("subjects")
      .insert(payload)
      .select()
      .single();

    if (error) {
      logSupabaseError("createSubject insert failed", payload, error);
      throw error;
    }

    console.info("[subjectService] createSubject success", data);
    return data as Subject;
  },

  async getSubjects(userId: string): Promise<Subject[]> {
    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .eq("user_id", userId)
      .order("last_opened_at", { ascending: false });

    if (error) throw error;
    
    const subjects = (data || []) as Subject[];
    if (subjects.length === 0) return subjects;

    // Fetch counts in bulk for all subjects
    const [filesRes, plansRes, chatsRes] = await Promise.all([
      supabase.from("documents").select("subject_id").eq("user_id", userId),
      supabase.from("study_plans").select("subject, id").eq("user_id", userId),
      supabase.from("chat_sessions").select("plan_id, id").eq("user_id", userId),
    ]);

    const files = filesRes.data || [];
    const plans = plansRes.data || [];
    const chats = chatsRes.data || [];

    return subjects.map(s => {
      const fileCount = files.filter(f => f.subject_id === s.id).length;
      const subjectPlans = plans.filter(p => p.subject === s.name);
      const planCount = subjectPlans.length;
      const planIds = new Set(subjectPlans.map(p => p.id));
      const chatCount = chats.filter(c => c.plan_id && planIds.has(c.plan_id)).length;
      
      const dynamicProgress = Math.min(100, (fileCount * 10) + (planCount * 20) + (chatCount * 20));
      return { ...s, progress: dynamicProgress || 0 };
    });
  },

  async getSubject(userId: string, subjectId: string): Promise<Subject | null> {
    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .eq("id", subjectId)
      .eq("user_id", userId)
      .single();
    if (error) return null;
    
    const [filesRes, plansRes, chatsRes] = await Promise.all([
      supabase.from("documents").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("subject_id", subjectId),
      supabase.from("study_plans").select("id", { count: "exact" }).eq("user_id", userId).eq("subject", data.name),
      supabase.from("chat_sessions").select("plan_id", { count: "exact" }).eq("user_id", userId),
    ]);

    const fileCount = filesRes.count || 0;
    const planCount = plansRes.count || 0;
    
    // Calculate chat count based on plans
    let chatCount = 0;
    if (plansRes.data && plansRes.data.length > 0 && chatsRes.data) {
       const planIds = new Set(plansRes.data.map(p => p.id));
       chatCount = chatsRes.data.filter(c => c.plan_id && planIds.has(c.plan_id)).length;
    }

    const dynamicProgress = Math.min(100, (fileCount * 10) + (planCount * 20) + (chatCount * 20));

    data.progress = dynamicProgress || 0;
    return data as Subject;
  },

  async updateSubject(subjectId: string, updates: Partial<Omit<Subject, "id" | "user_id" | "created_at">>) {
    const { data, error } = await supabase
      .from("subjects")
      .update(updates)
      .eq("id", subjectId)
      .select()
      .single();
    if (error) throw error;
    return data as Subject;
  },

  async updateLastOpened(subjectId: string) {
    await supabase
      .from("subjects")
      .update({ last_opened_at: new Date().toISOString() })
      .eq("id", subjectId);
  },

  async updateProgress(subjectId: string, progress: number) {
    await supabase
      .from("subjects")
      .update({ progress: Math.min(100, Math.max(0, progress)) })
      .eq("id", subjectId);
  },

  async recalculateProgress(subjectId: string, userId: string) {
    if (!subjectId || !userId) return;
    try {
      const subject = await this.getSubject(userId, subjectId);
      if (!subject) return null;
      // getSubject already recalculates and returns dynamic progress!
      await this.updateProgress(subjectId, subject.progress);
      return subject.progress;
    } catch (e) {
      console.error("Failed to recalculate progress", e);
    }
    return null;
  },

  async deleteSubject(subjectId: string) {
    const { error } = await supabase
      .from("subjects")
      .delete()
      .eq("id", subjectId);
    if (error) throw error;
  },

  async getOrCreateDefault(userId: string): Promise<Subject> {
    const subjects = await this.getSubjects(userId);
    if (subjects.length > 0) return subjects[0];
    return this.createSubject(userId, "General", undefined, "#6366f1", "📚");
  },

  // Get study plans for a subject
  async getStudyPlans(userId: string, subjectId: string) {
    const subject = await this.getSubject(userId, subjectId);
    if (!subject) return [];
    const { data, error } = await supabase
      .from("study_plans")
      .select("id, subject, goal, created_at, plan_data")
      .eq("user_id", userId)
      .eq("subject", subject.name)
      .order("created_at", { ascending: false });
    if (error) {
        console.error("Failed to get study plans", error);
        return [];
    }
    return data || [];
  },

  // Get chat sessions for a subject
  async getChatSessions(userId: string, subjectId: string) {
    const plans = await this.getStudyPlans(userId, subjectId);
    if (plans.length === 0) return [];
    
    const planIds = plans.map(p => p.id);
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("id, title, created_at, plan_id")
      .eq("user_id", userId)
      .in("plan_id", planIds)
      .order("created_at", { ascending: false });
    if (error) {
        console.error("Failed to get chat sessions", error);
        return [];
    }
    return data || [];
  },
};
