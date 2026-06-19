import { motion } from "framer-motion";
import { useGetPredictiveOrg } from "@workspace/api-client-react";
import { useI18n } from "@/lib/i18n";
import { useTranslation } from "react-i18next";

type Indicator = {
  score: number;
  level: string;
  confidence: number;
  trend: string;
};

const LEVEL_COLORS: Record<string, string> = {
  low: "#22c55e",
  moderate: "#f97316",
  high: "#ef4444",
  critical: "#7f1d1d",
};

const TREND_ICONS: Record<string, string> = {
  increasing: "↑",
  decreasing: "↓",
  stable: "→",
};

function IndicatorBar({ label, indicator }: { label: string; indicator: Indicator }) {
  const color = LEVEL_COLORS[indicator.level] ?? "#6b7280";
  const trendIcon = TREND_ICONS[indicator.trend] ?? "→";
  const trendColor =
    indicator.trend === "decreasing" ? "#22c55e" :
    indicator.trend === "increasing" ? "#ef4444" : "#6b7280";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground truncate max-w-[160px]">{label}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span style={{ color: trendColor }} className="font-mono text-xs">{trendIcon}</span>
          <span className="font-mono" style={{ color }}>{indicator.score}</span>
          <span
            className="text-xs px-1.5 py-0.5 rounded-full border capitalize"
            style={{
              color,
              borderColor: `${color}33`,
              backgroundColor: `${color}11`,
            }}
          >
            {indicator.level}
          </span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${indicator.score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <div className="text-xs text-muted-foreground/60">
        {indicator.confidence}% confidence
      </div>
    </div>
  );
}

export default function PredictiveWidget() {
  const { t: tI18n } = useI18n();
  const { t } = useTranslation();
  const { data, isLoading, isError } = useGetPredictiveOrg();

  const indicatorKeys: { key: keyof typeof data; label: string }[] = [
    { key: "phishingSusceptibility" as keyof typeof data, label: t("predictive.phishingSusceptibility") },
    { key: "humanErrorProbability" as keyof typeof data, label: t("predictive.humanErrorProbability") },
    { key: "insiderThreat" as keyof typeof data, label: t("predictive.insiderThreat") },
    { key: "securityFatigue" as keyof typeof data, label: t("predictive.securityFatigue") },
    { key: "reportingLikelihood" as keyof typeof data, label: t("predictive.reportingLikelihood") },
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-semibold">{t("predictive.title")}</div>
        <div className="text-xs text-muted-foreground font-mono">AI-powered</div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
          {tI18n.loading}
        </div>
      )}

      {isError && (
        <div className="text-xs text-destructive py-4 text-center">
          {t("common.noData")}
        </div>
      )}

      {data && (
        <div className="space-y-4">
          {indicatorKeys.map(({ key, label }) => {
            const indicator = data[key as keyof typeof data] as Indicator | undefined;
            if (!indicator || typeof indicator !== "object") return null;
            return (
              <IndicatorBar key={key as string} label={label} indicator={indicator} />
            );
          })}
          {data.computedAt && (
            <div className="text-xs text-muted-foreground/50 pt-1 border-t border-border/50">
              {new Date(data.computedAt).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
