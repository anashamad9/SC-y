import { Router, type IRouter } from "express";
import { db, cciSnapshotsTable, psychometricProfilesTable, userCourseProgressTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function computeFromProfile(profile: typeof psychometricProfilesTable.$inferSelect, learningEngagement: number) {
  const s = {
    risk_tolerance: profile.riskTolerance,
    impulsiveness: profile.impulsiveness,
    security_awareness: profile.securityAwareness,
    decision_making: profile.decisionMaking,
    attention_to_detail: profile.attentionToDetail,
    trust_tendencies: profile.trustTendencies,
    stress_response: profile.stressResponse,
    compliance_behavior: profile.complianceBehavior,
  };

  const risky = (s.risk_tolerance + s.impulsiveness + s.trust_tendencies) / 3;
  const protective = (s.security_awareness + s.decision_making + s.attention_to_detail + s.stress_response + s.compliance_behavior) / 5;
  const humanRiskScore = Math.round(risky * 0.45 + (100 - protective) * 0.55);

  const cciScore = Math.round(
    s.security_awareness * 0.25 +
    s.compliance_behavior * 0.20 +
    learningEngagement * 0.20 +
    ((s.decision_making + s.attention_to_detail) / 2) * 0.20 +
    Math.max(0, 100 - s.risk_tolerance * 0.5 - s.impulsiveness * 0.5) * 0.15
  );

  const behavioralStabilityScore = Math.round((s.stress_response + s.decision_making) / 2);
  const decisionQualityScore = Math.round((s.decision_making + s.attention_to_detail) / 2);
  const cultureContributionScore = Math.round((s.compliance_behavior + s.security_awareness) / 2);
  const complianceBehaviorScore = Math.round(s.compliance_behavior);

  const riskCategory =
    humanRiskScore > 75 ? "Critical" :
    humanRiskScore > 60 ? "High" :
    humanRiskScore > 40 ? "Medium" : "Low";

  return {
    humanRiskScore,
    cciScore,
    behavioralStabilityScore,
    decisionQualityScore,
    cultureContributionScore,
    complianceBehaviorScore,
    securityReadinessScore: profile.securityReadinessScore,
    riskCategory,
    trend: humanRiskScore < 55 ? "improving" : humanRiskScore > 70 ? "declining" : "stable",
  };
}

// GET /scores/me
router.get("/scores/me", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;

  // Latest snapshot
  const [snapshot] = await db.select().from(cciSnapshotsTable).where(eq(cciSnapshotsTable.userId, userId)).orderBy(desc(cciSnapshotsTable.computedAt)).limit(1);

  if (snapshot) {
    const riskCategory =
      snapshot.humanRiskScore > 75 ? "Critical" :
      snapshot.humanRiskScore > 60 ? "High" :
      snapshot.humanRiskScore > 40 ? "Medium" : "Low";

    res.json({
      humanRiskScore: snapshot.humanRiskScore,
      cciScore: snapshot.cciScore,
      behavioralStabilityScore: snapshot.behavioralStabilityScore,
      decisionQualityScore: snapshot.decisionQualityScore,
      cultureContributionScore: snapshot.cultureContributionScore,
      complianceBehaviorScore: snapshot.complianceBehaviorScore,
      securityReadinessScore: 100 - snapshot.humanRiskScore,
      riskCategory,
      trend: "stable",
      computedAt: snapshot.computedAt.toISOString(),
    });
    return;
  }

  // Fallback: compute from profile
  const [profile] = await db.select().from(psychometricProfilesTable).where(eq(psychometricProfilesTable.userId, userId));
  if (!profile) {
    res.json({
      humanRiskScore: 65,
      cciScore: 52,
      behavioralStabilityScore: 55,
      decisionQualityScore: 55,
      cultureContributionScore: 50,
      complianceBehaviorScore: 50,
      securityReadinessScore: 55,
      riskCategory: "Medium",
      trend: "stable",
      computedAt: new Date().toISOString(),
    });
    return;
  }

  const progress = await db.select().from(userCourseProgressTable).where(eq(userCourseProgressTable.userId, userId));
  const completedCount = progress.filter(p => p.status === "completed").length;
  const learningEngagement = Math.min(100, completedCount * 10);

  const scores = computeFromProfile(profile, learningEngagement);
  res.json({ ...scores, computedAt: new Date().toISOString() });
});

// GET /scores/cci-history — last 30 CCI snapshots for trend chart
router.get("/scores/cci-history", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const snapshots = await db
    .select()
    .from(cciSnapshotsTable)
    .where(eq(cciSnapshotsTable.userId, userId))
    .orderBy(desc(cciSnapshotsTable.computedAt))
    .limit(30);

  const history = snapshots.reverse().map(s => ({
    date: s.computedAt.toISOString().slice(0, 10),
    cciScore: Math.round(s.cciScore),
    humanRiskScore: Math.round(s.humanRiskScore),
    behavioralStabilityScore: Math.round(s.behavioralStabilityScore),
    decisionQualityScore: Math.round(s.decisionQualityScore),
    cultureContributionScore: Math.round(s.cultureContributionScore),
  }));

  res.json({ history });
});

export default router;
