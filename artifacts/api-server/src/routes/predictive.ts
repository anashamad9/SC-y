import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  cciSnapshotsTable,
  psychometricProfilesTable,
  phishingResultsTable,
  phishingCampaignsTable,
  userCourseProgressTable,
} from "@workspace/db/schema";
import { eq, avg, count, isNotNull, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/auth";

const router = Router();

type RiskLevel = "low" | "moderate" | "high" | "critical";

function toLevel(score: number): RiskLevel {
  if (score < 30) return "low";
  if (score < 55) return "moderate";
  if (score < 75) return "high";
  return "critical";
}

function confidenceFromSampleSize(n: number, total: number): number {
  if (total === 0) return 0;
  const coverage = Math.min(1, n / total);
  return Math.round(50 + coverage * 45);
}

router.get(
  "/predictive/org",
  requireAuth,
  requireRole("executive", "hr", "admin", "superadmin"),
  async (req, res) => {
    try {
      const [orgStats] = await db
        .select({
          totalUsers: count(usersTable.id),
          avgCci: avg(cciSnapshotsTable.cciScore),
          avgHrs: avg(cciSnapshotsTable.humanRiskScore),
          avgCompliance: avg(cciSnapshotsTable.complianceBehaviorScore),
          avgBehavioral: avg(cciSnapshotsTable.behavioralStabilityScore),
          avgDecision: avg(cciSnapshotsTable.decisionQualityScore),
          avgCulture: avg(cciSnapshotsTable.cultureContributionScore),
          usersWithCci: count(cciSnapshotsTable.id),
        })
        .from(usersTable)
        .leftJoin(cciSnapshotsTable, eq(usersTable.id, cciSnapshotsTable.userId));

      const [psychoAvg] = await db
        .select({
          avgSecurityAwareness: avg(psychometricProfilesTable.securityAwareness),
          avgComplianceBehavior: avg(psychometricProfilesTable.complianceBehavior),
          avgDecisionMaking: avg(psychometricProfilesTable.decisionMaking),
          avgAttentionToDetail: avg(psychometricProfilesTable.attentionToDetail),
          avgStressResponse: avg(psychometricProfilesTable.stressResponse),
          avgRiskTolerance: avg(psychometricProfilesTable.riskTolerance),
          avgImpulsiveness: avg(psychometricProfilesTable.impulsiveness),
          avgTrustTendencies: avg(psychometricProfilesTable.trustTendencies),
          usersWithProfile: count(psychometricProfilesTable.userId),
        })
        .from(psychometricProfilesTable);

      const [phishStats] = await db
        .select({
          totalSent: count(phishingResultsTable.id),
          totalClicked: count(phishingResultsTable.clickedAt),
          totalReported: count(phishingResultsTable.reportedAt),
          usersPhished: sql<number>`count(distinct ${phishingResultsTable.userId})`,
        })
        .from(phishingResultsTable);

      const [progressStats] = await db
        .select({
          totalCompleted: count(userCourseProgressTable.completedAt),
          usersActive: sql<number>`count(distinct ${userCourseProgressTable.userId})`,
        })
        .from(userCourseProgressTable)
        .where(isNotNull(userCourseProgressTable.completedAt));

      const total = Number(orgStats?.totalUsers ?? 1);
      const usersWithCci = Number(orgStats?.usersWithCci ?? 0);
      const usersWithProfile = Number(psychoAvg?.usersWithProfile ?? 0);
      const totalSent = Number(phishStats?.totalSent ?? 0);
      const totalClicked = Number(phishStats?.totalClicked ?? 0);
      const totalReported = Number(phishStats?.totalReported ?? 0);

      const avgSecurityAwareness = Math.round(Number(psychoAvg?.avgSecurityAwareness ?? 50));
      const avgRiskTolerance = Math.round(Number(psychoAvg?.avgRiskTolerance ?? 50));
      const avgImpulsiveness = Math.round(Number(psychoAvg?.avgImpulsiveness ?? 50));
      const avgTrustTendencies = Math.round(Number(psychoAvg?.avgTrustTendencies ?? 50));
      const avgAttentionToDetail = Math.round(Number(psychoAvg?.avgAttentionToDetail ?? 50));
      const avgStressResponse = Math.round(Number(psychoAvg?.avgStressResponse ?? 50));
      const avgDecisionMaking = Math.round(Number(psychoAvg?.avgDecisionMaking ?? 50));
      const avgComplianceBehavior = Math.round(Number(psychoAvg?.avgComplianceBehavior ?? 50));

      const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 25;
      const reportRate = totalSent > 0 ? (totalReported / totalSent) * 100 : 20;
      const avgCompliance = Math.round(Number(orgStats?.avgCompliance ?? 50));
      const avgCulture = Math.round(Number(orgStats?.avgCulture ?? 50));

      // Phishing Susceptibility: driven by impulsiveness, trust tendencies, click history, and low security awareness
      const phishingSusceptibility = Math.round(
        avgImpulsiveness * 0.30 +
        avgTrustTendencies * 0.25 +
        Math.min(100, clickRate * 2) * 0.25 +
        (100 - avgSecurityAwareness) * 0.20
      );

      // Human Error Probability: driven by low attention, high impulsiveness, low decision quality
      const humanErrorProbability = Math.round(
        (100 - avgAttentionToDetail) * 0.35 +
        avgImpulsiveness * 0.35 +
        (100 - avgDecisionMaking) * 0.30
      );

      // Insider Threat Indicator: driven by high risk tolerance, low compliance, low culture contribution
      const insiderThreat = Math.round(
        avgRiskTolerance * 0.40 +
        (100 - avgComplianceBehavior) * 0.35 +
        (100 - avgCulture) * 0.25
      );

      // Security Fatigue: driven by low stress response (high fatigue), heavy course load, and low reporting
      const usersActive = Number(progressStats?.usersActive ?? 0);
      const loadFactor = total > 0 ? Math.min(100, (usersActive / total) * 120) : 50;
      const securityFatigue = Math.round(
        (100 - avgStressResponse) * 0.40 +
        loadFactor * 0.30 +
        (100 - Math.min(100, reportRate * 5)) * 0.30
      );

      // Reporting Likelihood: driven by security awareness, compliance, and historical report rate
      const reportingLikelihood = Math.round(
        avgSecurityAwareness * 0.40 +
        avgComplianceBehavior * 0.30 +
        Math.min(100, reportRate * 5) * 0.30
      );

      const profileConfidence = confidenceFromSampleSize(usersWithProfile, total);
      const phishConfidence = confidenceFromSampleSize(Number(phishStats?.usersPhished ?? 0), total);
      const cciConfidence = confidenceFromSampleSize(usersWithCci, total);

      res.json({
        indicators: [
          {
            key: "phishingSusceptibility",
            score: phishingSusceptibility,
            level: toLevel(phishingSusceptibility),
            confidence: Math.round((profileConfidence + phishConfidence) / 2),
            trend: phishingSusceptibility > 55 ? "increasing" : "stable",
            description: "Likelihood of falling victim to a phishing attempt based on behavioral patterns and historical click rates.",
          },
          {
            key: "humanErrorProbability",
            score: humanErrorProbability,
            level: toLevel(humanErrorProbability),
            confidence: profileConfidence,
            trend: humanErrorProbability > 60 ? "increasing" : "improving",
            description: "Probability of human error leading to a security incident based on attention, impulsiveness, and decision quality.",
          },
          {
            key: "insiderThreat",
            score: insiderThreat,
            level: toLevel(insiderThreat),
            confidence: Math.round((profileConfidence + cciConfidence) / 2),
            trend: insiderThreat > 50 ? "stable" : "improving",
            description: "Composite indicator of insider risk based on risk tolerance, compliance behavior, and cultural alignment.",
          },
          {
            key: "securityFatigue",
            score: securityFatigue,
            level: toLevel(securityFatigue),
            confidence: Math.round((profileConfidence + cciConfidence) / 2),
            trend: securityFatigue > 65 ? "worsening" : "stable",
            description: "Level of security fatigue affecting employee vigilance, driven by training load and stress response capacity.",
          },
          {
            key: "reportingLikelihood",
            score: reportingLikelihood,
            level: toLevel(100 - reportingLikelihood),
            confidence: Math.round((profileConfidence + phishConfidence) / 2),
            trend: reportingLikelihood > 60 ? "improving" : "stable",
            description: "Probability that employees will proactively report suspicious activity or incidents.",
          },
        ],
        meta: {
          totalUsers: total,
          usersWithProfile,
          usersWithCci,
          computedAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to compute predictive indicators" });
    }
  }
);

router.get(
  "/predictive/employee/:id",
  requireAuth,
  requireRole("executive", "hr", "admin", "superadmin"),
  async (req, res) => {
    try {
      const userId = parseInt(req.params.id as string);
      if (isNaN(userId)) { res.status(400).json({ error: "Invalid user id" }); return; }

      const [profile] = await db
        .select()
        .from(psychometricProfilesTable)
        .where(eq(psychometricProfilesTable.userId, userId));

      const [cci] = await db
        .select()
        .from(cciSnapshotsTable)
        .where(eq(cciSnapshotsTable.userId, userId));

      const phishHistory = await db
        .select({ clickedAt: phishingResultsTable.clickedAt, reportedAt: phishingResultsTable.reportedAt })
        .from(phishingResultsTable)
        .where(eq(phishingResultsTable.userId, userId));

      const totalPhish = phishHistory.length;
      const clicked = phishHistory.filter((r) => r.clickedAt !== null).length;
      const reported = phishHistory.filter((r) => r.reportedAt !== null).length;
      const clickRate = totalPhish > 0 ? (clicked / totalPhish) * 100 : 25;
      const reportRate = totalPhish > 0 ? (reported / totalPhish) * 100 : 20;

      const sa = profile?.securityAwareness ?? 50;
      const cb = profile?.complianceBehavior ?? 50;
      const dm = profile?.decisionMaking ?? 50;
      const ad = profile?.attentionToDetail ?? 50;
      const sr = profile?.stressResponse ?? 50;
      const rt = profile?.riskTolerance ?? 50;
      const imp = profile?.impulsiveness ?? 50;
      const tt = profile?.trustTendencies ?? 50;
      const culture = cci?.cultureContributionScore ?? 50;

      const phishingSusceptibility = Math.round(imp * 0.30 + tt * 0.25 + Math.min(100, clickRate * 2) * 0.25 + (100 - sa) * 0.20);
      const humanErrorProbability = Math.round((100 - ad) * 0.35 + imp * 0.35 + (100 - dm) * 0.30);
      const insiderThreat = Math.round(rt * 0.40 + (100 - cb) * 0.35 + (100 - culture) * 0.25);
      const securityFatigue = Math.round((100 - sr) * 0.45 + (100 - sa) * 0.30 + (100 - Math.min(100, reportRate * 5)) * 0.25);
      const reportingLikelihood = Math.round(sa * 0.40 + cb * 0.30 + Math.min(100, reportRate * 5) * 0.30);

      const hasProfile = !!profile;
      const hasCci = !!cci;
      const hasPhish = totalPhish > 0;
      const confidence = Math.round((Number(hasProfile) + Number(hasCci) + Number(hasPhish)) / 3 * 90 + 10);

      res.json({
        userId,
        indicators: [
          { key: "phishingSusceptibility", score: phishingSusceptibility, level: toLevel(phishingSusceptibility), confidence },
          { key: "humanErrorProbability", score: humanErrorProbability, level: toLevel(humanErrorProbability), confidence },
          { key: "insiderThreat", score: insiderThreat, level: toLevel(insiderThreat), confidence },
          { key: "securityFatigue", score: securityFatigue, level: toLevel(securityFatigue), confidence },
          { key: "reportingLikelihood", score: reportingLikelihood, level: toLevel(100 - reportingLikelihood), confidence },
        ],
        meta: { hasProfile, hasCci, hasPhish, totalPhishEvents: totalPhish, computedAt: new Date().toISOString() },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to compute employee predictive indicators" });
    }
  }
);

export default router;
