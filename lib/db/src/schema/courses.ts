import { pgTable, text, serial, timestamp, integer, boolean, real, bigint, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { badgesTable } from "./gamification";

export const courseModulesTable = pgTable("course_modules", {
  id: serial("id").primaryKey(),
  badgeId: integer("badge_id").references(() => badgesTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  titleEn: text("title_en"),
  titleAr: text("title_ar"),
  description: text("description"),
  descriptionEn: text("description_en"),
  descriptionAr: text("description_ar"),
  difficulty: text("difficulty").notNull().default("beginner"),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const coursesTable = pgTable("courses", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").references(() => courseModulesTable.id, { onDelete: "cascade" }),
  badgeId: integer("badge_id").references(() => badgesTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  titleEn: text("title_en"),
  titleAr: text("title_ar"),
  category: text("category").notNull(),
  description: text("description").notNull(),
  descriptionEn: text("description_en"),
  descriptionAr: text("description_ar"),
  videoUrl: text("video_url"),
  videoFileName: text("video_file_name"),
  videoMimeType: text("video_mime_type"),
  videoSizeBytes: bigint("video_size_bytes", { mode: "number" }),
  videoUploadedAt: timestamp("video_uploaded_at", { withTimezone: true }),
  markdownUrl: text("markdown_url"),
  markdownFileName: text("markdown_file_name"),
  markdownContent: text("markdown_content"),
  markdownContentEn: text("markdown_content_en"),
  markdownContentAr: text("markdown_content_ar"),
  markdownSizeBytes: bigint("markdown_size_bytes", { mode: "number" }),
  markdownUploadedAt: timestamp("markdown_uploaded_at", { withTimezone: true }),
  markdownSections: jsonb("markdown_sections").$type<Array<{
    id: string;
    title: string;
    fileName?: string | null;
    content?: string | null;
    url?: string | null;
    sizeBytes?: number | null;
    uploadedAt?: string | null;
  }>>().notNull().default([]),
  minScore: integer("min_score"),
  maxScore: integer("max_score"),
  thumbnailColor: text("thumbnail_color").notNull().default("#dc143c"),
  durationMinutes: integer("duration_minutes").notNull().default(30),
  xpReward: integer("xp_reward").notNull().default(100),
  difficulty: text("difficulty").notNull().default("intermediate"),
  lessonCount: integer("lesson_count").notNull().default(4),
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const lessonsTable = pgTable("lessons", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => coursesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  titleEn: text("title_en"),
  titleAr: text("title_ar"),
  type: text("type").notNull().default("video"),
  content: text("content"),
  contentEn: text("content_en"),
  contentAr: text("content_ar"),
  xpReward: integer("xp_reward").notNull().default(25),
  displayOrder: integer("display_order").notNull().default(0),
});

export const userCourseProgressTable = pgTable("user_course_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  courseId: integer("course_id").notNull().references(() => coursesTable.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("not_started"),
  progressPct: real("progress_pct").notNull().default(0),
  xpEarned: integer("xp_earned").notNull().default(0),
  lastLessonId: integer("last_lesson_id").references(() => lessonsTable.id, { onDelete: "set null" }),
  completedMarkdownSections: jsonb("completed_markdown_sections").$type<string[]>().notNull().default([]),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Course = typeof coursesTable.$inferSelect;
export type CourseModule = typeof courseModulesTable.$inferSelect;
export type Lesson = typeof lessonsTable.$inferSelect;
export type UserCourseProgress = typeof userCourseProgressTable.$inferSelect;
