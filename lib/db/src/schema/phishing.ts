import { pgTable, serial, integer, text, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const phishingTemplatesTable = pgTable("phishing_templates", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // email | sms | qr | login | bec | invoice | deepfake
  subject: text("subject"),
  body: text("body").notNull(),
  attachmentDesc: text("attachment_desc"),
  difficulty: integer("difficulty").notNull().default(3), // 1-5
  language: text("language").notNull().default("en"), // en | ar
  industry: text("industry").notNull().default("general"),
  category: text("category").notNull().default("general"), // banking | government | hr | payroll | invoice | delivery | whatsapp | qr
  isAiGenerated: integer("is_ai_generated").notNull().default(0),
  tags: text("tags"), // comma-separated
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const phishingCampaignsTable = pgTable("phishing_campaigns", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"), // draft | active | paused | completed | archived
  templateId: integer("template_id").references(() => phishingTemplatesTable.id),
  targetAudience: jsonb("target_audience"), // { type: "all" | "department" | "users", ids?: number[] }
  difficulty: integer("difficulty").notNull().default(3),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdBy: integer("created_by").references(() => usersTable.id),
  totalTargeted: integer("total_targeted").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const phishingResultsTable = pgTable("phishing_results", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => phishingCampaignsTable.id).notNull(),
  userId: integer("user_id").references(() => usersTable.id).notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  openedAt: timestamp("opened_at", { withTimezone: true }),
  clickedAt: timestamp("clicked_at", { withTimezone: true }),
  credentialSubmittedAt: timestamp("credential_submitted_at", { withTimezone: true }),
  reportedAt: timestamp("reported_at", { withTimezone: true }),
  trainingCompletedAt: timestamp("training_completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PhishingTemplate = typeof phishingTemplatesTable.$inferSelect;
export type PhishingCampaign = typeof phishingCampaignsTable.$inferSelect;
export type PhishingResult = typeof phishingResultsTable.$inferSelect;
