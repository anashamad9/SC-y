import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListCourses, useGetCourse, useUpdateCourseProgress } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

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

function CourseCard({ course, onClick }: { course: any; onClick: () => void }) {
  const status = course.status ?? "not_started";
  const pct = course.progressPct ?? 0;

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="w-full text-left bg-card/80 border border-border rounded-xl overflow-hidden backdrop-blur-sm hover:border-primary/30 transition-colors group"
    >
      {/* Thumbnail bar */}
      <div className="h-2 w-full" style={{ backgroundColor: course.thumbnailColor ?? "#dc143c" }} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors">{course.title}</h3>
          <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 border ${
            status === "completed" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
            status === "in_progress" ? "bg-orange-500/10 border-orange-500/30 text-orange-400" :
            "bg-white/5 border-white/10 text-muted-foreground"
          }`}>
            {status === "completed" ? "✓ Done" : status === "in_progress" ? "In Progress" : "New"}
          </span>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">{course.description}</p>

        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <span style={{ color: DIFFICULTY_COLOR[course.difficulty] ?? "#6b7280" }}>{course.difficulty}</span>
          <span>·</span>
          <span>{course.durationMinutes}min</span>
          <span>·</span>
          <span>{course.lessonCount} lessons</span>
          <span>·</span>
          <span className="text-purple-400">+{course.xpReward}xp</span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              backgroundColor: status === "completed" ? "#22c55e" : "#dc143c",
            }}
          />
        </div>
        {pct > 0 && (
          <div className="text-xs text-muted-foreground mt-1">{Math.round(pct)}% complete</div>
        )}
      </div>
    </motion.button>
  );
}

function CourseDetail({ courseId, onClose }: { courseId: number; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: course, isLoading } = useGetCourse(courseId);
  const progressMutation = useUpdateCourseProgress();
  const [localProgress, setLocalProgress] = useState<number | null>(null);

  const currentPct = localProgress ?? (course?.progressPct ?? 0);
  const status = course?.status ?? "not_started";

  function startLesson(lessonIndex: number) {
    const pct = Math.round(((lessonIndex + 1) / (course?.lessons?.length ?? 1)) * 100);
    setLocalProgress(pct);
    progressMutation.mutate(
      { id: courseId, data: { progressPct: pct, lastLessonId: course?.lessons?.[lessonIndex]?.id } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["listCourses"] });
          queryClient.invalidateQueries({ queryKey: ["getLearningPath"] });
          queryClient.invalidateQueries({ queryKey: ["getMyGamification"] });
        },
      }
    );
  }

  if (isLoading) {
    return (
      <div className="bg-card/80 border border-border rounded-xl p-6 animate-pulse h-64" />
    );
  }

  if (!course) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-card/80 border border-border rounded-xl overflow-hidden backdrop-blur-sm"
    >
      <div className="h-1.5 w-full" style={{ backgroundColor: course.thumbnailColor ?? "#dc143c" }} />
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Course Detail</div>
            <h2 className="text-lg font-bold">{course.title}</h2>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span style={{ color: DIFFICULTY_COLOR[course.difficulty] ?? "#6b7280" }}>{course.difficulty}</span>
              <span>·</span>
              <span>{course.durationMinutes}min</span>
              <span>·</span>
              <span className="text-purple-400">+{course.xpReward}xp on completion</span>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed mb-5">{course.description}</p>

        {/* Progress */}
        <div className="mb-5">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Progress</span>
            <span className={status === "completed" ? "text-emerald-400" : "text-primary"}>{Math.round(currentPct)}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              animate={{ width: `${currentPct}%` }}
              transition={{ duration: 0.4 }}
              className="h-full rounded-full"
              style={{ backgroundColor: status === "completed" ? "#22c55e" : "#dc143c" }}
            />
          </div>
        </div>

        {/* Lessons */}
        <div className="space-y-2 mb-5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Lesson Plan</div>
          {(course.lessons ?? []).map((lesson: any, i: number) => {
            const lessonPct = ((i + 1) / (course.lessons?.length ?? 1)) * 100;
            const isDone = currentPct >= lessonPct;
            return (
              <button
                key={lesson.id}
                onClick={() => startLesson(i)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-sm text-left transition-all ${
                  isDone
                    ? "border-emerald-500/30 bg-emerald-500/5 text-foreground"
                    : "border-border bg-white/3 hover:bg-white/5 hover:border-primary/30 text-foreground"
                }`}
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono shrink-0 ${
                  isDone ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-muted-foreground"
                }`}>
                  {isDone ? "✓" : LESSON_ICONS[lesson.type] ?? "○"}
                </span>
                <div className="flex-1">
                  <div className={isDone ? "text-foreground" : "text-foreground"}>{lesson.title}</div>
                  <div className="text-xs text-muted-foreground capitalize">{lesson.type} · +{lesson.xpReward}xp</div>
                </div>
              </button>
            );
          })}
        </div>

        {currentPct >= 100 ? (
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
            <span>🏆</span>
            <span>Course Completed! +{course.xpReward}xp earned</span>
          </div>
        ) : (
          <Button
            onClick={() => {
              const nextIdx = Math.floor((currentPct / 100) * (course.lessons?.length ?? 1));
              startLesson(nextIdx);
            }}
            disabled={progressMutation.isPending}
            className="w-full bg-primary text-white hover:bg-primary/80"
          >
            {currentPct > 0 ? "Continue Learning →" : "Start Course →"}
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

  const filters: { label: string; value: FilterDifficulty }[] = [
    { label: "All Courses", value: "all" },
    { label: "Beginner", value: "beginner" },
    { label: "Intermediate", value: "intermediate" },
    { label: "Advanced", value: "advanced" },
  ];

  const completedCount = (courses ?? []).filter((c: any) => c.status === "completed").length;
  const inProgressCount = (courses ?? []).filter((c: any) => c.status === "in_progress").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold mb-1">Security Learning Library</h2>
          <p className="text-sm text-muted-foreground">10 security modules calibrated to your risk profile</p>
        </div>
        <div className="flex gap-4 text-xs text-right">
          <div>
            <div className="text-emerald-400 font-bold text-lg">{completedCount}</div>
            <div className="text-muted-foreground">Completed</div>
          </div>
          <div>
            <div className="text-orange-400 font-bold text-lg">{inProgressCount}</div>
            <div className="text-muted-foreground">In Progress</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setSelectedCourse(null); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f.value
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-white/5 text-muted-foreground border border-border hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className={selectedCourse ? "grid grid-cols-1 lg:grid-cols-2 gap-5" : "block"}>
        {/* Course grid */}
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-48 rounded-xl bg-card/50 animate-pulse border border-border" />)}
            </div>
          ) : (
            <div className={`grid gap-4 ${selectedCourse ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
              {(courses ?? []).map((course: any) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onClick={() => setSelectedCourse(selectedCourse === course.id ? null : course.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Course detail panel */}
        <AnimatePresence>
          {selectedCourse && (
            <CourseDetail key={selectedCourse} courseId={selectedCourse} onClose={() => setSelectedCourse(null)} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
