import { Router, type IRouter } from "express";
import { db, gamificationProfilesTable, badgesTable, userBadgesTable, usersTable, departmentsTable, cciSnapshotsTable } from "@workspace/db";
import { eq, desc, sql, and, gt, inArray } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function levelXp(level: number) {
  return level * 200;
}

// GET /gamification/me
router.get("/gamification/me", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const [gp] = await db.select().from(gamificationProfilesTable).where(eq(gamificationProfilesTable.userId, userId));

  if (!gp) {
    res.json({ userId, xp: 0, level: 1, streakDays: 0, nextLevelXp: 200, currentLevelXp: 0, lastActivityAt: null });
    return;
  }

  const currentLevelXp = levelXp(gp.level - 1);
  const nextLevelXp = levelXp(gp.level);

  res.json({
    userId: gp.userId,
    xp: gp.xp,
    level: gp.level,
    streakDays: gp.streakDays,
    nextLevelXp,
    currentLevelXp,
    lastActivityAt: gp.lastActivityAt?.toISOString() ?? null,
  });
});

// GET /gamification/badges
router.get("/gamification/badges", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;

  const userBadges = await db
    .select({
      badgeId: userBadgesTable.badgeId,
      earnedAt: userBadgesTable.earnedAt,
      name: badgesTable.name,
      description: badgesTable.description,
      iconName: badgesTable.iconName,
      category: badgesTable.category,
    })
    .from(userBadgesTable)
    .innerJoin(badgesTable, eq(userBadgesTable.badgeId, badgesTable.id))
    .where(eq(userBadgesTable.userId, userId))
    .orderBy(desc(userBadgesTable.earnedAt));

  res.json(userBadges.map(b => ({
    badgeId: b.badgeId,
    name: b.name,
    description: b.description,
    iconName: b.iconName,
    category: b.category,
    earnedAt: b.earnedAt.toISOString(),
  })));
});

// GET /leaderboard
router.get("/leaderboard", requireAuth, async (req, res): Promise<void> => {
  const currentUserId = req.user!.userId;
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const departmentId = req.query.departmentId ? Number(req.query.departmentId) : null;
  const [currentUser] = await db
    .select({ tenantId: usersTable.tenantId })
    .from(usersTable)
    .where(eq(usersTable.id, currentUserId))
    .limit(1);

  if (!currentUser?.tenantId) {
    res.json({ entries: [], currentUserRank: null });
    return;
  }

  const baseJoin = db
    .select({
      userId: gamificationProfilesTable.userId,
      xp: gamificationProfilesTable.xp,
      level: gamificationProfilesTable.level,
      streakDays: gamificationProfilesTable.streakDays,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      departmentId: usersTable.departmentId,
    })
    .from(gamificationProfilesTable)
    .innerJoin(usersTable, eq(gamificationProfilesTable.userId, usersTable.id));

  // Compare only employee members from the authenticated user's tenant.
  const sameTenantCondition = eq(usersTable.tenantId, currentUser.tenantId);
  const employeeOnlyCondition = sql`lower(${usersTable.role}) = 'employee'`;
  const leaderboardCondition = departmentId
    ? and(sameTenantCondition, employeeOnlyCondition, eq(usersTable.departmentId, departmentId))
    : and(sameTenantCondition, employeeOnlyCondition);

  const entries = departmentId
    ? await baseJoin.where(leaderboardCondition).orderBy(desc(gamificationProfilesTable.xp)).limit(limit)
    : await baseJoin.where(leaderboardCondition).orderBy(desc(gamificationProfilesTable.xp)).limit(limit);

  const deptIds = [...new Set(entries.map(e => e.departmentId).filter(Boolean))] as number[];
  const depts = deptIds.length > 0
    ? await db.select().from(departmentsTable).where(inArray(departmentsTable.id, deptIds))
    : [];
  const deptMap = new Map(depts.map(d => [d.id, d.name]));

  const entryUserIds = entries.map(e => e.userId);
  const cciSnapshots = entryUserIds.length > 0
    ? await db.select({ userId: cciSnapshotsTable.userId, cciScore: cciSnapshotsTable.cciScore })
      .from(cciSnapshotsTable)
      .where(inArray(cciSnapshotsTable.userId, entryUserIds))
      .orderBy(desc(cciSnapshotsTable.computedAt))
    : [];
  const cciMap = new Map<number, number>();
  for (const s of cciSnapshots) if (!cciMap.has(s.userId)) cciMap.set(s.userId, s.cciScore);

  const result = entries.map((e, idx) => ({
    rank: idx + 1,
    userId: e.userId,
    firstName: e.firstName,
    lastName: e.lastName,
    departmentName: e.departmentId ? (deptMap.get(e.departmentId) ?? null) : null,
    xp: e.xp,
    level: e.level,
    streakDays: e.streakDays,
    cciScore: cciMap.get(e.userId) ?? 50,
    isCurrentUser: e.userId === currentUserId,
  }));

  // currentUserRank from the result set if present; otherwise compute against full filtered population
  let currentUserRank: number | null = result.find(e => e.isCurrentUser)?.rank ?? null;

  if (currentUserRank === null) {
    const [userGp] = await db
      .select({ xp: gamificationProfilesTable.xp })
      .from(gamificationProfilesTable)
      .where(eq(gamificationProfilesTable.userId, currentUserId))
      .limit(1);

    if (userGp) {
      const aboveCondition = departmentId
        ? and(sameTenantCondition, employeeOnlyCondition, eq(usersTable.departmentId, departmentId), gt(gamificationProfilesTable.xp, userGp.xp))
        : and(sameTenantCondition, employeeOnlyCondition, gt(gamificationProfilesTable.xp, userGp.xp));

      const [rankRow] = await db
        .select({ cnt: sql<number>`cast(count(*) as int)` })
        .from(gamificationProfilesTable)
        .innerJoin(usersTable, eq(gamificationProfilesTable.userId, usersTable.id))
        .where(aboveCondition);

      currentUserRank = (rankRow?.cnt ?? 0) + 1;
    }
  }

  res.json({ entries: result, currentUserRank });
});

export default router;
