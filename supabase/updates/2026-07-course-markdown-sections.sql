-- Multiple Markdown/MDX sections per course, plus per-user section completion.

alter table courses
  add column if not exists markdown_sections jsonb not null default '[]'::jsonb;

alter table user_course_progress
  add column if not exists completed_markdown_sections jsonb not null default '[]'::jsonb;

do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'courses_markdown_file_name_md'
  ) then
    alter table courses drop constraint courses_markdown_file_name_md;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'courses_markdown_file_name_mdx'
  ) then
    alter table courses
      add constraint courses_markdown_file_name_mdx
      check (markdown_file_name is null or lower(markdown_file_name) ~ '\.mdx?$');
  end if;
end $$;

update courses
set markdown_sections = jsonb_build_array(jsonb_build_object(
  'id', 'section-1',
  'title', coalesce(markdown_file_name, 'Course notes'),
  'fileName', markdown_file_name,
  'content', markdown_content,
  'url', markdown_url,
  'sizeBytes', markdown_size_bytes,
  'uploadedAt', markdown_uploaded_at
))
where markdown_sections = '[]'::jsonb
  and (markdown_file_name is not null or markdown_content is not null or markdown_url is not null);
