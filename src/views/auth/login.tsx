import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useLogin, useVerifyMfa } from "@workspace/api-client-react";
import BrandLogo from "@/components/brand-logo";
import ThemeToggle from "@/components/theme-toggle";
import { useI18n, type Lang } from "@/lib/i18n";

type LoginFormValues = {
  email: string;
  password: string;
};

type MfaFormValues = {
  code: string;
};

function loginCopy(lang: Lang) {
  return lang === "ar"
    ? {
        identityTitle: "التحقق من الهوية",
        identitySub: "سجّل الدخول للوصول إلى بوابة الاستخبارات",
        email: "البريد الإلكتروني",
        emailPlaceholder: "agent@harvesters.com",
        password: "عبارة المرور",
        forgotPassword: "نسيت كلمة المرور",
        authenticating: "جارٍ التحقق...",
        authorize: "تسجيل الدخول",
        mfaLabel: "رمز التحقق متعدد العوامل",
        verifying: "جارٍ التحقق...",
        verify: "تحقق من الهوية",
        unregistered: "لا تملك حساباً؟",
        requestClearance: "اطلب تصريحاً",
        accessGranted: "تم السماح بالوصول",
        welcome: "مرحباً بك في CyberCultX",
        accessDenied: "تم رفض الوصول",
        identityVerified: "تم التحقق من الهوية",
        verificationFailed: "فشل التحقق",
        invalidMfa: "رمز التحقق غير صحيح",
        invalidCredentials: "بيانات الدخول غير صحيحة",
        emailError: "أدخل بريداً إلكترونياً صالحاً",
        passwordError: "كلمة المرور مطلوبة",
        codeError: "يجب أن يكون الرمز من 6 أرقام",
        orbitLabels: ["إشارات التهديد", "درجة الجاهزية", "التحكم بالوصول", "تدريب مباشر"],
      }
    : {
        identityTitle: "Identity Verification",
        identitySub: "Authenticate to access the intelligence portal",
        email: "Email Coordinate",
        emailPlaceholder: "agent@harvesters.com",
        password: "Passphrase",
        forgotPassword: "Lost Access?",
        authenticating: "Authenticating...",
        authorize: "Authorize Access",
        mfaLabel: "Multi-Factor Authorization Code",
        verifying: "Verifying...",
        verify: "Verify Identity",
        unregistered: "Unregistered operative?",
        requestClearance: "Request Clearance",
        accessGranted: "Access Granted",
        welcome: "Welcome to CyberCultX",
        accessDenied: "Access Denied",
        identityVerified: "Identity Verified",
        verificationFailed: "Verification Failed",
        invalidMfa: "Invalid MFA code",
        invalidCredentials: "Invalid credentials",
        emailError: "Enter a valid email address",
        passwordError: "Password is required",
        codeError: "Code must be 6 digits",
        orbitLabels: ["Threat Signals", "Readiness Score", "Access Control", "Live Training"],
      };
}

function decodeHtmlEntities(value: string) {
  return value
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function normalizeAuthErrorMessage(value?: string, fallback = "Invalid credentials") {
  const message = decodeHtmlEntities((value ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
  if (!message) return fallback;
  return message.length > 420 ? `${message.slice(0, 420)}...` : message;
}

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { lang, setLang, isRTL } = useI18n();
  const copy = useMemo(() => loginCopy(lang), [lang]);
  const loginMutation = useLogin();
  const verifyMfaMutation = useVerifyMfa();
  const [requiresMfa, setRequiresMfa] = useState(false);

  const loginSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(copy.emailError),
        password: z.string().min(1, copy.passwordError),
      }),
    [copy.emailError, copy.passwordError]
  );

  const mfaSchema = useMemo(
    () =>
      z.object({
        code: z.string().length(6, copy.codeError),
      }),
    [copy.codeError]
  );

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const mfaForm = useForm<MfaFormValues>({
    resolver: zodResolver(mfaSchema),
    defaultValues: { code: "" },
  });

  const onLoginSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          if (data.user.mfaEnabled) {
            setRequiresMfa(true);
          } else {
            localStorage.setItem("ccx_token", data.token);
            toast({ title: copy.accessGranted, description: copy.welcome });
            routeUser(data.user.role);
          }
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: copy.accessDenied,
            description: normalizeAuthErrorMessage(err.data?.error || err.message, copy.invalidCredentials),
          });
        },
      }
    );
  };

  const onMfaSubmit = (values: MfaFormValues) => {
    verifyMfaMutation.mutate(
      { data: values },
      {
        onSuccess: () => {
          toast({ title: copy.identityVerified, description: copy.welcome });
          setLocation("/portal");
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: copy.verificationFailed,
            description: err.message || copy.invalidMfa,
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
    <div className="min-h-screen bg-background grid lg:grid-cols-[minmax(360px,0.9fr)_1.1fr] relative overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
      <div className={`absolute top-4 z-20 flex items-center gap-2 ${isRTL ? "left-4" : "right-4"}`}>
        <button
          type="button"
          onClick={() => setLang(lang === "en" ? "ar" : "en")}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Toggle language / تغيير اللغة"
          aria-label="Toggle language / تغيير اللغة"
        >
          <Languages className="h-4 w-4" aria-hidden="true" />
          <span className="font-mono">{lang === "en" ? "العربية" : "English"}</span>
        </button>
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
              <BrandLogo className="h-16 w-12 object-contain mb-3 cursor-pointer hover:scale-105 transition-transform" />
            </Link>
            <h1 className="text-xl font-bold tracking-tight text-center">{copy.identityTitle}</h1>
            <p className="text-xs text-muted-foreground mt-1.5 text-center">{copy.identitySub}</p>
          </div>

          {!requiresMfa ? (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <Label className="text-xs">{copy.email}</Label>
                      <FormControl>
                        <Input placeholder={copy.emailPlaceholder} {...field} data-testid="input-email" />
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
                        <Label className="text-xs">{copy.password}</Label>
                        <Link href="/forgot-password" className="text-[11px] text-primary hover:underline" data-testid="link-forgot-password">
                          {copy.forgotPassword}
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
                  {loginMutation.isPending ? copy.authenticating : copy.authorize}
                </Button>
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
                      <Label className="text-xs">{copy.mfaLabel}</Label>
                      <FormControl>
                        <Input placeholder="000000" maxLength={6} {...field} className="text-center tracking-[0.5em] text-base font-mono" data-testid="input-mfa" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={verifyMfaMutation.isPending} data-testid="button-verify-mfa">
                  {verifyMfaMutation.isPending ? copy.verifying : copy.verify}
                </Button>
              </form>
            </Form>
          )}

          <div className="mt-5 text-center text-xs text-muted-foreground bg-background rounded-lg py-3 border border-border">
            {copy.unregistered}{" "}
            <Link href="/register" className="text-primary hover:underline font-medium" data-testid="link-register">
              {copy.requestClearance}
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
            <BrandLogo className="h-24 w-16 object-contain" />
          </motion.div>
          {[
            ["left-10 top-20", copy.orbitLabels[0]],
            ["right-5 top-40", copy.orbitLabels[1]],
            ["left-20 bottom-24", copy.orbitLabels[2]],
            ["right-20 bottom-14", copy.orbitLabels[3]],
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
