import { Router, type IRouter } from "express";
import { db, courseModulesTable, coursesTable, lessonsTable, userCourseProgressTable, psychometricProfilesTable, gamificationProfilesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();
const MAX_VIDEO_SIZE_BYTES = 2_147_483_648;

async function getUserProgress(userId: number) {
  return db.select().from(userCourseProgressTable).where(eq(userCourseProgressTable.userId, userId));
}

function normalizeOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeOptionalNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildCourseWritePayload(
  body: Record<string, unknown>,
  existing?: typeof coursesTable.$inferSelect,
): Partial<typeof coursesTable.$inferInsert> {
  const videoFileName = normalizeOptionalString(body.videoFileName);
  const videoMimeType = normalizeOptionalString(body.videoMimeType);
  const videoSizeBytes = normalizeOptionalNumber(body.videoSizeBytes);
  const markdownFileName = normalizeOptionalString(body.markdownFileName);
  const markdownContent = normalizeOptionalString(body.markdownContent);
  const markdownUrl = normalizeOptionalString(body.markdownUrl);
  const markdownSizeBytes = normalizeOptionalNumber(body.markdownSizeBytes);
  const videoTouched =
    videoFileName !== (existing?.videoFileName ?? null) ||
    videoMimeType !== (existing?.videoMimeType ?? null) ||
    videoSizeBytes !== (existing?.videoSizeBytes ?? null) ||
    normalizeOptionalString(body.videoUrl) !== (existing?.videoUrl ?? null);
  const markdownTouched =
    markdownFileName !== (existing?.markdownFileName ?? null) ||
    markdownContent !== (existing?.markdownContent ?? null) ||
    markdownUrl !== (existing?.markdownUrl ?? null) ||
    markdownSizeBytes !== (existing?.markdownSizeBytes ?? null);

  return {
    moduleId: normalizeOptionalNumber(body.moduleId),
    title: String(body.title ?? existing?.title ?? ""),
    category: String(body.category ?? existing?.category ?? ""),
    description: String(body.description ?? existing?.description ?? ""),
    videoUrl: normalizeOptionalString(body.videoUrl),
    videoFileName,
    videoMimeType,
    videoSizeBytes,
    videoUploadedAt: videoTouched && (videoFileName || videoMimeType || videoSizeBytes || normalizeOptionalString(body.videoUrl)) ? new Date() : (existing?.videoUploadedAt ?? null),
    markdownUrl,
    markdownFileName,
    markdownContent,
    markdownSizeBytes,
    markdownUploadedAt: markdownTouched && (markdownFileName || markdownContent || markdownUrl || markdownSizeBytes) ? new Date() : (existing?.markdownUploadedAt ?? null),
    minScore: normalizeOptionalNumber(body.minScore),
    maxScore: normalizeOptionalNumber(body.maxScore),
    thumbnailColor: String(body.thumbnailColor ?? existing?.thumbnailColor ?? "#dc143c"),
    durationMinutes: Number(body.durationMinutes ?? existing?.durationMinutes ?? 30),
    xpReward: Number(body.xpReward ?? existing?.xpReward ?? 100),
    difficulty: String(body.difficulty ?? existing?.difficulty ?? "intermediate"),
    lessonCount: Number(body.lessonCount ?? existing?.lessonCount ?? 0),
  };
}

function isSupportedMarkdownFile(fileName: string) {
  return /\.(md|mdx)$/i.test(fileName);
}

function validateCoursePayload(payload: Partial<typeof coursesTable.$inferInsert>) {
  if (payload.videoSizeBytes !== null && payload.videoSizeBytes !== undefined && payload.videoSizeBytes > MAX_VIDEO_SIZE_BYTES) {
    return "Uploaded videos must be 2GB or smaller.";
  }
  if (payload.markdownFileName && !isSupportedMarkdownFile(payload.markdownFileName)) {
    return "Only Markdown or MDX files ending in .md or .mdx are supported.";
  }
  return null;
}

function buildCourseWithProgress(
  course: typeof coursesTable.$inferSelect,
  progress?: typeof userCourseProgressTable.$inferSelect | null,
  options: { includeVideoUrl?: boolean } = {},
) {
  const { includeVideoUrl = true } = options;
  return {
    id: course.id,
    moduleId: course.moduleId,
    title: course.title,
    category: course.category,
    description: course.description,
    videoUrl: includeVideoUrl ? course.videoUrl : null,
    videoFileName: course.videoFileName,
    videoMimeType: course.videoMimeType,
    videoSizeBytes: course.videoSizeBytes,
    videoUploadedAt: course.videoUploadedAt?.toISOString() ?? null,
    markdownUrl: course.markdownUrl,
    markdownFileName: course.markdownFileName,
    markdownContent: course.markdownContent,
    markdownSizeBytes: course.markdownSizeBytes,
    markdownUploadedAt: course.markdownUploadedAt?.toISOString() ?? null,
    minScore: course.minScore,
    maxScore: course.maxScore,
    thumbnailColor: course.thumbnailColor,
    durationMinutes: course.durationMinutes,
    xpReward: course.xpReward,
    difficulty: course.difficulty,
    lessonCount: course.lessonCount,
    status: progress?.status ?? "not_started",
    progressPct: progress?.progressPct ?? 0,
    xpEarned: progress?.xpEarned ?? 0,
    completedAt: progress?.completedAt?.toISOString() ?? null,
  };
}

function buildModule(module: typeof courseModulesTable.$inferSelect) {
  return {
    id: module.id,
    title: module.title,
    description: module.description,
    difficulty: module.difficulty,
    displayOrder: module.displayOrder,
    isActive: module.isActive,
    createdAt: module.createdAt.toISOString(),
  };
}

function readinessLevelFromPoints(points: number | null | undefined) {
  const value = Number(points ?? 0);
  if (value <= 16) return "beginner";
  if (value <= 24) return "intermediate";
  return "advanced";
}

// GET /courses/modules — list course modules
router.get("/courses/modules", requireAuth, async (_req, res): Promise<void> => {
  const modules = await db
    .select()
    .from(courseModulesTable)
    .where(eq(courseModulesTable.isActive, true))
    .orderBy(courseModulesTable.displayOrder, courseModulesTable.id);

  res.json(modules.map(buildModule));
});

// POST /courses/modules — create module (superadmin only)
router.post("/courses/modules", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  if (user.role?.toLowerCase() !== "superadmin") {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const title = normalizeOptionalString(req.body?.title);
  if (!title) {
    res.status(400).json({ error: "Module title is required" }); return;
  }

  const [module] = await db.insert(courseModulesTable).values({
    title,
    description: normalizeOptionalString(req.body?.description),
    difficulty: normalizeOptionalString(req.body?.difficulty) ?? "beginner",
    displayOrder: normalizeOptionalNumber(req.body?.displayOrder) ?? 0,
  }).returning();

  res.status(201).json(buildModule(module));
});

// PATCH /courses/modules/:id — update module (superadmin only)
router.patch("/courses/modules/:id", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  if (user.role?.toLowerCase() !== "superadmin") {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const id = Number(req.params.id);
  const [module] = await db.update(courseModulesTable).set({
    title: normalizeOptionalString(req.body?.title) ?? undefined,
    description: normalizeOptionalString(req.body?.description),
    difficulty: normalizeOptionalString(req.body?.difficulty) ?? undefined,
    displayOrder: normalizeOptionalNumber(req.body?.displayOrder) ?? undefined,
    isActive: typeof req.body?.isActive === "boolean" ? req.body.isActive : undefined,
  }).where(eq(courseModulesTable.id, id)).returning();

  if (!module) { res.status(404).json({ error: "Module not found" }); return; }
  res.json(buildModule(module));
});

// DELETE /courses/modules/:id — delete module and its courses (superadmin only)
router.delete("/courses/modules/:id", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  if (user.role?.toLowerCase() !== "superadmin") {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const id = Number(req.params.id);
  const [module] = await db.delete(courseModulesTable)
    .where(eq(courseModulesTable.id, id))
    .returning();

  if (!module) { res.status(404).json({ error: "Module not found" }); return; }
  res.json({ success: true });
});

// GET /courses/learning-path — MUST be before /:id
router.get("/courses/learning-path", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;

  const [profile] = await db.select().from(psychometricProfilesTable).where(eq(psychometricProfilesTable.userId, userId));
  const allCourses = await db.select().from(coursesTable).where(eq(coursesTable.isActive, true)).orderBy(coursesTable.displayOrder);
  const progressRecords = await getUserProgress(userId);
  const progressMap = new Map(progressRecords.map(p => [p.courseId, p]));

  const completed = allCourses.filter(c => progressMap.get(c.id)?.status === "completed").map(c => buildCourseWithProgress(c, progressMap.get(c.id)));
  const inProgress = allCourses.filter(c => progressMap.get(c.id)?.status === "in_progress").map(c => buildCourseWithProgress(c, progressMap.get(c.id)));
  const notStarted = allCourses.filter(c => !progressMap.has(c.id) || progressMap.get(c.id)?.status === "not_started");

  // Recommend videos based on the user's readiness assessment points.
  let recommended = notStarted.slice(0, 5);
  if (profile) {
    const points = profile.securityReadinessScore;
    const readinessLevel = readinessLevelFromPoints(points);
    const matchingRange = notStarted.filter(c =>
      (c.minScore !== null || c.maxScore !== null) &&
      (c.minScore === null || points >= c.minScore) &&
      (c.maxScore === null || points <= c.maxScore)
    );
    const matchingDifficulty = notStarted.filter(c => c.difficulty === readinessLevel);
    const unranged = notStarted.filter(c => c.minScore === null && c.maxScore === null);
    recommended = (matchingRange.length > 0 ? matchingRange : matchingDifficulty.length > 0 ? matchingDifficulty : unranged).slice(0, 5);
  }

  const totalXpEarned = progressRecords.reduce((sum, p) => sum + p.xpEarned, 0);
  const completionRate = allCourses.length > 0 ? Math.round((completed.length / allCourses.length) * 100) : 0;

  res.json({
    recommended: recommended.map(c => buildCourseWithProgress(c, progressMap.get(c.id))),
    inProgress,
    completed,
    totalXpEarned,
    completionRate,
  });
});

