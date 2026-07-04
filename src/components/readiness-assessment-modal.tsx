import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useGetAssessment, useGetLearningPath, useListAssessments, useSubmitAssessment } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function ReadinessAssessmentModal() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [resultData, setResultData] = useState<any>(null);
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
  const { data: learningPath, isLoading: isLoadingPath } = useGetLearningPath({
    query: { enabled: Boolean(resultData) } as any,
  });
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
        onSuccess: async (data: any) => {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["/api/assessments"] }),
            queryClient.invalidateQueries({ queryKey: ["/api/scores/me"] }),
            queryClient.invalidateQueries({ queryKey: ["/api/courses/learning-path"] }),
          ]);
          setResultData(data);
          toast({ title: "اكتمل التقييم" });
        },
        onError: (error: Error) => {
          toast({ title: error.message || "Could not submit assessment", variant: "destructive" });
        },
      },
    );
  }

  async function enterPlatform() {
    await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
  }

  const levelCopy: Record<string, string> = {
    beginner: "مبتدئ",
    intermediate: "متوسط",
    advanced: "متقدم",
  };
  const recommendedCourses = (learningPath as any)?.recommended ?? [];

  useEffect(() => {
    if (!readinessAssessment?.completed) return;
    fetch("/api/auth/complete-onboarding", {
      method: "POST",
      credentials: "include",
    }).finally(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["getMe"] });
    });
  }, [queryClient, readinessAssessment?.completed]);

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground md:px-8" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10">
            <span className="text-2xl font-bold text-primary">✓</span>
          </div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">تقييم مطلوب</div>
          <h1 className="mt-3 text-3xl font-bold md:text-4xl">تقييم الجاهزية الأمنية</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            تمت الموافقة على حسابك. أكمل هذا التقييم القصير لفتح بقية المنصة وتخصيص مسار التعلم الخاص بك.
          </p>
        </div>

        <section className="flex flex-1 flex-col rounded-2xl border border-border bg-card shadow-xl">
          {resultData ? (
            <div className="flex flex-1 flex-col p-5 md:p-8">
              <div className="grid gap-5 md:grid-cols-[0.9fr_1.2fr]">
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
                  <div className="text-sm text-muted-foreground">نتيجتك</div>
                  <div className="mt-3 flex items-end gap-2">
                    <span className="text-6xl font-bold text-primary">{resultData.totalPoints ?? resultData.overallScore}</span>
                    <span className="pb-2 text-sm text-muted-foreground">من {resultData.maxPoints ?? 32}</span>
                  </div>
                  <div className="mt-5 rounded-xl border border-border bg-background/70 p-4">
                    <div className="text-xs text-muted-foreground">المستوى المقترح</div>
                    <div className="mt-1 text-2xl font-bold">{levelCopy[resultData.readinessLevel] ?? resultData.riskCategory}</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background/60 p-6">
                  <div className="mb-4">
                    <h2 className="text-xl font-bold">الدورات المقترحة لك</h2>
                    <p className="mt-1 text-sm text-muted-foreground">اخترنا هذه الدورات بناءً على نقاط تقييم الجاهزية.</p>
                  </div>
                  {isLoadingPath ? (
                    <div className="h-32 animate-pulse rounded-xl bg-muted/40" />
                  ) : recommendedCourses.length > 0 ? (
                    <div className="space-y-3">
                      {recommendedCourses.slice(0, 3).map((course: any) => (
                        <div key={course.id} className="rounded-xl border border-border bg-card p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold">{course.title}</div>
                              <div className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{course.description}</div>
                            </div>
                            <span className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-xs text-primary">
                              {levelCopy[course.difficulty] ?? course.difficulty}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                      لا توجد دورات مقترحة حالياً.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <Button onClick={enterPlatform} className="bg-primary text-white hover:bg-primary/80">
                  الدخول إلى المنصة
                </Button>
              </div>
            </div>
          ) : isLoading || !question ? (
            <div className="flex flex-1 min-h-[420px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="flex flex-1 flex-col p-5 md:p-8">
              <div className="mb-8">
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
                  className="flex-1 space-y-6"
                >
                  <div className="text-xl font-semibold leading-relaxed md:text-2xl">{question.text}</div>

                  <div className="space-y-3">
                    {(question.options as Array<{ value: number; label: string }>).map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleSelect(option.value)}
                        className={`w-full rounded-xl border px-5 py-4 text-right text-sm transition-colors md:text-base ${
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

              <div className="mt-8 flex items-center justify-between gap-3">
                <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0 || submitAssessment.isPending}>
                  السابق
                </Button>
                <Button onClick={handleNext} disabled={selectedValue === undefined || submitAssessment.isPending}>
                  {submitAssessment.isPending ? "جارٍ الإرسال..." : isLastQuestion ? "إرسال التقييم" : "السؤال التالي"}
                </Button>
              </div>
            </div>
          )}
        </section>
      </motion.div>
    </main>
  );
}
