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
      'classCode', classes.code,
      'classLevel', classes.level
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
