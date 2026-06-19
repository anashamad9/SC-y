"use client";

import "./lib/i18next";
import { useEffect, Component, ReactNode } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/views/not-found";
import { useGetMe } from "@workspace/api-client-react";
import { I18nProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";

// Pages
import Landing from "@/views/landing";
import Login from "@/views/auth/login";
import Register from "@/views/auth/register";
import ForgotPassword from "@/views/auth/forgot-password";
import MfaSetup from "@/views/auth/mfa-setup";
import Portal from "@/views/portal";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-8">
          <div className="bg-red-950/50 border border-red-500/30 rounded-xl p-6 max-w-2xl w-full">
            <div className="text-red-400 font-mono text-sm font-bold mb-2">RENDER ERROR</div>
            <div className="text-red-300 text-sm font-mono break-all">{this.state.error.message}</div>
            <pre className="text-red-300/70 text-xs mt-3 overflow-auto max-h-40">{this.state.error.stack}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const ROLE_ROUTES: Record<string, string> = {
  employee: "/portal",
  executive: "/executive",
  hr: "/hr",
  admin: "/admin",
  superadmin: "/superadmin",
};

function AuthGuard({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) {
  const { data: user, isLoading } = useGetMe();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      setLocation("/login");
      return;
    }

    if (requiredRole && user.role.toLowerCase() !== requiredRole.toLowerCase()) {
      const correctRoute = ROLE_ROUTES[user.role.toLowerCase()] ?? "/portal";
      setLocation(correctRoute);
    }
  }, [user, isLoading, requiredRole, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;
  if (requiredRole && user.role.toLowerCase() !== requiredRole.toLowerCase()) return null;

  return <>{children}</>;
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/mfa-setup" component={MfaSetup} />

      <Route path="/portal">
        <AuthGuard requiredRole="employee">
          <Portal role="Employee" />
        </AuthGuard>
      </Route>
      <Route path="/executive">
        <AuthGuard requiredRole="executive">
          <Portal role="Executive" />
        </AuthGuard>
      </Route>
      <Route path="/hr">
        <AuthGuard requiredRole="hr">
          <Portal role="HR" />
        </AuthGuard>
      </Route>
      <Route path="/admin">
        <AuthGuard requiredRole="admin">
          <Portal role="Admin" />
        </AuthGuard>
      </Route>
      <Route path="/superadmin">
        <AuthGuard requiredRole="superadmin">
          <Portal role="SuperAdmin" />
        </AuthGuard>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <I18nProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <AppRouter />
              <Toaster />
            </TooltipProvider>
          </QueryClientProvider>
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
