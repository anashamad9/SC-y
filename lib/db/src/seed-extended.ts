import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { eq, count } from "drizzle-orm";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

// Deterministic pseudo-random for reproducible seed data
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = Math.imul(1664525, s) + 1013904223 | 0;
    return (s >>> 0) / 0xffffffff;
  };
}

const COURSES = [
  { title: "Password Security Mastery", category: "password_security", description: "Master the art of creating unbreakable passwords, multi-factor authentication, and credential hygiene in the modern threat landscape.", thumbnailColor: "#dc143c", durationMinutes: 25, xpReward: 120, difficulty: "beginner", lessonCount: 4, displayOrder: 1 },
  { title: "Social Engineering Defense", category: "social_engineering", description: "Identify and neutralize social engineering attacks — pretexting, vishing, baiting, and authority manipulation techniques used by adversaries.", thumbnailColor: "#7c3aed", durationMinutes: 35, xpReward: 150, difficulty: "intermediate", lessonCount: 5, displayOrder: 2 },
  { title: "Email Security & Phishing", category: "email_security", description: "Detect sophisticated phishing campaigns, business email compromise (BEC), and malicious attachments using advanced analysis techniques.", thumbnailColor: "#0891b2", durationMinutes: 30, xpReward: 130, difficulty: "intermediate", lessonCount: 4, displayOrder: 3 },
  { title: "QR Code & Physical Attacks", category: "phishing", description: "Understand QR code phishing (quishing), evil twin networks, and physical intrusion tactics deployed in hybrid attack scenarios.", thumbnailColor: "#b45309", durationMinutes: 20, xpReward: 100, difficulty: "intermediate", lessonCount: 3, displayOrder: 4 },
  { title: "Deepfake Awareness", category: "deepfake_awareness", description: "Recognize AI-generated deepfake audio, video, and images used in fraud campaigns and corporate espionage operations.", thumbnailColor: "#be185d", durationMinutes: 28, xpReward: 140, difficulty: "advanced", lessonCount: 4, displayOrder: 5 },
  { title: "AI Security Risks", category: "ai_security", description: "Understand prompt injection, model manipulation, data poisoning, and AI-assisted cyberattacks reshaping the threat landscape.", thumbnailColor: "#065f46", durationMinutes: 40, xpReward: 160, difficulty: "advanced", lessonCount: 5, displayOrder: 6 },
  { title: "Remote Work Security", category: "remote_work", description: "Secure home office environments, VPN best practices, endpoint protection, and safe collaboration tool configurations.", thumbnailColor: "#1e40af", durationMinutes: 30, xpReward: 120, difficulty: "beginner", lessonCount: 4, displayOrder: 7 },
  { title: "Data Protection & Privacy", category: "data_protection", description: "Handle sensitive data responsibly — classification, encryption, secure transfer, and regulatory compliance (GDPR, PDPL).", thumbnailColor: "#4a044e", durationMinutes: 35, xpReward: 150, difficulty: "intermediate", lessonCount: 5, displayOrder: 8 },
  { title: "Cloud Security Fundamentals", category: "cloud_security", description: "Protect cloud workloads, understand shared responsibility models, and implement zero-trust access controls in multi-cloud environments.", thumbnailColor: "#134e4a", durationMinutes: 45, xpReward: 180, difficulty: "advanced", lessonCount: 6, displayOrder: 9 },
  { title: "Mobile & Device Security", category: "mobile_security", description: "Secure mobile devices against malware, rogue apps, Bluetooth attacks, and mobile phishing targeting the GCC workforce.", thumbnailColor: "#7f1d1d", durationMinutes: 25, xpReward: 110, difficulty: "beginner", lessonCount: 4, displayOrder: 10 },
  { title: "أمن كلمة المرور", category: "password_security", description: "أتقن فن إنشاء كلمات مرور قوية والمصادقة متعددة العوامل وإدارة بيانات الاعتماد في بيئة التهديدات الحديثة.", thumbnailColor: "#dc143c", durationMinutes: 25, xpReward: 120, difficulty: "beginner", lessonCount: 4, displayOrder: 11 },
  { title: "الهندسة الاجتماعية والتلاعب البشري", category: "social_engineering", description: "تعرف على هجمات الهندسة الاجتماعية وكيفية التصدي لها — التذرع والتصيد الصوتي والإغراء وأساليب التلاعب السلطوي.", thumbnailColor: "#7c3aed", durationMinutes: 35, xpReward: 150, difficulty: "intermediate", lessonCount: 5, displayOrder: 12 },
  { title: "أمن البريد الإلكتروني والتصيد الاحتيالي", category: "email_security", description: "اكتشف حملات التصيد الاحتيالي المتطورة واختراق البريد الإلكتروني التجاري والمرفقات الخبيثة باستخدام تقنيات التحليل المتقدمة.", thumbnailColor: "#0891b2", durationMinutes: 30, xpReward: 130, difficulty: "intermediate", lessonCount: 4, displayOrder: 13 },
  { title: "مخاطر الذكاء الاصطناعي الأمنية", category: "ai_security", description: "افهم حقن الأوامر ومعالجة النماذج وتسميم البيانات والهجمات الإلكترونية المدعومة بالذكاء الاصطناعي التي تعيد تشكيل مشهد التهديدات.", thumbnailColor: "#065f46", durationMinutes: 40, xpReward: 160, difficulty: "advanced", lessonCount: 5, displayOrder: 14 },
  { title: "حماية البيانات والخصوصية", category: "data_protection", description: "تعامل مع البيانات الحساسة بمسؤولية — التصنيف والتشفير والنقل الآمن والامتثال التنظيمي (GDPR وPDPL).", thumbnailColor: "#4a044e", durationMinutes: 35, xpReward: 150, difficulty: "intermediate", lessonCount: 5, displayOrder: 15 },
];

