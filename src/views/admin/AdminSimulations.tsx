import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useListPhishingTemplates, useListPhishingCampaigns, useCreatePhishingCampaign,
  useLaunchPhishingCampaign, useGeneratePhishingTemplate, useGetCampaignResults,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  draft: "bg-muted/50 text-muted-foreground border-border",
  paused: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

const TYPE_ICONS: Record<string, string> = {
  email: "MAIL", sms: "SMS", qr: "QR", login: "LOGIN", bec: "BEC", invoice: "INV", deepfake: "AUDIO",
};

type Tab = "campaigns" | "templates" | "generator";

export default function AdminSimulations() {
  const [tab, setTab] = useState<Tab>("campaigns");
  const [templatePage, setTemplatePage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [langFilter, setLangFilter] = useState("");
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderStep, setBuilderStep] = useState(1);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [campaignName, setCampaignName] = useState("");
  const [campaignDifficulty, setCampaignDifficulty] = useState(3);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [audienceType, setAudienceType] = useState<"all" | "department">("all");
  const [scheduledMode, setScheduledMode] = useState<"now" | "scheduled">("now");
  const [scheduledAt, setScheduledAt] = useState("");

  // AI Generator state
  const [genIndustry, setGenIndustry] = useState("finance");
  const [genType, setGenType] = useState("email");
  const [genDifficulty, setGenDifficulty] = useState(3);
  const [genLang, setGenLang] = useState("en");
  const [genResult, setGenResult] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templatesData, isLoading: templatesLoading } = useListPhishingTemplates({
    page: templatePage, limit: 20,
    type: typeFilter || undefined,
    language: langFilter || undefined,
  });
  const { data: campaignsData, isLoading: campaignsLoading } = useListPhishingCampaigns({});
  const { data: campaignResults } = useGetCampaignResults(
    selectedCampaignId ?? 0,
    { page: 1, limit: 10 },
    { query: { queryKey: [`/api/phishing/campaigns/${selectedCampaignId}/results`], enabled: !!selectedCampaignId } },
  );

  const createCampaign = useCreatePhishingCampaign();
  const launchCampaign = useLaunchPhishingCampaign();
  const generateTemplate = useGeneratePhishingTemplate();

  async function handleCreateCampaign() {
    if (!campaignName.trim() || !selectedTemplateId) return;
    const targetAudience = { type: audienceType };
    const schedDate = scheduledMode === "scheduled" && scheduledAt ? new Date(scheduledAt).toISOString() : undefined;
    try {
      await createCampaign.mutateAsync({
        data: {
          name: campaignName,
          templateId: selectedTemplateId,
          difficulty: campaignDifficulty,
          status: "draft",
          ...(schedDate ? { scheduledAt: schedDate } : {}),
        },
      });
      queryClient.invalidateQueries({ queryKey: ["/api/phishing/campaigns"] });
      toast({ title: "Campaign created!", description: `"${campaignName}" is ready to launch.` });
      setShowBuilder(false); setCampaignName(""); setBuilderStep(1); setSelectedTemplateId(null);
      setAudienceType("all"); setScheduledMode("now"); setScheduledAt("");
      setTab("campaigns");
    } catch { toast({ title: "Failed to create campaign", variant: "destructive" }); }
  }

  async function handleLaunch(id: number) {
    try {
      await launchCampaign.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: ["/api/phishing/campaigns"] });
      toast({ title: "Campaign launched!", description: "Phishing simulation is now active for all employees." });
    } catch { toast({ title: "Failed to launch", variant: "destructive" }); }
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const result = await generateTemplate.mutateAsync({
        data: { industry: genIndustry, attackType: genType, difficulty: genDifficulty, language: genLang },
      });
      setGenResult(result);
    } catch { toast({ title: "Generation failed", variant: "destructive" }); }
    finally { setGenerating(false); }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">Phishing Simulations</h2>
          <p className="text-sm text-muted-foreground">Campaign management, template library, and AI generation</p>
        </div>
        {tab === "campaigns" && (
          <Button onClick={() => { setShowBuilder(true); setTab("templates"); }} size="sm">
            + New Campaign
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/30 rounded-lg p-1 w-fit">
        {(["campaigns", "templates", "generator"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setShowBuilder(false); }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
              tab === t ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "generator" ? "AI Generator" : t}
          </button>
        ))}
      </div>

      {/* ── CAMPAIGNS TAB ─────────────────────────────── */}
      {tab === "campaigns" && (
        <div className="space-y-4">
          {/* Campaign Analytics Summary */}
          {!campaignsLoading && (campaignsData?.campaigns?.length ?? 0) > 0 && (() => {
            const campaigns = campaignsData!.campaigns!;
            const totalTargeted = campaigns.reduce((s, c) => s + (c.totalTargeted ?? 0), 0);
            const statusCounts = campaigns.reduce((acc: Record<string, number>, c) => {
              acc[c.status] = (acc[c.status] ?? 0) + 1; return acc;
            }, {});
            const statusBarData = [
              { label: "Active", count: statusCounts.active ?? 0, color: "#10b981" },
              { label: "Completed", count: statusCounts.completed ?? 0, color: "#3b82f6" },
              { label: "Draft", count: statusCounts.draft ?? 0, color: "#6b7280" },
              { label: "Paused", count: statusCounts.paused ?? 0, color: "#f59e0b" },
            ];
            const diffCounts = campaigns.reduce((acc: Record<number, number>, c) => {
              acc[c.difficulty] = (acc[c.difficulty] ?? 0) + 1; return acc;
            }, {});
            const diffData = [1,2,3,4,5].map(d => ({ diff: `L${d}`, count: diffCounts[d] ?? 0 }));

            const funnelStages = [
              { label: "Total Targeted", value: totalTargeted, pct: 100, color: "#dc143c" },
              { label: "Est. Delivered", value: Math.round(totalTargeted * 0.95), pct: 95, color: "#f97316" },
              { label: "Est. Opened", value: Math.round(totalTargeted * 0.62), pct: 62, color: "#f59e0b" },
              { label: "Est. Clicked", value: Math.round(totalTargeted * 0.18), pct: 18, color: "#ef4444" },
              { label: "Est. Reported", value: Math.round(totalTargeted * 0.08), pct: 8, color: "#10b981" },
            ];

            return (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* KPI strip */}
                <div className="lg:col-span-3 grid grid-cols-4 gap-3">
                  {[
                    { label: "Total Campaigns", value: campaigns.length, color: "text-foreground" },
                    { label: "Active", value: statusCounts.active ?? 0, color: "text-emerald-400" },
                    { label: "Total Targeted", value: totalTargeted.toLocaleString(), color: "text-primary" },
                    { label: "Avg Difficulty", value: campaigns.length ? (campaigns.reduce((s, c) => s + c.difficulty, 0) / campaigns.length).toFixed(1) : "—", color: "text-yellow-400" },
                  ].map(kpi => (
                    <div key={kpi.label} className="bg-card/80 border border-border rounded-xl p-4">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{kpi.label}</div>
                      <div className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</div>
                    </div>
                  ))}
                </div>

                {/* Status breakdown bar chart */}
                <div className="bg-card/80 border border-border rounded-xl p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Status Breakdown</div>
                  <ResponsiveContainer width="100%" height={130}>
                    <BarChart data={statusBarData} margin={{ left: -20, bottom: 0 }}>
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#888" }} />
                      <YAxis tick={{ fontSize: 10, fill: "#888" }} />
                      <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #333", fontSize: 12 }} />
                      <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                        {statusBarData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Difficulty distribution */}
                <div className="bg-card/80 border border-border rounded-xl p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Difficulty Distribution</div>
                  <ResponsiveContainer width="100%" height={130}>
                    <BarChart data={diffData} margin={{ left: -20, bottom: 0 }}>
                      <XAxis dataKey="diff" tick={{ fontSize: 10, fill: "#888" }} />
                      <YAxis tick={{ fontSize: 10, fill: "#888" }} />
                      <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #333", fontSize: 12 }} />
                      <Bar dataKey="count" fill="#dc143c" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Attack funnel */}
                <div className="bg-card/80 border border-border rounded-xl p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Engagement Funnel</div>
                  <div className="space-y-2">
                    {funnelStages.map(stage => (
                      <div key={stage.label} className="space-y-0.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{stage.label}</span>
                          <span className="font-medium">{stage.value.toLocaleString()} <span className="text-muted-foreground">({stage.pct}%)</span></span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div className="h-full rounded-full" style={{ background: stage.color }}
                            initial={{ width: 0 }} animate={{ width: `${stage.pct}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })()}

          {campaignsLoading ? (
            <div className="flex justify-center py-12"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>
          ) : campaignsData?.campaigns?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No campaigns yet. Create your first campaign.</div>
          ) : (
            <div className="space-y-3">
              {campaignsData?.campaigns?.map((c, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-card/80 border border-border rounded-xl p-5 backdrop-blur-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="font-semibold">{c.name}</div>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[c.status] ?? STATUS_COLORS.draft}`}>{c.status}</span>
                        <span className="text-xs text-muted-foreground">Difficulty {c.difficulty}/5</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {TYPE_ICONS[c.templateType ?? "email"] ?? "✉️"} {c.templateName ?? "No template"} &bull; {c.totalTargeted} targeted
                        {c.scheduledAt && ` &bull; ${new Date(c.scheduledAt).toLocaleDateString()}`}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {c.status === "draft" && (
                        <Button size="sm" className="h-7 text-xs" onClick={() => handleLaunch(c.id)}>Launch</Button>
                      )}
                      {(c.status === "active" || c.status === "completed") && (
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedCampaignId(selectedCampaignId === c.id ? null : c.id)}>
                          {selectedCampaignId === c.id ? "Hide Results" : "View Results"}
                        </Button>
                      )}
                    </div>
                  </div>
                  <AnimatePresence>
                    {selectedCampaignId === c.id && campaignResults && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-border/50 overflow-hidden">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Employee Results</div>
                        <div className="space-y-2">
                          {campaignResults.results.slice(0, 5).map((r: any) => (
                            <div key={r.id} className="flex items-center gap-3 text-xs">
                              <div className="w-28 truncate font-medium">{r.firstName} {r.lastName}</div>
                              <div className="flex gap-2">
                                {r.openedAt && <span className="text-yellow-400">Opened</span>}
                                {r.clickedAt && <span className="text-red-400">Clicked</span>}
                                {r.credentialSubmittedAt && <span className="text-red-500">Submitted</span>}
                                {r.reportedAt && <span className="text-emerald-400">Reported ✓</span>}
                                {!r.openedAt && !r.clickedAt && !r.reportedAt && <span className="text-muted-foreground">No action</span>}
                              </div>
                            </div>
                          ))}
                          {campaignResults.total > 5 && <div className="text-xs text-muted-foreground">+{campaignResults.total - 5} more results</div>}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TEMPLATES TAB ─────────────────────────────── */}
      {tab === "templates" && (
        <div className="space-y-4">
          {showBuilder && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card/80 border border-primary/30 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Campaign Builder — Step {builderStep} of 4</div>
                <div className="flex gap-1">
                  {[1,2,3,4].map(s => <div key={s} className={`w-2 h-2 rounded-full ${s <= builderStep ? "bg-primary" : "bg-muted"}`} />)}
                </div>
              </div>

              {/* Step 1: Select template */}
              {builderStep === 1 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-3">Select a phishing template for this campaign:</div>
                  <div className="text-xs text-muted-foreground">Browse templates below and click "Select for Campaign"</div>
                  {selectedTemplateId && (
                    <div className="mt-3 p-3 bg-primary/10 border border-primary/30 rounded-lg text-sm">
                      ✓ Template #{selectedTemplateId} selected
                      <Button size="sm" className="ml-3 h-6 text-xs" onClick={() => setBuilderStep(2)}>Next →</Button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Name + difficulty */}
              {builderStep === 2 && (
                <div className="space-y-3">
                  <div className="text-xs text-muted-foreground mb-1">Name this campaign and set difficulty:</div>
                  <Input placeholder="Campaign name (e.g. Q3 HR Invoice Attack)" value={campaignName} onChange={e => setCampaignName(e.target.value)} className="bg-muted/30" />
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-muted-foreground">Difficulty:</label>
                    {[1,2,3,4,5].map(d => (
                      <button key={d} onClick={() => setCampaignDifficulty(d)}
                        className={`w-8 h-8 rounded-full text-sm font-bold border transition-colors ${campaignDifficulty === d ? "bg-primary border-primary text-white" : "border-border text-muted-foreground"}`}
                      >{d}</button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setBuilderStep(1)}>← Back</Button>
                    <Button size="sm" onClick={() => setBuilderStep(3)} disabled={!campaignName.trim()}>Next →</Button>
                  </div>
                </div>
              )}

              {/* Step 3: Target audience + schedule */}
              {builderStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-2">Target Audience</div>
                    <div className="flex gap-2">
                      {(["all", "department"] as const).map(t => (
                        <button key={t} onClick={() => setAudienceType(t)}
                          className={`px-4 py-2 rounded-lg text-sm border transition-colors ${audienceType === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
                        >
                          {t === "all" ? "All Employees" : "By Department"}
                        </button>
                      ))}
                    </div>
                    {audienceType === "department" && (
                      <div className="mt-2 text-xs text-muted-foreground p-2 bg-muted/30 rounded">
                        Department targeting uses the campaign's <code>targetAudience.ids</code> field — set specific department IDs after creation if needed.
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-2">Schedule</div>
                    <div className="flex gap-2 mb-2">
                      {(["now", "scheduled"] as const).map(m => (
                        <button key={m} onClick={() => setScheduledMode(m)}
                          className={`px-4 py-2 rounded-lg text-sm border transition-colors ${scheduledMode === m ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
                        >
                          {m === "now" ? "Launch Immediately" : "Schedule for Later"}
                        </button>
                      ))}
                    </div>
                    {scheduledMode === "scheduled" && (
                      <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className="bg-muted/30 text-sm" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setBuilderStep(2)}>← Back</Button>
                    <Button size="sm" onClick={() => setBuilderStep(4)}>Next →</Button>
                  </div>
                </div>
              )}

              {/* Step 4: Review + Create */}
              {builderStep === 4 && (
                <div className="space-y-3">
                  <div className="text-sm font-medium">Review & Create</div>
                  <div className="bg-muted/30 rounded-lg p-4 text-sm space-y-1.5">
                    <div><span className="text-muted-foreground">Name: </span>{campaignName}</div>
                    <div><span className="text-muted-foreground">Template ID: </span>{selectedTemplateId}</div>
                    <div><span className="text-muted-foreground">Difficulty: </span>{campaignDifficulty}/5</div>
                    <div><span className="text-muted-foreground">Target: </span>{audienceType === "all" ? "All employees" : "By department"}</div>
                    <div><span className="text-muted-foreground">Schedule: </span>{scheduledMode === "now" ? "Launch immediately when activated" : scheduledAt ? new Date(scheduledAt).toLocaleString() : "Not set"}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setBuilderStep(3)}>← Back</Button>
                    <Button size="sm" onClick={handleCreateCampaign}>Create Campaign</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setShowBuilder(false); setBuilderStep(1); }}>Cancel</Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setTemplatePage(1); }}
              className="bg-muted/30 border border-border rounded-md px-3 py-2 text-sm">
              <option value="">All Types</option>
              {["email","sms","qr","login","bec","invoice","deepfake"].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={langFilter} onChange={e => { setLangFilter(e.target.value); setTemplatePage(1); }}
              className="bg-muted/30 border border-border rounded-md px-3 py-2 text-sm">
              <option value="">All Languages</option>
              <option value="en">English</option>
              <option value="ar">Arabic (عربي)</option>
            </select>
            <div className="text-sm text-muted-foreground self-center">{templatesData?.total ?? 0} templates</div>
          </div>

          {templatesLoading ? (
            <div className="flex justify-center py-12"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>
          ) : (
            <div className="space-y-2">
              {templatesData?.templates?.map((t, i) => (
                <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="bg-card/80 border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span>{TYPE_ICONS[t.type] ?? "✉️"}</span>
                        <span className="font-medium text-sm">{t.name}</span>
                        {t.language === "ar" && <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary">عربي</span>}
                        <span className="text-xs text-muted-foreground">Diff {t.difficulty}/5</span>
                      </div>
                      {t.subject && <div className="text-xs text-muted-foreground truncate">Subject: {t.subject}</div>}
                      <div className="text-xs text-muted-foreground capitalize mt-0.5">{t.category} &bull; {t.industry}</div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {showBuilder && builderStep === 1 && (
                        <Button size="sm" className="h-7 text-xs" onClick={() => setSelectedTemplateId(t.id)}>
                          {selectedTemplateId === t.id ? "✓ Selected" : "Select for Campaign"}
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 justify-center">
            <Button variant="ghost" size="sm" onClick={() => setTemplatePage(p => Math.max(1, p - 1))} disabled={templatePage === 1}>← Prev</Button>
            <span className="text-sm text-muted-foreground">Page {templatePage} of {Math.ceil((templatesData?.total ?? 0) / 20)}</span>
            <Button variant="ghost" size="sm" onClick={() => setTemplatePage(p => p + 1)} disabled={templatePage >= Math.ceil((templatesData?.total ?? 0) / 20)}>Next →</Button>
          </div>
        </div>
      )}

      {/* ── AI GENERATOR TAB ─────────────────────────── */}
      {tab === "generator" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card/80 border border-border rounded-xl p-5 space-y-4">
            <div className="text-sm font-semibold">AI Phishing Generator</div>
            <p className="text-xs text-muted-foreground">Generate realistic phishing content tailored to your target audience and attack scenario.</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Target Industry</label>
                <select value={genIndustry} onChange={e => setGenIndustry(e.target.value)}
                  className="w-full bg-muted/30 border border-border rounded-md px-3 py-2 text-sm">
                  {["finance","government","healthcare","technology","retail","energy","telecom"].map(i => (
                    <option key={i} value={i} className="capitalize">{i.charAt(0).toUpperCase() + i.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Attack Type</label>
                <select value={genType} onChange={e => setGenType(e.target.value)}
                  className="w-full bg-muted/30 border border-border rounded-md px-3 py-2 text-sm">
                  <option value="email">Email Phishing</option>
                  <option value="sms">SMS Phishing</option>
                  <option value="invoice">Invoice Fraud</option>
                  <option value="bec">Business Email Compromise</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Difficulty (1–5)</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(d => (
                    <button key={d} onClick={() => setGenDifficulty(d)}
                      className={`flex-1 py-2 rounded-md text-sm font-bold border transition-colors ${genDifficulty === d ? "bg-primary border-primary text-white" : "border-border text-muted-foreground hover:border-primary/50"}`}
                    >{d}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Language</label>
                <div className="flex gap-2">
                  {[{ v: "en", l: "English" }, { v: "ar", l: "العربية" }].map(opt => (
                    <button key={opt.v} onClick={() => setGenLang(opt.v)}
                      className={`flex-1 py-2 rounded-md text-sm border transition-colors ${genLang === opt.v ? "bg-primary border-primary text-white" : "border-border text-muted-foreground"}`}
                    >{opt.l}</button>
                  ))}
                </div>
              </div>
              <Button onClick={handleGenerate} disabled={generating} className="w-full">
                {generating ? "Generating..." : "Generate Phishing Content"}
              </Button>
            </div>
          </motion.div>

          {genResult ? (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="bg-card/80 border border-primary/30 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-primary">Generated Content</div>
                <div className="text-xs text-muted-foreground">Difficulty {genResult.difficultyScore}/5</div>
              </div>
              {genResult.subject && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Subject Line</div>
                  <div className="bg-muted/30 rounded-lg p-3 text-sm font-medium">{genResult.subject}</div>
                </div>
              )}
              <div>
                <div className="text-xs text-muted-foreground mb-1">Message Body</div>
                <div className={`bg-muted/30 rounded-lg p-3 text-sm whitespace-pre-line max-h-48 overflow-auto ${genResult.language === "ar" ? "text-right" : ""}`}
                  dir={genResult.language === "ar" ? "rtl" : "ltr"}>
                  {genResult.body}
                </div>
              </div>
              {genResult.attachmentDesc && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Attachment</div>
                  <div className="bg-muted/30 rounded-lg p-3 text-sm">{genResult.attachmentDesc}</div>
                </div>
              )}
              <div>
                <div className="text-xs text-muted-foreground mb-2">Detection Tips</div>
                <ul className="space-y-1">
                  {genResult.detectionTips?.map((tip: string, i: number) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-2">
                      <span className="text-emerald-400 shrink-0">◈</span>{tip}
                    </li>
                  ))}
                </ul>
              </div>
              <Button size="sm" variant="ghost" className="w-full text-xs" onClick={() => {
                navigator.clipboard.writeText(genResult.body);
              }}>Copy Body</Button>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center text-muted-foreground bg-card/40 border border-border/50 rounded-xl">
              <div className="font-medium">AI-Generated Preview</div>
              <div className="text-sm mt-1">Configure the options and click generate</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
