import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListAssessments, useGetAssessment, useSubmitAssessment } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

type Phase = "list" | "taking" | "results";

const CATEGORY_LABELS: Record<string, { en: string; ar: string }> = {
  risk_tolerance: { en: "Risk Tolerance", ar: "تحمل المخاطر" },
  impulsiveness: { en: "Impulsiveness", ar: "الاندفاعية" },
  security_awareness: { en: "Security Awareness", ar: "الوعي الأمني" },
  decision_making: { en: "Decision Making", ar: "اتخاذ القرار" },
  attention_to_detail: { en: "Attention to Detail", ar: "الانتباه للتفاصيل" },
  trust_tendencies: { en: "Trust Tendencies", ar: "ميول الثقة" },
  stress_response: { en: "Stress Response", ar: "الاستجابة للضغط" },
  compliance_behavior: { en: "Compliance Behavior", ar: "سلوك الامتثال" },
  phishing_recognition: { en: "Phishing Recognition", ar: "التعرف على التصيد" },
  password_hygiene: { en: "Password Hygiene", ar: "نظافة كلمات المرور" },
  social_engineering: { en: "Social Engineering", ar: "الهندسة الاجتماعية" },
  data_handling: { en: "Data Handling", ar: "التعامل مع البيانات" },
  incident_response: { en: "Incident Response", ar: "الاستجابة للحوادث" },
  qr_safety: { en: "QR Safety", ar: "أمان رموز QR" },
  credential_safety: { en: "Credential Safety", ar: "أمان بيانات الدخول" },
  access_control: { en: "Access Control", ar: "التحكم بالوصول" },
  device_security: { en: "Device Security", ar: "أمن الأجهزة" },
  remote_work: { en: "Remote Work Security", ar: "أمن العمل عن بعد" },
  cloud_security: { en: "Cloud Security", ar: "الأمن السحابي" },
};

const RISKY = new Set(["risk_tolerance", "impulsiveness", "trust_tendencies"]);

function scoreColor(category: string, score: number) {
  if (RISKY.has(category)) return score > 65 ? "#ef4444" : score > 45 ? "#f97316" : "#22c55e";
  return score > 65 ? "#22c55e" : score > 45 ? "#f97316" : "#ef4444";
}

