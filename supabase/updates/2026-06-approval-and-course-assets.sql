alter table users
  add column if not exists approval_status text not null default 'approved',
  add column if not exists approved_by integer,
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_at timestamptz;

update users
set approval_status = 'approved'
where approval_status is null;

alter table users
  alter column approval_status set default 'pending';

create index if not exists users_approval_status_idx on users (approval_status);

alter table courses
  add column if not exists video_url text,
  add column if not exists video_file_name text,
  add column if not exists video_mime_type text,
  add column if not exists video_size_bytes bigint,
  add column if not exists video_uploaded_at timestamptz,
  add column if not exists markdown_url text,
  add column if not exists markdown_file_name text,
  add column if not exists markdown_content text,
  add column if not exists markdown_size_bytes bigint,
  add column if not exists markdown_uploaded_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'courses_video_size_max_2gb'
  ) then
    alter table courses
      add constraint courses_video_size_max_2gb
      check (video_size_bytes is null or video_size_bytes <= 2147483648);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'courses_markdown_file_name_md'
  ) then
    alter table courses
      add constraint courses_markdown_file_name_md
      check (markdown_file_name is null or lower(markdown_file_name) ~ '\.mdx?$');
  end if;
end $$;
