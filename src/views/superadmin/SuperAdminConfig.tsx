import { useState } from "react";
import { motion } from "framer-motion";
import { useGetSystemConfig, useUpdateSystemConfig } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const CATEGORY_ORDER = ["general", "branding", "ai", "security", "notifications"];
const CATEGORY_ICONS: Record<string, string> = {
  general: "⚙️", branding: "🎨", ai: "🤖", security: "🔒", notifications: "🔔",
};

export default function SuperAdminConfig() {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: configs, isLoading } = useGetSystemConfig();
  const updateConfig = useUpdateSystemConfig();

  async function handleSave(key: string) {
    try {
      await updateConfig.mutateAsync({ data: { key, value: editValue } });
      queryClient.invalidateQueries({ queryKey: ["/api/system/config"] });
      setEditingKey(null);
      toast({ title: "Config updated", description: `${key} has been saved.` });
    } catch { toast({ title: "Failed to update config", variant: "destructive" }); }
  }

  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    acc[cat] = (configs ?? []).filter((c: any) => c.category === cat);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">System Configuration</h2>
        <p className="text-sm text-muted-foreground">Platform-wide settings and operational parameters</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>
      ) : (
        CATEGORY_ORDER.map((cat, ci) => {
          const items = grouped[cat] ?? [];
          if (items.length === 0) return null;
          return (
            <motion.div key={cat} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.06 }}
              className="bg-card/80 border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border bg-muted/20 flex items-center gap-2">
                <span className="text-base">{CATEGORY_ICONS[cat] ?? "⚙️"}</span>
                <div className="text-sm font-semibold capitalize">{cat} Configuration</div>
              </div>
              <div className="divide-y divide-border/40">
                {items.map((cfg: any) => (
                  <div key={cfg.key} className="px-5 py-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm font-medium text-primary">{cfg.key}</div>
                      {cfg.description && <div className="text-xs text-muted-foreground mt-0.5">{cfg.description}</div>}
                    </div>
                    <div className="flex items-center gap-3">
                      {editingKey === cfg.key ? (
                        <>
                          <Input value={editValue} onChange={e => setEditValue(e.target.value)} className="bg-muted/30 w-48 h-8 text-sm" />
                          <Button size="sm" className="h-7 text-xs px-3" onClick={() => handleSave(cfg.key)}>Save</Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setEditingKey(null)}>×</Button>
                        </>
                      ) : (
                        <>
                          <div className="font-mono text-sm bg-muted/40 px-3 py-1 rounded border border-border min-w-[80px] text-center">
                            {cfg.value ?? "—"}
                          </div>
                          <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => { setEditingKey(cfg.key); setEditValue(cfg.value ?? ""); }}>
                            Edit
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })
      )}
    </div>
  );
}
