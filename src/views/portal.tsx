import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useGetMe, useLogout, useGetUserStats, useListDepartments } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo";
import { useI18n } from "@/lib/i18n";
import { useTranslation } from "react-i18next";
import ThemeToggle from "@/components/theme-toggle";
import EmployeeDashboard from "./employee/EmployeeDashboard";
import EmployeeAssessments from "./employee/EmployeeAssessments";
import EmployeeLearning from "./employee/EmployeeLearning";
import EmployeeAchievements from "./employee/EmployeeAchievements";
import EmployeePhishing from "./employee/EmployeePhishing";
import OnboardingWizard from "./onboarding/OnboardingWizard";
import AdminDashboard from "./admin/AdminDashboard";
import AdminUsers from "./admin/AdminUsers";
import AdminDepartments from "./admin/AdminDepartments";
import AdminCourses from "./admin/AdminCourses";
import AdminSimulations from "./admin/AdminSimulations";
import AdminReports from "./admin/AdminReports";
import AdminSettings from "./admin/AdminSettings";
import SuperAdminTenants from "./superadmin/SuperAdminTenants";
import SuperAdminAuditLogs from "./superadmin/SuperAdminAuditLogs";
import SuperAdminConfig from "./superadmin/SuperAdminConfig";
import SuperAdminMonitoring from "./superadmin/SuperAdminMonitoring";
import AdminAssessments from "./admin/AdminAssessments";
import AdminNotifications from "./admin/AdminNotifications";
import SuperAdminAnalytics from "./superadmin/SuperAdminAnalytics";
import ExecutiveDashboard from "./executive/ExecutiveDashboard";
import HRDashboard from "./hr/HRDashboard";
import AIChatWidget from "@/components/AIChatWidget";

interface NavItem {
  label: string;
  icon: string;
  key: string;
}

const navByRole: Record<string, NavItem[]> = {
  Employee: [
    { label: "nav.dashboard", icon: "⬡", key: "dashboard" },
    { label: "nav.myAssessments", icon: "◈", key: "assessments" },
    { label: "nav.learning", icon: "◉", key: "learning" },
    { label: "nav.achievements", icon: "◆", key: "achievements" },
    { label: "nav.phishingResults", icon: "◎", key: "phishing" },
    { label: "nav.profile", icon: "◯", key: "profile" },
  ],
  Executive: [
    { label: "nav.executiveDashboard", icon: "⬡", key: "dashboard" },
    { label: "nav.riskOverview", icon: "◈", key: "risk" },
    { label: "nav.departmentHeatmap", icon: "◉", key: "heatmap" },
    { label: "nav.reports", icon: "◆", key: "reports" },
    { label: "nav.aiInsights", icon: "◎", key: "ai" },
  ],
  HR: [
    { label: "nav.hrDashboard", icon: "⬡", key: "dashboard" },
    { label: "nav.learningProgress", icon: "◈", key: "learning" },
    { label: "nav.riskDistribution", icon: "◉", key: "risk" },
    { label: "nav.employeeManagement", icon: "◆", key: "employees" },
    { label: "nav.reports", icon: "◎", key: "reports" },
  ],
  Admin: [
    { label: "nav.users", icon: "⬡", key: "users" },
    { label: "nav.departments", icon: "◈", key: "departments" },
    { label: "nav.courses", icon: "◉", key: "courses" },
    { label: "nav.simulations", icon: "◆", key: "simulations" },
    { label: "nav.assessments", icon: "◎", key: "assessments" },
    { label: "nav.reports", icon: "◯", key: "reports" },
    { label: "nav.notifications", icon: "◐", key: "notifications" },
    { label: "nav.settings", icon: "◑", key: "settings" },
  ],
  SuperAdmin: [
    { label: "nav.tenants", icon: "⬡", key: "tenants" },
    { label: "nav.analytics", icon: "◈", key: "analytics" },
    { label: "nav.systemConfig", icon: "◉", key: "config" },
    { label: "nav.aiConfig", icon: "◆", key: "ai" },
    { label: "nav.licensing", icon: "◎", key: "licensing" },
    { label: "nav.auditLogs", icon: "◯", key: "audit" },
    { label: "nav.monitoring", icon: "◑", key: "monitoring" },
  ],
};

const roleColors: Record<string, string> = {
  Employee: "from-blue-600 to-blue-800",
  Executive: "from-primary to-pink-800",
  HR: "from-purple-600 to-purple-800",
  Admin: "from-orange-600 to-orange-800",
  SuperAdmin: "from-primary to-red-900",
};

function useRoleTitle(role: string): string {
  const { t } = useTranslation();
  return t(`roleTitle.${role}`, { defaultValue: role });
}