const LESSON_TEMPLATES = [
  { title: "Introduction & Threat Landscape", type: "video", xpReward: 20 },
  { title: "Core Concepts & Techniques", type: "slides", xpReward: 25 },
  { title: "Live Scenario: Identify the Threat", type: "scenario", xpReward: 35 },
  { title: "Knowledge Check Quiz", type: "quiz", xpReward: 30 },
  { title: "Advanced Tactics & Case Studies", type: "video", xpReward: 25 },
  { title: "Final Assessment", type: "quiz", xpReward: 40 },
];

const BADGES = [
  { name: "First Step", description: "Completed your first assessment", iconName: "⭐", category: "assessment", xpRequired: 0 },
  { name: "Quick Learner", description: "Completed your first course", iconName: "📚", category: "learning", xpRequired: 0 },
  { name: "Cyber Aware", description: "Scored above 75 on Security Awareness", iconName: "🔍", category: "assessment", xpRequired: 0 },
  { name: "Security Champion", description: "Reached a Low risk category", iconName: "🛡️", category: "achievement", xpRequired: 0 },
  { name: "Streak Warrior", description: "Maintained a 7-day learning streak", iconName: "🔥", category: "streak", xpRequired: 0 },
  { name: "Knowledge Hunter", description: "Completed 3 courses", iconName: "🎯", category: "learning", xpRequired: 0 },
  { name: "Risk Reducer", description: "Improved HRS by 10+ points", iconName: "📉", category: "achievement", xpRequired: 0 },
  { name: "Culture Contributor", description: "Earned 500+ XP", iconName: "💎", category: "achievement", xpRequired: 500 },
  { name: "Elite Operative", description: "Earned 1000+ XP", iconName: "🏆", category: "achievement", xpRequired: 1000 },
  { name: "Compliance Master", description: "Scored above 80 on all compliance behaviors", iconName: "✅", category: "assessment", xpRequired: 0 },
  { name: "Phishing Hunter", description: "Completed the Email Security & Phishing course", iconName: "🎣", category: "learning", xpRequired: 0 },
  { name: "Vigilant Defender", description: "Completed 5 courses", iconName: "🦅", category: "learning", xpRequired: 0 },
];

