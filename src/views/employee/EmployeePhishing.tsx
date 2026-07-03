import { motion } from "framer-motion";
import { useGetMyPhishingResults } from "@workspace/api-client-react";
import { useI18n } from "@/lib/i18n";

function phishingCopy(lang: "en" | "ar") {
  return lang === "ar"
    ? {
        reported: "تم الإبلاغ ✓",
        credentialsGiven: "تم إدخال بيانات الدخول",
        clickedLink: "تم النقر على الرابط",
        noAction: "لا يوجد إجراء",
        emailPhishing: "تصيد عبر البريد",
        smsPhishing: "تصيد عبر الرسائل",
        qrCode: "رمز QR",
        fakeLogin: "تسجيل دخول مزيف",
        bec: "احتيال بريد الأعمال",
        invoiceFraud: "احتيال الفواتير",
        deepfake: "تزييف عميق",
        title: "نتائج محاكاة التصيد",
        sub: "سجلك الشخصي من محاكاة التوعية الأمنية",
        totalSimulations: "إجمالي المحاكاة",
        safetyRate: "معدل السلامة",
        phishingClicked: "نقرات التصيد",
        threatsReported: "التهديدات المبلغ عنها",
        resistanceScore: "درجة مقاومة التصيد",
        vulnerable: "عرضة للخطر",
        average: "متوسط",
        vigilant: "يقظ",
        safeTitle: "كيف تبقى آمناً",
        tips: [
          "تحقق دائماً من نطاق بريد المرسل، فالمهاجمون يستخدمون نطاقات مشابهة.",
          "مرر المؤشر فوق الروابط قبل النقر لمعرفة الوجهة الحقيقية.",
          "انتبه للغة العاجلة التي تطلب إجراءً فورياً.",
          "لا تدخل بيانات الدخول من رابط بريد إلكتروني، وانتقل مباشرة إلى الموقع الرسمي.",
          "عند الشك، أبلغ عن الرسائل المشبوهة باستخدام زر الإبلاغ عن التصيد.",
        ],
        history: "سجل المحاكاة",
        simulation: "محاكاة أمنية",
        difficulty: "الصعوبة",
        noSimulations: "لا توجد محاكاة تصيد بعد",
        noSimulationsSub: "ستظهر النتائج هنا بعد إطلاق أول محاكاة من فريق الإدارة.",
      }
    : {
        reported: "Reported ✓",
        credentialsGiven: "Credentials Given",
        clickedLink: "Clicked Link",
        noAction: "No Action",
        emailPhishing: "Email Phishing",
        smsPhishing: "SMS Phishing",
        qrCode: "QR Code",
        fakeLogin: "Fake Login",
        bec: "Business Email Compromise",
        invoiceFraud: "Invoice Fraud",
        deepfake: "Deepfake",
        title: "Phishing Simulation Results",
        sub: "Your personal history from security awareness simulations",
        totalSimulations: "Total Simulations",
        safetyRate: "Safety Rate",
        phishingClicked: "Phishing Clicked",
        threatsReported: "Threats Reported",
        resistanceScore: "Phishing Resistance Score",
        vulnerable: "Vulnerable",
        average: "Average",
        vigilant: "Vigilant",
        safeTitle: "How to Stay Safe",
        tips: [
          "Always verify the sender email domain — attackers use lookalike domains",
          "Hover over links before clicking to inspect the real destination URL",
          "Be suspicious of urgent language demanding immediate action",
          "Never enter credentials from an email link — go directly to the official site",
          "When in doubt, report suspicious emails using the Report Phishing button",
        ],
        history: "Simulation History",
        simulation: "Security Simulation",
        difficulty: "Difficulty",
        noSimulations: "No phishing simulations yet",
        noSimulationsSub: "Results will appear here once your first simulation is launched by the admin team.",
      };
}

