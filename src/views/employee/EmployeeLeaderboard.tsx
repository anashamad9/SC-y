import { motion } from "framer-motion";
import { Flame, Medal, Shield, Sparkles, Trophy } from "lucide-react";
import {
  useGetLeaderboard,
  useGetMe,
  useGetMyGamification,
  useListDepartments,
} from "@workspace/api-client-react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";

const AVATAR_TONES = ["bg-sky-500", "bg-fuchsia-500", "bg-amber-500", "bg-emerald-500", "bg-violet-500", "bg-primary"];

function formatNumber(value?: number | null) {
  return Number(value ?? 0).toLocaleString();
}

function initials(firstName?: string | null, lastName?: string | null) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.trim().toUpperCase() || "U";
}

function entryName(entry: any, fallback: string) {
  return `${entry?.firstName ?? ""} ${entry?.lastName ?? ""}`.trim() || fallback;
}

function avatarTone(index: number) {
  return AVATAR_TONES[index % AVATAR_TONES.length];
}

function xpProgress(profile: any) {
  if (!profile) return 0;
  const current = profile.xp - profile.currentLevelXp;
  const needed = Math.max(1, profile.nextLevelXp - profile.currentLevelXp);
  return Math.min(100, Math.max(0, Math.round((current / needed) * 100)));
}

function PodiumCard({ entry, place, lifted = false, employeeLabel }: { entry: any; place: 1 | 2 | 3; lifted?: boolean; employeeLabel: string }) {
  const tone = place === 1 ? "bg-primary" : place === 2 ? "bg-fuchsia-500" : "bg-amber-500";
  const ring = place === 1 ? "border-primary/45 shadow-primary/12" : "border-border shadow-black/20";

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: lifted ? -18 : 0 }}
      transition={{ duration: 0.38, ease: "easeOut" }}
      className={`relative rounded-lg border ${ring} bg-card/88 p-5 text-center shadow-2xl`}
    >
      {place === 1 && <Trophy className="absolute left-1/2 top-3 h-5 w-5 -translate-x-1/2 text-amber-300" />}
      <div className={`mx-auto mb-4 mt-3 flex h-16 w-16 items-center justify-center rounded-full ${tone} text-lg font-bold text-white`}>
        {initials(entry?.firstName, entry?.lastName)}
      </div>
      <div className="mx-auto mb-3 flex h-7 w-7 items-center justify-center rounded-full bg-background text-xs font-bold tabular-nums text-primary">
        {place}
      </div>
      <div className="truncate text-base font-semibold text-foreground">{entryName(entry, employeeLabel)}</div>
      <div className="mt-1 truncate text-xs text-muted-foreground">{entry?.departmentName ?? employeeLabel}</div>
      <div className="mt-4 text-2xl font-bold tabular-nums text-primary">{formatNumber(entry?.xp)}</div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">XP</div>
    </motion.div>
  );
}

