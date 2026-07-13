"use client";

import type { StudyPlan } from "./academic";

export interface ReadinessInputs {
  plan: StudyPlan;
  totalChapters: number;
  completedChapters: number;
  completedTasks: Record<string, boolean>;
  vivaScore: number;
  flashcardCount: number;
  uploadedFilesCount: number;
}

export interface ReadinessOutputs {
  readinessScore: number;
  knowledgeCoverage: number;
  revisionReadiness: number;
  riskLevel: "Low" | "Medium" | "High";
  riskLabel: string;
  strongTopics: string[];
  weakTopics: string[];
  predictedMarksRange: string;
  passingProbability: number;
}

/**
 * Calculates exam readiness metrics based on a multi-dimensional heuristic.
 * 
 * METHODOLOGY & WEIGHTS:
 * 1. Knowledge Coverage (50% weight):
 *    - Represents the base understanding of the syllabus.
 *    - Base coverage is calculated from completed chapters relative to total chapters.
 *    - Incremental coverage is earned by completing planned timeline tasks, which target the remaining syllabus gaps.
 * 
 * 2. Revision Readiness (30% weight):
 *    - Represents active recall and retention.
 *    - Driven by the number of flashcards mastered (active recall, 15% weight)
 *      and the viva simulator performance (oral defense quality, 15% weight).
 * 
 * 3. Plan Execution Quality (20% weight):
 *    - Represents execution consistency and adherence to the structured schedule.
 *    - Calculated directly from the ratio of completed study tasks on the timeline.
 * 
 * 4. Deductions / Risk Adjustments:
 *    - Sleep Deprivation Penalty: -15 points if planned sleep is under 6 hours (causes high cognitive decay).
 *    - Study Burnout Penalty: -8 points if daily study load is over 10 hours (increases execution failure probability).
 *    - Low Context Penalty: -5 points if no files/notes were uploaded (limiting AI personalization precision).
 */
export function calculateReadiness(inputs: ReadinessInputs): ReadinessOutputs {
  const {
    plan,
    totalChapters,
    completedChapters,
    completedTasks,
    vivaScore,
    flashcardCount,
    uploadedFilesCount,
  } = inputs;

  // 1. Calculate Knowledge Coverage
  const initialCoverage = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;
  
  // Filter out breaks and skip blocks to count actual study tasks
  const studyTasks = plan.schedule.filter(t => t.type === "urgent" || t.type === "focus");
  const totalTasksCount = studyTasks.length;
  
  // Tasks are tracked by 'task-idx' in completedTasks where idx is the index in the original schedule
  const completedTasksCount = plan.schedule.reduce((acc, item, idx) => {
    if ((item.type === "urgent" || item.type === "focus") && completedTasks[`task-${idx}`]) {
      return acc + 1;
    }
    return acc;
  }, 0);

  const planTasksCompletedRatio = totalTasksCount > 0 ? completedTasksCount / totalTasksCount : 0;
  
  // Knowledge coverage scales from initial coverage to 100% based on study plan execution
  const knowledgeCoverage = Math.min(
    100,
    Math.round(initialCoverage + (100 - initialCoverage) * planTasksCompletedRatio)
  );

  // 2. Calculate Revision Readiness
  // We assume mastering 6 flashcards is a strong retention signal (half of the max 12 cards)
  const flashcardProgress = Math.min(1, flashcardCount / 6);
  // Viva score is already 0-100
  const normalizedViva = Math.min(100, Math.max(0, vivaScore)) / 100;
  const revisionReadiness = Math.round((flashcardProgress * 50) + (normalizedViva * 50));

  // 3. Compute base readiness score
  const executionQuality = planTasksCompletedRatio * 100;
  let score = (knowledgeCoverage * 0.5) + (revisionReadiness * 0.3) + (executionQuality * 0.2);

  // 4. Apply Risk Adjustments
  if (plan.sleepHours < 6) {
    score -= 15; // Sleep deprivation penalty
  }
  if (plan.studyHours > 10) {
    score -= 8; // Extreme load/burnout penalty
  }
  if (uploadedFilesCount === 0) {
    score -= 5; // Low-context penalty (no notes uploaded)
  }

  const readinessScore = Math.min(100, Math.max(0, Math.round(score)));

  // 5. Determine Risk Level
  let riskLevel: "Low" | "Medium" | "High" = "High";
  let riskLabel = "Critical Risk";

  if (readinessScore >= 75) {
    riskLevel = "Low";
    riskLabel = "Low Risk (Prepared)";
  } else if (readinessScore >= 50) {
    riskLevel = "Medium";
    riskLabel = "Medium Risk (Moderate)";
  } else {
    riskLevel = "High";
    riskLabel = "High Risk (Unprepared)";
  }

  // 6. Predict Marks Range (scale based on readiness score)
  const minMark = Math.max(35, Math.round(readinessScore * 0.85 + 10));
  const maxMark = Math.min(100, Math.max(minMark + 5, Math.round(readinessScore * 0.90 + 15)));
  const predictedMarksRange = `${minMark}-${maxMark}%`;

  // 7. Dynamic Strong & Weak Topics
  // Strong topics are must-study items where tasks have been completed
  const strongTopics: string[] = [];
  const weakTopics: string[] = [];

  plan.mustStudy.forEach((topic) => {
    // Find the corresponding task in the schedule
    const scheduleIndex = plan.schedule.findIndex(
      s => (s.type === "urgent" || s.type === "focus") && s.title.toLowerCase().includes(topic.toLowerCase())
    );
    
    if (scheduleIndex !== -1 && completedTasks[`task-${scheduleIndex}`]) {
      strongTopics.push(topic);
    } else {
      weakTopics.push(topic);
    }
  });

  // Fallbacks if lists are empty
  if (strongTopics.length === 0) {
    if (completedChapters > 0 && plan.mustStudy.length > 0) {
      strongTopics.push(plan.mustStudy[0]); // fallback to first must-study if chapters completed
    } else {
      strongTopics.push("No modules mastered yet");
    }
  }
  if (weakTopics.length === 0) {
    if (plan.shouldSkip.length > 0) {
      weakTopics.push(`${plan.shouldSkip[0]} (Skipped)`);
    } else {
      weakTopics.push("No major gaps detected");
    }
  }

  const averagePredictedScore = (minMark + maxMark) / 2;
  const passingProbability = Math.min(99, Math.max(10, Math.round(
    averagePredictedScore >= 40 
      ? 50 + (averagePredictedScore - 40) * 1.2 
      : (averagePredictedScore / 40) * 50
  )));

  return {
    readinessScore,
    knowledgeCoverage,
    revisionReadiness,
    riskLevel,
    riskLabel,
    strongTopics: strongTopics.slice(0, 3),
    weakTopics: weakTopics.slice(0, 3),
    predictedMarksRange,
    passingProbability,
  };
}
