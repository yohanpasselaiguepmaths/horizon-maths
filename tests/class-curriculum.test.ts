import assert from "node:assert/strict";
import test from "node:test";
import { chapters } from "../app/content/curriculum.ts";
import {
  getChaptersForClassLevel,
  getLevelsForClassLevel,
  isChapterAllowedForClassLevel,
  resolveClassChapterId,
} from "../app/data/classCurriculum.ts";

test("chaque classe ne propose que les parcours de son niveau", () => {
  assert.equal(getChaptersForClassLevel("seconde").length, 6);
  assert.equal(getChaptersForClassLevel("premiere").length, 10);
  assert.equal(getChaptersForClassLevel("terminale").length, 7);
  assert.equal(getChaptersForClassLevel("mixte").length, 23);

  for (const chapter of getChaptersForClassLevel("seconde")) {
    assert.equal(chapter.level, "seconde");
  }
});

test("une classe de Seconde ne retombe jamais sur le parcours Terminale", () => {
  const resolved = resolveClassChapterId(
    "seconde",
    "suites-geometriques",
  );
  const chapter = chapters.find((item) => item.id === resolved);

  assert.equal(chapter?.level, "seconde");
});

test("le parcours sélectionné est conservé lorsqu’il correspond à la classe", () => {
  assert.equal(
    resolveClassChapterId("seconde", "fonctions-seconde"),
    "fonctions-seconde",
  );
});

test("un espace élève ne peut ouvrir que les parcours de sa classe", () => {
  assert.deepEqual(getLevelsForClassLevel("seconde"), ["seconde"]);
  assert.deepEqual(getLevelsForClassLevel("premiere"), ["premiere"]);
  assert.deepEqual(getLevelsForClassLevel("terminale"), ["terminale"]);
  assert.deepEqual(getLevelsForClassLevel("mixte"), [
    "seconde",
    "premiere",
    "terminale",
  ]);

  assert.equal(
    isChapterAllowedForClassLevel("seconde", "fonctions-seconde"),
    true,
  );
  assert.equal(
    isChapterAllowedForClassLevel("seconde", "suites-geometriques"),
    false,
  );
  assert.equal(
    isChapterAllowedForClassLevel("mixte", "suites-geometriques"),
    true,
  );
});
