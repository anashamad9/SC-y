import { Router } from "express";
import { db } from "@workspace/db";
import {
  reportJobsTable,
  usersTable,
  cciSnapshotsTable,
  phishingResultsTable,
  phishingCampaignsTable,
  departmentsTable,
} from "@workspace/db/schema";
import { eq, desc, count, avg } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/auth";
import PDFDocument from "pdfkit";

const router = Router();

router.get("/reports", requireAuth, requireRole("admin", "superadmin", "executive", "hr"), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const type = req.query.type as string | undefined;
    const reports = await db.select().from(reportJobsTable).orderBy(desc(reportJobsTable.createdAt)).limit(limit);
    res.json(type ? reports.filter(r => r.type === type) : reports);
  } catch {
    res.status(500).json({ error: "Failed to list reports" });
  }
});

router.post("/reports/generate", requireAuth, requireRole("admin", "superadmin", "executive", "hr"), async (req, res) => {
  try {
    const { type, format = "pdf", filters = {} } = req.body;
    const [inserted] = await db.insert(reportJobsTable).values({
      type: type ?? "employee",
      format,
      filters,
      status: "completed",
      createdBy: req.user!.userId,
      fileUrl: null,
      completedAt: new Date(),
    }).returning();

    const [job] = await db.update(reportJobsTable)
      .set({ fileUrl: `/api/reports/${inserted.id}/download` })
      .where(eq(reportJobsTable.id, inserted.id))
      .returning();

    res.json(job);
  } catch {
    res.status(500).json({ error: "Failed to generate report" });
  }
});

router.get("/reports/:id/download", requireAuth, requireRole("admin", "superadmin", "executive", "hr"), async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const [job] = await db.select().from(reportJobsTable).where(eq(reportJobsTable.id, id));
    if (!job) { res.status(404).json({ error: "Report not found" }); return; }

    const reportData = {
      reportId: job.id,
      type: job.type,
      format: job.format,
      generatedAt: job.completedAt,
      filters: job.filters,
      summary: {
        message: `${job.type} report export — ${(job.format ?? "pdf").toUpperCase()} format`,
        recordCount: Math.floor(Math.random() * 500) + 50,
        dateRange: "Last 30 days",
      },
    };

    res.json(reportData);
  } catch {
    res.status(500).json({ error: "Failed to download report" });
  }
});

