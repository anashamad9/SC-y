import { Router, type IRouter } from "express";
import { db, courseModulesTable, coursesTable, lessonsTable, userCourseProgressTable, psychometricProfilesTable, gamificationProfilesTable, userBadgesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();
const MAX_VIDEO_SIZE_BYTES = 500 * 1024 * 1024;
const RECOMMENDED_COURSE_COUNT = 3;
const COURSE_VIDEO_BUCKET = process.env.SUPABASE_COURSE_VIDEO_BUCKET || "course-videos";
const SUPABASE_STORAGE_URL = getSupabaseUrl();
const SUPABASE_STORAGE_API_URL = SUPABASE_STORAGE_URL ? `${SUPABASE_STORAGE_URL}/storage/v1` : "";
const SUPABASE_STORAGE_API_BASE = SUPABASE_STORAGE_API_URL ? `${SUPABASE_STORAGE_API_URL}/` : "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "";

type MarkdownSection = {
  id: string;
  title: string;
  fileName?: string | null;
  content?: string | null;
  url?: string | null;
  sizeBytes?: number | null;
  uploadedAt?: string | null;
};

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

function getSupabaseUrl() {
  if (process.env.SUPABASE_URL) return process.env.SUPABASE_URL.replace(/\/$/, "");
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) return process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
  if (!process.env.DATABASE_URL) return "";

  try {
    const hostname = new URL(process.env.DATABASE_URL).hostname;
    const match = hostname.match(/^db\.([^.]+)\.supabase\.co$/);
    return match ? `https://${match[1]}.supabase.co` : "";
  } catch {
    return "";
  }
}

function encodeStoragePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function cleanFileName(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 72) || "course-video";
}

function videoExtension(fileName: string, mimeType: string) {
  const fromName = fileName.match(/\.(mp4|webm|ogg)$/i)?.[1]?.toLowerCase();
  if (fromName) return fromName;
  if (mimeType === "video/webm") return "webm";
  if (mimeType === "video/ogg") return "ogg";
  return "mp4";
}

function publicStorageUrl(path: string) {
  return `${SUPABASE_STORAGE_API_URL}/object/public/${COURSE_VIDEO_BUCKET}/${encodeStoragePath(path)}`;
}

function isSupportedVideoMime(mimeType: string) {
  return ["video/mp4", "video/webm", "video/ogg", "video/quicktime"].includes(mimeType);
}

function normalizeMarkdownSections(value: unknown, existing?: MarkdownSection[] | null): MarkdownSection[] {
  const source = Array.isArray(value) ? value : existing ?? [];
  return source
    .map((section, index): MarkdownSection | null => {
      if (!section || typeof section !== "object") return null;
      const item = section as Record<string, unknown>;
      const fileName = normalizeOptionalString(item.fileName);
      const content = normalizeOptionalString(item.content);
      const url = normalizeOptionalString(item.url);
      const title = normalizeOptionalString(item.title) ?? fileName ?? `Section ${index + 1}`;
      if (!fileName && !content && !url) return null;
      return {
        id: normalizeOptionalString(item.id) ?? `section-${index + 1}`,
        title,
        fileName,
        content,
        url,
        sizeBytes: normalizeOptionalNumber(item.sizeBytes),
        uploadedAt: normalizeOptionalString(item.uploadedAt),
      };
    })
    .filter((section): section is MarkdownSection => Boolean(section));
}

function getCourseMarkdownSections(course: typeof coursesTable.$inferSelect): MarkdownSection[] {
  const stored = normalizeMarkdownSections(course.markdownSections);
  if (stored.length > 0) return stored;
  if (!course.markdownFileName && !course.markdownContent && !course.markdownUrl) return [];
  return [{
    id: "section-1",
    title: course.markdownFileName ?? "Course notes",
    fileName: course.markdownFileName,
    content: course.markdownContent,
    url: course.markdownUrl,
    sizeBytes: course.markdownSizeBytes,
    uploadedAt: course.markdownUploadedAt?.toISOString() ?? null,
  }];
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
  const markdownSections = normalizeMarkdownSections(body.markdownSections, existing?.markdownSections as MarkdownSection[] | undefined);
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
    badgeId: normalizeOptionalNumber(body.badgeId),
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
    markdownSections,
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
    return "Uploaded videos must be 500MB or smaller. For larger videos, use a hosted video URL.";
  }
  if (payload.markdownFileName && !isSupportedMarkdownFile(payload.markdownFileName)) {
    return "Only Markdown or MDX files ending in .md or .mdx are supported.";
  }
  for (const section of normalizeMarkdownSections(payload.markdownSections)) {
    if (section.fileName && !isSupportedMarkdownFile(section.fileName)) {
      return "Only Markdown or MDX files ending in .md or .mdx are supported.";
    }
  }
  return null;
}

