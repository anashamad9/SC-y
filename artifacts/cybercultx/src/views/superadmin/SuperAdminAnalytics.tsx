import { motion } from "framer-motion";
import { useListTenants } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { API_BASE } from "@/lib/runtime";

function StatCard({ label, value, sub, color = "text-foreground" }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card/80 border border-border rounded-xl p-5 backdrop-blur-sm">
      <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </motion.div>
  );
}

const PLAN_COLORS = ["#dc143c", "#3b82f6", "#8b5cf6", "#10b981"];
const STATUS_COLORS = { active: "#10b981", trial: "#f59e0b", suspended: "#ef4444" };

export default function SuperAdminAnalytics() {
  const { data: tenantsData } = useListTenants({ limit: 100 });
  const { data: adminStats } = useQuery<any>({
    queryKey: ["/api/admin/stats"],
    queryFn: () => fetch(`${API_BASE}/api/admin/stats`, { credentials: "include" }).then(r => r.json()),
  });

  const tenants = tenantsData?.tenants ?? [];
  const totalEmployees = tenants.reduce((sum: number, t: any) => sum + (t.employeeCount ?? 0), 0);
  const activeTenants = tenants.filter((t: any) => t.status === "active").length;
  const trialTenants = tenants.filter((t: any) => t.status === "trial").length;

  // Plan distribution data
  const planCounts: Record<string, number> = {};
  for (const t of tenants) { planCounts[t.plan] = (planCounts[t.plan] ?? 0) + 1; }
  const planData = Object.entries(planCounts).map(([name, value]) => ({ name, value }));

  // Industry distribution
  const industryCounts: Record<string, number> = {};
  for (const t of tenants) { if (t.industry) { industryCounts[t.industry] = (industryCounts[t.industry] ?? 0) + 1; } }
  const industryData = Object.entries(industryCounts).map(([industry, count]) => ({ industry, count })).sort((a, b) => b.count - a.count);

  // Status breakdown
  const statusData = Object.entries(
    tenants.reduce((acc: any, t: any) => { acc[t.status] = (acc[t.status] ?? 0) + 1; return acc; }, {})
  ).map(([status, count]) => ({ status, count }));

  // Role distribution from admin stats
  const roleData = (adminStats?.byRole ?? []).map((r: any) => ({ role: r.role, count: Number(r.count) }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Platform Analytics</h2>
        <p className="text-sm text-muted-foreground">Cross-tenant usage metrics and platform health overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tenants" value={tenantsData?.total ?? 0} sub={`${activeTenants} active`} color="text-primary" />
        <StatCard label="Total Employees" value={totalEmployees.toLocaleString()} sub="across all tenants" color="text-blue-400" />
        <StatCard label="Trial Tenants" value={trialTenants} sub="conversion opportunities" color="text-yellow-400" />
        <StatCard label="Platform Click Rate" value={`${adminStats?.overallClickRate ?? 0}%`} sub="phishing simulation avg" color="text-orange-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan distribution donut */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card/80 border border-border rounded-xl p-5">
          <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Plan Distribution</div>
          {planData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={planData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, value }) => `${name}: ${value}`}>
                  {planData.map((_, i) => <Cell key={i} fill={PLAN_COLORS[i % PLAN_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="text-center py-8 text-sm text-muted-foreground">No tenant data</div>}
        </motion.div>

        {/* Industry breakdown bar chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card/80 border border-border rounded-xl p-5">
          <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Tenants by Industry</div>
          {industryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={industryData} margin={{ left: -10, bottom: 20 }}>
                <XAxis dataKey="industry" tick={{ fontSize: 10, fill: "#888" }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: "#888" }} />
                <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #333" }} />
                <Bar dataKey="count" fill="#dc143c" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="text-center py-8 text-sm text-muted-foreground">No industry data</div>}
        </motion.div>

        {/* User role breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card/80 border border-border rounded-xl p-5">
          <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">User Roles Across Platform</div>
          {roleData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={roleData} margin={{ left: -10 }}>
                <XAxis dataKey="role" tick={{ fontSize: 11, fill: "#888" }} />
                <YAxis tick={{ fontSize: 11, fill: "#888" }} />
                <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #333" }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="text-center py-8 text-sm text-muted-foreground">No role data</div>}
        </motion.div>

        {/* Tenant status breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-card/80 border border-border rounded-xl p-5">
          <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Tenant Status Overview</div>
          <div className="space-y-3 mt-2">
            {statusData.map(({ status, count }: any) => (
              <div key={status} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground capitalize">{status}</span>
                  <span className="font-medium">{count} tenants</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: (STATUS_COLORS as any)[status] ?? "#888" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${tenants.length ? (count / tenants.length) * 100 : 0}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-border/50 grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-lg font-bold text-primary">{adminStats?.campaigns ?? 0}</div>
              <div className="text-xs text-muted-foreground">Total Campaigns</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-400">{adminStats?.activeCampaigns ?? 0}</div>
              <div className="text-xs text-muted-foreground">Active Campaigns</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
