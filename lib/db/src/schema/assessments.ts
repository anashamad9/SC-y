import { pgTable, serial, text, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const assessmentsTable = pgTable("assessments", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  estimatedMinutes: integer("estimated_minutes").notNull().default(15),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const assessmentQuestionsTable = pgTable("assessment_questions", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull().references(() => assessmentsTable.id),
  text: text("text").notNull(),
  category: text("category").notNull(),
  options: jsonb("options").notNull(),
  weight: real("weight").notNull().default(1.0),
  displayOrder: integer("display_order").notNull().default(0),
});

export const assessmentResultsTable = pgTable("assessment_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  assessmentId: integer("assessment_id").notNull().references(() => assessmentsTable.id),
  answers: jsonb("answers").notNull(),
  categoryScores: jsonb("category_scores").notNull(),
  overallScore: real("overall_score").notNull(),
  timeTakenSec: integer("time_taken_sec"),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const psychometricProfilesTable = pgTable("psychometric_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id).unique(),
  riskTolerance: real("risk_tolerance").notNull().default(50),
  impulsiveness: real("impulsiveness").notNull().default(50),
  securityAwareness: real("security_awareness").notNull().default(50),
  decisionMaking: real("decision_making").notNull().default(50),
  attentionToDetail: real("attention_to_detail").notNull().default(50),
  trustTendencies: real("trust_tendencies").notNull().default(50),
  stressResponse: real("stress_response").notNull().default(50),
  complianceBehavior: real("compliance_behavior").notNull().default(50),
  behavioralType: text("behavioral_type").notNull().default("Balanced Operative"),
  learningStyle: text("learning_style").notNull().default("Visual Learner"),
  riskCategory: text("risk_category").notNull().default("Medium"),
  securityReadinessScore: real("security_readiness_score").notNull().default(50),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Assessment = typeof assessmentsTable.$inferSelect;
export type AssessmentQuestion = typeof assessmentQuestionsTable.$inferSelect;
export type AssessmentResult = typeof assessmentResultsTable.$inferSelect;
export type PsychometricProfile = typeof psychometricProfilesTable.$inferSelect;