export default function EmployeeLeaderboard() {
  const [deptFilter, setDeptFilter] = useState<number | undefined>(undefined);
  const { lang, isRTL } = useI18n();

  const { data: user } = useGetMe();
  const { data: gp } = useGetMyGamification();
  const { data: departments } = useListDepartments();
  const { data: leaderboard, isLoading } = useGetLeaderboard({ departmentId: deptFilter, limit: 50 });

  const entries = (leaderboard?.entries ?? []) as any[];
  const podium = entries.slice(0, 3);
  const tableRows = entries.slice(3);
  const currentEntry = entries.find((entry) => entry.isCurrentUser);
  const progressPct = xpProgress(gp);

  const copy = lang === "ar"
    ? {
        compete: "تنافس",
        title: "لوحة الصدارة",
        sub: "ترتيبك مقارنة بالموظفين في نفس المؤسسة فقط",
        allDepartments: "كل الأقسام",
        department: "القسم",
        defender: "الموظف",
        streak: "السلسلة",
        level: "المستوى",
        xpToNext: "نقطة للمستوى التالي",
        yourRank: "ترتيبك",
        sameTenant: "موظفو نفس المؤسسة",
        noRows: "لا توجد سجلات موظفين في لوحة الصدارة لهذه المؤسسة.",
        you: "أنت",
        cci: "CCI",
        employee: "موظف",
      }
    : {
        compete: "Compete",
        title: "Leader board",
        sub: "Your rank compared with employees in the same tenant only",
        allDepartments: "All departments",
        department: "Department",
        defender: "Employee",
        streak: "Streak",
        level: "Level",
        xpToNext: "XP to next level",
        yourRank: "Your rank",
        sameTenant: "Same-tenant employees",
        noRows: "No employee leaderboard rows were returned for this tenant.",
        you: "You",
        cci: "CCI",
        employee: "Employee",
      };

  return (
    <div className="mx-auto max-w-7xl space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <header className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-primary">{copy.compete}</div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{copy.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{copy.sub}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-[420px]">
            {[
              { label: "XP", value: formatNumber(gp?.xp), icon: Sparkles },
              { label: copy.level, value: gp?.level ?? 1, icon: Shield },
              { label: copy.yourRank, value: leaderboard?.currentUserRank ? `#${leaderboard.currentUserRank}` : "-", icon: Medal },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-lg border border-border bg-card/82 p-3 text-center">
                  <Icon className="mx-auto mb-2 h-4 w-4 text-primary" />
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</div>
                  <div className="mt-1 text-lg font-bold tabular-nums text-primary">{item.value}</div>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      <section className="rounded-lg border border-border bg-card/82 p-4 shadow-[0_26px_90px_-52px_rgba(0,0,0,0.9)]">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setDeptFilter(undefined)}
            className={`min-h-10 rounded-full border px-4 text-sm font-medium transition-[background-color,color,border-color,transform] active:scale-[0.96] ${
              !deptFilter ? "border-primary/45 bg-primary/15 text-primary" : "border-border bg-background/55 text-muted-foreground hover:text-foreground"
            }`}
          >
            {copy.allDepartments}
          </button>
          {(departments ?? []).map((dept: any) => (
            <button
              key={dept.id}
              onClick={() => setDeptFilter(dept.id)}
              className={`min-h-10 rounded-full border px-4 text-sm font-medium transition-[background-color,color,border-color,transform] active:scale-[0.96] ${
                deptFilter === dept.id ? "border-primary/45 bg-primary/15 text-primary" : "border-border bg-background/55 text-muted-foreground hover:text-foreground"
              }`}
            >
              {dept.name}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((item) => <div key={item} className="h-56 animate-pulse rounded-lg border border-border bg-background/55" />)}
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{copy.noRows}</div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3 md:items-end">
              {podium[1] && <PodiumCard entry={podium[1]} place={2} employeeLabel={copy.employee} />}
              {podium[0] && <PodiumCard entry={podium[0]} place={1} lifted employeeLabel={copy.employee} />}
              {podium[2] && <PodiumCard entry={podium[2]} place={3} employeeLabel={copy.employee} />}
            </div>

            <div className="mt-6 overflow-hidden rounded-lg border border-border bg-background/45">
              <div className="grid grid-cols-[4rem_minmax(0,1.4fr)_minmax(0,1fr)_7rem_6rem_7rem] gap-4 border-b border-border bg-muted/20 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground max-lg:hidden">
                <span>#</span>
                <span>{copy.defender}</span>
                <span>{copy.department}</span>
                <span className="text-right">{copy.streak}</span>
                <span className="text-right">{copy.cci}</span>
                <span className="text-right">XP</span>
              </div>
              <div className="divide-y divide-border/60">
                {tableRows.map((entry, index) => (
                  <motion.div
                    key={entry.userId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.025, duration: 0.25 }}
                    className={`grid gap-3 px-5 py-4 lg:grid-cols-[4rem_minmax(0,1.4fr)_minmax(0,1fr)_7rem_6rem_7rem] lg:items-center ${
                      entry.isCurrentUser ? "bg-primary/10 shadow-[inset_3px_0_0_hsl(var(--primary))]" : "hover:bg-white/[0.025]"
                    }`}
                  >
                    <div className="text-sm font-bold tabular-nums text-muted-foreground">#{entry.rank}</div>
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${avatarTone(index)} text-xs font-bold text-white`}>
                        {initials(entry.firstName, entry.lastName)}
                      </div>
                      <div className="min-w-0">
                        <div className={`truncate text-sm font-semibold ${entry.isCurrentUser ? "text-primary" : "text-foreground"}`}>
                          {entryName(entry, copy.employee)}
                          {entry.isCurrentUser && <span className="ms-2 text-xs font-medium text-primary/70">({copy.you})</span>}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">{copy.sameTenant}</div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">{entry.departmentName ?? "-"}</div>
                    <div className="text-sm tabular-nums text-muted-foreground lg:text-right">
                      <Flame className="me-1 inline h-3.5 w-3.5 text-amber-400" />
                      {entry.streakDays ?? 0}d
                    </div>
                    <div className={`text-sm font-semibold tabular-nums lg:text-right ${entry.cciScore > 65 ? "text-emerald-400" : entry.cciScore > 50 ? "text-amber-400" : "text-red-400"}`}>
                      {Math.round(entry.cciScore ?? 0)}
                    </div>
                    <div className="text-sm font-bold tabular-nums text-primary lg:text-right">{formatNumber(entry.xp)}</div>
                  </motion.div>
                ))}
                {tableRows.length === 0 && (
                  <div className="px-5 py-6 text-center text-sm text-muted-foreground">
                    {entries.length <= 3 ? copy.sameTenant : copy.noRows}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card/82 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">{copy.yourRank}</h2>
          <span className="text-xs font-medium text-primary">{copy.sameTenant}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
            {initials(user?.firstName, user?.lastName)}
          </div>
          <div>
            <div className="text-xl font-bold text-foreground">{currentEntry ? `#${currentEntry.rank}` : leaderboard?.currentUserRank ? `#${leaderboard.currentUserRank}` : "-"}</div>
            <div className="text-sm text-muted-foreground">{user ? `${user.firstName} ${user.lastName}` : copy.you}</div>
          </div>
        </div>
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>{copy.level} {gp?.level ?? 1}</span>
            <span>{Math.max(0, (gp?.nextLevelXp ?? 200) - (gp?.xp ?? 0))} {copy.xpToNext}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/8">
            <motion.div initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 0.7, ease: "easeOut" }} className="h-full rounded-full bg-primary" />
          </div>
        </div>
      </section>
    </div>
  );
}
