import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useGetCourse, useGetMe, useUpdateCourseProgress } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { CourseMarkdown } from "@/components/course-markdown";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { API_BASE } from "@/lib/runtime";

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: "#22c55e",
  intermediate: "#f97316",
  advanced: "#ef4444",
};

type CourseProfileMode = "learner" | "preview";
type MarkdownSection = {
  id: string;
  title: string;
  fileName?: string | null;
  content?: string | null;
  url?: string | null;
  sizeBytes?: number | null;
};

function profileCopy(lang: "en" | "ar") {
  return lang === "ar"
    ? {
        back: "العودة إلى الدورات",
        courseDetail: "صفحة الدورة",
        courseNotes: "محتوى الدورة",
        completionReward: "نقطة عند الإكمال",
        category: "التصنيف",
        level: "المستوى",
        beginner: "مبتدئ",
        intermediate: "متوسط",
        advanced: "متقدم",
        progress: "التقدم",
        lessonPlan: "خطة الدروس",
        videoProgress: "تقدم الفيديو",
        videoCompleted: "اكتمل الفيديو",
        markComplete: "تحديد الفيديو كمكتمل",
        progressHelp: "يتم تحديث تقدم الدورة ونقاط الخبرة",
        courseCompleted: "اكتملت الدورة",
        finishChapter: "إنهاء الفصل",
        chapterCompleted: "اكتمل الفصل",
        chapter: "الفصل",
        earned: "تم كسب",
        continueLearning: "متابعة التعلم",
        startCourse: "ابدأ الدورة",
        finishCourse: "أنهيت المحتوى - تسجيل الدورة كمكتملة",
        openMarkdown: "فتح ملف Markdown",
        loadingVideo: "يتم تحميل الفيديو...",
        previewMode: "معاينة المشرف",
      }
    : {
        back: "Back to courses",
        courseDetail: "Course Page",
        courseNotes: "Course Content",
        completionReward: "XP on completion",
        category: "Category",
        level: "Level",
        beginner: "Beginner",
        intermediate: "Intermediate",
        advanced: "Advanced",
        progress: "Progress",
        lessonPlan: "Lesson Plan",
        videoProgress: "Video Progress",
        videoCompleted: "Video completed",
        markComplete: "Mark video as complete",
        progressHelp: "Updates your course progress and XP",
        courseCompleted: "Course completed",
        finishChapter: "Finish chapter",
        chapterCompleted: "Chapter completed",
        chapter: "Chapter",
        earned: "earned",
        continueLearning: "Continue learning",
        startCourse: "Start course",
        finishCourse: "I finished the content - mark course complete",
        openMarkdown: "Open Markdown file",
        loadingVideo: "Loading video...",
        previewMode: "Admin preview",
      };
}

function isDirectVideo(url: string) {
  return /^(data:video|blob:|https?:.*\.(mp4|webm|ogg)(\?.*)?$|\/)/i.test(url);
}

