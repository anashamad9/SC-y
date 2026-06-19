import { pgTable, serial, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const gamificationProfilesTable = pgTable("gamification_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id).unique(),
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  streakDays: integer("streak_days").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  currentLevelXp: integer("current_level_xp").notNull().default(0),
  nextLevelXp: integer("next_level_xp").notNull().default(200),
  totalAssessmentsCompleted: integer("total_assessments_completed").notNull().default(0),
  totalCoursesCompleted: integer("total_courses_completed").notNull().default(0),
  lastActivityAt: timestamp("last_activity_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const badgesTable = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  iconName: text("icon_name").notNull(),
  category: text("category").notNull(),
  xpRequired: integer("xp_required").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const userBadgesTable = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  badgeId: integer("badge_id").notNull().references(() => badgesTable.id),
  earnedAt: timestamp("earned_at", { withTimezone: true }).notNull().defaultNow(),
});

export type GamificationProfile = typeof gamificationProfilesTable.$inferSelect;
export type Badge = typeof badgesTable.$inferSelect;
export type UserBadge = typeof userBadgesTable.$inferSelect;
