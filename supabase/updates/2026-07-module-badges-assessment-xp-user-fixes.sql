-- Module badges, one-attempt readiness guard support, XP/user cleanup helpers.
-- Run this after the existing July course badge migrations.

alter table course_modules
  add column if not exists badge_id integer;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'course_modules_badge_id_badges_id_fk'
  ) then
    alter table course_modules
      add constraint course_modules_badge_id_badges_id_fk
      foreign key (badge_id) references badges(id) on delete set null;
  end if;
end $$;

create index if not exists course_modules_badge_id_idx on course_modules(badge_id);

-- If retakes already exist, keep the newest result so the unique guard can be added.
with ranked_results as (
  select
    id,
    row_number() over (
      partition by user_id, assessment_id
      order by completed_at desc, id desc
    ) as result_rank
  from assessment_results
)
delete from assessment_results ar
using ranked_results rr
where ar.id = rr.id
  and rr.result_rank > 1;

-- Keep future direct SQL inserts from creating duplicate readiness attempts.
do $$
begin
  if not exists (
    select 1 from pg_indexes where schemaname = 'public' and indexname = 'assessment_results_one_result_per_user_assessment_idx'
  ) then
    create unique index assessment_results_one_result_per_user_assessment_idx
      on assessment_results(user_id, assessment_id);
  end if;
end $$;

-- Backfill missing gamification rows so every existing user can earn XP.
insert into gamification_profiles (user_id)
select u.id
from users u
where not exists (
  select 1 from gamification_profiles gp where gp.user_id = u.id
);

-- Hide the old demo seed content that can make employees/AI see extra courses.
update courses
set is_active = false
where title in (
  'Phishing Recognition Essentials',
  'Password and MFA Habits',
  'Social Engineering Decision Checks',
  'Data Handling for Daily Work',
  'Incident Response for Employees',
  'Deepfake and Voice Scam Awareness'
);

update course_modules
set is_active = false
where title in (
  'Security Readiness Foundation',
  'Human Risk Reduction',
  'Advanced Cyber Culture',
  'Foundation Module'
)
and not exists (
  select 1
  from courses c
  where c.module_id = course_modules.id
    and c.is_active = true
);
