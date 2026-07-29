export type InteractionType =
  | "single-choice"
  | "multiple-choice"
  | "numeric"
  | "matching"
  | "ordering"
  | "graph-selection"
  | "parameter"
  | "short-answer"
  | "information"
  | "conjecture";

export type Route = {
  next: string;
  feedback: string;
  tone: "success" | "help" | "challenge" | "neutral";
  pathTag?: string;
  misconception?: string;
};

export type JourneyStep = {
  id: string;
  stage: number;
  eyebrow: string;
  title: string;
  situation: string;
  prompt?: string;
  type: InteractionType;
  options?: Array<{ id: string; label: string }>;
  matches?: Array<{ id: string; label: string; choices: string[] }>;
  min?: number;
  max?: number;
  defaultValue?: number;
  unit?: string;
  expected?: string | number | Record<string, string>;
  classify?: "forecast" | "threshold" | "parameter" | "matching" | "conjecture";
  routes: Record<string, Route>;
  hints?: string[];
  convergence?: string;
  visual?: "diffusion" | "comparison" | "growth" | "transfer" | "trace";
  teacher: {
    intention: string;
    watchFor: string;
    dashboardKey: string;
  };
};

export const geometricJourney = {
  id: "suites-geometriques",
  title: "La propagation invisible",
  subtitle: "Découverte des suites géométriques",
  duration: "20 à 30 min",
  mission:
    "Conseiller une équipe média, puis une biologiste, pour prévoir des évolutions qui se répètent.",
  startStepId: "video-forecast",
  totalStages: 8,
  steps: [
    {
      id: "video-forecast",
      stage: 1,
      eyebrow: "Mission 1 · La vidéo qui s’emballe",
      title: "120 vues… et ensuite ?",
      situation:
        "Une vidéo reçoit 120 vues pendant sa première heure. L’équipe observe ensuite une hausse de 50 % à chaque heure.",
      prompt:
        "Après deux nouvelles heures, combien de vues horaires peut-on prévoir ?",
      type: "numeric",
      expected: 270,
      classify: "forecast",
      unit: "vues",
      hints: [
        "Commence par calculer 50 % de 120.",
        "Une hausse de 50 %, c’est conserver 100 % puis ajouter 50 %.",
      ],
      routes: {
        correct: {
          next: "threshold-challenge",
          feedback:
            "Ton intuition suit bien l’évolution : 120 × 1,5 = 180, puis 180 × 1,5 = 270.",
          tone: "challenge",
          pathTag: "intuition-proportionnelle",
        },
        additive: {
          next: "addition-help",
          feedback:
            "300 correspond à deux ajouts de 90. Mais 50 % se recalcule sur une nouvelle base à chaque heure.",
          tone: "help",
          pathTag: "aide-augmentation-fixe",
          misconception: "Confond évolution additive et évolution proportionnelle.",
        },
        partial: {
          next: "visual-help",
          feedback:
            "Tu as trouvé la première hausse. Regardons comment la seconde se construit sur 180, et non sur 120.",
          tone: "help",
          pathTag: "aide-representation",
          misconception: "Ne répète pas le coefficient sur la nouvelle valeur.",
        },
        other: {
          next: "example-help",
          feedback:
            "Ton résultat nous donne un point de départ utile. Décomposons une heure avant de poursuivre.",
          tone: "help",
          pathTag: "exemple-intermediaire",
          misconception: "Calcul de pourcentage ou choix de la base.",
        },
      },
      visual: "diffusion",
      teacher: {
        intention: "Faire émerger la multiplication répétée par 1,5.",
        watchFor: "L’élève ajoute deux fois la même quantité.",
        dashboardKey: "prevision-video",
      },
    },
    {
      id: "addition-help",
      stage: 2,
      eyebrow: "Un détour utile",
      title: "Même hausse ou même pourcentage ?",
      situation:
        "Ajouter toujours 60 donnerait 120, 180, 240. Augmenter toujours de 50 % donne 120, 180, 270 : la hausse elle-même grandit.",
      prompt: "Observe les deux évolutions, puis rejoins le point commun.",
      type: "information",
      routes: {
        continue: {
          next: "common-pattern",
          feedback: "Tu as distingué augmentation fixe et augmentation proportionnelle.",
          tone: "success",
        },
      },
      convergence: "Tous les chemins rejoignent l’étape 3.",
      visual: "comparison",
      teacher: {
        intention: "Dissocier addition constante et taux constant.",
        watchFor: "L’élève verbalise la nouvelle base de calcul.",
        dashboardKey: "aide-addition",
      },
    },
    {
      id: "visual-help",
      stage: 2,
      eyebrow: "Changer de représentation",
      title: "La nouvelle base",
      situation:
        "La première hausse transforme 120 en 180. La seconde hausse vaut 50 % de 180, soit 90. On obtient donc 270.",
      prompt: "Suis les blocs : chaque valeur entière devient la base suivante.",
      type: "information",
      routes: {
        continue: {
          next: "common-pattern",
          feedback: "La nouvelle base est bien la valeur obtenue juste avant.",
          tone: "success",
        },
      },
      convergence: "Tous les chemins rejoignent l’étape 3.",
      visual: "diffusion",
      teacher: {
        intention: "Faire voir la composition successive des hausses.",
        watchFor: "L’élève recalcule le pourcentage sur 120.",
        dashboardKey: "aide-visuelle",
      },
    },
    {
      id: "example-help",
      stage: 2,
      eyebrow: "Un exemple intermédiaire",
      title: "Un seul pas à la fois",
      situation:
        "Pour augmenter 120 de 50 %, on peut faire 120 + 60 = 180 ou directement 120 × 1,5 = 180. On recommence ensuite sur 180.",
      prompt: "Le raccourci × 1,5 sera notre outil pour la suite.",
      type: "information",
      routes: {
        continue: {
          next: "common-pattern",
          feedback: "Tu disposes maintenant d’un calcul répétable.",
          tone: "success",
        },
      },
      convergence: "Tous les chemins rejoignent l’étape 3.",
      visual: "comparison",
      teacher: {
        intention: "Réactiver le coefficient multiplicateur.",
        watchFor: "Difficulté technique sur 50 %.",
        dashboardKey: "aide-exemple",
      },
    },
    {
      id: "threshold-challenge",
      stage: 2,
      eyebrow: "Aller un peu plus loin",
      title: "Quand le millier sera-t-il dépassé ?",
      situation:
        "L’équipe veut anticiper le premier nombre d’heures après lequel les vues horaires dépasseront 1 000.",
      prompt: "À partir de 120, combien de multiplications successives par 1,5 faut-il ?",
      type: "single-choice",
      options: [
        { id: "4", label: "4 heures" },
        { id: "5", label: "5 heures" },
        { id: "6", label: "6 heures" },
      ],
      expected: "6",
      classify: "threshold",
      hints: ["Tu peux prolonger : 270, 405, 607,5…"],
      routes: {
        correct: {
          next: "common-pattern",
          feedback:
            "Oui : après 5 multiplications on obtient 911,25, puis 1 366,875 après la sixième.",
          tone: "challenge",
          pathTag: "defi-seuil",
        },
        other: {
          next: "common-pattern",
          feedback:
            "Le seuil est dépassé à la sixième multiplication. L’important est d’avoir prolongé la même règle.",
          tone: "neutral",
          misconception: "Repérage du premier rang dépassant un seuil.",
        },
      },
      convergence: "Tous les chemins rejoignent l’étape 3.",
      visual: "growth",
      teacher: {
        intention: "Tester un raisonnement de seuil sans pénaliser.",
        watchFor: "Confusion entre rang et nombre de multiplications.",
        dashboardKey: "defi-seuil",
      },
    },
    {
      id: "common-pattern",
      stage: 3,
      eyebrow: "Point de passage commun",
      title: "Décoder la règle cachée",
      situation:
        "Les quatre premières valeurs sont 120 ; 180 ; 270 ; 405. Le même geste relie chaque valeur à la suivante.",
      prompt: "Associe chaque évolution à son coefficient multiplicateur.",
      type: "matching",
      matches: [
        {
          id: "up50",
          label: "Augmenter de 50 %",
          choices: ["× 0,5", "× 1,5", "× 50"],
        },
        {
          id: "down20",
          label: "Diminuer de 20 %",
          choices: ["× 0,2", "× 0,8", "× 1,2"],
        },
        {
          id: "double",
          label: "Doubler",
          choices: ["× 0,5", "× 2", "+ 2"],
        },
      ],
      expected: { up50: "× 1,5", down20: "× 0,8", double: "× 2" },
      classify: "matching",
      hints: [
        "Le coefficient conserve les 100 % de départ, puis traduit la hausse ou la baisse.",
      ],
      routes: {
        correct: {
          next: "bacteria-parameter",
          feedback:
            "Exact : une évolution en pourcentage devient une multiplication répétable.",
          tone: "success",
        },
        other: {
          next: "bacteria-parameter",
          feedback:
            "Repère utile : +t % correspond à ×(1 + t/100), et −t % à ×(1 − t/100).",
          tone: "help",
          misconception: "Conversion taux ↔ coefficient multiplicateur.",
        },
      },
      visual: "transfer",
      teacher: {
        intention: "Institutionnaliser le coefficient multiplicateur sans donner le cours complet.",
        watchFor: "Confusion entre taux et coefficient.",
        dashboardKey: "coefficient",
      },
    },
    {
      id: "bacteria-parameter",
      stage: 4,
      eyebrow: "Mission 2 · Du réseau au laboratoire",
      title: "Une culture bactérienne à surveiller",
      situation:
        "Une culture contient 800 bactéries. Toutes les 20 minutes, sa population augmente de 25 %. La biologiste doit intervenir dès que 1 800 sont dépassées.",
      prompt:
        "Déplace le curseur jusqu’au premier cycle où la population dépasse 1 800.",
      type: "parameter",
      min: 0,
      max: 7,
      defaultValue: 2,
      expected: 4,
      classify: "parameter",
      unit: "cycles",
      hints: [
        "Une hausse de 25 % correspond à une multiplication par 1,25.",
        "Cherche le premier cycle au-dessus de 1 800, pas simplement un cycle qui dépasse.",
      ],
      routes: {
        correct: {
          next: "bio-challenge",
          feedback:
            "Bien vu : 1 562,5 au cycle 3, puis environ 1 953 au cycle 4. C’est le premier dépassement.",
          tone: "challenge",
          pathTag: "transfert-reussi",
        },
        under: {
          next: "bio-recount",
          feedback:
            "Tu es encore sous le seuil. Observons comment chaque valeur se construit avant d’essayer un autre contexte.",
          tone: "help",
          pathTag: "aide-iteration",
          misconception: "Arrêt trop précoce dans une recherche de seuil.",
        },
        over: {
          next: "bio-visual",
          feedback:
            "Le seuil est bien dépassé, mais il l’était déjà avant. Cherchons le tout premier cycle.",
          tone: "help",
          pathTag: "aide-premier-seuil",
          misconception: "Ne retient pas le premier rang de dépassement.",
        },
      },
      visual: "growth",
      teacher: {
        intention: "Transférer la règle dans un contexte scientifique.",
        watchFor: "Premier dépassement et utilisation du coefficient 1,25.",
        dashboardKey: "seuil-bacteries",
      },
    },
    {
      id: "bio-recount",
      stage: 5,
      eyebrow: "Reprendre le fil",
      title: "Compter les cycles",
      situation:
        "Cycle 0 : 800. Cycle 1 : 1 000. Cycle 2 : 1 250. Cycle 3 : 1 562,5. Cycle 4 : 1 953,125.",
      prompt: "Le seuil de 1 800 est franchi pour la première fois au cycle 4.",
      type: "information",
      routes: {
        continue: {
          next: "transfer-contexts",
          feedback: "Tu as repéré le premier dépassement.",
          tone: "success",
        },
      },
      convergence: "Tous les chemins rejoignent l’étape 6.",
      visual: "growth",
      teacher: {
        intention: "Rendre explicite le rang initial 0.",
        watchFor: "Décalage d’un rang.",
        dashboardKey: "aide-iteration",
      },
    },
    {
      id: "bio-visual",
      stage: 5,
      eyebrow: "Zoom sur le seuil",
      title: "Le premier, pas n’importe lequel",
      situation:
        "Au cycle 5, la population dépasse bien 1 800. Mais le cycle 4 est déjà au-dessus, alors que le cycle 3 est encore en dessous.",
      prompt: "Le duo « juste avant / juste après » confirme le premier dépassement.",
      type: "information",
      routes: {
        continue: {
          next: "transfer-contexts",
          feedback: "Tu sais maintenant encadrer un seuil entre deux rangs consécutifs.",
          tone: "success",
        },
      },
      convergence: "Tous les chemins rejoignent l’étape 6.",
      visual: "growth",
      teacher: {
        intention: "Valider un seuil par encadrement.",
        watchFor: "L’élève s’arrête au premier essai supérieur.",
        dashboardKey: "aide-premier-seuil",
      },
    },
    {
      id: "bio-challenge",
      stage: 5,
      eyebrow: "Transfert express",
      title: "Et quand la quantité diminue ?",
      situation:
        "Un matériau perd 20 % de sa valeur chaque année. Sa valeur actuelle est de 1 000 €.",
      prompt: "Quelle valeur peut-on prévoir après deux ans ?",
      type: "single-choice",
      options: [
        { id: "600", label: "600 €" },
        { id: "640", label: "640 €" },
        { id: "800", label: "800 €" },
      ],
      expected: "640",
      classify: "threshold",
      hints: ["Perdre 20 %, c’est conserver 80 %, donc multiplier par 0,8."],
      routes: {
        correct: {
          next: "transfer-contexts",
          feedback: "Exact : 1 000 × 0,8 × 0,8 = 640.",
          tone: "challenge",
          pathTag: "defi-decroissance",
        },
        other: {
          next: "transfer-contexts",
          feedback:
            "La baisse se compose elle aussi : 1 000 × 0,8 = 800, puis 800 × 0,8 = 640.",
          tone: "help",
          misconception: "Soustrait deux fois le même montant.",
        },
      },
      convergence: "Tous les chemins rejoignent l’étape 6.",
      visual: "comparison",
      teacher: {
        intention: "Étendre le modèle aux suites décroissantes.",
        watchFor: "Soustraction de deux fois 200.",
        dashboardKey: "defi-decroissance",
      },
    },
    {
      id: "transfer-contexts",
      stage: 6,
      eyebrow: "Prendre de la hauteur",
      title: "Un même modèle, plusieurs mondes",
      situation:
        "Diffusion d’un message, culture bactérienne, dépréciation d’un matériau ou placement : les contextes changent, mais une même structure peut apparaître.",
      prompt: "Choisis la phrase qui décrit le mieux cette structure.",
      type: "single-choice",
      options: [
        {
          id: "fixed-add",
          label: "On ajoute toujours le même nombre au terme précédent.",
        },
        {
          id: "fixed-factor",
          label: "On multiplie toujours le terme précédent par le même nombre.",
        },
        {
          id: "random",
          label: "On choisit à chaque fois une opération différente.",
        },
      ],
      expected: "fixed-factor",
      classify: "threshold",
      hints: ["Observe les coefficients 1,5 ; 1,25 et 0,8."],
      routes: {
        correct: {
          next: "personal-conjecture",
          feedback:
            "C’est la structure recherchée. Tu peux maintenant la formuler avec tes mots.",
          tone: "success",
        },
        other: {
          next: "personal-conjecture",
          feedback:
            "Dans chaque exemple, le nombre change mais le multiplicateur reste constant.",
          tone: "help",
          misconception: "N’identifie pas l’invariant multiplicatif.",
        },
      },
      visual: "transfer",
      teacher: {
        intention: "Décontextualiser avant la conjecture.",
        watchFor: "L’élève décrit le contexte au lieu de la structure.",
        dashboardKey: "decontextualisation",
      },
    },
    {
      id: "personal-conjecture",
      stage: 7,
      eyebrow: "Ta synthèse",
      title: "Formule ta conjecture",
      situation:
        "Tu viens de rencontrer trois évolutions répétées. Écris la règle qui, selon toi, permet de reconnaître une suite géométrique.",
      prompt: "Commence si tu veux par : « Une suite semble géométrique lorsque… »",
      type: "conjecture",
      classify: "conjecture",
      hints: [
        "Utilise les mots « terme précédent » et « même nombre ».",
        "Tu peux aussi nommer ce nombre : le coefficient multiplicateur.",
      ],
      routes: {
        complete: {
          next: "class-handoff",
          feedback:
            "Ta conjecture est enregistrée sur cet appareil. Elle servira de point de départ à la mise en commun.",
          tone: "success",
        },
        short: {
          next: "personal-conjecture",
          feedback:
            "Ton idée commence à apparaître. Ajoute comment on passe d’un terme au suivant.",
          tone: "help",
        },
      },
      teacher: {
        intention: "Faire produire une formulation personnelle avant le cours.",
        watchFor: "Présence de l’invariant multiplicatif.",
        dashboardKey: "conjecture",
      },
    },
    {
      id: "class-handoff",
      stage: 8,
      eyebrow: "Mission accomplie",
      title: "Place à la mise en commun",
      situation:
        "Tu as construit une idée mathématique à partir de situations différentes. La classe va maintenant comparer les conjectures, choisir un vocabulaire commun et formaliser le cours.",
      prompt: "Ta trace de découverte est prête.",
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
        intention: "Préparer une institutionnalisation collective.",
        watchFor: "Faire relier coefficient multiplicateur et raison.",
        dashboardKey: "mise-en-commun",
      },
    },
  ] satisfies JourneyStep[],
};

export const journeyStepMap = Object.fromEntries(
  geometricJourney.steps.map((step) => [step.id, step]),
) as unknown as Record<string, JourneyStep>;
