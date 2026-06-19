import { useState } from "react";
import { motion } from "framer-motion";
import { useListReports, useGenerateReport, useListDepartments } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";

const REPORT_TYPES = [
  { value: "employee", label: "Employee Report", desc: "Per-employee risk scores, training progress, and phishing results", icon: "👤" },
  { value: "department", label: "Department Report", desc: "Department-level risk aggregation and comparison", icon: "🏢" },
  { value: "risk", label: "Risk Report", desc: "Organization-wide threat landscape and vulnerability analysis", icon: "⚠️" },
  { value: "compliance", label: "Compliance Report", desc: "Regulatory compliance status and training completion rates", icon: "✅" },
  { value: "executive", label: "Executive Report", desc: "C-suite summary with KPIs and strategic recommendations", icon: "📊" },
];

const FORMAT_OPTIONS = ["pdf", "excel", "csv"];

const STATUS_COLORS: Record<string, string> = {
  completed: "text-emerald-400",
  pending: "text-yellow-400",
  failed: "text-red-400",
};

function getDefaultDateRange() {
  const to = new Date();
  const from = new Date(to);
  from.setMonth(from.getMonth() - 3);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

export default function AdminReports() {
  const [selectedType, setSelectedType] = useState("employee");
  const [selectedFormat, setSelectedFormat] = useState("pdf");
  const [generating, setGenerating] = useState(false);
  const [dateRange, setDateRange] = useState(getDefaultDateRange);
  const [departmentId, setDepartmentId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useListReports({ limit: 20 });
  const { data: departments } = useListDepartments();
  const generateReport = useGenerateReport();

  async function handleGenerate() {
    setGenerating(true);
    try {
      const filters: Record<string, any> = {
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
      };
      if (departmentId) filters.departmentId = parseInt(departmentId);

      await generateReport.mutateAsync({
        data: { type: selectedType, format: selectedFormat, filters },
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({ title: "Report generated!", description: `${selectedType} report is ready to download.` });
    } catch {
      toast({ title: "Failed to generate report", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Reports</h2>
        <p className="text-sm text-muted-foreground">Generate and download compliance, risk, and operational reports</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generator panel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card/80 border border-border rounded-xl p-5 space-y-4">
          <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Generate New Report</div>

          <div className="space-y-2">
            {REPORT_TYPES.map(rt => (
              <button key={rt.value} onClick={() => setSelectedType(rt.value)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedType === rt.value ? "border-primary/50 bg-primary/10" : "border-border hover:border-primary/30"
                }`}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">{rt.icon}</span>
                  <div>
                    <div className="text-sm font-medium">{rt.label}</div>
                    <div className="text-xs text-muted-foreground">{rt.desc}</div>
                  </div>
                  {selectedType === rt.value && <div className="ml-auto text-primary">◈</div>}
                </div>
              </button>
            ))}
          </div>

          {/* Date range filter */}
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Date Range</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">From</label>
                <Input type="date" value={dateRange.from}
                  onChange={e => setDateRange(d => ({ ...d, from: e.target.value }))}
                  className="bg-muted/30 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">To</label>
                <Input type="date" value={dateRange.to}
                  onChange={e => setDateRange(d => ({ ...d, to: e.target.value }))}
                  className="bg-muted/30 text-sm" />
              </div>
            </div>
          </div>

          {/* Department filter */}
          <div>
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Department Filter</div>
            <select value={departmentId} onChange={e => setDepartmentId(e.target.value)}
              className="w-full bg-muted/30 border border-border rounded-md px-3 py-2 text-sm">
              <option value="">All Departments</option>
              {departments?.map((d: any) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Export Format</div>
            <div className="flex gap-2">
              {FORMAT_OPTIONS.map(f => (
                <button key={f} onClick={() => setSelectedFormat(f)}
                  className={`flex-1 py-2 rounded-md text-sm uppercase font-bold border transition-colors ${
                    selectedFormat === f ? "bg-primary border-primary text-white" : "border-border text-muted-foreground"
                  }`}
                >{f}</button>
              ))}
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={generating} className="w-full">
            {generating ? "Generating..." : `📥 Generate ${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Report`}
          </Button>

          {/* Active filter summary */}
          <div className="text-xs text-muted-foreground border border-border/50 rounded-lg p-3 space-y-1 bg-muted/10">
            <div className="font-medium text-foreground">Report Filters</div>
            <div>• Date range: <span className="text-foreground">{dateRange.from} → {dateRange.to}</span></div>
            <div>• Department: <span className="text-foreground">
              {departmentId ? departments?.find((d: any) => String(d.id) === departmentId)?.name ?? "—" : "All departments"}
            </span></div>
            <div>• Format: <span className="text-foreground uppercase">{selectedFormat}</span></div>
          </div>
        </motion.div>

        {/* Recent reports */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card/80 border border-border rounded-xl p-5">
          <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Recent Reports</div>
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" /></div>
          ) : !reports || reports.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">No reports generated yet</div>
          ) : (
            <div className="space-y-3">
              {reports.map((r: any, i: number) => (
                <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center justify-between gap-3 py-2 border-b border-border/40 last:border-0">
                  <div>
                    <div className="text-sm font-medium capitalize">{r.type} Report</div>
                    <div className="text-xs text-muted-foreground">
                      {r.format?.toUpperCase()} &bull; {new Date(r.createdAt).toLocaleDateString()}
                      {r.filters?.departmentId && <span className="ml-1">&bull; Dept #{r.filters.departmentId}</span>}
                      {r.filters?.dateFrom && <span className="ml-1">&bull; {r.filters.dateFrom}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs ${STATUS_COLORS[r.status] ?? "text-muted-foreground"}`}>{r.status}</span>
                    {r.status === "completed" && (
                      <a href={r.fileUrl ?? "#"} download
                        className="text-xs text-primary hover:underline flex items-center gap-1">
                        ⬇️ Download
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
