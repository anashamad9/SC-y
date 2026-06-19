import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  departmentsTable,
  cciSnapshotsTable,
  psychometricProfilesTable,
  userCourseProgressTable,
  phishingResultsTable,
  gamificationProfilesTable,
} from "@workspace/db/schema";
import { eq, desc, avg, count, sql, gte } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();

router.get(
  "/executive/dashboard",
  requireAuth,
  requireRole(...["executive", "admin", "superadmin"]),
  async (req, res) => {
    const [orgStats] = await db
      .select({
        totalUsers: count(usersTable.id),
        avgCci: avg(cciSnapshotsTable.cciScore),
        avgHrs: avg(cciSnapshotsTable.humanRiskScore),
        avgCompliance: avg(cciSnapshotsTable.complianceBehaviorScore),
        avgBehavioral: avg(cciSnapshotsTable.behavioralStabilityScore),
        avgDecision: avg(cciSnapshotsTable.decisionQualityScore),
        avgCulture: avg(cciSnapshotsTable.cultureContributionScore),
      })
      .from(usersTable)
      .leftJoin(cciSnapshotsTable, eq(usersTable.id, cciSnapshotsTable.userId));

    const departments = await db
      .select({
        id: departmentsTable.id,
        name: departmentsTable.name,
        userCount: count(usersTable.id),
        avgCci: avg(cciSnapshotsTable.cciScore),
        avgHrs: avg(cciSnapshotsTable.humanRiskScore),
        avgCompliance: avg(cciSnapshotsTable.complianceBehaviorScore),
      })
      .from(departmentsTable)
      .leftJoin(usersTable, eq(departmentsTable.id, usersTable.departmentId))
      .leftJoin(cciSnapshotsTable, eq(usersTable.id, cciSnapshotsTable.userId))
      .groupBy(departmentsTable.id, departmentsTable.name)
      .orderBy(departmentsTable.name);

    const phishingStats = await db
      .select({
        total: count(phishingResultsTable.id),
        clicked: sql<number>`sum(case when ${phishingResultsTable.clickedAt} is not null then 1 else 0 end)`,
        reported: sql<number>`sum(case when ${phishingResultsTable.reportedAt} is not null then 1 else 0 end)`,
        opened: sql<number>`sum(case when ${phishingResultsTable.openedAt} is not null then 1 else 0 end)`,
      })
      .from(phishingResultsTable);

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const cciTrend = await db
      .select({
        month: sql<string>`to_char(date_trunc('week', ${cciSnapshotsTable.computedAt}), 'Mon DD')`,
        week: sql<string>`date_trunc('week', ${cciSnapshotsTable.computedAt})`,
        avgCci: avg(cciSnapshotsTable.cciScore),
        avgHrs: avg(cciSnapshotsTable.humanRiskScore),
        avgCompliance: avg(cciSnapshotsTable.complianceBehaviorScore),
      })
      .from(cciSnapshotsTable)
      .where(gte(cciSnapshotsTable.computedAt, ninetyDaysAgo))
      .groupBy(sql`date_trunc('week', ${cciSnapshotsTable.computedAt})`)
      .orderBy(sql`date_trunc('week', ${cciSnapshotsTable.computedAt})`);

    const riskDistribution = await db
      .select({
        riskCategory: sql<string>`
          case
            when ${cciSnapshotsTable.humanRiskScore} > 75 then 'Critical'
            when ${cciSnapshotsTable.humanRiskScore} > 60 then 'High'
            when ${cciSnapshotsTable.humanRiskScore} > 40 then 'Medium'
            else 'Low'
          end
        `,
        count: count(cciSnapshotsTable.id),
      })
      .from(cciSnapshotsTable)
      .groupBy(
        sql`case
          when ${cciSnapshotsTable.humanRiskScore} > 75 then 'Critical'
          when ${cciSnapshotsTable.humanRiskScore} > 60 then 'High'
          when ${cciSnapshotsTable.humanRiskScore} > 40 then 'Medium'
          else 'Low'
        end`
      );

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
      })
      .from(psychometricProfilesTable);

    const ps = phishingStats[0];
    const total = Number(ps?.total ?? 0);
    const clicked = Number(ps?.clicked ?? 0);
    const reported = Number(ps?.reported ?? 0);
    const opened = Number(ps?.opened ?? 0);
    const clickRate = total > 0 ? Math.round((clicked / total) * 100) : 0;
    const reportRate = total > 0 ? Math.round((reported / total) * 100) : 0;

    const avgCci = Math.round(Number(orgStats?.avgCci ?? 0));
    const avgHrs = Math.round(Number(orgStats?.avgHrs ?? 0));
    const avgCompliance = Math.round(Number(orgStats?.avgCompliance ?? 0));
    const totalUsers = Number(orgStats?.totalUsers ?? 0);

    const avgBehavioral = Math.round(Number(orgStats?.avgBehavioral ?? 0));
    const avgDecision = Math.round(Number(orgStats?.avgDecision ?? 0));
    const avgCulture = Math.round(Number(orgStats?.avgCulture ?? 0));
    const cultureIndex = Math.round((avgCci + avgCompliance + avgBehavioral + avgCulture) / 4);

    // Maturity radar — 6 dimensions derived from real data
    const securityAwareness = Math.round(Number(psychoAvg?.avgSecurityAwareness ?? 50));
    const complianceDim = Math.round(Number(psychoAvg?.avgComplianceBehavior ?? 50));
    const decisionDim = Math.round(Number(psychoAvg?.avgDecisionMaking ?? 50));
    const phishingAwareness = Math.round(100 - clickRate);
    const riskManagement = Math.round(100 - (Number(psychoAvg?.avgRiskTolerance ?? 50) * 0.7));
    const incidentResponse = Math.round(Number(psychoAvg?.avgStressResponse ?? 50));

    // 30/60/90 day forecast — linear extrapolation from trend
    const trendPoints = cciTrend.map((t) => ({
      cci: Math.round(Number(t.avgCci ?? 0)),
      hrs: Math.round(Number(t.avgHrs ?? 0)),
    }));
    function forecastLinear(data: { cci: number; hrs: number }[], weeks: number) {
      if (data.length < 2) return { cciPrediction: avgCci, hrsPrediction: avgHrs, confidence: 60 };
      const n = data.length;
      const lastN = data.slice(-Math.min(n, 6));
      const cciDelta = (lastN[lastN.length - 1].cci - lastN[0].cci) / Math.max(lastN.length - 1, 1);
      const hrsDelta = (lastN[lastN.length - 1].hrs - lastN[0].hrs) / Math.max(lastN.length - 1, 1);
      return {
        cciPrediction: Math.min(100, Math.max(0, Math.round(lastN[lastN.length - 1].cci + cciDelta * weeks))),
        hrsPrediction: Math.min(100, Math.max(0, Math.round(lastN[lastN.length - 1].hrs + hrsDelta * weeks))),
        confidence: Math.max(50, Math.min(90, 70 + lastN.length * 2)),
      };
    }

    // Financial risk estimate: avg industry cost per breach per employee = ~$4,800 for SME
    const breachProbability = (clickRate / 100) * 0.15;
    const estimatedAnnualLoss = Math.round(totalUsers * 4800 * breachProbability / 1000) * 1000;
    const financialRiskReduction = Math.round((1 - (clickRate / 100)) * 100);

    // Vulnerability ranking — departments sorted by avg HRS descending (most risky first)
    const vulnRanking = departments
      .map((d) => ({
        name: d.name,
        avgHrs: Math.round(Number(d.avgHrs ?? 0)),
        avgCci: Math.round(Number(d.avgCci ?? 0)),
        userCount: Number(d.userCount),
        riskLevel:
          Number(d.avgHrs) > 75 ? "Critical" :
          Number(d.avgHrs) > 60 ? "High" :
          Number(d.avgHrs) > 40 ? "Medium" : "Low",
      }))
      .sort((a, b) => b.avgHrs - a.avgHrs)
      .slice(0, 8);

    res.json({
      org: {
        totalUsers,
        avgCci,
        avgHrs,
        avgCompliance,
        cultureIndex,
      },
      departments: departments.map((d) => ({
        id: d.id,
        name: d.name,
        userCount: Number(d.userCount),
        avgCci: Math.round(Number(d.avgCci ?? 0)),
        avgHrs: Math.round(Number(d.avgHrs ?? 0)),
        avgCompliance: Math.round(Number(d.avgCompliance ?? 0)),
      })),
      phishing: {
        total,
        clicked,
        opened,
        reported,
        clickRate,
        reportRate,
        openRate: total > 0 ? Math.round((opened / total) * 100) : 0,
      },
      cciTrend: cciTrend.map((t) => ({
        label: t.month,
        cci: Math.round(Number(t.avgCci ?? 0)),
        hrs: Math.round(Number(t.avgHrs ?? 0)),
        compliance: Math.round(Number(t.avgCompliance ?? 0)),
      })),
      riskDistribution: riskDistribution.map((r) => ({
        category: r.riskCategory,
        count: Number(r.count),
      })),
      maturityRadar: [
        { dimension: "Security Awareness", score: securityAwareness },
        { dimension: "Compliance", score: complianceDim },
        { dimension: "Decision Making", score: decisionDim },
        { dimension: "Phishing Awareness", score: phishingAwareness },
        { dimension: "Risk Management", score: riskManagement },
        { dimension: "Incident Response", score: incidentResponse },
      ],
      forecast: {
        days30: forecastLinear(trendPoints, 4),
        days60: forecastLinear(trendPoints, 8),
        days90: forecastLinear(trendPoints, 12),
      },
      financialRisk: {
        estimatedAnnualLoss,
        financialRiskReduction,
        breachProbabilityPct: Math.round(breachProbability * 100),
        totalUsers,
      },
      vulnerabilityRanking: vulnRanking,
      complianceGauge: {
        score: avgCompliance,
        breakdown: departments
          .filter((d) => Number(d.userCount) > 0)
          .map((d) => ({
            name: d.name,
            score: Math.round(Number(d.avgCompliance ?? 0)),
          }))
          .sort((a, b) => a.score - b.score)
          .slice(0, 8),
      },
    });
  }
);

export default router;
