import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useGetExecutiveDashboard } from "@workspace/api-client-react";
import { useI18n } from "@/lib/i18n";
import PredictiveWidget from "@/components/PredictiveWidget";

const RISK_COLORS: Record<string, string> = {
  Critical: "#ef4444",
  High: "#f97316",
  Medium: "#eab308",
  Low: "#22c55e",
};

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

function KpiCard({ label, value, unit, color, sub, icon }: {
  label: string; value: number | string; unit?: string; color: string; sub?: string; icon?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-5"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-muted-foreground">{label}</div>
        {icon && <span className="text-lg" style={{ color }}>{icon}</span>}
      </div>
      <div className="flex items-end gap-1">
        <span className="text-3xl font-bold font-mono" style={{ color }}>{value}</span>
        {unit && <span className="text-sm text-muted-foreground mb-1">{unit}</span>}
      </div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </motion.div>
  );
}

function GaugeArc({ value, color, label, size = 120 }: { value: number; color: string; label: string; size?: number }) {
  const r = size * 0.4;
  const cx = size / 2;
  const cy = size / 2;
  const total = 2 * Math.PI * r;
  const arc = total * 0.75;
  const filled = arc * (Math.min(100, Math.max(0, value)) / 100);
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1f2937" strokeWidth={size * 0.08}
          strokeLinecap="round" strokeDasharray={`${arc} ${total - arc}`}
          strokeDashoffset={-total * 0.125} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={size * 0.08}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${arc - filled} ${total - arc}`}
          strokeDashoffset={-total * 0.125}
          style={{ transition: "stroke-dasharray 1s ease" }} />
        <text x={cx} y={cy} textAnchor="middle" fill={color} fontSize={size * 0.2}
          fontWeight="bold" fontFamily="monospace" dy="0.35em">{value}</text>
      </svg>
      <div className="text-xs text-muted-foreground mt-1 text-center">{label}</div>
    </div>
  );
}

function ForecastCard({ label, cci, hrs, confidence, t }: {
  label: string; cci: number; hrs: number; confidence: number;
  t: { cciPrediction: string; hrsPrediction: string; confidencePct: string };
}) {
  return (
    <div className="bg-white/5 rounded-xl p-4 border border-border/50">
      <div className="text-xs font-semibold mb-3 text-muted-foreground">{label}</div>
      <div className="flex justify-between mb-2">
        <div>
          <div className="text-xl font-bold font-mono text-primary">{cci}</div>
          <div className="text-xs text-muted-foreground">{t.cciPrediction}</div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold font-mono text-orange-400">{hrs}</div>
          <div className="text-xs text-muted-foreground">{t.hrsPrediction}</div>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full bg-emerald-500/70" style={{ width: `${confidence}%` }} />
      </div>
      <div className="text-xs text-emerald-400 mt-1">{t.confidencePct} {confidence}%</div>
    </div>
  );
}

export default function ExecutiveDashboard() {
  const { t, isRTL } = useI18n();
  const { data, isLoading, error } = useGetExecutiveDashboard();

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !data) return (
    <div className="flex items-center justify-center min-h-[400px] text-red-400 text-sm">
      Failed to load executive dashboard
    </div>
  );

  const phishingFunnel = [
    { name: t.emailsSent, value: data.phishing.total },
    { name: t.openRate, value: data.phishing.opened },
    { name: t.clickRate, value: data.phishing.clicked },
    { name: t.reportRate, value: data.phishing.reported },
  ];

  const riskPieData = data.riskDistribution.map((r) => ({
    name: r.category,
    value: r.count,
    fill: RISK_COLORS[r.category] ?? "#6b7280",
  }));

  const radarData = data.maturityRadar.map((m) => ({
    subject: m.dimension,
    score: m.score,
    fullMark: 100,
  }));

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <h2 className="text-xl font-bold mb-1">{t.executiveIntelligence}</h2>
        <p className="text-sm text-muted-foreground">{t.orgRiskPosture}</p>
      </div>

      {/* KPI Row — 5 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard label={t.cciScore} value={data.org.avgCci} unit="/100" color="#dc143c" sub={t.cultureIndexSub} icon="◈" />
        <KpiCard label={t.humanRiskScore} value={data.org.avgHrs} unit="/100" color="#f97316" sub={t.lowerIsBetter} icon="◎" />
        <KpiCard label={t.avgCompliance} value={data.org.avgCompliance} unit="/100" color="#22c55e" sub={t.behaviorScore} icon="◆" />
        <KpiCard label={t.totalEmployees} value={data.org.totalUsers} color="#8b5cf6" sub={t.activeUsers} icon="⬡" />
        <KpiCard label={t.cultureIndex} value={data.org.cultureIndex} unit="/100" color="#06b6d4" sub={t.orgCultureHealth} icon="◉" />
      </div>

      {/* Culture Gauges row */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="text-sm font-semibold mb-4">{t.cultureIndex} — {t.keyDimensions}</div>
        <div className="flex flex-wrap justify-around gap-4">
          <GaugeArc value={data.org.avgCci} color="#dc143c" label="CCI" size={110} />
          <GaugeArc value={data.org.avgHrs} color="#f97316" label="HRS" size={110} />
          <GaugeArc value={data.org.avgCompliance} color="#22c55e" label={t.complianceLabel} size={110} />
          <GaugeArc value={data.org.cultureIndex} color="#06b6d4" label={t.cultureIndex} size={110} />
          <GaugeArc value={data.phishing ? (100 - data.phishing.clickRate) : 0} color="#8b5cf6" label={t.phishingDefense} size={110} />
        </div>
      </div>

      {/* Trend + Phishing row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-sm font-semibold mb-4">{t.trendTitle}</div>
          {data.cciTrend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.cciTrend}>
                <defs>
                  <linearGradient id="cciGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc143c" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#dc143c" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="hrsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#6b7280" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#6b7280" }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="cci" name="CCI" stroke="#dc143c" fill="url(#cciGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="hrs" name="HRS" stroke="#f97316" fill="url(#hrsGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="compliance" name="Compliance" stroke="#22c55e" fill="url(#compGrad)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">{t.noData}</div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-sm font-semibold mb-4">{t.phishingResults}</div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-red-400">{data.phishing.clickRate}%</div>
              <div className="text-xs text-muted-foreground">{t.clickRate}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-emerald-400">{data.phishing.reportRate}%</div>
              <div className="text-xs text-muted-foreground">{t.reportRate}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-blue-400">{data.phishing.openRate}%</div>
              <div className="text-xs text-muted-foreground">{t.openRate}</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={110}>
            <BarChart data={phishingFunnel} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10, fill: "#6b7280" }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#9ca3af" }} width={65} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Count" radius={[0, 4, 4, 0]}>
                {phishingFunnel.map((_: any, i: number) => (
                  <Cell key={i} fill={["#6b7280", "#3b82f6", "#ef4444", "#22c55e"][i] ?? "#6b7280"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Maturity Radar + Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-sm font-semibold mb-4">{t.maturityRadar}</div>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1f2937" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#9ca3af" }} />
              <Radar name="Score" dataKey="score" stroke="#dc143c" fill="#dc143c" fillOpacity={0.25} />
              <Tooltip formatter={(v: any) => [`${v}/100`, "Score"]} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {data.maturityRadar.map((m) => (
              <div key={m.dimension} className="text-center">
                <div className="text-xs font-mono font-bold" style={{
                  color: m.score >= 70 ? "#22c55e" : m.score >= 50 ? "#eab308" : "#ef4444"
                }}>{m.score}</div>
                <div className="text-xs text-muted-foreground leading-tight truncate">{m.dimension}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-sm font-semibold mb-4">{t.forecastTitle}</div>
          <div className="space-y-3">
            <ForecastCard
              label={t.forecast30}
              cci={data.forecast.days30.cciPrediction}
              hrs={data.forecast.days30.hrsPrediction}
              confidence={data.forecast.days30.confidence}
              t={t}
            />
            <ForecastCard
              label={t.forecast60}
              cci={data.forecast.days60.cciPrediction}
              hrs={data.forecast.days60.hrsPrediction}
              confidence={data.forecast.days60.confidence}
              t={t}
            />
            <ForecastCard
              label={t.forecast90}
              cci={data.forecast.days90.cciPrediction}
              hrs={data.forecast.days90.hrsPrediction}
              confidence={data.forecast.days90.confidence}
              t={t}
            />
          </div>
        </div>
      </div>

      {/* Financial Risk + Vulnerability Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-sm font-semibold mb-4">{t.financialRisk}</div>
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="text-center">
              <div className="text-xl font-bold font-mono text-red-400">
                ${(data.financialRisk.estimatedAnnualLoss / 1000).toFixed(0)}K
              </div>
              <div className="text-xs text-muted-foreground mt-1">{t.estimatedLoss}</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold font-mono text-emerald-400">
                {data.financialRisk.financialRiskReduction}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">{t.riskReduction}</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold font-mono text-orange-400">
                {data.financialRisk.breachProbabilityPct}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">{t.breachProbability}</div>
            </div>
          </div>
          <div className="text-sm font-semibold mb-3">{t.complianceGauge}</div>
          <div className="space-y-2">
            {data.complianceGauge.breakdown.slice(0, 6).map((dept) => (
              <div key={dept.name} className="flex items-center gap-3">
                <div className="w-24 text-xs text-muted-foreground truncate">{dept.name}</div>
                <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${dept.score}%`,
                      backgroundColor: dept.score >= 70 ? "#22c55e" : dept.score >= 50 ? "#eab308" : "#ef4444",
                    }}
                  />
                </div>
                <div className="text-xs font-mono w-8 text-right" style={{
                  color: dept.score >= 70 ? "#22c55e" : dept.score >= 50 ? "#eab308" : "#ef4444"
                }}>{dept.score}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-sm font-semibold mb-4">{t.vulnerabilityRanking}</div>
          <div className="space-y-2">
            {data.vulnerabilityRanking.map((dept, idx) => (
              <div key={dept.name} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <div className="text-xs font-mono text-muted-foreground w-5 shrink-0">#{idx + 1}</div>
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: RISK_COLORS[dept.riskLevel] ?? "#6b7280" }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{dept.name}</div>
                  <div className="text-xs text-muted-foreground">{dept.userCount} users</div>
                </div>
                <div className="flex gap-3 text-xs font-mono shrink-0">
                  <div className="text-center">
                    <div style={{ color: RISK_COLORS[dept.riskLevel] ?? "#6b7280" }} className="font-bold">{dept.avgHrs}</div>
                    <div className="text-muted-foreground">HRS</div>
                  </div>
                  <div className="text-center">
                    <div className="text-primary font-bold">{dept.avgCci}</div>
                    <div className="text-muted-foreground">CCI</div>
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full border capitalize" style={{
                  backgroundColor: (RISK_COLORS[dept.riskLevel] ?? "#6b7280") + "22",
                  color: RISK_COLORS[dept.riskLevel] ?? "#6b7280",
                  borderColor: (RISK_COLORS[dept.riskLevel] ?? "#6b7280") + "44",
                }}>{dept.riskLevel}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk Distribution + Dept Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-sm font-semibold mb-4">{t.riskDist}</div>
          {riskPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={riskPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                  {riskPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any, n: any) => [v, n]} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">{t.noData}</div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-sm font-semibold mb-4">{t.deptHeatmap}</div>
          <div className="space-y-2 max-h-[220px] overflow-y-auto">
            {data.departments.map((dept) => {
              const riskColor = dept.avgHrs > 75 ? "#ef4444" : dept.avgHrs > 60 ? "#f97316" : dept.avgHrs > 40 ? "#eab308" : "#22c55e";
              const cciColor = dept.avgCci > 70 ? "#22c55e" : dept.avgCci > 50 ? "#eab308" : "#ef4444";
              return (
                <div key={dept.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: riskColor }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{dept.name}</div>
                    <div className="text-xs text-muted-foreground">{dept.userCount} users</div>
                  </div>
                  <div className="flex gap-3 text-xs font-mono">
                    <div><span style={{ color: cciColor }} className="font-bold">{dept.avgCci}</span><span className="text-muted-foreground ml-1">CCI</span></div>
                    <div><span style={{ color: riskColor }} className="font-bold">{dept.avgHrs}</span><span className="text-muted-foreground ml-1">HRS</span></div>
                    <div><span className="text-blue-400 font-bold">{dept.avgCompliance}</span><span className="text-muted-foreground ml-1">Comp</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Predictive Risk Intelligence */}
      <PredictiveWidget />
    </div>
  );
}
