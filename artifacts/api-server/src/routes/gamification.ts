import { Router, type IRouter } from "express";
import { db, gamificationProfilesTable, badgesTable, userBadgesTable, usersTable, departmentsTable, cciSnapshotsTable } from "@workspace/db";
import { eq, desc, sql, and, gt, inArray } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();
const MAX_BADGE_IMAGE_BYTES = 512 * 1024;

function normalizeOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

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

// GET /gamification/badge-catalog — superadmin badge library
router.get("/gamification/badge-catalog", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  if (user.role?.toLowerCase() !== "superadmin") {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const badges = await db
    .select()
    .from(badgesTable)
    .where(eq(badgesTable.isActive, true))
    .orderBy(desc(badgesTable.id));

  res.json(badges.map(b => ({
    id: b.id,
    name: b.name,
    description: b.description,
    iconName: b.iconName,
    imageUrl: b.imageUrl,
    imageFileName: b.imageFileName,
    imageSizeBytes: b.imageSizeBytes,
    category: b.category,
    xpRequired: b.xpRequired,
  })));
});

// POST /gamification/badge-catalog — create PNG badge (superadmin only)
router.post("/gamification/badge-catalog", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  if (user.role?.toLowerCase() !== "superadmin") {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const name = normalizeOptionalString(req.body?.name);
  const description = normalizeOptionalString(req.body?.description);
  const imageUrl = normalizeOptionalString(req.body?.imageUrl);
  const imageFileName = normalizeOptionalString(req.body?.imageFileName);
  const imageSizeBytes = Number(req.body?.imageSizeBytes ?? 0);

  if (!name || !description || !imageUrl || !imageUrl.startsWith("data:image/png")) {
    res.status(400).json({ error: "Badge name, description, and PNG image are required." }); return;
  }
  if (!Number.isFinite(imageSizeBytes) || imageSizeBytes <= 0 || imageSizeBytes > MAX_BADGE_IMAGE_BYTES) {
    res.status(400).json({ error: "Badge PNG must be 512KB or smaller." }); return;
  }

  const [badge] = await db.insert(badgesTable).values({
    name,
    description,
    iconName: "image",
    imageUrl,
    imageFileName,
    imageSizeBytes,
    category: normalizeOptionalString(req.body?.category) ?? "course",
    xpRequired: 0,
  }).returning();

  res.status(201).json({
    id: badge.id,
    name: badge.name,
    description: badge.description,
    iconName: badge.iconName,
    imageUrl: badge.imageUrl,
    imageFileName: badge.imageFileName,
    imageSizeBytes: badge.imageSizeBytes,
    category: badge.category,
    xpRequired: badge.xpRequired,
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
      imageUrl: badgesTable.imageUrl,
      imageFileName: badgesTable.imageFileName,
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
    imageUrl: b.imageUrl,
    imageFileName: b.imageFileName,
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
      avatarUrl: usersTable.avatarUrl,
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

  const earnedBadges = entryUserIds.length > 0
    ? await db
      .select({
        userId: userBadgesTable.userId,
        badgeId: userBadgesTable.badgeId,
        earnedAt: userBadgesTable.earnedAt,
        name: badgesTable.name,
        imageUrl: badgesTable.imageUrl,
      })
      .from(userBadgesTable)
      .innerJoin(badgesTable, eq(userBadgesTable.badgeId, badgesTable.id))
      .where(inArray(userBadgesTable.userId, entryUserIds))
      .orderBy(desc(userBadgesTable.earnedAt))
    : [];
  const badgeMap = new Map<number, Array<{ badgeId: number; name: string; imageUrl: string | null; earnedAt: string }>>();
  for (const badge of earnedBadges) {
    const current = badgeMap.get(badge.userId) ?? [];
    if (current.length < 3) {
      current.push({
        badgeId: badge.badgeId,
        name: badge.name,
        imageUrl: badge.imageUrl,
        earnedAt: badge.earnedAt.toISOString(),
      });
      badgeMap.set(badge.userId, current);
    }
  }

  const result = entries.map((e, idx) => ({
    rank: idx + 1,
    userId: e.userId,
    firstName: e.firstName,
    lastName: e.lastName,
    avatarUrl: e.avatarUrl,
    departmentName: e.departmentId ? (deptMap.get(e.departmentId) ?? null) : null,
    xp: e.xp,
    level: e.level,
    streakDays: e.streakDays,
    cciScore: cciMap.get(e.userId) ?? 50,
    badges: badgeMap.get(e.userId) ?? [],
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
