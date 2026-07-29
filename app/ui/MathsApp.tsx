"use client";

import { useEffect, useMemo, useState } from "react";
import {
  audienceLabels,
  chapters,
  levels,
  type Audience,
  type Chapter,
  type LevelId,
} from "../content/curriculum";
import {
  geometricJourney,
  journeyStepMap,
  type JourneyStep,
  type Route,
} from "../content/geometricJourney";
import { classifyAnswer } from "../engine/journeyEngine";
import {
  createStudentTraceText,
  formatCompletionDate,
  getPathHighlights,
} from "../engine/studentTrace";

type View =
  | { name: "home" }
  | { name: "level"; level: LevelId }
  | { name: "chapter"; chapterId: string }
  | { name: "journey" }
  | { name: "trace" }
  | { name: "teacher" };

type JourneyProgress = {
  currentStepId: string;
  visited: string[];
  completed: boolean;
  completedAt: string | null;
  conjecture: string;
  errors: string[];
  hintsUsed: string[];
  pathTags: string[];
  answers: Record<string, string>;
};

const STORAGE_KEY = "horizon-maths-geometric-v1";

const emptyProgress: JourneyProgress = {
  currentStepId: geometricJourney.startStepId,
  visited: [],
  completed: false,
  completedAt: null,
  conjecture: "",
  errors: [],
  hintsUsed: [],
  pathTags: [],
  answers: {},
};

function cloneEmptyProgress(): JourneyProgress {
  return {
    ...emptyProgress,
    visited: [],
    errors: [],
    hintsUsed: [],
    pathTags: [],
    answers: {},
  };
}

function Icon({
  name,
  size = 20,
}: {
  name:
    | "arrow"
    | "play"
    | "book"
    | "teacher"
    | "clock"
    | "check"
    | "spark"
    | "lock"
    | "route"
    | "home"
    | "light";
  size?: number;
}) {
  const glyphs = {
    arrow: "→",
    play: "▶",
    book: "▤",
    teacher: "◉",
    clock: "◷",
    check: "✓",
    spark: "✦",
    lock: "·",
    route: "⌁",
    home: "⌂",
    light: "◌",
  };
  return (
    <span className="icon" style={{ fontSize: size }} aria-hidden="true">
      {glyphs[name]}
    </span>
  );
}

function AudienceBadge({ audience }: { audience: Audience }) {
  return (
    <span className={`audience-badge audience-${audience}`}>
      <span aria-hidden="true" className="badge-dot" />
      {audienceLabels[audience]}
    </span>
  );
}

function Header({
  view,
  onNavigate,
}: {
  view: View;
  onNavigate: (view: View) => void;
}) {
  const isTeacher = view.name === "teacher";
  return (
    <header className="site-header">
      <button
        type="button"
        className="brand"
        onClick={() => onNavigate({ name: "home" })}
        aria-label="Horizon Maths, retour à l’accueil"
      >
        <span className="brand-mark">∑</span>
        <span>
          <strong>HORIZON</strong>
          <small>MATHS</small>
        </span>
      </button>
      <nav aria-label="Navigation principale" className="desktop-nav">
        {levels.map((level) => (
          <button
            type="button"
            key={level.id}
            className={
              view.name === "level" && view.level === level.id ? "active" : ""
            }
            onClick={() => onNavigate({ name: "level", level: level.id })}
          >
            {level.shortLabel}
          </button>
        ))}
      </nav>
      <button
        type="button"
        className={`teacher-switch ${isTeacher ? "active" : ""}`}
        onClick={() => onNavigate({ name: "teacher" })}
        aria-label="Espace enseignant"
      >
        <Icon name="teacher" />
        <span>Espace enseignant</span>
      </button>
    </header>
  );
}