export function CourseProfilePage({
  courseId,
  mode = "learner",
  onBack,
}: {
  courseId: number;
  mode?: CourseProfileMode;
  onBack: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: course, isLoading } = useGetCourse(courseId);
  const { data: user } = useGetMe();
  const progressMutation = useUpdateCourseProgress();
  const [localProgress, setLocalProgress] = useState<number | null>(null);
  const [deferredVideoUrl, setDeferredVideoUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState<any[]>([]);
  const { lang, isRTL } = useI18n();
  const copy = profileCopy(lang);

  const courseRecord = course as any;
  const lessons = courseRecord?.lessons ?? [];
  const videoUrl = deferredVideoUrl ?? courseRecord?.videoUrl;
  const markdownContent = courseRecord?.markdownContent;
  const markdownUrl = courseRecord?.markdownUrl;
  const [localCompletedSections, setLocalCompletedSections] = useState<string[] | null>(null);
  const markdownSections: MarkdownSection[] = courseRecord?.markdownSections?.length
    ? courseRecord.markdownSections
    : markdownContent || markdownUrl
      ? [{
        id: "section-1",
        title: courseRecord?.markdownFileName || copy.courseNotes,
        fileName: courseRecord?.markdownFileName,
        content: markdownContent,
        url: markdownUrl,
        sizeBytes: courseRecord?.markdownSizeBytes,
      }]
      : [];
  const completedMarkdownSections: string[] = localCompletedSections ?? (courseRecord?.completedMarkdownSections ?? []);
  const sectionProgressPct = markdownSections.length > 0 ? Math.round((completedMarkdownSections.length / markdownSections.length) * 100) : null;
  const currentPct = localProgress ?? sectionProgressPct ?? (courseRecord?.progressPct ?? 0);
  const defaultOpenMarkdownSections = markdownSections.length > 0
    ? [markdownSections.find((section) => !completedMarkdownSections.includes(section.id))?.id ?? markdownSections[0].id]
    : [];
  const canTrackProgress = mode === "learner";
  const canUseLessonProgress = canTrackProgress && markdownSections.length === 0;

  useEffect(() => {
    if (!courseRecord?.id) return;

    let cancelled = false;
    const controller = new AbortController();
    setDeferredVideoUrl(null);
    setVideoLoading(Boolean(courseRecord.videoFileName || courseRecord.videoSizeBytes || courseRecord.videoUrl));

    const loadVideo = () => {
      fetch(`${API_BASE}/api/courses/${courseRecord.id}/video`, {
        credentials: "include",
        signal: controller.signal,
      })
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          if (!cancelled) setDeferredVideoUrl(data?.videoUrl ?? courseRecord.videoUrl ?? null);
        })
        .catch(() => {
          if (!cancelled) setDeferredVideoUrl(courseRecord.videoUrl ?? null);
        })
        .finally(() => {
          if (!cancelled) setVideoLoading(false);
        });
    };

    const scheduleVideoLoad =
      "requestIdleCallback" in window
        ? window.requestIdleCallback(loadVideo, { timeout: 1200 })
        : globalThis.setTimeout(loadVideo, 250);

    return () => {
      cancelled = true;
      controller.abort();
      if ("cancelIdleCallback" in window && typeof scheduleVideoLoad === "number") {
        window.cancelIdleCallback(scheduleVideoLoad);
      } else {
        globalThis.clearTimeout(scheduleVideoLoad);
      }
    };
  }, [courseRecord?.id, courseRecord?.videoFileName, courseRecord?.videoSizeBytes, courseRecord?.videoUrl]);

  function startLesson(lessonIndex: number) {
    if (!canTrackProgress || markdownSections.length > 0) return;

    const lessonCount = Math.max(lessons.length, 1);
    const pct = Math.round(((lessonIndex + 1) / lessonCount) * 100);
    updateProgress(pct, lessons[lessonIndex]?.id);
  }

  function updateProgress(pct: number, lastLessonId?: number) {
    if (!canTrackProgress) return;

    const nextPct = Math.min(100, Math.max(0, Math.round(pct)));
    setLocalProgress(nextPct);
    progressMutation.mutate(
      { id: courseId, data: { progressPct: nextPct, lastLessonId } },
      {
        onSuccess: (data: any) => {
          const nextBadges = Array.isArray(data?.awardedBadges) ? data.awardedBadges : [];
          if (nextBadges.length > 0) setEarnedBadges((current) => [...current, ...nextBadges]);
          queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
          queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
          queryClient.invalidateQueries({ queryKey: ["/api/courses/learning-path"] });
          queryClient.invalidateQueries({ queryKey: ["/api/gamification/me"] });
          queryClient.invalidateQueries({ queryKey: ["/api/gamification/badges"] });
          queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
          queryClient.invalidateQueries({ queryKey: ["listCourses"] });
          queryClient.invalidateQueries({ queryKey: ["getLearningPath"] });
          queryClient.invalidateQueries({ queryKey: ["getMyGamification"] });
          queryClient.invalidateQueries({ queryKey: ["getMyBadges"] });
          queryClient.invalidateQueries({ queryKey: ["getLeaderboard"] });
        },
      },
    );
  }

  function completeMarkdownSection(sectionId: string) {
    if (!canTrackProgress) return;

    const nextCompleted = Array.from(new Set([...completedMarkdownSections, sectionId]));
    const nextPct = markdownSections.length > 0 ? Math.round((nextCompleted.length / markdownSections.length) * 100) : 100;
    setLocalCompletedSections(nextCompleted);
    setLocalProgress(nextPct);
    progressMutation.mutate(
      { id: courseId, data: { progressPct: nextPct, completedMarkdownSectionId: sectionId } as any },
      {
        onSuccess: (data: any) => {
          const nextBadges = Array.isArray(data?.awardedBadges) ? data.awardedBadges : [];
          if (nextBadges.length > 0) setEarnedBadges((current) => [...current, ...nextBadges]);
          queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
          queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
          queryClient.invalidateQueries({ queryKey: ["/api/courses/learning-path"] });
          queryClient.invalidateQueries({ queryKey: ["/api/gamification/me"] });
          queryClient.invalidateQueries({ queryKey: ["/api/gamification/badges"] });
          queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
          queryClient.invalidateQueries({ queryKey: ["listCourses"] });
          queryClient.invalidateQueries({ queryKey: ["getLearningPath"] });
          queryClient.invalidateQueries({ queryKey: ["getMyGamification"] });
          queryClient.invalidateQueries({ queryKey: ["getMyBadges"] });
          queryClient.invalidateQueries({ queryKey: ["getLeaderboard"] });
        },
      },
    );
  }

  if (isLoading) {
    return <div className="min-h-[520px] animate-pulse rounded-2xl border border-border bg-card/70" />;
  }

  if (!courseRecord) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {earnedBadges[0] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/75 px-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-sm rounded-2xl border border-primary/30 bg-card p-6 text-center shadow-2xl"
          >
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl border border-border bg-background p-2">
              {earnedBadges[0].imageUrl ? (
                <img src={earnedBadges[0].imageUrl} alt={earnedBadges[0].name} className="h-full w-full rounded-xl object-contain" />
              ) : (
                <span className="text-4xl font-bold text-primary">✓</span>
              )}
            </div>
            <div className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-primary">Congratulations</div>
            <h3 className="mt-2 text-2xl font-bold">
              {user?.firstName ?? "You"} earned {earnedBadges[0].name}
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{earnedBadges[0].description}</p>
            <Button className="mt-6 w-full bg-primary text-white hover:bg-primary/85" onClick={() => setEarnedBadges((current) => current.slice(1))}>
              Continue
            </Button>
          </motion.div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground hover:text-foreground">
          {isRTL ? `${copy.back} <-` : `<- ${copy.back}`}
        </Button>
        {mode === "preview" && (
          <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {copy.previewMode}
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card/85 shadow-2xl shadow-black/20 backdrop-blur-sm">
        <div className="h-1.5 w-full" style={{ backgroundColor: courseRecord.thumbnailColor ?? "#dc143c" }} />
        <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.7fr)] lg:p-7">
          <div className="space-y-4 lg:col-span-2">
            <div>
              <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">{copy.courseDetail}</div>
              <h2 className="text-2xl font-bold leading-tight md:text-3xl">{courseRecord.title}</h2>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>{copy.category}: <span className="text-foreground">{courseRecord.category}</span></span>
                <span>·</span>
                <span style={{ color: DIFFICULTY_COLOR[courseRecord.difficulty] ?? "#6b7280" }}>
                  {copy.level}: {copy[courseRecord.difficulty as "beginner" | "intermediate" | "advanced"] ?? courseRecord.difficulty}
                </span>
                <span>{courseRecord.durationMinutes}min</span>
                <span className="text-primary">+{courseRecord.xpReward} {copy.completionReward}</span>
              </div>
            </div>

            <p className="text-sm leading-7 text-muted-foreground">{courseRecord.description}</p>
          </div>

          <section className="space-y-5">
            {(videoUrl || videoLoading) && (
              <div className="overflow-hidden rounded-xl border border-border bg-background">
                <div className="aspect-video w-full bg-black">
                  {videoUrl ? isDirectVideo(videoUrl) ? (
                    <video
                      src={videoUrl}
                      controls
                      preload="metadata"
                      controlsList="nodownload noremoteplayback"
                      disablePictureInPicture
                      onContextMenu={(event) => event.preventDefault()}
                      className="h-full w-full bg-black"
                    />
                  ) : (
                    <iframe
                      src={videoUrl}
                      title={courseRecord.title}
                      className="h-full w-full"
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-white/70">
                      {copy.loadingVideo}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          <aside className="space-y-5">
            {canTrackProgress && (
              <div className="rounded-xl border border-border bg-background/60 p-4">
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-muted-foreground">{copy.progress}</span>
                  <span className={currentPct >= 100 ? "text-emerald-400" : "text-primary"}>{Math.round(currentPct)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    animate={{ width: `${currentPct}%` }}
                    transition={{ duration: 0.4 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: currentPct >= 100 ? "#22c55e" : "#dc143c" }}
                  />
                </div>
              </div>
            )}

            {canUseLessonProgress && (
              <div className="space-y-2 rounded-xl border border-border bg-background/60 p-4">
                <div className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
                  {lessons.length > 0 ? copy.lessonPlan : copy.videoProgress}
                </div>
                {lessons.length === 0 ? (
                  <button
                    onClick={() => startLesson(0)}
                    className={`w-full rounded-lg px-4 py-3 text-left text-sm transition-all ${
                      currentPct >= 100 ? "bg-emerald-500/10 text-emerald-400" : "bg-primary/10 text-primary hover:bg-primary/18"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-mono">
                        {currentPct >= 100 ? "100" : "1"}
                      </span>
                      <div className="flex-1">
                        <div>{currentPct >= 100 ? copy.videoCompleted : copy.markComplete}</div>
                        <div className="text-xs text-muted-foreground">{copy.progressHelp}</div>
                      </div>
                    </div>
                  </button>
                ) : lessons.map((lesson: any, index: number) => {
                  const lessonPct = ((index + 1) / lessons.length) * 100;
                  const isDone = currentPct >= lessonPct;
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => startLesson(index)}
                      className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-all ${
                        isDone
                          ? "border-emerald-500/30 bg-emerald-500/5 text-foreground"
                          : "border-border bg-white/3 text-foreground hover:border-primary/30 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-mono ${isDone ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-muted-foreground"}`}>
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <div>{lesson.title}</div>
                          <div className="text-xs capitalize text-muted-foreground">{lesson.type} · +{lesson.xpReward}xp</div>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {currentPct >= 100 ? (
                  <div className="pt-2 text-sm font-medium text-emerald-400">
                    {copy.courseCompleted}. +{courseRecord.xpReward}xp {copy.earned}
                  </div>
                ) : (
                  <Button
                    onClick={() => {
                      const nextIdx = Math.min(
                        Math.floor((currentPct / 100) * Math.max(lessons.length, 1)),
                        Math.max(lessons.length - 1, 0),
                      );
                      startLesson(nextIdx);
                    }}
                    disabled={progressMutation.isPending}
                    className="mt-2 w-full bg-primary text-white hover:bg-primary/80"
                  >
                    {currentPct > 0 ? copy.continueLearning : copy.startCourse}
                  </Button>
                )}
              </div>
            )}
          </aside>

          {markdownSections.length > 0 && (
            <div className="rounded-xl border border-border bg-background/70 p-4 shadow-sm shadow-black/10 lg:col-span-2 lg:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{copy.courseNotes}</div>
              </div>
              <Accordion type="multiple" defaultValue={defaultOpenMarkdownSections} className="space-y-3">
                {markdownSections.map((section, index) => {
                  const isSectionDone = completedMarkdownSections.includes(section.id) || currentPct >= 100;
                  return (
                    <AccordionItem
                      key={section.id}
                      value={section.id}
                      className={cn(
                        "overflow-hidden rounded-lg border bg-card/55 shadow-sm shadow-black/5",
                        isSectionDone ? "border-emerald-500/25" : "border-border",
                      )}
                    >
                      <AccordionTrigger className="min-h-16 px-4 py-3 text-start hover:no-underline data-[state=open]:border-b data-[state=open]:border-border">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <span
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                              isSectionDone ? "bg-emerald-500/15 text-emerald-400" : "bg-primary/12 text-primary",
                            )}
                          >
                            {isSectionDone ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{copy.chapter} {index + 1}</div>
                            <h3 className="mt-1 text-base font-semibold leading-snug">{section.title || section.fileName || `${copy.courseNotes} ${index + 1}`}</h3>
                          </div>
                        </div>
                        <span
                          className={cn(
                            "ms-3 hidden shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium sm:inline-flex",
                            isSectionDone
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                              : "border-primary/25 bg-primary/10 text-primary",
                          )}
                        >
                          {isSectionDone ? copy.chapterCompleted : copy.finishChapter}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 pt-0">
                        <div className="pt-4">
                          {section.content ? (
                            <CourseMarkdown content={section.content} />
                          ) : section.url ? (
                            <div>
                              <a href={section.url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
                                {copy.openMarkdown}
                              </a>
                            </div>
                          ) : null}
                          <div className="mt-5 flex justify-end border-t border-border pt-4">
                            <Button
                              size="sm"
                              variant={isSectionDone ? "outline" : "default"}
                              onClick={() => completeMarkdownSection(section.id)}
                              disabled={!canTrackProgress || progressMutation.isPending || isSectionDone}
                              className={cn(
                                "active:scale-[0.96] transition-transform",
                                isSectionDone ? "border-emerald-500/30 text-emerald-400" : "bg-primary text-white hover:bg-primary/85",
                              )}
                            >
                              {isSectionDone ? copy.chapterCompleted : copy.finishChapter}
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
