import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { API_BASE } from "@/lib/runtime";

async function apiFetch(path: string, opts?: RequestInit) {
  const r = await fetch(`${API_BASE}${path}`, { credentials: "include", ...opts });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

interface Announcement {
  id: string; title: string; body: string; type: "info" | "warning" | "critical";
  audience: "all" | "employee" | "admin"; createdAt: string; active: boolean;
}

const TYPE_COLORS = { info: "border-blue-500/30 bg-blue-500/10", warning: "border-yellow-500/30 bg-yellow-500/10", critical: "border-red-500/30 bg-red-500/10" };
const TYPE_BADGE = { info: "text-blue-400", warning: "text-yellow-400", critical: "text-red-400" };

const BLANK = { title: "", body: "", type: "info" as const, audience: "all" as const };

export default function AdminNotifications() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...BLANK });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/admin/notifications"],
    queryFn: () => apiFetch("/api/admin/notifications"),
  });

  const createMutation = useMutation({
    mutationFn: (body: typeof BLANK) => apiFetch("/api/admin/notifications", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      toast({ title: "Announcement sent!" });
      setShowForm(false);
      setForm({ ...BLANK });
    },
    onError: () => toast({ title: "Failed to send announcement", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/admin/notifications/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      toast({ title: "Announcement removed" });
    },
  });

  const announcements: Announcement[] = data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Notifications & Announcements</h2>
          <p className="text-sm text-muted-foreground">Broadcast security alerts and platform announcements to users</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>+ New Announcement</Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-card/90 border border-primary/30 rounded-xl p-5 space-y-4">
            <div className="text-sm font-semibold">Create Announcement</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Title *</label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Scheduled Maintenance Window" className="bg-muted/30" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
                  className="w-full bg-muted/30 border border-border rounded-md px-3 py-2 text-sm">
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Audience</label>
                <select value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value as any }))}
                  className="w-full bg-muted/30 border border-border rounded-md px-3 py-2 text-sm">
                  <option value="all">All Users</option>
                  <option value="employee">Employees Only</option>
                  <option value="admin">Admins Only</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Message *</label>
                <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  rows={3} placeholder="Write your announcement..."
                  className="w-full bg-muted/30 border border-border rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" disabled={!form.title || !form.body || createMutation.isPending}
                onClick={() => createMutation.mutate(form)}>
                {createMutation.isPending ? "Sending..." : "Send Announcement"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-sm">No announcements yet. Create one to notify your team.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`border rounded-xl p-4 ${TYPE_COLORS[a.type]}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-semibold text-sm">{a.title}</div>
                    <span className={`text-xs uppercase font-bold ${TYPE_BADGE[a.type]}`}>{a.type}</span>
                    <span className="text-xs text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded capitalize">{a.audience}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">{a.body}</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {new Date(a.createdAt).toLocaleString()}
                  </div>
                </div>
                <button onClick={() => deleteMutation.mutate(a.id)}
                  className="text-muted-foreground hover:text-red-400 transition-colors text-xs shrink-0">
                  ✕ Remove
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
