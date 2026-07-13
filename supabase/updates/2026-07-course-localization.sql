-- Course and lesson localization support for CyberCultX.
-- Run this after the existing July course migrations.

alter table course_modules
  add column if not exists title_en text,
  add column if not exists title_ar text,
  add column if not exists description_en text,
  add column if not exists description_ar text;

alter table courses
  add column if not exists title_en text,
  add column if not exists title_ar text,
  add column if not exists description_en text,
  add column if not exists description_ar text,
  add column if not exists markdown_content_en text,
  add column if not exists markdown_content_ar text;

alter table lessons
  add column if not exists title_en text,
  add column if not exists title_ar text,
  add column if not exists content_en text,
  add column if not exists content_ar text;

-- Preserve current behavior after the migration. Replace these copied values with
-- reviewed translations where English and Arabic content should differ.
update course_modules
set
  title_en = coalesce(title_en, title),
  title_ar = coalesce(title_ar, title),
  description_en = coalesce(description_en, description),
  description_ar = coalesce(description_ar, description);

update courses
set
  title_en = coalesce(title_en, title),
  title_ar = coalesce(title_ar, title),
  description_en = coalesce(description_en, description),
  description_ar = coalesce(description_ar, description),
  markdown_content_en = coalesce(markdown_content_en, markdown_content),
  markdown_content_ar = coalesce(markdown_content_ar, markdown_content);

update lessons
set
  title_en = coalesce(title_en, title),
  title_ar = coalesce(title_ar, title),
  content_en = coalesce(content_en, content),
  content_ar = coalesce(content_ar, content);
