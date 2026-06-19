import { Router } from "express";
import { db } from "@workspace/db";
import { phishingTemplatesTable, phishingCampaignsTable, phishingResultsTable, usersTable } from "@workspace/db/schema";
import { eq, desc, and, count, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/auth";

const router = Router();

// ── Template Routes ──────────────────────────────────────────────────────────

router.get("/phishing/templates", requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;
    const type = req.query.type as string | undefined;
    const language = req.query.language as string | undefined;
    const difficulty = req.query.difficulty ? parseInt(req.query.difficulty as string) : undefined;
    const category = req.query.category as string | undefined;

    const conditions: any[] = [];
    if (type) conditions.push(eq(phishingTemplatesTable.type, type));
    if (language) conditions.push(eq(phishingTemplatesTable.language, language));
    if (difficulty) conditions.push(eq(phishingTemplatesTable.difficulty, difficulty));
    if (category) conditions.push(eq(phishingTemplatesTable.category, category));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [templates, totalResult] = await Promise.all([
      db.select().from(phishingTemplatesTable)
        .where(whereClause)
        .orderBy(desc(phishingTemplatesTable.createdAt))
        .limit(limit).offset(offset),
      db.select({ count: count() }).from(phishingTemplatesTable).where(whereClause),
    ]);

    res.json({ templates, total: totalResult[0]?.count ?? 0, page, limit });
  } catch (err) {
    res.status(500).json({ error: "Failed to list templates" });
  }
});

router.post("/phishing/templates/generate", requireAuth, requireRole(...["admin", "superadmin"]), async (req, res) => {
  res.status(501).json({
    error: "Template generation requires a real AI/content provider and is not configured yet.",
  });
});

router.get("/phishing/templates/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const [template] = await db.select().from(phishingTemplatesTable).where(eq(phishingTemplatesTable.id, id));
    if (!template) return res.status(404).json({ error: "Template not found" });
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: "Failed to get template" });
  }
});

router.patch("/phishing/templates/:id", requireAuth, requireRole(...["admin", "superadmin"]), async (req, res) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { name, type, subject, body, attachmentDesc, difficulty, language, industry, category, tags } = req.body;
    const [updated] = await db.update(phishingTemplatesTable)
      .set({ name, type, subject, body, attachmentDesc, difficulty, language, industry, category, tags })
      .where(eq(phishingTemplatesTable.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Template not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update template" });
  }
});

router.delete("/phishing/templates/:id", requireAuth, requireRole(...["admin", "superadmin"]), async (req, res) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    await db.delete(phishingTemplatesTable).where(eq(phishingTemplatesTable.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete template" });
  }
});

router.post("/phishing/templates", requireAuth, requireRole(...["admin", "superadmin"]), async (req, res) => {
  try {
    const { name, type, subject, body, attachmentDesc, difficulty, language, industry, category, tags } = req.body;
    const [template] = await db.insert(phishingTemplatesTable)
      .values({ name, type: type ?? "email", subject, body, attachmentDesc, difficulty: difficulty ?? 3, language: language ?? "en", industry: industry ?? "general", category: category ?? "general", tags })
      .returning();
    res.status(201).json(template);
  } catch (err) {
    res.status(500).json({ error: "Failed to create template" });
  }
});

// ── Campaign Routes ──────────────────────────────────────────────────────────

