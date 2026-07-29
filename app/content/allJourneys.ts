import { geometricJourney } from "./geometricJourney.ts";
import type {
  JourneyStep,
  JourneyTrace,
  LearningJourney,
} from "./journeyTypes";

type QuestionSeed = {
  title: string;
  situation: string;
  prompt: string;
  options: Array<{ id: string; label: string }>;
  expected: string;
  hint: string;
  success: string;
  help: string;
};

type GenericJourneySeed = {
  chapterId: string;
  title: string;
  mission: string;
  diagnostic: QuestionSeed;
  challenge: QuestionSeed;
  scaffold: {
    title: string;
    situation: string;
    prompt: string;
  };
  method: {
    title: string;
    situation: string;
    prompt: string;
  };
  application: QuestionSeed;
  conjecturePrompt: string;
  trace: JourneyTrace;
};

function question(
  title: string,
  situation: string,
  prompt: string,
  labels: string[],
  correctIndex: number,
  hint: string,
  success: string,
  help: string,
): QuestionSeed {
  const ids = ["a", "b", "c", "d"];
  return {
    title,
    situation,
    prompt,
    options: labels.map((label, index) => ({ id: ids[index], label })),
    expected: ids[correctIndex],
    hint,
    success,
    help,
  };
}

function makeJourney(seed: GenericJourneySeed): LearningJourney {
  const diagnosticId = "diagnostic";
  const challengeId = "challenge";
  const scaffoldId = "scaffold";
  const methodId = "method";
  const applicationId = "application";
  const conjectureId = "conjecture";
  const handoffId = "handoff";

  const questionStep = (
    id: string,
    stage: number,
    eyebrow: string,
    data: QuestionSeed,
    routes: JourneyStep["routes"],
  ): JourneyStep => ({
    id,
    stage,
    eyebrow,
    title: data.title,
    situation: data.situation,
    prompt: data.prompt,
    type: "single-choice",
    options: data.options,
    expected: data.expected,
    hints: [data.hint],
    routes,
    teacher: {
      intention: stage === 1 ? "Repérer la stratégie initiale." : "Valider le transfert.",
      watchFor: data.help,
      dashboardKey: `${seed.chapterId}-${id}`,
    },
  });

  return {
    id: seed.chapterId,
    chapterId: seed.chapterId,
    title: seed.title,
    subtitle: "Parcours adaptatif de découverte",
    duration: "15 à 20 min",
    mission: seed.mission,
    startStepId: diagnosticId,
    totalStages: 6,
    stageLabels: [
      "Question de départ",
      "Détour ou défi",
      "Méthode",
      "Application",
      "Synthèse",
      "Trace",
    ],
    steps: [
      questionStep(diagnosticId, 1, "Point de départ", seed.diagnostic, {
        correct: {
          next: challengeId,
          feedback: seed.diagnostic.success,
          tone: "challenge",
          pathTag: "voie-defi",
        },
        other: {
          next: scaffoldId,
          feedback: seed.diagnostic.help,
          tone: "help",
          pathTag: "detour-guide",
          misconception: seed.diagnostic.help,
        },
      }),
      questionStep(challengeId, 2, "Défi express", seed.challenge, {
        correct: {
          next: methodId,
          feedback: seed.challenge.success,
          tone: "challenge",
          pathTag: "defi-reussi",
        },
        other: {
          next: methodId,
          feedback: seed.challenge.help,
          tone: "neutral",
          pathTag: "defi-repris",
        },
      }),
      {
        id: scaffoldId,
        stage: 2,
        eyebrow: "Un détour guidé",
        title: seed.scaffold.title,
        situation: seed.scaffold.situation,
        prompt: seed.scaffold.prompt,
        type: "information",
        routes: {
          continue: {
            next: methodId,
            feedback: "Tu disposes maintenant d’un repère solide pour poursuivre.",
            tone: "success",
          },
        },
        convergence: "Le détour et le défi rejoignent la même méthode.",
        teacher: {
          intention: "Lever l’obstacle repéré au diagnostic.",
          watchFor: seed.diagnostic.help,
          dashboardKey: `${seed.chapterId}-scaffold`,
        },
      },
      {
        id: methodId,
        stage: 3,
        eyebrow: "Point de passage commun",
        title: seed.method.title,
        situation: seed.method.situation,
        prompt: seed.method.prompt,
        type: "information",
        routes: {
          continue: {
            next: applicationId,
            feedback: "La méthode est prête : appliquons-la dans une nouvelle situation.",
            tone: "success",
          },
        },
        teacher: {
          intention: "Stabiliser une méthode commune avant le transfert.",
          watchFor: "Faire verbaliser les étapes du raisonnement.",
          dashboardKey: `${seed.chapterId}-method`,
        },
      },
      questionStep(applicationId, 4, "À toi de transférer", seed.application, {
        correct: {
          next: conjectureId,
          feedback: seed.application.success,
          tone: "success",
          pathTag: "application-reussie",
        },
        other: {
          next: conjectureId,
          feedback: seed.application.help,
          tone: "help",
          pathTag: "application-reprise",
          misconception: seed.application.help,
        },
      }),
      {
        id: conjectureId,
        stage: 5,
        eyebrow: "Ta synthèse",
        title: "Écris ta règle avec tes mots",
        situation:
          "Tu as testé une idée, observé une méthode et changé de contexte. Formule maintenant le repère que tu veux retenir.",
        prompt: seed.conjecturePrompt,
        placeholder: "Je retiens que…",
        type: "conjecture",
        classify: "conjecture",
        hints: [
          "Nomme les informations à repérer puis l’opération ou la méthode à utiliser.",
          "Ajoute une phrase pour expliquer comment vérifier le résultat.",
        ],
        routes: {
          complete: {
            next: handoffId,
            feedback: "Ta formulation est enregistrée sur cet appareil.",
            tone: "success",
          },
          short: {
            next: conjectureId,
            feedback: "Ton idée est là. Ajoute comment tu passes des données au résultat.",
            tone: "help",
          },
        },
        teacher: {
          intention: "Faire formuler un invariant ou une méthode personnelle.",
          watchFor: "Présence d’une procédure et d’un contrôle.",
          dashboardKey: `${seed.chapterId}-conjecture`,
        },
      },
      {
        id: handoffId,
        stage: 6,
        eyebrow: "Mission accomplie",
        title: "Ta trace est prête",
        situation:
          "Tu peux maintenant conserver ta conjecture, la méthode et les exemples de référence avant la mise en commun en classe.",
        prompt: "Relis ta formulation puis génère ta fiche de parcours.",
        type: "information",
        routes: {
          continue: {
            next: "complete",
            feedback: "Parcours terminé.",
            tone: "success",
          },
        },
        visual: "trace",
        teacher: {
          intention: "Préparer l’institutionnalisation collective.",
          watchFor: "Comparer les formulations sans les classer.",
          dashboardKey: `${seed.chapterId}-handoff`,
        },
      },
    ],
    trace: seed.trace,
  };
}