function HomeView({
  progress,
  onNavigate,
}: {
  progress: JourneyProgress;
  onNavigate: (view: View) => void;
}) {
  return (
    <>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow-line">
              <span>Mathématiques · Voie professionnelle</span>
              <span className="line" />
            </div>
            <h1>
              Comprendre
              <br />
              <em>avant</em> d’apprendre.
            </h1>
            <p>
              Des missions de 20 à 30 minutes pour observer, essayer, se tromper
              utilement et construire sa propre conjecture.
            </p>
            <div className="hero-actions">
              <button
                type="button"
                className="primary-button"
                onClick={() =>
                  onNavigate(
                    progress.completed
                      ? { name: "trace" }
                      : progress.visited.length
                      ? { name: "journey" }
                      : { name: "chapter", chapterId: "suites-geometriques" },
                  )
                }
                data-testid="hero-pilot-button"
              >
                <Icon name={progress.completed ? "book" : "play"} size={16} />
                {progress.completed
                  ? "Retrouver ma trace"
                  : progress.visited.length
                  ? "Reprendre la mission"
                  : "Découvrir le parcours pilote"}
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() =>
                  onNavigate({ name: "level", level: "terminale" })
                }
              >
                Voir les chapitres <Icon name="arrow" />
              </button>
            </div>
            <div className="hero-trust">
              <span>
                <Icon name="clock" /> 20–30 min
              </span>
              <span>
                <Icon name="route" /> Chemin adapté
              </span>
              <span>
                <Icon name="check" /> Sans note
              </span>
            </div>
          </div>
          <div className="hero-visual" aria-label="Aperçu de la mission sur les suites">
            <div className="mission-card">
              <div className="mission-card-head">
                <span className="live-pill">MISSION PILOTE</span>
                <span>Terminale</span>
              </div>
              <h2>La propagation invisible</h2>
              <p>Comment prévoir ce qui grandit de plus en plus vite ?</p>
              <DiffusionVisual compact />
              <div className="mission-bottom">
                <div>
                  <strong>8</strong>
                  <span>étapes</span>
                </div>
                <div>
                  <strong>2</strong>
                  <span>bifurcations</span>
                </div>
                <div>
                  <strong>1</strong>
                  <span>conjecture</span>
                </div>
              </div>
            </div>
            <div className="floating-note note-one">
              <Icon name="light" />
              <span>
                Une erreur ouvre
                <br />
                une piste utile
              </span>
            </div>
            <div className="floating-note note-two">
              <Icon name="spark" />
              <span>Du familier au savant</span>
            </div>
          </div>
        </section>

        <section className="levels-section" aria-labelledby="levels-title">
          <div className="section-heading">
            <div>
              <span className="section-kicker">Choisir son niveau</span>
              <h2 id="levels-title">Trois années, un même horizon</h2>
            </div>
            <p>
              Les contenus communs et les parcours MCV ou TCB sont identifiés au
              premier regard.
            </p>
          </div>
          <div className="level-grid">
            {levels.map((level, index) => {
              const count = chapters.filter(
                (chapter) => chapter.level === level.id,
              ).length;
              return (
                <button
                  type="button"
                  key={level.id}
                  className={`level-card level-${level.color}`}
                  onClick={() =>
                    onNavigate({ name: "level", level: level.id })
                  }
                >
                  <span className="level-number">0{index + 1}</span>
                  <span className="level-card-icon" aria-hidden="true">
                    {index === 0 ? "x" : index === 1 ? "ƒ" : "qⁿ"}
                  </span>
                  <strong>{level.shortLabel}</strong>
                  <span>{level.description}</span>
                  <small>
                    {count} chapitres <Icon name="arrow" />
                  </small>
                </button>
              );
            })}
          </div>
        </section>

        <section className="method-section">
          <div className="method-quote">
            <span>Notre principe</span>
            <blockquote>
              « Une notion se comprend mieux quand on a d’abord eu besoin de
              l’inventer. »
            </blockquote>
          </div>
          <div className="method-steps">
            {[
              ["01", "Une situation intrigante", "Un problème réel fait naître la question."],
              ["02", "Des détours utiles", "Indice, visuel ou défi selon la réponse."],
              ["03", "Une conjecture personnelle", "L’élève formule avant le cours."],
            ].map(([number, title, text]) => (
              <div key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function LevelView({
  levelId,
  progress,
  onNavigate,
}: {
  levelId: LevelId;
  progress: JourneyProgress;
  onNavigate: (view: View) => void;
}) {
  const level = levels.find((item) => item.id === levelId)!;
  const [audience, setAudience] = useState<"tous" | Audience>("tous");
  const levelChapters = chapters.filter(
    (chapter) =>
      chapter.level === levelId &&
      (audience === "tous" || chapter.audience === audience),
  );
  return (
    <main className="inner-page">
      <div className={`level-banner level-${level.color}`}>
        <button
          type="button"
          className="breadcrumb"
          onClick={() => onNavigate({ name: "home" })}
        >
          <Icon name="home" /> Accueil
        </button>
        <div>
          <span>Programme vérifié · voie professionnelle</span>
          <h1>{level.label}</h1>
          <p>{level.description}</p>
        </div>
        <div className="banner-symbol" aria-hidden="true">
          {levelId === "seconde" ? "x" : levelId === "premiere" ? "ƒ" : "qⁿ"}
        </div>
      </div>

      <section className="catalog-section">
        <div className="catalog-toolbar">
          <div>
            <span className="section-kicker">Catalogue</span>
            <h2>{chapters.filter((chapter) => chapter.level === levelId).length} chapitres</h2>
          </div>
          <div className="filter-tabs" role="group" aria-label="Filtrer les chapitres">
            {[
              ["tous", "Tous"],
              ["commun", "Communs"],
              ["mcv", "MCV"],
              ["tcb", "TCB"],
            ].map(([id, label]) => (
              <button
                type="button"
                key={id}
                className={audience === id ? "active" : ""}
                onClick={() => setAudience(id as "tous" | Audience)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="chapter-list">
          {levelChapters.map((chapter, index) => (
            <ChapterRow
              key={chapter.id}
              chapter={chapter}
              index={index}
              progress={progress}
              onOpen={() =>
                onNavigate(
                  chapter.pilot && progress.completed
                    ? { name: "trace" }
                    : { name: "chapter", chapterId: chapter.id },
                )
              }
            />
          ))}
          {!levelChapters.length && (
            <div className="empty-filter">
              Aucun chapitre spécifique à cette filière pour ce niveau.
            </div>
          )}
        </div>
        <div className="program-note">
          <Icon name="book" />
          <p>
            <strong>Organisation conforme au programme en vigueur.</strong>
            Les automatismes, l’algorithmique et le vocabulaire logique sont
            travaillés dans les parcours, pas isolés dans des chapitres artificiels.
          </p>
          <a
            href="https://eduscol.education.gouv.fr/5895/programmes-et-ressources-en-mathematiques-voie-professionnelle"
            target="_blank"
            rel="noreferrer"
          >
            Source Éduscol <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>
    </main>
  );
}

function ChapterRow({
  chapter,
  index,
  progress,
  onOpen,
}: {
  chapter: Chapter;
  index: number;
  progress: JourneyProgress;
  onOpen: () => void;
}) {
  const status = chapter.pilot
    ? progress.completed
      ? "Terminé"
      : progress.visited.length
        ? "En cours"
        : "Non commencé"
    : "Parcours en préparation";
  return (
    <article className={`chapter-row ${chapter.pilot ? "pilot" : ""}`}>
      <span className="chapter-index">{String(index + 1).padStart(2, "0")}</span>
      <div className="chapter-main">
        <div className="chapter-badges">
          <AudienceBadge audience={chapter.audience} />
          {chapter.pilot && <span className="pilot-badge">Parcours disponible</span>}
        </div>
        <h3>{chapter.title}</h3>
        <p>{chapter.summary}</p>
      </div>
      <div className={`status-label ${chapter.pilot ? "available" : ""}`}>
        <span aria-hidden="true" />
        {status}
      </div>
      <button
        type="button"
        className={chapter.pilot ? "row-button available" : "row-button"}
        onClick={onOpen}
        aria-label={`${chapter.pilot ? "Ouvrir" : "Voir la fiche"} : ${chapter.title}`}
      >
        {chapter.pilot ? (
          <>
            {progress.completed
              ? "Voir la trace"
              : progress.visited.length
                ? "Reprendre"
                : "Commencer"}
            <Icon name="arrow" />
          </>
        ) : (
          <>
            Voir la fiche <Icon name="arrow" />
          </>
        )}
      </button>
    </article>
  );
}

function ChapterView({
  chapter,
  progress,
  onNavigate,
  onStart,
}: {
  chapter: Chapter;
  progress: JourneyProgress;
  onNavigate: (view: View) => void;
  onStart: (reset?: boolean) => void;
}) {
  const level = levels.find((item) => item.id === chapter.level)!;
  if (!chapter.pilot) {
    return (
      <main className="inner-page preparation-page">
        <button
          type="button"
          className="breadcrumb"
          onClick={() => onNavigate({ name: "level", level: chapter.level })}
        >
          <Icon name="arrow" /> {level.shortLabel}
        </button>
        <div className="preparation-card">
          <AudienceBadge audience={chapter.audience} />
          <span className="preparation-icon">∿</span>
          <span className="section-kicker">Parcours en préparation</span>
          <h1>{chapter.title}</h1>
          <p>
            Ce chapitre figure bien au catalogue, mais son parcours de découverte
            n’est pas encore publié. Il sera construit avec la même exigence que le
            parcours pilote : situation authentique, détours utiles et conjecture finale.
          </p>
          <button
            type="button"
            className="secondary-button"
            onClick={() => onNavigate({ name: "level", level: chapter.level })}
          >
            Retour aux chapitres
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="inner-page chapter-page">
      <button
        type="button"
        className="breadcrumb"
        onClick={() => onNavigate({ name: "level", level: "terminale" })}
      >
        <Icon name="arrow" /> Terminale
      </button>
      <section className="chapter-hero">
        <div className="chapter-hero-copy">
          <div className="chapter-badges">
            <AudienceBadge audience="commun" />
            <span className="pilot-badge">Parcours pilote</span>
          </div>
          <span className="section-kicker">Chapitre · Suites numériques</span>
          <h1>
            La propagation
            <br />
            <em>invisible</em>
          </h1>
          <p className="chapter-lead">
            De la diffusion d’une vidéo à une culture bactérienne : découvre la
            règle qui permet de prévoir une évolution répétée.
          </p>
          <div className="mission-facts">
            <span>
              <Icon name="clock" /> 20 à 30 minutes
            </span>
            <span>
              <Icon name="route" /> 8 étapes
            </span>
            <span>
              <Icon name="book" /> Une trace finale
            </span>
          </div>
          <div className="chapter-actions">
            {progress.completed ? (
              <>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => onNavigate({ name: "trace" })}
                  data-testid="open-trace-button"
                >
                  <Icon name="book" size={16} />
                  Voir ou télécharger ma trace
                </button>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => onStart(true)}
                >
                  Refaire le parcours
                </button>
              </>
            ) : (
              <button
                type="button"
                className="primary-button"
                onClick={() => onStart(false)}
                data-testid="start-journey-button"
              >
                <Icon name="play" size={16} />
                {progress.visited.length
                  ? "Reprendre le parcours"
                  : "Commencer la mission"}
              </button>
            )}
            {progress.visited.length > 0 && !progress.completed && (
              <button
                type="button"
                className="text-button"
                onClick={() => onStart(true)}
              >
                Recommencer
              </button>
            )}
          </div>
          <p className="privacy-line">
            <Icon name="lock" /> Ta progression reste sur cet appareil. Aucun classement,
            aucune donnée envoyée à une IA.
          </p>
        </div>
        <div className="chapter-map">
          <div className="map-head">
            <span>Itinéraire de découverte</span>
            <small>les détours s’adaptent discrètement</small>
          </div>
          <div className="route-map" aria-label="Aperçu des étapes du parcours">
            {[
              ["01", "Prévoir une diffusion", "Réseaux sociaux"],
              ["02", "Un détour adapté", "Indice ou défi"],
              ["03", "Décoder le coefficient", "Point commun"],
              ["04", "Tester un seuil", "Laboratoire"],
              ["05", "Changer de contexte", "Économie"],
              ["06", "Formuler la règle", "Conjecture"],
            ].map(([number, title, context], index) => (
              <div key={number} className={index === 1 ? "route-adaptive" : ""}>
                <span>{number}</span>
                <p>
                  <strong>{title}</strong>
                  <small>{context}</small>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="chapter-objectives">
        <div>
          <span className="section-kicker">Ta mission</span>
          <h2>Prévoir sans connaître encore la formule</h2>
        </div>
        <div className="objective-grid">
          <p>
            <span>Observer</span>
            Repérer ce qui reste constant entre deux valeurs successives.
          </p>
          <p>
            <span>Expérimenter</span>
            Manipuler un taux et rechercher le premier dépassement d’un seuil.
          </p>
          <p>
            <span>Conjecturer</span>
            Écrire avec tes mots la règle qui semble définir la suite.
          </p>
        </div>
      </section>
    </main>
  );
}

function JourneyView({
  progress,
  setProgress,
  onNavigate,
}: {
  progress: JourneyProgress;
  setProgress: React.Dispatch<React.SetStateAction<JourneyProgress>>;
  onNavigate: (view: View) => void;
}) {
  const step =
    journeyStepMap[progress.currentStepId] ?? journeyStepMap["video-forecast"];
  const [answer, setAnswer] = useState<string | number | Record<string, string>>(
    step.type === "parameter"
      ? (step.defaultValue ?? 0)
      : step.type === "matching"
        ? {}
        : step.type === "conjecture"
          ? progress.conjecture
          : "",
  );
  const [feedback, setFeedback] = useState<Route | null>(null);
  const [hintIndex, setHintIndex] = useState(-1);

  useEffect(() => {
    setAnswer(
      step.type === "parameter"
        ? (step.defaultValue ?? 0)
        : step.type === "matching"
          ? {}
          : step.type === "conjecture"
            ? progress.conjecture
            : "",
    );
    setFeedback(null);
    setHintIndex(-1);
  }, [step.id, step.type, step.defaultValue, progress.conjecture]);

  const canSubmit =
    step.type === "information" ||
    (step.type === "matching"
      ? Object.keys(answer as Record<string, string>).length ===
        (step.matches?.length ?? 0)
      : String(answer).trim().length > 0);

  function submit() {
    if (step.type === "information") {
      setFeedback(step.routes.continue);
      return;
    }
    const result = classifyAnswer(step, answer);
    const route = step.routes[result] ?? step.routes.other;
    setFeedback(route);
    if (result !== "correct" && result !== "complete") {
      if (route?.next !== step.id && route?.misconception) {
        setProgress((current) => ({
          ...current,
          errors: [...current.errors, route.misconception!],
        }));
      }
    }
    if (step.type === "conjecture") {
      setProgress((current) => ({
        ...current,
        conjecture: String(answer).trim(),
      }));
    }
  }

  function continueJourney() {
    if (!feedback) return;
    if (feedback.next === step.id) {
      setFeedback(null);
      return;
    }
    if (feedback.next === "complete") {
      setProgress((current) => ({
        ...current,
        currentStepId: "class-handoff",
        visited: Array.from(new Set([...current.visited, step.id])),
        completed: true,
        completedAt: current.completedAt ?? new Date().toISOString(),
      }));
      onNavigate({ name: "trace" });
      return;
    }
    setProgress((current) => ({
      ...current,
      currentStepId: feedback.next,
      visited: Array.from(new Set([...current.visited, step.id])),
      pathTags: feedback.pathTag
        ? [...current.pathTags, feedback.pathTag]
        : current.pathTags,
      answers: {
        ...current.answers,
        [step.id]:
          typeof answer === "object" ? JSON.stringify(answer) : String(answer),
      },
    }));
  }

  function showHint() {
    const nextIndex = Math.min(hintIndex + 1, (step.hints?.length ?? 1) - 1);
    setHintIndex(nextIndex);
    const hintKey = `${step.id}-${nextIndex}`;
    setProgress((current) => ({
      ...current,
      hintsUsed: current.hintsUsed.includes(hintKey)
        ? current.hintsUsed
        : [...current.hintsUsed, hintKey],
    }));
  }

  const visitedStages = new Set(
    progress.visited.map((id) => journeyStepMap[id]?.stage).filter(Boolean),
  );

  return (
    <main className="journey-shell">
      <header className="journey-header">
        <button
          type="button"
          className="journey-brand"
          onClick={() =>
            onNavigate({ name: "chapter", chapterId: "suites-geometriques" })
          }
        >
          <span>∑</span> HORIZON MATHS
        </button>
        <div className="journey-title">
          <small>Terminale · Suites géométriques</small>
          <strong>La propagation invisible</strong>
        </div>
        <button
          type="button"
          className="save-exit"
          onClick={() =>
            onNavigate({ name: "chapter", chapterId: "suites-geometriques" })
          }
        >
          Enregistrer et quitter
        </button>
      </header>
      <div className="journey-progress" aria-label={`Étape ${step.stage} sur 8`}>
        <span style={{ width: `${(step.stage / 8) * 100}%` }} />
      </div>

      <div className="journey-layout">
        <aside className="journey-sidebar">
          <span className="sidebar-kicker">Ton parcours</span>
          <ol>
            {[
              "La vidéo",
              "Le détour",
              "La règle",
              "Le laboratoire",
              "Le transfert",
              "La synthèse",
              "Ta conjecture",
              "Mise en commun",
            ].map((label, index) => {
              const stage = index + 1;
              const active = step.stage === stage;
              const done = visitedStages.has(stage) || step.stage > stage;
              return (
                <li key={label} className={active ? "active" : done ? "done" : ""}>
                  <span>{done ? "✓" : stage}</span>
                  <p>
                    <small>Étape {stage}</small>
                    {label}
                  </p>
                </li>
              );
            })}
          </ol>
          <div className="sidebar-privacy">
            <Icon name="lock" />
            <span>
              Tes essais restent privés.
              <br />
              Ici, on apprend : on ne classe pas.
            </span>
          </div>
        </aside>

        <section className="step-area">
          <div className="step-topline">
            <span>
              Étape {step.stage} <i>/ 8</i>
            </span>
            <span className="time-estimate">
              <Icon name="clock" /> environ {step.stage < 7 ? "3 min" : "2 min"}
            </span>
          </div>
          <article className="step-card" data-testid={`journey-step-${step.id}`}>
            <span className="step-eyebrow">{step.eyebrow}</span>
            <h1>{step.title}</h1>
            <p className="step-situation">{step.situation}</p>
            {step.visual && (
              <StepVisual
                type={step.visual}
                parameterValue={
                  step.type === "parameter" ? Number(answer) : undefined
                }
                conjecture={progress.conjecture}
              />
            )}
            {step.prompt && <p className="step-prompt">{step.prompt}</p>}
            <Interaction
              step={step}
              answer={answer}
              setAnswer={setAnswer}
              disabled={Boolean(feedback)}
            />
            {hintIndex >= 0 && step.hints?.[hintIndex] && (
              <div className="hint-box" role="status">
                <Icon name="light" />
                <p>
                  <strong>Indice {hintIndex + 1}</strong>
                  {step.hints[hintIndex]}
                </p>
              </div>
            )}
            {feedback ? (
              <div className={`feedback-box feedback-${feedback.tone}`} role="status">
                <span>{feedback.tone === "help" ? "↗" : feedback.tone === "challenge" ? "✦" : "✓"}</span>
                <p>
                  <strong>
                    {feedback.tone === "help"
                      ? "Une piste pour avancer"
                      : feedback.tone === "challenge"
                        ? "Intuition solide"
                        : "À retenir"}
                  </strong>
                  {feedback.feedback}
                </p>
                <button
                  type="button"
                  className="feedback-continue"
                  onClick={continueJourney}
                  data-testid="continue-button"
                >
                  {feedback.next === step.id ? "Compléter ma réponse" : "Continuer"}
                  <Icon name="arrow" />
                </button>
              </div>
            ) : (
              <div className="step-actions">
                {step.hints?.length ? (
                  <button
                    type="button"
                    className="hint-button"
                    onClick={showHint}
                    disabled={hintIndex >= step.hints.length - 1}
                  >
                    <Icon name="light" />
                    {hintIndex < 0 ? "J’ai besoin d’un indice" : "Un autre indice"}
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  className="primary-button"
                  onClick={submit}
                  disabled={!canSubmit}
                  data-testid="validate-answer-button"
                >
                  {step.type === "information" ? "J’ai compris" : "Valider ma réponse"}
                  <Icon name="arrow" />
                </button>
              </div>
            )}
          </article>
          {step.convergence && (
            <p className="convergence-note">
              <Icon name="route" /> {step.convergence}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

function Interaction({
  step,
  answer,
  setAnswer,
  disabled,
}: {
  step: JourneyStep;
  answer: string | number | Record<string, string>;
  setAnswer: (answer: string | number | Record<string, string>) => void;
  disabled: boolean;
}) {
  if (step.type === "information") return null;
  if (step.type === "numeric") {
    return (
      <label className="numeric-input">
        <span>Ta prévision</span>
        <div>
          <input
            type="number"
            value={answer as string}
            onChange={(event) => setAnswer(event.target.value)}
            disabled={disabled}
            inputMode="decimal"
            data-testid="numeric-answer"
          />
          <span>{step.unit}</span>
        </div>
      </label>
    );
  }
  if (step.type === "single-choice") {
    return (
      <div className="choice-grid" role="radiogroup" aria-label={step.prompt}>
        {step.options?.map((option) => (
          <label
            key={option.id}
            className={String(answer) === option.id ? "selected" : ""}
          >
            <input
              type="radio"
              name={step.id}
              value={option.id}
              checked={String(answer) === option.id}
              onChange={() => setAnswer(option.id)}
              disabled={disabled}
            />
            <span>{option.label}</span>
            <i aria-hidden="true" />
          </label>
        ))}
      </div>
    );
  }
  if (step.type === "matching") {
    const values = answer as Record<string, string>;
    return (
      <div className="matching-grid">
        {step.matches?.map((match) => (
          <label key={match.id}>
            <span>{match.label}</span>
            <select
              value={values[match.id] ?? ""}
              onChange={(event) =>
                setAnswer({ ...values, [match.id]: event.target.value })
              }
              disabled={disabled}
              aria-label={`Coefficient pour ${match.label}`}
            >
              <option value="">Choisir…</option>
              {match.choices.map((choice) => (
                <option key={choice} value={choice}>
                  {choice}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    );
  }
  if (step.type === "parameter") {
    const value = Number(answer);
    const population = Math.round(800 * 1.25 ** value);
    return (
      <div className="parameter-control">
        <div className="parameter-readout">
          <span>
            Cycle <strong>{value}</strong>
          </span>
          <span>
            ≈ <strong>{population.toLocaleString("fr-FR")}</strong> bactéries
          </span>
        </div>
        <input
          type="range"
          min={step.min}
          max={step.max}
          value={value}
          onChange={(event) => setAnswer(Number(event.target.value))}
          disabled={disabled}
          aria-label="Nombre de cycles"
          data-testid="parameter-slider"
        />
        <div className="range-labels">
          <span>cycle {step.min}</span>
          <span>cycle {step.max}</span>
        </div>
      </div>
    );
  }
  if (step.type === "conjecture" || step.type === "short-answer") {
    return (
      <label className="conjecture-input">
        <span>Ta formulation</span>
        <textarea
          value={String(answer)}
          onChange={(event) => setAnswer(event.target.value)}
          disabled={disabled}
          rows={4}
          placeholder="Une suite semble géométrique lorsque…"
          data-testid="conjecture-answer"
        />
        <small>{String(answer).trim().length} caractères · une phrase suffit</small>
      </label>
    );
  }
  return null;
}

function StepVisual({
  type,
  parameterValue,
  conjecture,
}: {
  type: NonNullable<JourneyStep["visual"]>;
  parameterValue?: number;
  conjecture?: string;
}) {
  if (type === "diffusion") return <DiffusionVisual />;
  if (type === "comparison") {
    return (
      <div className="comparison-visual" aria-label="Comparaison de deux évolutions">
        <div>
          <span>Ajout fixe</span>
          <strong>120</strong><i>+60</i><strong>180</strong><i>+60</i><strong>240</strong>
        </div>
        <div>
          <span>Taux fixe</span>
          <strong>120</strong><i>×1,5</i><strong>180</strong><i>×1,5</i><strong>270</strong>
        </div>
      </div>
    );
  }
  if (type === "growth") {
    const values = [800, 1000, 1250, 1563, 1953, 2441, 3052, 3815];
    const selected = parameterValue ?? 4;
    return (
      <div className="growth-visual" aria-label="Évolution de la population bactérienne">
        <div className="threshold-line"><span>seuil 1 800</span></div>
        {values.map((value, index) => (
          <div
            key={value}
            className={index === selected ? "selected" : ""}
            style={{ height: `${Math.max(16, (value / 3815) * 100)}%` }}
          >
            <span>{value}</span>
            <small>{index}</small>
          </div>
        ))}
      </div>
    );
  }
  if (type === "transfer") {
    return (
      <div className="transfer-visual">
        <div><span>Diffusion</span><strong>× 1,5</strong></div>
        <i aria-hidden="true">→</i>
        <div><span>Bactéries</span><strong>× 1,25</strong></div>
        <i aria-hidden="true">→</i>
        <div><span>Valeur</span><strong>× 0,8</strong></div>
      </div>
    );
  }
  return (
    <div className="trace-visual">
      <span className="trace-icon">✓</span>
      <div>
        <small>Ta conjecture</small>
        <p>
          {conjecture ||
            "Chaque terme semble être obtenu en multipliant le précédent par un même nombre."}
        </p>
      </div>
    </div>
  );
}

function DiffusionVisual({ compact = false }: { compact?: boolean }) {
  const values = [120, 180, 270, 405, 608];
  return (
    <div className={`diffusion-visual ${compact ? "compact" : ""}`}>
      <div className="chart-label">VUES / HEURE</div>
      <div className="chart-bars">
        {values.map((value, index) => (
          <div key={value}>
            <span style={{ height: `${25 + index * 15}%` }}>
              <i>{value}</i>
            </span>
            <small>H{index}</small>
          </div>
        ))}
      </div>
      <div className="chart-rule">
        <span>120</span><i>× 1,5</i><span>180</span><i>× 1,5</i><span>270</span>
      </div>
    </div>
  );
}

function TraceView({
  progress,
  onNavigate,
  onRestart,
}: {
  progress: JourneyProgress;
  onNavigate: (view: View) => void;
  onRestart: () => void;
}) {
  const completionDate = formatCompletionDate(progress.completedAt);
  const highlights = getPathHighlights(progress.pathTags);
  const conjecture =
    progress.conjecture.trim() ||
    "Une suite semble géométrique lorsque l’on multiplie toujours le terme précédent par le même nombre.";

  function downloadTrace() {
    const file = new Blob([createStudentTraceText(progress)], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ma-trace-suites-geometriques.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return (
    <main className="trace-page">
      <div className="trace-toolbar" data-print-hidden="true">
        <button
          type="button"
          className="breadcrumb"
          onClick={() =>
            onNavigate({ name: "chapter", chapterId: "suites-geometriques" })
          }
        >
          <Icon name="arrow" /> Retour au chapitre
        </button>
        <div className="trace-toolbar-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={downloadTrace}
            data-testid="download-trace-button"
          >
            Télécharger la trace (.txt)
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={() => window.print()}
            data-testid="print-trace-button"
          >
            <Icon name="book" /> Imprimer ou enregistrer en PDF
          </button>
        </div>
      </div>

      <article className="student-trace" data-testid="student-trace">
        <header className="student-trace-head">
          <div className="trace-brand">
            <span>∑</span>
            <p>
              <strong>HORIZON MATHS</strong>
              <small>Comprendre avant d’apprendre.</small>
            </p>
          </div>
          <div className="trace-title">
            <span>Terminale · Suites géométriques</span>
            <h1>Ma trace de découverte</h1>
            <p>La propagation invisible · {completionDate}</p>
          </div>
        </header>

        <div className="trace-identity" aria-label="Informations à compléter">
          <p>
            Nom / prénom <span aria-hidden="true" />
          </p>
          <p>
            Classe <span aria-hidden="true" />
          </p>
        </div>

        <section className="trace-conjecture">
          <span className="trace-section-number">01</span>
          <div>
            <small>Ma formulation personnelle</small>
            <h2>Ma conjecture</h2>
            <blockquote>« {conjecture} »</blockquote>
          </div>
        </section>

        <section className="trace-learning-grid">
          <div className="trace-path">
            <span className="trace-section-number">02</span>
            <small>Mon chemin d’apprentissage</small>
            <h2>Ce qui m’a fait avancer</h2>
            <ul>
              {highlights.map((highlight) => (
                <li key={highlight}>
                  <span>✓</span>
                  {highlight}
                </li>
              ))}
            </ul>
            <p className="trace-hints">
              {progress.hintsUsed.length
                ? `${progress.hintsUsed.length} indice${progress.hintsUsed.length > 1 ? "s" : ""} consulté${progress.hintsUsed.length > 1 ? "s" : ""} pour progresser.`
                : "Parcours réalisé sans demander d’indice."}
            </p>
          </div>

          <div className="trace-rule">
            <span className="trace-section-number">03</span>
            <small>La règle mathématique</small>
            <h2>Ce que je retiens</h2>
            <p>
              Une suite est <strong>géométrique</strong> lorsque chaque terme
              s’obtient en multipliant le précédent par un même nombre
              <strong> q</strong>, appelé <strong>raison</strong>.
            </p>
            <div className="trace-formulas">
              <span>
                u<sub>n+1</sub> = q × u<sub>n</sub>
              </span>
              <span>
                u<sub>n</sub> = u<sub>0</sub> × q<sup>n</sup>
              </span>
            </div>
            <p className="trace-variation">
              <strong>q &gt; 1</strong> : la suite augmente
              <br />
              <strong>0 &lt; q &lt; 1</strong> : elle diminue
            </p>
          </div>
        </section>

        <section className="trace-examples">
          <span className="trace-section-number">04</span>
          <div className="trace-examples-head">
            <small>Trois contextes, une même structure</small>
            <h2>Mes exemples de référence</h2>
          </div>
          <div className="trace-example-grid">
            <article>
              <span>Diffusion</span>
              <strong>120 × 1,5² = 270</strong>
              <p>Après deux nouvelles heures.</p>
            </article>
            <article>
              <span>Culture</span>
              <strong>800 × 1,25⁴ ≈ 1 953</strong>
              <p>Premier dépassement de 1 800 au cycle 4.</p>
            </article>
            <article>
              <span>Dépréciation</span>
              <strong>1 000 × 0,8² = 640 €</strong>
              <p>Après deux années de baisse.</p>
            </article>
          </div>
        </section>

        <section className="trace-class-note">
          <span className="trace-section-number">05</span>
          <div>
            <small>Après la mise en commun</small>
            <h2>La formulation retenue par la classe</h2>
            <span className="writing-line" />
            <span className="writing-line" />
          </div>
        </section>

        <div className="student-trace-footer">
          <p>
            Trace créée sur cet appareil · aucune donnée personnelle transmise
          </p>
          <span>horizon maths · voie professionnelle</span>
        </div>
      </article>

      <div className="trace-after" data-print-hidden="true">
        <p>
          Cette fiche reste disponible sur cet appareil. Télécharge-la pour la
          conserver même si l’historique du navigateur est effacé.
        </p>
        <button type="button" className="text-button" onClick={onRestart}>
          Refaire le parcours <Icon name="arrow" />
        </button>
      </div>
    </main>
  );
}

function TeacherView({
  onNavigate,
  onPreview,
}: {
  onNavigate: (view: View) => void;
  onPreview: (stepId: string) => void;
}) {
  const pathRows = [
    ["Intuition proportionnelle", "11", "46%"],
    ["Aide : hausse fixe", "7", "29%"],
    ["Aide : représentation", "4", "17%"],
    ["Exemple intermédiaire", "2", "8%"],
  ];
  return (
    <main className="teacher-page">
      <div className="teacher-heading">
        <div>
          <span className="section-kicker">Espace enseignant · aperçu local</span>
          <h1>Préparer la mise en commun</h1>
          <p>
            Vue de démonstration avec données anonymisées fictives. Aucun compte ni
            suivi de classe réel n’est activé dans cette première version.
          </p>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={() => onPreview("video-forecast")}
        >
          <Icon name="play" size={15} /> Prévisualiser le parcours
        </button>
      </div>

      <section className="teacher-context">
        <label>
          Classe
          <select defaultValue="TMCV1">
            <option>TMCV1 · démonstration</option>
            <option>TTCB · démonstration</option>
          </select>
        </label>
        <label>
          Chapitre
          <select defaultValue="suites">
            <option value="suites">Suites géométriques</option>
          </select>
        </label>
        <span>Actualisé pour la démonstration</span>
      </section>

      <section className="teacher-stats" aria-label="Résumé de progression">
        {[
          ["24", "élèves ont commencé", "+ 3 cette semaine"],
          ["18", "parcours terminés", "75 % de la classe"],
          ["6", "parcours en cours", "aucun résultat public"],
          ["5", "conjectures à discuter", "formulations singulières"],
        ].map(([value, label, detail], index) => (
          <article key={label}>
            <span className={`stat-symbol stat-${index}`} aria-hidden="true">
              {index === 0 ? "↗" : index === 1 ? "✓" : index === 2 ? "◷" : "✦"}
            </span>
            <strong>{value}</strong>
            <p>{label}</p>
            <small>{detail}</small>
          </article>
        ))}
      </section>

      <div className="teacher-grid">
        <section className="dashboard-card paths-card">
          <div className="dashboard-title">
            <div>
              <span>Chemins empruntés</span>
              <h2>Première bifurcation</h2>
            </div>
            <small>24 élèves</small>
          </div>
          <div className="path-bars">
            {pathRows.map(([label, value, percent], index) => (
              <div key={label}>
                <p><span>{label}</span><strong>{value}</strong></p>
                <i><span style={{ width: percent }} className={`bar-${index}`} /></i>
                <small>{percent}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-card alerts-card">
          <div className="dashboard-title">
            <div>
              <span>Points d’attention</span>
              <h2>Ce qui mérite d’être repris</h2>
            </div>
          </div>
          <ol>
            <li>
              <span>01</span>
              <p><strong>Ajout fixe au lieu d’un taux fixe</strong>7 élèves · vidéo</p>
              <em>fréquent</em>
            </li>
            <li>
              <span>02</span>
              <p><strong>Premier rang de dépassement</strong>6 élèves · bactéries</p>
              <em>à revoir</em>
            </li>
            <li>
              <span>03</span>
              <p><strong>Taux confondu avec coefficient</strong>4 élèves · point commun</p>
              <em>ponctuel</em>
            </li>
          </ol>
        </section>

        <section className="dashboard-card hints-card">
          <div className="dashboard-title">
            <div>
              <span>Aides utilisées</span>
              <h2>Indices les plus ouverts</h2>
            </div>
          </div>
          <div className="hint-metrics">
            <div><span>Nouvelle base de calcul</span><strong>9</strong></div>
            <div><span>Coefficient 1 + t/100</span><strong>7</strong></div>
            <div><span>Encadrer le seuil</span><strong>6</strong></div>
          </div>
          <p className="dashboard-note">
            Le nombre d’aides n’alimente aucun score ni classement.
          </p>
        </section>

        <section className="dashboard-card conjectures-card">
          <div className="dashboard-title">
            <div>
              <span>Conjectures finales</span>
              <h2>Paroles d’élèves</h2>
            </div>
            <small>Pseudonymes</small>
          </div>
          <blockquote>
            « On reprend toujours le résultat d’avant et on lui applique le même
            coefficient. »
            <cite>Élève A12</cite>
          </blockquote>
          <blockquote>
            « Ce n’est pas la différence qui reste pareille, c’est le nombre par
            lequel on multiplie. »
            <cite>Élève B07</cite>
          </blockquote>
        </section>
      </div>

      <section className="class-synthesis">
        <div>
          <span className="section-kicker">Synthèse suggérée</span>
          <h2>Trois idées à faire émerger au tableau</h2>
        </div>
        <ol>
          <li><span>1</span>Distinguer hausse fixe et hausse proportionnelle.</li>
          <li><span>2</span>Nommer le coefficient multiplicateur puis la raison.</li>
          <li><span>3</span>Relier le modèle discret aux fonctions exponentielles.</li>
        </ol>
      </section>

      <section className="branch-preview">
        <div>
          <span className="section-kicker">Tester les embranchements</span>
          <h2>Ouvrir directement une étape</h2>
        </div>
        <div>
          <button type="button" onClick={() => onPreview("addition-help")}>
            Aide « hausse fixe » <Icon name="arrow" />
          </button>
          <button type="button" onClick={() => onPreview("threshold-challenge")}>
            Défi « seuil de vues » <Icon name="arrow" />
          </button>
          <button type="button" onClick={() => onPreview("bio-visual")}>
            Aide « premier dépassement » <Icon name="arrow" />
          </button>
        </div>
      </section>

      <button
        type="button"
        className="back-home"
        onClick={() => onNavigate({ name: "home" })}
      >
        <Icon name="arrow" /> Retour à l’espace élève
      </button>
    </main>
  );
}

function Footer() {
  return (
    <footer>
      <div className="footer-brand">
        <span>∑</span>
        <p><strong>HORIZON MATHS</strong><small>Comprendre avant d’apprendre.</small></p>
      </div>
      <p>
        Pensé pour la voie professionnelle · progression locale · aucune donnée
        personnelle transmise.
      </p>
      <a
        href="https://eduscol.education.gouv.fr/5895/programmes-et-ressources-en-mathematiques-voie-professionnelle"
        target="_blank"
        rel="noreferrer"
      >
        Programmes officiels ↗
      </a>
    </footer>
  );
}

export function MathsApp() {
  const [view, setView] = useState<View>({ name: "home" });
  const [progress, setProgress] = useState<JourneyProgress>(cloneEmptyProgress);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const saved = JSON.parse(stored) as Partial<JourneyProgress>;
        setProgress({
          ...cloneEmptyProgress(),
          ...saved,
          completedAt:
            saved.completedAt ??
            (saved.completed ? new Date().toISOString() : null),
        });
      }
    } catch {
      // Une progression illisible est simplement ignorée.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress, hydrated]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);

  const selectedChapter = useMemo(
    () =>
      view.name === "chapter"
        ? chapters.find((chapter) => chapter.id === view.chapterId)
        : undefined,
    [view],
  );

  function startJourney(reset = false) {
    if (reset) {
      setProgress(cloneEmptyProgress());
    }
    setView({ name: "journey" });
  }

  function previewStep(stepId: string) {
    setProgress({
      ...cloneEmptyProgress(),
      currentStepId: stepId,
    });
    setView({ name: "journey" });
  }

  return (
    <div className="app-shell">
      {view.name !== "journey" && <Header view={view} onNavigate={setView} />}
      {view.name === "home" && (
        <HomeView progress={progress} onNavigate={setView} />
      )}
      {view.name === "level" && (
        <LevelView
          levelId={view.level}
          progress={progress}
          onNavigate={setView}
        />
      )}
      {view.name === "chapter" && selectedChapter && (
        <ChapterView
          chapter={selectedChapter}
          progress={progress}
          onNavigate={setView}
          onStart={startJourney}
        />
      )}
      {view.name === "journey" && (
        <JourneyView
          progress={progress}
          setProgress={setProgress}
          onNavigate={setView}
        />
      )}
      {view.name === "trace" && (
        <TraceView
          progress={progress}
          onNavigate={setView}
          onRestart={() => startJourney(true)}
        />
      )}
      {view.name === "teacher" && (
        <TeacherView onNavigate={setView} onPreview={previewStep} />
      )}
    </div>
  );
}
