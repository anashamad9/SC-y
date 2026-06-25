import { useState } from "react";
import { motion } from "framer-motion";
import { useGetCourse, useUpdateCourseProgress } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: "#22c55e",
  intermediate: "#f97316",
  advanced: "#ef4444",
};

type CourseProfileMode = "learner" | "preview";

function profileCopy(lang: "en" | "ar") {
  return lang === "ar"
    ? {
        back: "العودة إلى الدورات",
        courseDetail: "صفحة الدورة",
        courseNotes: "محتوى الدورة",
        completionReward: "نقطة عند الإكمال",
        progress: "التقدم",
        lessonPlan: "خطة الدروس",
        videoProgress: "تقدم الفيديو",
        videoCompleted: "اكتمل الفيديو",
        markComplete: "تحديد الفيديو كمكتمل",
        progressHelp: "يتم تحديث تقدم الدورة ونقاط الخبرة",
        courseCompleted: "اكتملت الدورة",
        earned: "تم كسب",
        continueLearning: "متابعة التعلم",
        startCourse: "ابدأ الدورة",
        openMarkdown: "فتح ملف Markdown",
        previewMode: "معاينة المشرف",
      }
    : {
        back: "Back to courses",
        courseDetail: "Course Page",
        courseNotes: "Course Content",
        completionReward: "XP on completion",
        progress: "Progress",
        lessonPlan: "Lesson Plan",
        videoProgress: "Video Progress",
        videoCompleted: "Video completed",
        markComplete: "Mark video as complete",
        progressHelp: "Updates your course progress and XP",
        courseCompleted: "Course completed",
        earned: "earned",
        continueLearning: "Continue learning",
        startCourse: "Start course",
        openMarkdown: "Open Markdown file",
        previewMode: "Admin preview",
      };
}

function isDirectVideo(url: string) {
  return /^(data:video|blob:|https?:.*\.(mp4|webm|ogg)(\?.*)?$|\/)/i.test(url);
}

function isLikelyRtlMarkdown(content?: string | null) {
  if (!content) return false;
  const arabicCount = content.match(/[\u0600-\u06FF]/g)?.length ?? 0;
  const latinCount = content.match(/[A-Za-z]/g)?.length ?? 0;
  return arabicCount > 0 && arabicCount >= latinCount;
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
  const progressMutation = useUpdateCourseProgress();
  const [localProgress, setLocalProgress] = useState<number | null>(null);
  const { lang, isRTL } = useI18n();
  const copy = profileCopy(lang);

  const courseRecord = course as any;
  const lessons = courseRecord?.lessons ?? [];
  const currentPct = localProgress ?? (courseRecord?.progressPct ?? 0);
  const status = courseRecord?.status ?? "not_started";
  const videoUrl = courseRecord?.videoUrl;
  const markdownContent = courseRecord?.markdownContent;
  const markdownUrl = courseRecord?.markdownUrl;
  const markdownIsRtl = isLikelyRtlMarkdown(markdownContent);
  const canTrackProgress = mode === "learner";

  function startLesson(lessonIndex: number) {
    if (!canTrackProgress) return;

    const lessonCount = Math.max(lessons.length, 1);
    const pct = Math.round(((lessonIndex + 1) / lessonCount) * 100);
    setLocalProgress(pct);
    progressMutation.mutate(
      { id: courseId, data: { progressPct: pct, lastLessonId: lessons[lessonIndex]?.id } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["listCourses"] });
          queryClient.invalidateQueries({ queryKey: ["getLearningPath"] });
          queryClient.invalidateQueries({ queryKey: ["getMyGamification"] });
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
          <section className="space-y-5">
            <div>
              <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">{copy.courseDetail}</div>
              <h2 className="text-2xl font-bold leading-tight md:text-3xl">{courseRecord.title}</h2>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span style={{ color: DIFFICULTY_COLOR[courseRecord.difficulty] ?? "#6b7280" }}>{courseRecord.difficulty}</span>
                <span>{courseRecord.durationMinutes}min</span>
                <span className="text-primary">+{courseRecord.xpReward} {copy.completionReward}</span>
              </div>
            </div>

            <p className="max-w-3xl text-sm leading-7 text-muted-foreground">{courseRecord.description}</p>

            {videoUrl && (
              <div className="overflow-hidden rounded-xl border border-border bg-background">
                <div className="aspect-video w-full bg-black">
                  {isDirectVideo(videoUrl) ? (
                    <video
                      src={videoUrl}
                      controls
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
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  )}
                </div>
              </div>
            )}

            {(markdownContent || markdownUrl) && (
              <div className="rounded-xl border border-border bg-background/70 p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{copy.courseNotes}</div>
                </div>
                {markdownContent ? (
                  <div
                    dir={markdownIsRtl ? "rtl" : "ltr"}
                    className={`prose prose-sm max-w-none dark:prose-invert ${markdownIsRtl ? "text-right" : "text-left"}`}
                  >
                    <ReactMarkdown>{markdownContent}</ReactMarkdown>
                  </div>
                ) : markdownUrl ? (
                  <a href={markdownUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
                    {copy.openMarkdown}
                  </a>
                ) : null}
              </div>
            )}
          </section>

          <aside className="space-y-5">
            {canTrackProgress && (
              <div className="rounded-xl border border-border bg-background/60 p-4">
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-muted-foreground">{copy.progress}</span>
                  <span className={status === "completed" ? "text-emerald-400" : "text-primary"}>{Math.round(currentPct)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    animate={{ width: `${currentPct}%` }}
                    transition={{ duration: 0.4 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: status === "completed" ? "#22c55e" : "#dc143c" }}
                  />
                </div>
              </div>
            )}

            {canTrackProgress && (
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
        </div>
      </div>
    </motion.div>
  );
}
