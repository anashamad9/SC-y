import { motion } from "framer-motion";
import { useGetMyPhishingResults } from "@workspace/api-client-react";

function StatusPill({ clicked, reported, submitted }: { clicked: boolean; reported: boolean; submitted: boolean }) {
  if (reported) return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Reported ✓</span>;
  if (submitted) return <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">Credentials Given</span>;
  if (clicked) return <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">Clicked Link</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground border border-border">No Action</span>;
}

const TYPE_LABELS: Record<string, string> = {
  email: "Email Phishing", sms: "SMS Phishing", qr: "QR Code", login: "Fake Login",
  bec: "Business Email Compromise", invoice: "Invoice Fraud", deepfake: "Deepfake",
};

export default function EmployeePhishing() {
  const { data, isLoading } = useGetMyPhishingResults();

  const summary = data?.summary;

  const safeRate = summary ? Math.round(100 - (summary.clickRate ?? 0)) : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Phishing Simulation Results</h2>
        <p className="text-sm text-muted-foreground">Your personal history from security awareness simulations</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Simulations", value: summary?.totalSent ?? 0, color: "text-foreground" },
          { label: "Safety Rate", value: safeRate !== null ? `${safeRate}%` : "—", color: safeRate !== null && safeRate >= 70 ? "text-emerald-400" : "text-orange-400" },
          { label: "Phishing Clicked", value: summary?.clicked ?? 0, color: "text-orange-400" },
          { label: "Threats Reported", value: summary?.reported ?? 0, color: "text-emerald-400" },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card/80 border border-border rounded-xl p-5 backdrop-blur-sm"
          >
            <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">{card.label}</div>
            <div className={`text-3xl font-bold ${card.color}`}>{card.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Safety score bar */}
      {safeRate !== null && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card/80 border border-border rounded-xl p-5 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium">Phishing Resistance Score</div>
            <div className={`text-lg font-bold ${safeRate >= 80 ? "text-emerald-400" : safeRate >= 60 ? "text-yellow-400" : "text-red-400"}`}>{safeRate}%</div>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${safeRate >= 80 ? "bg-emerald-500" : safeRate >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
              initial={{ width: 0 }}
              animate={{ width: `${safeRate}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Vulnerable</span><span>Average</span><span>Vigilant</span>
          </div>
        </motion.div>
      )}

      {/* Training tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-primary/5 border border-primary/20 rounded-xl p-5"
      >
        <div className="text-sm font-semibold text-primary mb-3">🛡️ How to Stay Safe</div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2"><span className="text-primary">◈</span>Always verify the sender email domain — attackers use lookalike domains</li>
          <li className="flex gap-2"><span className="text-primary">◈</span>Hover over links before clicking to inspect the real destination URL</li>
          <li className="flex gap-2"><span className="text-primary">◈</span>Be suspicious of urgent language demanding immediate action</li>
          <li className="flex gap-2"><span className="text-primary">◈</span>Never enter credentials from an email link — go directly to the official site</li>
          <li className="flex gap-2"><span className="text-primary">◈</span>When in doubt, report suspicious emails using the "Report Phishing" button</li>
        </ul>
      </motion.div>

      {/* Results history table */}
      {data?.results && data.results.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card/80 border border-border rounded-xl overflow-hidden"
        >
          <div className="p-4 border-b border-border">
            <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Simulation History</div>
          </div>
          <div className="divide-y divide-border/50">
            {data.results.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.04 }}
                className="px-5 py-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{r.campaignName ?? "Security Simulation"}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {TYPE_LABELS[r.templateType ?? "email"] ?? "Email Phishing"} &bull; Difficulty {r.campaignDifficulty ?? 3}/5 &bull; {new Date(r.sentAt).toLocaleDateString()}
                  </div>
                </div>
                <StatusPill
                  clicked={!!r.clickedAt}
                  reported={!!r.reportedAt}
                  submitted={!!r.credentialSubmittedAt}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[200px] text-center text-muted-foreground">
          <div className="text-4xl mb-3">🎣</div>
          <div className="font-medium">No phishing simulations yet</div>
          <div className="text-sm mt-1">Results will appear here once your first simulation is launched by the admin team.</div>
        </div>
      )}
    </div>
  );
}
