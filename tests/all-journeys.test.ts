import assert from "node:assert/strict";
import test from "node:test";
import {
  allJourneys,
  createJourneyStepMap,
  genericJourneys,
  journeyRegistry,
} from "../app/content/allJourneys.ts";
import { chapters } from "../app/content/curriculum.ts";
import { classifyAnswer } from "../app/engine/journeyEngine.ts";

test("les 23 chapitres possèdent exactement un parcours actif", () => {
  assert.equal(allJourneys.length, chapters.length);
  assert.equal(new Set(allJourneys.map((journey) => journey.chapterId)).size, 23);
  for (const chapter of chapters) {
    assert.ok(journeyRegistry[chapter.id], `parcours manquant : ${chapter.id}`);
  }
});

test("chaque graphe est complet et sans cul-de-sac", () => {
  for (const journey of allJourneys) {
    const stepMap = createJourneyStepMap(journey);
    assert.ok(stepMap[journey.startStepId], `${journey.id} doit avoir un départ`);
    for (const step of journey.steps) {
      assert.ok(Object.keys(step.routes).length > 0, `${journey.id}/${step.id}`);
      for (const route of Object.values(step.routes)) {
        assert.ok(
          route.next === "complete" || route.next in stepMap,
          `${journey.id}/${step.id} pointe vers ${route.next}`,
        );
      }
    }
    assert.ok(
      journey.steps.some((step) =>
        Object.values(step.routes).some((route) => route.next === "complete"),
      ),
      `${journey.id} doit pouvoir se terminer`,
    );
  }
});

test("les étapes principales couvrent tous les rangs annoncés", () => {
  for (const journey of allJourneys) {
    const stages = new Set(journey.steps.map((step) => step.stage));
    assert.deepEqual(
      [...stages].sort((a, b) => a - b),
      Array.from({ length: journey.totalStages }, (_, index) => index + 1),
      journey.id,
    );
    assert.equal(journey.stageLabels.length, journey.totalStages);
  }
});

test("les parcours courts bifurquent puis convergent", () => {
  for (const journey of genericJourneys) {
    const stepMap = createJourneyStepMap(journey);
    const diagnostic = stepMap[journey.startStepId];
    assert.equal(diagnostic.routes.correct.next, "challenge");
    assert.equal(diagnostic.routes.other.next, "scaffold");

    for (const branchId of ["challenge", "scaffold"]) {
      const destinations = new Set(
        Object.values(stepMap[branchId].routes).map((route) => route.next),
      );
      assert.deepEqual([...destinations], ["method"], `${journey.id}/${branchId}`);
    }
  }
});

test("toutes les questions à choix valident la bonne réponse", () => {
  for (const journey of allJourneys) {
    for (const step of journey.steps) {
      if (step.type !== "single-choice" || step.expected === undefined) continue;
      assert.equal(
        classifyAnswer(step, String(step.expected)),
        "correct",
        `${journey.id}/${step.id}`,
      );
      const wrong = step.options?.find(
        (option) => option.id !== String(step.expected),
      );
      if (wrong) {
        assert.equal(
          classifyAnswer(step, wrong.id),
          "other",
          `${journey.id}/${step.id}`,
        );
      }
    }
  }
});

test("chaque parcours produit une trace pédagogique complète", () => {
  for (const journey of allJourneys) {
    assert.ok(journey.trace.rule.length > 40, journey.id);
    assert.ok(journey.trace.formulas.length >= 2, journey.id);
    assert.equal(journey.trace.examples.length, 3, journey.id);
    assert.ok(
      journey.steps.some((step) => step.type === "conjecture"),
      `${journey.id} doit faire écrire l’élève`,
    );
  }
});