// GET /courses — list all with user progress
router.get("/courses", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const { category, difficulty, moduleId } = req.query as { category?: string; difficulty?: string; moduleId?: string };

  const allCourses = await db.select().from(coursesTable).where(eq(coursesTable.isActive, true)).orderBy(coursesTable.displayOrder);
  const progressRecords = await getUserProgress(userId);
  const progressMap = new Map(progressRecords.map(p => [p.courseId, p]));

  let filtered = allCourses;
  if (category) filtered = filtered.filter(c => c.category === category);
  if (difficulty) filtered = filtered.filter(c => c.difficulty === difficulty);
  if (moduleId) filtered = filtered.filter(c => c.moduleId === Number(moduleId));

  res.json(filtered.map(c => buildCourseWithProgress(c, progressMap.get(c.id))));
});

// GET /courses/:id — course detail with lessons
router.get("/courses/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const courseId = Number(req.params.id);

  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId));
  if (!course) { res.status(404).json({ message: "Not found" }); return; }

  const lessons = await db.select().from(lessonsTable).where(eq(lessonsTable.courseId, courseId)).orderBy(lessonsTable.displayOrder);
  const [progress] = await db.select().from(userCourseProgressTable).where(and(eq(userCourseProgressTable.userId, userId), eq(userCourseProgressTable.courseId, courseId)));

  res.json({
    ...buildCourseWithProgress(course, progress, { includeVideoUrl: false }),
    lessons: lessons.map(l => ({
      id: l.id,
      title: l.title,
      type: l.type,
      content: l.content,
      xpReward: l.xpReward,
      displayOrder: l.displayOrder,
    })),
  });
});

