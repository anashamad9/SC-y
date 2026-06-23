import { pgTable, serial, integer, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const auditLogsTable = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id),
  action: text("action").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AuditLog = typeof auditLogsTable.$inferSelect;

export const AUDIT_ACTIONS = {
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILED: "LOGIN_FAILED",
  LOGIN_LOCKED: "LOGIN_LOCKED",
  LOGIN_PENDING_APPROVAL: "LOGIN_PENDING_APPROVAL",
  LOGIN_REJECTED: "LOGIN_REJECTED",
  LOGOUT: "LOGOUT",
  REGISTER: "REGISTER",
  REGISTER_PENDING_APPROVAL: "REGISTER_PENDING_APPROVAL",
  REFRESH: "REFRESH",
  REFRESH_FAILED: "REFRESH_FAILED",
  MFA_SETUP: "MFA_SETUP",
  MFA_VERIFY: "MFA_VERIFY",
  APPROVAL_APPROVED: "APPROVAL_APPROVED",
  APPROVAL_REJECTED: "APPROVAL_REJECTED",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
