export type ScheduleItemType = "urgent" | "focus" | "break" | "skip" | string;

export interface ScheduleItem {
  day?: number;
  time: string;
  title: string;
  type: ScheduleItemType;
}

export interface PYQTopic {
  topic: string;
  frequency: number;
  examWeightage: string;
  studyPriority: "Critical" | "High Yield" | "Medium Yield" | "Skip";
  patternDetails: string;
}

export interface PredictedChapter {
  chapterName: string;
  predictedWeightage: string;
  reason: string;
}

export interface PYQAnalysisData {
  frequentlyAskedTopics: PYQTopic[];
  questionPatterns: string[];
  predictedHighValueChapters: PredictedChapter[];
}

export interface ChapterSummary {
  chapter: string;
  summary: string;
  keyPoints: string[];
}

export interface ExamWeightageItem {
  topic: string;
  weightage: string;
  marks: number;
}

export interface DocumentSummary {
  summary: string;
  keyConcepts: string[];
  formulas: string[];
  definitions: string[];
  shortNotes: string[];
  examTips: string[];
  mnemonics: string[];
  mindMap: string;
  frequentlyRepeatedTopics: string[];
  importantTables?: string[];
  importantDiagrams?: string[];
  // New pipeline fields
  chapterSummaries?: ChapterSummary[];
  timeline?: string[];
  examWeightage?: ExamWeightageItem[];
  revisionNotes?: Record<string, string[]>;
}


export interface PracticeQuestion {
  type: string;
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
  difficulty: string;
  bloomsLevel: string;
  topic: string;
  marks: number;
}

export interface ConceptNode {
  node: string;
  description: string;
  relationships: string[];
  module: string;
  page: string;
}

export interface GlossaryTerm {
  term: string;
  definition: string;
}

export interface KnowledgeModule {
  title: string;
  summary: string;
  importantTopics: string[];
  definitions: string[];
  keywords: string[];
  examples: string[];
  algorithms: string[];
  formulae: string[];
  derivations: string[];
  diagrams: string[];
  flowcharts: string[];
  tables: string[];
  mnemonics: string[];
  commonExamQuestions: string[];
  frequentMistakes: string[];
  relatedConcepts: string[];
}

export interface KnowledgeBase {
  courseName: string;
  subject: string;
  modules: KnowledgeModule[];
  glossary: GlossaryTerm[];
  conceptGraph: ConceptNode[];
  difficultyScore: number;
  examProbability: number;
}

export interface StudyPlan {
  id?: string;
  introMessage: string;
  passProbability: number;
  riskLevel: string;
  riskLabel: string;
  harshTruths: string[];
  mustStudy: string[];
  shouldSkip: string[];
  schedule: ScheduleItem[];
  studyHours: number;
  sleepHours: number;
  tacticalTip: string;
  pyqAnalysis?: PYQAnalysisData;
  documentSummary?: DocumentSummary;
  practiceQuestions?: PracticeQuestion[];
  flashcards?: Flashcard[];
  vivaQuestions?: VivaQuestion[];
  knowledgeBase?: KnowledgeBase;
}

export interface ReadinessSignal {
  label: string;
  value: number;
  detail: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  tag: string;
}

export interface VivaQuestion {
  id: string;
  question: string;
  modelAnswer: string;
  difficulty: "Warm-up" | "Core" | "Pressure";
}

export interface PaperInsight {
  topic: string;
  hits: number;
  confidence: number;
}

