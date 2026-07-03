-- The original inline check constraint on courses.markdown_file_name (auto-named
-- "courses_markdown_file_name_check" by Postgres) predates .mdx support and only
-- allowed ".md" files. It was never updated by the later markdown-sections migration,
-- which only added/dropped the separately-named "courses_markdown_file_name_md(x)"
-- constraints. Realign it with supabase/schema.sql so .mdx uploads are accepted.

do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'courses_markdown_file_name_check'
  ) then
    alter table courses drop constraint courses_markdown_file_name_check;
  end if;
end $$;

alter table courses
  add constraint courses_markdown_file_name_check
  check (markdown_file_name is null or lower(markdown_file_name) ~ '\.mdx?$');
