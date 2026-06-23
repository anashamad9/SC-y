import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListAssessments, useGetAssessment, useSubmitAssessment, useGetMyScores, useGetLearningPath } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

interface Props {
  user: { id: number; firstName: string; lastName: string; email: string };
  onComplete: () => void;
}

const STEPS = [
  { id: 1, label: "Identity", icon: "◉" },
  { id: 2, label: "Psychometric", icon: "◈" },
  { id: 3, label: "Risk Profile", icon: "◎" },
  { id: 4, label: "Learning Path", icon: "◇" },
];

function StepProgress({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center">
          <div className={`flex flex-col items-center`}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-mono transition-all duration-300 ${
              step.id < current ? "bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400" :
              step.id === current ? "bg-primary/20 border-2 border-primary text-primary" :
              "bg-white/5 border-2 border-border text-muted-foreground"
            }`}>
              {step.id < current ? "✓" : step.icon}
            </div>
            <div className={`text-xs mt-1 hidden sm:block transition-colors ${step.id === current ? "text-primary" : "text-muted-foreground"}`}>
              {step.label}
            </div>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-0.5 w-10 sm:w-16 mx-1 transition-colors ${step.id < current ? "bg-emerald-500/50" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// Inlined mini assessment for the readiness step.
function AssessmentStep({ assessmentId, onComplete }: { assessmentId: number; onComplete: (resultId: number) => void }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const startTime = useRef(Date.now());

  const { data: assessment, isLoading } = useGetAssessment(assessmentId);
  const submitMutation = useSubmitAssessment();

  const questions = assessment?.questions ?? [];
  const question = questions[currentQ];
  const selectedValue = question ? answers[String(question.id)] : undefined;
  const isLast = currentQ === questions.length - 1;

  function handleSelect(value: number) {
    if (!question) return;
    const latency = Date.now() - questionStartTime;
    setAnswers(prev => ({ ...prev, [String(question.id)]: value }));

    // Record telemetry — fire-and-forget
    fetch("/api/telemetry/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        eventType: "question_answered",
        assessmentId,
        questionId: question.id,
        decisionLatencyMs: latency,
        confidenceRating: Math.max(10, 100 - Math.min(latency / 30, 90)),
        attentionScore: latency < 3000 ? 85 : latency < 8000 ? 65 : 40,
      }),
    }).catch(() => {});
  }

  function handleNext() {
    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1);
      setQuestionStartTime(Date.now());
    } else {
      const timeTakenSec = Math.round((Date.now() - startTime.current) / 1000);
      submitMutation.mutate(
        { id: assessmentId, data: { answers, timeTakenSec } },
        { onSuccess: (data) => onComplete(data.id ?? 0) }
      );
    }
  }

  if (isLoading) return <div className="h-48 animate-pulse bg-card/50 rounded-xl border border-border" />;

  const progress = questions.length > 0 ? (currentQ / questions.length) * 100 : 0;

  return (
    <div className="space-y-5">
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>{assessment?.title}</span>
          <span>{currentQ + 1} / {questions.length}</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div animate={{ width: `${progress}%` }} className="h-full rounded-full bg-primary" transition={{ duration: 0.3 }} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {question && (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-base font-medium leading-relaxed mb-5">{question.text}</p>
            <div className="space-y-2.5">
              {(question.options as any[]).map((opt: any) => (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                    selectedValue === opt.value
                      ? "bg-primary/20 border-primary text-primary"
                      : "border-border bg-white/3 hover:bg-white/5 hover:border-white/30"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between">
        <button
          onClick={() => { setCurrentQ(q => Math.max(0, q - 1)); setQuestionStartTime(Date.now()); }}
          disabled={currentQ === 0}
          className="text-sm text-muted-foreground disabled:opacity-40 hover:text-foreground transition-colors"
        >
          ← Back
        </button>
        <Button
          onClick={handleNext}
          disabled={selectedValue === undefined || submitMutation.isPending}
          className="bg-primary text-white hover:bg-primary/80 disabled:opacity-40"
        >
          {submitMutation.isPending ? "Processing…" : isLast ? "Submit →" : "Next →"}
        </Button>
      </div>
    </div>
  );
}

function RiskProfileStep({ onContinue }: { onContinue: () => void }) {
  const { data: scores, isLoading } = useGetMyScores();
  const [revealed, setRevealed] = useState(false);

  if (!revealed) {
    return (
      <div className="text-center space-y-6 py-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="text-3xl font-mono text-primary"
          >
            ◈
          </motion.div>
        </motion.div>
        <div>
          <div className="text-lg font-semibold mb-1">Analyzing Your Readiness Profile</div>
          <div className="text-sm text-muted-foreground">Computing your readiness score and training recommendations…</div>
        </div>
        <Button onClick={() => setRevealed(true)} className="bg-primary text-white hover:bg-primary/80">
          {isLoading ? "Computing…" : "Reveal My Profile →"}
        </Button>
      </div>
    );
  }

  const readinessScore = Math.round(scores?.securityReadinessScore ?? 0);
  const riskScore = Math.round(scores?.humanRiskScore ?? 0);
  const riskColor = !scores ? "#6b7280" : riskScore > 70 ? "#ef4444" : riskScore > 45 ? "#f97316" : "#22c55e";
  const readinessColor = !scores ? "#6b7280" : readinessScore >= 29 ? "#22c55e" : readinessScore >= 22 ? "#f97316" : "#ef4444";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Assessment Points", value: readinessScore || 0, color: readinessColor, desc: "out of 32" },
          { label: "Risk Band", value: riskScore || 0, color: riskColor, desc: scores?.riskCategory ?? "Pending" },
        ].map(s => (
          <div key={s.label} className="bg-card/80 border border-border rounded-xl p-5 text-center backdrop-blur-sm">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{s.label}</div>
            <div className="text-4xl font-bold font-mono mb-1" style={{ color: s.color }}>{Math.round(s.value)}</div>
            <div className="text-xs" style={{ color: s.color }}>{s.desc}</div>
          </div>
        ))}
      </div>
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-muted-foreground">
        Your result is based on the CyberCultX Security Readiness Assessment. The recommended videos are matched to your total points.
      </div>
      <Button onClick={onContinue} className="w-full bg-primary text-white hover:bg-primary/80">
        View My Learning Path →
      </Button>
    </motion.div>
  );
}

function LearningPathStep({ user, onComplete }: { user: Props["user"]; onComplete: () => void }) {
  const queryClient = useQueryClient();
  const { data: path, isLoading } = useGetLearningPath();
  const [completing, setCompleting] = useState(false);

  async function handleComplete() {
    setCompleting(true);
    try {
      await fetch("/api/auth/complete-onboarding", {
        method: "POST",
        credentials: "include",
      });
      await queryClient.invalidateQueries({ queryKey: ["getMe"] });
      onComplete();
    } catch {
      setCompleting(false);
    }
  }

  const recommended = path?.recommended?.slice(0, 3) ?? [];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="text-center mb-2">
        <div className="text-sm text-muted-foreground">Based on your risk profile, here's your personalized learning path</div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-card/50 animate-pulse border border-border" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {recommended.map((course: any, i: number) => (
            <div key={course.id} className="flex items-center gap-3 p-3.5 rounded-xl bg-card/80 border border-border backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold" style={{ backgroundColor: course.thumbnailColor + "33", color: course.thumbnailColor }}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{course.title}</div>
                <div className="text-xs text-muted-foreground">{course.durationMinutes}min · +{course.xpReward}xp</div>
              </div>
              <div className="text-xs text-primary shrink-0">{course.difficulty}</div>
            </div>
          ))}
        </div>
      )}

      <Button
        onClick={handleComplete}
        disabled={completing}
        className="w-full bg-gradient-to-r from-primary to-purple-600 text-white hover:opacity-90 font-semibold py-3"
      >
        {completing ? "Activating…" : "Begin My Training →"}
      </Button>
    </motion.div>
  );
}

export default function OnboardingWizard({ user, onComplete }: Props) {
  const [step, setStep] = useState(1);

  const { data: assessments } = useListAssessments();
  // Find assessment IDs from list
  const psychoAssessment = assessments?.find((a: any) => a.type === "psychometric");

  // Step 1 — Profile
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [jobTitle, setJobTitle] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  async function saveProfile() {
    setSavingProfile(true);
    setProfileError(null);
    try {
      const body: any = { firstName, lastName };
      if (jobTitle) body.jobTitle = jobTitle;
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setProfileError(data.error ?? "Failed to save profile. Please try again.");
        return;
      }
      setStep(2);
    } catch {
      setProfileError("Network error. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  }

  const stepContent: Record<number, React.ReactNode> = {
    1: (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">First Name</label>
            <input
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              className="w-full bg-card/80 border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="First name"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Last Name</label>
            <input
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              className="w-full bg-card/80 border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="Last name"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Job Title <span className="opacity-50">(optional)</span></label>
          <input
            value={jobTitle}
            onChange={e => setJobTitle(e.target.value)}
            className="w-full bg-card/80 border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
            placeholder="e.g. Cybersecurity Analyst"
          />
        </div>
        {profileError && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{profileError}</div>
        )}
        <Button
          onClick={saveProfile}
          disabled={!firstName || !lastName || savingProfile}
          className="w-full bg-primary text-white hover:bg-primary/80 disabled:opacity-40"
        >
          {savingProfile ? "Saving…" : "Continue →"}
        </Button>
      </div>
    ),
    2: psychoAssessment ? (
      <AssessmentStep assessmentId={psychoAssessment.id} onComplete={() => setStep(3)} />
    ) : (
      <div className="text-center py-8 text-muted-foreground">Loading assessment…</div>
    ),
    3: <RiskProfileStep onContinue={() => setStep(4)} />,
    4: <LearningPathStep user={user} onComplete={onComplete} />,
  };

  const stepTitles: Record<number, string> = {
    1: "Set Up Your Operative Profile",
    2: "Security Readiness Assessment",
    3: "Your Risk Profile",
    4: "Your Personalized Learning Path",
  };

  const stepSubtitles: Record<number, string> = {
    1: "Tell us about yourself to personalize your security journey",
    2: "Answer 8 scenarios to calculate your readiness profile",
    3: "Based on your answers, we've computed your risk band",
    4: "Your recommended videos based on your assessment points",
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary mb-4">
            <span className="font-mono">◈</span> Operative Onboarding
          </div>
          <h1 className="text-2xl font-bold mb-1">{stepTitles[step]}</h1>
          <p className="text-sm text-muted-foreground">{stepSubtitles[step]}</p>
        </div>

        {/* Progress */}
        <div className="flex justify-center mb-6">
          <StepProgress current={step} />
        </div>

        {/* Content */}
        <div className="bg-card/80 border border-border rounded-2xl p-6 backdrop-blur-sm shadow-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {stepContent[step]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="text-center mt-4 text-xs text-muted-foreground">
          Step {step} of {STEPS.length} · All responses are confidential and used only for personalization
        </div>
      </motion.div>
    </div>
  );
}
