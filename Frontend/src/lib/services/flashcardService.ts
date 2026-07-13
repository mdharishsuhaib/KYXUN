import { supabase } from "../supabase";
import type { Flashcard } from "../academic";

export const flashcardService = {
  async saveFlashcards(userId: string, planId: string, cards: Flashcard[]) {
    const { data: existing, error: checkError } = await supabase
      .from("flashcards")
      .select("id")
      .eq("plan_id", planId)
      .limit(1);

    if (checkError) throw checkError;
    if (existing && existing.length > 0) {
      return;
    }

    const cardsInsert = cards.map((c) => ({
      user_id: userId,
      plan_id: planId,
      front: c.front,
      back: c.back,
      tag: c.tag,
      is_mastered: false,
    }));

    const { error } = await supabase.from("flashcards").insert(cardsInsert);
    if (error) throw error;
  },

  async getFlashcards(userId: string, planId: string) {
    const { data, error } = await supabase
      .from("flashcards")
      .select("*")
      .eq("user_id", userId)
      .eq("plan_id", planId);

    if (error) throw error;
    if (!data) return [];

    return data.map((d: Record<string, unknown>) => ({
      id: d.id,
      front: d.front,
      back: d.back,
      tag: d.tag,
      isMastered: d.is_mastered,
    }));
  },

  async updateFlashcardMastery(cardId: string, isMastered: boolean) {
    const { error } = await supabase
      .from("flashcards")
      .update({ is_mastered: isMastered })
      .eq("id", cardId);

    if (error) throw error;
  }
};
