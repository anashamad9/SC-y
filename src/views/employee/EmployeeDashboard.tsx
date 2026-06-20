import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useGetMyScores, useGetMyGamification, useGetLearningPath, useGetMyBadges, useGetPsychometricProfile, useGetTelemetryTrends, useGetCciHistory } from "@workspace/api-client-react";

function CircleGauge({ value, label, color }: { value: number; label: string; color: string }) {
  const r = 58;
  const total = 2 * Math.PI * r;
  const arc = total * 0.75;
  const filled = arc * (Math.min(100, Math.max(0, value)) / 100);
  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      <circle cx="80" cy="80" r={r} fill="none" stroke="#1f2937" strokeWidth="12" strokeLinecap="round"
        strokeDasharray={`${arc} ${total - arc}`} strokeDashoffset={-total * 0.125}
        transform="rotate(0 80 80)" />
      <circle cx="80" cy="80" r={r} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
        strokeDasharray={`${filled} ${arc - filled} ${total - arc}`} strokeDashoffset={-total * 0.125}
        style={{ transition: "stroke-dasharray 1s ease" }} />
      <text x="80" y="76" textAnchor="middle" fill={color} fontSize="26" fontWeight="bold" fontFamily="monospace">{value}</text>
      <text x="80" y="96" textAnchor="middle" fill="#6b7280" fontSize="10">{label}</text>
    </svg>
  );
}

function RadarBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 text-xs text-muted-foreground truncate shrink-0">{label}</div>
      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <div className="text-xs font-mono w-8 text-right" style={{ color }}>{Math.round(value)}</div>
    </div>
  );
}

const RISKY_CATEGORIES = new Set(["riskTolerance", "impulsiveness", "trustTendencies"]);

function profileColor(key: string, value: number) {
  if (RISKY_CATEGORIES.has(key)) return value > 65 ? "#ef4444" : value > 45 ? "#f97316" : "#22c55e";
  return value > 65 ? "#22c55e" : value > 45 ? "#f97316" : "#ef4444";
}

