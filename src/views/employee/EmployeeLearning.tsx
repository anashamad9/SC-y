import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListCourses, useGetCourse, useUpdateCourseProgress } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: "#22c55e",
  intermediate: "#f97316",
  advanced: "#ef4444",
};

const LESSON_ICONS: Record<string, string> = {
  video: "▶",
  slides: "◧",
  quiz: "◈",
  scenario: "◎",
};

type FilterDifficulty = "all" | "beginner" | "intermediate" | "advanced";

function useLearningCopy(lang: "en" | "ar") {
  return lang === "ar"
    ? {
        done: "مكتمل",
        inProgress: "قيد التقدم",
        newItem: "جديد",
        lessons: "دروس",
        completePct: "مكتمل",
        courseDetail: "تفاصيل الدورة",
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
        title: "مكتبة التعلم الأمني",
        sub: "وحدات أمنية مخصصة حسب ملف المخاطر الخاص بك",
        completedCount: "مكتمل",
        inProgressCount: "قيد التقدم",
        allCourses: "كل الدورات",
        beginner: "مبتدئ",
        intermediate: "متوسط",
        advanced: "متقدم",
      }
    : {
        done: "Done",
        inProgress: "In Progress",
        newItem: "New",
        lessons: "lessons",
        completePct: "complete",
        courseDetail: "Course Detail",
        completionReward: "xp on completion",
        progress: "Progress",
        lessonPlan: "Lesson Plan",
        videoProgress: "Video Progress",
        videoCompleted: "Video completed",
        markComplete: "Mark video as complete",
        progressHelp: "Updates your course progress and XP",
        courseCompleted: "Course Completed!",
        earned: "earned",
        continueLearning: "Continue Learning",
        startCourse: "Start Course",
        title: "Security Learning Library",
        sub: "Security modules calibrated to your risk profile",
        completedCount: "Completed",
        inProgressCount: "In Progress",
        allCourses: "All Courses",
        beginner: "Beginner",
        intermediate: "Intermediate",
        advanced: "Advanced",
      };
}