router.get("/phishing/campaigns", requireAuth, requireRole(...["admin", "superadmin"]), async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;
    const status = req.query.status as string | undefined;

    const whereClause = status ? eq(phishingCampaignsTable.status, status) : undefined;

    const [campaigns, totalResult] = await Promise.all([
      db.select({
        id: phishingCampaignsTable.id,
        name: phishingCampaignsTable.name,
        description: phishingCampaignsTable.description,
        status: phishingCampaignsTable.status,
        templateId: phishingCampaignsTable.templateId,
        difficulty: phishingCampaignsTable.difficulty,
        scheduledAt: phishingCampaignsTable.scheduledAt,
        completedAt: phishingCampaignsTable.completedAt,
        totalTargeted: phishingCampaignsTable.totalTargeted,
        createdAt: phishingCampaignsTable.createdAt,
        templateName: phishingTemplatesTable.name,
        templateType: phishingTemplatesTable.type,
      })
      .from(phishingCampaignsTable)
      .leftJoin(phishingTemplatesTable, eq(phishingCampaignsTable.templateId, phishingTemplatesTable.id))
      .where(whereClause)
      .orderBy(desc(phishingCampaignsTable.createdAt))
      .limit(limit).offset(offset),
      db.select({ count: count() }).from(phishingCampaignsTable).where(whereClause),
    ]);

    res.json({ campaigns, total: totalResult[0]?.count ?? 0, page, limit });
  } catch (err) {
    res.status(500).json({ error: "Failed to list campaigns" });
  }
});

router.post("/phishing/campaigns", requireAuth, requireRole(...["admin", "superadmin"]), async (req, res) => {
  try {
    const { name, description, templateId, targetAudience, difficulty, scheduledAt } = req.body;
    const [campaign] = await db.insert(phishingCampaignsTable)
      .values({
        name, description, templateId, targetAudience: targetAudience ?? { type: "all" },
        difficulty: difficulty ?? 3, scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        createdBy: req.user!.userId, status: "draft",
      }).returning();
    res.status(201).json(campaign);
  } catch (err) {
    res.status(500).json({ error: "Failed to create campaign" });
  }
});

router.get("/phishing/campaigns/:id", requireAuth, requireRole(...["admin", "superadmin"]), async (req, res) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const [campaign] = await db.select().from(phishingCampaignsTable).where(eq(phishingCampaignsTable.id, id));
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });

    const results = await db.select().from(phishingResultsTable).where(eq(phishingResultsTable.campaignId, id));
    const stats = {
      totalTargeted: campaign.totalTargeted,
      sent: results.length,
      opened: results.filter(r => r.openedAt).length,
      clicked: results.filter(r => r.clickedAt).length,
      submitted: results.filter(r => r.credentialSubmittedAt).length,
      reported: results.filter(r => r.reportedAt).length,
      openRate: results.length > 0 ? Math.round(results.filter(r => r.openedAt).length / results.length * 100) : 0,
      clickRate: results.length > 0 ? Math.round(results.filter(r => r.clickedAt).length / results.length * 100) : 0,
      submitRate: results.length > 0 ? Math.round(results.filter(r => r.credentialSubmittedAt).length / results.length * 100) : 0,
      reportRate: results.length > 0 ? Math.round(results.filter(r => r.reportedAt).length / results.length * 100) : 0,
    };

    res.json({ ...campaign, stats });
  } catch (err) {
    res.status(500).json({ error: "Failed to get campaign" });
  }
});

router.patch("/phishing/campaigns/:id", requireAuth, requireRole(...["admin", "superadmin"]), async (req, res) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { name, description, templateId, targetAudience, difficulty, scheduledAt, status } = req.body;
    const [updated] = await db.update(phishingCampaignsTable)
      .set({ name, description, templateId, targetAudience, difficulty, status,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        updatedAt: new Date() })
      .where(eq(phishingCampaignsTable.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "Campaign not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update campaign" });
  }
});

router.delete("/phishing/campaigns/:id", requireAuth, requireRole(...["admin", "superadmin"]), async (req, res) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    await db.delete(phishingResultsTable).where(eq(phishingResultsTable.campaignId, id));
    await db.delete(phishingCampaignsTable).where(eq(phishingCampaignsTable.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete campaign" });
  }
});

