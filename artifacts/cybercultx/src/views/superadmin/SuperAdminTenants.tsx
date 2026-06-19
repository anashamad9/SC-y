import { useState } from "react";
import { motion } from "framer-motion";
import { useListTenants, useCreateTenant, useUpdateTenant } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const PLAN_COLORS: Record<string, string> = {
  enterprise: "bg-primary/20 text-primary border-primary/30",
  professional: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  starter: "bg-muted/50 text-muted-foreground border-border",
};
const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  trial: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  suspended: "bg-red-500/20 text-red-400 border-red-500/30",
  expired: "bg-muted/50 text-muted-foreground border-border",
};

export default function SuperAdminTenants() {
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", domain: "", adminEmail: "", plan: "starter", industry: "", country: "UAE", employeeCount: "" });
  const [editForm, setEditForm] = useState({ status: "", plan: "" });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useListTenants({ status: statusFilter || undefined, page: 1, limit: 50 });
  const createTenant = useCreateTenant();
  const updateTenant = useUpdateTenant();

  async function handleCreate() {
    try {
      await createTenant.mutateAsync({ data: { ...form, employeeCount: parseInt(form.employeeCount) || 0 } });
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      setShowCreate(false);
      setForm({ name: "", domain: "", adminEmail: "", plan: "starter", industry: "", country: "UAE", employeeCount: "" });
      toast({ title: "Tenant created" });
    } catch { toast({ title: "Failed to create tenant", variant: "destructive" }); }
  }

  async function handleUpdate(id: number) {
    try {
      await updateTenant.mutateAsync({ id, data: editForm as any });
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      setEditingId(null);
      toast({ title: "Tenant updated" });
    } catch { toast({ title: "Failed to update", variant: "destructive" }); }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">Tenant Management</h2>
          <p className="text-sm text-muted-foreground">{data?.total ?? 0} organizations</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)}>{showCreate ? "Cancel" : "+ New Tenant"}</Button>
      </div>

      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card/80 border border-primary/30 rounded-xl p-5 space-y-3">
          <div className="text-sm font-semibold">Create New Tenant</div>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Organization name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-muted/30" />
            <Input placeholder="Domain (e.g. company.ae)" value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} className="bg-muted/30" />
            <Input placeholder="Admin email" value={form.adminEmail} onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))} className="bg-muted/30" />
            <Input placeholder="Industry" value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} className="bg-muted/30" />
            <Input placeholder="Country" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} className="bg-muted/30" />
            <Input placeholder="Employee count" type="number" value={form.employeeCount} onChange={e => setForm(f => ({ ...f, employeeCount: e.target.value }))} className="bg-muted/30" />
            <select value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))} className="bg-muted/30 border border-border rounded-md px-3 py-2 text-sm">
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <Button size="sm" onClick={handleCreate} disabled={!form.name || !form.domain || !form.adminEmail}>Create Tenant</Button>
        </motion.div>
      )}

      <div className="flex gap-3">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-muted/30 border border-border rounded-md px-3 py-2 text-sm">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="suspended">Suspended</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      <div className="bg-card/80 border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] text-xs text-muted-foreground uppercase tracking-wider px-5 py-3 border-b border-border bg-muted/20">
          <div>Organization</div><div>Domain</div><div>Plan</div><div>Status</div><div>Employees</div><div>Actions</div>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>
        ) : (
          <div className="divide-y divide-border/40">
            {data?.tenants?.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] px-5 py-3 items-center hover:bg-muted/10">
                <div>
                  <div className="font-medium text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.industry ?? "—"} &bull; {t.country ?? "—"}</div>
                </div>
                <div className="text-sm text-muted-foreground">{t.domain}</div>
                <div>
                  {editingId === t.id ? (
                    <select value={editForm.plan} onChange={e => setEditForm(f => ({ ...f, plan: e.target.value }))} className="bg-muted border border-border rounded px-2 py-1 text-xs">
                      <option value="starter">Starter</option><option value="professional">Professional</option><option value="enterprise">Enterprise</option>
                    </select>
                  ) : (
                    <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${PLAN_COLORS[t.plan] ?? PLAN_COLORS.starter}`}>{t.plan}</span>
                  )}
                </div>
                <div>
                  {editingId === t.id ? (
                    <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} className="bg-muted border border-border rounded px-2 py-1 text-xs">
                      <option value="active">Active</option><option value="trial">Trial</option><option value="suspended">Suspended</option><option value="expired">Expired</option>
                    </select>
                  ) : (
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[t.status] ?? STATUS_COLORS.trial}`}>{t.status}</span>
                  )}
                </div>
                <div className="text-sm">{t.employeeCount.toLocaleString()}</div>
                <div className="flex gap-2">
                  {editingId === t.id ? (
                    <>
                      <Button size="sm" className="h-6 text-xs px-2" onClick={() => handleUpdate(t.id)}>Save</Button>
                      <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setEditingId(null)}>×</Button>
                    </>
                  ) : (
                    <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => { setEditingId(t.id); setEditForm({ status: t.status, plan: t.plan }); }}>Edit</Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