// GET /courses/:id/video — deferred video URL for faster course page rendering
router.get("/courses/:id/video", requireAuth, async (req, res): Promise<void> => {
  const courseId = Number(req.params.id);

  const [course] = await db
    .select({ videoUrl: coursesTable.videoUrl })
    .from(coursesTable)
    .where(eq(coursesTable.id, courseId));

  if (!course) { res.status(404).json({ message: "Not found" }); return; }
  res.json({ videoUrl: course.videoUrl });
});

// PATCH /courses/:id/progress
router.patch("/courses/:id/progress", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const courseId = Number(req.params.id);
  const { progressPct, lastLessonId } = req.body as { progressPct: number; lastLessonId?: number };

  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId));
  if (!course) { res.status(404).json({ message: "Not found" }); return; }

  const clampedPct = Math.min(100, Math.max(0, progressPct));
  const isCompleted = clampedPct >= 100;
  const xpEarned = isCompleted ? course.xpReward : Math.round(course.xpReward * clampedPct / 100);

  const [existing] = await db.select().from(userCourseProgressTable).where(and(eq(userCourseProgressTable.userId, userId), eq(userCourseProgressTable.courseId, courseId)));

  let record;
  if (existing) {
    [record] = await db.update(userCourseProgressTable).set({
      progressPct: clampedPct,
      status: isCompleted ? "completed" : "in_progress",
      xpEarned,
      lastLessonId: lastLessonId ?? existing.lastLessonId,
      completedAt: isCompleted ? (existing.completedAt ?? new Date()) : null,
    }).where(and(eq(userCourseProgressTable.userId, userId), eq(userCourseProgressTable.courseId, courseId))).returning();
  } else {
    [record] = await db.insert(userCourseProgressTable).values({
      userId,
      courseId,
      progressPct: clampedPct,
      status: isCompleted ? "completed" : (clampedPct > 0 ? "in_progress" : "not_started"),
      xpEarned,
      lastLessonId: lastLessonId ?? null,
      startedAt: new Date(),
      completedAt: isCompleted ? new Date() : null,
    }).returning();
  }

  // Update gamification XP if completed
  if (isCompleted && !existing?.completedAt) {
    const [gp] = await db.select().from(gamificationProfilesTable).where(eq(gamificationProfilesTable.userId, userId));
    if (gp) {
      const newXp = gp.xp + course.xpReward;
      await db.update(gamificationProfilesTable).set({ xp: newXp, level: Math.floor(newXp / 200) + 1, lastActivityAt: new Date() }).where(eq(gamificationProfilesTable.userId, userId));
    }
  }

  res.json({
    courseId: record.courseId,
    status: record.status,
    progressPct: record.progressPct,
    xpEarned: record.xpEarned,
    completedAt: record.completedAt?.toISOString() ?? null,
  });
});