function ScoreBar({ category, score, lang }: { category: string; score: number; lang: "en" | "ar" }) {
  const color = scoreColor(category, score);
  const label = CATEGORY_LABELS[category]?.[lang] ?? category;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono" style={{ color }}>{Math.round(score)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function EmployeeAssessments() {
  const [phase, setPhase] = useState<Phase>("list");
  const [activeId, setActiveId] = useState<number | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [startTime, setStartTime] = useState<number>(0);
  const [resultData, setResultData] = useState<any>(null);
  const { lang, isRTL } = useI18n();

  const queryClient = useQueryClient();
  const { data: assessments, isLoading } = useListAssessments();
  const { data: activeAssessment } = useGetAssessment(activeId ?? 0);
  const submitMutation = useSubmitAssessment();

  const copy = lang === "ar"
    ? {
        complete: "اكتمل التقييم",
        overall: "النتيجة الإجمالية",
        back: "العودة إلى التقييمات",
        earned: "تم كسب",
        question: "السؤال",
        category: "الفئة",
        previous: "السابق",
        submit: "إرسال التقييم",
        submitting: "جارٍ الإرسال…",
        next: "التالي",
        cancel: "إلغاء التقييم",
        title: "التقييمات الأمنية",
        sub: "أكمل التقييمات لبناء ملفك السلوكي وتحسين درجة المخاطر البشرية.",
        completed: "مكتمل",
        pending: "قيد الانتظار",
        questions: "أسئلة",
        last: "آخر مرة",
        start: "الدخول إلى التقييم",
        infoTitle: "كيف تؤثر التقييمات على درجتك",
        infoBody: "يعتمد النظام الآن على التقييم النفسي فقط لحساب الملف السلوكي ودرجة الجاهزية، ثم يوصي بالدورات المناسبة بعد الإكمال.",
      }
    : {
        complete: "Assessment Complete",
        overall: "Overall Score",
        back: "Back to Assessments",
        earned: "XP earned",
        question: "Question",
        category: "Category",
        previous: "Previous",
        submit: "Submit Assessment",
        submitting: "Submitting…",
        next: "Next",
        cancel: "Cancel Assessment",
        title: "Security Assessments",
        sub: "Complete assessments to build your behavioral profile and improve your Human Risk Score.",
        completed: "Completed",
        pending: "Pending",
        questions: "questions",
        last: "Last",
        start: "Enter Assessment",
        infoTitle: "How Assessments Affect Your Score",
        infoBody: "The platform now relies on the psychometric assessment to calculate the behavioral profile and readiness score, then recommends the right courses after completion.",
      };

  const questions = activeAssessment?.questions ?? [];
  const question = questions[currentQ];
  const progress = questions.length > 0 ? (currentQ / questions.length) * 100 : 0;

  function startAssessment(id: number) {
    setActiveId(id);
    setCurrentQ(0);
    setAnswers({});
    setStartTime(Date.now());
    setPhase("taking");
  }

  function selectOption(value: number) {
    if (!question) return;
    setAnswers((prev) => ({ ...prev, [String(question.id)]: value }));
  }

  function goNext() {
    if (currentQ < questions.length - 1) {
      setCurrentQ((q) => q + 1);
      return;
    }
    handleSubmit();
  }

  function goPrev() {
    setCurrentQ((q) => Math.max(0, q - 1));
  }

  function handleSubmit() {
    if (!activeId) return;
    const timeTakenSec = Math.round((Date.now() - startTime) / 1000);
    submitMutation.mutate(
      { id: activeId, data: { answers, timeTakenSec } },
      {
        onSuccess: (data) => {
          setResultData(data);
          setPhase("results");
          queryClient.invalidateQueries({ queryKey: ["listAssessments"] });
          queryClient.invalidateQueries({ queryKey: ["getMyScores"] });
          queryClient.invalidateQueries({ queryKey: ["getMyGamification"] });
        },
      },
    );
  }

  function reset() {
    setPhase("list");
    setActiveId(null);
    setResultData(null);
    setCurrentQ(0);
    setAnswers({});
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => <div key={i} className="h-40 rounded-xl border border-border bg-card/50 animate-pulse" />)}
      </div>
    );
  }

  if (phase === "results" && resultData) {
    const assessment = assessments?.find((a) => a.id === activeId);
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5" dir={isRTL ? "rtl" : "ltr"}>
        <div className="rounded-xl border border-border bg-card/80 p-6 backdrop-blur-sm">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <div className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">{copy.complete}</div>
              <h2 className="text-lg font-bold">{assessment?.title}</h2>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold font-mono text-primary">{Math.round(resultData.overallScore)}</div>
              <div className="text-xs text-muted-foreground">{copy.overall}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {resultData.categoryScores?.map((cs: any) => (
              <ScoreBar key={cs.category} category={cs.category} score={cs.score} lang={lang} />
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <Button onClick={reset} className="bg-primary text-white hover:bg-primary/80">
              {isRTL ? `${copy.back} →` : `← ${copy.back}`}
            </Button>
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <span>✓</span>
              <span>+{50 + Math.round(resultData.overallScore * 0.5)} {copy.earned}</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (phase === "taking" && activeAssessment) {
    const selectedValue = question ? answers[String(question.id)] : undefined;
    const isLast = currentQ === questions.length - 1;

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-2xl space-y-5" dir={isRTL ? "rtl" : "ltr"}>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">{activeAssessment.title}</div>
            <div className="text-xs text-muted-foreground">{copy.question} {currentQ + 1} / {questions.length}</div>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
            <motion.div animate={{ width: `${progress}%` }} className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary" transition={{ duration: 0.3 }} />
          </div>
          {question && (
            <div className="mt-1 text-xs capitalize text-muted-foreground">
              {copy.category}: {CATEGORY_LABELS[question.category]?.[lang] ?? question.category}
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {question && (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="rounded-xl border border-border bg-card/80 p-6 backdrop-blur-sm"
            >
              <p className="mb-6 text-base font-medium leading-relaxed">{question.text}</p>
              <div className="space-y-3">
                {(question.options as any[]).map((opt: any) => (
                  <button
                    key={opt.value}
                    onClick={() => selectOption(opt.value)}
                    className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-all duration-200 ${
                      selectedValue === opt.value
                        ? "border-primary bg-primary/20 text-primary"
                        : "border-border bg-white/3 text-foreground hover:border-white/30 hover:bg-white/5"
                    }`}
                  >
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs shrink-0 ${isRTL ? "ml-3" : "mr-3"} ${
                      selectedValue === opt.value ? "border-primary bg-primary text-white" : "border-muted-foreground"
                    }`}>
                      {selectedValue === opt.value ? "✓" : ""}
                    </span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={goPrev} disabled={currentQ === 0} className="text-muted-foreground">
            {isRTL ? `${copy.previous} →` : `← ${copy.previous}`}
          </Button>
          <div className="flex gap-1">
            {questions.slice(0, Math.min(questions.length, 12)).map((_, i) => (
              <div key={i} className={`h-2 w-2 rounded-full transition-colors ${i < currentQ ? "bg-primary" : i === currentQ ? "bg-primary/60" : "bg-white/10"}`} />
            ))}
            {questions.length > 12 && <div className="text-xs text-muted-foreground">…</div>}
          </div>
          <Button onClick={goNext} disabled={selectedValue === undefined || submitMutation.isPending} className="bg-primary text-white hover:bg-primary/80 disabled:opacity-40">
            {submitMutation.isPending ? copy.submitting : isLast ? copy.submit : isRTL ? `← ${copy.next}` : `${copy.next} →`}
          </Button>
        </div>

        <div className="text-center">
          <button onClick={reset} className="text-xs text-muted-foreground underline transition-colors hover:text-foreground">
            {copy.cancel}
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-5" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <h2 className="mb-1 text-lg font-bold">{copy.title}</h2>
        <p className="text-sm text-muted-foreground">{copy.sub}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {(assessments ?? []).map((assessment: any, i: number) => (
          <motion.div
            key={assessment.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex flex-col rounded-xl border border-border bg-card/80 p-5 backdrop-blur-sm"
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-[11px] font-semibold uppercase tracking-wider text-primary">
                {assessment.type === "psychometric" ? "PSY" : "TASK"}
              </div>
              <span className={`rounded-full border px-2 py-0.5 text-xs ${
                assessment.completed ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-orange-500/30 bg-orange-500/10 text-orange-400"
              }`}>
                {assessment.completed ? `✓ ${copy.completed}` : copy.pending}
              </span>
            </div>

            <h3 className="mb-1 font-semibold">{assessment.title}</h3>
            <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">{assessment.description}</p>

            <div className="mb-4 flex items-center gap-3 text-xs text-muted-foreground">
              <span>◈ {assessment.questionCount} {copy.questions}</span>
              <span>·</span>
              <span>≈ {assessment.estimatedMinutes} min</span>
              {assessment.lastCompletedAt && (
                <>
                  <span>·</span>
                  <span>{copy.last}: {new Date(assessment.lastCompletedAt).toLocaleDateString()}</span>
                </>
              )}
            </div>

            {!assessment.completed && (
              <Button
                onClick={() => startAssessment(assessment.id)}
                className="bg-primary text-white hover:bg-primary/80"
              >
                {isRTL ? `← ${copy.start}` : `${copy.start} →`}
              </Button>
            )}
          </motion.div>
        ))}
      </div>

      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
        <div className="mb-1 text-sm font-medium text-blue-400">{copy.infoTitle}</div>
        <p className="text-xs leading-relaxed text-muted-foreground">{copy.infoBody}</p>
      </div>
    </div>
  );
}
