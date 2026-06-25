import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useGetMe, useLogout, useGetUserStats, useListDepartments } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logo from "@/assets/logo";
import { useI18n } from "@/lib/i18n";
import { useTranslation } from "react-i18next";
import {
  Activity,
  Award,
  BarChart3,
  BookOpen,
  Bot,
  Building2,
  ClipboardCheck,
  FileText,
  KeyRound,
  Languages,
  LayoutDashboard,
  LogOut,
  Menu,
  Monitor,
  Network,
  PieChart,
  ScrollText,
  Settings,
  ShieldAlert,
  Target,
  UserCircle,
  Users,
  type LucideIcon,
} from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";
import ReadinessAssessmentModal from "@/components/readiness-assessment-modal";
import EmployeeDashboard from "./employee/EmployeeDashboard";
import EmployeeAssessments from "./employee/EmployeeAssessments";
import EmployeeLearning from "./employee/EmployeeLearning";
import EmployeeAchievements from "./employee/EmployeeAchievements";
import EmployeePhishing from "./employee/EmployeePhishing";
import AdminDashboard from "./admin/AdminDashboard";
import AdminUsers from "./admin/AdminUsers";
import AdminDepartments from "./admin/AdminDepartments";
import AdminCourses from "./admin/AdminCourses";
import AdminSimulations from "./admin/AdminSimulations";
import AdminReports from "./admin/AdminReports";
import SuperAdminTenants from "./superadmin/SuperAdminTenants";
import SuperAdminAuditLogs from "./superadmin/SuperAdminAuditLogs";
import SuperAdminMonitoring from "./superadmin/SuperAdminMonitoring";
import AdminAssessments from "./admin/AdminAssessments";
import SuperAdminAnalytics from "./superadmin/SuperAdminAnalytics";
import SuperAdminRequests from "./superadmin/SuperAdminRequests";
import SuperAdminConfig from "./superadmin/SuperAdminConfig";
import ExecutiveDashboard from "./executive/ExecutiveDashboard";
import HRDashboard from "./hr/HRDashboard";
import AIChatWidget from "@/components/AIChatWidget";
import { API_BASE } from "@/lib/runtime";

interface NavItem {
  label: string;
  icon: LucideIcon;
  key: string;
}

const navByRole: Record<string, NavItem[]> = {
  Employee: [
    { label: "nav.dashboard", icon: LayoutDashboard, key: "dashboard" },
    { label: "nav.myAssessments", icon: ClipboardCheck, key: "assessments" },
    { label: "nav.learning", icon: BookOpen, key: "learning" },
    { label: "nav.achievements", icon: Award, key: "achievements" },
    { label: "nav.phishingResults", icon: Target, key: "phishing" },
    { label: "nav.profile", icon: UserCircle, key: "profile" },
  ],
  Executive: [
    { label: "nav.executiveDashboard", icon: LayoutDashboard, key: "dashboard" },
    { label: "nav.riskOverview", icon: ShieldAlert, key: "risk" },
    { label: "nav.departmentHeatmap", icon: Network, key: "heatmap" },
    { label: "nav.reports", icon: FileText, key: "reports" },
    { label: "nav.aiInsights", icon: Bot, key: "ai" },
    { label: "nav.profile", icon: UserCircle, key: "profile" },
  ],
  HR: [
    { label: "nav.hrDashboard", icon: LayoutDashboard, key: "dashboard" },
    { label: "nav.learningProgress", icon: BarChart3, key: "learning" },
    { label: "nav.riskDistribution", icon: PieChart, key: "risk" },
    { label: "nav.employeeManagement", icon: Users, key: "employees" },
    { label: "nav.reports", icon: FileText, key: "reports" },
    { label: "nav.profile", icon: UserCircle, key: "profile" },
  ],
  Admin: [
    { label: "nav.users", icon: Users, key: "users" },
    { label: "nav.departments", icon: Building2, key: "departments" },
    { label: "nav.courses", icon: BookOpen, key: "courses" },
    { label: "nav.simulations", icon: Target, key: "simulations" },
    { label: "nav.assessments", icon: ClipboardCheck, key: "assessments" },
    { label: "nav.reports", icon: FileText, key: "reports" },
    { label: "nav.profile", icon: UserCircle, key: "profile" },
  ],
  SuperAdmin: [
    { label: "nav.requests", icon: Users, key: "requests" },
    { label: "nav.tenants", icon: Building2, key: "tenants" },
    { label: "nav.settings", icon: Settings, key: "config" },
    { label: "nav.analytics", icon: Activity, key: "analytics" },
    { label: "nav.courses", icon: BookOpen, key: "courses" },
    { label: "nav.licensing", icon: KeyRound, key: "licensing" },
    { label: "nav.auditLogs", icon: ScrollText, key: "audit" },
    { label: "nav.monitoring", icon: Monitor, key: "monitoring" },
    { label: "nav.profile", icon: UserCircle, key: "profile" },
  ],
};

