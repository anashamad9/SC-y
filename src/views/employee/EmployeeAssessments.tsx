import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListAssessments, useGetAssessment, useSubmitAssessment } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

type Phase = "list" | "taking" | "results";

const CATEGORY_LABELS: Record<string, string> = {
  risk_tolerance: "Risk Tolerance", impulsiveness: "Impulsiveness",
  security_awareness: "Security Awareness", decision_making: "Decision Making",
  attention_to_detail: "Attention to Detail", trust_tendencies: "Trust Tendencies",
  stress_response: "Stress Response", compliance_behavior: "Compliance Behavior",
  phishing_recognition: "Phishing Recognition", password_hygiene: "Password Hygiene",
  social_engineering: "Social Engineering", data_handling: "Data Handling",
  incident_response: "Incident Response", device_security: "Device Security",
  remote_work: "Remote Work Security", cloud_security: "Cloud Security",
};

const RISKY = new Set(["risk_tolerance", "impulsiveness", "trust_tendencies"]);

function scoreColor(category: string, score: number) {
  if (RISKY.has(category)) return score > 65 ? "#ef4444" : score > 45 ? "#f97316" : "#22c55e";
  return score > 65 ? "#22c55e" : score > 45 ? "#f97316" : "#ef4444";
}

function ScoreBar({ category, score }: { category: string; score: number }) {
  const color = scoreColor(category, score);
  const label = CATEGORY_LABELS[category] ?? category;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono" style={{ color }}>{Math.round(score)}</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
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

  const queryClient = useQueryClient();
  const { data: assessments, isLoading } = useListAssessments();
  const { data: activeAssessment } = useGetAssessment(activeId ?? 0);
  const submitMutation = useSubmitAssessment();

  const questions = activeAssessment?.questions ?? [];
  const question = questions[currentQ];
  const progress = questions.length > 0 ? ((currentQ) / questions.length) * 100 : 0;

  function startAssessment(id: number) {
    setActiveId(id);
    setCurrentQ(0);
    setAnswers({});
    setStartTime(Date.now());
    setPhase("taking");
  }

  function selectOption(value: number) {
    if (!question) return;
    setAnswers(prev => ({ ...prev, [String(question.id)]: value }));
  }

  function goNext() {
    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1);
    } else {
      handleSubmit();
    }
  }

  function goPrev() {
    setCurrentQ(q => Math.max(0, q - 1));
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
      }
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
        {[1, 2].map(i => <div key={i} className="h-40 rounded-xl bg-card/50 animate-pulse border border-border" />)}
      </div>
    );
  }

  if (phase === "results" && resultData) {
    const assessment = assessments?.find(a => a.id === activeId);
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        <div className="bg-card/80 border border-border rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Assessment Complete</div>
              <h2 className="text-lg font-bold">{assessment?.title}</h2>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold font-mono text-primary">{Math.round(resultData.overallScore)}</div>
              <div className="text-xs text-muted-foreground">Overall Score</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resultData.categoryScores?.map((cs: any) => (
              <ScoreBar key={cs.category} category={cs.category} score={cs.score} />
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={reset} className="bg-primary text-white hover:bg-primary/80">
              ← Back to Assessments
            </Button>
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <span>✓</span>
              <span>+{50 + Math.round(resultData.overallScore * 0.5)} XP earned</span>
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-muted-foreground">{activeAssessment.title}</div>
            <div className="text-xs text-muted-foreground">Question {currentQ + 1} / {questions.length}</div>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              animate={{ width: `${progress}%` }}
              className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary"
              transition={{ duration: 0.3 }}
            />
          </div>
          {question && (
            <div className="text-xs text-muted-foreground mt-1 capitalize">
              Category: {CATEGORY_LABELS[question.category] ?? question.category}
            </div>
          )}
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          {question && (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="bg-card/80 border border-border rounded-xl p-6 backdrop-blur-sm"
            >
              <p className="text-base font-medium leading-relaxed mb-6">{question.text}</p>
              <div className="space-y-3">
                {(question.options as any[]).map((opt: any) => (
                  <button
                    key={opt.value}
                    onClick={() => selectOption(opt.value)}
                    className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all duration-200 ${
                      selectedValue === opt.value
                        ? "bg-primary/20 border-primary text-primary"
                        : "border-border bg-white/3 hover:bg-white/5 hover:border-white/30 text-foreground"
                    }`}
                  >
                    <span className={`inline-flex w-6 h-6 rounded-full border mr-3 items-center justify-center text-xs shrink-0 ${
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

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={goPrev} disabled={currentQ === 0} className="text-muted-foreground">
            ← Previous
          </Button>
          <div className="flex gap-1">
            {questions.slice(0, Math.min(questions.length, 12)).map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-colors ${
                i < currentQ ? "bg-primary" : i === currentQ ? "bg-primary/60" : "bg-white/10"
              }`} />
            ))}
            {questions.length > 12 && <div className="text-xs text-muted-foreground">…</div>}
          </div>
          <Button
            onClick={goNext}
            disabled={selectedValue === undefined || submitMutation.isPending}
            className="bg-primary text-white hover:bg-primary/80 disabled:opacity-40"
          >
            {submitMutation.isPending ? "Submitting…" : isLast ? "Submit Assessment" : "Next →"}
          </Button>
        </div>

        <div className="text-center">
          <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground underline transition-colors">
            Cancel Assessment
          </button>
        </div>
      </motion.div>
    );
  }

  // Phase: list
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold mb-1">Security Assessments</h2>
        <p className="text-sm text-muted-foreground">Complete assessments to build your behavioral profile and improve your Human Risk Score.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(assessments ?? []).map((assessment: any, i: number) => (
          <motion.div
            key={assessment.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card/80 border border-border rounded-xl p-5 backdrop-blur-sm flex flex-col"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-lg">
                {assessment.type === "psychometric" ? "🧠" : "🎯"}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${
                assessment.completed
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-orange-500/10 border-orange-500/30 text-orange-400"
              }`}>
                {assessment.completed ? "✓ Completed" : "Pending"}
              </span>
            </div>

            <h3 className="font-semibold mb-1">{assessment.title}</h3>
            <p className="text-sm text-muted-foreground flex-1 mb-4 leading-relaxed">{assessment.description}</p>

            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
              <span>◈ {assessment.questionCount} questions</span>
              <span>·</span>
              <span>≈ {assessment.estimatedMinutes} min</span>
              {assessment.lastCompletedAt && (
                <>
                  <span>·</span>
                  <span>Last: {new Date(assessment.lastCompletedAt).toLocaleDateString()}</span>
                </>
              )}
            </div>

            <Button
              onClick={() => startAssessment(assessment.id)}
              className={assessment.completed
                ? "bg-white/5 text-foreground hover:bg-white/10 border border-border"
                : "bg-primary text-white hover:bg-primary/80"
              }
            >
              {assessment.completed ? "Retake Assessment" : "Start Assessment →"}
            </Button>
          </motion.div>
        ))}
      </div>

      {/* Info box */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
        <div className="text-sm font-medium text-blue-400 mb-1">How Assessments Affect Your Score</div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Psychometric assessments map your behavioral tendencies across 8 security dimensions. Cyber Behavior assessments test practical decision-making. Together they compute your Human Risk Score and CyberCultX Culture Index (CCI).
        </p>
      </div>
    </div>
  );
}
