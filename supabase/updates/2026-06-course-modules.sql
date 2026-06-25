-- Course modules migration for existing CyberCultX Supabase databases.
--
-- Run this after taking a backup. It adds a module layer above courses so
-- superadmins create modules first, then add courses inside each module.

begin;

create table if not exists course_modules (
  id serial primary key,
  title text not null,
  description text,
  difficulty text not null default 'beginner',
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table courses
  add column if not exists module_id integer references course_modules(id) on delete set null;

insert into course_modules (title, description, difficulty, display_order)
select 'Foundation Module', 'Default module for existing courses.', 'beginner', 0
where not exists (select 1 from course_modules);

with fallback as (
  select id from course_modules order by display_order, id limit 1
)
update courses
set module_id = (select id from fallback)
where module_id is null;

create index if not exists course_modules_is_active_idx on course_modules(is_active);
create index if not exists course_modules_display_order_idx on course_modules(display_order);
create index if not exists courses_module_id_idx on courses(module_id);

commit;
