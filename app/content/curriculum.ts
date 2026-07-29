export type LevelId = "seconde" | "premiere" | "terminale";
export type Audience = "commun" | "mcv" | "tcb";

export type Chapter = {
  id: string;
  title: string;
  level: LevelId;
  audience: Audience;
  summary: string;
  pilot?: boolean;
};

export const levels: Array<{
  id: LevelId;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
}> = [
  {
    id: "seconde",
    label: "Seconde professionnelle",
    shortLabel: "Seconde",
    description: "Observer, représenter et modéliser les situations du quotidien.",
    color: "cobalt",
  },
  {
    id: "premiere",
    label: "Première professionnelle",
    shortLabel: "Première",
    description: "Relier des données, des suites et des variations.",
    color: "apricot",
  },
  {
    id: "terminale",
    label: "Terminale professionnelle",
    shortLabel: "Terminale",
    description: "Prévoir des évolutions et choisir un modèle pertinent.",
    color: "sage",
  },
];

export const chapters: Chapter[] = [
  {
    id: "statistiques-une-variable",
    title: "Statistique à une variable",
    level: "seconde",
    audience: "commun",
    summary: "Comparer des séries à l’aide d’indicateurs et de représentations.",
  },
  {
    id: "fluctuation-probabilites",
    title: "Fluctuation des fréquences et probabilités",
    level: "seconde",
    audience: "commun",
    summary: "Expérimenter le hasard et observer la stabilisation des fréquences.",
  },
  {
    id: "premier-degre",
    title: "Problèmes du premier degré",
    level: "seconde",
    audience: "commun",
    summary: "Traduire une situation par une équation ou une inéquation.",
  },
  {
    id: "fonctions-seconde",
    title: "Fonctions et variations",
    level: "seconde",
    audience: "commun",
    summary: "Passer d’un tableau à une courbe et interpréter une évolution.",
  },
  {
    id: "geometrie-seconde",
    title: "Géométrie, longueurs, aires et volumes",
    level: "seconde",
    audience: "commun",
    summary: "Résoudre des problèmes de figures planes et de solides usuels.",
  },
  {
    id: "calculs-commerciaux-seconde",
    title: "Pourcentages et documents commerciaux",
    level: "seconde",
    audience: "mcv",
    summary: "Exploiter remises, taxes, factures et documents usuels.",
  },
  {
    id: "statistiques-deux-variables-premiere",
    title: "Statistique à deux variables et ajustement affine",
    level: "premiere",
    audience: "commun",
    summary: "Lire un nuage de points et discuter la pertinence d’un ajustement.",
  },
  {
    id: "probabilites-conditionnelles",
    title: "Probabilités conditionnelles",
    level: "premiere",
    audience: "commun",
    summary: "Interpréter tableaux croisés, réunions et intersections d’événements.",
  },
  {
    id: "suites-arithmetiques",
    title: "Suites arithmétiques",
    level: "premiere",
    audience: "commun",
    summary: "Modéliser une évolution obtenue par ajouts successifs constants.",
  },
  {
    id: "equations-graphiques",
    title: "Équations et inéquations graphiques",
    level: "premiere",
    audience: "commun",
    summary: "Comparer deux fonctions par leurs représentations.",
  },
  {
    id: "polynomes-degre-deux",
    title: "Fonctions polynômes de degré 2",
    level: "premiere",
    audience: "commun",
    summary: "Relier forme factorisée, racines, signe et parabole.",
  },
  {
    id: "derivee-variations",
    title: "Fonction dérivée et variations",
    level: "premiere",
    audience: "commun",
    summary: "Passer de la pente locale à l’étude des variations.",
  },
  {
    id: "calculs-financiers-premiere",
    title: "Intérêts simples et coûts",
    level: "premiere",
    audience: "mcv",
    summary: "Étudier placements simples, coûts moyens et coûts marginaux.",
  },
  {
    id: "geometrie-espace-premiere",
    title: "Géométrie dans l’espace",
    level: "premiere",
    audience: "commun",
    summary: "Visualiser des solides et leurs sections planes.",
  },
  {
    id: "vecteurs-plan",
    title: "Vecteurs du plan",
    level: "premiere",
    audience: "tcb",
    summary: "Décrire directions, déplacements et colinéarité dans un repère.",
  },
  {
    id: "trigonometrie-premiere",
    title: "Trigonométrie",
    level: "premiere",
    audience: "tcb",
    summary: "Modéliser des phénomènes périodiques avec la fonction sinus.",
  },
  {
    id: "statistiques-deux-variables-terminale",
    title: "Statistique à deux variables et ajustements",
    level: "terminale",
    audience: "commun",
    summary: "Choisir entre plusieurs modèles d’ajustement.",
  },
  {
    id: "arbres-ponderes",
    title: "Probabilités et arbres pondérés",
    level: "terminale",
    audience: "commun",
    summary: "Modéliser des expériences successives et l’indépendance.",
  },
  {
    id: "suites-geometriques",
    title: "Découverte des suites géométriques",
    level: "terminale",
    audience: "commun",
    summary: "Comprendre les évolutions successives à taux fixe.",
    pilot: true,
  },
  {
    id: "polynomes-degre-trois",
    title: "Fonctions polynômes de degré 3",
    level: "terminale",
    audience: "commun",
    summary: "Étudier la fonction cube, les dérivées et les extremums locaux.",
  },
  {
    id: "expo-log",
    title: "Fonctions exponentielles et logarithme décimal",
    level: "terminale",
    audience: "commun",
    summary: "Modéliser une évolution continue et résoudre des problèmes de seuil.",
  },
  {
    id: "maths-financieres-terminale",
    title: "Intérêts composés, crédits et taux moyens",
    level: "terminale",
    audience: "mcv",
    summary: "Comparer placements, mensualités et coût d’un crédit.",
  },
  {
    id: "vecteurs-espace",
    title: "Vecteurs dans l’espace",
    level: "terminale",
    audience: "tcb",
    summary: "Calculer coordonnées, sommes, normes et colinéarité dans l’espace.",
  },
];

export const audienceLabels: Record<Audience, string> = {
  commun: "Commun",
  mcv: "MCV",
  tcb: "TCB",
};
