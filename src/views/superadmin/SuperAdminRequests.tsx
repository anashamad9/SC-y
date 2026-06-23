import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { API_BASE } from "@/lib/runtime";

async function apiFetch(path: string, opts?: RequestInit) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...opts,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

type ApprovalStatus = "pending" | "approved" | "rejected";

interface ApprovalRequest {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  jobTitle: string | null;
  approvalStatus: ApprovalStatus;
  approvedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
}

const STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

const STATUS_COLORS: Record<ApprovalStatus, string> = {
  pending: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
  approved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  rejected: "border-red-500/30 bg-red-500/10 text-red-300",
};

export default function SuperAdminRequests() {
  const [status, setStatus] = useState<ApprovalStatus>("pending");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ requests: ApprovalRequest[]; total: number }>({
    queryKey: ["/api/superadmin/approval-requests", status],
    queryFn: () => apiFetch(`/api/superadmin/approval-requests?status=${status}`),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, nextStatus }: { id: number; nextStatus: "approved" | "rejected" }) =>
      apiFetch(`/api/superadmin/approval-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      }),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/approval-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: variables.nextStatus === "approved" ? "Request approved" : "Request rejected" });
    },
    onError: (error: Error) => {
      toast({ title: error.message || "Could not update request", variant: "destructive" });
    },
  });

  const requests = data?.requests ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Access Requests</h2>
          <p className="text-sm text-muted-foreground">Review new registrations before they can enter the platform.</p>
        </div>
        <div className="flex gap-2 rounded-lg border border-border bg-card p-1">
          {(["pending", "approved", "rejected"] as ApprovalStatus[]).map((value) => (
            <button
              key={value}
              onClick={() => setStatus(value)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                status === value ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {STATUS_LABELS[value]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-border bg-card/80 p-10 text-center text-sm text-muted-foreground">
          No {STATUS_LABELS[status].toLowerCase()} access requests.
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request, index) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="rounded-xl border border-border bg-card/80 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-base font-semibold">
                      {request.firstName} {request.lastName}
                    </div>
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${STATUS_COLORS[request.approvalStatus]}`}>
                      {STATUS_LABELS[request.approvalStatus]}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">{request.email}</div>
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>Role: {request.role}</span>
                    <span>Job title: {request.jobTitle || "Not provided"}</span>
                    <span>Requested: {new Date(request.createdAt).toLocaleString()}</span>
                    {request.approvedAt && <span>Approved: {new Date(request.approvedAt).toLocaleString()}</span>}
                    {request.rejectedAt && <span>Rejected: {new Date(request.rejectedAt).toLocaleString()}</span>}
                  </div>
                </div>

                {request.approvalStatus === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateStatus.mutate({ id: request.id, nextStatus: "approved" })}
                      disabled={updateStatus.isPending}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus.mutate({ id: request.id, nextStatus: "rejected" })}
                      disabled={updateStatus.isPending}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
