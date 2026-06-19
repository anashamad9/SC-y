import { pgTable, serial, integer, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const tenantsTable = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  domain: text("domain").notNull().unique(),
  plan: text("plan").notNull().default("starter"), // starter | professional | enterprise
  status: text("status").notNull().default("trial"), // active | suspended | trial | expired
  employeeCount: integer("employee_count").notNull().default(0),
  adminEmail: text("admin_email").notNull(),
  industry: text("industry"),
  country: text("country").default("UAE"),
  licenseExpiry: timestamp("license_expiry", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const systemConfigTable = pgTable("system_config", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  description: text("description"),
  category: text("category").notNull().default("general"), // general | ai | security | notifications | branding
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => usersTable.id),
});

export type Tenant = typeof tenantsTable.$inferSelect;
export type SystemConfig = typeof systemConfigTable.$inferSelect;
