import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  departmentsTable,
  cciSnapshotsTable,
  userCourseProgressTable,
  gamificationProfilesTable,
  badgesTable,
  userBadgesTable,
} from "@workspace/db/schema";
import { eq, desc, avg, count, sql, gte, inArray } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();

router.get(
  "/hr/dashboard",
  requireAuth,
  requireRole(...["hr", "admin", "superadmin"]),
  async (req, res) => {
    const employees = await db
      .select({
        id: usersTable.id,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        email: usersTable.email,
        jobTitle: usersTable.jobTitle,
        departmentId: usersTable.departmentId,
        departmentName: departmentsTable.name,
        cciScore: cciSnapshotsTable.cciScore,
        humanRiskScore: cciSnapshotsTable.humanRiskScore,
        complianceBehaviorScore: cciSnapshotsTable.complianceBehaviorScore,
        xp: gamificationProfilesTable.xp,
        level: gamificationProfilesTable.level,
        streakDays: gamificationProfilesTable.streakDays,
        lastActivityAt: gamificationProfilesTable.lastActivityAt,
      })
      .from(usersTable)
      .leftJoin(departmentsTable, eq(usersTable.departmentId, departmentsTable.id))
      .leftJoin(cciSnapshotsTable, eq(usersTable.id, cciSnapshotsTable.userId))
      .leftJoin(gamificationProfilesTable, eq(usersTable.id, gamificationProfilesTable.userId))
      .where(sql`${usersTable.role} not in ('admin', 'superadmin')`)
      .orderBy(usersTable.firstName);

    const learningStats = await db
      .select({
        userId: userCourseProgressTable.userId,
        completed: sql<number>`sum(case when ${userCourseProgressTable.completedAt} is not null then 1 else 0 end)`,
        total: count(userCourseProgressTable.id),
      })
      .from(userCourseProgressTable)
      .groupBy(userCourseProgressTable.userId);

    const learningMap = new Map(learningStats.map((l) => [l.userId, l]));

    const deptLearning = await db
      .select({
        name: departmentsTable.name,
        avgXp: avg(gamificationProfilesTable.xp),
        userCount: count(usersTable.id),
        completedCourses: sql<number>`sum(case when ${userCourseProgressTable.completedAt} is not null then 1 else 0 end)`,
        totalEnrolled: count(userCourseProgressTable.id),
        avgStreak: avg(gamificationProfilesTable.streakDays),
      })
      .from(departmentsTable)
      .leftJoin(usersTable, eq(departmentsTable.id, usersTable.departmentId))
      .leftJoin(gamificationProfilesTable, eq(usersTable.id, gamificationProfilesTable.userId))
      .leftJoin(userCourseProgressTable, eq(usersTable.id, userCourseProgressTable.userId))
      .groupBy(departmentsTable.id, departmentsTable.name)
      .orderBy(departmentsTable.name);

    const riskBands = await db
      .select({
        band: sql<string>`
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

    const [summary] = await db
      .select({
        totalEmployees: count(usersTable.id),
        avgCci: avg(cciSnapshotsTable.cciScore),
        avgHrs: avg(cciSnapshotsTable.humanRiskScore),
        avgCompliance: avg(cciSnapshotsTable.complianceBehaviorScore),
        avgXp: avg(gamificationProfilesTable.xp),
        avgStreak: avg(gamificationProfilesTable.streakDays),
      })
      .from(usersTable)
      .leftJoin(cciSnapshotsTable, eq(usersTable.id, cciSnapshotsTable.userId))
      .leftJoin(gamificationProfilesTable, eq(usersTable.id, gamificationProfilesTable.userId))
      .where(sql`${usersTable.role} not in ('admin', 'superadmin')`);

    // Champions leaderboard — top 5 by XP
    const champions = await db
      .select({
        userId: gamificationProfilesTable.userId,
        xp: gamificationProfilesTable.xp,
        level: gamificationProfilesTable.level,
        streakDays: gamificationProfilesTable.streakDays,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        departmentName: departmentsTable.name,
        jobTitle: usersTable.jobTitle,
      })
      .from(gamificationProfilesTable)
      .innerJoin(usersTable, eq(gamificationProfilesTable.userId, usersTable.id))
      .leftJoin(departmentsTable, eq(usersTable.departmentId, departmentsTable.id))
      .where(sql`${usersTable.role} not in ('admin', 'superadmin')`)
      .orderBy(desc(gamificationProfilesTable.xp))
      .limit(5);

    // Badge counts per champion
    const champIds = champions.map((c) => c.userId);
    const badgeCounts = champIds.length > 0
      ? await db
          .select({
            userId: userBadgesTable.userId,
            badgeCount: count(userBadgesTable.id),
          })
          .from(userBadgesTable)
          .where(inArray(userBadgesTable.userId, champIds))
          .groupBy(userBadgesTable.userId)
      : [];
    const badgeMap = new Map(badgeCounts.map((b) => [b.userId, Number(b.badgeCount)]));

    // Engagement metrics
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [weeklyActive] = await db
      .select({ count: count(gamificationProfilesTable.userId) })
      .from(gamificationProfilesTable)
      .where(gte(gamificationProfilesTable.lastActivityAt, sevenDaysAgo));

    const [assessmentStats] = await db
      .select({
        totalEmployees: count(usersTable.id),
      })
      .from(usersTable)
      .where(sql`${usersTable.role} = 'employee'`);

    const totalEmployeesNum = Number(summary?.totalEmployees ?? 0);
    const avgXp = Math.round(Number(summary?.avgXp ?? 0));
    const avgStreak = Math.round(Number(summary?.avgStreak ?? 0));
    const weeklyActiveCount = Number(weeklyActive?.count ?? 0);
    const engagementRate = totalEmployeesNum > 0
      ? Math.round((weeklyActiveCount / totalEmployeesNum) * 100)
      : 0;

    const totalLearning = learningStats.reduce((acc, l) => acc + Number(l.total), 0);
    const completedLearning = learningStats.reduce((acc, l) => acc + Number(l.completed), 0);
    const courseCompletionRate = totalLearning > 0
      ? Math.round((completedLearning / totalLearning) * 100)
      : 0;

    res.json({
      summary: {
        totalEmployees: totalEmployeesNum,
        avgCci: Math.round(Number(summary?.avgCci ?? 0)),
        avgHrs: Math.round(Number(summary?.avgHrs ?? 0)),
        avgCompliance: Math.round(Number(summary?.avgCompliance ?? 0)),
        avgXp,
        avgStreak,
      },
      employees: employees.map((e) => {
        const ls = learningMap.get(e.id);
        return {
          id: e.id,
          name: `${e.firstName} ${e.lastName}`,
          email: e.email,
          jobTitle: e.jobTitle ?? "—",
          department: e.departmentName ?? "—",
          cciScore: Math.round(e.cciScore ?? 0),
          humanRiskScore: Math.round(e.humanRiskScore ?? 0),
          complianceScore: Math.round(e.complianceBehaviorScore ?? 0),
          xp: e.xp ?? 0,
          level: e.level ?? 1,
          streakDays: e.streakDays ?? 0,
          coursesCompleted: Number(ls?.completed ?? 0),
          coursesTotal: Number(ls?.total ?? 0),
        };
      }),
      deptLearning: deptLearning.map((d) => ({
        name: d.name,
        avgXp: Math.round(Number(d.avgXp ?? 0)),
        userCount: Number(d.userCount),
        avgStreak: Math.round(Number(d.avgStreak ?? 0)),
        completionRate:
          Number(d.totalEnrolled) > 0
            ? Math.round((Number(d.completedCourses) / Number(d.totalEnrolled)) * 100)
            : 0,
      })),
      riskDistribution: riskBands.map((r) => ({
        band: r.band,
        count: Number(r.count),
      })),
      champions: champions.map((c, idx) => ({
        rank: idx + 1,
        userId: c.userId,
        name: `${c.firstName} ${c.lastName}`,
        jobTitle: c.jobTitle ?? "—",
        department: c.departmentName ?? "—",
        xp: c.xp ?? 0,
        level: c.level ?? 1,
        streakDays: c.streakDays ?? 0,
        badgeCount: badgeMap.get(c.userId) ?? 0,
      })),
      engagement: {
        weeklyActiveCount,
        engagementRate,
        courseCompletionRate,
        avgStreak,
        avgXp,
      },
    });
  }
);

export default router;
