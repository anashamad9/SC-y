import { pgTable, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const cciSnapshotsTable = pgTable("cci_snapshots", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  cciScore: real("cci_score").notNull(),
  humanRiskScore: real("human_risk_score").notNull(),
  behavioralStabilityScore: real("behavioral_stability_score").notNull(),
  decisionQualityScore: real("decision_quality_score").notNull(),
  cultureContributionScore: real("culture_contribution_score").notNull(),
  complianceBehaviorScore: real("compliance_behavior_score").notNull(),
  computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CciSnapshot = typeof cciSnapshotsTable.$inferSelect;