const PROFILE_LABELS: Record<string, string> = {
  securityAwareness: "Security Awareness",
  complianceBehavior: "Compliance",
  decisionMaking: "Decision Making",
  attentionToDetail: "Attention to Detail",
  stressResponse: "Stress Response",
  riskTolerance: "Risk Tolerance ⚠",
  impulsiveness: "Impulsiveness ⚠",
  trustTendencies: "Trust Tendencies ⚠",
};

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: "#22c55e",
  intermediate: "#f97316",
  advanced: "#ef4444",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-2.5 text-xs shadow-xl">
      <div className="text-muted-foreground mb-1.5">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color }} className="flex justify-between gap-4">
          <span>{p.name}</span><span className="font-mono font-bold">{p.value?.toFixed?.(1) ?? p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function EmployeeDashboard() {
  const { data: scores, isLoading: scoresLoading } = useGetMyScores();
  const { data: gp, isLoading: gpLoading } = useGetMyGamification();
  const { data: path } = useGetLearningPath();
  const { data: badges } = useGetMyBadges();
  const { data: profile } = useGetPsychometricProfile();
  const { data: telemetry } = useGetTelemetryTrends({ days: 30 });
  const { data: cciHistory } = useGetCciHistory();

  const isLoading = scoresLoading || gpLoading;

  const hrsColor = !scores ? "#6b7280" : scores.humanRiskScore > 70 ? "#ef4444" : scores.humanRiskScore > 50 ? "#f97316" : "#22c55e";
  const cciColor = !scores ? "#6b7280" : scores.cciScore > 70 ? "#22c55e" : scores.cciScore > 50 ? "#f97316" : "#ef4444";
  const hasScores = !!scores && (scores as any).hasScores !== false && (scores.securityReadinessScore ?? 0) > 0;

  const recommended = path?.recommended?.slice(0, 3) ?? [];
  const recentBadges = badges?.slice(0, 4) ?? [];

  const xpCurrent = gp ? (gp.xp - gp.currentLevelXp) : 0;
  const xpNeeded = gp ? (gp.nextLevelXp - gp.currentLevelXp) : 200;
  const xpPct = gp ? Math.round((xpCurrent / xpNeeded) * 100) : 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 rounded-xl bg-card/50 animate-pulse border border-border" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Human Risk Score", value: hasScores ? scores?.humanRiskScore ?? 0 : 0, unit: "/100", color: hrsColor, sub: hasScores ? scores?.riskCategory ?? "Not Assessed" : "Not Assessed" },
          { label: "Culture Index (CCI)", value: hasScores ? scores?.cciScore ?? 0 : 0, unit: "/100", color: cciColor, sub: hasScores ? scores?.trend ?? "stable" : "no data" },
          { label: "XP Earned", value: gp?.xp ?? 0, unit: " xp", color: "#a855f7", sub: `Level ${gp?.level ?? 1}` },
          { label: "Learning Streak", value: gp?.streakDays ?? 0, unit: " days", color: "#f97316", sub: "Active Streak" },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-card/80 border border-border rounded-xl p-4 backdrop-blur-sm"
          >
            <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">{card.label}</div>
            <div className="text-2xl font-bold font-mono mb-0.5" style={{ color: card.color }}>
              {card.value}<span className="text-sm text-muted-foreground">{card.unit}</span>
            </div>
            <div className="text-xs text-muted-foreground capitalize">{card.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Gauges + Profile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gauges */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card/80 border border-border rounded-xl p-5 backdrop-blur-sm"
        >
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4">Risk & Culture Gauges</div>
          <div className="flex items-center justify-around">
            <div className="text-center">
              <CircleGauge value={hasScores ? scores?.humanRiskScore ?? 0 : 0} label="Risk Score" color={hrsColor} />
              <div className="text-xs mt-1 font-medium" style={{ color: hrsColor }}>
                {hasScores ? scores?.riskCategory ?? "Not Assessed" : "Not Assessed"}
              </div>
            </div>
            <div className="text-center">
              <CircleGauge value={hasScores ? scores?.cciScore ?? 0 : 0} label="CCI Score" color={cciColor} />
              <div className="text-xs mt-1 font-medium" style={{ color: cciColor }}>
                Culture Index
              </div>
            </div>
          </div>
          {/* CCI sub-scores */}
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            {[
              { label: "Behavioral Stability", value: hasScores ? scores?.behavioralStabilityScore ?? 0 : 0 },
              { label: "Decision Quality", value: hasScores ? scores?.decisionQualityScore ?? 0 : 0 },
              { label: "Compliance", value: hasScores ? scores?.complianceBehaviorScore ?? 0 : 0 },
              { label: "Culture Contribution", value: hasScores ? scores?.cultureContributionScore ?? 0 : 0 },
            ].map(s => (
              <div key={s.label} className="flex justify-between">
                <span className="text-muted-foreground">{s.label}</span>
                <span className="font-mono font-medium">{Math.round(s.value)}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Behavioral Profile */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card/80 border border-border rounded-xl p-5 backdrop-blur-sm"
        >
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Behavioral Profile</div>
          {profile ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-semibold text-primary">{profile.behavioralType}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{profile.learningStyle}</span>
              </div>
              <div className="space-y-2.5">
                {Object.entries(PROFILE_LABELS).map(([key, label]) => {
                  const val = (profile as any)[key] ?? 50;
                  return <RadarBar key={key} label={label} value={val} color={profileColor(key, val)} />;
                })}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm">
              <div className="text-2xl mb-2">◈</div>
              Complete the Psychometric Assessment to unlock your profile
            </div>
          )}
        </motion.div>
      </div>

      {/* CCI Historical Trend */}
      {cciHistory && cciHistory.history.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26 }}
          className="bg-card/80 border border-border rounded-xl p-5 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Culture & Risk Index — Historical Trend</div>
            <div className="text-xs text-muted-foreground">{cciHistory.history.length} snapshots</div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={cciHistory.history} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6b7280" }} tickFormatter={(v: string) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
              <Line type="monotone" dataKey="cciScore" name="CCI Score" stroke="#22c55e" strokeWidth={2} dot={{ r: 3, fill: "#22c55e" }} />
              <Line type="monotone" dataKey="humanRiskScore" name="Risk Score" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: "#ef4444" }} />
              <Line type="monotone" dataKey="behavioralStabilityScore" name="Stability" stroke="#a855f7" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Behavioral Telemetry Trend */}
      {telemetry && telemetry.trends.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="bg-card/80 border border-border rounded-xl p-5 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Behavioral Telemetry — 30 Day Trend</div>
            <div className="text-xs text-muted-foreground">{telemetry.totalEvents} events recorded</div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={telemetry.trends} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#6b7280" }} tickFormatter={(v: string) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
              <Line type="monotone" dataKey="avgConfidence" name="Confidence" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="avgAttention" name="Attention" stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Learning Path + Badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recommended Courses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card/80 border border-border rounded-xl p-5 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Your Learning Path</div>
            <div className="text-xs text-primary">{path?.completionRate ?? 0}% complete</div>
          </div>
          <div className="space-y-3">
            {recommended.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6">All recommended courses completed! 🏆</div>
            ) : recommended.map((course: any, i: number) => (
              <div key={course.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/3 border border-border/50 hover:border-primary/30 transition-colors">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: course.thumbnailColor + "33", color: course.thumbnailColor }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{course.title}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs" style={{ color: DIFFICULTY_COLOR[course.difficulty] ?? "#6b7280" }}>{course.difficulty}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{course.durationMinutes}min</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-purple-400">+{course.xpReward}xp</span>
                  </div>
                </div>
                {course.progressPct > 0 && (
                  <div className="text-xs text-primary shrink-0">{Math.round(course.progressPct)}%</div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* XP + Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-card/80 border border-border rounded-xl p-5 backdrop-blur-sm"
        >
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4">Operative Status</div>
          {/* XP Bar */}
          <div className="mb-5">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-purple-400 font-medium">Level {gp?.level ?? 1}</span>
              <span className="text-muted-foreground">{gp?.xp ?? 0} / {gp?.nextLevelXp ?? 200} XP</span>
            </div>
            <div className="h-3 rounded-full bg-white/5 overflow-hidden border border-border/50">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpPct}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-purple-600 to-primary"
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1">{xpNeeded - xpCurrent} XP to Level {(gp?.level ?? 1) + 1}</div>
          </div>

          {/* Badge shelf */}
          <div className="text-xs text-muted-foreground mb-3">Recent Badges ({badges?.length ?? 0} earned)</div>
          {recentBadges.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">Complete assessments to earn badges</div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {recentBadges.map((badge: any) => (
                <div key={badge.badgeId} className="group relative">
                  <div className="w-full aspect-square rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl hover:border-primary/50 transition-colors cursor-default">
                    {badge.iconName}
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-card border border-border rounded-lg p-2 text-xs text-center whitespace-nowrap shadow-xl pointer-events-none">
                    <div className="font-medium">{badge.name}</div>
                    <div className="text-muted-foreground">{badge.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
