"use client";

import { useEffect, useState, type FormEvent } from "react";
import { chapters, levels, type LevelId } from "../content/curriculum";
import { journeyRegistry } from "../content/allJourneys";
import type {
  ProgressStore,
  StudentCloudSnapshot,
  StudentIdentity,
  SyncStatus,
  TeacherClass,
  TeacherCloudSnapshot,
  TeacherIdentity,
  TeacherProgress,
  TeacherStudent,
} from "../data/accountTypes";
import {
  clearTeacherStudentProgress,
  createStudentSessionToken,
  createTeacherClass,
  createTeacherStudent,
  deleteStudentOwnAccount,
  deleteTeacherClass,
  deleteTeacherStudent,
  getCurrentTeacher,
  isCloudConfigured,
  loadTeacherSnapshot,
  loginStudent,
  resetTeacherStudentPassword,
  signInTeacher,
  signOutTeacher,
  signUpTeacher,
  subscribeToTeacher,
} from "../data/cloud";

const STUDENT_SESSION_KEY = "horizon-maths-student-session-v1";

function downloadFile(fileName: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function formatShortDate(value: string | null): string {
  if (!value) return "Jamais";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function progressLabel(progress: TeacherProgress["progress"] | undefined) {
  if (!progress || progress.visited.length === 0) return "Non commencé";
  if (progress.completed) return "Terminé";
  return "En cours";
}

function SetupNotice({ audience }: { audience: "élève" | "enseignant" }) {
  return (
    <main className="account-page">
      <section className="account-shell setup-notice">
        <span className="account-symbol" aria-hidden="true">⌁</span>
        <span className="section-kicker">Activation de l’espace {audience}</span>
        <h1>La partie sécurisée est prête à être reliée.</h1>
        <p>
          Les parcours restent accessibles normalement. La synchronisation des
          comptes sera disponible dès que la base de l’établissement aura été
          connectée.
        </p>
      </section>
    </main>
  );
}

export function StudentAccessView({
  onConnected,
  onBack,
  onPrivacy,
}: {
  onConnected: (snapshot: StudentCloudSnapshot, token: string) => void;
  onBack: () => void;
  onPrivacy: () => void;
}) {
  const [classCode, setClassCode] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!isCloudConfigured) return <SetupNotice audience="élève" />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const token = createStudentSessionToken();
    try {
      const snapshot = await loginStudent(classCode, login, password, token);
      window.localStorage.setItem(STUDENT_SESSION_KEY, token);
      onConnected(snapshot, token);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "La connexion n’a pas pu aboutir.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="account-page">
      <button type="button" className="breadcrumb" onClick={onBack}>
        ← Retour à l’accueil
      </button>
      <div className="account-layout">
        <section className="account-intro">
          <span className="section-kicker">Mon espace élève</span>
          <h1>Retrouver mon parcours.</h1>
          <p>
            Ta progression et tes traces te suivent sur tous tes appareils.
            Aucun compte ChatGPT ni aucune adresse e-mail ne sont nécessaires.
          </p>
          <div className="account-promises">
            <p><span>01</span>Un pseudonyme suffit : n’utilise pas ton nom complet.</p>
            <p><span>02</span>Ton enseignant te donne les trois informations de connexion.</p>
            <p><span>03</span>Tu peux exporter ou supprimer tes données depuis ton espace.</p>
          </div>
        </section>

        <section className="auth-card">
          <div className="auth-card-head">
            <span aria-hidden="true">∑</span>
            <div>
              <small>Horizon Maths</small>
              <h2>Connexion élève</h2>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              Code de classe
              <input
                value={classCode}
                onChange={(event) =>
                  setClassCode(
                    event.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ""),
                  )
                }
                autoComplete="organization"
                inputMode="text"
                maxLength={6}
                placeholder="EX. M4THS2"
                required
              />
            </label>
            <label>
              Mon identifiant
              <input
                value={login}
                onChange={(event) => setLogin(event.target.value.toLowerCase())}
                autoComplete="username"
                maxLength={24}
                placeholder="eleve.a12"
                required
              />
            </label>
            <label>
              Mon mot de passe
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete="current-password"
                minLength={6}
                maxLength={72}
                required
              />
            </label>
            {error && <p className="form-message error" role="alert">{error}</p>}
            <button type="submit" className="primary-button" disabled={busy}>
              {busy ? "Connexion…" : "Ouvrir mon espace →"}
            </button>
          </form>
          <button type="button" className="privacy-link" onClick={onPrivacy}>
            Comment mes données sont-elles protégées ?
          </button>
        </section>
      </div>
    </main>
  );
}

