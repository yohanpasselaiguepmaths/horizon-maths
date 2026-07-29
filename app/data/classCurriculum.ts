import { chapters, type Chapter } from "../content/curriculum.ts";
import type { TeacherClass } from "./accountTypes.ts";

export function getChaptersForClassLevel(
  level: TeacherClass["level"] | undefined,
): Chapter[] {
  if (!level || level === "mixte") return chapters;
  return chapters.filter((chapter) => chapter.level === level);
}

export function resolveClassChapterId(
  level: TeacherClass["level"] | undefined,
  requestedChapterId: string,
): string {
  const availableChapters = getChaptersForClassLevel(level);
  return availableChapters.some(
    (chapter) => chapter.id === requestedChapterId,
  )
    ? requestedChapterId
    : availableChapters[0]?.id ?? chapters[0].id;
}
