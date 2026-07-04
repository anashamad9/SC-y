-- CyberCultX full Supabase schema reset
-- Use this when you do not need to preserve existing application records.
-- It drops and recreates the app tables in public, but does not drop Supabase auth/storage schemas.

create schema if not exists public;
set search_path = public;

drop table if exists
  system_config,
  tenants,
  report_jobs,
  phishing_results,
  phishing_campaigns,
  phishing_templates,
  telemetry_events,
  cci_snapshots,
  user_badges,
  badges,
  gamification_profiles,
  psychometric_profiles,
  assessment_results,
  assessment_questions,
  assessments,
  user_course_progress,
  lessons,
  courses,
  course_modules,
  audit_logs,
  sessions,
  users,
  departments
cascade;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table tenants (
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

create table departments (
  id serial primary key,
  tenant_id integer not null references tenants(id) on delete restrict,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table users (
  id serial primary key,
  email text not null unique,
  password_hash text not null,
  first_name text not null,
  last_name text not null,
  role text not null default 'employee'
    check (role in ('employee', 'executive', 'hr', 'admin', 'superadmin')),
  tenant_id integer references tenants(id) on delete restrict,
  department_id integer references departments(id),
  avatar_url text,
  job_title text,
  onboarding_completed boolean not null default false,
  approval_status text not null default 'pending'
    check (approval_status in ('pending', 'approved', 'rejected')),
  approved_by integer references users(id),
  approved_at timestamptz,
  rejected_at timestamptz,
  mfa_enabled boolean not null default false,
  mfa_secret text,
  failed_login_attempts integer not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table sessions (
  id serial primary key,
  user_id integer not null references users(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table audit_logs (
  id serial primary key,
  user_id integer references users(id) on delete set null,
  tenant_id integer references tenants(id) on delete set null,
  action text not null,
  ip_address text,
  user_agent text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table course_modules (
  id serial primary key,
  badge_id integer,
  title text not null,
  description text,
  difficulty text not null default 'beginner',
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table courses (
  id serial primary key,
  module_id integer references course_modules(id) on delete cascade,
  badge_id integer,
  title text not null,
  category text not null,
  description text not null,
  video_url text,
  video_file_name text,
  video_mime_type text,
  video_size_bytes bigint
    check (video_size_bytes is null or video_size_bytes <= 2147483648),
  video_uploaded_at timestamptz,
  markdown_url text,
  markdown_file_name text
    check (markdown_file_name is null or lower(markdown_file_name) ~ '\.mdx?$'),
  markdown_content text,
  markdown_size_bytes bigint,
  markdown_uploaded_at timestamptz,
  markdown_sections jsonb not null default '[]'::jsonb,
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

create table lessons (
  id serial primary key,
  course_id integer not null references courses(id) on delete cascade,
  title text not null,
  type text not null default 'video',
  content text,
  xp_reward integer not null default 25,
  display_order integer not null default 0
);

create table user_course_progress (
  id serial primary key,
  user_id integer not null references users(id) on delete cascade,
  course_id integer not null references courses(id) on delete cascade,
  status text not null default 'not_started',
  progress_pct real not null default 0,
  xp_earned integer not null default 0,
  last_lesson_id integer references lessons(id) on delete set null,
  completed_markdown_sections jsonb not null default '[]'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table assessments (
  id serial primary key,
  type text not null,
  title text not null,
  description text not null,
  estimated_minutes integer not null default 15,
  created_at timestamptz not null default now()
);

create table assessment_questions (
  id serial primary key,
  assessment_id integer not null references assessments(id) on delete cascade,
  text text not null,
  category text not null,
  options jsonb not null,
  weight real not null default 1.0,
  display_order integer not null default 0
);

create table assessment_results (
  id serial primary key,
  user_id integer not null references users(id) on delete cascade,
  assessment_id integer not null references assessments(id) on delete cascade,
  answers jsonb not null,
  category_scores jsonb not null,
  overall_score real not null,
  time_taken_sec integer,
  completed_at timestamptz not null default now()
);

create table psychometric_profiles (
  id serial primary key,
  user_id integer not null unique references users(id) on delete cascade,
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

create table gamification_profiles (
  id serial primary key,
  user_id integer not null unique references users(id) on delete cascade,
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

create table badges (
  id serial primary key,
  name text not null unique,
  description text not null,
  icon_name text not null,
  image_url text,
  image_file_name text,
  image_size_bytes integer,
  category text not null,
  xp_required integer not null default 0,
  is_active boolean not null default true
);

create table user_badges (
  id serial primary key,
  user_id integer not null references users(id) on delete cascade,
  badge_id integer not null references badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

alter table courses
  add constraint courses_badge_id_badges_id_fk
  foreign key (badge_id) references badges(id) on delete set null;

alter table course_modules
  add constraint course_modules_badge_id_badges_id_fk
  foreign key (badge_id) references badges(id) on delete set null;

create table cci_snapshots (
  id serial primary key,
  user_id integer not null references users(id) on delete cascade,
  cci_score real not null,
  human_risk_score real not null,
  behavioral_stability_score real not null,
  decision_quality_score real not null,
  culture_contribution_score real not null,
  compliance_behavior_score real not null,
  computed_at timestamptz not null default now()
);

create table telemetry_events (
  id serial primary key,
  user_id integer not null references users(id) on delete cascade,
  event_type varchar(50) not null,
  assessment_id integer references assessments(id) on delete set null,
  question_id integer references assessment_questions(id) on delete set null,
  decision_latency_ms integer,
  confidence_rating real,
  attention_score real,
  payload jsonb,
  created_at timestamptz not null default now()
);

create table phishing_templates (
  id serial primary key,
  tenant_id integer not null references tenants(id) on delete restrict,
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

create table phishing_campaigns (
  id serial primary key,
  tenant_id integer not null references tenants(id) on delete restrict,
  name text not null,
  description text,
  status text not null default 'draft',
  template_id integer references phishing_templates(id) on delete set null,
  target_audience jsonb,
  difficulty integer not null default 3,
  scheduled_at timestamptz,
  completed_at timestamptz,
  created_by integer references users(id) on delete set null,
  total_targeted integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table phishing_results (
  id serial primary key,
  campaign_id integer not null references phishing_campaigns(id) on delete cascade,
  user_id integer not null references users(id) on delete cascade,
  sent_at timestamptz not null default now(),
  opened_at timestamptz,
  clicked_at timestamptz,
  credential_submitted_at timestamptz,
  reported_at timestamptz,
  training_completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (campaign_id, user_id)
);

create table report_jobs (
  id serial primary key,
  tenant_id integer not null references tenants(id) on delete restrict,
  type text not null,
  status text not null default 'pending',
  created_by integer references users(id) on delete set null,
  filters jsonb,
  format text not null default 'pdf',
  file_url text,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table system_config (
  id serial primary key,
  key text not null unique,
  value text,
  description text,
  category text not null default 'general',
  updated_at timestamptz not null default now(),
  updated_by integer references users(id) on delete set null
);

alter table users
  add constraint users_non_superadmin_tenant_required
  check (lower(role) = 'superadmin' or tenant_id is not null);

create index users_department_id_idx on users(department_id);
create index users_tenant_id_idx on users(tenant_id);
create index users_tenant_role_idx on users(tenant_id, role);
create index users_role_idx on users(role);
create index users_approval_status_idx on users(approval_status);
create unique index departments_tenant_name_unique on departments (tenant_id, lower(name));
create index departments_tenant_id_idx on departments(tenant_id);
create index sessions_user_id_idx on sessions(user_id);
create index sessions_expires_at_idx on sessions(expires_at);
create index audit_logs_user_id_idx on audit_logs(user_id);
create index audit_logs_tenant_id_idx on audit_logs(tenant_id);
create index audit_logs_created_at_idx on audit_logs(created_at desc);
create index course_modules_is_active_idx on course_modules(is_active);
create index course_modules_display_order_idx on course_modules(display_order);
create index course_modules_badge_id_idx on course_modules(badge_id);
create index courses_module_id_idx on courses(module_id);
create index courses_badge_id_idx on courses(badge_id);
create index courses_is_active_idx on courses(is_active);
create index courses_score_range_idx on courses(min_score, max_score);
create index lessons_course_id_idx on lessons(course_id);
create index user_course_progress_user_id_idx on user_course_progress(user_id);
create index user_course_progress_course_id_idx on user_course_progress(course_id);
create index assessments_type_idx on assessments(type);
create index assessment_questions_assessment_id_idx on assessment_questions(assessment_id);
create index assessment_results_user_id_idx on assessment_results(user_id);
create index assessment_results_assessment_id_idx on assessment_results(assessment_id);
create index cci_snapshots_user_id_idx on cci_snapshots(user_id);
create index cci_snapshots_computed_at_idx on cci_snapshots(computed_at desc);
create index telemetry_events_user_id_idx on telemetry_events(user_id);
create index telemetry_events_created_at_idx on telemetry_events(created_at desc);
create index phishing_templates_tenant_id_idx on phishing_templates(tenant_id);
create index phishing_templates_language_idx on phishing_templates(language);
create index phishing_campaigns_tenant_id_idx on phishing_campaigns(tenant_id);
create index phishing_campaigns_status_idx on phishing_campaigns(status);
create index phishing_results_campaign_id_idx on phishing_results(campaign_id);
create index phishing_results_user_id_idx on phishing_results(user_id);
create index report_jobs_created_by_idx on report_jobs(created_by);
create index report_jobs_tenant_id_idx on report_jobs(tenant_id);
create index tenants_status_idx on tenants(status);
create index system_config_category_idx on system_config(category);

create trigger departments_set_updated_at
before update on departments
for each row execute function public.set_updated_at();

create trigger users_set_updated_at
before update on users
for each row execute function public.set_updated_at();

create trigger user_course_progress_set_updated_at
before update on user_course_progress
for each row execute function public.set_updated_at();

create trigger psychometric_profiles_set_updated_at
before update on psychometric_profiles
for each row execute function public.set_updated_at();

create trigger gamification_profiles_set_updated_at
before update on gamification_profiles
for each row execute function public.set_updated_at();

create trigger phishing_campaigns_set_updated_at
before update on phishing_campaigns
for each row execute function public.set_updated_at();

create trigger tenants_set_updated_at
before update on tenants
for each row execute function public.set_updated_at();

create trigger system_config_set_updated_at
before update on system_config
for each row execute function public.set_updated_at();
