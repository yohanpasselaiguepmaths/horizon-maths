export type StudentTraceProgress = {
  completedAt: string | null;
  conjecture: string;
  hintsUsed: string[];
  pathTags: string[];
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
): string {
  const highlights = getPathHighlights(progress.pathTags);
  const conjecture =
    progress.conjecture.trim() ||
    "Une suite semble géométrique lorsque l’on multiplie toujours le terme précédent par le même nombre.";

  return [
    "HORIZON MATHS — MA TRACE DE DÉCOUVERTE",
    "Terminale · Suites géométriques",
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
    "Une suite est géométrique lorsque chaque terme s’obtient en multipliant le précédent par un même nombre q, appelé raison.",
    "u(n+1) = q × u(n)     et     u(n) = u(0) × q^n",
    "Si q > 1, la suite augmente. Si 0 < q < 1, elle diminue.",
    "",
    "EXEMPLES DU PARCOURS",
    "• Vidéo : 120 × 1,5² = 270 vues après deux nouvelles heures.",
    "• Bactéries : 800 × 1,25⁴ ≈ 1 953 ; le seuil de 1 800 est franchi au cycle 4.",
    "• Dépréciation : 1 000 × 0,8² = 640 € après deux ans.",
    "",
    "APRÈS LA MISE EN COMMUN",
    "________________________________________________________________",
    "________________________________________________________________",
    "",
    "Trace créée localement : aucune donnée personnelle n’a été transmise.",
  ].join("\n");
}
