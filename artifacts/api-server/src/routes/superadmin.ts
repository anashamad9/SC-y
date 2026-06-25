import { Router } from "express";
import { db } from "@workspace/db";
import { tenantsTable, systemConfigTable, auditLogsTable, usersTable, sessionsTable, AUDIT_ACTIONS } from "@workspace/db/schema";
import { eq, desc, count, like, and, gte } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/auth";

const router = Router();

function buildApprovalUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    jobTitle: user.jobTitle,
    onboardingCompleted: user.onboardingCompleted,
    approvalStatus: user.approvalStatus,
    approvedBy: user.approvedBy,
    approvedAt: user.approvedAt?.toISOString() ?? null,
    rejectedAt: user.rejectedAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

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
    const id = parseInt(req.params.id as string, 10);
    const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, id));
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });
    res.json(tenant);
  } catch (err) {
    res.status(500).json({ error: "Failed to get tenant" });
  }
});

router.patch("/tenants/:id", requireAuth, requireRole(...["superadmin"]), async (req, res) => {
  try {
    const id = parseInt(req.params.id as string, 10);
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
    const requestWindowStart = new Date(Date.now() - 60 * 1000);
    const activeSessionCutoff = new Date();
    const [userCount] = await db.select({ count: count() }).from(usersTable);
    const [recentRequests] = await db
      .select({ count: count() })
      .from(auditLogsTable)
      .where(gte(auditLogsTable.createdAt, requestWindowStart));
    const [activeSessions] = await db
      .select({ count: count() })
      .from(sessionsTable)
      .where(gte(sessionsTable.expiresAt, activeSessionCutoff));

    res.json({
      status: "healthy",
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      database: "connected",
      totalUsers: userCount?.count ?? 0,
      apiVersion: "1.0.0",
      environment: process.env.NODE_ENV ?? "development",
      services: {
        database: { status: "healthy" },
        auth: { status: "healthy" },
        storage: { status: process.env.STORAGE_PROVIDER ? "configured" : "not_configured" },
        email: { status: process.env.EMAIL_PROVIDER ? "configured" : "not_configured" },
      },
      metrics: {
        requestsPerMinute: recentRequests?.count ?? 0,
        activeSessions: activeSessions?.count ?? 0,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get system health" });
  }
});

// ── Approval Requests ────────────────────────────────────────────────────────

router.get("/superadmin/approval-requests", requireAuth, requireRole("superadmin"), async (req, res) => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : "pending";
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.approvalStatus, status))
      .orderBy(desc(usersTable.createdAt));

    res.json({
      requests: users.map(buildApprovalUser),
      total: users.length,
      status,
    });
  } catch {
    res.status(500).json({ error: "Failed to load approval requests" });
  }
});

router.patch("/superadmin/approval-requests/:id", requireAuth, requireRole("superadmin"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const status = typeof req.body?.status === "string" ? req.body.status : "";
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid request id" });
      return;
    }
    if (!["approved", "rejected"].includes(status)) {
      res.status(400).json({ error: "status must be approved or rejected" });
      return;
    }

    const [target] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!target) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const now = new Date();
    const [updated] = await db.update(usersTable)
      .set(
        status === "approved"
          ? {
              approvalStatus: "approved",
              approvedBy: req.user!.userId,
              approvedAt: now,
              rejectedAt: null,
              onboardingCompleted: false,
            }
          : {
              approvalStatus: "rejected",
              approvedBy: null,
              approvedAt: null,
              rejectedAt: now,
              onboardingCompleted: false,
            },
      )
      .where(eq(usersTable.id, id))
      .returning();

    if (status === "rejected") {
      await db.delete(sessionsTable).where(eq(sessionsTable.userId, id));
    }

    await db.insert(auditLogsTable).values({
      userId: req.user!.userId,
      action: status === "approved" ? AUDIT_ACTIONS.APPROVAL_APPROVED : AUDIT_ACTIONS.APPROVAL_REJECTED,
      metadata: {
        targetUserId: target.id,
        targetEmail: target.email,
        role: target.role,
      },
    });

    res.json(buildApprovalUser(updated));
  } catch {
    res.status(500).json({ error: "Failed to update approval request" });
  }
});

// ── Audit Logs ────────────────────────────────────────────────────────────────

router.get("/audit-logs", requireAuth, requireRole("superadmin"), async (req, res) => {
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