function StatusPill({
  clicked,
  reported,
  submitted,
  copy,
}: {
  clicked: boolean;
  reported: boolean;
  submitted: boolean;
  copy: ReturnType<typeof phishingCopy>;
}) {
  if (reported) return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">{copy.reported}</span>;
  if (submitted) return <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">{copy.credentialsGiven}</span>;
  if (clicked) return <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">{copy.clickedLink}</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground border border-border">{copy.noAction}</span>;
}

function typeLabels(copy: ReturnType<typeof phishingCopy>) {
  return {
    email: copy.emailPhishing,
    sms: copy.smsPhishing,
    qr: copy.qrCode,
    login: copy.fakeLogin,
    bec: copy.bec,
    invoice: copy.invoiceFraud,
    deepfake: copy.deepfake,
  };
}

export default function EmployeePhishing() {
  const { data, isLoading } = useGetMyPhishingResults();
  const { lang, isRTL } = useI18n();
  const copy = phishingCopy(lang);
  const labels = typeLabels(copy);

  const summary = data?.summary;

  const safeRate = summary ? Math.round(100 - (summary.clickRate ?? 0)) : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <h2 className="text-xl font-bold mb-1">{copy.title}</h2>
        <p className="text-sm text-muted-foreground">{copy.sub}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: copy.totalSimulations, value: summary?.totalSent ?? 0, color: "text-foreground" },
          { label: copy.safetyRate, value: safeRate !== null ? `${safeRate}%` : "—", color: safeRate !== null && safeRate >= 70 ? "text-emerald-400" : "text-orange-400" },
          { label: copy.phishingClicked, value: summary?.clicked ?? 0, color: "text-orange-400" },
          { label: copy.threatsReported, value: summary?.reported ?? 0, color: "text-emerald-400" },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card/80 border border-border rounded-xl p-5 backdrop-blur-sm"
          >
            <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">{card.label}</div>
            <div className={`text-3xl font-bold ${card.color}`}>{card.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Safety score bar */}
      {safeRate !== null && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card/80 border border-border rounded-xl p-5 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium">{copy.resistanceScore}</div>
            <div className={`text-lg font-bold ${safeRate >= 80 ? "text-emerald-400" : safeRate >= 60 ? "text-yellow-400" : "text-red-400"}`}>{safeRate}%</div>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${safeRate >= 80 ? "bg-emerald-500" : safeRate >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
              initial={{ width: 0 }}
              animate={{ width: `${safeRate}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{copy.vulnerable}</span><span>{copy.average}</span><span>{copy.vigilant}</span>
          </div>
        </motion.div>
      )}

      {/* Training tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-primary/5 border border-primary/20 rounded-xl p-5"
      >
        <div className="text-sm font-semibold text-primary mb-3">{copy.safeTitle}</div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {copy.tips.map((tip) => (
            <li key={tip} className="flex gap-2"><span className="text-primary">◈</span>{tip}</li>
          ))}
        </ul>
      </motion.div>

      {/* Results history table */}
      {data?.results && data.results.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card/80 border border-border rounded-xl overflow-hidden"
        >
          <div className="p-4 border-b border-border">
            <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{copy.history}</div>
          </div>
          <div className="divide-y divide-border/50">
            {data.results.map((r, i) => (
              (() => {
                const templateType = (r.templateType ?? "email") as keyof typeof labels;
                return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.04 }}
                className="px-5 py-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{r.campaignName ?? copy.simulation}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {labels[templateType] ?? copy.emailPhishing} &bull; {copy.difficulty} {r.campaignDifficulty ?? 3}/5 &bull; {new Date(r.sentAt).toLocaleDateString()}
                  </div>
                </div>
                <StatusPill
                  clicked={!!r.clickedAt}
                  reported={!!r.reportedAt}
                  submitted={!!r.credentialSubmittedAt}
                  copy={copy}
                />
              </motion.div>
                );
              })()
            ))}
          </div>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[200px] text-center text-muted-foreground">
          <div className="font-medium">{copy.noSimulations}</div>
          <div className="text-sm mt-1">{copy.noSimulationsSub}</div>
        </div>
      )}
    </div>
  );
}
