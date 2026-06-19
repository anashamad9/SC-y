import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import i18n from "./i18next";

export type Lang = "en" | "ar";

export interface Translations {
  // Nav
  executiveDashboard: string;
  riskOverview: string;
  departmentHeatmap: string;
  reports: string;
  aiInsights: string;
  hrDashboard: string;
  learningProgress: string;
  riskDistribution: string;
  employeeManagement: string;
  // Common
  loading: string;
  search: string;
  employee: string;
  department: string;
  noData: string;
  // Executive KPIs
  orgRiskPosture: string;
  cciScore: string;
  humanRiskScore: string;
  avgCompliance: string;
  totalEmployees: string;
  cultureIndex: string;
  // Executive sections
  trendTitle: string;
  phishingResults: string;
  deptHeatmap: string;
  riskDist: string;
  maturityRadar: string;
  forecastTitle: string;
  forecast30: string;
  forecast60: string;
  forecast90: string;
  confidencePct: string;
  financialRisk: string;
  estimatedLoss: string;
  riskReduction: string;
  breachProbability: string;
  vulnerabilityRanking: string;
  complianceGauge: string;
  cciPrediction: string;
  hrsPrediction: string;
  // Phishing
  clickRate: string;
  reportRate: string;
  openRate: string;
  emailsSent: string;
  // HR
  hrPortalTitle: string;
  hrPortalSub: string;
  avgHumanRisk: string;
  avgXpEarned: string;
  avgStreak: string;
  learningByDept: string;
  employeeRoster: string;
  champions: string;
  championsTitle: string;
  engagementTitle: string;
  weeklyActive: string;
  engagementRate: string;
  courseCompletion: string;
  // AI
  aiTitle: string;
  aiSub: string;
  aiPlaceholder: string;
  aiClear: string;
  // Scores
  critical: string;
  high: string;
  medium: string;
  low: string;
  // Scores labels
  rank: string;
  level: string;
  xp: string;
  streak: string;
  badges: string;
  courses: string;
  lowerIsBetter: string;
  activeUsers: string;
  activeWorkforce: string;
  behaviorScore: string;
  cultureIndexSub: string;
  orgCultureHealth: string;
  engagementPts: string;
  consecutiveDays: string;
  executiveIntelligence: string;
  keyDimensions: string;
  complianceLabel: string;
  phishingDefense: string;
  riskLabel: string;
  usersLabel: string;
}