function buildCourseWithProgress(
  course: typeof coursesTable.$inferSelect,
  progress?: typeof userCourseProgressTable.$inferSelect | null,
  options: { includeVideoUrl?: boolean } = {},
) {
  const { includeVideoUrl = true } = options;
  const markdownSections = getCourseMarkdownSections(course);
  const completedMarkdownSections = Array.isArray(progress?.completedMarkdownSections) ? progress.completedMarkdownSections : [];
  return {
    id: course.id,
    moduleId: course.moduleId,
    badgeId: course.badgeId,
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
    markdownSections,
    completedMarkdownSections,
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
  const lightweightCourse = { includeVideoUrl: false };

  const completed = allCourses.filter(c => progressMap.get(c.id)?.status === "completed").map(c => buildCourseWithProgress(c, progressMap.get(c.id), lightweightCourse));
  const inProgress = allCourses.filter(c => progressMap.get(c.id)?.status === "in_progress").map(c => buildCourseWithProgress(c, progressMap.get(c.id), lightweightCourse));
  const notStarted = allCourses.filter(c => !progressMap.has(c.id) || progressMap.get(c.id)?.status === "not_started");

  // Recommend exactly three courses, prioritizing the user's readiness level.
  let recommended = notStarted.slice(0, RECOMMENDED_COURSE_COUNT);
  if (profile) {
    const points = profile.securityReadinessScore;
    const readinessLevel = readinessLevelFromPoints(points);
    const matchingDifficulty = notStarted.filter(c => c.difficulty === readinessLevel);
    const matchingRange = matchingDifficulty.filter(c =>
      (c.minScore !== null || c.maxScore !== null) &&
      (c.minScore === null || points >= c.minScore) &&
      (c.maxScore === null || points <= c.maxScore)
    );
    const primary = matchingRange.length > 0 ? matchingRange : matchingDifficulty;
    const fallback = notStarted.filter(course => !primary.some(match => match.id === course.id));
    recommended = [...primary, ...fallback].slice(0, RECOMMENDED_COURSE_COUNT);
  }

  const totalXpEarned = progressRecords.reduce((sum, p) => sum + p.xpEarned, 0);
  const completionRate = allCourses.length > 0 ? Math.round((completed.length / allCourses.length) * 100) : 0;

  res.json({
    recommended: recommended.map(c => buildCourseWithProgress(c, progressMap.get(c.id), lightweightCourse)),
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
  const role = req.user!.role?.toLowerCase();
  const includeVideoUrl = role === "admin" || role === "superadmin";

  const allCourses = await db.select().from(coursesTable).where(eq(coursesTable.isActive, true)).orderBy(coursesTable.displayOrder);
  const progressRecords = await getUserProgress(userId);
  const progressMap = new Map(progressRecords.map(p => [p.courseId, p]));

  let filtered = allCourses;
  if (category) filtered = filtered.filter(c => c.category === category);
  if (difficulty) filtered = filtered.filter(c => c.difficulty === difficulty);
  if (moduleId) filtered = filtered.filter(c => c.moduleId === Number(moduleId));

  res.json(filtered.map(c => buildCourseWithProgress(c, progressMap.get(c.id), { includeVideoUrl })));
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

// POST /courses/video-upload-url — create a direct Supabase Storage upload URL
router.post("/courses/video-upload-url", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  if (user.role?.toLowerCase() !== "superadmin") {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  if (!SUPABASE_STORAGE_URL || !SUPABASE_SERVICE_KEY) {
    res.status(501).json({
      error: "Video storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then create the course-videos storage bucket.",
    });
    return;
  }

  const fileName = normalizeOptionalString(req.body?.fileName) ?? "course-video.mp4";
  const mimeType = normalizeOptionalString(req.body?.mimeType) ?? "video/mp4";
  const sizeBytes = normalizeOptionalNumber(req.body?.sizeBytes) ?? 0;

  if (!isSupportedVideoMime(mimeType)) {
    res.status(400).json({ error: "Only MP4, WebM, MOV, or OGG video files are supported." }); return;
  }
  if (sizeBytes <= 0 || sizeBytes > MAX_VIDEO_SIZE_BYTES) {
    res.status(400).json({ error: "Uploaded videos must be 500MB or smaller. For larger videos, use a hosted video URL." }); return;
  }

  const extension = videoExtension(fileName, mimeType);
  const objectPath = `courses/${new Date().toISOString().slice(0, 10)}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${cleanFileName(fileName)}.${extension}`;
  const encodedPath = encodeStoragePath(objectPath);
  const signUrl = `${SUPABASE_STORAGE_API_URL}/object/upload/sign/${COURSE_VIDEO_BUCKET}/${encodedPath}`;

  const signResponse = await fetch(signUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      apikey: SUPABASE_SERVICE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ upsert: false }),
  });
  const signText = await signResponse.text();
  let signData: any = {};
  try {
    signData = signText ? JSON.parse(signText) : {};
  } catch {
    signData = {};
  }

  if (!signResponse.ok) {
    res.status(502).json({ error: signData?.error || signData?.message || "Could not create a video upload URL. Check the Supabase Storage bucket." });
    return;
  }

  const rawSignedUrl = signData.signedUrl ?? signData.signedURL ?? signData.url ?? "";
  const token = signData.token || (rawSignedUrl ? new URL(rawSignedUrl, SUPABASE_STORAGE_API_BASE).searchParams.get("token") : "");
  const uploadUrl = rawSignedUrl
    ? new URL(rawSignedUrl, SUPABASE_STORAGE_API_BASE).toString()
    : `${SUPABASE_STORAGE_API_URL}/object/upload/sign/${COURSE_VIDEO_BUCKET}/${encodedPath}?token=${encodeURIComponent(token)}`;

  if (!token && !rawSignedUrl) {
    res.status(502).json({ error: "Supabase did not return a signed upload token." });
    return;
  }

  res.json({
    uploadUrl,
    publicUrl: publicStorageUrl(objectPath),
    path: objectPath,
    bucket: COURSE_VIDEO_BUCKET,
  });
});

// PATCH /courses/:id/progress
router.patch("/courses/:id/progress", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const courseId = Number(req.params.id);
  const { progressPct, lastLessonId, completedMarkdownSectionId } = req.body as { progressPct?: number; lastLessonId?: number; completedMarkdownSectionId?: string };

  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId));
  if (!course) { res.status(404).json({ message: "Not found" }); return; }

  const markdownSections = getCourseMarkdownSections(course);
  const [existing] = await db.select().from(userCourseProgressTable).where(and(eq(userCourseProgressTable.userId, userId), eq(userCourseProgressTable.courseId, courseId)));
  const completedSections = new Set(Array.isArray(existing?.completedMarkdownSections) ? existing.completedMarkdownSections : []);
  if (completedMarkdownSectionId && markdownSections.some((section) => section.id === completedMarkdownSectionId)) {
    completedSections.add(completedMarkdownSectionId);
  }
  const sectionProgressPct = markdownSections.length > 0
    ? Math.round((completedSections.size / markdownSections.length) * 100)
    : null;
  const requestedPct = typeof progressPct === "number" ? progressPct : (existing?.progressPct ?? 0);
  const clampedPct = Math.min(100, Math.max(0, sectionProgressPct ?? requestedPct));
  const isCompleted = clampedPct >= 100;
  const xpEarned = isCompleted ? course.xpReward : Math.round(course.xpReward * clampedPct / 100);

  let record;
  if (existing) {
    [record] = await db.update(userCourseProgressTable).set({
      progressPct: clampedPct,
      status: isCompleted ? "completed" : "in_progress",
      xpEarned,
      lastLessonId: lastLessonId ?? existing.lastLessonId,
      completedMarkdownSections: Array.from(completedSections),
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
      completedMarkdownSections: Array.from(completedSections),
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
    if (course.badgeId) {
      await db.insert(userBadgesTable).values({ userId, badgeId: course.badgeId }).onConflictDoNothing();
    }
  }

  res.json({
    courseId: record.courseId,
    status: record.status,
    progressPct: record.progressPct,
    xpEarned: record.xpEarned,
    completedMarkdownSections: record.completedMarkdownSections,
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
