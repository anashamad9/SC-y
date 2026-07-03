import { motion } from "framer-motion";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Flame,
  Gauge,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import {
  useGetLeaderboard,
  useGetLearningPath,
  useGetMe,
  useGetMyBadges,
  useGetMyGamification,
  useGetMyScores,
  useGetPsychometricProfile,
} from "@workspace/api-client-react";
import { useI18n } from "@/lib/i18n";

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: "text-emerald-400 border-emerald-500/25 bg-emerald-500/10",
  intermediate: "text-amber-400 border-amber-500/25 bg-amber-500/10",
  advanced: "text-red-400 border-red-500/25 bg-red-500/10",
};

const BADGE_TONES = [
  "bg-primary text-primary-foreground",
  "bg-sky-500 text-white",
  "bg-violet-500 text-white",
  "bg-amber-500 text-black",
  "bg-emerald-500 text-white",
  "bg-fuchsia-500 text-white",
];

function formatNumber(value?: number | null) {
  return Number(value ?? 0).toLocaleString();
}

function clampPct(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function initials(firstName?: string | null, lastName?: string | null) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.trim().toUpperCase() || "U";
}

function dashboardCopy(lang: "en" | "ar") {
  return lang === "ar"
    ? {
        course: "دورة",
        completed: "مكتمل",
        inProgress: "قيد التقدم",
        recommended: "موصى به",
        securityModule: "وحدة تعلم أمني",
        lessons: "دروس",
        complete: "مكتمل",
        there: "بك",
        learning: "التعلم",
        recently: "حديثاً",
        badge: "شارة",
        welcomeBack: "مرحباً بعودتك",
        readinessIntro: "جاهزيتك الأمنية هي",
        leftOnCourse: (left: number) => `تبقى ${left}% من دورتك الحالية. حافظ على زخم التعلم.`,
        pathReady: "مسار التعلم الخاص بك جاهز. ابدأ الدورة الموصى بها لتحسين درجتك الأمنية.",
        noPath: "لا توجد دورات نشطة في قاعدة البيانات لمسار التعلم الخاص بك حالياً.",
        xp: "XP",
        next: "التالي",
        level: "المستوى",
        rank: "الترتيب",
        keepClimbing: "واصل التقدم",
        streak: "السلسلة",
        active: "نشطة",
        restart: "ابدأ من جديد",
        xpToNext: "XP للمستوى التالي",
        continueLearning: "متابعة التعلم",
        learningPath: "مسار التعلم",
        noCourse: "لا توجد دورات قيد التقدم أو موصى بها في قاعدة البيانات.",
        recommendedCourses: "الدورات الموصى بها",
        ready: "جاهزة",
        noRecommended: "لا توجد دورات موصى بها في قاعدة البيانات.",
        recentActivity: "النشاط الأخير",
        completedCourse: "أكملت",
        earnedBadge: "حصلت على",
        noActivity: "لا توجد دورات مكتملة أو شارات مكتسبة في قاعدة البيانات لهذا المستخدم.",
        priorityActions: "الإجراءات ذات الأولوية",
        live: "مباشر",
        setup: "إعداد",
        completeAssessment: "أكمل تقييم الجاهزية",
        completeAssessmentDetail: "افتح الدرجات الشخصية وتوصيات الدورات.",
        continue: "تابع",
        module: "وحدة",
        reduceRisk: "قلل المخاطر البشرية",
        riskNeedsAttention: (score: number) => `درجة المخاطر ${score}/100 تحتاج إلى اهتمام.`,
        learningStyle: "نمط التعلم",
        riskSnapshot: "ملخص المخاطر",
        scored: "تم التقييم",
        pending: "قيد الانتظار",
        humanRisk: "المخاطر البشرية",
        recentBadges: "الشارات الأخيرة",
        total: "المجموع",
        noBadges: "لا توجد شارات مكتسبة في قاعدة البيانات لهذا المستخدم.",
        leaderBoard: "لوحة الصدارة",
        youRank: (rank: number) => `أنت #${rank}`,
        top5: "أفضل 5",
        noLeaderboard: "لا توجد سجلات في لوحة الصدارة في قاعدة البيانات.",
      }
    : {
        course: "Course",
        completed: "Completed",
        inProgress: "In progress",
        recommended: "Recommended",
        securityModule: "Security learning module",
        lessons: "lessons",
        complete: "complete",
        there: "there",
        learning: "Learning",
        recently: "Recently",
        badge: "Badge",
        welcomeBack: "Welcome back",
        readinessIntro: "your security readiness is",
        leftOnCourse: (left: number) => `${left}% left on your current course. Keep your learning momentum moving.`,
        pathReady: "Your database-backed learning path is ready. Start the recommended course to build your security score.",
        noPath: "No active course records were returned from the database for your learning path yet.",
        xp: "XP",
        next: "next",
        level: "Level",
        rank: "Rank",
        keepClimbing: "Keep climbing",
        streak: "Streak",
        active: "active",
        restart: "restart",
        xpToNext: "XP to next level",
        continueLearning: "Continue learning",
        learningPath: "Learning path",
        noCourse: "No in-progress or recommended course records were returned from the database.",
        recommendedCourses: "Recommended courses",
        ready: "ready",
        noRecommended: "No recommended course records were returned from the database.",
        recentActivity: "Recent activity",
        completedCourse: "Completed",
        earnedBadge: "Earned",
        noActivity: "No completed course or earned badge records were returned from the database.",
        priorityActions: "Priority actions",
        live: "Live",
        setup: "Setup",
        completeAssessment: "Complete readiness assessment",
        completeAssessmentDetail: "Unlock personalized scores and course recommendations.",
        continue: "Continue",
        module: "module",
        reduceRisk: "Reduce human risk",
        riskNeedsAttention: (score: number) => `${score}/100 risk score needs attention.`,
        learningStyle: "learning style",
        riskSnapshot: "Risk snapshot",
        scored: "Scored",
        pending: "Pending",
        humanRisk: "Human risk",
        recentBadges: "Recent badges",
        total: "total",
        noBadges: "No earned badge records were returned from the database for this user.",
        leaderBoard: "Leader board",
        youRank: (rank: number) => `You #${rank}`,
        top5: "Top 5",
        noLeaderboard: "No leaderboard rows were returned from the database.",
      };
}

