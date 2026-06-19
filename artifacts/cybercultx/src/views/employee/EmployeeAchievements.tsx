import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetMyGamification, useGetMyBadges, useGetLeaderboard, useListDepartments } from "@workspace/api-client-react";
import { useGetMe } from "@workspace/api-client-react";

type Tab = "overview" | "badges" | "leaderboard";

const BADGE_CATEGORIES = ["achievement", "learning", "assessment", "streak"];

export default function EmployeeAchievements() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [deptFilter, setDeptFilter] = useState<number | undefined>(undefined);

  const { data: gp } = useGetMyGamification();
  const { data: badges } = useGetMyBadges();
  const { data: leaderboard } = useGetLeaderboard({ departmentId: deptFilter, limit: 20 });
  const { data: departments } = useListDepartments();
  const { data: me } = useGetMe();

  const xpCurrent = gp ? (gp.xp - gp.currentLevelXp) : 0;
  const xpNeeded = gp ? (gp.nextLevelXp - gp.currentLevelXp) : 200;
  const xpPct = gp ? Math.min(100, Math.round((xpCurrent / Math.max(1, xpNeeded)) * 100)) : 0;

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "overview", label: "Overview", icon: "⬡" },
    { key: "badges", label: `Badges (${badges?.length ?? 0})`, icon: "◆" },
    { key: "leaderboard", label: "Leaderboard", icon: "◈" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold mb-1">Achievements & Gamification</h2>
        <p className="text-sm text-muted-foreground">Your Security Champion rank, badges, and leaderboard standing</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 border-b border-border pb-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-all rounded-t-lg ${
              activeTab === tab.key
                ? "text-primary border-b-2 border-primary -mb-px"
                : "text-muted-foreground hover:text-foreground"
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
            {/* Level card */}
            <div className="bg-card/80 border border-border rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-6">
                {/* Level badge */}
                <div className="relative shrink-0">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-primary flex items-center justify-center border-4 border-primary/30">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{gp?.level ?? 1}</div>
                      <div className="text-xs text-white/70">LEVEL</div>
                    </div>
                  </div>
                  {(gp?.streakDays ?? 0) > 0 && (
                    <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-sm border-2 border-card">
                      🔥
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl font-bold font-mono text-purple-400">{gp?.xp ?? 0}</span>
                    <span className="text-muted-foreground text-sm">total XP</span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    {gp?.streakDays ?? 0} day streak {(gp?.streakDays ?? 0) >= 7 ? "🔥" : ""}
                  </div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">Level {gp?.level ?? 1}</span>
                    <span className="text-muted-foreground">Level {(gp?.level ?? 1) + 1}</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/5 overflow-hidden border border-border/50">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${xpPct}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-purple-600 to-primary"
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{xpNeeded - xpCurrent} XP to next level</div>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Badges Earned", value: badges?.length ?? 0, icon: "🏅", color: "text-yellow-400" },
                { label: "Streak Days", value: gp?.streakDays ?? 0, icon: "🔥", color: "text-orange-400" },
                { label: "Security Level", value: gp?.level ?? 1, icon: "⭐", color: "text-purple-400" },
              ].map(s => (
                <div key={s.label} className="bg-card/80 border border-border rounded-xl p-4 text-center backdrop-blur-sm">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Recent badges */}
            {(badges?.length ?? 0) > 0 && (
              <div className="bg-card/80 border border-border rounded-xl p-5 backdrop-blur-sm">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4">Recent Badges</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {badges?.slice(0, 4).map((badge: any) => (
                    <div key={badge.badgeId} className="text-center p-3 rounded-xl bg-primary/5 border border-primary/20">
                      <div className="text-3xl mb-2">{badge.iconName}</div>
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
            {BADGE_CATEGORIES.map(cat => {
              const catBadges = badges?.filter((b: any) => b.category === cat) ?? [];
              if (catBadges.length === 0) return null;
              return (
                <div key={cat} className="bg-card/80 border border-border rounded-xl p-5 backdrop-blur-sm">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4 capitalize">{cat} Badges</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {catBadges.map((badge: any) => (
                      <motion.div
                        key={badge.badgeId}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center p-4 rounded-xl bg-primary/5 border border-primary/20 hover:border-primary/40 transition-colors"
                      >
                        <div className="text-4xl mb-2">{badge.iconName}</div>
                        <div className="text-xs font-semibold mb-1">{badge.name}</div>
                        <div className="text-xs text-muted-foreground leading-snug">{badge.description}</div>
                        <div className="text-xs text-primary mt-2">{new Date(badge.earnedAt).toLocaleDateString()}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
            {(badges?.length ?? 0) === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <div className="text-4xl mb-3">🏅</div>
                <div className="text-sm">No badges yet — complete assessments and courses to earn them.</div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "leaderboard" && (
          <motion.div key="leaderboard" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Department filter */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setDeptFilter(undefined)}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${!deptFilter ? "bg-primary/20 text-primary border-primary/30" : "bg-white/5 text-muted-foreground border-border"}`}
              >
                Global
              </button>
              {(departments ?? []).slice(0, 8).map((dept: any) => (
                <button
                  key={dept.id}
                  onClick={() => setDeptFilter(dept.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${deptFilter === dept.id ? "bg-primary/20 text-primary border-primary/30" : "bg-white/5 text-muted-foreground border-border"}`}
                >
                  {dept.name}
                </button>
              ))}
            </div>

            <div className="bg-card/80 border border-border rounded-xl overflow-hidden backdrop-blur-sm">
              <div className="grid grid-cols-[2rem_1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                <span>#</span>
                <span>Operative</span>
                <span className="text-right">XP</span>
                <span className="text-right">Level</span>
                <span className="text-right">CCI</span>
              </div>
              <div className="divide-y divide-border/50">
                {(leaderboard?.entries ?? []).map((entry: any, i: number) => (
                  <motion.div
                    key={entry.userId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`grid grid-cols-[2rem_1fr_auto_auto_auto] gap-4 px-5 py-3.5 items-center ${
                      entry.isCurrentUser ? "bg-primary/10 border-l-2 border-primary" : "hover:bg-white/2"
                    }`}
                  >
                    <div className={`text-sm font-bold font-mono ${
                      entry.rank === 1 ? "text-yellow-400" :
                      entry.rank === 2 ? "text-slate-300" :
                      entry.rank === 3 ? "text-amber-600" : "text-muted-foreground"
                    }`}>
                      {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`}
                    </div>
                    <div>
                      <div className={`text-sm font-medium ${entry.isCurrentUser ? "text-primary" : ""}`}>
                        {entry.firstName} {entry.lastName}
                        {entry.isCurrentUser && <span className="ml-1.5 text-xs text-primary/70">(You)</span>}
                      </div>
                      {entry.departmentName && <div className="text-xs text-muted-foreground">{entry.departmentName}</div>}
                    </div>
                    <div className="text-sm font-mono text-purple-400 text-right">{entry.xp.toLocaleString()}</div>
                    <div className="text-sm text-right">Lv.{entry.level}</div>
                    <div className={`text-sm font-mono text-right ${entry.cciScore > 65 ? "text-emerald-400" : entry.cciScore > 50 ? "text-orange-400" : "text-red-400"}`}>
                      {Math.round(entry.cciScore)}
                    </div>
                  </motion.div>
                ))}
              </div>

              {leaderboard?.currentUserRank && leaderboard.currentUserRank > 20 && (
                <div className="px-5 py-3 border-t border-border text-xs text-muted-foreground text-center">
                  Your rank: #{leaderboard.currentUserRank} — keep going to reach the top!
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