router.post("/phishing/campaigns/:id/launch", requireAuth, requireRole(...["admin", "superadmin"]), async (req, res) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const [campaign] = await db.select().from(phishingCampaignsTable).where(eq(phishingCampaignsTable.id, id));
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });

    const employees = await db.select({ id: usersTable.id, departmentId: usersTable.departmentId })
      .from(usersTable).where(sql`LOWER(${usersTable.role}) = 'employee'`);

    const audience = campaign.targetAudience as any;
    let targets = employees;
    if (audience?.type === "department" && audience.ids?.length) {
      targets = employees.filter((e: any) => audience.ids.includes(e.departmentId));
    } else if (audience?.type === "users" && audience.ids?.length) {
      targets = employees.filter((e: any) => audience.ids.includes(e.id));
    }

    if (targets.length > 0) {
      const resultRows = targets.map((e: any) => ({
        campaignId: id, userId: e.id, sentAt: new Date(),
      }));
      await db.insert(phishingResultsTable).values(resultRows).onConflictDoNothing();
    }

    const [updated] = await db.update(phishingCampaignsTable)
      .set({ status: "active", scheduledAt: new Date(), totalTargeted: targets.length, updatedAt: new Date() })
      .where(eq(phishingCampaignsTable.id, id)).returning();

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to launch campaign" });
  }
});

router.get("/phishing/campaigns/:id/results", requireAuth, requireRole(...["admin", "superadmin"]), async (req, res) => {
  try {
    const campaignId = parseInt(req.params.id as string, 10);
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
    const offset = (page - 1) * limit;

    const [results, totalResult] = await Promise.all([
      db.select({
        id: phishingResultsTable.id,
        userId: phishingResultsTable.userId,
        sentAt: phishingResultsTable.sentAt,
        openedAt: phishingResultsTable.openedAt,
        clickedAt: phishingResultsTable.clickedAt,
        credentialSubmittedAt: phishingResultsTable.credentialSubmittedAt,
        reportedAt: phishingResultsTable.reportedAt,
        trainingCompletedAt: phishingResultsTable.trainingCompletedAt,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        email: usersTable.email,
      }).from(phishingResultsTable)
      .leftJoin(usersTable, eq(phishingResultsTable.userId, usersTable.id))
      .where(eq(phishingResultsTable.campaignId, campaignId))
      .orderBy(desc(phishingResultsTable.sentAt))
      .limit(limit).offset(offset),
      db.select({ count: count() }).from(phishingResultsTable).where(eq(phishingResultsTable.campaignId, campaignId)),
    ]);

    res.json({ results, total: totalResult[0]?.count ?? 0, page, limit });
  } catch (err) {
    res.status(500).json({ error: "Failed to get campaign results" });
  }
});

router.get("/phishing/my-results", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;

    const results = await db.select({
      id: phishingResultsTable.id,
      campaignId: phishingResultsTable.campaignId,
      sentAt: phishingResultsTable.sentAt,
      openedAt: phishingResultsTable.openedAt,
      clickedAt: phishingResultsTable.clickedAt,
      credentialSubmittedAt: phishingResultsTable.credentialSubmittedAt,
      reportedAt: phishingResultsTable.reportedAt,
      trainingCompletedAt: phishingResultsTable.trainingCompletedAt,
      campaignName: phishingCampaignsTable.name,
      campaignDifficulty: phishingCampaignsTable.difficulty,
      templateType: phishingTemplatesTable.type,
    }).from(phishingResultsTable)
    .leftJoin(phishingCampaignsTable, eq(phishingResultsTable.campaignId, phishingCampaignsTable.id))
    .leftJoin(phishingTemplatesTable, eq(phishingCampaignsTable.templateId, phishingTemplatesTable.id))
    .where(eq(phishingResultsTable.userId, userId))
    .orderBy(desc(phishingResultsTable.sentAt))
    .limit(50);

    const summary = {
      totalSent: results.length,
      clicked: results.filter(r => r.clickedAt).length,
      reported: results.filter(r => r.reportedAt).length,
      clickRate: results.length > 0 ? Math.round(results.filter(r => r.clickedAt).length / results.length * 100) : 0,
      reportRate: results.length > 0 ? Math.round(results.filter(r => r.reportedAt).length / results.length * 100) : 0,
    };

    res.json({ results, summary });
  } catch (err) {
    res.status(500).json({ error: "Failed to get phishing results" });
  }
});

export default router;
