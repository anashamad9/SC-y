import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, departmentsTable, phishingCampaignsTable, phishingResultsTable, reportJobsTable, coursesTable, assessmentsTable, auditLogsTable, assessmentResultsTable } from "@workspace/db/schema";
import { eq, desc, count, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/auth";

const router = Router();

router.get("/admin/stats", requireAuth, requireRole(...["admin", "superadmin"]), async (req, res) => {
  try {
    const [
      userCountResult,
      deptCountResult,
      campaignCountResult,
      activeCountResult,
      reportCountResult,
      recentAuditLogs,
    ] = await Promise.all([
      db.select({ count: count() }).from(usersTable),
      db.select({ count: count() }).from(departmentsTable),
      db.select({ count: count() }).from(phishingCampaignsTable),
      db.select({ count: count() }).from(phishingCampaignsTable).where(eq(phishingCampaignsTable.status, "active")),
      db.select({ count: count() }).from(reportJobsTable),
      db.select({
        id: auditLogsTable.id,
        action: auditLogsTable.action,
        createdAt: auditLogsTable.createdAt,
        userId: auditLogsTable.userId,
        ipAddress: auditLogsTable.ipAddress,
      }).from(auditLogsTable).orderBy(desc(auditLogsTable.createdAt)).limit(10),
    ]);

    const byRole = await db
      .select({ role: usersTable.role, count: count() })
      .from(usersTable)
      .groupBy(usersTable.role);

    const clickRateResult = await db
      .select({
        total: count(phishingResultsTable.id),
        clicked: sql<number>`COUNT(CASE WHEN ${phishingResultsTable.clickedAt} IS NOT NULL THEN 1 END)`,
      })
      .from(phishingResultsTable);

    const total = clickRateResult[0]?.total ?? 0;
    const clicked = Number(clickRateResult[0]?.clicked ?? 0);
    const overallClickRate = total > 0 ? Math.round((clicked / total) * 100) : 0;

    res.json({
      users: userCountResult[0]?.count ?? 0,
      departments: deptCountResult[0]?.count ?? 0,
      campaigns: campaignCountResult[0]?.count ?? 0,
      activeCampaigns: activeCountResult[0]?.count ?? 0,
      reports: reportCountResult[0]?.count ?? 0,
      overallClickRate,
      byRole,
      recentAuditLogs,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get admin stats" });
  }
});

// GET /admin/settings — read all platform settings (from system_config)
router.get("/admin/settings", requireAuth, requireRole(...["admin", "superadmin"]), async (req, res) => {
  try {
    const { systemConfigTable } = await import("@workspace/db/schema");
    const rows = await db.select().from(systemConfigTable);
    const settings: Record<string, string> = {};
    for (const row of rows) settings[row.key] = row.value ?? "";
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// PUT /admin/settings/:key — persist a single setting
router.put("/admin/settings/:key", requireAuth, requireRole("admin", "superadmin"), async (req, res) => {
  try {
    const { systemConfigTable } = await import("@workspace/db/schema");
    const key = req.params.key as string;
    const { value } = req.body;
    if (value === undefined) { res.status(400).json({ error: "value is required" }); return; }
    const existing = await db.select().from(systemConfigTable).where(eq(systemConfigTable.key, key));
    if (existing.length > 0) {
      await db.update(systemConfigTable).set({ value: String(value), updatedAt: new Date() })
        .where(eq(systemConfigTable.key, key));
    } else {
      await db.insert(systemConfigTable).values({ key, value: String(value) });
    }
    res.json({ key, value });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update setting" });
  }
});

// GET /admin/notifications — list announcements stored in system_config
router.get("/admin/notifications", requireAuth, requireRole(...["admin", "superadmin"]), async (req, res) => {
  try {
    const { systemConfigTable } = await import("@workspace/db/schema");
    const [row] = await db.select().from(systemConfigTable).where(eq(systemConfigTable.key, "platform.announcements"));
    const announcements = row?.value ? JSON.parse(row.value) : [];
    res.json(announcements);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// POST /admin/notifications — add an announcement
router.post("/admin/notifications", requireAuth, requireRole(...["admin", "superadmin"]), async (req, res) => {
  try {
    const { systemConfigTable } = await import("@workspace/db/schema");
    const { title, body, type, audience } = req.body;
    if (!title || !body) { res.status(400).json({ error: "title and body are required" }); return; }
    const [row] = await db.select().from(systemConfigTable).where(eq(systemConfigTable.key, "platform.announcements"));
    const existing = row?.value ? JSON.parse(row.value) : [];
    const newItem = { id: Date.now().toString(), title, body, type: type ?? "info", audience: audience ?? "all", createdAt: new Date().toISOString(), active: true };
    const updated = [newItem, ...existing];
    if (row) {
      await db.update(systemConfigTable).set({ value: JSON.stringify(updated), updatedAt: new Date() }).where(eq(systemConfigTable.key, "platform.announcements"));
    } else {
      await db.insert(systemConfigTable).values({ key: "platform.announcements", value: JSON.stringify(updated), category: "notifications" });
    }
    res.status(201).json(newItem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create notification" });
  }
});

// DELETE /admin/notifications/:id — remove an announcement by id
router.delete("/admin/notifications/:id", requireAuth, requireRole(...["admin", "superadmin"]), async (req, res) => {
  try {
    const { systemConfigTable } = await import("@workspace/db/schema");
    const id = req.params.id;
    const [row] = await db.select().from(systemConfigTable).where(eq(systemConfigTable.key, "platform.announcements"));
    const existing = row?.value ? JSON.parse(row.value) : [];
    const filtered = existing.filter((a: any) => a.id !== id);
    if (row) {
      await db.update(systemConfigTable).set({ value: JSON.stringify(filtered), updatedAt: new Date() }).where(eq(systemConfigTable.key, "platform.announcements"));
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

// GET /admin/assessments/:id/results — paginated employee submissions for admin
router.get("/admin/assessments/:id/results", requireAuth, requireRole("admin", "superadmin"), async (req, res) => {
  try {
    const assessmentId = parseInt(req.params.id as string);
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;

    const [total, results] = await Promise.all([
      db.select({ count: count() })
        .from(assessmentResultsTable)
        .where(eq(assessmentResultsTable.assessmentId, assessmentId)),
      db.select({
        id: assessmentResultsTable.id,
        userId: assessmentResultsTable.userId,
        overallScore: assessmentResultsTable.overallScore,
        completedAt: assessmentResultsTable.completedAt,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        email: usersTable.email,
      })
        .from(assessmentResultsTable)
        .innerJoin(usersTable, eq(assessmentResultsTable.userId, usersTable.id))
        .where(eq(assessmentResultsTable.assessmentId, assessmentId))
        .orderBy(desc(assessmentResultsTable.completedAt))
        .limit(limit)
        .offset(offset),
    ]);

    res.json({
      results: results.map(r => ({
        ...r,
        overallScore: Number(r.overallScore),
        completedAt: r.completedAt?.toISOString() ?? null,
      })),
      total: total[0]?.count ?? 0,
      page,
      limit,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch assessment results" });
  }
});

export default router;
