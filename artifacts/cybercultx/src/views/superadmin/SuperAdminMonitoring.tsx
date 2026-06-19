import { motion } from "framer-motion";
import { useGetSystemHealth, useListTenants } from "@workspace/api-client-react";

function ServiceCard({ name, status, latency }: { name: string; status: string; latency?: number }) {
  const isHealthy = status === "healthy";
  const isMock = status === "mock";
  return (
    <div className="bg-card/80 border border-border rounded-xl p-4 flex items-center justify-between">
      <div>
        <div className="font-medium text-sm capitalize">{name}</div>
        <div className={`text-xs mt-0.5 ${isHealthy ? "text-emerald-400" : isMock ? "text-yellow-400" : "text-red-400"}`}>
          {status}
        </div>
      </div>
      <div className="text-right">
        {latency !== undefined && <div className="text-xs text-muted-foreground">{latency}ms</div>}
        <div className={`w-2.5 h-2.5 rounded-full mt-1 ml-auto ${isHealthy ? "bg-emerald-500" : isMock ? "bg-yellow-500" : "bg-red-500"} animate-pulse`} />
      </div>
    </div>
  );
}

function MetricBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }} animate={{ width: `${Math.min(100, (value / max) * 100)}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }} />
      </div>
    </div>
  );
}

export default function SuperAdminMonitoring() {
  const { data: health, isLoading } = useGetSystemHealth();
  const { data: tenants } = useListTenants({ limit: 100 });

  const totalEmployees = tenants?.tenants?.reduce((sum, t) => sum + t.employeeCount, 0) ?? 0;
  const activeTenants = tenants?.tenants?.filter(t => t.status === "active").length ?? 0;
  const byPlan = tenants?.tenants?.reduce((acc: any, t) => { acc[t.plan] = (acc[t.plan] ?? 0) + 1; return acc; }, {}) ?? {};

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Platform Monitoring</h2>
        <p className="text-sm text-muted-foreground">Real-time system health and operational metrics</p>
      </div>

      {/* System health summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Platform Status", value: isLoading ? "..." : health?.status ?? "—", color: "text-emerald-400" },
          { label: "Total Users", value: health?.totalUsers?.toLocaleString() ?? "—", color: "text-foreground" },
          { label: "Active Tenants", value: activeTenants, color: "text-blue-400" },
          { label: "Total Employees", value: totalEmployees.toLocaleString(), color: "text-primary" },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card/80 border border-border rounded-xl p-5 backdrop-blur-sm">
            <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">{card.label}</div>
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service health */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="space-y-3">
          <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Service Health</div>
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" /></div>
          ) : health?.services ? (
            Object.entries(health.services as Record<string, any>).map(([name, svc]) => (
              <ServiceCard key={name} name={name} status={svc.status} latency={svc.latencyMs} />
            ))
          ) : null}
        </motion.div>

        {/* Performance metrics */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-card/80 border border-border rounded-xl p-5 space-y-5">
          <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Performance Metrics</div>
          {health?.metrics && (
            <div className="space-y-4">
              <MetricBar label="Requests/minute" value={(health.metrics as any).requestsPerMinute} max={500} color="bg-primary" />
              <MetricBar label="Avg Response (ms)" value={(health.metrics as any).avgResponseMs} max={500} color="bg-blue-500" />
              <MetricBar label="Active Sessions" value={(health.metrics as any).activeSessions} max={200} color="bg-emerald-500" />
              <div className="flex justify-between text-xs pt-2 border-t border-border/50">
                <span className="text-muted-foreground">Error Rate</span>
                <span className={parseFloat((health.metrics as any).errorRate) > 1 ? "text-red-400" : "text-emerald-400"}>
                  {(health.metrics as any).errorRate}%
                </span>
              </div>
              {health.uptime !== undefined && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Uptime</span>
                  <span className="text-foreground">{Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Environment</span>
                <span className="text-foreground font-mono">{health.environment ?? "development"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">API Version</span>
                <span className="text-foreground font-mono">{health.apiVersion}</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Tenant plan distribution */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-card/80 border border-border rounded-xl p-5">
        <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Tenant Plan Distribution</div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { plan: "enterprise", color: "bg-primary", label: "Enterprise" },
            { plan: "professional", color: "bg-blue-500", label: "Professional" },
            { plan: "starter", color: "bg-muted", label: "Starter" },
          ].map(({ plan, color, label }) => (
            <div key={plan} className="text-center">
              <div className={`text-3xl font-bold mb-1 ${plan === "enterprise" ? "text-primary" : plan === "professional" ? "text-blue-400" : "text-muted-foreground"}`}>
                {byPlan[plan] ?? 0}
              </div>
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                <motion.div className={`h-full rounded-full ${color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${tenants?.total ? ((byPlan[plan] ?? 0) / tenants.total) * 100 : 0}%` }}
                  transition={{ duration: 0.8, delay: 0.4 }} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
