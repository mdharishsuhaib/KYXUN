import { supabase } from "../supabase";

export interface ChatSession {
  id?: string;
  user_id: string;
  plan_id: string | null;
  title: string;
  created_at?: string;
}

export interface ChatMessage {
  id?: string;
  session_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: Record<string, unknown>[];
  created_at?: string;
}

export const chatService = {
  async createChatSession(
    userId: string,
    planId: string | null,
    title: string
  ): Promise<ChatSession> {
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({
        user_id: userId,
        plan_id: planId,
        title
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getChatSessions(userId: string, planId?: string): Promise<ChatSession[]> {
    let query = supabase
      .from("chat_sessions")
      .select("*")
      .eq("user_id", userId);

    if (planId) {
      query = query.eq("plan_id", planId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async saveChatMessage(
    sessionId: string,
    userId: string,
    role: "user" | "assistant",
    content: string,
    attachments?: Record<string, unknown>[]
  ): Promise<ChatMessage> {
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        session_id: sessionId,
        user_id: userId,
        role,
        content,
        attachments
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteChatSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from("chat_sessions")
      .delete()
      .eq("id", sessionId);

    if (error) throw error;
  }
};