function courseStatusLabel(status: string | undefined, copy: ReturnType<typeof dashboardCopy>) {
  if (status === "completed") return copy.completed;
  if (status === "in_progress") return copy.inProgress;
  return copy.recommended;
}

function panelDelay(index: number) {
  return { delay: 0.08 * index, duration: 0.36, ease: "easeOut" as const };
}

function ProgressLine({ value, className = "" }: { value: number; className?: string }) {
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-white/8 ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clampPct(value)}%` }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="h-full rounded-full bg-gradient-to-r from-primary via-red-400 to-amber-300"
      />
    </div>
  );
}

function Section({
  title,
  action,
  children,
  delay = 0,
}: {
  title: string;
  action?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={panelDelay(delay)}
      className="rounded-lg border border-border bg-card/82 p-4 shadow-[0_20px_60px_-42px_rgba(0,0,0,0.7)] backdrop-blur-sm"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {action && <span className="text-xs font-medium text-primary">{action}</span>}
      </div>
      {children}
    </motion.section>
  );
}

function CourseRow({ course, featured = false, copy }: { course: any; featured?: boolean; copy: ReturnType<typeof dashboardCopy> }) {
  const pct = clampPct(course?.progressPct ?? 0);
  return (
    <div className={`rounded-lg border border-border bg-background/55 p-4 ${featured ? "sm:p-5" : ""}`}>
      <div className="flex items-start gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-white shadow-[0_14px_30px_-18px_rgba(0,0,0,0.75)]"
          style={{ backgroundColor: course?.thumbnailColor ?? "#dc143c" }}
        >
          <BookOpen className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground">{course?.title ?? copy.course}</h3>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${DIFFICULTY_COLOR[course?.difficulty] ?? "border-border bg-muted/40 text-muted-foreground"}`}>
              {courseStatusLabel(course?.status, copy)}
            </span>
          </div>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{course?.description ?? copy.securityModule}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>{course?.durationMinutes ?? 0}m</span>
            <span>{course?.lessonCount ?? 0} {copy.lessons}</span>
            <span className="font-medium text-primary">+{course?.xpReward ?? 0} XP</span>
          </div>
          <div className="mt-3">
            <ProgressLine value={pct} />
            <div className="mt-1 text-xs text-muted-foreground">{pct}% {copy.complete}</div>
          </div>
        </div>
        {featured && <ChevronRight className="mt-3 h-5 w-5 shrink-0 text-primary" />}
      </div>
    </div>
  );
}