function makeT(lang: Lang): Translations {
  const t = (key: string) => i18n.t(key, { lng: lang }) as string;
  return {
    executiveDashboard: t("nav.executiveDashboard"),
    riskOverview: t("nav.riskOverview"),
    departmentHeatmap: t("nav.departmentHeatmap"),
    reports: t("nav.reports"),
    aiInsights: t("nav.aiInsights"),
    hrDashboard: t("nav.hrDashboard"),
    learningProgress: t("nav.learningProgress"),
    riskDistribution: t("nav.riskDistribution"),
    employeeManagement: t("nav.employeeManagement"),
    loading: t("common.loading"),
    search: t("common.search"),
    employee: lang === "ar" ? "موظف" : "Employee",
    department: lang === "ar" ? "القسم" : "Department",
    noData: t("common.noData"),
    orgRiskPosture: t("executive.orgRiskPosture"),
    cciScore: t("executive.cciScore"),
    humanRiskScore: t("executive.humanRiskScore"),
    avgCompliance: t("executive.avgCompliance"),
    totalEmployees: t("executive.totalEmployees"),
    cultureIndex: t("executive.cultureIndex"),
    trendTitle: lang === "ar" ? "اتجاه CCI والمخاطر (12 أسبوعاً)" : "CCI & Risk Trend (12 weeks)",
    phishingResults: t("executive.phishingResults"),
    deptHeatmap: t("nav.departmentHeatmap"),
    riskDist: t("nav.riskDistribution"),
    maturityRadar: t("executive.maturityRadar"),
    forecastTitle: t("executive.forecastTitle"),
    forecast30: t("executive.forecast30"),
    forecast60: t("executive.forecast60"),
    forecast90: t("executive.forecast90"),
    confidencePct: t("executive.confidencePct"),
    financialRisk: t("executive.financialRisk"),
    estimatedLoss: t("executive.estimatedLoss"),
    riskReduction: t("executive.riskReduction"),
    breachProbability: t("executive.breachProbability"),
    vulnerabilityRanking: t("executive.vulnerabilityRanking"),
    complianceGauge: t("executive.complianceGauge"),
    cciPrediction: t("executive.cciPrediction"),
    hrsPrediction: t("executive.hrsPrediction"),
    clickRate: t("executive.clickRate"),
    reportRate: t("executive.reportRate"),
    openRate: t("executive.openRate"),
    emailsSent: t("executive.emailsSent"),
    hrPortalTitle: t("hr.portalTitle"),
    hrPortalSub: t("hr.portalSub"),
    avgHumanRisk: t("hr.avgHumanRisk"),
    avgXpEarned: t("hr.avgXpEarned"),
    avgStreak: t("hr.avgStreak"),
    learningByDept: t("hr.learningByDept"),
    employeeRoster: t("hr.employeeRoster"),
    champions: lang === "ar" ? "أبطال الأمن" : "Security Champions",
    championsTitle: t("hr.championsTitle"),
    engagementTitle: t("hr.engagementTitle"),
    weeklyActive: t("hr.weeklyActive"),
    engagementRate: t("hr.engagementRate"),
    courseCompletion: t("hr.courseCompletion"),
    aiTitle: t("ai.title"),
    aiSub: t("ai.sub"),
    aiPlaceholder: t("ai.placeholder"),
    aiClear: t("ai.clear"),
    critical: t("risk.critical"),
    high: t("risk.high"),
    medium: t("risk.medium"),
    low: t("risk.low"),
    rank: lang === "ar" ? "الترتيب" : "Rank",
    level: lang === "ar" ? "المستوى" : "Level",
    xp: lang === "ar" ? "نقاط" : "XP",
    streak: lang === "ar" ? "استمرارية" : "Streak",
    badges: lang === "ar" ? "شارات" : "Badges",
    courses: lang === "ar" ? "دورات" : "Courses",
    lowerIsBetter: lang === "ar" ? "كلما انخفض كان أفضل" : "Lower is better",
    activeUsers: lang === "ar" ? "مستخدمون نشطون" : "Active users",
    activeWorkforce: lang === "ar" ? "القوى العاملة النشطة" : "Active workforce",
    behaviorScore: lang === "ar" ? "درجة السلوك" : "Behavior score",
    cultureIndexSub: lang === "ar" ? "مؤشر الثقافة الأمنية" : "Cyber Culture Index",
    orgCultureHealth: lang === "ar" ? "صحة الثقافة المؤسسية" : "Org culture health",
    engagementPts: lang === "ar" ? "نقاط التفاعل" : "Engagement pts",
    consecutiveDays: lang === "ar" ? "أيام متتالية" : "Consecutive days",
    executiveIntelligence: lang === "ar" ? "الاستخبارات التنفيذية" : "Executive Intelligence",
    keyDimensions: lang === "ar" ? "الأبعاد الرئيسية" : "Key Dimensions",
    complianceLabel: lang === "ar" ? "الامتثال" : "Compliance",
    phishingDefense: lang === "ar" ? "الدفاع ضد التصيد" : "Phishing Defense",
    riskLabel: lang === "ar" ? "مستوى المخاطر" : "Risk",
    usersLabel: lang === "ar" ? "موظف" : "users",
  };
}

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextValue>({
  lang: "en",
  setLang: () => {},
  t: makeT("en"),
  isRTL: false,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "en";
    return (localStorage.getItem("ccx-lang") as Lang) ?? "en";
  });

  function setLang(l: Lang) {
    setLangState(l);
    if (typeof window !== "undefined") {
      localStorage.setItem("ccx-lang", l);
    }
    i18n.changeLanguage(l);
  }

  const isRTL = lang === "ar";

  useEffect(() => {
    i18n.changeLanguage(lang);
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang, isRTL]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t: makeT(lang), isRTL }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