const PSYCHOMETRIC_QUESTIONS = [
  // risk_tolerance
  { text: "I am comfortable sharing my device with trusted colleagues when needed.", category: "risk_tolerance", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  { text: "I sometimes skip security warnings if they slow down my work.", category: "risk_tolerance", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  { text: "I prefer convenience over strict security procedures.", category: "risk_tolerance", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  { text: "Security policies in my organization are often overly cautious.", category: "risk_tolerance", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  { text: "I take calculated risks when I believe the benefit outweighs the threat.", category: "risk_tolerance", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  // impulsiveness
  { text: "I react quickly to emails marked as urgent without fully reading them.", category: "impulsiveness", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  { text: "I often make decisions without waiting for complete information.", category: "impulsiveness", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  { text: "I click links in messages before verifying their source.", category: "impulsiveness", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  { text: "I prefer to act fast rather than deliberate for a long time.", category: "impulsiveness", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  { text: "I sometimes approve access requests before fully reviewing them.", category: "impulsiveness", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  // security_awareness
  { text: "I can reliably identify phishing attempts in emails.", category: "security_awareness", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  { text: "I regularly update my passwords and avoid reusing them.", category: "security_awareness", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  { text: "I verify the identity of callers before sharing sensitive information.", category: "security_awareness", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  { text: "I understand the dangers of using public Wi-Fi without a VPN.", category: "security_awareness", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  { text: "I know the correct procedure to report a security incident.", category: "security_awareness", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  // decision_making
  { text: "I carefully verify information from multiple sources before acting on it.", category: "decision_making", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  { text: "I consult established policies before making security-related decisions.", category: "decision_making", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  { text: "I evaluate all available options before committing to an action.", category: "decision_making", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  { text: "I seek clarification whenever instructions seem ambiguous or unusual.", category: "decision_making", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  { text: "I document my reasoning when making important security decisions.", category: "decision_making", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  // attention_to_detail
  { text: "I notice unusual patterns in system behavior before they become incidents.", category: "attention_to_detail", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  { text: "I carefully read documents in full before signing or approving them.", category: "attention_to_detail", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  { text: "I check the full email address of senders before replying with sensitive info.", category: "attention_to_detail", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  { text: "I review app permissions carefully before installation.", category: "attention_to_detail", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  { text: "I notice subtle discrepancies in URLs or domain names.", category: "attention_to_detail", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  // trust_tendencies
  { text: "I generally trust requests from people who claim to be in authority.", category: "trust_tendencies", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  { text: "I tend to assume emails from known domain names are legitimate.", category: "trust_tendencies", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  { text: "I open attachments from familiar-looking senders without hesitation.", category: "trust_tendencies", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  { text: "I rarely question the identity of someone requesting system access.", category: "trust_tendencies", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  { text: "I believe most people in my organization have good intentions.", category: "trust_tendencies", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  // stress_response
  { text: "I maintain clear judgment and follow protocols under time pressure.", category: "stress_response", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  { text: "I follow all security steps even in genuinely urgent situations.", category: "stress_response", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  { text: "Urgency never causes me to bypass my standard security behaviors.", category: "stress_response", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  { text: "I can calmly resist pressure from authority to skip security steps.", category: "stress_response", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  { text: "I stay composed when I receive alarming or threatening messages.", category: "stress_response", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  // compliance_behavior
  { text: "I follow all data handling and classification policies in my organization.", category: "compliance_behavior", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  { text: "I complete mandatory security training on time without reminders.", category: "compliance_behavior", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  { text: "I report policy violations I observe — even when it is uncomfortable.", category: "compliance_behavior", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  { text: "I adhere to clean desk and clear screen policies consistently.", category: "compliance_behavior", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
  { text: "I follow the documented incident response procedure without shortcuts.", category: "compliance_behavior", options: [{value:1,label:"Strongly Disagree"},{value:2,label:"Disagree"},{value:3,label:"Neutral"},{value:4,label:"Agree"},{value:5,label:"Strongly Agree"}] },
];

const CYBER_BEHAVIOR_QUESTIONS = [
  { text: "You receive an email from 'IT Support' asking you to click a link to verify your credentials urgently. What do you do?", category: "phishing_recognition", options: [{value:0,label:"Click the link immediately — it looks official"},{value:25,label:"Click it but only enter minimal info"},{value:75,label:"Hover over the link to check before clicking"},{value:100,label:"Report it and verify with IT through official channels"}] },
  { text: "You notice the URL of your company's login portal is slightly different from usual. What is your response?", category: "phishing_recognition", options: [{value:0,label:"Proceed and log in — probably just a redesign"},{value:50,label:"Log in but change my password afterwards"},{value:75,label:"Close the tab and navigate to the site manually"},{value:100,label:"Alert the security team and do not enter credentials"}] },
  { text: "How frequently do you use unique, complex passwords for work systems?", category: "password_hygiene", options: [{value:0,label:"I use the same password for most systems"},{value:33,label:"I reuse passwords with minor variations"},{value:66,label:"I use unique passwords for important systems only"},{value:100,label:"Always — I use a password manager for all accounts"}] },
  { text: "You receive a call from someone claiming to be from your bank asking for your OTP. What do you do?", category: "social_engineering", options: [{value:0,label:"Provide the OTP — they seem legitimate"},{value:25,label:"Ask for their employee ID and then provide it"},{value:75,label:"Refuse and call the bank directly to verify"},{value:100,label:"Refuse, hang up, and report the attempt to security"}] },
  { text: "A colleague leaves a USB drive on your desk labelled 'Q3 Salary Report'. What do you do?", category: "device_security", options: [{value:0,label:"Plug it in immediately — I am curious"},{value:25,label:"Plug it in on a non-critical machine to see the contents"},{value:75,label:"Ask my colleague about it before plugging it in"},{value:100,label:"Hand it to IT without plugging it in anywhere"}] },
  { text: "You are working from a café and need to access company systems. What do you do?", category: "remote_work", options: [{value:0,label:"Connect directly using the café Wi-Fi"},{value:33,label:"Use the café Wi-Fi but log out when done"},{value:66,label:"Use my mobile hotspot instead"},{value:100,label:"Connect via VPN on mobile hotspot and ensure no one can see my screen"}] },
  { text: "You accidentally sent a client file to the wrong email address. What is your next step?", category: "data_handling", options: [{value:0,label:"Hope they do not read it — nothing I can do"},{value:33,label:"Email them asking to delete it"},{value:66,label:"Report to my manager privately"},{value:100,label:"Immediately report to my data protection officer and follow incident procedures"}] },
  { text: "Your organization experiences a ransomware attack. Which is your first action?", category: "incident_response", options: [{value:0,label:"Try to remove the ransomware myself"},{value:33,label:"Shut down my machine and wait for instructions"},{value:66,label:"Disconnect from the network and inform my team lead"},{value:100,label:"Immediately follow the incident response plan, isolate systems, and notify the security team"}] },
];

async function main() {
  console.log("🌱 Seeding extended data...");

  // Check if already seeded
  const [{ value: courseCount }] = await db.select({ value: count() }).from(schema.coursesTable);
  if (Number(courseCount) > 0) {
    console.log("✅ Extended data already seeded. Skipping.");
    await pool.end();
    return;
  }

  // 1. Courses + Lessons
  console.log("📚 Inserting courses...");
  for (const course of COURSES) {
    const [inserted] = await db.insert(schema.coursesTable).values(course).returning();
    const lessonCount = course.lessonCount;
    for (let i = 0; i < lessonCount; i++) {
      const tmpl = LESSON_TEMPLATES[i % LESSON_TEMPLATES.length];
      await db.insert(schema.lessonsTable).values({
        courseId: inserted.id,
        title: tmpl.title,
        type: tmpl.type,
        xpReward: tmpl.xpReward,
        displayOrder: i + 1,
        content: tmpl.type === "quiz" ? JSON.stringify([
          { question: "What is the primary defense against this threat?", options: ["Ignore it", "Report it", "Share credentials", "Disable security"], correct: 1 },
          { question: "Which behavior increases your risk exposure most?", options: ["Using VPN", "Reusing passwords", "Locking screen", "Reporting incidents"], correct: 1 },
        ]) : null,
      });
    }
  }

  // 2. Assessments + Questions
  console.log("📋 Inserting assessments and questions...");
  const [psychoAssessment] = await db.insert(schema.assessmentsTable).values({
    type: "psychometric",
    title: "Psychometric Security Profile",
    description: "A comprehensive 40-question behavioral assessment that maps your security instincts, risk tendencies, and cognitive patterns across 8 critical dimensions.",
    estimatedMinutes: 12,
  }).returning();

  for (let i = 0; i < PSYCHOMETRIC_QUESTIONS.length; i++) {
    const q = PSYCHOMETRIC_QUESTIONS[i];
    await db.insert(schema.assessmentQuestionsTable).values({
      assessmentId: psychoAssessment.id,
      text: q.text,
      category: q.category,
      options: q.options,
      weight: 1.0,
      displayOrder: i + 1,
    });
  }

  const [cyberAssessment] = await db.insert(schema.assessmentsTable).values({
    type: "cyber_behavior",
    title: "Cyber Behavior Scenario Assessment",
    description: "8 real-world cybersecurity scenarios testing your practical decision-making across phishing, data handling, device security, and incident response.",
    estimatedMinutes: 10,
  }).returning();

  for (let i = 0; i < CYBER_BEHAVIOR_QUESTIONS.length; i++) {
    const q = CYBER_BEHAVIOR_QUESTIONS[i];
    await db.insert(schema.assessmentQuestionsTable).values({
      assessmentId: cyberAssessment.id,
      text: q.text,
      category: q.category,
      options: q.options,
      weight: 1.0,
      displayOrder: i + 1,
    });
  }

  // 3. Badges
  console.log("🏅 Inserting badges...");
  const insertedBadges = [];
  for (const badge of BADGES) {
    const [b] = await db.insert(schema.badgesTable).values(badge).returning();
    insertedBadges.push(b);
  }

  // 4. Gamification profiles + Assessment results + CCI snapshots for all users
  console.log("🎮 Seeding user gamification data...");
  const users = await db.select().from(schema.usersTable);

  for (const user of users) {
    const rng = seededRng(user.id * 13 + 7);

    // Psychometric scores (different per user, realistic ranges)
    const riskTolerance = Math.round(25 + rng() * 55);
    const impulsiveness = Math.round(20 + rng() * 60);
    const securityAwareness = Math.round(35 + rng() * 55);
    const decisionMaking = Math.round(40 + rng() * 50);
    const attentionToDetail = Math.round(35 + rng() * 55);
    const trustTendencies = Math.round(30 + rng() * 55);
    const stressResponse = Math.round(40 + rng() * 50);
    const complianceBehavior = Math.round(40 + rng() * 55);

    // Compute profile fields
    const risky = (riskTolerance + impulsiveness + trustTendencies) / 3;
    const protective = (securityAwareness + decisionMaking + attentionToDetail + stressResponse + complianceBehavior) / 5;
    const hrs = Math.round(risky * 0.45 + (100 - protective) * 0.55);
    const learningEngagement = Math.round(rng() * 80);
    const cci = Math.round(
      securityAwareness * 0.25 +
      complianceBehavior * 0.20 +
      learningEngagement * 0.20 +
      ((decisionMaking + attentionToDetail) / 2) * 0.20 +
      Math.max(0, 100 - riskTolerance * 0.5 - impulsiveness * 0.5) * 0.15
    );

    const riskCategory = hrs > 75 ? "Critical" : hrs > 60 ? "High" : hrs > 40 ? "Medium" : "Low";
    const srScore = Math.round((100 - hrs) * 0.7 + protective * 0.3);

    // Behavioral type
    let behavioralType = "Balanced Operative";
    if (protective > 75 && risky < 38) behavioralType = "Security Champion";
    else if (impulsiveness > 68 && risky > 65) behavioralType = "Impulsive Actor";
    else if (trustTendencies > 70 && risky > 58) behavioralType = "Trusting Actor";
    else if (protective > 68 && risky < 45) behavioralType = "Disciplined Analyst";
    else if (attentionToDetail > 72 && decisionMaking > 70) behavioralType = "Detail-Oriented Analyst";
    else if (complianceBehavior < 35) behavioralType = "Non-Compliant Operative";

    let learningStyle = "Visual Learner";
    if (attentionToDetail > 72) learningStyle = "Analytical Learner";
    else if (impulsiveness < 35) learningStyle = "Reflective Learner";
    else if (stressResponse > 70) learningStyle = "Adaptive Learner";
    else if (decisionMaking > 70) learningStyle = "Strategic Learner";

    // Insert psychometric profile
    await db.insert(schema.psychometricProfilesTable).values({
      userId: user.id,
      riskTolerance, impulsiveness, securityAwareness, decisionMaking,
      attentionToDetail, trustTendencies, stressResponse, complianceBehavior,
      behavioralType, learningStyle, riskCategory,
      securityReadinessScore: srScore,
    }).onConflictDoNothing();

    // Build category scores
    const catScores = {
      risk_tolerance: riskTolerance, impulsiveness, security_awareness: securityAwareness,
      decision_making: decisionMaking, attention_to_detail: attentionToDetail,
      trust_tendencies: trustTendencies, stress_response: stressResponse,
      compliance_behavior: complianceBehavior,
    };
    const overallScore = Math.round(Object.values(catScores).reduce((a, b) => a + b, 0) / 8);

    // Insert psychometric assessment result
    await db.insert(schema.assessmentResultsTable).values({
      userId: user.id,
      assessmentId: psychoAssessment.id,
      answers: {},
      categoryScores: catScores,
      overallScore,
      timeTakenSec: Math.round(400 + rng() * 400),
      completedAt: new Date(Date.now() - Math.round(rng() * 14 * 24 * 60 * 60 * 1000)),
    });

    // Cyber behavior scenario scores
    const cyberCatScores = {
      phishing_recognition: Math.round(30 + rng() * 70),
      password_hygiene: Math.round(30 + rng() * 70),
      social_engineering: Math.round(25 + rng() * 70),
      device_security: Math.round(40 + rng() * 60),
      remote_work: Math.round(35 + rng() * 65),
      data_handling: Math.round(35 + rng() * 65),
      incident_response: Math.round(30 + rng() * 70),
    };
    const cyberOverall = Math.round(Object.values(cyberCatScores).reduce((a, b) => a + b, 0) / 7);
    await db.insert(schema.assessmentResultsTable).values({
      userId: user.id,
      assessmentId: cyberAssessment.id,
      answers: {},
      categoryScores: cyberCatScores,
      overallScore: cyberOverall,
      timeTakenSec: Math.round(300 + rng() * 300),
      completedAt: new Date(Date.now() - Math.round(rng() * 10 * 24 * 60 * 60 * 1000)),
    });

    // CCI Snapshots (3 historical + current)
    for (let month = 3; month >= 0; month--) {
      const drift = (3 - month) * (rng() > 0.5 ? 2 : -1);
      await db.insert(schema.cciSnapshotsTable).values({
        userId: user.id,
        cciScore: Math.max(10, Math.min(98, cci + drift)),
        humanRiskScore: Math.max(5, Math.min(95, hrs - drift * 0.5)),
        behavioralStabilityScore: Math.round((stressResponse + decisionMaking) / 2),
        decisionQualityScore: Math.round((decisionMaking + attentionToDetail) / 2),
        cultureContributionScore: Math.round((complianceBehavior + securityAwareness) / 2),
        complianceBehaviorScore: complianceBehavior,
        computedAt: new Date(Date.now() - month * 30 * 24 * 60 * 60 * 1000),
      });
    }

    // Gamification profiles
    const xp = Math.round(100 + rng() * 1400);
    const level = Math.floor(xp / 200) + 1;
    const streak = Math.round(rng() * 21);

    await db.insert(schema.gamificationProfilesTable).values({
      userId: user.id,
      xp,
      level,
      streakDays: streak,
      lastActivityAt: new Date(Date.now() - Math.round(rng() * 3 * 24 * 60 * 60 * 1000)),
    }).onConflictDoNothing();

    // Award badges based on XP and scores
    const badgesToAward: number[] = [];
    const firstStepBadge = insertedBadges.find(b => b.name === "First Step");
    const quickLearnerBadge = insertedBadges.find(b => b.name === "Quick Learner");
    const cultureContributorBadge = insertedBadges.find(b => b.name === "Culture Contributor");
    const eliteBadge = insertedBadges.find(b => b.name === "Elite Operative");
    const cyberAwareBadge = insertedBadges.find(b => b.name === "Cyber Aware");
    const secChampionBadge = insertedBadges.find(b => b.name === "Security Champion");
    const streakBadge = insertedBadges.find(b => b.name === "Streak Warrior");
    const complianceBadge = insertedBadges.find(b => b.name === "Compliance Master");

    if (firstStepBadge) badgesToAward.push(firstStepBadge.id);
    if (quickLearnerBadge && rng() > 0.4) badgesToAward.push(quickLearnerBadge.id);
    if (cyberAwareBadge && securityAwareness > 75) badgesToAward.push(cyberAwareBadge.id);
    if (secChampionBadge && riskCategory === "Low") badgesToAward.push(secChampionBadge.id);
    if (streakBadge && streak >= 7) badgesToAward.push(streakBadge.id);
    if (cultureContributorBadge && xp >= 500) badgesToAward.push(cultureContributorBadge.id);
    if (eliteBadge && xp >= 1000) badgesToAward.push(eliteBadge.id);
    if (complianceBadge && complianceBehavior > 80) badgesToAward.push(complianceBadge.id);

    for (const badgeId of badgesToAward) {
      await db.insert(schema.userBadgesTable).values({
        userId: user.id,
        badgeId,
        earnedAt: new Date(Date.now() - Math.round(rng() * 30 * 24 * 60 * 60 * 1000)),
      }).onConflictDoNothing();
    }

    // Some course progress for variety
    const allCourses = await db.select().from(schema.coursesTable);
    const numCoursesStarted = Math.round(rng() * 5);
    for (let c = 0; c < numCoursesStarted && c < allCourses.length; c++) {
      const course = allCourses[c];
      const pct = rng() > 0.5 ? 100 : Math.round(25 + rng() * 74);
      const xpEarned = pct >= 100 ? course.xpReward : Math.round(course.xpReward * pct / 100);
      await db.insert(schema.userCourseProgressTable).values({
        userId: user.id,
        courseId: course.id,
        status: pct >= 100 ? "completed" : "in_progress",
        progressPct: pct,
        xpEarned,
        startedAt: new Date(Date.now() - Math.round(rng() * 20 * 24 * 60 * 60 * 1000)),
        completedAt: pct >= 100 ? new Date(Date.now() - Math.round(rng() * 10 * 24 * 60 * 60 * 1000)) : null,
      }).onConflictDoNothing();
    }
  }

  console.log(`✅ Extended seed complete. Processed ${users.length} users.`);
  await pool.end();
}

main().catch(err => { console.error("❌ Seed error:", err); pool.end(); process.exit(1); });
