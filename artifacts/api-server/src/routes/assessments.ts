import { Router, type IRouter } from "express";
import { db, assessmentsTable, assessmentQuestionsTable, assessmentResultsTable, psychometricProfilesTable, gamificationProfilesTable, cciSnapshotsTable } from "@workspace/db";
import { eq, and, desc, inArray } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

const RISKY_CATEGORIES = new Set(["risk_tolerance", "impulsiveness", "trust_tendencies"]);

interface QuestionOption { value: number; label: string; }

function computeBehavioralType(s: Record<string, number>): string {
  const risky = ((s.risk_tolerance ?? 50) + (s.impulsiveness ?? 50) + (s.trust_tendencies ?? 50)) / 3;
  const protective = ((s.security_awareness ?? 50) + (s.decision_making ?? 50) + (s.attention_to_detail ?? 50) + (s.stress_response ?? 50) + (s.compliance_behavior ?? 50)) / 5;
  if (protective > 75 && risky < 38) return "Security Champion";
  if ((s.impulsiveness ?? 50) > 68 && risky > 65) return "Impulsive Actor";
  if ((s.trust_tendencies ?? 50) > 70 && risky > 58) return "Trusting Actor";
  if (protective > 68 && risky < 45) return "Disciplined Analyst";
  if ((s.attention_to_detail ?? 50) > 72 && (s.decision_making ?? 50) > 70) return "Detail-Oriented Analyst";
  if ((s.compliance_behavior ?? 50) < 35) return "Non-Compliant Operative";
  return "Balanced Operative";
}

function computeLearningStyle(s: Record<string, number>): string {
  if ((s.attention_to_detail ?? 50) > 72) return "Analytical Learner";
  if ((s.impulsiveness ?? 50) < 35) return "Reflective Learner";
  if ((s.stress_response ?? 50) > 70) return "Adaptive Learner";
  if ((s.decision_making ?? 50) > 70) return "Strategic Learner";
  return "Visual Learner";
}

function computeRiskCategory(s: Record<string, number>): string {
  const risky = ((s.risk_tolerance ?? 50) + (s.impulsiveness ?? 50) + (s.trust_tendencies ?? 50)) / 3;
  const protective = ((s.security_awareness ?? 50) + (s.compliance_behavior ?? 50)) / 2;
  if (risky > 70 && protective < 45) return "Critical";
  if (risky > 60 || protective < 40) return "High";
  if (risky > 45 || protective < 55) return "Medium";
  return "Low";
}

function computeHRS(s: Record<string, number>): number {
  const risky = ((s.risk_tolerance ?? 50) + (s.impulsiveness ?? 50) + (s.trust_tendencies ?? 50)) / 3;
  const protective = ((s.security_awareness ?? 50) + (s.decision_making ?? 50) + (s.attention_to_detail ?? 50) + (s.stress_response ?? 50) + (s.compliance_behavior ?? 50)) / 5;
  return Math.round(risky * 0.45 + (100 - protective) * 0.55);
}

function computeCCI(s: Record<string, number>, learningEngagement = 50): number {
  const secAwareness = (s.security_awareness ?? 50) * 0.25;
  const compliance = (s.compliance_behavior ?? 50) * 0.20;
  const learning = learningEngagement * 0.20;
  const riskConscious = ((s.decision_making ?? 50) + (s.attention_to_detail ?? 50)) / 2 * 0.20;
  const culture = Math.max(0, 100 - (s.risk_tolerance ?? 50) * 0.5 - (s.impulsiveness ?? 50) * 0.5) * 0.15;
  return Math.round(secAwareness + compliance + learning + riskConscious + culture);
}

// GET /assessments — list with user completion status
router.get("/assessments", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const assessments = await db.select().from(assessmentsTable);
  const allQuestions = await db.select({ id: assessmentQuestionsTable.id, assessmentId: assessmentQuestionsTable.assessmentId }).from(assessmentQuestionsTable);
  const qCountMap: Record<number, number> = {};
  for (const q of allQuestions) qCountMap[q.assessmentId] = (qCountMap[q.assessmentId] ?? 0) + 1;

  const userResults = await db.select().from(assessmentResultsTable).where(eq(assessmentResultsTable.userId, userId)).orderBy(desc(assessmentResultsTable.completedAt));
  const latestMap = new Map<number, typeof assessmentResultsTable.$inferSelect>();
  for (const r of userResults) if (!latestMap.has(r.assessmentId)) latestMap.set(r.assessmentId, r);

  res.json(assessments.map(a => ({
    id: a.id,
    type: a.type,
    title: a.title,
    description: a.description,
    estimatedMinutes: a.estimatedMinutes,
    questionCount: qCountMap[a.id] ?? 0,
    completed: latestMap.has(a.id),
    lastCompletedAt: latestMap.get(a.id)?.completedAt?.toISOString() ?? null,
  })));
});