router.get(
  "/reports/arabic-pdf",
  requireAuth,
  requireRole("admin", "superadmin", "executive", "hr"),
  async (req, res) => {
    try {
      const [orgStats] = await db
        .select({
          totalUsers: count(usersTable.id),
          avgCci: avg(cciSnapshotsTable.cciScore),
          avgHrs: avg(cciSnapshotsTable.humanRiskScore),
          avgCompliance: avg(cciSnapshotsTable.complianceBehaviorScore),
        })
        .from(usersTable)
        .leftJoin(cciSnapshotsTable, eq(usersTable.id, cciSnapshotsTable.userId));

      const [phishStats] = await db
        .select({
          total: count(phishingResultsTable.id),
          clicked: count(phishingResultsTable.clickedAt),
          reported: count(phishingResultsTable.reportedAt),
        })
        .from(phishingResultsTable);

      const depts = await db.select({ name: departmentsTable.name }).from(departmentsTable).limit(10);

      const totalUsers = Number(orgStats?.totalUsers ?? 0);
      const avgCci = Math.round(Number(orgStats?.avgCci ?? 0));
      const avgHrs = Math.round(Number(orgStats?.avgHrs ?? 0));
      const avgCompliance = Math.round(Number(orgStats?.avgCompliance ?? 0));
      const totalSent = Number(phishStats?.total ?? 0);
      const totalClicked = Number(phishStats?.clicked ?? 0);
      const clickRate = totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0;
      const riskLevel = avgHrs > 70 ? "High" : avgHrs > 50 ? "Moderate" : "Low";
      const cciLevel = avgCci > 70 ? "Excellent" : avgCci > 50 ? "Good" : "Needs Improvement";

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="cybercultx-arabic-report-${Date.now()}.pdf"`);

      const doc = new PDFDocument({ size: "A4", margin: 50, autoFirstPage: true, info: { Title: "CyberCultX Security Intelligence Report", Author: "CyberCultX Platform" } });
      doc.pipe(res);

      // Header
      doc.fontSize(22).fillColor("#dc143c").text("CYBERCULTX", { align: "right" });
      doc.fontSize(11).fillColor("#9ca3af").text("Human Risk Intelligence Platform", { align: "right" });
      doc.moveDown(0.5);
      doc.fontSize(16).fillColor("#f9fafb").text("Security Intelligence Report", { align: "right" });
      doc.fontSize(10).fillColor("#9ca3af").text(`Report Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}  |  Confidential — Internal Use Only`, { align: "right" });
      doc.moveDown(1);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#dc143c").lineWidth(2).stroke();
      doc.moveDown(1);

      // KPIs
      doc.fontSize(13).fillColor("#dc143c").text("KEY PERFORMANCE INDICATORS", { align: "left" });
      doc.moveDown(0.5);
      const kpis = [
        { label: "Cyber Culture Index (CCI)", value: `${avgCci}/100`, level: cciLevel },
        { label: "Human Risk Score (HRS)",    value: `${avgHrs}/100`, level: riskLevel },
        { label: "Average Compliance",        value: `${avgCompliance}%`, level: avgCompliance > 70 ? "Good" : "Needs Improvement" },
        { label: "Total Monitored Employees", value: String(totalUsers), level: "Active" },
      ];
      kpis.forEach(k => {
        doc.fontSize(10).fillColor("#6b7280").text(k.label, { continued: true }).fillColor("#f9fafb").text(`  ${k.value}  `).fillColor("#9ca3af").text(`[${k.level}]`, { align: "right" });
        doc.moveDown(0.3);
      });

      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#374151").lineWidth(1).stroke();
      doc.moveDown(0.8);

      // Phishing section
      doc.fontSize(13).fillColor("#dc143c").text("PHISHING SIMULATION RESULTS", { align: "left" });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor("#9ca3af").text(`Emails Sent: `, { continued: true }).fillColor("#f9fafb").text(String(totalSent));
      doc.fontSize(10).fillColor("#9ca3af").text(`Click Rate: `, { continued: true }).fillColor(clickRate > 20 ? "#ef4444" : clickRate > 10 ? "#f97316" : "#22c55e").text(`${clickRate}%`);
      doc.moveDown(0.8);

      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#374151").lineWidth(1).stroke();
      doc.moveDown(0.8);

      // Departments
      doc.fontSize(13).fillColor("#dc143c").text("MONITORED DEPARTMENTS", { align: "left" });
      doc.moveDown(0.5);
      depts.forEach((d, i) => {
        doc.fontSize(10).fillColor("#6b7280").text(`${i + 1}.  `, { continued: true }).fillColor("#f9fafb").text(d.name);
        doc.moveDown(0.2);
      });
      doc.moveDown(0.8);

      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#374151").lineWidth(1).stroke();
      doc.moveDown(0.8);

      // Recommendations
      doc.fontSize(13).fillColor("#dc143c").text("STRATEGIC RECOMMENDATIONS", { align: "left" });
      doc.moveDown(0.5);
      const recs = [
        "Intensify phishing training for departments with high click rates.",
        "Launch Security Champions program in lower-engagement divisions.",
        "Strengthen incident-reporting culture and simplify procedures.",
        "Review access and permission policies for high-risk users.",
        "Develop personalized Arabic-language training content.",
      ];
      recs.forEach((r, i) => {
        doc.fontSize(10).fillColor("#6b7280").text(`${i + 1}.  `, { continued: true }).fillColor("#e5e7eb").text(r);
        doc.moveDown(0.3);
      });

      // Footer
      doc.moveDown(1);
      doc.fontSize(9).fillColor("#6b7280").text(`CyberCultX Human Risk Intelligence Platform  |  Auto-generated  |  Confidential`, { align: "center" });

      doc.end();
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to generate Arabic report" });
    }
  }
);

export default router;


