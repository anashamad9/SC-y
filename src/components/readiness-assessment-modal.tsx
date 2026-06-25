import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useGetAssessment, useListAssessments, useSubmitAssessment } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function ReadinessAssessmentModal() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [startedAt] = useState(() => Date.now());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: assessments } = useListAssessments();
  const readinessAssessment = useMemo(
    () => assessments?.find((assessment) => assessment.type === "psychometric"),
    [assessments],
  );
  const assessmentId = readinessAssessment?.id ?? 0;
  const { data: assessment, isLoading } = useGetAssessment(assessmentId);
  const submitAssessment = useSubmitAssessment();

  const questions = assessment?.questions ?? [];
  const question = questions[currentQuestion];
  const selectedValue = question ? answers[String(question.id)] : undefined;
  const isLastQuestion = currentQuestion === questions.length - 1;
  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  function handleSelect(value: number) {
    if (!question) return;
    setAnswers((current) => ({ ...current, [String(question.id)]: value }));
  }

  function handlePrevious() {
    setCurrentQuestion((current) => Math.max(0, current - 1));
  }

  function handleNext() {
    if (!question) return;
    if (!isLastQuestion) {
      setCurrentQuestion((current) => current + 1);
      return;
    }

    submitAssessment.mutate(
      {
        id: assessmentId,
        data: {
          answers,
          timeTakenSec: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
        },
      },
      {
        onSuccess: async () => {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] }),
            queryClient.invalidateQueries({ queryKey: ["/api/assessments"] }),
            queryClient.invalidateQueries({ queryKey: ["/api/scores/me"] }),
            queryClient.invalidateQueries({ queryKey: ["/api/courses/learning-path"] }),
          ]);
          toast({ title: "Assessment completed" });
        },
        onError: (error: Error) => {
          toast({ title: error.message || "Could not submit assessment", variant: "destructive" });
        },
      },
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl rounded-2xl border border-border bg-card shadow-2xl"
        dir="rtl"
      >
        <div className="border-b border-border px-6 py-5">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">تقييم مطلوب</div>
          <h2 className="mt-2 text-2xl font-bold">تقييم الجاهزية الأمنية</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            تمت الموافقة على حسابك. أكمل هذا التقييم لفتح بقية المنصة.
          </p>
        </div>

        <div className="p-6">
          {isLoading || !question ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{assessment?.title}</span>
                  <span>
                    السؤال {currentQuestion + 1} من {questions.length}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    animate={{ width: `${progress}%` }}
                    className="h-full rounded-full bg-primary"
                  />
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  className="space-y-5"
                >
                  <div className="text-lg font-medium leading-relaxed">{question.text}</div>

                  <div className="space-y-3">
                    {(question.options as Array<{ value: number; label: string }>).map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleSelect(option.value)}
                        className={`w-full rounded-xl border px-4 py-3 text-right text-sm transition-colors ${
                          selectedValue === option.value
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border bg-background hover:border-primary/40"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0 || submitAssessment.isPending}>
                  السابق
                </Button>
                <Button onClick={handleNext} disabled={selectedValue === undefined || submitAssessment.isPending}>
                  {submitAssessment.isPending ? "جارٍ الإرسال..." : isLastQuestion ? "إرسال التقييم" : "السؤال التالي"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
