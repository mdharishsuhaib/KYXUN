import { supabase } from "../supabase";
import type { ReadinessOutputs } from "../readiness";

export const readinessService = {
  async saveReadinessScore(
    userId: string,
    planId: string,
    stats: ReadinessOutputs
  ) {
    const { data, error } = await supabase
      .from("readiness_scores")
      .insert({
        user_id: userId,
        plan_id: planId,
        readiness_score: stats.readinessScore,
        knowledge_coverage: stats.knowledgeCoverage,
        revision_readiness: stats.revisionReadiness,
        predicted_marks: stats.predictedMarksRange,
        strong_topics: stats.strongTopics,
        weak_topics: stats.weakTopics,
        exam_risk_level: stats.riskLevel,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getReadinessHistory(userId: string, planId: string) {
    const { data, error } = await supabase
      .from("readiness_scores")
      .select("*")
      .eq("user_id", userId)
      .eq("plan_id", planId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  }
};
