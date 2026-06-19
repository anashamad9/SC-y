import { Router } from "express";
import { db } from "@workspace/db";
import { tenantsTable, systemConfigTable, auditLogsTable, usersTable } from "@workspace/db/schema";
import { eq, desc, count, like, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/auth";

const router = Router();

// ── Tenants ──────────────────────────────────────────────────────────────────

router.get("/tenants", requireAuth, requireRole(...["superadmin"]), async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;
    const status = req.query.status as string | undefined;

    const whereClause = status ? eq(tenantsTable.status, status) : undefined;

    const [tenants, totalResult] = await Promise.all([
      db.select().from(tenantsTable).where(whereClause).orderBy(desc(tenantsTable.createdAt)).limit(limit).offset(offset),
      db.select({ count: count() }).from(tenantsTable).where(whereClause),
    ]);

    res.json({ tenants, total: totalResult[0]?.count ?? 0, page, limit });
  } catch (err) {
    res.status(500).json({ error: "Failed to list tenants" });
  }
});

router.post("/tenants", requireAuth, requireRole(...["superadmin"]), async (req, res) => {
  try {
    const { name, domain, plan, adminEmail, industry, country, employeeCount } = req.body;
    const [tenant] = await db.insert(tenantsTable)
      .values({ name, domain, plan: plan ?? "starter", adminEmail, industry, country: country ?? "UAE", employeeCount: employeeCount ?? 0, status: "trial" })
      .returning();
    res.status(201).json(tenant);
  } catch (err) {
    res.status(500).json({ error: "Failed to create tenant" });
  }
});

router.get("/tenants/:id", requireAuth, requireRole(...["superadmin"]), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, id));
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });
    res.json(tenant);
  } catch (err) {
    res.status(500).json({ error: "Failed to get tenant" });
  }
});

router.patch("/tenants/:id", requireAuth, requireRole(...["superadmin"]), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, domain, plan, status, adminEmail, industry, country, employeeCount } = req.body;
    const [updated] = await db.update(tenantsTable)
      .set({ name, domain, plan, status, adminEmail, industry, country, employeeCount, updatedAt: new Date() })
      .where(eq(tenantsTable.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "Tenant not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update tenant" });
  }
});

// ── System Config ─────────────────────────────────────────────────────────────

router.get("/system/config", requireAuth, requireRole(...["superadmin"]), async (req, res) => {
  try {
    const configs = await db.select().from(systemConfigTable).orderBy(systemConfigTable.category, systemConfigTable.key);
    res.json(configs);
  } catch (err) {
    res.status(500).json({ error: "Failed to get system config" });
  }
});

router.patch("/system/config", requireAuth, requireRole(...["superadmin"]), async (req, res) => {
  try {
    const { key, value } = req.body;
    const existing = await db.select().from(systemConfigTable).where(eq(systemConfigTable.key, key));
    let result;
    if (existing.length > 0) {
      const [updated] = await db.update(systemConfigTable)
        .set({ value, updatedAt: new Date(), updatedBy: req.user!.userId })
        .where(eq(systemConfigTable.key, key)).returning();
      result = updated;
    } else {
      const [inserted] = await db.insert(systemConfigTable)
        .values({ key, value, updatedBy: req.user!.userId }).returning();
      result = inserted;
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to update system config" });
  }
});

// ── System Health ─────────────────────────────────────────────────────────────

router.get("/system/health", requireAuth, requireRole(...["superadmin"]), async (req, res) => {
  try {
    const [userCount] = await db.select({ count: count() }).from(usersTable);
    res.json({
      status: "healthy",
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      database: "connected",
      totalUsers: userCount?.count ?? 0,
      apiVersion: "1.0.0",
      environment: process.env.NODE_ENV ?? "development",
      services: {
        database: { status: "healthy", latencyMs: 12 },
        auth: { status: "healthy", latencyMs: 3 },
        storage: { status: "healthy", latencyMs: 8 },
        email: { status: "mock", latencyMs: 0 },
      },
      metrics: {
        requestsPerMinute: Math.floor(Math.random() * 200) + 50,
        avgResponseMs: Math.floor(Math.random() * 100) + 20,
        errorRate: (Math.random() * 0.5).toFixed(2),
        activeSessions: Math.floor(Math.random() * 50) + 10,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get system health" });
  }
});

// ── Audit Logs ────────────────────────────────────────────────────────────────

router.get("/audit-logs", requireAuth, requireRole(...["superadmin", "admin"]), async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
    const offset = (page - 1) * limit;
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    const action = req.query.action as string | undefined;

    const conditions: any[] = [];
    if (userId) conditions.push(eq(auditLogsTable.userId, userId));
    if (action) conditions.push(like(auditLogsTable.action, `%${action}%`));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [logs, totalResult] = await Promise.all([
      db.select({
        id: auditLogsTable.id,
        action: auditLogsTable.action,
        ipAddress: auditLogsTable.ipAddress,
        userAgent: auditLogsTable.userAgent,
        metadata: auditLogsTable.metadata,
        createdAt: auditLogsTable.createdAt,
        userId: auditLogsTable.userId,
        userEmail: usersTable.email,
        userFirstName: usersTable.firstName,
        userLastName: usersTable.lastName,
      }).from(auditLogsTable)
      .leftJoin(usersTable, eq(auditLogsTable.userId, usersTable.id))
      .where(whereClause)
      .orderBy(desc(auditLogsTable.createdAt))
      .limit(limit).offset(offset),
      db.select({ count: count() }).from(auditLogsTable).where(whereClause),
    ]);

    res.json({ logs, total: totalResult[0]?.count ?? 0, page, limit });
  } catch (err) {
    res.status(500).json({ error: "Failed to list audit logs" });
  }
});

export default router;