const stopWords = new Set([
  "about",
  "after",
  "again",
  "also",
  "answer",
  "based",
  "brief",
  "chapter",
  "define",
  "describe",
  "discuss",
  "during",
  "each",
  "exam",
  "explain",
  "from",
  "give",
  "have",
  "important",
  "into",
  "marks",
  "paper",
  "question",
  "short",
  "study",
  "that",
  "their",
  "there",
  "these",
  "this",
  "topic",
  "what",
  "when",
  "where",
  "which",
  "with",
  "write",
]);

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function cleanTopic(topic: string) {
  return topic
    .replace(/^[^A-Za-z0-9]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function getStudyDays(plan: StudyPlan) {
  return Math.max(1, new Set(plan.schedule.map((item) => item.day || 1)).size);
}

export function buildReadinessSignals(plan: StudyPlan): ReadinessSignal[] {
  const urgentBlocks = plan.schedule.filter((item) => item.type === "urgent").length;
  const focusBlocks = plan.schedule.filter((item) => item.type === "focus").length;
  const breakBlocks = plan.schedule.filter((item) => item.type === "break").length;
  const days = getStudyDays(plan);
  const coverage = clamp(Math.round(((urgentBlocks + focusBlocks) / Math.max(1, plan.schedule.length)) * 100), 0, 100);
  const recovery = clamp(Math.round((plan.sleepHours / 8) * 100), 20, 100);
  const intensity = clamp(Math.round((plan.studyHours / 10) * 100), 15, 100);

  return [
    {
      label: "Readiness",
      value: clamp(Math.round(plan.passProbability), 0, 100),
      detail: plan.riskLabel || `${plan.riskLevel} across ${days} day${days === 1 ? "" : "s"}.`,
    },
    {
      label: "Coverage",
      value: coverage,
      detail: `${urgentBlocks + focusBlocks} high-value blocks mapped from the current plan.`,
    },
    {
      label: "Recovery",
      value: recovery,
      detail: `${plan.sleepHours}h sleep target. Memory drops fast below 6h.`,
    },
    {
      label: "Execution Load",
      value: intensity,
      detail: `${plan.studyHours}h daily load with ${breakBlocks} planned breaks.`,
    },
  ];
}

export function buildFlashcards(plan: StudyPlan, subject: string): Flashcard[] {
  const documentTopics = [
    ...(plan.documentSummary?.keyConcepts || []),
    ...(plan.documentSummary?.definitions || []),
  ].map(cleanTopic).filter(Boolean);

  const topics = documentTopics.length > 0 ? documentTopics : [...plan.mustStudy, ...plan.shouldSkip].map(cleanTopic).filter(Boolean);
  if (topics.length === 0) return [];

  return topics.slice(0, 8).map((topic, index) => ({
    id: `topic-${index}`,
    front: `What is the key point about "${topic}"?`,
    back: `Use the uploaded material to recall the definition, example, and exam relevance for "${topic}".`,
    tag: index % 2 === 0 ? "Must Study" : "Technique",
  }));
}

export function buildVivaQuestions(plan: StudyPlan, subject: string): VivaQuestion[] {
  const topics = (plan.documentSummary?.keyConcepts || []).map(cleanTopic).filter(Boolean);
  if (topics.length === 0) return [];

  const fallback = subject || "your subject";
  const questions = topics.slice(0, 5).flatMap((topic, index): VivaQuestion[] => [
    {
      id: `viva-core-${index}`,
      difficulty: "Core",
      question: `Explain ${topic} using only the uploaded material.`,
      modelAnswer: `State the main idea, one supporting detail, and one exam-relevant point for ${topic} in ${fallback}.`,
    },
    {
      id: `viva-pressure-${index}`,
      difficulty: "Pressure",
      question: `What is the most likely point of confusion around ${topic}?`,
      modelAnswer: `Describe the confusion and resolve it directly from the uploaded material.`,
    },
  ]);

  return questions.slice(0, 8);
}

export function analyzeQuestionPaper(input: string, plan: StudyPlan): PaperInsight[] {
  const normalized = input.toLowerCase();
  const plannedTopics = [...plan.mustStudy, ...plan.shouldSkip].map(cleanTopic).filter(Boolean);
  const planned = plannedTopics.map((topic) => {
    const words = topic
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 3 && !stopWords.has(word));
    const hits = words.reduce((sum, word) => sum + (normalized.match(new RegExp(`\\b${word}\\b`, "g"))?.length || 0), 0);
    return {
      topic,
      hits,
      confidence: clamp(45 + hits * 12, hits ? 50 : 20, 96),
    };
  });

  const frequency = new Map<string, number>();
  normalized
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 4 && !stopWords.has(word))
    .forEach((word) => frequency.set(word, (frequency.get(word) || 0) + 1));

  const discovered = Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([topic, hits]) => ({
      topic: topic[0].toUpperCase() + topic.slice(1),
      hits,
      confidence: clamp(35 + hits * 8, 35, 85),
    }));

  return [...planned.filter((item) => item.hits > 0), ...discovered]
    .sort((a, b) => b.confidence - a.confidence || b.hits - a.hits)
    .slice(0, 8);
}
