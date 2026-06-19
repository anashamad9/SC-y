import { useState } from "react";
import { motion } from "framer-motion";
import { useListAuditLogs } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ACTION_COLORS: Record<string, string> = {
  LOGIN_SUCCESS: "text-emerald-400",
  LOGIN_FAILED: "text-red-400",
  LOGIN_LOCKED: "text-red-500",
  LOGOUT: "text-muted-foreground",
  REGISTER: "text-blue-400",
  REFRESH: "text-yellow-400",
};

export default function SuperAdminAuditLogs() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");

  const { data, isLoading } = useListAuditLogs({
    page, limit: 25,
    action: actionFilter || undefined,
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Audit Logs</h2>
        <p className="text-sm text-muted-foreground">{data?.total ?? 0} total security events</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input placeholder="Filter by action (e.g. LOGIN)" value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}
          className="max-w-xs bg-muted/30" />
        <div className="flex gap-2">
          {["LOGIN_SUCCESS", "LOGIN_FAILED", "REGISTER", "LOGOUT"].map(a => (
            <button key={a} onClick={() => { setActionFilter(a === actionFilter ? "" : a); setPage(1); }}
              className={`text-xs px-2 py-1.5 rounded-md border transition-colors ${actionFilter === a ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card/80 border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_2fr_2fr_1fr_1fr] text-xs text-muted-foreground uppercase tracking-wider px-5 py-3 border-b border-border bg-muted/20">
          <div>Action</div><div>User</div><div>IP Address</div><div>User Agent</div><div>Time</div>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>
        ) : !data?.logs?.length ? (
          <div className="text-center py-12 text-sm text-muted-foreground">No audit logs found</div>
        ) : (
          <div className="divide-y divide-border/40">
            {data.logs.map((log: any, i: number) => (
              <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className="grid grid-cols-[1fr_2fr_2fr_1fr_1fr] px-5 py-3 items-center hover:bg-muted/10 text-sm">
                <div className={`font-mono text-xs font-medium ${ACTION_COLORS[log.action] ?? "text-foreground"}`}>{log.action}</div>
                <div>
                  <div className="font-medium text-sm">{log.userFirstName ? `${log.userFirstName} ${log.userLastName}` : "—"}</div>
                  <div className="text-xs text-muted-foreground">{log.userEmail ?? "Unknown"}</div>
                </div>
                <div className="text-xs text-muted-foreground font-mono">{log.ipAddress ?? "—"}</div>
                <div className="text-xs text-muted-foreground truncate">{log.userAgent ? log.userAgent.split(" ")[0] : "—"}</div>
                <div className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {data && data.total > 25 && (
        <div className="flex items-center gap-3 justify-center">
          <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {Math.ceil(data.total / 25)}</span>
          <Button variant="ghost" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(data.total / 25)}>Next →</Button>
        </div>
      )}
    </div>
  );
}
