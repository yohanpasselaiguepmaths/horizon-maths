import assert from "node:assert/strict";
import test from "node:test";
import {
  createStudentTraceText,
  formatCompletionDate,
  getPathHighlights,
} from "../app/engine/studentTrace.ts";

test("la trace reformule les détours comme des apprentissages", () => {
  assert.deepEqual(
    getPathHighlights([
      "aide-augmentation-fixe",
      "aide-premier-seuil",
      "aide-augmentation-fixe",
    ]),
    [
      "J’ai distingué une hausse fixe d’une hausse au même pourcentage.",
      "J’ai comparé les valeurs juste avant et juste après le seuil.",
    ],
  );
});

test("la date de fin est lisible et tolère les anciennes progressions", () => {
  assert.equal(formatCompletionDate(null), "Date à compléter");
  assert.equal(
    formatCompletionDate("2026-07-29T12:00:00.000Z"),
    "29 juillet 2026",
  );
});

test("le téléchargement contient la conjecture et les résultats de référence", () => {
  const trace = createStudentTraceText({
    completedAt: "2026-07-29T12:00:00.000Z",
    conjecture: "On multiplie toujours par le même nombre.",
    hintsUsed: ["indice-1"],
    pathTags: ["transfert-reussi"],
  });

  assert.match(trace, /On multiplie toujours par le même nombre\./);
  assert.match(trace, /u\(n\+1\) = q × u\(n\)/);
  assert.match(trace, /800 × 1,25⁴ ≈ 1 953/);
  assert.match(trace, /aucune donnée personnelle n’a été transmise/);
});
