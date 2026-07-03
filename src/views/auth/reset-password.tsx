import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BrandLogo from "@/components/brand-logo";
import { API_BASE } from "@/lib/runtime";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const token = useMemo(() => new URLSearchParams(window.location.search).get("token") ?? "", []);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setMessage(null);
    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Reset failed");
      setMessage(data.message || "Password reset.");
      setTimeout(() => setLocation("/login"), 900);
    } catch (error: any) {
      setMessage(error.message || "Reset failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card text-card-foreground rounded-lg p-6 border border-border">
        <div className="flex flex-col items-center mb-6">
          <Link href="/">
            <BrandLogo className="h-16 w-12 object-contain mb-3" />
          </Link>
          <h1 className="text-xl font-bold">Reset Password</h1>
          <p className="text-xs text-muted-foreground mt-1.5 text-center">Set a new password for your account</p>
        </div>
        <div className="space-y-4">
          <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New password" />
          <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirm password" />
          <Button onClick={submit} disabled={saving || !token} className="w-full">
            {saving ? "Updating..." : "Update Password"}
          </Button>
          {message && <div className="text-xs text-muted-foreground text-center">{message}</div>}
          {!token && <div className="text-xs text-red-400 text-center">Reset token is missing.</div>}
        </div>
      </div>
    </div>
  );
}
