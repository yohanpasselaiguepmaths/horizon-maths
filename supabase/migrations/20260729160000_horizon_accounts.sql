create extension if not exists pgcrypto with schema extensions;

create schema if not exists hm_private;
revoke all on schema hm_private from public, anon, authenticated;

create table if not exists public.hm_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hm_classes (
  id uuid primary key default extensions.gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  code text not null unique check (code ~ '^[A-Z2-9]{6}$'),
  level text not null check (level in ('seconde', 'premiere', 'terminale', 'mixte')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hm_classes_teacher_idx
  on public.hm_classes(teacher_id);

create table if not exists public.hm_students (
  id uuid primary key default extensions.gen_random_uuid(),
  class_id uuid not null references public.hm_classes(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 40),
  login text not null check (login ~ '^[a-z0-9][a-z0-9._-]{2,23}$'),
  active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(class_id, login)
);

create index if not exists hm_students_class_idx
  on public.hm_students(class_id);

create table if not exists public.hm_student_progress (
  student_id uuid not null references public.hm_students(id) on delete cascade,
  chapter_id text not null,
  progress_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key(student_id, chapter_id)
);

create index if not exists hm_student_progress_chapter_idx
  on public.hm_student_progress(chapter_id);

create table if not exists hm_private.hm_student_credentials (
  student_id uuid primary key references public.hm_students(id) on delete cascade,
  password_hash text not null,
  updated_at timestamptz not null default now()
);

create table if not exists hm_private.hm_student_sessions (
  token_hash bytea primary key,
  student_id uuid not null references public.hm_students(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now()
);

create index if not exists hm_student_sessions_student_idx
  on hm_private.hm_student_sessions(student_id);

create index if not exists hm_student_sessions_expiry_idx
  on hm_private.hm_student_sessions(expires_at);

create table if not exists hm_private.hm_login_attempts (
  login_key text primary key,
  attempts integer not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists hm_private.hm_valid_chapters (
  chapter_id text primary key
);

insert into hm_private.hm_valid_chapters(chapter_id)
values
  ('statistiques-une-variable'),
  ('fluctuation-probabilites'),
  ('premier-degre'),
  ('fonctions-seconde'),
  ('geometrie-seconde'),
  ('calculs-commerciaux-seconde'),
  ('statistiques-deux-variables-premiere'),
  ('probabilites-conditionnelles'),
  ('suites-arithmetiques'),
  ('equations-graphiques'),
  ('polynomes-degre-deux'),
  ('derivee-variations'),
  ('calculs-financiers-premiere'),
  ('geometrie-espace-premiere'),
  ('vecteurs-plan'),
  ('trigonometrie-premiere'),
  ('statistiques-deux-variables-terminale'),
  ('arbres-ponderes'),
  ('suites-geometriques'),
  ('polynomes-degre-trois'),
  ('expo-log'),
  ('maths-financieres-terminale'),
  ('vecteurs-espace')
on conflict (chapter_id) do nothing;

create or replace function hm_private.hm_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists hm_profiles_touch_updated_at on public.hm_profiles;
create trigger hm_profiles_touch_updated_at
before update on public.hm_profiles
for each row execute function hm_private.hm_touch_updated_at();

drop trigger if exists hm_classes_touch_updated_at on public.hm_classes;
create trigger hm_classes_touch_updated_at
before update on public.hm_classes
for each row execute function hm_private.hm_touch_updated_at();

drop trigger if exists hm_students_touch_updated_at on public.hm_students;
create trigger hm_students_touch_updated_at
before update on public.hm_students
for each row execute function hm_private.hm_touch_updated_at();

create or replace function hm_private.hm_handle_new_teacher()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_display_name text;
begin
  v_display_name := trim(coalesce(
    new.raw_user_meta_data ->> 'display_name',
    split_part(coalesce(new.email, 'Enseignant'), '@', 1)
  ));
  if char_length(v_display_name) < 2 then
    v_display_name := 'Enseignant';
  end if;

  insert into public.hm_profiles(id, display_name)
  values (new.id, left(v_display_name, 80))
  on conflict (id) do update
  set display_name = excluded.display_name;

  return new;
end;
$$;

drop trigger if exists hm_on_teacher_created on auth.users;
create trigger hm_on_teacher_created
after insert on auth.users
for each row execute function hm_private.hm_handle_new_teacher();

insert into public.hm_profiles(id, display_name)
select
  users.id,
  left(
    case
      when char_length(trim(coalesce(
        users.raw_user_meta_data ->> 'display_name',
        split_part(coalesce(users.email, 'Enseignant'), '@', 1)
      ))) >= 2
        then trim(coalesce(
          users.raw_user_meta_data ->> 'display_name',
          split_part(coalesce(users.email, 'Enseignant'), '@', 1)
        ))
      else 'Enseignant'
    end,
    80
  )
from auth.users
on conflict (id) do nothing;

create or replace function hm_private.hm_generate_class_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text := '';
  v_index integer;
begin
  for v_index in 1..6 loop
    v_code := v_code || substr(
      v_alphabet,
      1 + floor(random() * char_length(v_alphabet))::integer,
      1
    );
  end loop;
  return v_code;
end;
$$;

create or replace function hm_private.hm_student_id_from_token(p_session_token text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select sessions.student_id
  from hm_private.hm_student_sessions as sessions
  join public.hm_students as students on students.id = sessions.student_id
  where sessions.token_hash = extensions.digest(p_session_token, 'sha256')
    and sessions.expires_at > now()
    and students.active = true
  limit 1;
$$;

create or replace function hm_private.hm_student_snapshot(p_student_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'identity',
    jsonb_build_object(
      'id', students.id,
      'displayName', students.display_name,
      'login', students.login,
      'classId', classes.id,
      'className', classes.name,
      'classCode', classes.code
    ),
    'progressStore',
    coalesce(
      (
        select jsonb_object_agg(progress.chapter_id, progress.progress_data)
        from public.hm_student_progress as progress
        where progress.student_id = students.id
      ),
      '{}'::jsonb
    )
  )
  from public.hm_students as students
  join public.hm_classes as classes on classes.id = students.class_id
  where students.id = p_student_id
    and students.active = true;
$$;

alter table public.hm_profiles enable row level security;
alter table public.hm_classes enable row level security;
alter table public.hm_students enable row level security;
alter table public.hm_student_progress enable row level security;

drop policy if exists "hm teacher reads own profile" on public.hm_profiles;
create policy "hm teacher reads own profile"
on public.hm_profiles for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "hm teacher updates own profile" on public.hm_profiles;
create policy "hm teacher updates own profile"
on public.hm_profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "hm teacher reads own classes" on public.hm_classes;
create policy "hm teacher reads own classes"
on public.hm_classes for select
to authenticated
using ((select auth.uid()) = teacher_id);

drop policy if exists "hm teacher reads own students" on public.hm_students;
create policy "hm teacher reads own students"
on public.hm_students for select
to authenticated
using (
  class_id in (
    select classes.id
    from public.hm_classes as classes
    where classes.teacher_id = (select auth.uid())
  )
);

drop policy if exists "hm teacher reads own progress" on public.hm_student_progress;
create policy "hm teacher reads own progress"
on public.hm_student_progress for select
to authenticated
using (
  student_id in (
    select students.id
    from public.hm_students as students
    join public.hm_classes as classes on classes.id = students.class_id
    where classes.teacher_id = (select auth.uid())
  )
);

revoke all on public.hm_profiles from anon, authenticated;
revoke all on public.hm_classes from anon, authenticated;
revoke all on public.hm_students from anon, authenticated;
revoke all on public.hm_student_progress from anon, authenticated;

grant select, update(display_name) on public.hm_profiles to authenticated;
grant select on public.hm_classes to authenticated;
grant select on public.hm_students to authenticated;
grant select on public.hm_student_progress to authenticated;

create or replace function public.hm_create_class(
  p_name text,
  p_level text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_teacher_id uuid := auth.uid();
  v_class_id uuid;
  v_code text;
  v_created_at timestamptz;
  v_attempt integer;
begin
  if v_teacher_id is null then
    return jsonb_build_object('ok', false, 'error', 'Connexion enseignante requise.');
  end if;
  if char_length(trim(p_name)) not between 2 and 80 then
    return jsonb_build_object('ok', false, 'error', 'Le nom de classe doit contenir entre 2 et 80 caractères.');
  end if;
  if p_level not in ('seconde', 'premiere', 'terminale', 'mixte') then
    return jsonb_build_object('ok', false, 'error', 'Niveau de classe incorrect.');
  end if;

  for v_attempt in 1..25 loop
    begin
      v_code := hm_private.hm_generate_class_code();
      insert into public.hm_classes(teacher_id, name, code, level)
      values (v_teacher_id, trim(p_name), v_code, p_level)
      returning id, created_at into v_class_id, v_created_at;
      exit;
    exception when unique_violation then
      v_class_id := null;
    end;
  end loop;

  if v_class_id is null then
    return jsonb_build_object('ok', false, 'error', 'Le code de classe n’a pas pu être généré. Réessayez.');
  end if;

  return jsonb_build_object(
    'ok', true,
    'value', jsonb_build_object(
      'id', v_class_id,
      'name', trim(p_name),
      'code', v_code,
      'level', p_level,
      'createdAt', v_created_at
    )
  );
end;
$$;

create or replace function public.hm_rename_class(
  p_class_id uuid,
  p_name text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if char_length(trim(p_name)) not between 2 and 80 then
    return jsonb_build_object('ok', false, 'error', 'Le nom de classe doit contenir entre 2 et 80 caractères.');
  end if;

  update public.hm_classes
  set name = trim(p_name)
  where id = p_class_id and teacher_id = auth.uid();

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Classe introuvable.');
  end if;
  return jsonb_build_object('ok', true, 'value', jsonb_build_object('updated', true));
end;
$$;

create or replace function public.hm_delete_class(p_class_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.hm_classes
  where id = p_class_id and teacher_id = auth.uid();

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Classe introuvable.');
  end if;
  return jsonb_build_object('ok', true, 'value', jsonb_build_object('deleted', true));
end;
$$;

create or replace function public.hm_create_student(
  p_class_id uuid,
  p_display_name text,
  p_login text,
  p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_student_id uuid;
  v_created_at timestamptz;
  v_login text := lower(trim(p_login));
  v_display_name text := trim(p_display_name);
begin
  if not exists (
    select 1 from public.hm_classes
    where id = p_class_id and teacher_id = auth.uid()
  ) then
    return jsonb_build_object('ok', false, 'error', 'Classe introuvable.');
  end if;
  if char_length(v_display_name) not between 2 and 40 then
    return jsonb_build_object('ok', false, 'error', 'Le pseudonyme doit contenir entre 2 et 40 caractères.');
  end if;
  if v_login !~ '^[a-z0-9][a-z0-9._-]{2,23}$' then
    return jsonb_build_object('ok', false, 'error', 'L’identifiant doit contenir 3 à 24 lettres, chiffres, points, tirets ou tirets bas.');
  end if;
  if char_length(p_password) not between 6 and 72 then
    return jsonb_build_object('ok', false, 'error', 'Le mot de passe élève doit contenir entre 6 et 72 caractères.');
  end if;

  begin
    insert into public.hm_students(class_id, display_name, login)
    values (p_class_id, v_display_name, v_login)
    returning id, created_at into v_student_id, v_created_at;

    insert into hm_private.hm_student_credentials(student_id, password_hash)
    values (
      v_student_id,
      extensions.crypt(p_password, extensions.gen_salt('bf', 10))
    );
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'error', 'Cet identifiant est déjà utilisé dans la classe.');
  end;

  return jsonb_build_object(
    'ok', true,
    'value', jsonb_build_object(
      'id', v_student_id,
      'classId', p_class_id,
      'displayName', v_display_name,
      'login', v_login,
      'active', true,
      'lastLoginAt', null,
      'createdAt', v_created_at
    )
  );
end;
$$;

create or replace function public.hm_reset_student_password(
  p_student_id uuid,
  p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if char_length(p_password) not between 6 and 72 then
    return jsonb_build_object('ok', false, 'error', 'Le mot de passe élève doit contenir entre 6 et 72 caractères.');
  end if;
  if not exists (
    select 1
    from public.hm_students as students
    join public.hm_classes as classes on classes.id = students.class_id
    where students.id = p_student_id and classes.teacher_id = auth.uid()
  ) then
    return jsonb_build_object('ok', false, 'error', 'Élève introuvable.');
  end if;

  update hm_private.hm_student_credentials
  set password_hash = extensions.crypt(
        p_password,
        extensions.gen_salt('bf', 10)
      ),
      updated_at = now()
  where student_id = p_student_id;

  delete from hm_private.hm_student_sessions
  where student_id = p_student_id;

  return jsonb_build_object('ok', true, 'value', jsonb_build_object('updated', true));
end;
$$;

create or replace function public.hm_clear_student_progress(p_student_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.hm_students as students
    join public.hm_classes as classes on classes.id = students.class_id
    where students.id = p_student_id and classes.teacher_id = auth.uid()
  ) then
    return jsonb_build_object('ok', false, 'error', 'Élève introuvable.');
  end if;

  delete from public.hm_student_progress where student_id = p_student_id;
  return jsonb_build_object('ok', true, 'value', jsonb_build_object('cleared', true));
end;
$$;

create or replace function public.hm_delete_student(p_student_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.hm_students as students
  using public.hm_classes as classes
  where students.id = p_student_id
    and classes.id = students.class_id
    and classes.teacher_id = auth.uid();

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Élève introuvable.');
  end if;
  return jsonb_build_object('ok', true, 'value', jsonb_build_object('deleted', true));
end;
$$;

create or replace function public.hm_student_login(
  p_class_code text,
  p_login text,
  p_password text,
  p_session_token text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_login text := lower(trim(p_login));
  v_class_code text := upper(trim(p_class_code));
  v_login_key text := v_class_code || ':' || v_login;
  v_student_id uuid;
  v_password_hash text;
  v_locked_until timestamptz;
begin
  if v_class_code !~ '^[A-Z2-9]{6}$'
    or v_login !~ '^[a-z0-9][a-z0-9._-]{2,23}$'
    or p_session_token !~ '^[a-f0-9]{64}$'
  then
    return jsonb_build_object('ok', false, 'error', 'Identifiants incorrects.');
  end if;

  delete from hm_private.hm_student_sessions where expires_at <= now();
  delete from hm_private.hm_login_attempts
  where updated_at < now() - interval '24 hours';

  select attempts.locked_until
  into v_locked_until
  from hm_private.hm_login_attempts as attempts
  where attempts.login_key = v_login_key;

  if v_locked_until is not null and v_locked_until > now() then
    return jsonb_build_object(
      'ok', false,
      'error', 'Trop de tentatives. Réessayez dans quelques minutes.'
    );
  end if;

  select students.id, credentials.password_hash
  into v_student_id, v_password_hash
  from public.hm_students as students
  join public.hm_classes as classes on classes.id = students.class_id
  join hm_private.hm_student_credentials as credentials
    on credentials.student_id = students.id
  where classes.code = v_class_code
    and students.login = v_login
    and students.active = true;

  if v_student_id is null
    or extensions.crypt(p_password, v_password_hash) <> v_password_hash
  then
    insert into hm_private.hm_login_attempts(
      login_key, attempts, locked_until, updated_at
    )
    values (v_login_key, 1, null, now())
    on conflict (login_key) do update
    set attempts = case
          when hm_private.hm_login_attempts.locked_until <= now() then 1
          else hm_private.hm_login_attempts.attempts + 1
        end,
        locked_until = case
          when (
            case
              when hm_private.hm_login_attempts.locked_until <= now() then 1
              else hm_private.hm_login_attempts.attempts + 1
            end
          ) >= 5
          then now() + interval '15 minutes'
          else null
        end,
        updated_at = now();

    return jsonb_build_object('ok', false, 'error', 'Identifiants incorrects.');
  end if;

  delete from hm_private.hm_login_attempts where login_key = v_login_key;
  insert into hm_private.hm_student_sessions(
    token_hash, student_id, expires_at
  )
  values (
    extensions.digest(p_session_token, 'sha256'),
    v_student_id,
    now() + interval '30 days'
  )
  on conflict (token_hash) do update
  set student_id = excluded.student_id,
      expires_at = excluded.expires_at,
      last_seen_at = now();

  update public.hm_students
  set last_login_at = now()
  where id = v_student_id;

  return jsonb_build_object(
    'ok', true,
    'value', hm_private.hm_student_snapshot(v_student_id)
  );
end;
$$;

create or replace function public.hm_student_restore(p_session_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_student_id uuid;
begin
  if p_session_token !~ '^[a-f0-9]{64}$' then
    return jsonb_build_object('ok', false, 'error', 'Session invalide.');
  end if;

  v_student_id := hm_private.hm_student_id_from_token(p_session_token);
  if v_student_id is null then
    return jsonb_build_object('ok', false, 'error', 'Session expirée.');
  end if;

  update hm_private.hm_student_sessions
  set last_seen_at = now()
  where token_hash = extensions.digest(p_session_token, 'sha256');

  return jsonb_build_object(
    'ok', true,
    'value', hm_private.hm_student_snapshot(v_student_id)
  );
end;
$$;

create or replace function public.hm_student_save_all_progress(
  p_session_token text,
  p_progress_store jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_student_id uuid;
  v_chapter_id text;
  v_progress jsonb;
begin
  v_student_id := hm_private.hm_student_id_from_token(p_session_token);
  if v_student_id is null then
    return jsonb_build_object('ok', false, 'error', 'Session expirée.');
  end if;
  if jsonb_typeof(p_progress_store) <> 'object'
    or octet_length(p_progress_store::text) > 524288
  then
    return jsonb_build_object('ok', false, 'error', 'Progression invalide.');
  end if;
  if exists (
    select 1
    from jsonb_each(p_progress_store) as item
    left join hm_private.hm_valid_chapters as valid
      on valid.chapter_id = item.key
    where valid.chapter_id is null or jsonb_typeof(item.value) <> 'object'
  ) then
    return jsonb_build_object('ok', false, 'error', 'Un chapitre de la progression est invalide.');
  end if;

  delete from public.hm_student_progress
  where student_id = v_student_id
    and not (p_progress_store ? chapter_id);

  for v_chapter_id, v_progress in
    select item.key, item.value from jsonb_each(p_progress_store) as item
  loop
    insert into public.hm_student_progress(
      student_id, chapter_id, progress_data, updated_at
    )
    values (v_student_id, v_chapter_id, v_progress, now())
    on conflict (student_id, chapter_id) do update
    set progress_data = excluded.progress_data,
        updated_at = excluded.updated_at;
  end loop;

  update hm_private.hm_student_sessions
  set last_seen_at = now()
  where token_hash = extensions.digest(p_session_token, 'sha256');

  return jsonb_build_object(
    'ok', true,
    'value', jsonb_build_object('syncedAt', now())
  );
end;
$$;

create or replace function public.hm_student_logout(p_session_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_session_token ~ '^[a-f0-9]{64}$' then
    delete from hm_private.hm_student_sessions
    where token_hash = extensions.digest(p_session_token, 'sha256');
  end if;
  return jsonb_build_object('ok', true, 'value', jsonb_build_object('signedOut', true));
end;
$$;

create or replace function public.hm_student_delete_my_account(
  p_session_token text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_student_id uuid;
begin
  v_student_id := hm_private.hm_student_id_from_token(p_session_token);
  if v_student_id is null then
    return jsonb_build_object('ok', false, 'error', 'Session expirée.');
  end if;

  delete from public.hm_students where id = v_student_id;
  return jsonb_build_object('ok', true, 'value', jsonb_build_object('deleted', true));
end;
$$;

revoke execute on function public.hm_create_class(text, text) from public;
revoke execute on function public.hm_rename_class(uuid, text) from public;
revoke execute on function public.hm_delete_class(uuid) from public;
revoke execute on function public.hm_create_student(uuid, text, text, text) from public;
revoke execute on function public.hm_reset_student_password(uuid, text) from public;
revoke execute on function public.hm_clear_student_progress(uuid) from public;
revoke execute on function public.hm_delete_student(uuid) from public;
revoke execute on function public.hm_student_login(text, text, text, text) from public;
revoke execute on function public.hm_student_restore(text) from public;
revoke execute on function public.hm_student_save_all_progress(text, jsonb) from public;
revoke execute on function public.hm_student_logout(text) from public;
revoke execute on function public.hm_student_delete_my_account(text) from public;

grant execute on function public.hm_create_class(text, text) to authenticated;
grant execute on function public.hm_rename_class(uuid, text) to authenticated;
grant execute on function public.hm_delete_class(uuid) to authenticated;
grant execute on function public.hm_create_student(uuid, text, text, text) to authenticated;
grant execute on function public.hm_reset_student_password(uuid, text) to authenticated;
grant execute on function public.hm_clear_student_progress(uuid) to authenticated;
grant execute on function public.hm_delete_student(uuid) to authenticated;

grant execute on function public.hm_student_login(text, text, text, text)
  to anon, authenticated;
grant execute on function public.hm_student_restore(text)
  to anon, authenticated;
grant execute on function public.hm_student_save_all_progress(text, jsonb)
  to anon, authenticated;
grant execute on function public.hm_student_logout(text)
  to anon, authenticated;
grant execute on function public.hm_student_delete_my_account(text)
  to anon, authenticated;
