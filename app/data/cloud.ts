import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  ProgressStore,
  StudentCloudSnapshot,
  TeacherClass,
  TeacherCloudSnapshot,
  TeacherIdentity,
  TeacherProgress,
  TeacherStudent,
} from "./accountTypes";

type RuntimeEnvironment = {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
};

type RpcEnvelope<T> = {
  ok: boolean;
  error?: string;
  value?: T;
};

const runtimeEnvironment =
  ((import.meta as ImportMeta & { env?: RuntimeEnvironment }).env ?? {});
const supabaseUrl = runtimeEnvironment.VITE_SUPABASE_URL?.trim() ?? "";
const supabasePublishableKey =
  runtimeEnvironment.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";

export const isCloudConfigured = Boolean(
  supabaseUrl && supabasePublishableKey,
);

const cloudClient: SupabaseClient | null = isCloudConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        storageKey: "horizon-maths-teacher-auth-v1",
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

function requireCloudClient(): SupabaseClient {
  if (!cloudClient) {
    throw new Error(
      "L’espace personnel n’est pas encore relié à sa base sécurisée.",
    );
  }
  return cloudClient;
}

function friendlyError(error: unknown): Error {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Une erreur inattendue s’est produite.";

  if (/invalid login credentials/i.test(message)) {
    return new Error("Adresse ou mot de passe incorrect.");
  }
  if (/user already registered/i.test(message)) {
    return new Error("Un compte enseignant existe déjà avec cette adresse.");
  }
  if (/password should be at least/i.test(message)) {
    return new Error("Le mot de passe doit contenir au moins 8 caractères.");
  }
  if (/failed to fetch|network/i.test(message)) {
    return new Error("Connexion impossible. Vérifiez votre accès à Internet.");
  }
  return new Error(message);
}

function readEnvelope<T>(data: unknown): T {
  const envelope = data as RpcEnvelope<T> | null;
  if (!envelope?.ok) {
    throw new Error(
      envelope?.error ?? "La demande n’a pas pu être enregistrée.",
    );
  }
  return envelope.value as T;
}

function normalizeTeacherIdentity(user: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}): TeacherIdentity {
  return {
    id: user.id,
    email: user.email ?? "",
    displayName:
      String(user.user_metadata?.display_name ?? "").trim() ||
      user.email?.split("@")[0] ||
      "Enseignant",
  };
}

export function createStudentSessionToken(): string {
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

export async function signUpTeacher(
  displayName: string,
  email: string,
  password: string,
): Promise<{ identity: TeacherIdentity | null; confirmationRequired: boolean }> {
  try {
    const client = requireCloudClient();
    const { data, error } = await client.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: displayName.trim() },
        emailRedirectTo: window.location.href.split("#")[0],
      },
    });
    if (error) throw error;
    return {
      identity: data.user ? normalizeTeacherIdentity(data.user) : null,
      confirmationRequired: !data.session,
    };
  } catch (error) {
    throw friendlyError(error);
  }
}

export async function signInTeacher(
  email: string,
  password: string,
): Promise<TeacherIdentity> {
  try {
    const client = requireCloudClient();
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    return normalizeTeacherIdentity(data.user);
  } catch (error) {
    throw friendlyError(error);
  }
}

export async function signOutTeacher(): Promise<void> {
  const client = requireCloudClient();
  const { error } = await client.auth.signOut();
  if (error) throw friendlyError(error);
}

export async function getCurrentTeacher(): Promise<TeacherIdentity | null> {
  if (!cloudClient) return null;
  const { data, error } = await cloudClient.auth.getUser();
  if (error || !data.user) return null;
  return normalizeTeacherIdentity(data.user);
}

export function subscribeToTeacher(
  listener: (teacher: TeacherIdentity | null) => void,
): () => void {
  if (!cloudClient) return () => undefined;
  const {
    data: { subscription },
  } = cloudClient.auth.onAuthStateChange((_event, session) => {
    listener(session?.user ? normalizeTeacherIdentity(session.user) : null);
  });
  return () => subscription.unsubscribe();
}

export async function loginStudent(
  classCode: string,
  login: string,
  password: string,
  sessionToken: string,
): Promise<StudentCloudSnapshot> {
  try {
    const client = requireCloudClient();
    const { data, error } = await client.rpc("hm_student_login", {
      p_class_code: classCode.trim().toUpperCase(),
      p_login: login.trim().toLowerCase(),
      p_password: password,
      p_session_token: sessionToken,
    });
    if (error) throw error;
    return readEnvelope<StudentCloudSnapshot>(data);
  } catch (error) {
    throw friendlyError(error);
  }
}

export async function restoreStudentSession(
  sessionToken: string,
): Promise<StudentCloudSnapshot | null> {
  if (!cloudClient || !sessionToken) return null;
  try {
    const { data, error } = await cloudClient.rpc("hm_student_restore", {
      p_session_token: sessionToken,
    });
    if (error) throw error;
    return readEnvelope<StudentCloudSnapshot>(data);
  } catch {
    return null;
  }
}

