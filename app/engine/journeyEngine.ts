import type { JourneyStep } from "../content/geometricJourney";

export type JourneyAnswer = string | number | Record<string, string>;

export function classifyAnswer(
  step: JourneyStep,
  answer: JourneyAnswer,
): string {
  if (step.classify === "forecast") {
    const value = Number(answer);
    if (Math.abs(value - 270) < 0.01) return "correct";
    if (Math.abs(value - 300) < 0.01) return "additive";
    if (Math.abs(value - 180) < 0.01 || Math.abs(value - 240) < 0.01)
      return "partial";
    return "other";
  }
  if (step.classify === "parameter") {
    const value = Number(answer);
    if (value === step.expected) return "correct";
    return value < Number(step.expected) ? "under" : "over";
  }
  if (step.classify === "matching") {
    const expected = step.expected as Record<string, string>;
    const given = answer as Record<string, string>;
    return Object.keys(expected).every((key) => expected[key] === given[key])
      ? "correct"
      : "other";
  }
  if (step.classify === "conjecture") {
    const text = String(answer).trim();
    return text.length >= 24 ? "complete" : "short";
  }
  if (step.expected !== undefined) {
    return String(answer) === String(step.expected) ? "correct" : "other";
  }
  return "continue";
}

export function resolveRoute(step: JourneyStep, answer: JourneyAnswer) {
  const classification = classifyAnswer(step, answer);
  return (
    step.routes[classification] ??
    step.routes.other ??
    step.routes.continue
  );
}
