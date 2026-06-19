import { motion } from "framer-motion";
import { useGetAdminStats, useListPhishingCampaigns } from "@workspace/api-client-react";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  draft: "bg-muted/50 text-muted-foreground border-border",
  paused: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  archived: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: campaignsData } = useListPhishingCampaigns({});

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Command Center</h2>
        <p className="text-sm text-muted-foreground">Platform-wide security intelligence and operations overview</p>
      </div>

      {/* Main metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Operatives", value: statsLoading ? "—" : stats?.users ?? 0, color: "text-foreground", icon: "◈" },
          { label: "Departments", value: statsLoading ? "—" : stats?.departments ?? 0, color: "text-primary", icon: "⬡" },
          { label: "Campaigns", value: statsLoading ? "—" : stats?.campaigns ?? 0, color: "text-blue-400", icon: "◉" },
          { label: "Overall Click Rate", value: statsLoading ? "—" : `${stats?.overallClickRate ?? 0}%`, color: stats && stats.overallClickRate > 30 ? "text-red-400" : "text-emerald-400", icon: "◆" },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card/80 border border-border rounded-xl p-5 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{card.label}</div>
              <div className="text-primary text-lg">{card.icon}</div>
            </div>
            <div className={`text-3xl font-bold ${card.color}`}>{card.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Role distribution + active campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card/80 border border-border rounded-xl p-5 backdrop-blur-sm"
        >
          <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">User Role Distribution</div>
          {stats?.byRole?.map((r) => (
            <div key={r.role} className="flex items-center gap-3 mb-3 last:mb-0">
              <div className="capitalize text-sm w-24 shrink-0">{r.role}</div>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round((r.count / (stats.users || 1)) * 100)}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                />
              </div>
              <div className="text-sm font-medium w-8 text-right">{r.count}</div>
            </div>
          ))}
        </motion.div>

        {/* Active campaigns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card/80 border border-border rounded-xl p-5 backdrop-blur-sm"
        >
          <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Recent Campaigns</div>
          <div className="space-y-3">
            {campaignsData?.campaigns?.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground">Difficulty {c.difficulty}/5 &bull; {c.totalTargeted} targeted</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[c.status] ?? STATUS_COLORS.draft}`}>
                  {c.status}
                </span>
              </div>
            )) ?? <div className="text-sm text-muted-foreground">No campaigns yet</div>}
          </div>
        </motion.div>
      </div>

      {/* Recent audit logs */}
      {stats?.recentAuditLogs && stats.recentAuditLogs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card/80 border border-border rounded-xl p-5 backdrop-blur-sm"
        >
          <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Recent Security Events</div>
          <div className="space-y-2">
            {(stats.recentAuditLogs as any[]).map((log: any, i: number) => (
              <div key={log.id ?? i} className="flex items-center gap-3 py-1.5 border-b border-border/40 last:border-0">
                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                <div className="flex-1 text-sm font-mono text-muted-foreground">{log.action}</div>
                <div className="text-xs text-muted-foreground shrink-0">{new Date(log.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
