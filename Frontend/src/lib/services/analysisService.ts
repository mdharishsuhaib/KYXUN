import { supabase } from "../supabase";
import type { StudyPlan, PYQAnalysisData } from "../academic";

export const analysisService = {
  async saveStudyPlan(
    userId: string,
    subject: string,
    days: number,
    hoursPerDay: number,
    totalChapters: number,
    completedChapters: number,
    goal: string,
    planData: StudyPlan
  ) {
    const { data, error } = await supabase
      .from("study_plans")
      .insert({
        user_id: userId,
        subject,
        days,
        hours_per_day: hoursPerDay,
        total_chapters: totalChapters,
        completed_chapters: completedChapters,
        goal,
        plan_data: planData,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getLatestStudyPlan(userId: string) {
    const { data, error } = await supabase
      .from("study_plans")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  },

  async savePYQPaper(userId: string, subject: string, paperText: string) {
    const { data, error } = await supabase
      .from("pyq_papers")
      .insert({
        user_id: userId,
        subject,
        paper_text: paperText
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async savePYQAnalysis(userId: string, paperId: string | null, subject: string, analysisData: PYQAnalysisData) {
    const { data, error } = await supabase
      .from("pyq_analyses")
      .insert({
        user_id: userId,
        paper_id: paperId,
        subject,
        analysis_data: analysisData
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getLatestPYQAnalysis(userId: string, subject: string) {
    const { data, error } = await supabase
      .from("pyq_analyses")
      .select("*")
      .eq("user_id", userId)
      .eq("subject", subject)
      .order("created_at", { ascending: false })
      .limit(1);
    
    if (error) throw error;
    return data && data.length > 0 ? data[0].analysis_data as PYQAnalysisData : null;
  }
};
