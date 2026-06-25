import { pgTable, serial, integer, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const reportJobsTable = pgTable("report_jobs", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  type: text("type").notNull(), // employee | department | risk | compliance | executive
  status: text("status").notNull().default("pending"), // pending | completed | failed
  createdBy: integer("created_by").references(() => usersTable.id),
  filters: jsonb("filters"), // { dateFrom, dateTo, departmentId, userId, format }
  format: text("format").notNull().default("pdf"), // pdf | excel | csv
  fileUrl: text("file_url"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export type ReportJob = typeof reportJobsTable.$inferSelect;
