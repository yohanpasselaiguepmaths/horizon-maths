import {
  chapters,
  levels,
  type Chapter,
  type LevelId,
} from "../content/curriculum.ts";
import type { ClassLevel } from "./accountTypes.ts";

export function getChaptersForClassLevel(
  level: ClassLevel | undefined,
): Chapter[] {
  if (!level || level === "mixte") return chapters;
  return chapters.filter((chapter) => chapter.level === level);
}

export function getLevelsForClassLevel(level: ClassLevel): LevelId[] {
  return level === "mixte" ? levels.map((item) => item.id) : [level];
}

export function isChapterAllowedForClassLevel(
  level: ClassLevel,
  chapterId: string,
): boolean {
  return getChaptersForClassLevel(level).some(
    (chapter) => chapter.id === chapterId,
  );
}

export function resolveClassChapterId(
  level: ClassLevel | undefined,
  requestedChapterId: string,
): string {
  const availableChapters = getChaptersForClassLevel(level);
  return availableChapters.some(
    (chapter) => chapter.id === requestedChapterId,
  )
    ? requestedChapterId
    : availableChapters[0]?.id ?? chapters[0].id;
}