// GET /assessments/profile — psychometric profile (MUST be before /:id)
router.get("/assessments/profile", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const [profile] = await db.select().from(psychometricProfilesTable).where(eq(psychometricProfilesTable.userId, userId));
  if (!profile) { res.status(404).json({ message: "Profile not found" }); return; }
  res.json({
    userId: profile.userId,
    riskTolerance: profile.riskTolerance,
    impulsiveness: profile.impulsiveness,
    securityAwareness: profile.securityAwareness,
    decisionMaking: profile.decisionMaking,
    attentionToDetail: profile.attentionToDetail,
    trustTendencies: profile.trustTendencies,
    stressResponse: profile.stressResponse,
    complianceBehavior: profile.complianceBehavior,
    behavioralType: profile.behavioralType,
    learningStyle: profile.learningStyle,
    riskCategory: profile.riskCategory,
    securityReadinessScore: profile.securityReadinessScore,
  });
});

// GET /assessments/:id — assessment with questions
router.get("/assessments/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [assessment] = await db.select().from(assessmentsTable).where(eq(assessmentsTable.id, id));
  if (!assessment) { res.status(404).json({ message: "Not found" }); return; }

  const questions = await db.select().from(assessmentQuestionsTable).where(eq(assessmentQuestionsTable.assessmentId, id)).orderBy(assessmentQuestionsTable.displayOrder);

  res.json({
    id: assessment.id,
    type: assessment.type,
    title: assessment.title,
    description: assessment.description,
    estimatedMinutes: assessment.estimatedMinutes,
    questions: questions.map(q => ({
      id: q.id,
      text: q.text,
      category: q.category,
      options: q.options as QuestionOption[],
      displayOrder: q.displayOrder,
    })),
  });
});

