import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetMyGamification, useGetMyBadges, useGetLeaderboard, useListDepartments } from "@workspace/api-client-react";
import { useI18n } from "@/lib/i18n";

type Tab = "overview" | "badges" | "leaderboard";

const BADGE_CATEGORIES = ["achievement", "learning", "assessment", "streak"];

export default function EmployeeAchievements() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [deptFilter, setDeptFilter] = useState<number | undefined>(undefined);
  const { lang, isRTL } = useI18n();

  const { data: gp } = useGetMyGamification();
  const { data: badges } = useGetMyBadges();
  const { data: leaderboard } = useGetLeaderboard({ departmentId: deptFilter, limit: 20 });
  const { data: departments } = useListDepartments();

  const xpCurrent = gp ? gp.xp - gp.currentLevelXp : 0;
  const xpNeeded = gp ? gp.nextLevelXp - gp.currentLevelXp : 200;
  const xpPct = gp ? Math.min(100, Math.round((xpCurrent / Math.max(1, xpNeeded)) * 100)) : 0;

  const copy = lang === "ar"
    ? {
        overview: "نظرة عامة",
        badges: "الشارات",
        leaderboard: "لوحة الصدارة",
        title: "الإنجازات والتحفيز",
        sub: "رتبتك وشاراتك وموقعك في لوحة الصدارة",
        level: "المستوى",
        totalXp: "إجمالي النقاط",
        dayStreak: "سلسلة الأيام",
        xpToNext: "نقطة للمستوى التالي",
        badgesEarned: "الشارات المكتسبة",
        streakDays: "أيام السلسلة",
        securityLevel: "المستوى الأمني",
        recentBadges: "أحدث الشارات",
        noBadges: "لا توجد شارات بعد — أكمل التقييمات والدورات لكسبها.",
        global: "عام",
        operative: "الموظف",
        you: "أنت",
        yourRank: "ترتيبك",
        keepGoing: "استمر للوصول إلى القمة",
      }
    : {
        overview: "Overview",
        badges: "Badges",
        leaderboard: "Leaderboard",
        title: "Achievements & Gamification",
        sub: "Your Security Champion rank, badges, and leaderboard standing",
        level: "Level",
        totalXp: "total XP",
        dayStreak: "day streak",
        xpToNext: "XP to next level",
        badgesEarned: "Badges Earned",
        streakDays: "Streak Days",
        securityLevel: "Security Level",
        recentBadges: "Recent Badges",
        noBadges: "No badges yet — complete assessments and courses to earn them.",
        global: "Global",
        operative: "Operative",
        you: "You",
        yourRank: "Your rank",
        keepGoing: "keep going to reach the top",
      };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "overview", label: copy.overview, icon: "⬡" },
    { key: "badges", label: `${copy.badges} (${badges?.length ?? 0})`, icon: "◆" },
    { key: "leaderboard", label: copy.leaderboard, icon: "◈" },
  ];

  return (
    <div className="space-y-5" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <h2 className="mb-1 text-lg font-bold">{copy.title}</h2>
        <p className="text-sm text-muted-foreground">{copy.sub}</p>
      </div>

      <div className="flex gap-2 border-b border-border pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab.key ? "-mb-px border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="font-mono text-xs">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="rounded-xl border border-border bg-card/80 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-6">
                <div className="relative shrink-0">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-primary/30 bg-gradient-to-br from-purple-600 to-primary">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{gp?.level ?? 1}</div>
                      <div className="text-xs text-white/70">{copy.level}</div>
                    </div>
                  </div>
                  {(gp?.streakDays ?? 0) > 0 && (
                    <div className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-orange-500 text-sm">
                      🔥
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="mb-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono text-purple-400">{gp?.xp ?? 0}</span>
                    <span className="text-sm text-muted-foreground">{copy.totalXp}</span>
                  </div>
                  <div className="mb-3 text-sm text-muted-foreground">
                    {gp?.streakDays ?? 0} {copy.dayStreak} {(gp?.streakDays ?? 0) >= 7 ? "🔥" : ""}
                  </div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">{copy.level} {gp?.level ?? 1}</span>
                    <span className="text-muted-foreground">{copy.level} {(gp?.level ?? 1) + 1}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full border border-border/50 bg-white/5">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${xpPct}%` }} transition={{ duration: 1, ease: "easeOut" }} className="h-full rounded-full bg-gradient-to-r from-purple-600 to-primary" />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{xpNeeded - xpCurrent} {copy.xpToNext}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: copy.badgesEarned, value: badges?.length ?? 0, icon: "🏅", color: "text-yellow-400" },
                { label: copy.streakDays, value: gp?.streakDays ?? 0, icon: "🔥", color: "text-orange-400" },
                { label: copy.securityLevel, value: gp?.level ?? 1, icon: "⭐", color: "text-purple-400" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-border bg-card/80 p-4 text-center backdrop-blur-sm">
                  <div className="mb-1 text-2xl">{s.icon}</div>
                  <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>

            {(badges?.length ?? 0) > 0 && (
              <div className="rounded-xl border border-border bg-card/80 p-5 backdrop-blur-sm">
                <div className="mb-4 text-xs uppercase tracking-wider text-muted-foreground">{copy.recentBadges}</div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {badges?.slice(0, 4).map((badge: any) => (
                    <div key={badge.badgeId} className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-center">
                      <div className="mb-2 text-3xl">{badge.iconName}</div>
                      <div className="text-xs font-medium">{badge.name}</div>
                      <div className="text-xs text-muted-foreground">{new Date(badge.earnedAt).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "badges" && (
          <motion.div key="badges" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {BADGE_CATEGORIES.map((cat) => {
              const catBadges = badges?.filter((b: any) => b.category === cat) ?? [];
              if (catBadges.length === 0) return null;
              return (
                <div key={cat} className="rounded-xl border border-border bg-card/80 p-5 backdrop-blur-sm">
                  <div className="mb-4 text-xs uppercase tracking-wider capitalize text-muted-foreground">{cat} {copy.badges}</div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {catBadges.map((badge: any) => (
                      <motion.div key={badge.badgeId} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center transition-colors hover:border-primary/40">
                        <div className="mb-2 text-4xl">{badge.iconName}</div>
                        <div className="mb-1 text-xs font-semibold">{badge.name}</div>
                        <div className="text-xs leading-snug text-muted-foreground">{badge.description}</div>
                        <div className="mt-2 text-xs text-primary">{new Date(badge.earnedAt).toLocaleDateString()}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
            {(badges?.length ?? 0) === 0 && (
              <div className="py-16 text-center text-muted-foreground">
                <div className="mb-3 text-4xl">🏅</div>
                <div className="text-sm">{copy.noBadges}</div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "leaderboard" && (
          <motion.div key="leaderboard" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setDeptFilter(undefined)}
                className={`rounded-lg border px-3 py-1.5 text-xs transition-all ${!deptFilter ? "border-primary/30 bg-primary/20 text-primary" : "border-border bg-white/5 text-muted-foreground"}`}
              >
                {copy.global}
              </button>
              {(departments ?? []).slice(0, 8).map((dept: any) => (
                <button
                  key={dept.id}
                  onClick={() => setDeptFilter(dept.id)}
                  className={`rounded-lg border px-3 py-1.5 text-xs transition-all ${deptFilter === dept.id ? "border-primary/30 bg-primary/20 text-primary" : "border-border bg-white/5 text-muted-foreground"}`}
                >
                  {dept.name}
                </button>
              ))}
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card/80 backdrop-blur-sm">
              <div className="grid grid-cols-[2rem_1fr_auto_auto_auto] gap-4 border-b border-border px-5 py-3 text-xs uppercase tracking-wider text-muted-foreground">
                <span>#</span>
                <span>{copy.operative}</span>
                <span className="text-right">XP</span>
                <span className="text-right">{copy.level}</span>
                <span className="text-right">CCI</span>
              </div>
              <div className="divide-y divide-border/50">
                {(leaderboard?.entries ?? []).map((entry: any, i: number) => (
                  <motion.div
                    key={entry.userId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`grid grid-cols-[2rem_1fr_auto_auto_auto] items-center gap-4 px-5 py-3.5 ${entry.isCurrentUser ? "border-l-2 border-primary bg-primary/10" : "hover:bg-white/2"}`}
                  >
                    <div className={`text-sm font-bold font-mono ${entry.rank === 1 ? "text-yellow-400" : entry.rank === 2 ? "text-slate-300" : entry.rank === 3 ? "text-amber-600" : "text-muted-foreground"}`}>
                      {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`}
                    </div>
                    <div>
                      <div className={`text-sm font-medium ${entry.isCurrentUser ? "text-primary" : ""}`}>
                        {entry.firstName} {entry.lastName}
                        {entry.isCurrentUser && <span className="ml-1.5 text-xs text-primary/70">({copy.you})</span>}
                      </div>
                      {entry.departmentName && <div className="text-xs text-muted-foreground">{entry.departmentName}</div>}
                    </div>
                    <div className="text-right text-sm font-mono text-purple-400">{entry.xp.toLocaleString()}</div>
                    <div className="text-right text-sm">{copy.level}.{entry.level}</div>
                    <div className={`text-right text-sm font-mono ${entry.cciScore > 65 ? "text-emerald-400" : entry.cciScore > 50 ? "text-orange-400" : "text-red-400"}`}>
                      {Math.round(entry.cciScore)}
                    </div>
                  </motion.div>
                ))}
              </div>

              {leaderboard?.currentUserRank && leaderboard.currentUserRank > 20 && (
                <div className="border-t border-border px-5 py-3 text-center text-xs text-muted-foreground">
                  {copy.yourRank}: #{leaderboard.currentUserRank} — {copy.keepGoing}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
