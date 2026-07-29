export type JourneyProgress = {
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

export type ProgressStore = Record<string, JourneyProgress>;

export type StudentIdentity = {
  id: string;
  displayName: string;
  login: string;
  classId: string;
  className: string;
  classCode: string;
};

export type StudentCloudSnapshot = {
  identity: StudentIdentity;
  progressStore: ProgressStore;
};

export type TeacherIdentity = {
  id: string;
  email: string;
  displayName: string;
};

export type TeacherClass = {
  id: string;
  name: string;
  code: string;
  level: "seconde" | "premiere" | "terminale" | "mixte";
  createdAt: string;
};

export type TeacherStudent = {
  id: string;
  classId: string;
  displayName: string;
  login: string;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

export type TeacherProgress = {
  studentId: string;
  chapterId: string;
  progress: JourneyProgress;
  updatedAt: string;
};

export type TeacherCloudSnapshot = {
  classes: TeacherClass[];
  students: TeacherStudent[];
  progress: TeacherProgress[];
};

export type SyncStatus = "local" | "syncing" | "synced" | "error";
