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

function courseStatusLabel(status?: string) {
  if (status === "completed") return "Completed";
  if (status === "in_progress") return "In progress";
  return "Recommended";
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

function CourseRow({ course, featured = false }: { course: any; featured?: boolean }) {
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
            <h3 className="truncate text-sm font-semibold text-foreground">{course?.title ?? "Course"}</h3>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${DIFFICULTY_COLOR[course?.difficulty] ?? "border-border bg-muted/40 text-muted-foreground"}`}>
              {courseStatusLabel(course?.status)}
            </span>
          </div>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{course?.description ?? "Security learning module"}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>{course?.durationMinutes ?? 0}m</span>
            <span>{course?.lessonCount ?? 0} lessons</span>
            <span className="font-medium text-primary">+{course?.xpReward ?? 0} XP</span>
          </div>
          <div className="mt-3">
            <ProgressLine value={pct} />
            <div className="mt-1 text-xs text-muted-foreground">{pct}% complete</div>
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
  const { isRTL } = useI18n();
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
  const firstName = user?.firstName || "there";
  const readiness = hasScores ? clampPct(scores?.securityReadinessScore ?? scores?.cciScore ?? 0) : path?.completionRate ?? 0;
  const rank = leaderboard?.entries?.find((entry: any) => entry.isCurrentUser)?.rank ?? leaderboard?.currentUserRank;
  const recentBadges = (badges ?? []).slice(0, 6);
  const recentActivity = [
    ...completed.slice(0, 3).map((course: any) => ({
      id: `course-${course.id}`,
      title: `Completed ${course.title}`,
      meta: `${course.category?.replace(/_/g, " ") ?? "Learning"} · +${course.xpEarned ?? course.xpReward ?? 0} XP`,
      when: course.completedAt ? new Date(course.completedAt).toLocaleDateString() : "Recently",
      value: `+${course.xpEarned ?? course.xpReward ?? 0} XP`,
    })),
    ...recentBadges.slice(0, 3).map((badge: any) => ({
      id: `badge-${badge.badgeId}`,
      title: `Earned ${badge.name}`,
      meta: badge.category,
      when: new Date(badge.earnedAt).toLocaleDateString(),
      value: "Badge",
    })),
  ].slice(0, 4);

  const priorityActions = [
    !hasScores
      ? { title: "Complete readiness assessment", detail: "Unlock personalized scores and course recommendations.", tone: "text-amber-400" }
      : null,
    continueCourse
      ? { title: `Continue ${continueCourse.title}`, detail: `${courseProgress}% complete · ${continueCourse.durationMinutes ?? 0}m module`, tone: "text-primary" }
      : null,
    hasScores && (scores?.humanRiskScore ?? 0) > 60
      ? { title: "Reduce human risk", detail: `${Math.round(scores?.humanRiskScore ?? 0)}/100 risk score needs attention.`, tone: "text-red-400" }
      : null,
    profile
      ? { title: profile.behavioralType, detail: `${profile.learningStyle} learning style`, tone: "text-emerald-400" }
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
            <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">Welcome back</div>
            <h1 className="max-w-3xl text-2xl font-bold leading-tight text-foreground text-balance sm:text-4xl">
              {firstName}, your security readiness is <span className="text-primary">{readiness}%</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              {continueCourse
                ? `${Math.max(0, 100 - courseProgress)}% left on your current course. Keep your learning momentum moving.`
                : recommended.length > 0
                  ? "Your database-backed learning path is ready. Start the recommended course to build your security score."
                  : "No active course records were returned from the database for your learning path yet."}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "XP", value: formatNumber(gp?.xp), sub: `${formatNumber(gp?.nextLevelXp)} next`, icon: Sparkles },
              { label: "Level", value: gp?.level ?? 1, sub: rank ? `Rank #${rank}` : "Keep climbing", icon: Trophy },
              { label: "Streak", value: `${gp?.streakDays ?? 0}d`, sub: gp?.streakDays ? "active" : "restart", icon: Flame },
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
            <span>Level {gp?.level ?? 1}</span>
            <span>{formatNumber(Math.max(0, xpNeeded - xpCurrent))} XP to next level</span>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-5">
          <Section title="Continue learning" action="Learning path" delay={1}>
            {continueCourse ? (
              <CourseRow course={continueCourse} featured />
            ) : (
              <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
                No in-progress or recommended course records were returned from the database.
              </div>
            )}
          </Section>

          <Section title="Recommended courses" action={`${recommended.length} ready`} delay={2}>
            {recommended.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {recommended.slice(0, 4).map((course: any) => <RecommendedCard key={course.id} course={course} />)}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
                No recommended course records were returned from the database.
              </div>
            )}
          </Section>

          <Section title="Recent activity" delay={3}>
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
                No completed course or earned badge records were returned from the database.
              </div>
            )}
          </Section>
        </main>

        <aside className="space-y-5">
          <Section title="Priority actions" action={hasScores ? "Live" : "Setup"} delay={2}>
            <div className="space-y-3">
              {priorityActions.slice(0, 4).map((item) => (
                <div key={item.title} className="rounded-lg border border-border bg-background/55 p-4">
                  <div className={`mb-1 text-xs font-semibold uppercase tracking-wider ${item.tone}`}>{item.title}</div>
                  <p className="text-sm leading-5 text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Risk snapshot" action={hasScores ? scores?.riskCategory ?? "Scored" : "Pending"} delay={3}>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Human risk", value: hasScores ? scores?.humanRiskScore ?? 0 : 0, icon: Gauge, color: "text-red-400" },
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

          <Section title="Recent badges" action={`${badges?.length ?? 0} total`} delay={4}>
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
                No earned badge records were returned from the database for this user.
              </div>
            )}
          </Section>

          <Section title="Leaderboard" action={rank ? `You #${rank}` : "Top 5"} delay={5}>
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
                    <div className="truncate text-xs text-muted-foreground">{entry.departmentName ?? `Level ${entry.level}`}</div>
                  </div>
                  <div className="text-sm font-bold tabular-nums text-primary">{formatNumber(entry.xp)}</div>
                </div>
              ))}
              {(leaderboard?.entries ?? []).length === 0 && (
                <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
                  No leaderboard rows were returned from the database.
                </div>
              )}
            </div>
          </Section>
        </aside>
      </div>
    </div>
  );
}