function CourseCard({ course, onClick, lang }: { course: any; onClick: () => void; lang: "en" | "ar" }) {
  const status = course.status ?? "not_started";
  const pct = course.progressPct ?? 0;
  const copy = useLearningCopy(lang);

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="group w-full overflow-hidden rounded-xl border border-border bg-card/80 text-left backdrop-blur-sm transition-colors hover:border-primary/30"
    >
      <div className="h-2 w-full" style={{ backgroundColor: course.thumbnailColor ?? "#dc143c" }} />

      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-snug transition-colors group-hover:text-primary">{course.title}</h3>
          <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-xs ${
            status === "completed"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : status === "in_progress"
                ? "border-orange-500/30 bg-orange-500/10 text-orange-400"
                : "border-white/10 bg-white/5 text-muted-foreground"
          }`}>
            {status === "completed" ? `✓ ${copy.done}` : status === "in_progress" ? copy.inProgress : copy.newItem}
          </span>
        </div>

        <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{course.description}</p>

        <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span style={{ color: DIFFICULTY_COLOR[course.difficulty] ?? "#6b7280" }}>{course.difficulty}</span>
          <span>·</span>
          <span>{course.durationMinutes}min</span>
          <span>·</span>
          <span>{course.lessonCount} {copy.lessons}</span>
          <span>·</span>
          <span className="text-purple-400">+{course.xpReward}xp</span>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              backgroundColor: status === "completed" ? "#22c55e" : "#dc143c",
            }}
          />
        </div>
        {pct > 0 && <div className="mt-1 text-xs text-muted-foreground">{Math.round(pct)}% {copy.completePct}</div>}
      </div>
    </motion.button>
  );
}

function CourseDetail({ courseId, onClose }: { courseId: number; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: course, isLoading } = useGetCourse(courseId);
  const progressMutation = useUpdateCourseProgress();
  const [localProgress, setLocalProgress] = useState<number | null>(null);
  const { lang, isRTL } = useI18n();
  const copy = useLearningCopy(lang);

  const currentPct = localProgress ?? (course?.progressPct ?? 0);
  const status = course?.status ?? "not_started";
  const lessons = course?.lessons ?? [];
  const videoUrl = (course as any)?.videoUrl;

  function startLesson(lessonIndex: number) {
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

  if (isLoading) return <div className="h-64 animate-pulse rounded-xl border border-border bg-card/80 p-6" />;
  if (!course) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="overflow-hidden rounded-xl border border-border bg-card/80 backdrop-blur-sm"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="h-1.5 w-full" style={{ backgroundColor: course.thumbnailColor ?? "#dc143c" }} />
      <div className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">{copy.courseDetail}</div>
            <h2 className="text-lg font-bold">{course.title}</h2>
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span style={{ color: DIFFICULTY_COLOR[course.difficulty] ?? "#6b7280" }}>{course.difficulty}</span>
              <span>·</span>
              <span>{course.durationMinutes}min</span>
              <span>·</span>
              <span className="text-purple-400">+{course.xpReward} {copy.completionReward}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-xl leading-none text-muted-foreground hover:text-foreground">×</button>
        </div>

        <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{course.description}</p>

        {videoUrl && (
          <div className="mb-5 overflow-hidden rounded-lg border border-border bg-primary/5">
            <div className="aspect-video w-full bg-background">
              <iframe
                src={videoUrl}
                title={course.title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        )}

        <div className="mb-5">
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="text-muted-foreground">{copy.progress}</span>
            <span className={status === "completed" ? "text-emerald-400" : "text-primary"}>{Math.round(currentPct)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <motion.div animate={{ width: `${currentPct}%` }} transition={{ duration: 0.4 }} className="h-full rounded-full" style={{ backgroundColor: status === "completed" ? "#22c55e" : "#dc143c" }} />
          </div>
        </div>

        <div className="mb-5 space-y-2">
          <div className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">{lessons.length > 0 ? copy.lessonPlan : copy.videoProgress}</div>
          {lessons.length === 0 ? (
            <button
              onClick={() => startLesson(0)}
              className={`w-full rounded-lg px-4 py-3 text-left text-sm transition-all ${
                currentPct >= 100 ? "bg-emerald-500/10 text-emerald-400" : "bg-primary/10 text-primary hover:bg-primary/18"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-mono">
                  {currentPct >= 100 ? "✓" : "▶"}
                </span>
                <div className="flex-1">
                  <div>{currentPct >= 100 ? copy.videoCompleted : copy.markComplete}</div>
                  <div className="text-xs text-muted-foreground">{copy.progressHelp}</div>
                </div>
              </div>
            </button>
          ) : lessons.map((lesson: any, i: number) => {
            const lessonPct = ((i + 1) / lessons.length) * 100;
            const isDone = currentPct >= lessonPct;
            return (
              <button
                key={lesson.id}
                onClick={() => startLesson(i)}
                className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-all ${
                  isDone ? "border-emerald-500/30 bg-emerald-500/5 text-foreground" : "border-border bg-white/3 text-foreground hover:border-primary/30 hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-mono ${isDone ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-muted-foreground"}`}>
                    {isDone ? "✓" : LESSON_ICONS[lesson.type] ?? "○"}
                  </span>
                  <div className="flex-1">
                    <div>{lesson.title}</div>
                    <div className="text-xs capitalize text-muted-foreground">{lesson.type} · +{lesson.xpReward}xp</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {currentPct >= 100 ? (
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
            <span>🏆</span>
            <span>{copy.courseCompleted} +{course.xpReward}xp {copy.earned}</span>
          </div>
        ) : (
          <Button
            onClick={() => {
              const nextIdx = Math.min(Math.floor((currentPct / 100) * Math.max(lessons.length, 1)), Math.max(lessons.length - 1, 0));
              startLesson(nextIdx);
            }}
            disabled={progressMutation.isPending}
            className="w-full bg-primary text-white hover:bg-primary/80"
          >
            {currentPct > 0 ? (isRTL ? `← ${copy.continueLearning}` : `${copy.continueLearning} →`) : (isRTL ? `← ${copy.startCourse}` : `${copy.startCourse} →`)}
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export default function EmployeeLearning() {
  const [filter, setFilter] = useState<FilterDifficulty>("all");
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const { data: courses, isLoading } = useListCourses({ difficulty: filter === "all" ? undefined : filter });
  const { lang, isRTL } = useI18n();
  const copy = useLearningCopy(lang);

  const filters: { label: string; value: FilterDifficulty }[] = [
    { label: copy.allCourses, value: "all" },
    { label: copy.beginner, value: "beginner" },
    { label: copy.intermediate, value: "intermediate" },
    { label: copy.advanced, value: "advanced" },
  ];

  const completedCount = (courses ?? []).filter((c: any) => c.status === "completed").length;
  const inProgressCount = (courses ?? []).filter((c: any) => c.status === "in_progress").length;

  return (
    <div className="space-y-5" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="mb-1 text-lg font-bold">{copy.title}</h2>
          <p className="text-sm text-muted-foreground">{copy.sub}</p>
        </div>
        <div className="flex gap-4 text-right text-xs">
          <div>
            <div className="text-lg font-bold text-emerald-400">{completedCount}</div>
            <div className="text-muted-foreground">{copy.completedCount}</div>
          </div>
          <div>
            <div className="text-lg font-bold text-orange-400">{inProgressCount}</div>
            <div className="text-muted-foreground">{copy.inProgressCount}</div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setFilter(f.value);
              setSelectedCourse(null);
            }}
            className={`rounded-lg border px-4 py-1.5 text-xs font-medium transition-all ${
              filter === f.value ? "border-primary/30 bg-primary/20 text-primary" : "border-border bg-white/5 text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className={selectedCourse ? "grid grid-cols-1 gap-5 lg:grid-cols-2" : "block"}>
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-48 rounded-xl border border-border bg-card/50 animate-pulse" />)}
            </div>
          ) : (
            <div className={`grid gap-4 ${selectedCourse ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
              {(courses ?? []).map((course: any) => (
                <CourseCard key={course.id} course={course} onClick={() => setSelectedCourse(selectedCourse === course.id ? null : course.id)} lang={lang} />
              ))}
            </div>
          )}
        </div>

        <AnimatePresence>
          {selectedCourse && <CourseDetail key={selectedCourse} courseId={selectedCourse} onClose={() => setSelectedCourse(null)} />}
        </AnimatePresence>
      </div>
    </div>
  );
}
