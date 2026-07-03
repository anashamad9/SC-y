-- Course badge PNG assets and course-to-badge assignment.

alter table badges
  add column if not exists image_url text,
  add column if not exists image_file_name text,
  add column if not exists image_size_bytes integer;

alter table courses
  add column if not exists badge_id integer;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'courses_badge_id_badges_id_fk'
  ) then
    alter table courses
      add constraint courses_badge_id_badges_id_fk
      foreign key (badge_id) references badges(id) on delete set null;
  end if;
end $$;

create index if not exists courses_badge_id_idx on courses(badge_id);
