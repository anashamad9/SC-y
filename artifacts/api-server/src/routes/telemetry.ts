import { Router, type IRouter } from "express";
import { db, telemetryEventsTable } from "@workspace/db";
import { eq, and, gte, asc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// POST /telemetry/event — record a behavioral telemetry event
router.post("/telemetry/event", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const { eventType, assessmentId, questionId, decisionLatencyMs, confidenceRating, attentionScore, payload } = req.body;

  if (!eventType) {
    res.status(400).json({ error: "eventType is required" });
    return;
  }

  await db.insert(telemetryEventsTable).values({
    userId,
    eventType,
    assessmentId: assessmentId ?? null,
    questionId: questionId ?? null,
    decisionLatencyMs: decisionLatencyMs ?? null,
    confidenceRating: confidenceRating ?? null,
    attentionScore: attentionScore ?? null,
    payload: payload ?? null,
  });

  res.json({ success: true });
});

// GET /telemetry/trends — aggregated behavioral trends for the current user
router.get("/telemetry/trends", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const days = Math.min(Number(req.query.days) || 30, 90);
  const since = new Date(Date.now() - days * 86_400_000);

  const events = await db
    .select()
    .from(telemetryEventsTable)
    .where(and(eq(telemetryEventsTable.userId, userId), gte(telemetryEventsTable.createdAt, since)))
    .orderBy(asc(telemetryEventsTable.createdAt));

  // Group by calendar day
  const byDay: Record<string, { day: string; avgLatencyMs: number; avgConfidence: number; avgAttention: number; count: number }> = {};

  for (const ev of events) {
    const day = ev.createdAt.toISOString().split("T")[0];
    if (!byDay[day]) byDay[day] = { day, avgLatencyMs: 0, avgConfidence: 0, avgAttention: 0, count: 0 };
    const d = byDay[day];
    const n = d.count + 1;
    if (ev.decisionLatencyMs != null) d.avgLatencyMs = (d.avgLatencyMs * d.count + ev.decisionLatencyMs) / n;
    if (ev.confidenceRating != null) d.avgConfidence = (d.avgConfidence * d.count + ev.confidenceRating) / n;
    if (ev.attentionScore != null) d.avgAttention = (d.avgAttention * d.count + ev.attentionScore) / n;
    d.count = n;
  }

  const trends = Object.values(byDay).map(d => ({
    day: d.day,
    avgLatencyMs: Math.round(d.avgLatencyMs),
    avgConfidence: Math.round(d.avgConfidence),
    avgAttention: Math.round(d.avgAttention),
    count: d.count,
  }));

  res.json({ trends, totalEvents: events.length, daysCovered: days });
});

export default router;
