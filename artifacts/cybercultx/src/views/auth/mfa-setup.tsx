import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useSetupMfa, useVerifyMfa, useGetMe } from "@workspace/api-client-react";
import logo from "@/assets/logo";

const verifySchema = z.object({
  code: z.string().length(6, "Enter the 6-digit code from your authenticator app"),
});

export default function MfaSetup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: user } = useGetMe();
  const setupMutation = useSetupMfa();
  const verifyMutation = useVerifyMfa();
  const [setupData, setSetupData] = useState<{ secret: string; qrCodeUrl: string } | null>(null);
  const [step, setStep] = useState<"intro" | "scan" | "verify" | "done">("intro");

  const form = useForm<z.infer<typeof verifySchema>>({
    resolver: zodResolver(verifySchema),
    defaultValues: { code: "" },
  });

  const handleSetup = () => {
    setupMutation.mutate(undefined, {
      onSuccess: (data) => {
        setSetupData({ secret: data.secret, qrCodeUrl: data.qrCodeUrl });
        setStep("scan");
      },
      onError: () => {
        toast({ variant: "destructive", title: "Setup Failed", description: "Could not initialize MFA. Please try again." });
      },
    });
  };

  const handleVerify = (values: z.infer<typeof verifySchema>) => {
    verifyMutation.mutate(
      { data: values },
      {
        onSuccess: () => {
          setStep("done");
          toast({ title: "MFA Activated", description: "Your account is now protected with multi-factor authentication." });
          setTimeout(() => {
            const role = user?.role ?? "employee";
            const routes: Record<string, string> = {
              employee: "/portal", executive: "/executive",
              hr: "/hr", admin: "/admin", superadmin: "/superadmin",
            };
            setLocation(routes[role] ?? "/portal");
          }, 2500);
        },
        onError: () => {
          toast({ variant: "destructive", title: "Verification Failed", description: "Invalid code. Try again — any 6-digit code is accepted in demo mode." });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-card/80 backdrop-blur-xl border border-card-border p-8 rounded-2xl shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <Link href="/">
            <img src={logo} alt="CyberCultX" className="w-14 h-14 mb-4 cursor-pointer hover:scale-105 transition-transform" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-center">Multi-Factor Authentication</h1>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Secure your account with a second layer of protection
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === "intro" && (
            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="space-y-3">
                {[
                  { num: "01", text: "Scan a QR code with your authenticator app (e.g. Google Authenticator)" },
                  { num: "02", text: "Enter the 6-digit code shown in the app" },
                  { num: "03", text: "Your account is protected — required on every login" },
                ].map((step) => (
                  <div key={step.num} className="flex gap-4 items-start p-4 rounded-lg bg-background/50 border border-border/50">
                    <span className="text-primary font-mono text-sm font-bold shrink-0">{step.num}</span>
                    <p className="text-sm text-muted-foreground">{step.text}</p>
                  </div>
                ))}
              </div>
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-white"
                onClick={handleSetup}
                disabled={setupMutation.isPending}
                data-testid="button-setup-mfa"
              >
                {setupMutation.isPending ? "Initializing..." : "Begin Setup"}
              </Button>
              <div className="text-center">
                <Link href="/portal" className="text-xs text-muted-foreground hover:text-primary transition-colors" data-testid="link-skip">
                  Skip for now — set up later in profile settings
                </Link>
              </div>
            </motion.div>
          )}

          {step === "scan" && setupData && (
            <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="p-3 bg-white rounded-xl">
                  <img src={setupData.qrCodeUrl} alt="QR Code" className="w-48 h-48" data-testid="mfa-qr-code" />
                </div>
                <div className="w-full">
                  <p className="text-xs text-muted-foreground text-center mb-2">Can't scan? Enter this key manually:</p>
                  <code className="block w-full text-center text-xs font-mono bg-background/50 border border-border px-3 py-2 rounded-lg text-primary tracking-widest" data-testid="mfa-secret">
                    {setupData.secret}
                  </code>
                </div>
              </div>
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-white"
                onClick={() => setStep("verify")}
                data-testid="button-continue-verify"
              >
                I've Scanned the QR Code →
              </Button>
            </motion.div>
          )}

          {step === "verify" && (
            <motion.div key="verify" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleVerify)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <Label>6-Digit Authenticator Code</Label>
                        <FormControl>
                          <Input
                            placeholder="000000"
                            maxLength={6}
                            {...field}
                            className="bg-background/50 border-input text-center tracking-[0.5em] text-lg font-mono"
                            data-testid="input-mfa-code"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                    disabled={verifyMutation.isPending}
                    data-testid="button-verify-mfa"
                  >
                    {verifyMutation.isPending ? "Verifying..." : "Activate MFA"}
                  </Button>
                  <button type="button" onClick={() => setStep("scan")} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors">
                    ← Back to QR code
                  </button>
                </form>
              </Form>
            </motion.div>
          )}

          {step === "done" && (
            <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-primary">MFA Activated</h2>
              <p className="text-sm text-muted-foreground">Your account is now secured. Redirecting to your portal…</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