// POST /assessments/:id/submit
router.post("/assessments/:id/submit", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const assessmentId = Number(req.params.id);
  const { answers, timeTakenSec } = req.body as { answers: Record<string, number>; timeTakenSec: number };

  const [assessment] = await db.select().from(assessmentsTable).where(eq(assessmentsTable.id, assessmentId));
  if (!assessment) { res.status(404).json({ message: "Not found" }); return; }

  const questions = await db.select().from(assessmentQuestionsTable).where(eq(assessmentQuestionsTable.assessmentId, assessmentId));

  const categoryTotals: Record<string, { sum: number; count: number; weight: number }> = {};
  for (const q of questions) {
    const opts = q.options as QuestionOption[];
    const maxVal = Math.max(...opts.map(o => o.value));
    const minVal = Math.min(...opts.map(o => o.value));
    const range = maxVal - minVal || 1;
    const selectedVal = answers[String(q.id)] ?? minVal;
    const score = ((selectedVal - minVal) / range) * 100;
    const cat = q.category;
    if (!categoryTotals[cat]) categoryTotals[cat] = { sum: 0, count: 0, weight: 0 };
    categoryTotals[cat].sum += score * q.weight;
    categoryTotals[cat].count += 1;
    categoryTotals[cat].weight += q.weight;
  }

  const categoryScoresMap: Record<string, number> = {};
  const categoryLabels: Record<string, string> = {
    risk_tolerance: "Risk Tolerance",
    impulsiveness: "Impulsiveness",
    security_awareness: "Security Awareness",
    decision_making: "Decision Making",
    attention_to_detail: "Attention to Detail",
    trust_tendencies: "Trust Tendencies",
    stress_response: "Stress Response",
    compliance_behavior: "Compliance Behavior",
    phishing_recognition: "Phishing Recognition",
    password_hygiene: "Password Hygiene",
    social_engineering: "Social Engineering Resistance",
    data_handling: "Data Handling",
    incident_response: "Incident Response",
    device_security: "Device Security",
    remote_work: "Remote Work Security",
    cloud_security: "Cloud Security",
  };

  for (const [cat, data] of Object.entries(categoryTotals)) {
    const raw = data.weight > 0 ? data.sum / data.weight : 0;
    // For risky categories, score stays as-is (high = more risky)
    // For protective categories, we keep it as-is too (high = better)
    categoryScoresMap[cat] = Math.round(raw);
  }

  const overallScore = Math.round(Object.values(categoryScoresMap).reduce((a, b) => a + b, 0) / Math.max(Object.keys(categoryScoresMap).length, 1));

  const [result] = await db.insert(assessmentResultsTable).values({
    userId,
    assessmentId,
    answers,
    categoryScores: categoryScoresMap,
    overallScore,
    timeTakenSec: timeTakenSec ?? null,
  }).returning();

  // If psychometric, upsert profile
  if (assessment.type === "psychometric") {
    const profileData: Record<string, number | string> = {
      riskTolerance: categoryScoresMap.risk_tolerance ?? 50,
      impulsiveness: categoryScoresMap.impulsiveness ?? 50,
      securityAwareness: categoryScoresMap.security_awareness ?? 50,
      decisionMaking: categoryScoresMap.decision_making ?? 50,
      attentionToDetail: categoryScoresMap.attention_to_detail ?? 50,
      trustTendencies: categoryScoresMap.trust_tendencies ?? 50,
      stressResponse: categoryScoresMap.stress_response ?? 50,
      complianceBehavior: categoryScoresMap.compliance_behavior ?? 50,
    };
    profileData.behavioralType = computeBehavioralType(categoryScoresMap);
    profileData.learningStyle = computeLearningStyle(categoryScoresMap);
    profileData.riskCategory = computeRiskCategory(categoryScoresMap);
    profileData.securityReadinessScore = overallScore;

    const [existing] = await db.select({ id: psychometricProfilesTable.id }).from(psychometricProfilesTable).where(eq(psychometricProfilesTable.userId, userId));
    if (existing) {
      await db.update(psychometricProfilesTable).set(profileData as any).where(eq(psychometricProfilesTable.userId, userId));
    } else {
      await db.insert(psychometricProfilesTable).values({ userId, ...(profileData as any) });
    }

    // Upsert CCI snapshot
    const hrs = computeHRS(categoryScoresMap);
    const cci = computeCCI(categoryScoresMap);
    await db.insert(cciSnapshotsTable).values({
      userId,
      cciScore: cci,
      humanRiskScore: hrs,
      behavioralStabilityScore: Math.round(((categoryScoresMap.stress_response ?? 50) + (categoryScoresMap.decision_making ?? 50)) / 2),
      decisionQualityScore: categoryScoresMap.decision_making ?? 50,
      cultureContributionScore: categoryScoresMap.compliance_behavior ?? 50,
      complianceBehaviorScore: categoryScoresMap.compliance_behavior ?? 50,
    });
  }

  // Award XP
  const xpGain = 50 + Math.round(overallScore * 0.5);
  const [gp] = await db.select().from(gamificationProfilesTable).where(eq(gamificationProfilesTable.userId, userId));
  if (gp) {
    const newXp = gp.xp + xpGain;
    await db.update(gamificationProfilesTable).set({ xp: newXp, level: Math.floor(newXp / 200) + 1, lastActivityAt: new Date() }).where(eq(gamificationProfilesTable.userId, userId));
  }

  res.json({
    id: result.id,
    assessmentId: result.assessmentId,
    overallScore: result.overallScore,
    categoryScores: Object.entries(categoryScoresMap).map(([cat, score]) => ({
      category: cat,
      score,
      label: categoryLabels[cat] ?? cat,
    })),
    timeTakenSec: result.timeTakenSec,
    completedAt: result.completedAt.toISOString(),
  });
});

// GET /assessments/:id/results — latest result for current user
router.get("/assessments/:id/results", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const assessmentId = Number(req.params.id);

  const [result] = await db.select().from(assessmentResultsTable)
    .where(and(eq(assessmentResultsTable.userId, userId), eq(assessmentResultsTable.assessmentId, assessmentId)))
    .orderBy(desc(assessmentResultsTable.completedAt))
    .limit(1);

  if (!result) { res.status(404).json({ message: "No result found" }); return; }

  const categoryLabels: Record<string, string> = {
    risk_tolerance: "Risk Tolerance", impulsiveness: "Impulsiveness",
    security_awareness: "Security Awareness", decision_making: "Decision Making",
    attention_to_detail: "Attention to Detail", trust_tendencies: "Trust Tendencies",
    stress_response: "Stress Response", compliance_behavior: "Compliance Behavior",
    phishing_recognition: "Phishing Recognition", password_hygiene: "Password Hygiene",
    social_engineering: "Social Engineering Resistance", data_handling: "Data Handling",
    incident_response: "Incident Response", device_security: "Device Security",
    remote_work: "Remote Work Security", cloud_security: "Cloud Security",
  };

  const scores = result.categoryScores as Record<string, number>;
  res.json({
    id: result.id,
    assessmentId: result.assessmentId,
    overallScore: result.overallScore,
    categoryScores: Object.entries(scores).map(([cat, score]) => ({
      category: cat,
      score,
      label: categoryLabels[cat] ?? cat,
    })),
    timeTakenSec: result.timeTakenSec,
    completedAt: result.completedAt.toISOString(),
  });
});

export default router;
