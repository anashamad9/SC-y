import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useListAssessments } from "@workspace/api-client-react";
import { API_BASE } from "@/lib/runtime";

const CATEGORY_COLORS: Record<string, string> = {
  psychometric: "from-purple-600 to-purple-800",
  awareness: "from-blue-600 to-blue-800",
  technical: "from-orange-600 to-orange-800",
  compliance: "from-teal-600 to-teal-800",
  cyber_behavior: "from-blue-600 to-cyan-700",
};

function ResultsDrawer({ assessmentId }: { assessmentId: number }) {
  const { data, isLoading } = useQuery<{ results: any[]; total: number }>({
    queryKey: [`/api/admin/assessments/${assessmentId}/results`],
    queryFn: () => fetch(`${API_BASE}/api/admin/assessments/${assessmentId}/results?limit=20`, { credentials: "include" }).then(r => r.json()),
  });

  if (isLoading) return <div className="text-xs text-muted-foreground py-4 text-center">Loading results...</div>;
  if (!data?.results?.length) return <div className="text-xs text-muted-foreground py-4 text-center">No submissions yet for this assessment</div>;

  return (
    <div className="mt-4 space-y-2">
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
        Employee Submissions — {data.total} total
      </div>
      {data.results.map((r: any) => (
        <div key={r.id} className="flex items-center gap-4 py-2 border-b border-border/30 last:border-0">
          <div className="flex-1 text-sm font-medium">{r.firstName} {r.lastName}</div>
          <div className="text-xs text-muted-foreground hidden sm:block">{r.email}</div>
          <div className={`text-sm font-bold tabular-nums ${
            r.overallScore >= 70 ? "text-emerald-400" : r.overallScore >= 50 ? "text-yellow-400" : "text-red-400"
          }`}>
            {Math.round(r.overallScore)}
          </div>
          <div className="text-xs text-muted-foreground">
            {r.completedAt ? new Date(r.completedAt).toLocaleDateString() : "—"}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminAssessments() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { data: assessments, isLoading } = useListAssessments();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Assessment Management</h2>
        <p className="text-sm text-muted-foreground">Psychometric and security awareness assessments library with employee submission tracking</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-4">
          {(assessments as any[])?.map((a: any, i: number) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="bg-card/80 border border-border rounded-xl overflow-hidden">
              <div className={`h-1.5 bg-gradient-to-r ${CATEGORY_COLORS[a.type] ?? CATEGORY_COLORS.psychometric}`} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="font-semibold">{a.title}</div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted/50 border border-border capitalize text-muted-foreground">
                        {a.type?.replace(/_/g, " ")}
                      </span>
                      {a.completed && <span className="text-xs text-emerald-400">✓ Completed</span>}
                    </div>
                    <div className="text-sm text-muted-foreground mb-3">{a.description}</div>
                    <div className="flex gap-6 text-xs text-muted-foreground">
                      <span>⏱ {a.estimatedMinutes} min</span>
                      <span>◈ {a.questionCount} questions</span>
                    </div>
                  </div>
                  <button onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                    className="text-xs text-primary hover:underline shrink-0">
                    {expandedId === a.id ? "Hide Results ▲" : "View Results ▼"}
                  </button>
                </div>
                {expandedId === a.id && <ResultsDrawer assessmentId={a.id} />}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
