-- Course module deletion migration for existing CyberCultX Supabase databases.
--
-- Run this after 2026-06-course-modules.sql. It changes module deletion from
-- orphaning courses to deleting courses in that module, with course lessons and
-- progress removed by their existing course cascades.

begin;

do $$
declare
  constraint_name text;
begin
  select conname into constraint_name
  from pg_constraint
  where conrelid = 'courses'::regclass
    and confrelid = 'course_modules'::regclass
    and contype = 'f'
  limit 1;

  if constraint_name is not null then
    execute format('alter table courses drop constraint %I', constraint_name);
  end if;
end $$;

alter table courses
  add constraint courses_module_id_course_modules_id_fk
  foreign key (module_id) references course_modules(id) on delete cascade;

commit;
