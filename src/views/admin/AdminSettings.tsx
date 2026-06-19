import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { API_BASE } from "@/lib/runtime";

async function apiFetch(path: string, opts?: RequestInit) {
  const r = await fetch(`${API_BASE}${path}`, { credentials: "include", ...opts });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

const SETTING_SECTIONS = [
  {
    title: "Platform Branding",
    fields: [
      { key: "platform.name", label: "Platform Name", type: "text" },
      { key: "platform.support_email", label: "Support Email", type: "email" },
      { key: "platform.default_language", label: "Default Language", type: "select", options: ["en", "ar"] },
    ],
  },
  {
    title: "Security Settings",
    fields: [
      { key: "security.max_login_attempts", label: "Max Login Attempts", type: "number" },
      { key: "security.lockout_duration_min", label: "Lockout Duration (minutes)", type: "number" },
      { key: "security.session_timeout_min", label: "Session Timeout (minutes)", type: "number" },
    ],
  },
  {
    title: "Notifications",
    fields: [
      { key: "notifications.email_enabled", label: "Email Notifications", type: "toggle" },
      { key: "notifications.sms_enabled", label: "SMS Notifications", type: "toggle" },
      { key: "notifications.phishing_results_delay_days", label: "Phishing Result Delay (days)", type: "number" },
    ],
  },
];

const DEFAULTS: Record<string, string> = {
  "platform.name": "CyberCultX",
  "platform.support_email": "support@cybercultx.com",
  "platform.default_language": "en",
  "security.max_login_attempts": "5",
  "security.lockout_duration_min": "15",
  "security.session_timeout_min": "480",
  "notifications.email_enabled": "true",
  "notifications.sms_enabled": "false",
  "notifications.phishing_results_delay_days": "7",
};

export default function AdminSettings() {
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, string>>(DEFAULTS);

  const { data: remoteSettings, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/settings"],
    queryFn: () => apiFetch("/api/admin/settings"),
  });

  useEffect(() => {
    if (remoteSettings) {
      setValues(prev => ({ ...DEFAULTS, ...prev, ...remoteSettings }));
    }
  }, [remoteSettings]);

  const saveKey = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      apiFetch(`/api/admin/settings/${encodeURIComponent(key)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      }),
  });

  async function handleSave(section: typeof SETTING_SECTIONS[0]) {
    try {
      await Promise.all(section.fields.map(f => saveKey.mutateAsync({ key: f.key, value: values[f.key] ?? DEFAULTS[f.key] ?? "" })));
      toast({ title: `${section.title} saved`, description: "Changes persisted to the platform." });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    }
  }

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Platform Settings</h2>
        <p className="text-sm text-muted-foreground">Configure branding, security policies, and notification preferences — persisted to the database</p>
      </div>

      {SETTING_SECTIONS.map((section, si) => (
        <motion.div key={section.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.08 }}
          className="bg-card/80 border border-border rounded-xl p-5 space-y-4">
          <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{section.title}</div>
          <div className="space-y-3">
            {section.fields.map(field => (
              <div key={field.key} className="flex items-center gap-4">
                <label className="text-sm w-64 shrink-0">{field.label}</label>
                {field.type === "toggle" ? (
                  <button
                    onClick={() => setValues(v => ({ ...v, [field.key]: v[field.key] === "true" ? "false" : "true" }))}
                    className={`relative w-10 h-5 rounded-full transition-colors ${values[field.key] === "true" ? "bg-primary" : "bg-muted"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${values[field.key] === "true" ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                ) : field.type === "select" ? (
                  <select value={values[field.key] ?? ""} onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                    className="bg-muted/30 border border-border rounded-md px-3 py-1.5 text-sm">
                    {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <Input type={field.type} value={values[field.key] ?? ""} onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                    className="max-w-xs bg-muted/30" />
                )}
              </div>
            ))}
          </div>
          <Button size="sm" onClick={() => handleSave(section)} disabled={saveKey.isPending}>
            {saveKey.isPending ? "Saving..." : `Save ${section.title}`}
          </Button>
        </motion.div>
      ))}
    </div>
  );
}