const roleColors: Record<string, string> = {
  Employee: "from-blue-600 to-blue-800",
  employee: "from-blue-600 to-blue-800",
  Executive: "from-primary to-red-900",
  executive: "from-primary to-red-900",
  HR: "from-purple-600 to-purple-800",
  hr: "from-purple-600 to-purple-800",
  Admin: "from-orange-600 to-orange-800",
  admin: "from-orange-600 to-orange-800",
  SuperAdmin: "from-primary to-red-900",
  superadmin: "from-primary to-red-900",
};

function roleColorClass(role: string) {
  return roleColors[role] ?? roleColors.Employee;
}

function useRoleTitle(role: string): string {
  const { t } = useTranslation();
  return t(`roleTitle.${role}`, { defaultValue: role });
}

function LanguageToggle() {
  const { lang, setLang } = useI18n();
  return (
    <button
      onClick={() => setLang(lang === "en" ? "ar" : "en")}
      className="flex min-h-8 flex-1 items-center justify-center gap-1.5 rounded-md bg-card px-2.5 py-1 text-[11px] font-medium text-primary border border-border transition-colors hover:bg-muted"
      title="Toggle language / تغيير اللغة"
    >
      <Languages className="h-3.5 w-3.5" />
      <span className="font-mono">{lang === "en" ? "العربية" : "English"}</span>
    </button>
  );
}

function UserAvatar({ user, role, className = "h-9 w-9" }: { user: any; role: string; className?: string }) {
  const initials = user ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}` : "?";
  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={`${user.firstName} ${user.lastName}`}
        className={`${className} rounded-full object-cover border border-border bg-background shrink-0`}
      />
    );
  }

  return (
    <div className={`${className} rounded-full bg-gradient-to-br ${roleColorClass(role)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
      {initials}
    </div>
  );
}

