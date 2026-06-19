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

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const mfaSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();
  const verifyMfaMutation = useVerifyMfa();
  const [requiresMfa, setRequiresMfa] = useState(false);

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
            description: err.message || "Invalid credentials",
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
            <img src={logo} alt="Logo" className="w-16 h-16 mb-4 cursor-pointer hover:scale-105 transition-transform" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-center">Identity Verification</h1>
          <p className="text-sm text-muted-foreground mt-2 text-center">Authenticate to access the intelligence portal</p>
        </div>

        {!requiresMfa ? (
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <Label>Email Coordinate</Label>
                    <FormControl>
                      <Input placeholder="agent@harvesters.com" {...field} className="bg-background/50 border-input" data-testid="input-email" />
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
                      <Label>Passphrase</Label>
                      <Link href="/forgot-password" className="text-xs text-primary hover:underline" data-testid="link-forgot-password">
                        Lost Access?
                      </Link>
                    </div>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="bg-background/50 border-input" data-testid="input-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white" disabled={loginMutation.isPending} data-testid="button-submit">
                {loginMutation.isPending ? "Authenticating..." : "Authorize Access"}
              </Button>
            </form>
          </Form>
        ) : (
          <Form {...mfaForm}>
            <form onSubmit={mfaForm.handleSubmit(onMfaSubmit)} className="space-y-6">
              <FormField
                control={mfaForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <Label>Multi-Factor Authorization Code</Label>
                    <FormControl>
                      <Input placeholder="000000" maxLength={6} {...field} className="bg-background/50 border-input text-center tracking-[0.5em] text-lg font-mono" data-testid="input-mfa" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white" disabled={verifyMfaMutation.isPending} data-testid="button-verify-mfa">
                {verifyMfaMutation.isPending ? "Verifying..." : "Verify Identity"}
              </Button>
            </form>
          </Form>
        )}

        <div className="mt-6 text-center text-sm text-muted-foreground border-t border-border/50 pt-6">
          Unregistered operative?{" "}
          <Link href="/register" className="text-primary hover:underline font-medium" data-testid="link-register">
            Request Clearance
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
