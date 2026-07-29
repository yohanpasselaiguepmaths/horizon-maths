export type StudentTraceProgress = {
  completedAt: string | null;
  conjecture: string;
  hintsUsed: string[];
  pathTags: string[];
};

export type StudentTraceContent = {
  levelLabel: string;
  chapterTitle: string;
  journeyTitle: string;
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

const pathHighlights: Record<string, string> = {
  "intuition-proportionnelle":
    "J’ai reconnu une multiplication répétée par le même nombre.",
  "aide-augmentation-fixe":
    "J’ai distingué une hausse fixe d’une hausse au même pourcentage.",
  "aide-representation":
    "J’ai recalculé le pourcentage sur la nouvelle valeur.",
  "exemple-intermediaire":
    "J’ai décomposé l’évolution un pas après l’autre.",
  "defi-seuil":
    "J’ai cherché le premier rang qui dépasse un seuil.",
  "transfert-reussi":
    "J’ai transféré la règle à une culture bactérienne.",
  "aide-iteration":
    "J’ai repris les valeurs cycle après cycle.",
  "aide-premier-seuil":
    "J’ai comparé les valeurs juste avant et juste après le seuil.",
  "defi-decroissance":
    "J’ai étendu le modèle à une évolution décroissante.",
  "voie-defi": "Ma première réponse m’a permis d’accéder à un défi.",
  "detour-guide": "J’ai utilisé un détour guidé pour consolider un repère.",
  "defi-reussi": "J’ai réussi le défi proposé après le diagnostic.",
  "defi-repris": "J’ai repris le défi grâce à la rétroaction.",
  "application-reussie": "J’ai transféré la méthode dans une nouvelle situation.",
  "application-reprise":
    "J’ai corrigé mon application grâce à une explication ciblée.",
};

export function getPathHighlights(pathTags: string[]): string[] {
  const highlights = pathTags
    .map((tag) => pathHighlights[tag])
    .filter((highlight): highlight is string => Boolean(highlight));

  return Array.from(
    new Set(
      highlights.length
        ? highlights
        : ["J’ai relié plusieurs situations à une même structure multiplicative."],
    ),
  );
}

export function formatCompletionDate(completedAt: string | null): string {
  if (!completedAt) return "Date à compléter";
  const date = new Date(completedAt);
  if (Number.isNaN(date.getTime())) return "Date à compléter";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function createStudentTraceText(
  progress: StudentTraceProgress,
  content: StudentTraceContent,
): string {
  const highlights = getPathHighlights(progress.pathTags);
  const conjecture =
    progress.conjecture.trim() || content.fallbackConjecture;

  return [
    "HORIZON MATHS — MA TRACE DE DÉCOUVERTE",
    `${content.levelLabel} · ${content.chapterTitle}`,
    content.journeyTitle,
    `Parcours terminé le ${formatCompletionDate(progress.completedAt)}`,
    "",
    "Nom / prénom : ______________________________",
    "Classe : _____________________________________",
    "",
    "MA CONJECTURE",
    conjecture,
    "",
    "MON PARCOURS",
    ...highlights.map((highlight) => `• ${highlight}`),
    `• ${progress.hintsUsed.length} indice(s) consulté(s).`,
    "",
    "CE QUE JE RETIENS",
    content.rule,
    ...content.formulas,
    content.note,
    "",
    "EXEMPLES DU PARCOURS",
    ...content.examples.map(
      (example) =>
        `• ${example.label} : ${example.formula} — ${example.explanation}`,
    ),
    "",
    "APRÈS LA MISE EN COMMUN",
    "________________________________________________________________",
    "________________________________________________________________",
    "",
    "Trace créée localement : aucune donnée personnelle n’a été transmise.",
  ].join("\n");
}