// POST /courses — create a new course (superadmin only)
router.post("/courses", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  if (user.role?.toLowerCase() !== "superadmin") {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const { title, category, difficulty, moduleId } = req.body;
  if (!title || !category || !difficulty || !moduleId) {
    res.status(400).json({ error: "title, category, difficulty, and moduleId are required" }); return;
  }
  const payload = buildCourseWritePayload(req.body);
  const validationError = validateCoursePayload(payload);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }
  const [course] = await db.insert(coursesTable).values(payload as typeof coursesTable.$inferInsert).returning();
  res.status(201).json(course);
});

// PATCH /courses/:id — update a course (superadmin only)
router.patch("/courses/:id", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  if (user.role?.toLowerCase() !== "superadmin") {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const id = parseInt(req.params.id as string);
  const [existing] = await db.select().from(coursesTable).where(eq(coursesTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Course not found" }); return;
  }
  const payload = buildCourseWritePayload(req.body, existing);
  const validationError = validateCoursePayload(payload);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }
  const [updated] = await db.update(coursesTable)
    .set(payload)
    .where(eq(coursesTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Course not found" }); return; }
  res.json(updated);
});

// DELETE /courses/:id — delete a course (superadmin only)
router.delete("/courses/:id", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  if (user.role?.toLowerCase() !== "superadmin") {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const id = parseInt(req.params.id as string);
  const [deleted] = await db.delete(coursesTable).where(eq(coursesTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Course not found" }); return; }
  res.json({ success: true });
});

export default router;