export function StudentSpaceView({
  identity,
  progressStore,
  syncStatus,
  onOpenChapter,
  onOpenTrace,
  onBrowseLevel,
  onLogout,
  onDeleted,
  onPrivacy,
}: {
  identity: StudentIdentity;
  progressStore: ProgressStore;
  syncStatus: SyncStatus;
  onOpenChapter: (chapterId: string) => void;
  onOpenTrace: (chapterId: string) => void;
  onBrowseLevel: (level: LevelId) => void;
  onLogout: () => Promise<void>;
  onDeleted: () => Promise<void>;
  onPrivacy: () => void;
}) {
  const [actionError, setActionError] = useState("");
  const startedChapters = chapters.filter(
    (chapter) => (progressStore[chapter.id]?.visited.length ?? 0) > 0,
  );
  const completedChapters = startedChapters.filter(
    (chapter) => progressStore[chapter.id]?.completed,
  );
  const nextChapter = startedChapters.find(
    (chapter) => !progressStore[chapter.id]?.completed,
  );
  const syncLabels: Record<SyncStatus, string> = {
    local: "En attente de synchronisation",
    syncing: "Synchronisation…",
    synced: "Progression synchronisée",
    error: "Synchronisation à reprendre",
  };

  function exportMyData() {
    downloadFile(
      `horizon-maths-${identity.login}.json`,
      JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          student: identity,
          progress: progressStore,
        },
        null,
        2,
      ),
      "application/json;charset=utf-8",
    );
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Supprimer définitivement ce compte élève, ses progressions et ses traces ? Cette action est irréversible.",
    );
    if (!confirmed) return;
    setActionError("");
    try {
      await onDeleted();
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "Suppression impossible.",
      );
    }
  }

  return (
    <main className="student-space-page">
      <section className="student-space-hero">
        <div>
          <span className="section-kicker">Mon espace personnel</span>
          <h1>Bonjour, {identity.displayName}.</h1>
          <p>
            Classe <strong>{identity.className}</strong> · code{" "}
            <strong>{identity.classCode}</strong>
          </p>
        </div>
        <span className={`sync-badge sync-${syncStatus}`}>
          <i aria-hidden="true" />
          {syncLabels[syncStatus]}
        </span>
      </section>

      <section className="personal-stats" aria-label="Résumé de ma progression">
        <article>
          <strong>{startedChapters.length}</strong>
          <span>parcours commencés</span>
        </article>
        <article>
          <strong>{completedChapters.length}</strong>
          <span>traces terminées</span>
        </article>
        <article>
          <strong>{chapters.length - completedChapters.length}</strong>
          <span>parcours à découvrir</span>
        </article>
      </section>

      <div className="personal-grid">
        <section className="personal-card personal-continue">
          <span className="section-kicker">Continuer</span>
          {nextChapter ? (
            <>
              <small>
                {levels.find((level) => level.id === nextChapter.level)?.label}
              </small>
              <h2>{nextChapter.title}</h2>
              <p>{nextChapter.summary}</p>
              <button
                type="button"
                className="primary-button"
                onClick={() => onOpenChapter(nextChapter.id)}
              >
                Reprendre mon parcours →
              </button>
            </>
          ) : (
            <>
              <h2>Choisir un premier parcours</h2>
              <p>
                Sélectionne ton niveau puis le chapitre travaillé en classe.
              </p>
              <div className="level-shortcuts">
                {levels.map((level) => (
                  <button
                    type="button"
                    key={level.id}
                    onClick={() => onBrowseLevel(level.id)}
                  >
                    {level.shortLabel} →
                  </button>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="personal-card">
          <div className="personal-card-title">
            <div>
              <span className="section-kicker">Mes traces</span>
              <h2>Ce que j’ai construit</h2>
            </div>
            <strong>{completedChapters.length}</strong>
          </div>
          {completedChapters.length ? (
            <div className="personal-list">
              {completedChapters.map((chapter) => (
                <button
                  type="button"
                  key={chapter.id}
                  onClick={() => onOpenTrace(chapter.id)}
                >
                  <span>✓</span>
                  <p>
                    <strong>{chapter.title}</strong>
                    <small>
                      {levels.find((level) => level.id === chapter.level)?.shortLabel}
                    </small>
                  </p>
                  <i>→</i>
                </button>
              ))}
            </div>
          ) : (
            <p className="empty-copy">
              Tes traces apparaîtront ici à la fin de chaque parcours.
            </p>
          )}
        </section>
      </div>

      <section className="personal-card all-progress-card">
        <div className="personal-card-title">
          <div>
            <span className="section-kicker">Tous mes parcours</span>
            <h2>Ma progression par chapitre</h2>
          </div>
        </div>
        <div className="progress-chapter-grid">
          {startedChapters.length ? (
            startedChapters.map((chapter) => {
              const progress = progressStore[chapter.id];
              const journey = journeyRegistry[chapter.id];
              const stage =
                journey?.steps.find(
                  (step) => step.id === progress.currentStepId,
                )?.stage ?? 1;
              return (
                <button
                  type="button"
                  key={chapter.id}
                  onClick={() =>
                    progress.completed
                      ? onOpenTrace(chapter.id)
                      : onOpenChapter(chapter.id)
                  }
                >
                  <small>
                    {levels.find((level) => level.id === chapter.level)?.shortLabel}
                  </small>
                  <strong>{chapter.title}</strong>
                  <span>
                    {progress.completed
                      ? "Trace disponible"
                      : `Étape ${stage} sur ${journey?.totalStages ?? 6}`}
                  </span>
                </button>
              );
            })
          ) : (
            <p className="empty-copy">Aucun parcours commencé pour le moment.</p>
          )}
        </div>
      </section>

      <section className="personal-settings">
        <div>
          <span className="section-kicker">Mes données</span>
          <h2>Je garde le contrôle.</h2>
          <p>
            Tu peux récupérer une copie de ta progression, te déconnecter ou
            demander la suppression immédiate de ton espace.
          </p>
          {actionError && (
            <p className="form-message error" role="alert">{actionError}</p>
          )}
        </div>
        <div>
          <button type="button" className="secondary-button" onClick={exportMyData}>
            Télécharger mes données
          </button>
          <button type="button" className="secondary-button" onClick={onPrivacy}>
            Protection des données
          </button>
          <button type="button" className="text-button" onClick={onLogout}>
            Me déconnecter
          </button>
          <button type="button" className="danger-button" onClick={handleDelete}>
            Supprimer mon espace
          </button>
        </div>
      </section>
    </main>
  );
}

function TeacherAuth({
  onAuthenticated,
}: {
  onAuthenticated: (teacher: TeacherIdentity) => void;
}) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (mode === "signin") {
        onAuthenticated(await signInTeacher(email, password));
      } else {
        const result = await signUpTeacher(displayName, email, password);
        if (result.confirmationRequired) {
          setMessage(
            "Un message de confirmation vient d’être envoyé. Ouvrez-le puis revenez vous connecter.",
          );
        } else if (result.identity) {
          onAuthenticated(result.identity);
        }
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "La connexion n’a pas pu aboutir.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="account-page teacher-auth-page">
      <div className="account-layout">
        <section className="account-intro">
          <span className="section-kicker">Espace enseignant</span>
          <h1>Suivre sans classer.</h1>
          <p>
            Créez vos classes, distribuez des identifiants pseudonymes et
            préparez la mise en commun à partir des chemins réellement
            empruntés.
          </p>
          <div className="account-promises">
            <p><span>01</span>Aucun nom réel ni e-mail élève demandé.</p>
            <p><span>02</span>Aucun score public et aucun classement.</p>
            <p><span>03</span>Export et suppression disponibles à tout moment.</p>
          </div>
        </section>
        <section className="auth-card">
          <div className="auth-tabs">
            <button
              type="button"
              className={mode === "signin" ? "active" : ""}
              onClick={() => setMode("signin")}
            >
              Se connecter
            </button>
            <button
              type="button"
              className={mode === "signup" ? "active" : ""}
              onClick={() => setMode("signup")}
            >
              Créer mon compte
            </button>
          </div>
          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <label>
                Nom affiché
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  autoComplete="name"
                  minLength={2}
                  maxLength={80}
                  required
                />
              </label>
            )}
            <label>
              Adresse e-mail professionnelle
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                autoComplete="email"
                required
              />
            </label>
            <label>
              Mot de passe
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                minLength={8}
                maxLength={72}
                required
              />
            </label>
            {error && <p className="form-message error" role="alert">{error}</p>}
            {message && <p className="form-message success">{message}</p>}
            <button type="submit" className="primary-button" disabled={busy}>
              {busy
                ? "Un instant…"
                : mode === "signin"
                  ? "Ouvrir mon tableau →"
                  : "Créer mon espace →"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function TeacherDashboard({
  teacher,
  onSignedOut,
  onPreview,
}: {
  teacher: TeacherIdentity;
  onSignedOut: () => void;
  onPreview: (chapterId: string, stepId: string) => void;
}) {
  const [snapshot, setSnapshot] = useState<TeacherCloudSnapshot>({
    classes: [],
    students: [],
    progress: [],
  });
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedChapterId, setSelectedChapterId] = useState(
    "suites-geometriques",
  );
  const [className, setClassName] = useState("");
  const [classLevel, setClassLevel] =
    useState<TeacherClass["level"]>("terminale");
  const [studentName, setStudentName] = useState("");
  const [studentLogin, setStudentLogin] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function refresh() {
    try {
      const next = await loadTeacherSnapshot();
      setSnapshot(next);
      setSelectedClassId((current) =>
        next.classes.some((item) => item.id === current)
          ? current
          : next.classes[0]?.id ?? "",
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Chargement impossible.",
      );
    }
  }

  useEffect(() => {
    let cancelled = false;
    void loadTeacherSnapshot()
      .then((next) => {
        if (cancelled) return;
        setSnapshot(next);
        setSelectedClassId(next.classes[0]?.id ?? "");
      })
      .catch((cause) => {
        if (cancelled) return;
        setError(
          cause instanceof Error ? cause.message : "Chargement impossible.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedClass = snapshot.classes.find(
    (item) => item.id === selectedClassId,
  );
  const classStudents = snapshot.students.filter(
    (student) => student.classId === selectedClassId,
  );
  const progressByStudent = new Map(
    snapshot.progress
      .filter((item) => item.chapterId === selectedChapterId)
      .map((item) => [item.studentId, item]),
  );
  const started = classStudents.filter(
    (student) =>
      (progressByStudent.get(student.id)?.progress.visited.length ?? 0) > 0,
  );
  const completed = started.filter(
    (student) => progressByStudent.get(student.id)?.progress.completed,
  );
  const inProgress = started.filter(
    (student) => !progressByStudent.get(student.id)?.progress.completed,
  );
  const conjectures = classStudents
    .map((student) => ({
      student,
      text: progressByStudent.get(student.id)?.progress.conjecture.trim() ?? "",
    }))
    .filter((item) => item.text);
  const hintsCount = classStudents.reduce(
    (total, student) =>
      total +
      (progressByStudent.get(student.id)?.progress.hintsUsed.length ?? 0),
    0,
  );
  const pathCounts = [
    {
      label: "Voie défi",
      count: classStudents.filter((student) =>
        progressByStudent.get(student.id)?.progress.pathTags.includes("voie-defi"),
      ).length,
    },
    {
      label: "Détour guidé",
      count: classStudents.filter((student) =>
        progressByStudent
          .get(student.id)
          ?.progress.pathTags.includes("detour-guide"),
      ).length,
    },
    {
      label: "Application reprise",
      count: classStudents.filter((student) =>
        progressByStudent
          .get(student.id)
          ?.progress.pathTags.includes("application-reprise"),
      ).length,
    },
  ];
  const selectedJourney =
    journeyRegistry[selectedChapterId] ?? journeyRegistry["suites-geometriques"];
  const previewSteps = selectedJourney.steps
    .filter(
      (step) =>
        step.id === selectedJourney.startStepId ||
        step.stage === 2 ||
        step.stage === Math.min(4, selectedJourney.totalStages),
    )
    .slice(0, 3);

  async function runAction(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      await refresh();
      setNotice(success);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Action impossible.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateClass(event: FormEvent) {
    event.preventDefault();
    await runAction(
      async () => {
        const created = await createTeacherClass(className, classLevel);
        setSelectedClassId(created.id);
        setClassName("");
      },
      "Classe créée. Son code est prêt à être transmis.",
    );
  }

  async function handleAddStudent(event: FormEvent) {
    event.preventDefault();
    if (!selectedClassId) return;
    await runAction(
      async () => {
        await createTeacherStudent(
          selectedClassId,
          studentName,
          studentLogin,
          studentPassword,
        );
        setStudentName("");
        setStudentLogin("");
        setStudentPassword("");
        setShowAddStudent(false);
      },
      "Accès élève créé.",
    );
  }

  async function copyClassCode() {
    if (!selectedClass) return;
    await navigator.clipboard.writeText(selectedClass.code);
    setNotice(`Code ${selectedClass.code} copié.`);
  }

  function exportClass() {
    if (!selectedClass) return;
    const rows = [
      ["Pseudonyme", "Identifiant", "Chapitre", "Statut", "Dernière activité"],
      ...classStudents.flatMap((student) =>
        chapters.map((chapter) => {
          const item = snapshot.progress.find(
            (progress) =>
              progress.studentId === student.id &&
              progress.chapterId === chapter.id,
          );
          return [
            student.displayName,
            student.login,
            chapter.title,
            progressLabel(item?.progress),
            item?.updatedAt ? formatShortDate(item.updatedAt) : "—",
          ];
        }),
      ),
    ];
    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(";"),
      )
      .join("\n");
    downloadFile(
      `horizon-maths-${selectedClass.code}.csv`,
      `\ufeff${csv}`,
      "text/csv;charset=utf-8",
    );
  }

  async function handleResetPassword(student: TeacherStudent) {
    const password = window.prompt(
      `Nouveau mot de passe pour ${student.displayName} (6 caractères minimum) :`,
    );
    if (!password) return;
    await runAction(
      () => resetTeacherStudentPassword(student.id, password),
      "Mot de passe modifié. Les anciennes sessions ont été fermées.",
    );
  }

  async function handleClearProgress(student: TeacherStudent) {
    if (
      !window.confirm(
        `Effacer toutes les progressions de ${student.displayName} ?`,
      )
    ) {
      return;
    }
    await runAction(
      () => clearTeacherStudentProgress(student.id),
      "Progression effacée.",
    );
  }

  async function handleDeleteStudent(student: TeacherStudent) {
    if (
      !window.confirm(
        `Supprimer définitivement l’espace de ${student.displayName} ?`,
      )
    ) {
      return;
    }
    await runAction(
      () => deleteTeacherStudent(student.id),
      "Espace élève supprimé.",
    );
  }

  async function handleDeleteClass() {
    if (
      !selectedClass ||
      !window.confirm(
        `Supprimer la classe ${selectedClass.name} et tous ses espaces élèves ?`,
      )
    ) {
      return;
    }
    await runAction(
      () => deleteTeacherClass(selectedClass.id),
      "Classe supprimée.",
    );
  }

  async function handleSignOut() {
    await signOutTeacher();
    onSignedOut();
  }

  if (!snapshot.classes.length) {
    return (
      <main className="teacher-page teacher-empty-page">
        <div className="teacher-account-bar">
          <p>
            <strong>{teacher.displayName}</strong>
            <small>{teacher.email}</small>
          </p>
          <button type="button" className="text-button" onClick={handleSignOut}>
            Se déconnecter
          </button>
        </div>
        <section className="empty-class-card">
          <span className="section-kicker">Première étape</span>
          <h1>Créer votre première classe.</h1>
          <p>
            Un code de six caractères sera généré automatiquement. Vous pourrez
            ensuite créer les accès pseudonymes des élèves.
          </p>
          <form className="inline-create-form" onSubmit={handleCreateClass}>
            <label>
              Nom de la classe
              <input
                value={className}
                onChange={(event) => setClassName(event.target.value)}
                placeholder="Ex. TMCV1"
                minLength={2}
                maxLength={80}
                required
              />
            </label>
            <label>
              Niveau
              <select
                value={classLevel}
                onChange={(event) =>
                  setClassLevel(event.target.value as TeacherClass["level"])
                }
              >
                <option value="seconde">Seconde</option>
                <option value="premiere">Première</option>
                <option value="terminale">Terminale</option>
                <option value="mixte">Groupe mixte</option>
              </select>
            </label>
            <button type="submit" className="primary-button" disabled={busy}>
              Créer la classe →
            </button>
          </form>
          {error && <p className="form-message error">{error}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="teacher-page real-dashboard">
      <div className="teacher-account-bar">
        <p>
          <strong>{teacher.displayName}</strong>
          <small>{teacher.email}</small>
        </p>
        <div>
          <button type="button" className="secondary-button" onClick={exportClass}>
            Exporter la classe
          </button>
          <button type="button" className="text-button" onClick={handleSignOut}>
            Se déconnecter
          </button>
        </div>
      </div>

      <div className="teacher-heading">
        <div>
          <span className="section-kicker">Tableau de suivi réel</span>
          <h1>Préparer la mise en commun.</h1>
          <p>
            Les indicateurs décrivent les chemins d’apprentissage. Ils ne
            produisent ni note, ni classement.
          </p>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={() =>
            onPreview(selectedChapterId, selectedJourney.startStepId)
          }
        >
          ▶ Prévisualiser le parcours
        </button>
      </div>

      <section className="teacher-context real-context">
        <label>
          Classe
          <select
            value={selectedClassId}
            onChange={(event) => setSelectedClassId(event.target.value)}
          >
            {snapshot.classes.map((item) => (
              <option value={item.id} key={item.id}>{item.name}</option>
            ))}
          </select>
        </label>
        <label>
          Chapitre
          <select
            value={selectedChapterId}
            onChange={(event) => setSelectedChapterId(event.target.value)}
          >
            {chapters.map((chapter) => (
              <option key={chapter.id} value={chapter.id}>
                {levels.find((level) => level.id === chapter.level)?.shortLabel} ·{" "}
                {chapter.title}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="class-code-card" onClick={copyClassCode}>
          <small>Code de classe · cliquer pour copier</small>
          <strong>{selectedClass?.code}</strong>
        </button>
      </section>

      {(error || notice) && (
        <p
          className={`form-message ${error ? "error" : "success"} dashboard-message`}
          role={error ? "alert" : undefined}
        >
          {error || notice}
        </p>
      )}

      <section className="teacher-stats" aria-label="Résumé de progression">
        {[
          [String(classStudents.length), "élèves dans la classe", `${started.length} actifs sur ce chapitre`],
          [String(completed.length), "parcours terminés", started.length ? `${Math.round((completed.length / started.length) * 100)} % des élèves actifs` : "Aucun parcours commencé"],
          [String(inProgress.length), "parcours en cours", "sans classement"],
          [String(conjectures.length), "conjectures à discuter", `${hintsCount} indices ouverts`],
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

      <section className="student-management dashboard-card">
        <div className="dashboard-title">
          <div>
            <span>Accès élèves</span>
            <h2>{selectedClass?.name}</h2>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setShowAddStudent((current) => !current)}
          >
            {showAddStudent ? "Fermer" : "+ Ajouter un élève"}
          </button>
        </div>
        {showAddStudent && (
          <form className="student-create-form" onSubmit={handleAddStudent}>
            <label>
              Pseudonyme
              <input
                value={studentName}
                onChange={(event) => setStudentName(event.target.value)}
                placeholder="Ex. Élève A12"
                minLength={2}
                maxLength={40}
                required
              />
              <small>Pas de nom complet.</small>
            </label>
            <label>
              Identifiant
              <input
                value={studentLogin}
                onChange={(event) =>
                  setStudentLogin(event.target.value.toLowerCase())
                }
                placeholder="eleve.a12"
                pattern="[a-z0-9][a-z0-9._-]{2,23}"
                required
              />
            </label>
            <label>
              Mot de passe initial
              <input
                value={studentPassword}
                onChange={(event) => setStudentPassword(event.target.value)}
                type="text"
                minLength={6}
                maxLength={72}
                required
              />
            </label>
            <button type="submit" className="primary-button" disabled={busy}>
              Créer l’accès
            </button>
          </form>
        )}
        <div className="student-table-wrap">
          <table className="student-table">
            <thead>
              <tr>
                <th>Pseudonyme</th>
                <th>Identifiant</th>
                <th>Dernière connexion</th>
                <th>Chapitre affiché</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {classStudents.map((student) => {
                const item = progressByStudent.get(student.id);
                return (
                  <tr key={student.id}>
                    <td><strong>{student.displayName}</strong></td>
                    <td><code>{student.login}</code></td>
                    <td>{formatShortDate(student.lastLoginAt)}</td>
                    <td>
                      <span
                        className={`table-status ${
                          item?.progress.completed
                            ? "done"
                            : item
                              ? "active"
                              : ""
                        }`}
                      >
                        {progressLabel(item?.progress)}
                      </span>
                    </td>
                    <td>
                      <details className="row-actions">
                        <summary>Gérer</summary>
                        <div>
                          <button
                            type="button"
                            onClick={() => handleResetPassword(student)}
                          >
                            Nouveau mot de passe
                          </button>
                          <button
                            type="button"
                            onClick={() => handleClearProgress(student)}
                          >
                            Effacer la progression
                          </button>
                          <button
                            type="button"
                            className="danger-text"
                            onClick={() => handleDeleteStudent(student)}
                          >
                            Supprimer l’espace
                          </button>
                        </div>
                      </details>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!classStudents.length && (
            <p className="empty-copy">
              Aucun accès élève. Ajoutez un pseudonyme pour commencer.
            </p>
          )}
        </div>
      </section>

      <div className="teacher-grid">
        <section className="dashboard-card paths-card">
          <div className="dashboard-title">
            <div>
              <span>Chemins empruntés</span>
              <h2>Voies adaptatives</h2>
            </div>
            <small>{started.length} élèves actifs</small>
          </div>
          <div className="path-bars">
            {pathCounts.map((path, index) => {
              const percent = started.length
                ? Math.round((path.count / started.length) * 100)
                : 0;
              return (
                <div key={path.label}>
                  <p><span>{path.label}</span><strong>{path.count}</strong></p>
                  <i>
                    <span
                      style={{ width: `${percent}%` }}
                      className={`bar-${index}`}
                    />
                  </i>
                  <small>{percent} %</small>
                </div>
              );
            })}
          </div>
        </section>

        <section className="dashboard-card conjectures-card">
          <div className="dashboard-title">
            <div>
              <span>Conjectures finales</span>
              <h2>Paroles d’élèves</h2>
            </div>
            <small>Pseudonymes</small>
          </div>
          {conjectures.slice(0, 3).map((item) => (
            <blockquote key={item.student.id}>
              « {item.text} »
              <cite>{item.student.displayName}</cite>
            </blockquote>
          ))}
          {!conjectures.length && (
            <p className="empty-copy">
              Les conjectures apparaîtront à la fin des parcours.
            </p>
          )}
        </section>
      </div>

      <section className="branch-preview">
        <div>
          <span className="section-kicker">Tester les embranchements</span>
          <h2>Ouvrir directement une étape</h2>
        </div>
        <div>
          {previewSteps.map((step) => (
            <button
              type="button"
              key={step.id}
              onClick={() => onPreview(selectedChapterId, step.id)}
            >
              {step.eyebrow} · {step.title} →
            </button>
          ))}
        </div>
      </section>

      <section className="teacher-danger-zone">
        <div>
          <small>Administration</small>
          <p>
            La suppression d’une classe efface aussi tous ses espaces élèves et
            leurs progressions.
          </p>
        </div>
        <button type="button" className="danger-button" onClick={handleDeleteClass}>
          Supprimer la classe
        </button>
      </section>
    </main>
  );
}

export function TeacherPortal({
  onPreview,
}: {
  onPreview: (chapterId: string, stepId: string) => void;
}) {
  const [teacher, setTeacher] = useState<TeacherIdentity | null>(null);
  const [loading, setLoading] = useState(isCloudConfigured);

  useEffect(() => {
    if (!isCloudConfigured) return;
    void getCurrentTeacher().then((current) => {
      setTeacher(current);
      setLoading(false);
    });
    return subscribeToTeacher((current) => {
      setTeacher(current);
      setLoading(false);
    });
  }, []);

  if (!isCloudConfigured) return <SetupNotice audience="enseignant" />;
  if (loading) {
    return (
      <main className="account-page">
        <section className="account-shell setup-notice">
          <span className="section-kicker">Espace enseignant</span>
          <h1>Ouverture du tableau…</h1>
        </section>
      </main>
    );
  }
  if (!teacher) {
    return <TeacherAuth onAuthenticated={setTeacher} />;
  }
  return (
    <TeacherDashboard
      teacher={teacher}
      onSignedOut={() => setTeacher(null)}
      onPreview={onPreview}
    />
  );
}

export function PrivacyView({ onBack }: { onBack: () => void }) {
  return (
    <main className="privacy-page">
      <button type="button" className="breadcrumb" onClick={onBack}>
        ← Retour
      </button>
      <header>
        <span className="section-kicker">Protection des données</span>
        <h1>Des données minimales, pour apprendre.</h1>
        <p>
          Horizon Maths ne demande ni compte ChatGPT, ni adresse e-mail, ni nom
          complet aux élèves.
        </p>
      </header>
      <div className="privacy-grid">
        <section>
          <span>01</span>
          <h2>Données élève</h2>
          <p>
            Code de classe, pseudonyme, identifiant, progression, aides
            consultées et conjectures. Le mot de passe est conservé uniquement
            sous forme d’empreinte cryptographique non réversible.
          </p>
        </section>
        <section>
          <span>02</span>
          <h2>Utilisation</h2>
          <p>
            Les informations servent uniquement à retrouver les parcours et à
            fournir à l’enseignant une vue pédagogique sans note ni classement.
          </p>
        </section>
        <section>
          <span>03</span>
          <h2>Contrôle</h2>
          <p>
            L’élève peut exporter ou supprimer son espace. L’enseignant peut
            exporter une classe, réinitialiser un accès ou supprimer les
            données correspondantes.
          </p>
        </section>
        <section>
          <span>04</span>
          <h2>Sécurité</h2>
          <p>
            Les espaces sont séparés, les accès sont limités, les mots de passe
            ne sont jamais visibles et les tentatives répétées sont
            temporairement bloquées.
          </p>
        </section>
      </div>
      <aside className="privacy-note">
        <strong>Bon réflexe en classe</strong>
        <p>
          Utiliser un pseudonyme ou un code interne et ne jamais saisir de nom
          complet, d’adresse personnelle ou d’information sensible dans une
          conjecture.
        </p>
      </aside>
    </main>
  );
}

export async function removeStudentAccountWithSession(
  token: string,
): Promise<void> {
  await deleteStudentOwnAccount(token);
  window.localStorage.removeItem(STUDENT_SESSION_KEY);
}

export function readStoredStudentSession(): string {
  return window.localStorage.getItem(STUDENT_SESSION_KEY) ?? "";
}

export function clearStoredStudentSession(): void {
  window.localStorage.removeItem(STUDENT_SESSION_KEY);
}
