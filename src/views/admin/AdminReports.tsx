import { useState } from "react";
import { motion } from "framer-motion";
import { useListReports, useGenerateReport, useListDepartments } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";

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
  const { lang, isRTL } = useI18n();

  const { data: reports, isLoading } = useListReports({ limit: 20 });
  const { data: departments } = useListDepartments();
  const generateReport = useGenerateReport();

  const copy = lang === "ar"
    ? {
        title: "التقارير",
        sub: "أنشئ وحمّل تقارير الامتثال والمخاطر والتشغيل",
        generate: "إنشاء تقرير جديد",
        dateRange: "النطاق الزمني",
        from: "من",
        to: "إلى",
        departmentFilter: "تصفية القسم",
        allDepartments: "كل الأقسام",
        exportFormat: "صيغة التصدير",
        generating: "جارٍ الإنشاء...",
        reportFilters: "مرشحات التقرير",
        recentReports: "أحدث التقارير",
        noReports: "لا توجد تقارير بعد",
        report: "تقرير",
        employeeReport: "تقرير الموظفين",
        employeeDesc: "درجات المخاطر لكل موظف وتقدم التعلم ونتائج التصيد",
        departmentReport: "تقرير الأقسام",
        departmentDesc: "تجميع ومقارنة المخاطر على مستوى القسم",
        riskReport: "تقرير المخاطر",
        riskDesc: "تحليل شامل لمشهد التهديدات والثغرات في المؤسسة",
        complianceReport: "تقرير الامتثال",
        complianceDesc: "حالة الامتثال التنظيمي ومعدلات إتمام التدريب",
        executiveReport: "التقرير التنفيذي",
        executiveDesc: "ملخص تنفيذي مع مؤشرات الأداء والتوصيات الاستراتيجية",
        reportGenerated: "تم إنشاء التقرير",
        reportReady: "أصبح التقرير جاهزاً للتنزيل.",
        reportFailed: "فشل إنشاء التقرير",
        dateRangeLabel: "النطاق الزمني",
        department: "القسم",
        format: "الصيغة",
        allDepartmentsLower: "كل الأقسام",
        completed: "مكتمل",
        pending: "قيد الانتظار",
        failed: "فشل",
        download: "تنزيل",
        dept: "قسم",
      }
    : {
        title: "Reports",
        sub: "Generate and download compliance, risk, and operational reports",
        generate: "Generate New Report",
        dateRange: "Date Range",
        from: "From",
        to: "To",
        departmentFilter: "Department Filter",
        allDepartments: "All Departments",
        exportFormat: "Export Format",
        generating: "Generating...",
        reportFilters: "Report Filters",
        recentReports: "Recent Reports",
        noReports: "No reports generated yet",
        report: "Report",
        employeeReport: "Employee Report",
        employeeDesc: "Per-employee risk scores, training progress, and phishing results",
        departmentReport: "Department Report",
        departmentDesc: "Department-level risk aggregation and comparison",
        riskReport: "Risk Report",
        riskDesc: "Organization-wide threat landscape and vulnerability analysis",
        complianceReport: "Compliance Report",
        complianceDesc: "Regulatory compliance status and training completion rates",
        executiveReport: "Executive Report",
        executiveDesc: "C-suite summary with KPIs and strategic recommendations",
        reportGenerated: "Report generated!",
        reportReady: "report is ready to download.",
        reportFailed: "Failed to generate report",
        dateRangeLabel: "Date range",
        department: "Department",
        format: "Format",
        allDepartmentsLower: "All departments",
        completed: "completed",
        pending: "pending",
        failed: "failed",
        download: "Download",
        dept: "Dept",
      };

  const reportTypes = [
    { value: "employee", label: copy.employeeReport, desc: copy.employeeDesc, icon: "EMP" },
    { value: "department", label: copy.departmentReport, desc: copy.departmentDesc, icon: "DEPT" },
    { value: "risk", label: copy.riskReport, desc: copy.riskDesc, icon: "RISK" },
    { value: "compliance", label: copy.complianceReport, desc: copy.complianceDesc, icon: "COMP" },
    { value: "executive", label: copy.executiveReport, desc: copy.executiveDesc, icon: "EXEC" },
  ];

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
      toast({ title: copy.reportGenerated, description: `${selectedType} ${copy.reportReady}` });
    } catch {
      toast({ title: copy.reportFailed, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <h2 className="text-xl font-bold">{copy.title}</h2>
        <p className="text-sm text-muted-foreground">{copy.sub}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 rounded-xl border border-border bg-card/80 p-5"
        >
          <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{copy.generate}</div>

          <div className="space-y-2">
            {reportTypes.map((rt) => (
              <button
                key={rt.value}
                onClick={() => setSelectedType(rt.value)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  selectedType === rt.value ? "border-primary/50 bg-primary/10" : "border-border hover:border-primary/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">{rt.icon}</span>
                  <div>
                    <div className="text-sm font-medium">{rt.label}</div>
                    <div className="text-xs text-muted-foreground">{rt.desc}</div>
                  </div>
                  {selectedType === rt.value && <div className="ml-auto text-primary">◈</div>}
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{copy.dateRange}</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">{copy.from}</label>
                <Input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange((d) => ({ ...d, from: e.target.value }))}
                  className="bg-muted/30 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">{copy.to}</label>
                <Input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange((d) => ({ ...d, to: e.target.value }))}
                  className="bg-muted/30 text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">{copy.departmentFilter}</div>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
            >
              <option value="">{copy.allDepartments}</option>
              {departments?.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">{copy.exportFormat}</div>
            <div className="flex gap-2">
              {FORMAT_OPTIONS.map((f) => (
                <button
                  key={f}
                  onClick={() => setSelectedFormat(f)}
                  className={`flex-1 rounded-md border py-2 text-sm font-bold uppercase transition-colors ${
                    selectedFormat === f ? "border-primary bg-primary text-white" : "border-border text-muted-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={generating} className="w-full">
            {generating ? copy.generating : `${copy.generate} ${reportTypes.find((type) => type.value === selectedType)?.label ?? ""}`}
          </Button>

          <div className="space-y-1 rounded-lg border border-border/50 bg-muted/10 p-3 text-xs text-muted-foreground">
            <div className="font-medium text-foreground">{copy.reportFilters}</div>
            <div>
              • {copy.dateRangeLabel}: <span className="text-foreground">{dateRange.from} → {dateRange.to}</span>
            </div>
            <div>
              • {copy.department}:{" "}
              <span className="text-foreground">
                {departmentId ? departments?.find((d: any) => String(d.id) === departmentId)?.name ?? "—" : copy.allDepartmentsLower}
              </span>
            </div>
            <div>
              • {copy.format}: <span className="uppercase text-foreground">{selectedFormat}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card/80 p-5"
        >
          <div className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{copy.recentReports}</div>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : !reports || reports.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">{copy.noReports}</div>
          ) : (
            <div className="space-y-3">
              {reports.map((r: any, i: number) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center justify-between gap-3 border-b border-border/40 py-2 last:border-0"
                >
                  <div>
                    <div className="text-sm font-medium capitalize">
                      {r.type} {copy.report}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {r.format?.toUpperCase()} &bull; {new Date(r.createdAt).toLocaleDateString()}
                      {r.filters?.departmentId && <span className="ml-1">&bull; {copy.dept} #{r.filters.departmentId}</span>}
                      {r.filters?.dateFrom && <span className="ml-1">&bull; {r.filters.dateFrom}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs ${STATUS_COLORS[r.status] ?? "text-muted-foreground"}`}>
                      {r.status === "completed" ? copy.completed : r.status === "pending" ? copy.pending : copy.failed}
                    </span>
                    {r.status === "completed" && (
                      <a href={r.fileUrl ?? "#"} download className="flex items-center gap-1 text-xs text-primary hover:underline">
                        ⬇️ {copy.download}
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
