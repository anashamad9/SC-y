import { pgTable, serial, integer, varchar, real, jsonb, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const telemetryEventsTable = pgTable("telemetry_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  eventType: varchar("event_type", { length: 50 }).notNull(),
  assessmentId: integer("assessment_id"),
  questionId: integer("question_id"),
  decisionLatencyMs: integer("decision_latency_ms"),
  confidenceRating: real("confidence_rating"),
  attentionScore: real("attention_score"),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type TelemetryEvent = typeof telemetryEventsTable.$inferSelect;