export async function syncStudentProgress(
  sessionToken: string,
  progressStore: ProgressStore,
): Promise<void> {
  try {
    const client = requireCloudClient();
    const { data, error } = await client.rpc("hm_student_save_all_progress", {
      p_session_token: sessionToken,
      p_progress_store: progressStore,
    });
    if (error) throw error;
    readEnvelope<{ syncedAt: string }>(data);
  } catch (error) {
    throw friendlyError(error);
  }
}

export async function logoutStudent(sessionToken: string): Promise<void> {
  if (!cloudClient || !sessionToken) return;
  await cloudClient.rpc("hm_student_logout", {
    p_session_token: sessionToken,
  });
}

export async function deleteStudentOwnAccount(
  sessionToken: string,
): Promise<void> {
  try {
    const client = requireCloudClient();
    const { data, error } = await client.rpc("hm_student_delete_my_account", {
      p_session_token: sessionToken,
    });
    if (error) throw error;
    readEnvelope<{ deleted: boolean }>(data);
  } catch (error) {
    throw friendlyError(error);
  }
}

export async function loadTeacherSnapshot(): Promise<TeacherCloudSnapshot> {
  try {
    const client = requireCloudClient();
    const [classesResult, studentsResult, progressResult] = await Promise.all([
      client
        .from("hm_classes")
        .select("id,name,code,level,created_at")
        .order("created_at", { ascending: true }),
      client
        .from("hm_students")
        .select(
          "id,class_id,display_name,login,active,last_login_at,created_at",
        )
        .order("display_name", { ascending: true }),
      client
        .from("hm_student_progress")
        .select("student_id,chapter_id,progress_data,updated_at"),
    ]);

    if (classesResult.error) throw classesResult.error;
    if (studentsResult.error) throw studentsResult.error;
    if (progressResult.error) throw progressResult.error;

    const classes: TeacherClass[] = (classesResult.data ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      code: item.code,
      level: item.level,
      createdAt: item.created_at,
    }));
    const students: TeacherStudent[] = (studentsResult.data ?? []).map(
      (item) => ({
        id: item.id,
        classId: item.class_id,
        displayName: item.display_name,
        login: item.login,
        active: item.active,
        lastLoginAt: item.last_login_at,
        createdAt: item.created_at,
      }),
    );
    const progress: TeacherProgress[] = (progressResult.data ?? []).map(
      (item) => ({
        studentId: item.student_id,
        chapterId: item.chapter_id,
        progress: item.progress_data,
        updatedAt: item.updated_at,
      }),
    );

    return { classes, students, progress };
  } catch (error) {
    throw friendlyError(error);
  }
}

async function callTeacherRpc<T>(
  name: string,
  parameters: Record<string, unknown>,
): Promise<T> {
  try {
    const client = requireCloudClient();
    const { data, error } = await client.rpc(name, parameters);
    if (error) throw error;
    return readEnvelope<T>(data);
  } catch (error) {
    throw friendlyError(error);
  }
}

export async function createTeacherClass(
  name: string,
  level: TeacherClass["level"],
): Promise<TeacherClass> {
  return callTeacherRpc<TeacherClass>("hm_create_class", {
    p_name: name.trim(),
    p_level: level,
  });
}

export async function renameTeacherClass(
  classId: string,
  name: string,
): Promise<void> {
  await callTeacherRpc<{ updated: boolean }>("hm_rename_class", {
    p_class_id: classId,
    p_name: name.trim(),
  });
}

export async function deleteTeacherClass(classId: string): Promise<void> {
  await callTeacherRpc<{ deleted: boolean }>("hm_delete_class", {
    p_class_id: classId,
  });
}

export async function createTeacherStudent(
  classId: string,
  displayName: string,
  login: string,
  password: string,
): Promise<TeacherStudent> {
  return callTeacherRpc<TeacherStudent>("hm_create_student", {
    p_class_id: classId,
    p_display_name: displayName.trim(),
    p_login: login.trim().toLowerCase(),
    p_password: password,
  });
}

export async function resetTeacherStudentPassword(
  studentId: string,
  password: string,
): Promise<void> {
  await callTeacherRpc<{ updated: boolean }>("hm_reset_student_password", {
    p_student_id: studentId,
    p_password: password,
  });
}

export async function clearTeacherStudentProgress(
  studentId: string,
): Promise<void> {
  await callTeacherRpc<{ cleared: boolean }>("hm_clear_student_progress", {
    p_student_id: studentId,
  });
}

export async function deleteTeacherStudent(studentId: string): Promise<void> {
  await callTeacherRpc<{ deleted: boolean }>("hm_delete_student", {
    p_student_id: studentId,
  });
}
