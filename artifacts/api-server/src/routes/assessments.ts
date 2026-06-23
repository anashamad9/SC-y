import { Router, type IRouter } from "express";
import { db, assessmentsTable, assessmentQuestionsTable, assessmentResultsTable, psychometricProfilesTable, gamificationProfilesTable, cciSnapshotsTable, usersTable } from "@workspace/db";
import { eq, and, desc, inArray } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

const RISKY_CATEGORIES = new Set(["risk_tolerance", "impulsiveness", "trust_tendencies"]);

interface QuestionOption { value: number; label: string; }

const READINESS_ASSESSMENT = {
  type: "psychometric",
  title: "CyberCultX Security Readiness Assessment",
  description: "Eight psychometric scenarios used to personalize security training recommendations.",
  estimatedMinutes: 8,
};

const READINESS_QUESTIONS = [
  {
    text: "You receive an urgent email from your manager asking you to review an attached document immediately.",
    category: "phishing_recognition",
    options: [
      { value: 1, label: "Open the attachment immediately." },
      { value: 3, label: "Reply asking if it is legitimate before opening." },
      { value: 4, label: "Verify the sender, inspect the email carefully, and confirm through another communication channel." },
      { value: 2, label: "Forward it to a colleague and ask what they think." },
    ],
  },
  {
    text: "You are asked to create a password for a new business application.",
    category: "password_hygiene",
    options: [
      { value: 1, label: "Use the same password you use elsewhere." },
      { value: 2, label: "Add numbers to your existing password." },
      { value: 3, label: "Create a unique password with a memorable pattern." },
      { value: 4, label: "Use a password manager to generate and store a strong unique password." },
    ],
  },
  {
    text: "You receive a QR code from an unknown source claiming you have won a reward.",
    category: "qr_safety",
    options: [
      { value: 1, label: "Scan it immediately." },
      { value: 2, label: "Ignore it without reporting it." },
      { value: 3, label: "Verify the source before scanning." },
      { value: 4, label: "Report it as suspicious and avoid interacting with it." },
    ],
  },
  {
    text: "While working remotely, you need internet access and only a public Wi-Fi network is available.",
    category: "remote_work",
    options: [
      { value: 1, label: "Connect directly and continue working." },
      { value: 2, label: "Avoid sensitive activities but continue browsing." },
      { value: 3, label: "Use a VPN before connecting to company resources." },
      { value: 4, label: "Use a trusted hotspot or VPN and follow company remote access policy." },
    ],
  },
  {
    text: "You notice a colleague sharing sensitive company information in a public chat.",
    category: "data_handling",
    options: [
      { value: 1, label: "Ignore it." },
      { value: 2, label: "Mention it privately later." },
      { value: 3, label: "Inform your manager immediately." },
      { value: 4, label: "Follow company reporting procedures and ensure the risk is addressed." },
    ],
  },
  {
    text: "You receive a login page that looks exactly like your company's portal.",
    category: "credential_safety",
    options: [
      { value: 1, label: "Enter credentials immediately." },
      { value: 2, label: "Check only the company logo." },
      { value: 3, label: "Verify the URL and security indicators first." },
      { value: 4, label: "Verify the URL, certificate, domain legitimacy, and access through official channels." },
    ],
  },
  {
    text: "A coworker asks to borrow your account credentials to complete an urgent task.",
    category: "access_control",
    options: [
      { value: 1, label: "Share them temporarily." },
      { value: 2, label: "Share only if they are a trusted colleague." },
      { value: 3, label: "Refuse and suggest requesting proper access." },
      { value: 4, label: "Refuse, explain policy requirements, and direct them to the approved access process." },
    ],
  },
  {
    text: "You notice unusual activity on your corporate account.",
    category: "incident_response",
    options: [
      { value: 1, label: "Ignore it and monitor later." },
      { value: 2, label: "Change your password only." },
      { value: 3, label: "Change your password and notify IT." },
      { value: 4, label: "Immediately report the incident, secure the account, and follow the organization's incident response process." },
    ],
  },
];

function readinessBand(totalPoints: number) {
  if (totalPoints <= 14) return { riskCategory: "High Risk", behavioralType: "Impulsive User" };
  if (totalPoints <= 21) return { riskCategory: "Elevated Risk", behavioralType: "Reactive User" };
  if (totalPoints <= 28) return { riskCategory: "Moderate Risk", behavioralType: "Security Aware User" };
  return { riskCategory: "Low Risk", behavioralType: "Security Champion Potential" };
}

function readinessPercent(totalPoints: number) {
  return Math.round(((Math.max(8, Math.min(32, totalPoints)) - 8) / 24) * 100);
}

