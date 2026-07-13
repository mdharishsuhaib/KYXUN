"use client";

import type { StudyPlan } from "@/lib/academic";
import FlashcardGenerator from "./FlashcardGenerator";
import PaperAnalyzer from "./PaperAnalyzer";
import ReadinessDashboard from "./ReadinessDashboard";
import VivaSimulator from "./VivaSimulator";

interface Props {
  plan: StudyPlan;
  subject: string;
}

export default function AcademicCopilotSuite({ plan, subject }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--kyxun-accent)" }}>Academic Copilot</p>
          <h2 className="font-outfit text-2xl font-black kyxun-text mt-1">Train, test, and adapt the plan</h2>
        </div>
        <span className="hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-semibold kyxun-text-subtle" style={{ background: "var(--kyxun-tag-bg)" }}>
          Built from your current study plan
        </span>
      </div>
      <ReadinessDashboard plan={plan} />
      <PaperAnalyzer plan={plan} subject={subject} />
      <div className="grid grid-cols-1 gap-6">
        <VivaSimulator plan={plan} subject={subject} />
        <FlashcardGenerator plan={plan} subject={subject} />
      </div>
    </div>
  );
}