function RecommendedCard({ course }: { course: any }) {
  return (
    <div className="rounded-lg border border-border bg-background/55 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Target className="h-4 w-4" />
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${DIFFICULTY_COLOR[course?.difficulty] ?? "border-border bg-muted/40 text-muted-foreground"}`}>
          {course?.difficulty ?? "course"}
        </span>
      </div>
      <h3 className="text-sm font-semibold text-foreground">{course?.title}</h3>
      <p className="mt-1 line-clamp-2 min-h-9 text-xs leading-relaxed text-muted-foreground">{course?.description}</p>
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>+{course?.xpReward ?? 0} XP</span>
        <span>{course?.durationMinutes ?? 0}m</span>
      </div>
    </div>
  );
}

export default function EmployeeDashboard() {
  const { lang, isRTL } = useI18n();
  const copy = dashboardCopy(lang);
  const { data: user } = useGetMe();
  const { data: scores, isLoading: scoresLoading } = useGetMyScores();
  const { data: gp, isLoading: gpLoading } = useGetMyGamification();
  const { data: path } = useGetLearningPath();
  const { data: badges } = useGetMyBadges();
  const { data: profile } = useGetPsychometricProfile();
  const { data: leaderboard } = useGetLeaderboard({ limit: 5 });

  const isLoading = scoresLoading || gpLoading;
  const hasScores = !!scores && (scores as any).hasScores !== false && (scores.securityReadinessScore ?? 0) > 0;
  const inProgress = path?.inProgress ?? [];
  const recommended = path?.recommended ?? [];
  const completed = path?.completed ?? [];
  const continueCourse = inProgress[0] ?? recommended[0] ?? completed[0];
  const courseProgress = continueCourse ? clampPct(continueCourse.progressPct ?? (continueCourse.status === "completed" ? 100 : 0)) : 0;
  const xpCurrent = gp ? gp.xp - gp.currentLevelXp : 0;
  const xpNeeded = gp ? Math.max(1, gp.nextLevelXp - gp.currentLevelXp) : 200;
  const xpPct = clampPct((xpCurrent / xpNeeded) * 100);
  const firstName = user?.firstName || copy.there;
  const readiness = hasScores ? clampPct(scores?.securityReadinessScore ?? scores?.cciScore ?? 0) : path?.completionRate ?? 0;
  const rank = leaderboard?.entries?.find((entry: any) => entry.isCurrentUser)?.rank ?? leaderboard?.currentUserRank;
  const recentBadges = (badges ?? []).slice(0, 6);
  const recentActivity = [
    ...completed.slice(0, 3).map((course: any) => ({
      id: `course-${course.id}`,
      title: `${copy.completedCourse} ${course.title}`,
      meta: `${course.category?.replace(/_/g, " ") ?? copy.learning} · +${course.xpEarned ?? course.xpReward ?? 0} XP`,
      when: course.completedAt ? new Date(course.completedAt).toLocaleDateString() : copy.recently,
      value: `+${course.xpEarned ?? course.xpReward ?? 0} XP`,
    })),
    ...recentBadges.slice(0, 3).map((badge: any) => ({
      id: `badge-${badge.badgeId}`,
      title: `${copy.earnedBadge} ${badge.name}`,
      meta: badge.category,
      when: new Date(badge.earnedAt).toLocaleDateString(),
      value: copy.badge,
    })),
  ].slice(0, 4);

  const priorityActions = [
    !hasScores
      ? { title: copy.completeAssessment, detail: copy.completeAssessmentDetail, tone: "text-amber-400" }
      : null,
    continueCourse
      ? { title: `${copy.continue} ${continueCourse.title}`, detail: `${courseProgress}% ${copy.complete} · ${continueCourse.durationMinutes ?? 0}m ${copy.module}`, tone: "text-primary" }
      : null,
    hasScores && (scores?.humanRiskScore ?? 0) > 60
      ? { title: copy.reduceRisk, detail: copy.riskNeedsAttention(Math.round(scores?.humanRiskScore ?? 0)), tone: "text-red-400" }
      : null,
    profile
      ? { title: profile.behavioralType, detail: `${profile.learningStyle} ${copy.learningStyle}`, tone: "text-emerald-400" }
      : null,
  ].filter(Boolean) as { title: string; detail: string; tone: string }[];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-44 animate-pulse rounded-lg border border-border bg-card/60" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="h-36 animate-pulse rounded-lg border border-border bg-card/60" />
            <div className="h-72 animate-pulse rounded-lg border border-border bg-card/60" />
          </div>
          <div className="h-80 animate-pulse rounded-lg border border-border bg-card/60" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5" dir={isRTL ? "rtl" : "ltr"}>
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={panelDelay(0)}
        className="relative overflow-hidden rounded-lg border border-border bg-card/90 p-5 shadow-[0_26px_90px_-52px_rgba(0,0,0,0.9)] sm:p-7"
      >
        <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(220,20,60,0.18),transparent_42%,rgba(34,197,94,0.1))]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px] opacity-35" />
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">{copy.welcomeBack}</div>
            <h1 className="max-w-3xl text-2xl font-bold leading-tight text-foreground text-balance sm:text-4xl">
              {firstName}, {copy.readinessIntro} <span className="text-primary">{readiness}%</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              {continueCourse
                ? copy.leftOnCourse(Math.max(0, 100 - courseProgress))
                : recommended.length > 0
                  ? copy.pathReady
                  : copy.noPath}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: copy.xp, value: formatNumber(gp?.xp), sub: `${formatNumber(gp?.nextLevelXp)} ${copy.next}`, icon: Sparkles },
              { label: copy.level, value: gp?.level ?? 1, sub: rank ? `${copy.rank} #${rank}` : copy.keepClimbing, icon: Trophy },
              { label: copy.streak, value: `${gp?.streakDays ?? 0}d`, sub: gp?.streakDays ? copy.active : copy.restart, icon: Flame },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-lg border border-border/80 bg-background/48 p-3 text-center">
                  <Icon className="mx-auto mb-2 h-4 w-4 text-primary" />
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</div>
                  <div className="mt-1 text-xl font-bold tabular-nums text-primary">{stat.value}</div>
                  <div className="text-[10px] text-muted-foreground">{stat.sub}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="relative mt-6">
          <ProgressLine value={xpPct} />
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>{copy.level} {gp?.level ?? 1}</span>
            <span>{formatNumber(Math.max(0, xpNeeded - xpCurrent))} {copy.xpToNext}</span>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-5">
          <Section title={copy.continueLearning} action={copy.learningPath} delay={1}>
            {continueCourse ? (
              <CourseRow course={continueCourse} featured copy={copy} />
            ) : (
              <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
                {copy.noCourse}
              </div>
            )}
          </Section>

          <Section title={copy.recommendedCourses} action={`${Math.min(recommended.length, 3)} ${copy.ready}`} delay={2}>
            {recommended.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {recommended.slice(0, 3).map((course: any) => <RecommendedCard key={course.id} course={course} />)}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
                {copy.noRecommended}
              </div>
            )}
          </Section>

          <Section title={copy.recentActivity} delay={3}>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border bg-background/55 p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">{item.title}</div>
                      <div className="truncate text-xs capitalize text-muted-foreground">{item.meta}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-primary">{item.value}</div>
                      <div className="text-[10px] text-muted-foreground">{item.when}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
                {copy.noActivity}
              </div>
            )}
          </Section>
        </main>

        <aside className="space-y-5">
          <Section title={copy.priorityActions} action={hasScores ? copy.live : copy.setup} delay={2}>
            <div className="space-y-3">
              {priorityActions.slice(0, 4).map((item) => (
                <div key={item.title} className="rounded-lg border border-border bg-background/55 p-4">
                  <div className={`mb-1 text-xs font-semibold uppercase tracking-wider ${item.tone}`}>{item.title}</div>
                  <p className="text-sm leading-5 text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title={copy.riskSnapshot} action={hasScores ? scores?.riskCategory ?? copy.scored : copy.pending} delay={3}>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: copy.humanRisk, value: hasScores ? scores?.humanRiskScore ?? 0 : 0, icon: Gauge, color: "text-red-400" },
                { label: "CCI", value: hasScores ? scores?.cciScore ?? 0 : 0, icon: ShieldCheck, color: "text-emerald-400" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-lg border border-border bg-background/55 p-4">
                    <Icon className={`mb-3 h-4 w-4 ${item.color}`} />
                    <div className={`text-2xl font-bold tabular-nums ${item.color}`}>{Math.round(item.value)}</div>
                    <div className="text-xs text-muted-foreground">{item.label}</div>
                  </div>
                );
              })}
            </div>
          </Section>

          <Section title={copy.recentBadges} action={`${badges?.length ?? 0} ${copy.total}`} delay={4}>
            {recentBadges.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {recentBadges.map((badge: any, index: number) => (
                  <div key={badge.badgeId} className="rounded-lg border border-border bg-background/55 p-3 text-center">
                    <div className={`mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-lg ${BADGE_TONES[index % BADGE_TONES.length]}`}>
                      <Award className="h-5 w-5" />
                    </div>
                    <div className="truncate text-[11px] font-semibold text-foreground">{badge.name}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
                {copy.noBadges}
              </div>
            )}
          </Section>

          <Section title={copy.leaderBoard} action={rank ? copy.youRank(rank) : copy.top5} delay={5}>
            <div className="space-y-3">
              {(leaderboard?.entries ?? []).slice(0, 5).map((entry: any) => (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-3 rounded-lg border p-3 ${
                    entry.isCurrentUser ? "border-primary/35 bg-primary/10" : "border-border bg-background/55"
                  }`}
                >
                  <div className="w-7 text-xs font-semibold tabular-nums text-muted-foreground">#{entry.rank}</div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    {initials(entry.firstName, entry.lastName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">{entry.firstName} {entry.lastName}</div>
                    <div className="truncate text-xs text-muted-foreground">{entry.departmentName ?? `${copy.level} ${entry.level}`}</div>
                  </div>
                  <div className="text-sm font-bold tabular-nums text-primary">{formatNumber(entry.xp)}</div>
                </div>
              ))}
              {(leaderboard?.entries ?? []).length === 0 && (
                <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
                  {copy.noLeaderboard}
                </div>
              )}
            </div>
          </Section>
        </aside>
      </div>
    </div>
  );
}