const genericSeeds: GenericJourneySeed[] = [
  {
    chapterId: "statistiques-une-variable",
    title: "Le lot le plus régulier",
    mission: "Comparer deux séries de mesures pour conseiller un atelier de production.",
    diagnostic: question(
      "Où se trouve le centre de la série ?",
      "Cinq temps de fabrication, en minutes, sont relevés : 12 ; 14 ; 14 ; 15 ; 20.",
      "Quelle est la médiane ?",
      ["12", "14", "15", "20"],
      1,
      "Range les cinq valeurs puis prends celle du milieu.",
      "Exact : la troisième valeur ordonnée est 14.",
      "La médiane partage la série ordonnée en deux groupes de même effectif.",
    ),
    challenge: question(
      "Deux moyennes identiques, deux réalités différentes",
      "Deux machines ont la même moyenne. La première varie entre 9 et 21, la seconde entre 13 et 17.",
      "Laquelle est la plus régulière ?",
      ["La première", "La seconde", "Elles sont forcément identiques"],
      1,
      "Compare l’étendue maximale − minimale.",
      "Oui : son étendue est plus petite.",
      "Une moyenne ne décrit pas la dispersion ; l’étendue départage ici les machines.",
    ),
    scaffold: {
      title: "Ordonner avant de calculer",
      situation:
        "Pour trouver une médiane, on commence toujours par ranger les valeurs. Avec un effectif impair, la valeur centrale est directement visible.",
      prompt: "Ici : 12 ; 14 ; 14 ; 15 ; 20, donc la médiane vaut 14.",
    },
    method: {
      title: "Centre et dispersion",
      situation:
        "La moyenne et la médiane décrivent le centre. L’étendue et l’écart interquartile décrivent la dispersion.",
      prompt: "On choisit l’indicateur en fonction de la question posée.",
    },
    application: question(
      "Contrôler une série",
      "Une série a pour minimum 18 et maximum 27.",
      "Quelle est son étendue ?",
      ["9", "18", "27"],
      0,
      "Étendue = maximum − minimum.",
      "Oui : 27 − 18 = 9.",
      "Il faut soustraire le minimum au maximum : 27 − 18.",
    ),
    conjecturePrompt: "Comment choisirais-tu un indicateur pour comparer deux séries ?",
    trace: {
      fallbackConjecture:
        "Je choisis un indicateur de centre et un indicateur de dispersion adaptés à la comparaison.",
      rule:
        "Une série se décrit avec des indicateurs de tendance centrale et de dispersion, calculés sur des données ordonnées.",
      formulas: ["moyenne = somme des valeurs ÷ effectif", "étendue = maximum − minimum"],
      note: "La médiane résiste mieux aux valeurs extrêmes que la moyenne.",
      examples: [
        { label: "Médiane", formula: "12 ; 14 ; 14 ; 15 ; 20 → 14", explanation: "Valeur centrale." },
        { label: "Étendue", formula: "27 − 18 = 9", explanation: "Dispersion totale." },
        { label: "Choix", formula: "centre + dispersion", explanation: "Deux regards complémentaires." },
      ],
    },
  },
  {
    chapterId: "fluctuation-probabilites",
    title: "Le hasard finit-il par se calmer ?",
    mission: "Observer des simulations et distinguer fréquence expérimentale et probabilité.",
    diagnostic: question(
      "Une fréquence observée",
      "Sur 100 lancers d’une pièce, on obtient 47 fois pile.",
      "Quelle est la fréquence de pile ?",
      ["0,047", "0,47", "47"],
      1,
      "Fréquence = nombre de succès ÷ nombre d’essais.",
      "Exact : 47 ÷ 100 = 0,47.",
      "Une fréquence est un quotient compris entre 0 et 1.",
    ),
    challenge: question(
      "Beaucoup plus d’essais",
      "On répète des milliers de lancers d’une pièce équilibrée.",
      "Que devient généralement la fréquence de pile ?",
      ["Elle se rapproche de 0,5", "Elle vaut toujours exactement 0,5", "Elle augmente jusqu’à 1"],
      0,
      "La fréquence fluctue, mais les fluctuations relatives diminuent.",
      "Oui : elle se stabilise autour de la probabilité 0,5.",
      "Même avec beaucoup d’essais, la fréquence n’est pas garantie exactement égale à 0,5.",
    ),
    scaffold: {
      title: "Compter puis diviser",
      situation:
        "Une fréquence compare un effectif favorable à l’effectif total. Elle s’écrit en décimal, en fraction ou en pourcentage.",
      prompt: "47 succès sur 100 donnent 47/100 = 0,47 = 47 %.",
    },
    method: {
      title: "De l’expérience au modèle",
      situation:
        "La probabilité appartient au modèle. La fréquence appartient à l’expérience et varie d’une série à l’autre.",
      prompt: "Quand le nombre d’essais grandit, la fréquence tend à se rapprocher de la probabilité.",
    },
    application: question(
      "Une urne simple",
      "Une urne contient 1 boule rouge et 3 boules bleues identiques.",
      "Quelle est la probabilité de tirer la rouge ?",
      ["0,25", "0,33", "0,75"],
      0,
      "Il y a 1 issue favorable sur 4 issues équiprobables.",
      "Exact : 1/4 = 0,25.",
      "Compte toutes les boules : une rouge parmi quatre.",
    ),
    conjecturePrompt: "Quelle différence fais-tu entre une fréquence et une probabilité ?",
    trace: {
      fallbackConjecture:
        "La fréquence est observée ; la probabilité est prévue par le modèle, et la fréquence s’en rapproche quand les essais se multiplient.",
      rule:
        "La fréquence d’un événement est la proportion de réalisations observées ; elle fluctue autour de sa probabilité.",
      formulas: ["fréquence = succès ÷ essais", "P(rouge) = 1/4 = 0,25"],
      note: "Une fréquence expérimentale n’est pas obligatoirement égale à la probabilité.",
      examples: [
        { label: "Simulation", formula: "47/100 = 0,47", explanation: "Fréquence observée." },
        { label: "Modèle", formula: "P(pile) = 0,5", explanation: "Pièce équilibrée." },
        { label: "Urne", formula: "1/4 = 0,25", explanation: "Issues équiprobables." },
      ],
    },
  },
  {
    chapterId: "premier-degre",
    title: "Retrouver l’inconnue",
    mission: "Traduire un devis ou un forfait par une équation puis contrôler la solution.",
    diagnostic: question(
      "Un forfait de déplacement",
      "Un technicien facture 4 € de prise en charge puis 1,50 € par kilomètre. La facture vaut 19 €.",
      "Quelle équation traduit la situation ?",
      ["4 + 1,5x = 19", "4x + 1,5 = 19", "1,5x = 19"],
      0,
      "Sépare la partie fixe et la partie qui dépend des kilomètres.",
      "Oui : 4 est fixe et 1,5x dépend de la distance.",
      "La prise en charge de 4 € ne dépend pas du nombre de kilomètres.",
    ),
    challenge: question(
      "Résoudre le devis",
      "On part de 4 + 1,5x = 19.",
      "Quelle distance a été parcourue ?",
      ["6 km", "10 km", "15 km"],
      1,
      "Soustrais 4 puis divise par 1,5.",
      "Exact : (19 − 4) ÷ 1,5 = 10.",
      "Isole x en effectuant les mêmes opérations des deux côtés.",
    ),
    scaffold: {
      title: "Traduire terme par terme",
      situation:
        "Le total est formé d’un coût fixe et d’un coût variable. Pour x kilomètres, le coût variable vaut 1,5x.",
      prompt: "La facture s’écrit donc 4 + 1,5x.",
    },
    method: {
      title: "Isoler sans déséquilibrer",
      situation:
        "Résoudre une équation consiste à isoler l’inconnue en conservant l’égalité.",
      prompt: "On effectue la même opération dans les deux membres puis on vérifie dans la situation.",
    },
    application: question(
      "Un budget maximal",
      "Un abonnement coûte 12 € puis 3 € par séance. On dispose de 30 €.",
      "Combien de séances au maximum ?",
      ["5", "6", "10"],
      1,
      "Résous 12 + 3x ≤ 30.",
      "Oui : 3x ≤ 18, donc x ≤ 6.",
      "Retire le coût fixe avant de partager le budget restant.",
    ),
    conjecturePrompt: "Quelles étapes suis-tu pour traduire puis résoudre un problème du premier degré ?",
    trace: {
      fallbackConjecture:
        "Je repère la partie fixe, la partie variable, j’écris l’équation puis j’isole l’inconnue et je vérifie.",
      rule:
        "Une équation traduit l’égalité entre deux expressions ; une inéquation traduit une contrainte.",
      formulas: ["4 + 1,5x = 19 → x = 10", "12 + 3x ≤ 30 → x ≤ 6"],
      note: "La solution doit toujours être interprétée dans le contexte.",
      examples: [
        { label: "Traduire", formula: "fixe + prix × quantité", explanation: "Structure d’un tarif." },
        { label: "Résoudre", formula: "(19 − 4)/1,5 = 10", explanation: "Distance cherchée." },
        { label: "Contraindre", formula: "x ≤ 6", explanation: "Budget maximal." },
      ],
    },
  },
  {
    chapterId: "fonctions-seconde",
    title: "Lire une évolution",
    mission: "Passer d’un tableau à une courbe pour interpréter une grandeur qui varie.",
    diagnostic: question(
      "Lire une image",
      "Un tableau donne f(0)=3, f(1)=5 et f(2)=7.",
      "Quelle est l’image de 2 ?",
      ["2", "5", "7"],
      2,
      "L’image de 2 est la valeur associée à l’entrée 2.",
      "Exact : f(2) = 7.",
      "Ne confonds pas l’entrée et la valeur obtenue.",
    ),
    challenge: question(
      "Décrire la variation",
      "Quand x passe de 0 à 2, les valeurs 3, 5, 7 augmentent.",
      "Comment décrire f sur cet intervalle ?",
      ["Décroissante", "Constante", "Croissante"],
      2,
      "Observe le sens d’évolution des images quand x augmente.",
      "Oui : les images augmentent avec x.",
      "Une fonction est croissante lorsque les images évoluent dans le même sens que x.",
    ),
    scaffold: {
      title: "Entrée, machine, sortie",
      situation:
        "Une fonction associe à une entrée x une unique sortie f(x). Dans un tableau, on lit les deux valeurs dans la même colonne.",
      prompt: "Sous x = 2, on trouve f(x) = 7.",
    },
    method: {
      title: "Trois représentations",
      situation:
        "Une fonction peut être donnée par une formule, un tableau ou une courbe. L’image se lit verticalement ; un antécédent se cherche horizontalement.",
      prompt: "Les variations décrivent les intervalles où la courbe monte, descend ou reste stable.",
    },
    application: question(
      "Chercher un antécédent",
      "Dans le même tableau, f(1)=5.",
      "Quel est un antécédent de 5 ?",
      ["1", "2", "5"],
      0,
      "Cherche l’entrée qui produit la sortie 5.",
      "Exact : 1 est un antécédent de 5.",
      "L’antécédent est la valeur de départ, ici x = 1.",
    ),
    conjecturePrompt: "Comment lis-tu une image, un antécédent et une variation ?",
    trace: {
      fallbackConjecture:
        "Je pars de x pour lire f(x), je pars de la sortie pour chercher un antécédent et j’observe le sens de la courbe pour les variations.",
      rule:
        "Une fonction associe à chaque entrée une unique image ; ses variations décrivent l’évolution de ces images.",
      formulas: ["x → f(x)", "f(2)=7 ; f(1)=5"],
      note: "Une image est unique, mais une valeur peut avoir plusieurs antécédents.",
      examples: [
        { label: "Image", formula: "f(2)=7", explanation: "On part de 2." },
        { label: "Antécédent", formula: "f(1)=5", explanation: "1 produit 5." },
        { label: "Variation", formula: "3 < 5 < 7", explanation: "La fonction augmente." },
      ],
    },
  },
  {
    chapterId: "geometrie-seconde",
    title: "Mesurer pour fabriquer",
    mission: "Choisir la bonne grandeur et la bonne formule pour préparer une fabrication.",
    diagnostic: question(
      "Recouvrir une plaque",
      "Une plaque rectangulaire mesure 6 m sur 4 m.",
      "Quelle est son aire ?",
      ["10 m", "20 m²", "24 m²"],
      2,
      "Aire d’un rectangle = longueur × largeur.",
      "Exact : 6 × 4 = 24 m².",
      "Une aire s’exprime en unités carrées et se calcule ici par un produit.",
    ),
    challenge: question(
      "Remplir une caisse",
      "Une caisse mesure 3 m × 2 m × 5 m.",
      "Quel est son volume ?",
      ["10 m²", "30 m³", "60 m³"],
      1,
      "Volume d’un pavé = longueur × largeur × hauteur.",
      "Oui : 3 × 2 × 5 = 30 m³.",
      "Un volume mobilise trois dimensions et s’exprime en unités cubes.",
    ),
    scaffold: {
      title: "Identifier la grandeur",
      situation:
        "Une longueur suit une ligne, une aire recouvre une surface et un volume remplit un solide.",
      prompt: "La question « recouvrir » indique une aire, donc des m².",
    },
    method: {
      title: "Figure, formule, unité",
      situation:
        "Avant de calculer, on repère la figure, les dimensions utiles et l’unité attendue.",
      prompt: "On écrit la formule, on remplace les valeurs puis on contrôle l’ordre de grandeur.",
    },
    application: question(
      "Contrôler un angle droit",
      "Un triangle a pour côtés 3 m, 4 m et 5 m.",
      "Est-il rectangle ?",
      ["Oui, car 3² + 4² = 5²", "Non, car 3 + 4 ≠ 5", "Impossible à savoir"],
      0,
      "Teste le théorème de Pythagore avec le plus grand côté.",
      "Exact : 9 + 16 = 25.",
      "Compare le carré du plus grand côté à la somme des deux autres carrés.",
    ),
    conjecturePrompt: "Comment choisis-tu entre longueur, aire, volume et relation de Pythagore ?",
    trace: {
      fallbackConjecture:
        "J’identifie la grandeur demandée, la figure, la formule et l’unité avant de calculer.",
      rule:
        "Le choix de la formule dépend de la grandeur : ligne, surface, solide ou relation entre côtés.",
      formulas: ["Aire rectangle = L × l", "Volume pavé = L × l × h", "a² + b² = c²"],
      note: "Les unités permettent de vérifier la nature du résultat.",
      examples: [
        { label: "Aire", formula: "6 × 4 = 24 m²", explanation: "Recouvrir." },
        { label: "Volume", formula: "3 × 2 × 5 = 30 m³", explanation: "Remplir." },
        { label: "Pythagore", formula: "3²+4²=5²", explanation: "Angle droit." },
      ],
    },
  },
  {
    chapterId: "calculs-commerciaux-seconde",
    title: "Du prix affiché au prix payé",
    mission: "Décoder remises, taxes et factures sans confondre taux et coefficient.",
    diagnostic: question(
      "Une remise immédiate",
      "Un article à 80 € bénéficie d’une remise de 25 %.",
      "Quel est le prix remisé ?",
      ["20 €", "60 €", "75 €"],
      1,
      "Après −25 %, il reste 75 % du prix.",
      "Exact : 80 × 0,75 = 60 €.",
      "La remise vaut 20 €, mais le prix payé vaut 80 − 20 = 60 €.",
    ),
    challenge: question(
      "Passer du HT au TTC",
      "Un produit coûte 100 € HT et la TVA est de 20 %.",
      "Quel est le prix TTC ?",
      ["80 €", "120 €", "200 €"],
      1,
      "Une hausse de 20 % correspond au coefficient 1,20.",
      "Oui : 100 × 1,20 = 120 €.",
      "Le TTC contient 100 % du HT plus 20 % de taxe.",
    ),
    scaffold: {
      title: "Taux ou montant ?",
      situation:
        "25 % de 80 vaut 20. Cette valeur est le montant de la remise, pas le nouveau prix.",
      prompt: "Le prix remisé vaut 80 − 20, ou directement 80 × 0,75.",
    },
    method: {
      title: "Utiliser un coefficient",
      situation:
        "Augmenter de t % revient à multiplier par 1+t/100. Diminuer de t % revient à multiplier par 1−t/100.",
      prompt: "On identifie toujours la valeur de départ et la valeur finale.",
    },
    application: question(
      "Retrouver le prix initial",
      "Après une remise de 20 %, un article coûte 48 €.",
      "Quel était son prix avant remise ?",
      ["38,40 €", "57,60 €", "60 €"],
      2,
      "48 représente 80 % du prix initial : divise par 0,8.",
      "Exact : 48 ÷ 0,8 = 60 €.",
      "Pour remonter avant la remise, on divise par le coefficient 0,8.",
    ),
    conjecturePrompt: "Comment passes-tu d’un taux d’évolution à un prix final ou initial ?",
    trace: {
      fallbackConjecture:
        "Je transforme le taux en coefficient, je multiplie pour aller vers le prix final et je divise pour revenir au prix initial.",
      rule:
        "Les évolutions commerciales se calculent avec un coefficient multiplicateur appliqué à la bonne valeur de référence.",
      formulas: ["+t % → ×(1+t/100)", "−t % → ×(1−t/100)", "prix initial = final ÷ coefficient"],
      note: "Le montant de la remise et le prix remisé sont deux résultats différents.",
      examples: [
        { label: "Remise", formula: "80 × 0,75 = 60 €", explanation: "−25 %." },
        { label: "TVA", formula: "100 × 1,20 = 120 €", explanation: "+20 %." },
        { label: "Retour", formula: "48 ÷ 0,8 = 60 €", explanation: "Prix initial." },
      ],
    },
  },
  {
    chapterId: "statistiques-deux-variables-premiere",
    title: "Une tendance dans le nuage",
    mission: "Lire un nuage de points et décider si un ajustement affine est pertinent.",
    diagnostic: question(
      "Lire une orientation",
      "Dans un nuage de points, les points montent globalement de gauche à droite.",
      "Quelle tendance observe-t-on ?",
      ["Négative", "Positive", "Aucune"],
      1,
      "Regarde comment y évolue quand x augmente.",
      "Exact : les deux variables augmentent globalement ensemble.",
      "Une orientation montante traduit une association positive.",
    ),
    challenge: question(
      "Choisir une droite",
      "Les points sont proches d’une même direction, sans courbure visible.",
      "Quel modèle essayer en premier ?",
      ["Un ajustement affine", "Un cercle", "Aucun modèle n’est possible"],
      0,
      "Une forme allongée et presque rectiligne suggère une droite.",
      "Oui : une droite d’ajustement peut résumer la tendance.",
      "La proximité d’une direction rectiligne rend l’ajustement affine pertinent.",
    ),
    scaffold: {
      title: "Observer avant de calculer",
      situation:
        "On décrit d’abord la forme, le sens et la dispersion du nuage. Un coefficient ou une droite ne remplace pas cette lecture.",
      prompt: "Ici, la forme est allongée et orientée vers le haut.",
    },
    method: {
      title: "Ajuster puis interpréter",
      situation:
        "Une droite d’équation y=ax+b résume une tendance approximative. Son coefficient a décrit le sens et l’intensité moyenne de l’évolution.",
      prompt: "Une prévision loin des données observées reste fragile.",
    },
    application: question(
      "Corrélation ou causalité ?",
      "Deux variables augmentent ensemble dans un échantillon.",
      "Peut-on conclure que l’une cause forcément l’autre ?",
      ["Oui, toujours", "Non, pas avec le seul nuage", "Oui, si la droite monte"],
      1,
      "Une association statistique ne prouve pas un mécanisme causal.",
      "Exact : il faut d’autres éléments pour établir une causalité.",
      "Le nuage décrit une liaison, pas nécessairement une cause.",
    ),
    conjecturePrompt: "Quels indices te permettent de choisir et d’utiliser un ajustement affine ?",
    trace: {
      fallbackConjecture:
        "J’observe la forme du nuage, j’ajuste par une droite si la tendance est rectiligne et je limite les extrapolations.",
      rule:
        "Un ajustement affine résume une tendance rectiligne entre deux variables sans démontrer de causalité.",
      formulas: ["y = ax + b", "a > 0 : tendance croissante"],
      note: "Une extrapolation est d’autant plus incertaine qu’elle s’éloigne des données.",
      examples: [
        { label: "Nuage", formula: "orientation montante", explanation: "Association positive." },
        { label: "Modèle", formula: "y = ax+b", explanation: "Tendance moyenne." },
        { label: "Prudence", formula: "corrélation ≠ causalité", explanation: "Interprétation." },
      ],
    },
  },
  {
    chapterId: "probabilites-conditionnelles",
    title: "Changer de population de référence",
    mission: "Lire un tableau croisé et calculer une probabilité conditionnelle.",
    diagnostic: question(
      "Parmi les personnes concernées",
      "Dans une entreprise, 30 personnes sont des femmes et 12 d’entre elles travaillent de nuit.",
      "Quelle est la probabilité de travailler de nuit sachant que la personne est une femme ?",
      ["12/30", "12/100", "30/12"],
      0,
      "Après « sachant que femme », la population de référence contient 30 personnes.",
      "Exact : 12 parmi 30, soit 0,4.",
      "La condition change le dénominateur : on ne raisonne que parmi les femmes.",
    ),
    challenge: question(
      "Une intersection",
      "60 % des salariés sont formés et 25 % des salariés formés travaillent à distance.",
      "Quelle est la probabilité d’être formé et à distance ?",
      ["0,15", "0,25", "0,85"],
      0,
      "Multiplie P(F) par P(D|F).",
      "Oui : 0,60 × 0,25 = 0,15.",
      "Pour suivre deux conditions successives, on multiplie les probabilités de la branche.",
    ),
    scaffold: {
      title: "Le mot « sachant »",
      situation:
        "« Sachant que A » signifie que l’on se place uniquement dans le groupe A. Le total de ce groupe devient le nouveau dénominateur.",
      prompt: "Parmi 30 femmes, 12 travaillent de nuit : 12/30.",
    },
    method: {
      title: "Condition et intersection",
      situation:
        "La probabilité conditionnelle P(B|A) se calcule dans le groupe A. L’intersection A∩B rassemble les personnes qui vérifient les deux événements.",
      prompt: "P(A∩B) = P(A) × P(B|A).",
    },
    application: question(
      "Lire un autre groupe",
      "Parmi 40 personnes titulaires d’un permis, 10 utilisent un véhicule électrique.",
      "Quelle est P(électrique | permis) ?",
      ["0,10", "0,25", "0,40"],
      1,
      "10 personnes sur le groupe conditionnel de 40.",
      "Exact : 10/40 = 0,25.",
      "Le groupe de référence est celui des titulaires du permis.",
    ),
    conjecturePrompt: "Comment repères-tu le bon dénominateur dans une probabilité conditionnelle ?",
    trace: {
      fallbackConjecture:
        "Après « sachant que A », je me limite au groupe A ; pour une intersection, je multiplie le long de la branche.",
      rule:
        "Une probabilité conditionnelle utilise comme référence le groupe imposé par la condition.",
      formulas: ["P(B|A) = P(A∩B)/P(A)", "P(A∩B)=P(A)×P(B|A)"],
      note: "L’ordre de la condition compte : P(B|A) n’est pas toujours P(A|B).",
      examples: [
        { label: "Condition", formula: "12/30 = 0,4", explanation: "Parmi les femmes." },
        { label: "Intersection", formula: "0,60×0,25=0,15", explanation: "Deux événements." },
        { label: "Nouveau groupe", formula: "10/40=0,25", explanation: "Référence conditionnelle." },
      ],
    },
  },
  {
    chapterId: "suites-arithmetiques",
    title: "Une hausse régulière",
    mission: "Reconnaître et prévoir une évolution obtenue par ajouts constants.",
    diagnostic: question(
      "Un stock qui augmente",
      "Un stock contient 200 pièces au départ et augmente de 15 pièces par semaine.",
      "Combien contient-il après 3 semaines ?",
      ["215", "230", "245"],
      2,
      "Ajoute 15 trois fois à la valeur initiale.",
      "Exact : 200 + 3×15 = 245.",
      "Le rang 0 correspond au départ ; trois semaines donnent trois ajouts.",
    ),
    challenge: question(
      "Écrire directement le terme",
      "On note u₀=200 et la raison vaut 15.",
      "Quelle formule donne uₙ ?",
      ["uₙ=200+15n", "uₙ=200×15n", "uₙ=15+200n"],
      0,
      "Une suite arithmétique ajoute n fois la raison au terme initial.",
      "Oui : uₙ = u₀ + nr.",
      "Une évolution additive utilise une somme, pas une multiplication répétée.",
    ),
    scaffold: {
      title: "Compter les ajouts",
      situation:
        "Semaine 0 : 200 ; semaine 1 : 215 ; semaine 2 : 230 ; semaine 3 : 245.",
      prompt: "La différence entre deux termes successifs reste égale à 15.",
    },
    method: {
      title: "Raison additive",
      situation:
        "Une suite est arithmétique lorsque l’on ajoute toujours le même nombre r au terme précédent.",
      prompt: "uₙ₊₁ = uₙ + r et uₙ = u₀ + nr.",
    },
    application: question(
      "Une baisse régulière",
      "Une réserve de 500 L diminue de 20 L par jour.",
      "Quelle est la raison de la suite ?",
      ["−20", "20", "480"],
      0,
      "La raison est la différence terme suivant − terme précédent.",
      "Exact : on ajoute −20 chaque jour.",
      "Une diminution correspond à une raison négative.",
    ),
    conjecturePrompt: "Comment reconnais-tu une suite arithmétique et prévois-tu son terme de rang n ?",
    trace: {
      fallbackConjecture:
        "Une suite est arithmétique quand la différence entre deux termes successifs est constante.",
      rule:
        "Dans une suite arithmétique, chaque terme s’obtient en ajoutant la même raison r.",
      formulas: ["uₙ₊₁ = uₙ + r", "uₙ = u₀ + nr"],
      note: "Une raison positive produit une hausse ; une raison négative, une baisse.",
      examples: [
        { label: "Stock", formula: "200+3×15=245", explanation: "Trois ajouts." },
        { label: "Formule", formula: "uₙ=200+15n", explanation: "Prévision directe." },
        { label: "Baisse", formula: "r=−20", explanation: "Évolution décroissante." },
      ],
    },
  },
  {
    chapterId: "equations-graphiques",
    title: "Le point où tout bascule",
    mission: "Résoudre équations et inéquations en comparant des courbes.",
    diagnostic: question(
      "Deux tarifs se rencontrent",
      "Deux droites représentant des tarifs se coupent au point d’abscisse 4.",
      "Quelle est la solution de f(x)=g(x) ?",
      ["x=0", "x=4", "y=4 uniquement"],
      1,
      "Une égalité de fonctions correspond aux points d’intersection.",
      "Exact : les deux fonctions ont la même valeur pour x=4.",
      "La solution est l’abscisse du point d’intersection.",
    ),
    challenge: question(
      "Comparer deux courbes",
      "À droite de x=4, la courbe de f est sous celle de g.",
      "Que peut-on affirmer pour x>4 ?",
      ["f(x)>g(x)", "f(x)=g(x)", "f(x)<g(x)"],
      2,
      "La courbe la plus basse possède la plus petite ordonnée.",
      "Oui : f(x) est alors inférieur à g(x).",
      "Comparer les ordonnées revient à comparer la hauteur des courbes.",
    ),
    scaffold: {
      title: "Lire les coordonnées",
      situation:
        "Au point d’intersection, les deux courbes ont la même ordonnée pour une même abscisse.",
      prompt: "On projette le point sur l’axe horizontal pour lire la solution x=4.",
    },
    method: {
      title: "Égalité et ordre sur un graphique",
      situation:
        "f(x)=g(x) se lit aux intersections. f(x)≤g(x) se lit là où la courbe de f est sous ou sur celle de g.",
      prompt: "La réponse s’écrit avec des valeurs ou des intervalles d’abscisses.",
    },
    application: question(
      "Résoudre f(x)=0",
      "La courbe de f coupe l’axe des abscisses en x=−2 et x=3.",
      "Quelles sont les solutions de f(x)=0 ?",
      ["−2 et 3", "0 et 3", "−2 uniquement"],
      0,
      "Sur l’axe des abscisses, l’ordonnée vaut 0.",
      "Exact : les intersections avec l’axe donnent les racines.",
      "Cherche toutes les abscisses des points où la courbe atteint y=0.",
    ),
    conjecturePrompt: "Comment traduis-tu graphiquement une équation ou une inéquation ?",
    trace: {
      fallbackConjecture:
        "Je lis une égalité aux intersections et une inégalité en comparant la hauteur des courbes.",
      rule:
        "Une équation graphique cherche des abscisses d’intersection ; une inéquation cherche des zones où une courbe est au-dessus ou au-dessous.",
      formulas: ["f(x)=g(x) ↔ intersections", "f(x)≤g(x) ↔ courbe f sous g"],
      note: "Les solutions sont des abscisses, pas les ordonnées des points.",
      examples: [
        { label: "Intersection", formula: "x=4", explanation: "Deux tarifs égaux." },
        { label: "Ordre", formula: "x>4 : f(x)<g(x)", explanation: "Courbe plus basse." },
        { label: "Racines", formula: "x=−2 ou x=3", explanation: "Axe horizontal." },
      ],
    },
  },
  {
    chapterId: "polynomes-degre-deux",
    title: "Décoder une parabole",
    mission: "Relier racines, signe, sommet et différentes formes d’un polynôme.",
    diagnostic: question(
      "Une forme déjà factorisée",
      "On considère f(x)=x(x−5).",
      "Quelles sont ses racines ?",
      ["0 et 5", "0 et −5", "1 et 5"],
      0,
      "Un produit est nul si l’un de ses facteurs est nul.",
      "Exact : x=0 ou x−5=0.",
      "Annule séparément chaque facteur.",
    ),
    challenge: question(
      "Lire le signe",
      "Pour f(x)=x(x−5), la parabole est tournée vers le haut.",
      "Où f(x)≤0 ?",
      ["Entre 0 et 5", "Avant 0 seulement", "Après 5 seulement"],
      0,
      "Une parabole ouverte vers le haut est sous l’axe entre ses racines.",
      "Oui : f est négative ou nulle sur [0;5].",
      "Les racines découpent l’axe ; teste par exemple x=1.",
    ),
    scaffold: {
      title: "Le produit nul",
      situation:
        "x(x−5)=0 signifie que x=0 ou que x−5=0. On obtient donc deux racines.",
      prompt: "Ces racines correspondent aux intersections de la parabole avec l’axe horizontal.",
    },
    method: {
      title: "Choisir la bonne forme",
      situation:
        "La forme développée aide à calculer, la forme factorisée révèle les racines et la forme canonique révèle le sommet.",
      prompt: "Le signe dépend de l’orientation de la parabole et de la position par rapport aux racines.",
    },
    application: question(
      "Trouver l’axe de symétrie",
      "On veut repérer le sommet de la parabole.",
      "Pour f(x)=x²−6x+5, l’axe de symétrie passe par quelle abscisse ?",
      ["−3", "3", "6"],
      1,
      "L’abscisse du sommet vaut −b/(2a).",
      "Exact : −(−6)/(2×1)=3.",
      "Utilise xS = −b/(2a).",
    ),
    conjecturePrompt: "Quelle forme du polynôme choisis-tu pour chercher les racines, le signe ou le sommet ?",
    trace: {
      fallbackConjecture:
        "J’utilise la forme factorisée pour les racines et le signe, et la forme canonique ou −b/(2a) pour le sommet.",
      rule:
        "Les différentes écritures d’un polynôme de degré 2 mettent en évidence des informations complémentaires.",
      formulas: ["f(x)=a(x−x₁)(x−x₂)", "xS=−b/(2a)"],
      note: "Le signe entre les racines dépend du signe du coefficient a.",
      examples: [
        { label: "Racines", formula: "x(x−5)=0", explanation: "0 et 5." },
        { label: "Signe", formula: "f(x)≤0 sur [0;5]", explanation: "Parabole vers le haut." },
        { label: "Sommet", formula: "xS=3", explanation: "Axe de symétrie." },
      ],
    },
  },
  {
    chapterId: "derivee-variations",
    title: "La pente qui raconte la courbe",
    mission: "Utiliser le signe de la dérivée pour prévoir les variations d’une fonction.",
    diagnostic: question(
      "Une dérivée positive",
      "Sur un intervalle, f′(x)>0.",
      "Comment varie f ?",
      ["Elle décroît", "Elle est constante", "Elle croît"],
      2,
      "Le signe de la dérivée donne le signe de la pente.",
      "Exact : une pente positive correspond à une fonction croissante.",
      "Imagine des tangentes qui montent de gauche à droite.",
    ),
    challenge: question(
      "Un extremum",
      "f′(x)=2x−4 : la dérivée est négative avant 2 puis positive après 2.",
      "Que possède f en x=2 ?",
      ["Un maximum", "Un minimum", "Aucun extremum"],
      1,
      "La fonction décroît puis croît.",
      "Oui : le changement − vers + produit un minimum.",
      "Traduis chaque signe de f′ en variation de f.",
    ),
    scaffold: {
      title: "Du signe à la pente",
      situation:
        "f′(x) mesure la pente locale : positive, la tangente monte ; négative, elle descend ; nulle, elle est horizontale.",
      prompt: "On construit le tableau de variations à partir du signe de f′.",
    },
    method: {
      title: "Étudier puis conclure",
      situation:
        "On calcule f′, on cherche ses zéros, on étudie son signe puis on en déduit les variations de f.",
      prompt: "Un changement de signe de f′ peut signaler un maximum ou un minimum local.",
    },
    application: question(
      "Une tangente horizontale",
      "La tangente à la courbe de f est horizontale en x=5.",
      "Que vaut f′(5) ?",
      ["−1", "0", "5"],
      1,
      "Une droite horizontale a une pente nulle.",
      "Exact : f′(5)=0.",
      "La dérivée est le coefficient directeur de la tangente.",
    ),
    conjecturePrompt: "Comment passes-tu de la dérivée au tableau de variations ?",
    trace: {
      fallbackConjecture:
        "J’étudie le signe de f′ : positif signifie croissant, négatif décroissant, et un changement de signe repère un extremum.",
      rule:
        "La dérivée décrit la pente locale et son signe détermine les variations de la fonction.",
      formulas: ["f′>0 → f croissante", "f′<0 → f décroissante", "f′=0 → tangente horizontale"],
      note: "Un zéro de la dérivée n’est un extremum que si le comportement change autour.",
      examples: [
        { label: "Croissance", formula: "f′>0", explanation: "Pente positive." },
        { label: "Minimum", formula: "− puis +", explanation: "Décroît puis croît." },
        { label: "Tangente", formula: "f′(5)=0", explanation: "Horizontale." },
      ],
    },
  },
  {
    chapterId: "calculs-financiers-premiere",
    title: "Faire parler un placement",
    mission: "Calculer un intérêt simple et comparer des coûts dans une décision commerciale.",
    diagnostic: question(
      "Un intérêt simple",
      "1 000 € sont placés à intérêt simple au taux annuel de 3 % pendant 2 ans.",
      "Quel est le capital final ?",
      ["1 030 €", "1 060 €", "1 090 €"],
      1,
      "À intérêt simple, l’intérêt annuel se calcule toujours sur 1 000 €.",
      "Exact : 1 000 + 2×30 = 1 060 €.",
      "L’intérêt annuel vaut 3 % de 1 000, soit 30 €.",
    ),
    challenge: question(
      "Écrire l’intérêt",
      "C est le capital, t le taux annuel décimal et n le nombre d’années.",
      "Quelle formule donne l’intérêt simple total ?",
      ["I=C+t+n", "I=C×t×n", "I=C×(1+t)ⁿ"],
      1,
      "L’intérêt de chaque période est C×t.",
      "Oui : on répète n fois le même intérêt C×t.",
      "La puissance correspondrait à des intérêts composés.",
    ),
    scaffold: {
      title: "Même intérêt chaque année",
      situation:
        "À intérêt simple, les intérêts ne produisent pas eux-mêmes d’intérêts. La base reste le capital initial.",
      prompt: "3 % de 1 000 = 30 €, donc 60 € en deux ans.",
    },
    method: {
      title: "Capital, taux, durée",
      situation:
        "On convertit le taux en décimal, on harmonise la durée avec la période du taux, puis on calcule I=Ctn.",
      prompt: "Le capital final vaut C+I.",
    },
    application: question(
      "Comparer deux coûts",
      "Une solution coûte 240 € pour 12 mois.",
      "Quel est son coût mensuel moyen ?",
      ["12 €", "20 €", "28 €"],
      1,
      "Coût moyen = coût total ÷ nombre de périodes.",
      "Exact : 240 ÷ 12 = 20 €.",
      "Répartis le coût total sur les douze mois.",
    ),
    conjecturePrompt: "Quelles grandeurs identifies-tu avant un calcul financier simple ?",
    trace: {
      fallbackConjecture:
        "J’identifie le capital, le taux et la durée, je convertis les unités puis j’applique I=Ctn.",
      rule:
        "À intérêt simple, l’intérêt est proportionnel au capital initial, au taux et à la durée.",
      formulas: ["I = C × t × n", "capital final = C + I", "coût moyen = total ÷ quantité"],
      note: "Le taux et la durée doivent utiliser la même période.",
      examples: [
        { label: "Intérêt", formula: "1000×0,03×2=60 €", explanation: "Deux ans." },
        { label: "Capital", formula: "1000+60=1060 €", explanation: "Valeur finale." },
        { label: "Coût moyen", formula: "240/12=20 €", explanation: "Par mois." },
      ],
    },
  },
  {
    chapterId: "geometrie-espace-premiere",
    title: "Couper un solide sans le casser",
    mission: "Visualiser des sections planes et calculer des grandeurs dans l’espace.",
    diagnostic: question(
      "Une coupe parallèle",
      "On coupe un cube par un plan parallèle à l’une de ses faces.",
      "Quelle forme obtient-on ?",
      ["Un carré", "Un triangle", "Un cercle"],
      0,
      "Une section parallèle à une face reproduit sa forme.",
      "Exact : la section est un carré.",
      "La coupe conserve la forme de la face parallèle.",
    ),
    challenge: question(
      "Volume d’un prisme",
      "Un prisme a une aire de base de 12 cm² et une hauteur de 5 cm.",
      "Quel est son volume ?",
      ["17 cm³", "60 cm³", "120 cm³"],
      1,
      "Volume prisme = aire de base × hauteur.",
      "Oui : 12 × 5 = 60 cm³.",
      "Le volume se calcule en multipliant la surface de base par la hauteur.",
    ),
    scaffold: {
      title: "Imaginer la trace du plan",
      situation:
        "La section est la figure formée par les points où le plan rencontre les faces du solide.",
      prompt: "Un plan parallèle au dessus du cube rencontre quatre faces à la même hauteur.",
    },
    method: {
      title: "Représenter puis mesurer",
      situation:
        "On repère les faces coupées, on relie les points d’intersection puis on identifie la figure obtenue.",
      prompt: "Pour un prisme ou un cylindre : volume = aire de base × hauteur.",
    },
    application: question(
      "Une section de cylindre",
      "Un cylindre est coupé par un plan perpendiculaire à son axe.",
      "Quelle est la section ?",
      ["Un disque", "Un rectangle", "Un triangle"],
      0,
      "Le plan est parallèle aux bases circulaires.",
      "Exact : on obtient un disque.",
      "Une coupe perpendiculaire à l’axe est parallèle aux bases.",
    ),
    conjecturePrompt: "Comment détermines-tu la forme d’une section et le volume d’un solide ?",
    trace: {
      fallbackConjecture:
        "Je repère l’orientation du plan par rapport aux faces ou à l’axe, puis j’identifie la section.",
      rule:
        "Une section plane dépend de l’orientation du plan ; un volume de prisme s’obtient par base × hauteur.",
      formulas: ["V = aire de base × hauteur", "plan parallèle à une face → même forme"],
      note: "Les arêtes cachées peuvent être représentées en pointillés pour mieux visualiser.",
      examples: [
        { label: "Cube", formula: "plan // face → carré", explanation: "Section parallèle." },
        { label: "Prisme", formula: "12×5=60 cm³", explanation: "Volume." },
        { label: "Cylindre", formula: "plan ⟂ axe → disque", explanation: "Coupe transversale." },
      ],
    },
  },
  {
    chapterId: "vecteurs-plan",
    title: "Coder un déplacement",
    mission: "Décrire un déplacement dans le plan et reconnaître des directions parallèles.",
    diagnostic: question(
      "Du point A au point B",
      "A(1;2) et B(4;6).",
      "Quelles sont les coordonnées du vecteur AB ?",
      ["(3;4)", "(5;8)", "(−3;−4)"],
      0,
      "Soustrais arrivée − départ pour chaque coordonnée.",
      "Exact : (4−1 ; 6−2) = (3;4).",
      "Un vecteur AB se calcule par coordonnées de B moins coordonnées de A.",
    ),
    challenge: question(
      "Même direction",
      "On compare les vecteurs u(3;4) et v(6;8).",
      "Sont-ils colinéaires ?",
      ["Oui", "Non", "Seulement si leurs normes sont égales"],
      0,
      "Chaque coordonnée de v est le double de celle de u.",
      "Oui : v=2u.",
      "Deux vecteurs sont colinéaires lorsque l’un est un multiple de l’autre.",
    ),
    scaffold: {
      title: "Arrivée moins départ",
      situation:
        "Pour aller de 1 à 4, on avance de 3 ; pour aller de 2 à 6, on monte de 4.",
      prompt: "Le déplacement est donc codé par (3;4).",
    },
    method: {
      title: "Coordonnées et colinéarité",
      situation:
        "AB=(xB−xA ; yB−yA). Deux vecteurs non nuls sont colinéaires si leurs coordonnées sont proportionnelles.",
      prompt: "La norme mesure la longueur du déplacement.",
    },
    application: question(
      "Longueur d’un déplacement",
      "Le vecteur u a pour coordonnées (3;4).",
      "Quelle est la norme du vecteur (3;4) ?",
      ["5", "7", "25"],
      0,
      "Utilise √(3²+4²).",
      "Exact : √25 = 5.",
      "La norme utilise le théorème de Pythagore.",
    ),
    conjecturePrompt: "Comment calcules-tu un vecteur, sa norme et sa colinéarité avec un autre ?",
    trace: {
      fallbackConjecture:
        "Je fais arrivée moins départ ; je cherche un coefficient commun pour la colinéarité et j’utilise Pythagore pour la norme.",
      rule:
        "Un vecteur du plan code une direction, un sens et une longueur à l’aide de deux coordonnées.",
      formulas: ["AB=(xB−xA ; yB−yA)", "‖u‖=√(x²+y²)", "v=ku → colinéaires"],
      note: "Inverser A et B change le signe du vecteur.",
      examples: [
        { label: "Coordonnées", formula: "AB=(3;4)", explanation: "Arrivée − départ." },
        { label: "Colinéarité", formula: "(6;8)=2(3;4)", explanation: "Même direction." },
        { label: "Norme", formula: "√(3²+4²)=5", explanation: "Longueur." },
      ],
    },
  },
  {
    chapterId: "trigonometrie-premiere",
    title: "Le rythme d’un phénomène",
    mission: "Lire amplitude, période et valeurs remarquables d’un phénomène sinusoïdal.",
    diagnostic: question(
      "Au départ du cycle",
      "On considère la fonction sinus.",
      "Que vaut sin(0) ?",
      ["−1", "0", "1"],
      1,
      "Sur le cercle trigonométrique, l’ordonnée du point d’angle 0 est nulle.",
      "Exact : sin(0)=0.",
      "Le sinus correspond à l’ordonnée sur le cercle.",
    ),
    challenge: question(
      "Un tour complet",
      "La fonction sinus retrouve ses valeurs après un tour complet.",
      "Quelle est sa période ?",
      ["π/2", "π", "2π"],
      2,
      "Un tour complet mesure 2π radians.",
      "Oui : sin(x+2π)=sin(x).",
      "La période correspond à un tour entier du cercle.",
    ),
    scaffold: {
      title: "L’ordonnée sur le cercle",
      situation:
        "À l’angle 0, le point du cercle est (1;0). Son ordonnée, donc son sinus, vaut 0.",
      prompt: "Quand le point tourne, cette ordonnée oscille entre −1 et 1.",
    },
    method: {
      title: "Amplitude et période",
      situation:
        "Une sinusoïde modélise une évolution périodique. L’amplitude mesure l’écart maximal à la valeur moyenne ; la période mesure la durée d’un cycle.",
      prompt: "Pour sin(x), l’amplitude vaut 1 et la période 2π.",
    },
    application: question(
      "Une machine cyclique",
      "Une vibration se reproduit exactement toutes les 4 secondes.",
      "Quelle est sa période ?",
      ["2 s", "4 s", "8 s"],
      1,
      "La période est la durée avant répétition identique.",
      "Exact : un cycle dure 4 secondes.",
      "Repère l’intervalle entre deux états identiques du phénomène.",
    ),
    conjecturePrompt: "Comment repères-tu la période et l’amplitude d’un phénomène périodique ?",
    trace: {
      fallbackConjecture:
        "Je mesure la durée entre deux répétitions pour la période et l’écart maximal à la moyenne pour l’amplitude.",
      rule:
        "Une fonction sinusoïdale décrit un phénomène périodique par sa valeur moyenne, son amplitude et sa période.",
      formulas: ["sin(0)=0", "sin(x+2π)=sin(x)", "période = durée d’un cycle"],
      note: "La fréquence est l’inverse de la période lorsque les unités sont compatibles.",
      examples: [
        { label: "Valeur", formula: "sin(0)=0", explanation: "Départ du cycle." },
        { label: "Période", formula: "2π", explanation: "Fonction sinus." },
        { label: "Machine", formula: "T=4 s", explanation: "Répétition." },
      ],
    },
  },
  {
    chapterId: "statistiques-deux-variables-terminale",
    title: "Quel modèle pour prévoir ?",
    mission: "Comparer plusieurs ajustements et retenir celui qui respecte la forme des données.",
    diagnostic: question(
      "Une croissance qui accélère",
      "Un nuage monte de plus en plus vite et présente une courbure nette.",
      "Quel modèle semble le plus plausible ?",
      ["Affine", "Exponentiel", "Constant"],
      1,
      "Une droite ajoute des écarts réguliers ; une exponentielle traduit des rapports réguliers.",
      "Exact : la courbure croissante suggère un modèle exponentiel.",
      "Une droite ne suit pas bien une accélération de plus en plus marquée.",
    ),
    challenge: question(
      "Comparer les écarts",
      "Deux modèles sont testés sur les données observées.",
      "Quel critère graphique favorise un modèle ?",
      ["Des points proches de la courbe", "La formule la plus longue", "La plus grande valeur prévue"],
      0,
      "Observe les écarts verticaux entre points et modèle.",
      "Oui : des résidus petits indiquent un meilleur ajustement sur la zone observée.",
      "Un modèle est jugé sur sa proximité avec les données et sa cohérence.",
    ),
    scaffold: {
      title: "Regarder la forme globale",
      situation:
        "Un modèle affine produit une droite. Si le nuage est nettement courbe, les écarts auront une organisation visible.",
      prompt: "Une évolution multiplicative peut être mieux décrite par une exponentielle.",
    },
    method: {
      title: "Forme, résidus, domaine",
      situation:
        "On compare la forme du nuage, les écarts au modèle et le domaine où les données ont été observées.",
      prompt: "La qualité d’un ajustement ne rend pas toute extrapolation fiable.",
    },
    application: question(
      "Des rapports presque constants",
      "Une grandeur prend successivement les valeurs 10 ; 15 ; 22,5 ; 33,75.",
      "Quel modèle convient naturellement ?",
      ["Affine", "Exponentiel", "Périodique"],
      1,
      "Chaque valeur est multipliée par 1,5.",
      "Exact : un rapport constant caractérise ici l’évolution exponentielle.",
      "Les différences ne sont pas constantes, mais les rapports le sont.",
    ),
    conjecturePrompt: "Quels éléments compares-tu avant de choisir un modèle d’ajustement ?",
    trace: {
      fallbackConjecture:
        "Je compare la forme, les écarts au modèle et la régularité des différences ou des rapports.",
      rule:
        "Le modèle doit respecter la forme des données et présenter des écarts faibles et non structurés sur le domaine observé.",
      formulas: ["différences constantes → affine", "rapports constants → exponentiel"],
      note: "Une prévision hors du domaine des données est une extrapolation à interpréter avec prudence.",
      examples: [
        { label: "Courbure", formula: "croissance accélérée", explanation: "Piste exponentielle." },
        { label: "Résidus", formula: "écarts petits", explanation: "Ajustement plausible." },
        { label: "Rapport", formula: "×1,5", explanation: "Modèle exponentiel." },
      ],
    },
  },
  {
    chapterId: "arbres-ponderes",
    title: "Suivre les branches du hasard",
    mission: "Construire un arbre pondéré et calculer la probabilité d’un chemin ou d’un événement.",
    diagnostic: question(
      "Une branche complète",
      "P(A)=0,6 et P(B|A)=0,2.",
      "Quelle est P(A∩B) ?",
      ["0,12", "0,20", "0,80"],
      0,
      "Multiplie les probabilités rencontrées sur le chemin.",
      "Exact : 0,6 × 0,2 = 0,12.",
      "Un chemin d’arbre correspond à une intersection et ses poids se multiplient.",
    ),
    challenge: question(
      "Réunir deux chemins",
      "P(A)=0,6, P(B|A)=0,2 et P(B|non A)=0,5.",
      "Quelle est P(B) ?",
      ["0,20", "0,32", "0,70"],
      1,
      "Additionne les chemins A∩B et non A∩B.",
      "Oui : 0,6×0,2 + 0,4×0,5 = 0,32.",
      "Calcule chaque chemin menant à B puis additionne-les.",
    ),
    scaffold: {
      title: "Multiplier le long d’un chemin",
      situation:
        "Pour réaliser A puis B, les deux conditions doivent se produire. On suit la branche et on multiplie ses poids.",
      prompt: "0,6 × 0,2 = 0,12.",
    },
    method: {
      title: "Multiplier puis additionner",
      situation:
        "Les probabilités d’un même chemin se multiplient. Les chemins incompatibles qui mènent au même événement s’additionnent.",
      prompt: "À chaque nœud, les branches issues du nœud ont une somme égale à 1.",
    },
    application: question(
      "Tester l’indépendance",
      "P(B)=0,3 et P(B|A)=0,3.",
      "Que suggère cette égalité ?",
      ["A et B sont indépendants", "A implique B", "B est impossible"],
      0,
      "La condition A ne change pas la probabilité de B.",
      "Exact : c’est le critère d’indépendance.",
      "Si savoir A ne modifie pas P(B), les événements sont indépendants.",
    ),
    conjecturePrompt: "Quelles opérations utilises-tu sur un chemin et entre plusieurs chemins ?",
    trace: {
      fallbackConjecture:
        "Je multiplie le long d’un chemin et j’additionne les chemins incompatibles qui réalisent le même événement.",
      rule:
        "Un arbre pondéré organise des probabilités conditionnelles : produit sur une branche, somme entre chemins.",
      formulas: ["P(A∩B)=P(A)×P(B|A)", "P(B)=Σ probabilités des chemins vers B"],
      note: "Indépendance : P(B|A)=P(B), lorsque P(A)>0.",
      examples: [
        { label: "Chemin", formula: "0,6×0,2=0,12", explanation: "Intersection." },
        { label: "Total", formula: "0,12+0,20=0,32", explanation: "Deux chemins." },
        { label: "Indépendance", formula: "P(B|A)=P(B)", explanation: "Condition sans effet." },
      ],
    },
  },
  {
    chapterId: "polynomes-degre-trois",
    title: "Quand la courbe change deux fois de sens",
    mission: "Étudier une fonction de degré 3 avec ses racines et sa dérivée.",
    diagnostic: question(
      "La fonction cube",
      "On considère f(x)=x³.",
      "Que vaut f(−2) ?",
      ["−8", "−6", "8"],
      0,
      "Multiplie −2 par lui-même trois fois.",
      "Exact : (−2)³ = −8.",
      "Une puissance impaire conserve le signe du nombre.",
    ),
    challenge: question(
      "Dérivée de la fonction cube",
      "Pour f(x)=x³, on a f′(x)=3x².",
      "Comment varie f sur ℝ ?",
      ["Elle décroît", "Elle croît", "Elle est constante"],
      1,
      "3x² est toujours positif ou nul.",
      "Oui : la fonction cube est croissante sur ℝ.",
      "Le signe de la dérivée détermine les variations.",
    ),
    scaffold: {
      title: "Puissance impaire",
      situation:
        "Avec trois facteurs négatifs, le produit est négatif : (−2)×(−2)×(−2)=−8.",
      prompt: "La courbe de x³ passe par l’origine et conserve le signe de x.",
    },
    method: {
      title: "Racines et variations",
      situation:
        "Une forme factorisée révèle les racines. La dérivée, de degré 2, permet d’étudier les variations et les extremums locaux.",
      prompt: "On combine tableau de signe de f′ et valeurs de f aux points critiques.",
    },
    application: question(
      "Lire une forme factorisée",
      "f(x)=x(x−1)(x+2).",
      "Quelles sont les racines ?",
      ["−2, 0 et 1", "−1, 0 et 2", "0 et 1 seulement"],
      0,
      "Annule chaque facteur séparément.",
      "Exact : x=0, x=1 ou x=−2.",
      "Le produit est nul dès qu’un de ses trois facteurs est nul.",
    ),
    conjecturePrompt: "Comment combines-tu forme factorisée et dérivée pour étudier un degré 3 ?",
    trace: {
      fallbackConjecture:
        "J’utilise les facteurs pour trouver les racines et la dérivée pour déterminer les variations et extremums.",
      rule:
        "L’étude d’un polynôme de degré 3 combine valeurs, racines, signe de la dérivée et variations.",
      formulas: ["(−2)³=−8", "(x³)′=3x²", "x(x−1)(x+2)=0"],
      note: "Une dérivée nulle n’entraîne pas toujours un changement de variation.",
      examples: [
        { label: "Cube", formula: "f(−2)=−8", explanation: "Puissance impaire." },
        { label: "Variation", formula: "3x²≥0", explanation: "Fonction croissante." },
        { label: "Racines", formula: "−2 ; 0 ; 1", explanation: "Trois facteurs." },
      ],
    },
  },
  {
    chapterId: "expo-log",
    title: "Atteindre un seuil invisible",
    mission: "Relier exponentielle et logarithme pour prévoir une croissance ou une décroissance.",
    diagnostic: question(
      "Puissances de dix",
      "10³ vaut 1 000.",
      "Que vaut log(1 000) ?",
      ["3", "10", "100"],
      0,
      "Le logarithme décimal donne l’exposant de 10.",
      "Exact : log(1000)=3.",
      "Cherche l’exposant auquel il faut élever 10 pour obtenir 1 000.",
    ),
    challenge: question(
      "Premier dépassement",
      "Une quantité double à chaque étape en partant de 1.",
      "Quel est le premier entier n tel que 2ⁿ>100 ?",
      ["6", "7", "8"],
      1,
      "2⁶=64 et 2⁷=128.",
      "Oui : le premier dépassement a lieu pour n=7.",
      "Encadre le seuil entre deux puissances successives.",
    ),
    scaffold: {
      title: "Le logarithme répond à « quel exposant ? »",
      situation:
        "10³=1 000 et log(1 000)=3 sont deux écritures inverses d’une même information.",
      prompt: "Le logarithme transforme une recherche d’exposant en nombre.",
    },
    method: {
      title: "Croissance, seuil, inverse",
      situation:
        "Une exponentielle modélise une évolution multiplicative continue ou répétée. Le logarithme aide à résoudre les équations où l’inconnue est dans l’exposant.",
      prompt: "Pour un seuil discret, on vérifie toujours le premier rang entier qui convient.",
    },
    application: question(
      "Une décroissance",
      "Une quantité est multipliée par 0,8 à chaque étape.",
      "Quel type d’évolution obtient-on ?",
      ["Croissante", "Décroissante", "Constante"],
      1,
      "Le coefficient est positif mais inférieur à 1.",
      "Exact : la quantité diminue à chaque étape.",
      "Multiplier par un nombre entre 0 et 1 réduit la valeur.",
    ),
    conjecturePrompt: "Comment relies-tu puissance, logarithme et recherche de seuil ?",
    trace: {
      fallbackConjecture:
        "Le logarithme donne l’exposant d’une puissance de 10 ; pour un seuil discret, j’encadre puis je vérifie le premier rang.",
      rule:
        "Exponentielle et logarithme sont des outils inverses pour modéliser une évolution multiplicative et résoudre des seuils.",
      formulas: ["10ˣ=y ↔ log(y)=x", "2⁶=64 < 100 < 128=2⁷"],
      note: "Un coefficient supérieur à 1 produit une croissance ; entre 0 et 1, une décroissance.",
      examples: [
        { label: "Logarithme", formula: "log(1000)=3", explanation: "Car 10³=1000." },
        { label: "Seuil", formula: "n=7", explanation: "Premier 2ⁿ>100." },
        { label: "Décroissance", formula: "×0,8", explanation: "Coefficient inférieur à 1." },
      ],
    },
  },
  {
    chapterId: "maths-financieres-terminale",
    title: "Comparer l’argent dans le temps",
    mission: "Calculer des intérêts composés et mesurer le coût réel d’un crédit.",
    diagnostic: question(
      "Des intérêts composés",
      "1 000 € sont placés à 2 % par an pendant 2 ans.",
      "Quel capital obtient-on avec capitalisation annuelle ?",
      ["1 040 €", "1 040,40 €", "1 200 €"],
      1,
      "Multiplie deux fois par 1,02.",
      "Exact : 1 000×1,02² = 1 040,40 €.",
      "La deuxième année produit aussi des intérêts sur les intérêts de la première.",
    ),
    challenge: question(
      "Le coût total d’un crédit",
      "Un emprunt de 10 000 € est remboursé par 48 mensualités de 235 €.",
      "Quel est le coût du crédit, hors frais supplémentaires ?",
      ["1 280 €", "11 280 €", "235 €"],
      0,
      "Calcule le total remboursé puis retire le capital emprunté.",
      "Oui : 48×235−10 000 = 1 280 €.",
      "Le total remboursé n’est pas le coût : il faut retirer la somme reçue.",
    ),
    scaffold: {
      title: "Capitaliser les intérêts",
      situation:
        "Après un an : 1 000×1,02=1 020. La deuxième année part de 1 020, donc 1 020×1,02=1 040,40.",
      prompt: "Les intérêts sont intégrés au nouveau capital.",
    },
    method: {
      title: "Composer et comparer",
      situation:
        "Un placement composé suit Cₙ=C₀(1+t)ⁿ. Le coût d’un crédit est le total remboursé moins le capital emprunté.",
      prompt: "Pour comparer des offres, on harmonise durée, taux et frais.",
    },
    application: question(
      "Un taux moyen",
      "Un capital double en 10 ans.",
      "Le taux annuel moyen est-il simplement 10 % ?",
      ["Oui", "Non, il faut résoudre (1+t)¹⁰=2", "Impossible avec une formule"],
      1,
      "Une croissance composée ne s’additionne pas année après année.",
      "Exact : le taux moyen est un taux composé.",
      "Le doublement se modélise par une puissance, pas par 10×10 %.",
    ),
    conjecturePrompt: "Comment calcules-tu et compares-tu un placement composé ou un crédit ?",
    trace: {
      fallbackConjecture:
        "Je compose les coefficients pour un placement et je compare total remboursé et capital emprunté pour un crédit.",
      rule:
        "Les intérêts composés s’appliquent au capital accumulé ; le coût du crédit mesure ce qui est payé au-delà du capital reçu.",
      formulas: ["Cₙ=C₀(1+t)ⁿ", "coût crédit = mensualités×nombre − capital"],
      note: "Un taux moyen composé se détermine avec une puissance.",
      examples: [
        { label: "Placement", formula: "1000×1,02²=1040,40 €", explanation: "Capitalisation." },
        { label: "Crédit", formula: "48×235−10000=1280 €", explanation: "Coût." },
        { label: "Taux moyen", formula: "(1+t)¹⁰=2", explanation: "Doublement." },
      ],
    },
  },
  {
    chapterId: "vecteurs-espace",
    title: "Se déplacer en trois dimensions",
    mission: "Calculer coordonnées, norme et colinéarité de vecteurs dans l’espace.",
    diagnostic: question(
      "Un déplacement 3D",
      "A(1;2;3) et B(4;0;5).",
      "Quelles sont les coordonnées de AB ?",
      ["(3;−2;2)", "(5;2;8)", "(−3;2;−2)"],
      0,
      "Soustrais B−A coordonnée par coordonnée.",
      "Exact : (4−1 ; 0−2 ; 5−3) = (3;−2;2).",
      "Le vecteur va du départ A vers l’arrivée B.",
    ),
    challenge: question(
      "Longueur dans l’espace",
      "Le vecteur u a pour coordonnées (3;−2;2).",
      "Quelle est la norme du vecteur (3;−2;2) ?",
      ["√9", "√17", "7"],
      1,
      "Calcule √(3²+(−2)²+2²).",
      "Oui : √(9+4+4)=√17.",
      "En 3D, la norme additionne les carrés des trois coordonnées.",
    ),
    scaffold: {
      title: "Trois différences",
      situation:
        "On calcule séparément le déplacement selon x, y et z : +3, −2 et +2.",
      prompt: "On obtient AB=(3;−2;2).",
    },
    method: {
      title: "Même logique, une coordonnée de plus",
      situation:
        "Les règles du plan restent valables avec trois coordonnées : différence, somme, multiplication par un réel et proportionnalité.",
      prompt: "La norme vaut √(x²+y²+z²).",
    },
    application: question(
      "Reconnaître la colinéarité",
      "u=(1;−2;3) et v=(−2;4;−6).",
      "Sont-ils colinéaires ?",
      ["Oui, v=−2u", "Non", "Seulement dans le plan"],
      0,
      "Cherche le même coefficient sur les trois coordonnées.",
      "Exact : chaque coordonnée de u est multipliée par −2.",
      "La proportionnalité doit utiliser un coefficient commun aux trois coordonnées.",
    ),
    conjecturePrompt: "Comment calcules-tu un vecteur, sa norme et sa colinéarité dans l’espace ?",
    trace: {
      fallbackConjecture:
        "Je calcule arrivée moins départ sur trois coordonnées, j’utilise la racine de la somme des carrés pour la norme et un coefficient commun pour la colinéarité.",
      rule:
        "Un vecteur de l’espace se traite comme un vecteur du plan avec une troisième coordonnée.",
      formulas: ["AB=(xB−xA ; yB−yA ; zB−zA)", "‖u‖=√(x²+y²+z²)", "v=ku"],
      note: "Un coefficient négatif inverse le sens du vecteur.",
      examples: [
        { label: "Coordonnées", formula: "AB=(3;−2;2)", explanation: "B−A." },
        { label: "Norme", formula: "√17", explanation: "Longueur 3D." },
        { label: "Colinéarité", formula: "v=−2u", explanation: "Directions parallèles." },
      ],
    },
  },
];

export const genericJourneys = genericSeeds.map(makeJourney);

export const allJourneys: LearningJourney[] = [
  ...genericJourneys,
  geometricJourney,
];

export const journeyRegistry = Object.fromEntries(
  allJourneys.map((journey) => [journey.chapterId, journey]),
) as Record<string, LearningJourney>;

export function createJourneyStepMap(
  journey: LearningJourney,
): Record<string, JourneyStep> {
  return Object.fromEntries(
    journey.steps.map((step) => [step.id, step]),
  ) as Record<string, JourneyStep>;
}