function ProfileSettings({ user }: { user: any }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    jobTitle: user?.jobTitle ?? "",
    avatarUrl: user?.avatarUrl ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [imageMessage, setImageMessage] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      jobTitle: user?.jobTitle ?? "",
      avatarUrl: user?.avatarUrl ?? "",
    });
  }, [user?.firstName, user?.lastName, user?.jobTitle, user?.avatarUrl]);

  if (!user) {
    return <div className="text-sm text-muted-foreground">Loading profile...</div>;
  }

  async function saveProfile() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`${API_BASE}/api/users/${user.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error("Profile update failed");
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setMessage("Profile updated");
    } catch {
      setMessage("Could not update profile");
    } finally {
      setSaving(false);
    }
  }

  function handleAvatarFile(file?: File) {
    setImageMessage(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageMessage("Choose an image file.");
      return;
    }
    if (file.size > 1024 * 1024) {
      setImageMessage("Profile image must be 1MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm(f => ({ ...f, avatarUrl: String(reader.result ?? "") }));
      setImageMessage("Image selected. Save profile to apply it.");
    };
    reader.onerror = () => setImageMessage("Could not read image.");
    reader.readAsDataURL(file);
  }

  async function changePassword() {
    setPasswordMessage(null);
    try {
      const response = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(passwordForm),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Password update failed");
      setPasswordForm({ currentPassword: "", newPassword: "" });
      setPasswordMessage(data.message || "Password updated");
    } catch (error: any) {
      setPasswordMessage(error.message || "Password update failed");
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h2 className="text-lg font-bold mb-1">Profile Settings</h2>
        <p className="text-sm text-muted-foreground">Manage the account details stored in the database.</p>
      </div>
      <div className="bg-card rounded-lg p-5 border border-border space-y-4">
        <div className="flex items-center gap-3">
          <UserAvatar user={{ ...user, avatarUrl: form.avatarUrl, firstName: form.firstName, lastName: form.lastName }} role={user.role ?? "Employee"} className="h-12 w-12" />
          <div>
            <div className="text-sm font-semibold">{form.firstName} {form.lastName}</div>
            <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-background p-3 space-y-2">
          <label className="text-xs text-muted-foreground block">Profile Image</label>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={e => handleAvatarFile(e.target.files?.[0])}
              className="max-w-xs"
            />
            <Button type="button" size="sm" variant="outline" onClick={() => setForm(f => ({ ...f, avatarUrl: "" }))}>
              Remove Image
            </Button>
          </div>
          {imageMessage && <div className="text-xs text-muted-foreground">{imageMessage}</div>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">First Name</label>
            <Input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Last Name</label>
            <Input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Job Title</label>
            <Input value={form.jobTitle} onChange={e => setForm(f => ({ ...f, jobTitle: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Avatar URL</label>
            <Input value={form.avatarUrl} onChange={e => setForm(f => ({ ...f, avatarUrl: e.target.value }))} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={saveProfile} disabled={saving || !form.firstName || !form.lastName}>
            {saving ? "Saving..." : "Save Profile"}
          </Button>
          {message && <span className="text-xs text-muted-foreground">{message}</span>}
        </div>
      </div>
      <div className="bg-card rounded-lg p-5 border border-border space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Password</h3>
          <p className="text-xs text-muted-foreground">Change your password using your current credentials.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            type="password"
            value={passwordForm.currentPassword}
            onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
            placeholder="Current password"
          />
          <Input
            type="password"
            value={passwordForm.newPassword}
            onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
            placeholder="New password"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={changePassword} disabled={!passwordForm.currentPassword || passwordForm.newPassword.length < 8}>
            Change Password
          </Button>
          {passwordMessage && <span className="text-xs text-muted-foreground">{passwordMessage}</span>}
        </div>
      </div>
    </div>
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

  const needsReadinessAssessment =
    role === "Employee" &&
    user &&
    (user as any).approvalStatus === "approved" &&
    !(user as any).onboardingCompleted;

  if (needsReadinessAssessment) {
    return <ReadinessAssessmentModal />;
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
            className="sticky top-0 h-screen w-64 bg-card text-card-foreground flex flex-col shrink-0 border-r border-border"
          >
            {/* Logo */}
            <div className="px-5 py-4">
              <Link href="/" className="flex items-center gap-3.5">
                <img src={logo} alt="The Harvesters Logo" className="h-12 w-10 object-contain" />
                <div>
                  <div className="font-bold text-sm tracking-[0.22em] text-foreground">CYBERCULTX</div>
                  <div className="text-sm text-muted-foreground">{t(`roleTitle.${role}`)}</div>
                </div>
              </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 pb-3 space-y-1 overflow-hidden">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeKey === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveKey(item.key)}
                    data-testid={`nav-${item.key}`}
                    className={`w-full flex min-h-8 items-center gap-2.5 rounded-lg px-3 py-1.5 text-left text-xs font-medium transition-colors ${
                      active
                        ? "bg-primary text-white"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-muted-foreground"}`} strokeWidth={2} />
                    <span className="truncate">{t(item.label)}</span>
                  </button>
                );
              })}
            </nav>

            {/* User info */}
            {user && (
              <div className="mt-auto p-3 space-y-2 border-t border-border">
                <div className="flex gap-2">
                  <ThemeToggle />
                  <LanguageToggle />
                </div>
                <button
                  onClick={() => setActiveKey("profile")}
                  className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors ${
                    activeKey === "profile" ? "bg-primary text-white" : "bg-background hover:bg-muted"
                  }`}
                  data-testid="button-sidebar-profile"
                >
                  <UserAvatar user={user} role={role} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{user.firstName} {user.lastName}</div>
                    <div className={`text-xs capitalize ${activeKey === "profile" ? "text-white/80" : "text-muted-foreground"}`}>{user.role}</div>
                  </div>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex min-h-9 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium text-primary transition-colors hover:bg-muted"
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4" />
                  {t("common.logout")}
                </button>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-card/50 backdrop-blur-sm flex items-center px-4 gap-3 shrink-0 border-b border-border">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            data-testid="button-toggle-sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="flex-1">
            <h1 className="text-sm font-semibold text-foreground">{t(activeItem?.label ?? "nav.dashboard")}</h1>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setActiveKey("profile")} className="rounded-full" data-testid="button-topbar-profile">
              <UserAvatar user={user} role={role} className="h-7 w-7" />
            </button>
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
            <PortalContent role={role} activeKey={activeKey} stats={stats} departments={departments} user={user} />
          </motion.div>
        </main>
      </div>

      {/* AI Chat Widget — available across all portals */}
      <AIChatWidget />

    </div>
  );
}

function PortalContent({ role, activeKey, stats, departments, user }: {
  role: string;
  activeKey: string;
  stats: any;
  departments: any;
  user?: any;
}) {
  const { t } = useTranslation();

  if (activeKey === "profile") return <ProfileSettings user={user} />;

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
    if (activeKey === "reports") return <AdminReports />;
    if (activeKey === "ai") return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-center">
        <img src={logo} alt="The Harvesters Logo" className="h-14 w-10 object-contain" />
        <div className="text-lg font-semibold">{t("ai.aiReports")}</div>
        <div className="text-sm text-muted-foreground max-w-sm">
          {t("common.aiAssistantHint")}
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-primary">
          <span>Look for the</span>
          <span className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center">
            <img src={logo} alt="The Harvesters Logo" className="h-6 w-5 object-contain" />
          </span>
          <span>button at the bottom right</span>
        </div>
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
    if (activeKey === "reports") return <AdminReports />;
    return <HRDashboard />;
  }

  // ── Admin Portal ──────────────────────────────────────────────────────────
  if (role === "Admin") {
    if (activeKey === "users") return <AdminUsers />;
    if (activeKey === "departments") return <AdminDepartments />;
    if (activeKey === "courses") return <AdminCourses canManage={false} />;
    if (activeKey === "simulations") return <AdminSimulations />;
    if (activeKey === "assessments") return <AdminAssessments />;
    if (activeKey === "reports") return <AdminReports />;
    return <AdminDashboard />;
  }

  // ── Super Admin Portal ────────────────────────────────────────────────────
  if (role === "SuperAdmin") {
    if (activeKey === "requests") return <SuperAdminRequests />;
    if (activeKey === "tenants") return <SuperAdminTenants />;
    if (activeKey === "config") return <SuperAdminConfig />;
    if (activeKey === "analytics") return <SuperAdminAnalytics />;
    if (activeKey === "courses") return <AdminCourses canManage />;
    if (activeKey === "audit") return <SuperAdminAuditLogs />;
    if (activeKey === "monitoring") return <SuperAdminMonitoring />;
    if (activeKey === "licensing") return <SuperAdminTenants />;
    return <SuperAdminTenants />;
  }

  if (role === "Employee" || role === "employee") return <EmployeeDashboard />;
  if (role === "Executive") return <ExecutiveDashboard />;
  if (role === "HR") return <HRDashboard />;
  if (role === "Admin") return <AdminDashboard />;
  if (role === "SuperAdmin") return <SuperAdminTenants />;
  return <EmployeeDashboard />;
}
