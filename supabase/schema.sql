-- CyberCultX Supabase schema
-- Paste this into the Supabase SQL editor for a new project.
-- The app uses the server-side DATABASE_URL connection string, not client-side Supabase auth.

create schema if not exists public;
set search_path = public;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists departments (
  id serial primary key,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists users (
  id serial primary key,
  email text not null unique,
  password_hash text not null,
  first_name text not null,
  last_name text not null,
  role text not null default 'employee',
  department_id integer references departments(id),
  avatar_url text,
  job_title text,
  onboarding_completed boolean not null default false,
  mfa_enabled boolean not null default false,
  mfa_secret text,
  failed_login_attempts integer not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sessions (
  id serial primary key,
  user_id integer not null references users(id),
  token text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id serial primary key,
  user_id integer references users(id),
  action text not null,
  ip_address text,
  user_agent text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists courses (
  id serial primary key,
  title text not null,
  category text not null,
  description text not null,
  video_url text,
  min_score integer,
  max_score integer,
  thumbnail_color text not null default '#dc143c',
  duration_minutes integer not null default 30,
  xp_reward integer not null default 100,
  difficulty text not null default 'intermediate',
  lesson_count integer not null default 4,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists lessons (
  id serial primary key,
  course_id integer not null references courses(id),
  title text not null,
  type text not null default 'video',
  content text,
  xp_reward integer not null default 25,
  display_order integer not null default 0
);

create table if not exists user_course_progress (
  id serial primary key,
  user_id integer not null references users(id),
  course_id integer not null references courses(id),
  status text not null default 'not_started',
  progress_pct real not null default 0,
  xp_earned integer not null default 0,
  last_lesson_id integer,
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists assessments (
  id serial primary key,
  type text not null,
  title text not null,
  description text not null,
  estimated_minutes integer not null default 15,
  created_at timestamptz not null default now()
);

create table if not exists assessment_questions (
  id serial primary key,
  assessment_id integer not null references assessments(id),
  text text not null,
  category text not null,
  options jsonb not null,
  weight real not null default 1.0,
  display_order integer not null default 0
);

create table if not exists assessment_results (
  id serial primary key,
  user_id integer not null references users(id),
  assessment_id integer not null references assessments(id),
  answers jsonb not null,
  category_scores jsonb not null,
  overall_score real not null,
  time_taken_sec integer,
  completed_at timestamptz not null default now()
);

create table if not exists psychometric_profiles (
  id serial primary key,
  user_id integer not null unique references users(id),
  risk_tolerance real not null default 50,
  impulsiveness real not null default 50,
  security_awareness real not null default 50,
  decision_making real not null default 50,
  attention_to_detail real not null default 50,
  trust_tendencies real not null default 50,
  stress_response real not null default 50,
  compliance_behavior real not null default 50,
  behavioral_type text not null default 'Balanced Operative',
  learning_style text not null default 'Visual Learner',
  risk_category text not null default 'Medium',
  security_readiness_score real not null default 50,
  updated_at timestamptz not null default now()
);

create table if not exists gamification_profiles (
  id serial primary key,
  user_id integer not null unique references users(id),
  xp integer not null default 0,
  level integer not null default 1,
  streak_days integer not null default 0,
  longest_streak integer not null default 0,
  current_level_xp integer not null default 0,
  next_level_xp integer not null default 200,
  total_assessments_completed integer not null default 0,
  total_courses_completed integer not null default 0,
  last_activity_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table gamification_profiles add column if not exists longest_streak integer not null default 0;
alter table gamification_profiles add column if not exists current_level_xp integer not null default 0;
alter table gamification_profiles add column if not exists next_level_xp integer not null default 200;
alter table gamification_profiles add column if not exists total_assessments_completed integer not null default 0;
alter table gamification_profiles add column if not exists total_courses_completed integer not null default 0;

alter table courses add column if not exists video_url text;
alter table courses add column if not exists min_score integer;
alter table courses add column if not exists max_score integer;

create table if not exists badges (
  id serial primary key,
  name text not null unique,
  description text not null,
  icon_name text not null,
  category text not null,
  xp_required integer not null default 0,
  is_active boolean not null default true
);

create table if not exists user_badges (
  id serial primary key,
  user_id integer not null references users(id),
  badge_id integer not null references badges(id),
  earned_at timestamptz not null default now()
);

create table if not exists cci_snapshots (
  id serial primary key,
  user_id integer not null references users(id),
  cci_score real not null,
  human_risk_score real not null,
  behavioral_stability_score real not null,
  decision_quality_score real not null,
  culture_contribution_score real not null,
  compliance_behavior_score real not null,
  computed_at timestamptz not null default now()
);

create table if not exists telemetry_events (
  id serial primary key,
  user_id integer not null references users(id),
  event_type varchar(50) not null,
  assessment_id integer,
  question_id integer,
  decision_latency_ms integer,
  confidence_rating real,
  attention_score real,
  payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists phishing_templates (
  id serial primary key,
  name text not null,
  type text not null,
  subject text,
  body text not null,
  attachment_desc text,
  difficulty integer not null default 3,
  language text not null default 'en',
  industry text not null default 'general',
  category text not null default 'general',
  is_ai_generated integer not null default 0,
  tags text,
  created_at timestamptz not null default now()
);

create table if not exists phishing_campaigns (
  id serial primary key,
  name text not null,
  description text,
  status text not null default 'draft',
  template_id integer references phishing_templates(id),
  target_audience jsonb,
  difficulty integer not null default 3,
  scheduled_at timestamptz,
  completed_at timestamptz,
  created_by integer references users(id),
  total_targeted integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists phishing_results (
  id serial primary key,
  campaign_id integer not null references phishing_campaigns(id),
  user_id integer not null references users(id),
  sent_at timestamptz not null default now(),
  opened_at timestamptz,
  clicked_at timestamptz,
  credential_submitted_at timestamptz,
  reported_at timestamptz,
  training_completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists report_jobs (
  id serial primary key,
  type text not null,
  status text not null default 'pending',
  created_by integer references users(id),
  filters jsonb,
  format text not null default 'pdf',
  file_url text,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists tenants (
  id serial primary key,
  name text not null,
  domain text not null unique,
  plan text not null default 'starter',
  status text not null default 'trial',
  employee_count integer not null default 0,
  admin_email text not null,
  industry text,
  country text default 'UAE',
  license_expiry timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists system_config (
  id serial primary key,
  key text not null unique,
  value text,
  description text,
  category text not null default 'general',
  updated_at timestamptz not null default now(),
  updated_by integer references users(id)
);

create index if not exists users_department_id_idx on users(department_id);
create index if not exists users_role_idx on users(role);
create index if not exists sessions_user_id_idx on sessions(user_id);
create index if not exists sessions_expires_at_idx on sessions(expires_at);
create index if not exists audit_logs_user_id_idx on audit_logs(user_id);
create index if not exists audit_logs_created_at_idx on audit_logs(created_at desc);
create index if not exists lessons_course_id_idx on lessons(course_id);
create index if not exists user_course_progress_user_id_idx on user_course_progress(user_id);
create index if not exists user_course_progress_course_id_idx on user_course_progress(course_id);
create index if not exists assessment_questions_assessment_id_idx on assessment_questions(assessment_id);
create index if not exists assessment_results_user_id_idx on assessment_results(user_id);
create index if not exists assessment_results_assessment_id_idx on assessment_results(assessment_id);
create index if not exists cci_snapshots_user_id_idx on cci_snapshots(user_id);
create index if not exists cci_snapshots_computed_at_idx on cci_snapshots(computed_at desc);
create index if not exists telemetry_events_user_id_idx on telemetry_events(user_id);
create index if not exists telemetry_events_created_at_idx on telemetry_events(created_at desc);
create index if not exists phishing_templates_language_idx on phishing_templates(language);
create index if not exists phishing_campaigns_status_idx on phishing_campaigns(status);
create index if not exists phishing_results_campaign_id_idx on phishing_results(campaign_id);
create index if not exists phishing_results_user_id_idx on phishing_results(user_id);
create index if not exists report_jobs_created_by_idx on report_jobs(created_by);

drop trigger if exists departments_set_updated_at on departments;
create trigger departments_set_updated_at
before update on departments
for each row execute function public.set_updated_at();

drop trigger if exists users_set_updated_at on users;
create trigger users_set_updated_at
before update on users
for each row execute function public.set_updated_at();

drop trigger if exists user_course_progress_set_updated_at on user_course_progress;
create trigger user_course_progress_set_updated_at
before update on user_course_progress
for each row execute function public.set_updated_at();

drop trigger if exists psychometric_profiles_set_updated_at on psychometric_profiles;
create trigger psychometric_profiles_set_updated_at
before update on psychometric_profiles
for each row execute function public.set_updated_at();

drop trigger if exists gamification_profiles_set_updated_at on gamification_profiles;
create trigger gamification_profiles_set_updated_at
before update on gamification_profiles
for each row execute function public.set_updated_at();

drop trigger if exists phishing_campaigns_set_updated_at on phishing_campaigns;
create trigger phishing_campaigns_set_updated_at
before update on phishing_campaigns
for each row execute function public.set_updated_at();

drop trigger if exists tenants_set_updated_at on tenants;
create trigger tenants_set_updated_at
before update on tenants
for each row execute function public.set_updated_at();

drop trigger if exists system_config_set_updated_at on system_config;
create trigger system_config_set_updated_at
before update on system_config
for each row execute function public.set_updated_at();
