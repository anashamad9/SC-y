import { useState } from "react";
import { motion } from "framer-motion";
import { useListCourses } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { CourseProfilePage } from "@/components/course-profile-page";
import { useI18n } from "@/lib/i18n";
import { API_BASE } from "@/lib/runtime";

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: "#22c55e",
  intermediate: "#f97316",
  advanced: "#ef4444",
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
        courseNotes: "ملاحظات الدورة",
        assetDetails: "تفاصيل الفيديو",
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
        modules: "الوحدات",
        emptyModule: "لا توجد دورات في هذه الوحدة حالياً.",
        beginner: "مبتدئ",
        intermediate: "متوسط",
        advanced: "متقدم",
        level: "المستوى",
        category: "التصنيف",
      }
    : {
        done: "Done",
        inProgress: "In Progress",
        newItem: "New",
        lessons: "lessons",
        completePct: "complete",
        courseDetail: "Course Detail",
        courseNotes: "Course Notes",
        assetDetails: "Video Details",
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
        modules: "Modules",
        emptyModule: "No courses in this module yet.",
        beginner: "Beginner",
        intermediate: "Intermediate",
        advanced: "Advanced",
        level: "Level",
        category: "Category",
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
            {status === "completed" ? copy.done : status === "in_progress" ? copy.inProgress : copy.newItem}
          </span>
        </div>

        <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{course.description}</p>

        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-border bg-background px-2 py-1 text-xs text-muted-foreground">
            {copy.category}: <span className="text-foreground">{course.category}</span>
          </span>
          <span
            className="rounded-full border bg-background px-2 py-1 text-xs"
            style={{
              borderColor: `${DIFFICULTY_COLOR[course.difficulty] ?? "#6b7280"}55`,
              color: DIFFICULTY_COLOR[course.difficulty] ?? "#6b7280",
            }}
          >
            {copy.level}: {copy[course.difficulty as "beginner" | "intermediate" | "advanced"] ?? course.difficulty}
          </span>
        </div>

        <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
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

export default function EmployeeLearning() {
  const [filter, setFilter] = useState<FilterDifficulty>("all");
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const { data: courses, isLoading } = useListCourses({ difficulty: filter === "all" ? undefined : filter });
  const { data: modules = [], isLoading: modulesLoading } = useQuery({
    queryKey: ["/api/courses/modules"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/courses/modules`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to load modules");
      return response.json();
    },
  });
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
  const moduleSections = (modules as any[])
    .map((module) => ({
      module,
      courses: (courses ?? []).filter((course: any) => course.moduleId === module.id),
    }))
    .filter((section) => filter === "all" || section.courses.length > 0);

  if (selectedCourse) {
    return <CourseProfilePage courseId={selectedCourse} mode="learner" onBack={() => setSelectedCourse(null)} />;
  }

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

      <div>
        {isLoading || modulesLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-48 rounded-xl border border-border bg-card/50 animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-6">
            {moduleSections.map(({ module, courses: moduleCourses }) => (
              <section key={module.id} className="rounded-2xl border border-border bg-card/40 p-4">
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{module.title}</h3>
                    <span
                      className="rounded-full border px-2 py-0.5 text-xs"
                      style={{
                        borderColor: `${DIFFICULTY_COLOR[module.difficulty] ?? "#6b7280"}55`,
                        color: DIFFICULTY_COLOR[module.difficulty] ?? "#6b7280",
                      }}
                    >
                      {copy[module.difficulty as "beginner" | "intermediate" | "advanced"] ?? module.difficulty}
                    </span>
                  </div>
                  {module.description && <p className="mt-1 text-sm text-muted-foreground">{module.description}</p>}
                </div>
                {moduleCourses.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">{copy.emptyModule}</div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {moduleCourses.map((course: any) => (
                      <CourseCard key={course.id} course={course} onClick={() => setSelectedCourse(course.id)} lang={lang} />
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
