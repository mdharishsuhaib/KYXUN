import { supabase } from "../supabase";

export interface VivaAttempt {
  id?: string;
  question: string;
  user_answer: string;
  model_answer: string;
  accuracy_score: number;
  confidence_score: number;
  feedback: string;
  confidence_feedback?: string;
}

export const vivaService = {
  async saveVivaAttempt(
    userId: string,
    planId: string,
    attempt: VivaAttempt
  ) {
    const { data, error } = await supabase
      .from("viva_attempts")
      .insert({
        user_id: userId,
        plan_id: planId,
        question: attempt.question,
        user_answer: attempt.user_answer,
        model_answer: attempt.model_answer,
        accuracy_score: attempt.accuracy_score,
        confidence_score: attempt.confidence_score,
        feedback: attempt.feedback,
        confidence_feedback: attempt.confidence_feedback,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getVivaAttempts(userId: string, planId: string) {
    const { data, error } = await supabase
      .from("viva_attempts")
      .select("*")
      .eq("user_id", userId)
      .eq("plan_id", planId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }
};
