import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useLogin, useVerifyMfa } from "@workspace/api-client-react";
import logo from "@/assets/logo";
import ThemeToggle from "@/components/theme-toggle";
import { API_BASE } from "@/lib/runtime";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const mfaSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
});

const testRoles = [
  { role: "employee", label: "Employee" },
  { role: "executive", label: "Executive" },
  { role: "hr", label: "HR" },
  { role: "admin", label: "Admin" },
  { role: "superadmin", label: "Super Admin" },
];

function decodeHtmlEntities(value: string) {
  return value
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function normalizeAuthErrorMessage(value?: string) {
  const message = decodeHtmlEntities((value ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
  if (!message) return "Invalid credentials";
  return message.length > 420 ? `${message.slice(0, 420)}...` : message;
}

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();
  const verifyMfaMutation = useVerifyMfa();
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [tempRole, setTempRole] = useState<string | null>(null);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const mfaForm = useForm<z.infer<typeof mfaSchema>>({
    resolver: zodResolver(mfaSchema),
    defaultValues: { code: "" },
  });

  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          if (data.user.mfaEnabled) {
            setRequiresMfa(true);
          } else {
            localStorage.setItem("ccx_token", data.token);
            toast({ title: "Access Granted", description: "Welcome to CyberCultX" });
            routeUser(data.user.role);
          }
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: normalizeAuthErrorMessage(err.data?.error || err.message),
          });
        },
      }
    );
  };

  const onMfaSubmit = (values: z.infer<typeof mfaSchema>) => {
    verifyMfaMutation.mutate(
      { data: values },
      {
        onSuccess: () => {
          toast({ title: "Identity Verified", description: "Welcome to CyberCultX" });
          setLocation("/portal");
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "Verification Failed",
            description: err.message || "Invalid MFA code",
          });
        },
      }
    );
  };

  const routeUser = (role: string) => {
    const routeMap: Record<string, string> = {
      employee: "/portal",
      executive: "/executive",
      hr: "/hr",
      admin: "/admin",
      superadmin: "/superadmin",
    };
    setLocation(routeMap[role] ?? "/portal");
  };

  const handleTempLogin = async (role: string) => {
    setTempRole(role);
    try {
      const response = await fetch(`${API_BASE}/api/auth/temp-login`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const responseText = await response.text();
      let data: any = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { error: normalizeAuthErrorMessage(responseText) };
      }

      if (!response.ok) {
        throw new Error(normalizeAuthErrorMessage(data?.error || "Temporary login failed"));
      }

      localStorage.setItem("ccx_token", data.token);
      toast({ title: "Access Granted", description: `Signed in as ${data.user.role}` });
      routeUser(data.user.role);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Temporary Login Failed",
        description: normalizeAuthErrorMessage(err.message || "Unable to start test session"),
      });
    } finally {
      setTempRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-background grid lg:grid-cols-[minmax(360px,0.9fr)_1.1fr] relative overflow-hidden">
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>
      <div className="absolute inset-0 bg-background" />
      
      <motion.div 
        initial={{ opacity: 0, x: -18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10 lg:px-10"
      >
        <div className="w-full max-w-sm bg-card p-6 rounded-lg border border-border text-card-foreground">
          <div className="flex flex-col items-center mb-6">
            <Link href="/">
              <img src={logo} alt="The Harvesters Logo" className="h-16 w-12 object-contain mb-3 cursor-pointer hover:scale-105 transition-transform" />
            </Link>
            <h1 className="text-xl font-bold tracking-tight text-center">Identity Verification</h1>
            <p className="text-xs text-muted-foreground mt-1.5 text-center">Authenticate to access the intelligence portal</p>
          </div>

          {!requiresMfa ? (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <Label className="text-xs">Email Coordinate</Label>
                      <FormControl>
                        <Input placeholder="agent@harvesters.com" {...field} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Passphrase</Label>
                        <Link href="/forgot-password" className="text-[11px] text-primary hover:underline" data-testid="link-forgot-password">
                          Lost Access?
                        </Link>
                      </div>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} data-testid="input-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={loginMutation.isPending} data-testid="button-submit">
                  {loginMutation.isPending ? "Authenticating..." : "Authorize Access"}
                </Button>

                <div className="space-y-2 bg-background rounded-lg p-3 border border-border">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Temporary test access
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {testRoles.map((item) => (
                      <Button
                        key={item.role}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleTempLogin(item.role)}
                        disabled={tempRole !== null}
                        className="text-[11px]"
                        data-testid={`button-temp-login-${item.role}`}
                      >
                        {tempRole === item.role ? "Signing in..." : item.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </form>
            </Form>
          ) : (
            <Form {...mfaForm}>
              <form onSubmit={mfaForm.handleSubmit(onMfaSubmit)} className="space-y-4">
                <FormField
                  control={mfaForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <Label className="text-xs">Multi-Factor Authorization Code</Label>
                      <FormControl>
                        <Input placeholder="000000" maxLength={6} {...field} className="text-center tracking-[0.5em] text-base font-mono" data-testid="input-mfa" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={verifyMfaMutation.isPending} data-testid="button-verify-mfa">
                  {verifyMfaMutation.isPending ? "Verifying..." : "Verify Identity"}
                </Button>
              </form>
            </Form>
          )}

          <div className="mt-5 text-center text-xs text-muted-foreground bg-background rounded-lg py-3 border border-border">
            Unregistered operative?{" "}
            <Link href="/register" className="text-primary hover:underline font-medium" data-testid="link-register">
              Request Clearance
            </Link>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="relative z-10 hidden min-h-screen overflow-hidden bg-background lg:flex items-center justify-center p-10"
      >
        <div className="relative h-[520px] w-[520px] max-w-full">
          {[0, 1, 2].map((ring) => (
            <motion.div
              key={ring}
              className="absolute inset-0 rounded-full bg-background border border-primary"
              style={{ margin: ring * 58 }}
              animate={{ scale: [1, 1.05, 1], opacity: [0.18, 0.32, 0.18] }}
              transition={{ duration: 4 + ring, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
          <motion.div
            className="absolute left-1/2 top-1/2 flex h-32 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-card border border-border"
            animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.04, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <img src={logo} alt="The Harvesters Logo" className="h-24 w-16 object-contain" />
          </motion.div>
          {[
            ["left-10 top-20", "Threat Signals"],
            ["right-5 top-40", "Readiness Score"],
            ["left-20 bottom-24", "Access Control"],
            ["right-20 bottom-14", "Live Training"],
          ].map(([position, label], index) => (
            <motion.div
              key={label}
              className={`absolute ${position} rounded-lg bg-card px-4 py-3 text-xs text-card-foreground border border-border`}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3.2 + index * 0.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="h-1.5 w-16 rounded-full bg-primary mb-2" />
              <div className="font-medium">{label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
