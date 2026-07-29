import assert from "node:assert/strict";
import test from "node:test";
import {
  geometricJourney,
  journeyStepMap,
} from "../app/content/geometricJourney.ts";
import {
  classifyAnswer,
  resolveRoute,
} from "../app/engine/journeyEngine.ts";

test("le graphe ne contient aucun cul-de-sac", () => {
  for (const step of geometricJourney.steps) {
    const routes = Object.values(step.routes);
    assert.ok(routes.length > 0, `${step.id} doit proposer une sortie`);
    for (const route of routes) {
      assert.ok(
        route.next === "complete" || route.next in journeyStepMap,
        `${step.id} pointe vers une étape inconnue : ${route.next}`,
      );
    }
  }
});

test("la première bifurcation classe les conceptions visées", () => {
  const step = journeyStepMap["video-forecast"];
  assert.equal(classifyAnswer(step, 270), "correct");
  assert.equal(classifyAnswer(step, 300), "additive");
  assert.equal(classifyAnswer(step, 240), "partial");
  assert.equal(classifyAnswer(step, 111), "other");
  assert.equal(resolveRoute(step, 270).next, "threshold-challenge");
  assert.equal(resolveRoute(step, 300).next, "addition-help");
  assert.equal(resolveRoute(step, 240).next, "visual-help");
  assert.equal(resolveRoute(step, 111).next, "example-help");
});

test("tous les détours de la première bifurcation convergent", () => {
  const branchIds = [
    "threshold-challenge",
    "addition-help",
    "visual-help",
    "example-help",
  ];
  for (const id of branchIds) {
    const destinations = new Set(
      Object.values(journeyStepMap[id].routes).map((route) => route.next),
    );
    assert.deepEqual([...destinations], ["common-pattern"]);
  }
});

test("la recherche du seuil distingue avant, juste et après", () => {
  const step = journeyStepMap["bacteria-parameter"];
  assert.equal(classifyAnswer(step, 3), "under");
  assert.equal(classifyAnswer(step, 4), "correct");
  assert.equal(classifyAnswer(step, 5), "over");
  assert.equal(resolveRoute(step, 3).next, "bio-recount");
  assert.equal(resolveRoute(step, 4).next, "bio-challenge");
  assert.equal(resolveRoute(step, 5).next, "bio-visual");
});

test("tous les détours du seuil rejoignent le transfert", () => {
  for (const id of ["bio-recount", "bio-challenge", "bio-visual"]) {
    const destinations = new Set(
      Object.values(journeyStepMap[id].routes).map((route) => route.next),
    );
    assert.deepEqual([...destinations], ["transfer-contexts"]);
  }
});

test("association, défi décroissant et conjecture sont déterministes", () => {
  assert.equal(
    classifyAnswer(journeyStepMap["common-pattern"], {
      up50: "× 1,5",
      down20: "× 0,8",
      double: "× 2",
    }),
    "correct",
  );
  assert.equal(
    classifyAnswer(journeyStepMap["common-pattern"], {
      up50: "× 0,5",
      down20: "× 0,8",
      double: "× 2",
    }),
    "other",
  );
  assert.equal(classifyAnswer(journeyStepMap["bio-challenge"], "640"), "correct");
  assert.equal(
    classifyAnswer(
      journeyStepMap["personal-conjecture"],
      "Chaque terme est le précédent multiplié par le même nombre.",
    ),
    "complete",
  );
  assert.equal(
    classifyAnswer(journeyStepMap["personal-conjecture"], "On multiplie."),
    "short",
  );
});

test("le parcours comporte bien huit étapes principales", () => {
  const stages = new Set(geometricJourney.steps.map((step) => step.stage));
  assert.deepEqual([...stages].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8]);
});