async function ensureReadinessAssessment() {
  const [existing] = await db.select().from(assessmentsTable).where(eq(assessmentsTable.type, READINESS_ASSESSMENT.type)).limit(1);
  let assessment = existing;
  if (assessment) {
    [assessment] = await db.update(assessmentsTable)
      .set(READINESS_ASSESSMENT)
      .where(eq(assessmentsTable.id, assessment.id))
      .returning();
  } else {
    [assessment] = await db.insert(assessmentsTable).values(READINESS_ASSESSMENT).returning();
  }

  const currentQuestions = await db.select().from(assessmentQuestionsTable).where(eq(assessmentQuestionsTable.assessmentId, assessment.id));
  const needsRefresh =
    currentQuestions.length !== READINESS_QUESTIONS.length ||
    currentQuestions.some(q => READINESS_QUESTIONS[q.displayOrder - 1]?.text !== q.text);

  if (needsRefresh) {
    await db.delete(assessmentQuestionsTable).where(eq(assessmentQuestionsTable.assessmentId, assessment.id));
    await db.insert(assessmentQuestionsTable).values(READINESS_QUESTIONS.map((q, index) => ({
      assessmentId: assessment.id,
      text: q.text,
      category: q.category,
      options: q.options,
      weight: 1,
      displayOrder: index + 1,
    })));
  }

  return assessment;
}

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
  await ensureReadinessAssessment();
  const assessments = (await db.select().from(assessmentsTable)).filter(a => a.type === "psychometric");
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
  await ensureReadinessAssessment();
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

  if (assessment.type === "psychometric") {
    const categoryScoresMap: Record<string, number> = {};
    let totalPoints = 0;

    for (const q of questions) {
      const opts = q.options as QuestionOption[];
      const allowedValues = new Set(opts.map(o => o.value));
      const selectedVal = allowedValues.has(answers[String(q.id)]) ? answers[String(q.id)] : 1;
      categoryScoresMap[q.category] = selectedVal;
      totalPoints += selectedVal;
    }

    const { riskCategory, behavioralType } = readinessBand(totalPoints);
    const normalizedReadiness = readinessPercent(totalPoints);
    const normalizedRisk = 100 - normalizedReadiness;

    const [result] = await db.insert(assessmentResultsTable).values({
      userId,
      assessmentId,
      answers,
      categoryScores: {
        ...categoryScoresMap,
        total_points: totalPoints,
        max_points: 32,
        readiness_percent: normalizedReadiness,
        risk_category: riskCategory,
        behavioral_type: behavioralType,
      },
      overallScore: totalPoints,
      timeTakenSec: timeTakenSec ?? null,
    }).returning();

    const profileData = {
      riskTolerance: normalizedRisk,
      impulsiveness: normalizedRisk,
      securityAwareness: normalizedReadiness,
      decisionMaking: normalizedReadiness,
      attentionToDetail: normalizedReadiness,
      trustTendencies: normalizedRisk,
      stressResponse: normalizedReadiness,
      complianceBehavior: normalizedReadiness,
      behavioralType,
      learningStyle: "Personalized Video Path",
      riskCategory,
      securityReadinessScore: totalPoints,
    };

    const [existing] = await db.select({ id: psychometricProfilesTable.id }).from(psychometricProfilesTable).where(eq(psychometricProfilesTable.userId, userId));
    if (existing) {
      await db.update(psychometricProfilesTable).set(profileData).where(eq(psychometricProfilesTable.userId, userId));
    } else {
      await db.insert(psychometricProfilesTable).values({ userId, ...profileData });
    }

    await db.insert(cciSnapshotsTable).values({
      userId,
      cciScore: normalizedReadiness,
      humanRiskScore: normalizedRisk,
      behavioralStabilityScore: normalizedReadiness,
      decisionQualityScore: normalizedReadiness,
      cultureContributionScore: normalizedReadiness,
      complianceBehaviorScore: normalizedReadiness,
    });

    const xpGain = 50 + totalPoints;
    const [gp] = await db.select().from(gamificationProfilesTable).where(eq(gamificationProfilesTable.userId, userId));
    if (gp) {
      const newXp = gp.xp + xpGain;
      await db.update(gamificationProfilesTable).set({ xp: newXp, level: Math.floor(newXp / 200) + 1, lastActivityAt: new Date() }).where(eq(gamificationProfilesTable.userId, userId));
    }

    await db.update(usersTable).set({ onboardingCompleted: true }).where(eq(usersTable.id, userId));

    res.json({
      id: result.id,
      assessmentId: result.assessmentId,
      overallScore: totalPoints,
      totalPoints,
      maxPoints: 32,
      riskCategory,
      behavioralType,
      readinessPercent: normalizedReadiness,
      categoryScores: Object.entries(categoryScoresMap).map(([cat, score]) => ({
        category: cat,
        score,
        label: cat.replace(/_/g, " "),
      })),
      timeTakenSec: result.timeTakenSec,
      completedAt: result.completedAt.toISOString(),
    });
    return;
  }

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

  await db.update(usersTable).set({ onboardingCompleted: true }).where(eq(usersTable.id, userId));

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
