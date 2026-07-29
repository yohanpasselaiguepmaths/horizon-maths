export type InteractionType =
  | "single-choice"
  | "multiple-choice"
  | "numeric"
  | "matching"
  | "ordering"
  | "graph-selection"
  | "parameter"
  | "short-answer"
  | "information"
  | "conjecture";

export type Route = {
  next: string;
  feedback: string;
  tone: "success" | "help" | "challenge" | "neutral";
  pathTag?: string;
  misconception?: string;
};

export type JourneyStep = {
  id: string;
  stage: number;
  eyebrow: string;
  title: string;
  situation: string;
  prompt?: string;
  placeholder?: string;
  type: InteractionType;
  options?: Array<{ id: string; label: string }>;
  matches?: Array<{ id: string; label: string; choices: string[] }>;
  min?: number;
  max?: number;
  defaultValue?: number;
  unit?: string;
  expected?: string | number | Record<string, string>;
  classify?: "forecast" | "threshold" | "parameter" | "matching" | "conjecture";
  routes: Record<string, Route>;
  hints?: string[];
  convergence?: string;
  visual?: "diffusion" | "comparison" | "growth" | "transfer" | "trace";
  teacher: {
    intention: string;
    watchFor: string;
    dashboardKey: string;
  };
};

export type JourneyTrace = {
  fallbackConjecture: string;
  rule: string;
  formulas: string[];
  note: string;
  examples: Array<{
    label: string;
    formula: string;
    explanation: string;
  }>;
};

export type LearningJourney = {
  id: string;
  chapterId: string;
  title: string;
  subtitle: string;
  duration: string;
  mission: string;
  startStepId: string;
  totalStages: number;
  stageLabels: string[];
  steps: JourneyStep[];
  trace: JourneyTrace;
};
