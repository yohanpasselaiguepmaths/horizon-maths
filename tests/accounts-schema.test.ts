import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { chapters } from "../app/content/curriculum.ts";

const migration = readFileSync(
  new URL(
    "../supabase/migrations/20260729160000_horizon_accounts.sql",
    import.meta.url,
  ),
  "utf8",
);
const cloudClient = readFileSync(
  new URL("../app/data/cloud.ts", import.meta.url),
  "utf8",
);

test("le schéma connaît exactement les 23 chapitres du catalogue", () => {
  const identifiers = Array.from(
    migration.matchAll(/^\s*\('([a-z0-9-]+)'\),?$/gm),
    (match) => match[1],
  );

  assert.deepEqual(identifiers.sort(), chapters.map((chapter) => chapter.id).sort());
});

test("les quatre tables exposées activent la sécurité par ligne", () => {
  for (const table of [
    "hm_profiles",
    "hm_classes",
    "hm_students",
    "hm_student_progress",
  ]) {
    assert.match(
      migration,
      new RegExp(`alter table public\\.${table} enable row level security;`),
    );
  }
});

test("les secrets élèves restent dans un schéma privé", () => {
  assert.match(migration, /create schema if not exists hm_private;/);
  assert.match(
    migration,
    /revoke all on schema hm_private from public, anon, authenticated;/,
  );
  assert.match(
    migration,
    /extensions\.crypt\(p_password, extensions\.gen_salt\('bf', 10\)\)/,
  );
  assert.doesNotMatch(
    migration,
    /create table if not exists public\.hm_student_credentials/,
  );
});

test("les sessions sont hachées, expirent et les essais répétés sont bloqués", () => {
  assert.match(
    migration,
    /extensions\.digest\(p_session_token, 'sha256'\)/,
  );
  assert.match(migration, /now\(\) \+ interval '30 days'/);
  assert.match(migration, /now\(\) \+ interval '15 minutes'/);
});

test("le navigateur ne reçoit qu'une clé publique", () => {
  assert.match(cloudClient, /VITE_SUPABASE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(cloudClient, /service[_-]?role/i);
  assert.doesNotMatch(cloudClient, /SUPABASE_SECRET/i);
});
