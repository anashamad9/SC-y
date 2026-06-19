import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useGetHRDashboard } from "@workspace/api-client-react";
import { useI18n } from "@/lib/i18n";

const RISK_COLORS: Record<string, string> = {
  Critical: "#ef4444",
  High: "#f97316",
  Medium: "#eab308",
  Low: "#22c55e",
};

const RANK_COLORS = ["#ffd700", "#c0c0c0", "#cd7f32", "#8b5cf6", "#6b7280"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-2.5 text-xs shadow-xl">
      <div className="text-muted-foreground mb-1.5">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color }} className="flex justify-between gap-4">
          <span>{p.name}</span>
          <span className="font-mono font-bold">{p.value?.toFixed?.(1) ?? p.value}</span>
        </div>
      ))}
    </div>
  );
};

function MetricCard({ label, value, unit, color, sub }: { label: string; value: number | string; unit?: string; color: string; sub?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-5">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="flex items-end gap-1">
        <span className="text-3xl font-bold font-mono" style={{ color }}>{value}</span>
        {unit && <span className="text-sm text-muted-foreground mb-1">{unit}</span>}
      </div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </motion.div>
  );
}

function RiskBadge({ score }: { score: number }) {
  const label = score > 75 ? "Critical" : score > 60 ? "High" : score > 40 ? "Medium" : "Low";
  const color = RISK_COLORS[label];
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: color + "22", color }}>
      {label}
    </span>
  );
}

function EngagementBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-bold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function HRDashboard() {
  const { t, isRTL } = useI18n();
  const { data, isLoading, error } = useGetHRDashboard();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"name" | "cciScore" | "humanRiskScore" | "xp">("humanRiskScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !data) return (
    <div className="flex items-center justify-center min-h-[400px] text-red-400 text-sm">
      Failed to load HR dashboard
    </div>
  );

  const filtered = (data.employees ?? [])
    .filter((e: any) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase()) ||
      e.jobTitle.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a: any, b: any) => {
      const va = a[sortKey] ?? 0;
      const vb = b[sortKey] ?? 0;
      if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortDir === "asc" ? va - vb : vb - va;
    });

  const riskPieData = (data.riskDistribution ?? []).map((r: any) => ({
    name: r.band,
    value: r.count,
    fill: RISK_COLORS[r.band] ?? "#6b7280",
  }));

  const deptData = (data.deptLearning ?? []).map((d: any) => ({
    name: d.name.length > 12 ? d.name.slice(0, 12) + "…" : d.name,
    completion: d.completionRate,
    streak: d.avgStreak,
  }));

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <h2 className="text-xl font-bold mb-1">{t.hrPortalTitle}</h2>
        <p className="text-sm text-muted-foreground">{t.hrPortalSub}</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <MetricCard label={t.totalEmployees} value={data.summary.totalEmployees} color="#8b5cf6" sub={t.activeWorkforce} />
        <MetricCard label={t.avgHumanRisk} value={data.summary.avgHrs} unit="/100" color="#f97316" sub={t.lowerIsBetter} />
        <MetricCard label={t.cciScore} value={data.summary.avgCci} unit="/100" color="#dc143c" sub={t.cultureIndexSub} />
        <MetricCard label={t.avgCompliance} value={data.summary.avgCompliance} unit="/100" color="#22c55e" sub={t.behaviorScore} />
        <MetricCard label={t.avgXpEarned} value={data.summary.avgXp.toLocaleString()} color="#eab308" sub={t.engagementPts} />
        <MetricCard label={t.avgStreak} value={`${data.summary.avgStreak}d`} color="#06b6d4" sub={t.consecutiveDays} />
      </div>

      {/* Engagement Metrics + Champions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-sm font-semibold mb-4">{t.engagementTitle}</div>
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="text-center bg-white/5 rounded-lg p-3">
              <div className="text-2xl font-bold font-mono text-purple-400">{data.engagement.weeklyActiveCount}</div>
              <div className="text-xs text-muted-foreground mt-1">{t.weeklyActive}</div>
            </div>
            <div className="text-center bg-white/5 rounded-lg p-3">
              <div className="text-2xl font-bold font-mono text-emerald-400">{data.engagement.engagementRate}%</div>
              <div className="text-xs text-muted-foreground mt-1">{t.engagementRate}</div>
            </div>
            <div className="text-center bg-white/5 rounded-lg p-3">
              <div className="text-2xl font-bold font-mono text-blue-400">{data.engagement.courseCompletionRate}%</div>
              <div className="text-xs text-muted-foreground mt-1">{t.courseCompletion}</div>
            </div>
          </div>
          <div className="space-y-3 mt-2">
            <EngagementBar label={t.engagementRate} value={data.engagement.engagementRate} color="#8b5cf6" />
            <EngagementBar label={t.courseCompletion} value={data.engagement.courseCompletionRate} color="#22c55e" />
            <EngagementBar
              label={`${t.avgStreak} (${data.engagement.avgStreak}d avg)`}
              value={Math.min(100, data.engagement.avgStreak * 10)}
              color="#06b6d4"
            />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-sm font-semibold mb-4">{t.championsTitle}</div>
          <div className="space-y-2">
            {(data.champions ?? []).map((champ: any, idx: number) => (
              <motion.div
                key={champ.userId}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.07 }}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ backgroundColor: RANK_COLORS[idx] + "33", color: RANK_COLORS[idx] }}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{champ.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{champ.department}</div>
                </div>
                <div className="flex gap-3 text-xs shrink-0">
                  <div className="text-center">
                    <div className="font-mono font-bold text-yellow-400">{(champ.xp ?? 0).toLocaleString()}</div>
                    <div className="text-muted-foreground">{t.xp}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-mono font-bold text-purple-400">L{champ.level}</div>
                    <div className="text-muted-foreground">{t.level}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-mono font-bold text-emerald-400">{champ.streakDays}d</div>
                    <div className="text-muted-foreground">{t.streak}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-mono font-bold text-blue-400">{champ.badgeCount}</div>
                    <div className="text-muted-foreground">{t.badges}</div>
                  </div>
                </div>
              </motion.div>
            ))}
            {(data.champions ?? []).length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-6">{t.noData}</div>
            )}
          </div>
        </div>
      </div>

      {/* Learning by Dept + Risk Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-sm font-semibold mb-4">{t.learningByDept}</div>
          {deptData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={deptData}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6b7280" }} />
                <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="completion" name="Completion %" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="streak" name="Avg Streak (days)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">{t.noData}</div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-sm font-semibold mb-4">{t.riskDistribution}</div>
          {riskPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={riskPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value">
                  {riskPieData.map((entry: any, i: number) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any, n: any) => [v, n]} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">{t.noData}</div>
          )}
        </div>
      </div>

      {/* Employee table */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="text-sm font-semibold">{t.employeeRoster}</div>
          <div className="text-xs text-muted-foreground">({filtered.length} employees)</div>
          <div className="flex-1" />
          <input
            type="text"
            placeholder={t.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm w-52 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                {[
                  { key: "name", label: t.employee },
                  { key: "cciScore", label: "CCI" },
                  { key: "humanRiskScore", label: "HRS" },
                  { key: "xp", label: t.xp },
                ].map((col) => (
                  <th key={col.key} className="text-left py-2 px-3 cursor-pointer hover:text-foreground select-none"
                    onClick={() => toggleSort(col.key as any)}>
                    {col.label}
                    {sortKey === col.key && <span className="ml-1">{sortDir === "desc" ? "↓" : "↑"}</span>}
                  </th>
                ))}
                <th className="text-left py-2 px-3">{t.department}</th>
                <th className="text-left py-2 px-3">{t.courses}</th>
                <th className="text-left py-2 px-3">{t.streak}</th>
                <th className="text-left py-2 px-3">Risk</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted-foreground text-xs">{t.noData}</td>
                </tr>
              )}
              {filtered.slice(0, 50).map((emp: any) => (
                <tr key={emp.id} className="border-b border-border/50 hover:bg-white/5 transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="font-medium">{emp.name}</div>
                    <div className="text-xs text-muted-foreground">{emp.jobTitle}</div>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-primary font-bold">{emp.cciScore}</td>
                  <td className="py-2.5 px-3">
                    <span className="font-mono font-bold" style={{
                      color: emp.humanRiskScore > 75 ? "#ef4444" : emp.humanRiskScore > 60 ? "#f97316" :
                        emp.humanRiskScore > 40 ? "#eab308" : "#22c55e"
                    }}>{emp.humanRiskScore}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-mono text-yellow-400">{(emp.xp ?? 0).toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground ml-1">L{emp.level}</span>
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">{emp.department}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{emp.coursesCompleted}/{emp.coursesTotal}</td>
                  <td className="py-2.5 px-3 text-cyan-400 font-mono">{emp.streakDays}d</td>
                  <td className="py-2.5 px-3"><RiskBadge score={emp.humanRiskScore} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 50 && (
            <div className="text-center text-xs text-muted-foreground mt-3 pb-2">
              Showing 50 of {filtered.length} — use search to filter
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