function LanguageToggle() {
  const { lang, setLang } = useI18n();
  return (
    <button
      onClick={() => setLang(lang === "en" ? "ar" : "en")}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
      title="Toggle language / تغيير اللغة"
    >
      <span className="text-base leading-none">{lang === "en" ? "🇸🇦" : "🇬🇧"}</span>
      <span className="hidden sm:block font-mono">{lang === "en" ? "العربية" : "English"}</span>
    </button>
  );
}

export default function Portal({ role }: { role: string }) {
  const [activeKey, setActiveKey] = useState(navByRole[role]?.[0]?.key ?? "dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [, setLocation] = useLocation();
  const { data: user } = useGetMe();
  const { data: stats } = useGetUserStats();
  const { data: departments } = useListDepartments();
  const { isRTL } = useI18n();
  const { t } = useTranslation();
  const logoutMutation = useLogout();

  const navItems = navByRole[role] ?? [];
  const activeItem = navItems.find(n => n.key === activeKey);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        localStorage.removeItem("ccx_token");
        setLocation("/login");
      },
    });
  };

  const queryClient = useQueryClient();
  const needsOnboarding = role === "Employee" && user && !(user as any).onboardingCompleted;

  if (needsOnboarding) {
    return (
      <OnboardingWizard
        user={{ id: (user as any).id, firstName: (user as any).firstName, lastName: (user as any).lastName, email: (user as any).email }}
        onComplete={() => queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] })}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex" dir={isRTL ? "rtl" : "ltr"}>
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: isRTL ? 280 : -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: isRTL ? 280 : -280, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-64 bg-card/90 backdrop-blur-xl border-r border-border flex flex-col shrink-0"
          >
            {/* Logo */}
            <div className="p-6 border-b border-border">
              <Link href="/" className="flex items-center gap-3">
                <img src={logo} alt="CyberCultX" className="w-10 h-10" />
                <div>
                  <div className="font-bold text-sm tracking-widest text-foreground">CYBERCULTX</div>
                  <div className="text-xs text-muted-foreground">{t(`roleTitle.${role}`)}</div>
                </div>
              </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveKey(item.key)}
                  data-testid={`nav-${item.key}`}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 text-left ${
                    activeKey === item.key
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  <span className="text-lg font-mono">{item.icon}</span>
                  {t(item.label)}
                </button>
              ))}
            </nav>

            {/* User info */}
            {user && (
              <div className="p-4 border-t border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${roleColors[role]} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{user.firstName} {user.lastName}</div>
                    <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs"
                  data-testid="button-logout"
                >
                  {t("common.logout")}
                </Button>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-6 gap-4 shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-toggle-sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1">
            <h1 className="text-sm font-semibold text-foreground">{t(activeItem?.label ?? "nav.dashboard")}</h1>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageToggle />
            <div className="text-xs text-muted-foreground hidden sm:block">
              {t("common.platformName")}
            </div>
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${roleColors[role]} flex items-center justify-center text-white text-xs font-bold`}>
              {user ? `${user.firstName[0]}${user.lastName[0]}` : "?"}
            </div>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 p-6 overflow-auto">
          <motion.div
            key={activeKey}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <PortalContent role={role} activeKey={activeKey} stats={stats} departments={departments} />
          </motion.div>
        </main>
      </div>

      {/* AI Chat Widget — available across all portals */}
      <AIChatWidget />
    </div>
  );
}

function PortalContent({ role, activeKey, stats, departments }: {
  role: string;
  activeKey: string;
  stats: any;
  departments: any;
}) {
  const { t } = useTranslation();

  // ── Employee Portal ──────────────────────────────────────────────────────
  if (role === "Employee" || role === "employee") {
    if (activeKey === "dashboard") return <EmployeeDashboard />;
    if (activeKey === "assessments") return <EmployeeAssessments />;
    if (activeKey === "learning") return <EmployeeLearning />;
    if (activeKey === "achievements") return <EmployeeAchievements />;
    if (activeKey === "phishing") return <EmployeePhishing />;
  }

  // ── Executive Portal ─────────────────────────────────────────────────────
  if (role === "Executive") {
    if (activeKey === "dashboard") return <ExecutiveDashboard />;
    if (activeKey === "risk") return <ExecutiveDashboard />;
    if (activeKey === "heatmap") return <ExecutiveDashboard />;
    if (activeKey === "reports" || activeKey === "ai") return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-center">
        <div className="text-4xl">{activeKey === "ai" ? "🤖" : "📊"}</div>
        <div className="text-lg font-semibold">{activeKey === "ai" ? t("ai.aiReports") : t("ai.executiveReports")}</div>
        <div className="text-sm text-muted-foreground max-w-sm">
          {activeKey === "ai"
            ? t("common.aiAssistantHint")
            : t("common.reportsComingSoon")}
        </div>
        {activeKey === "ai" && (
          <div className="mt-2 flex items-center gap-2 text-xs text-primary">
            <span>Look for the</span>
            <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm">🤖</span>
            <span>button at the bottom right</span>
          </div>
        )}
      </div>
    );
    return <ExecutiveDashboard />;
  }

  // ── HR Portal ────────────────────────────────────────────────────────────
  if (role === "HR") {
    if (activeKey === "dashboard") return <HRDashboard />;
    if (activeKey === "learning") return <HRDashboard />;
    if (activeKey === "risk") return <HRDashboard />;
    if (activeKey === "employees") return <HRDashboard />;
    if (activeKey === "reports") return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-center">
        <div className="text-4xl">📋</div>
        <div className="text-lg font-semibold">{t("nav.reports")}</div>
        <div className="text-sm text-muted-foreground max-w-sm">
          {t("common.hrReportsComingSoon")}
        </div>
      </div>
    );
    return <HRDashboard />;
  }

  // ── Admin Portal ──────────────────────────────────────────────────────────
  if (role === "Admin") {
    if (activeKey === "users") return <AdminUsers />;
    if (activeKey === "departments") return <AdminDepartments />;
    if (activeKey === "courses") return <AdminCourses />;
    if (activeKey === "simulations") return <AdminSimulations />;
    if (activeKey === "assessments") return <AdminAssessments />;
    if (activeKey === "reports") return <AdminReports />;
    if (activeKey === "notifications") return <AdminNotifications />;
    if (activeKey === "settings") return <AdminSettings />;
    return <AdminDashboard />;
  }

  // ── Super Admin Portal ────────────────────────────────────────────────────
  if (role === "SuperAdmin") {
    if (activeKey === "tenants") return <SuperAdminTenants />;
    if (activeKey === "analytics") return <SuperAdminAnalytics />;
    if (activeKey === "audit") return <SuperAdminAuditLogs />;
    if (activeKey === "config") return <SuperAdminConfig />;
    if (activeKey === "monitoring") return <SuperAdminMonitoring />;
    if (activeKey === "ai" || activeKey === "licensing") return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-center">
        <div className="text-4xl">{activeKey === "ai" ? "🤖" : "🔑"}</div>
        <div className="text-lg font-semibold capitalize">{activeKey === "ai" ? "AI Configuration" : "Licensing"}</div>
        <div className="text-sm text-muted-foreground max-w-sm">
          {activeKey === "ai"
            ? t("common.moduleIncomingSub")
            : t("common.moduleIncomingSub")}
        </div>
      </div>
    );
    return <SuperAdminTenants />;
  }

  // ── Profile placeholder ──────────────────────────────────────────────────
  if (activeKey === "profile") return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-center">
      <div className="text-4xl">◯</div>
      <div className="text-lg font-semibold">{t("common.profileSettings")}</div>
      <div className="text-sm text-muted-foreground">{t("common.profileComingSoon")}</div>
    </div>
  );

  if (activeKey === "dashboard" || activeKey === "risk" || activeKey === "users" || activeKey === "tenants") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-1">{t(`roleTitle.${role}`)}</h2>
          <p className="text-sm text-muted-foreground">No data is available for this module yet.</p>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card/80 border border-border rounded-xl p-5">
              <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">{t("common.totalOperatives")}</div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground mt-1">{stats.recentSignups} new this week</div>
            </div>
            <div className="bg-card/80 border border-border rounded-xl p-5">
              <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">{t("nav.departments")}</div>
              <div className="text-2xl font-bold">{departments?.length ?? "—"}</div>
              <div className="text-xs text-muted-foreground mt-1">{t("common.activeDepartments")}</div>
            </div>
            <div className="bg-card/80 border border-border rounded-xl p-5">
              <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">{t("common.roleDistribution")}</div>
              <div className="space-y-1 mt-2">
                {stats.byRole?.slice(0, 3).map((r: any) => (
                  <div key={r.role} className="flex justify-between text-xs">
                    <span className="text-muted-foreground capitalize">{r.role}</span>
                    <span className="font-medium">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-4"
      >
        <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto">
          <div className="text-3xl font-mono text-primary">◈</div>
        </div>
        <h2 className="text-xl font-bold">{t("common.moduleIncoming")}</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          {t("common.moduleIncomingSub")}
        </p>
        <div className="flex gap-1 justify-center">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-primary"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
