/**
 * Seed script: adds telemetry events, departments, gamification profiles,
 * and CCI snapshots for any users that are missing them.
 * Run: npx tsx src/seed-telemetry.ts
 */
import { db } from "@workspace/db";
import {
  usersTable,
  departmentsTable,
  gamificationProfilesTable,
  telemetryEventsTable,
  assessmentResultsTable,
  assessmentsTable,
  cciSnapshotsTable,
  psychometricProfilesTable,
} from "@workspace/db";
import bcrypt from "bcryptjs";
import { eq, sql, inArray } from "drizzle-orm";

const DEPT_NAMES = [
  "Engineering", "Product", "Sales", "Marketing", "Finance",
  "Legal", "Operations", "HR", "IT Security", "Customer Success",
  "Data Science", "Compliance", "Research", "Executive", "Support",
];

const ARABIC_NAMES = [
  ["Layla", "Al-Rashid"], ["Omar", "Hassan"], ["Noor", "Khalid"],
  ["Zara", "Ibrahim"], ["Tariq", "Mansour"], ["Rania", "Saad"],
  ["Yasmin", "Farouk"], ["Khalil", "Nasser"], ["Dina", "Yousef"],
  ["Faris", "Qasim"], ["Hana", "Zaki"], ["Adel", "Badran"],
  ["Lina", "Hamdan"], ["Sami", "Taha"], ["Rana", "Ajlan"],
  ["Bassam", "Kurdi"], ["Maha", "Saleh"], ["Wael", "Dabbagh"],
  ["Reem", "Jaber"], ["Karim", "Hakim"], ["Samar", "Awad"],
  ["Mazen", "Suleiman"], ["Ghada", "Othman"], ["Amr", "Farhat"],
  ["Lara", "Nassar"], ["Tarek", "Moussa"], ["Heba", "Wahab"],
  ["Nidal", "Ayyub"], ["Mais", "Hariri"], ["Yusuf", "Barakat"],
  ["Amal", "Zreik"], ["Ramzy", "Hajjar"], ["Nadia", "Khoury"],
  ["Hassan", "Amin"], ["Hind", "Masri"], ["Ziad", "Karaki"],
  ["Rim", "Bitar"], ["Saad", "Ghanem"], ["Lubna", "Sayed"],
  ["Bilal", "Rahhal"],
];

const EVENT_TYPES = [
  "question_answered", "assessment_started", "assessment_completed",
  "course_started", "course_lesson_completed", "page_focus_lost", "page_focus_gained",
] as const;

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randFloat(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = Math.imul(1664525, s) + 1013904223 | 0;
    return (s >>> 0) / 0xffffffff;
  };
}

async function main() {
  console.log("🌱 Starting telemetry + CCI snapshot seed…");

  // 1. Upsert departments
  const existingDepts = await db.select().from(departmentsTable);
  const existingNames = new Set(existingDepts.map(d => d.name));
  const newDepts = DEPT_NAMES.filter(n => !existingNames.has(n));
  if (newDepts.length > 0) {
    await db.insert(departmentsTable).values(newDepts.map(name => ({ name, description: `${name} department` })));
    console.log(`  ✓ Inserted ${newDepts.length} departments`);
  } else {
    console.log(`  ✓ All departments already exist`);
  }
  const allDepts = await db.select().from(departmentsTable);

  // 2. Seed 40 employee users (idempotent)
  const password = await bcrypt.hash("Test1234!", 10);
  const existingUsers = await db.select({ email: usersTable.email }).from(usersTable);
  const existingEmails = new Set(existingUsers.map(u => u.email));
  const newUsers = ARABIC_NAMES.filter(([f, l]) => {
    const email = `${f.toLowerCase()}.${l.toLowerCase().replace(/[^a-z]/g, "")}@cybercultx.com`;
    return !existingEmails.has(email);
  });
  let insertedCount = 0;
  for (const [firstName, lastName] of newUsers) {
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/[^a-z]/g, "")}@cybercultx.com`;
    const dept = allDepts[rand(0, allDepts.length - 1)];
    try {
      await db.insert(usersTable).values({
        email, passwordHash: password, firstName, lastName,
        role: "employee", departmentId: dept.id, onboardingCompleted: true,
      });
      insertedCount++;
    } catch { }
  }
  if (insertedCount > 0) console.log(`  ✓ Inserted ${insertedCount} employee users`);
  else console.log(`  ✓ All test employees already exist`);

  // 3. Gamification profiles for all users without one
  const allUsers = await db.select({ id: usersTable.id }).from(usersTable);
  const existingGP = await db.select({ userId: gamificationProfilesTable.userId }).from(gamificationProfilesTable);
  const gpUserIds = new Set(existingGP.map(g => g.userId));
  const needsGP = allUsers.filter(u => !gpUserIds.has(u.id));
  if (needsGP.length > 0) {
    await db.insert(gamificationProfilesTable).values(
      needsGP.map(u => ({
        userId: u.id, xp: rand(50, 2400), level: rand(1, 8),
        streakDays: rand(0, 45), longestStreak: rand(5, 60),
        currentLevelXp: 0, nextLevelXp: 200,
        totalAssessmentsCompleted: rand(0, 10), totalCoursesCompleted: rand(0, 8),
        lastActivityAt: new Date(Date.now() - rand(0, 14) * 86400000),
      }))
    );
    console.log(`  ✓ Created ${needsGP.length} gamification profiles`);
  }

  // 4. CCI snapshots for all users without them (needed for CCI trend chart)
  const existingCCI = await db.select({ userId: cciSnapshotsTable.userId }).from(cciSnapshotsTable);
  const cciUserIds = new Set(existingCCI.map(c => c.userId));
  const needsCCI = allUsers.filter(u => !cciUserIds.has(u.id));
  if (needsCCI.length > 0) {
    console.log(`  Seeding CCI snapshots for ${needsCCI.length} users…`);
    for (const user of needsCCI) {
      const rng = seededRng(user.id * 31 + 17);
      const riskTolerance = Math.round(25 + rng() * 55);
      const impulsiveness = Math.round(20 + rng() * 60);
      const securityAwareness = Math.round(35 + rng() * 55);
      const decisionMaking = Math.round(40 + rng() * 50);
      const attentionToDetail = Math.round(35 + rng() * 55);
      const trustTendencies = Math.round(30 + rng() * 55);
      const stressResponse = Math.round(40 + rng() * 50);
      const complianceBehavior = Math.round(40 + rng() * 55);
      const learningEngagement = Math.round(rng() * 80);
      const risky = (riskTolerance + impulsiveness + trustTendencies) / 3;
      const protective = (securityAwareness + decisionMaking + attentionToDetail + stressResponse + complianceBehavior) / 5;
      const hrs = Math.round(risky * 0.45 + (100 - protective) * 0.55);
      const cci = Math.round(
        securityAwareness * 0.25 + complianceBehavior * 0.20 + learningEngagement * 0.20 +
        ((decisionMaking + attentionToDetail) / 2) * 0.20 +
        Math.max(0, 100 - riskTolerance * 0.5 - impulsiveness * 0.5) * 0.15
      );
      await db.insert(cciSnapshotsTable).values(
        Array.from({ length: 4 }, (_, i) => {
          const drift = (3 - i) * (rng() > 0.5 ? 3 : -2);
          return {
            userId: user.id,
            cciScore: Math.max(10, Math.min(98, cci + drift)),
            humanRiskScore: Math.max(5, Math.min(95, hrs - drift * 0.5)),
            behavioralStabilityScore: Math.round((stressResponse + decisionMaking) / 2),
            decisionQualityScore: Math.round((decisionMaking + attentionToDetail) / 2),
            cultureContributionScore: Math.round((complianceBehavior + securityAwareness) / 2),
            complianceBehaviorScore: complianceBehavior,
            computedAt: new Date(Date.now() - (3 - i) * 30 * 24 * 60 * 60 * 1000 - rand(0, 5) * 24 * 60 * 60 * 1000),
          };
        })
      );
    }
    console.log(`  ✓ Seeded CCI snapshots for ${needsCCI.length} users`);
  } else {
    console.log(`  ✓ All users already have CCI snapshots`);
  }

  // 5. Telemetry events (target: 5000)
  const finalUsers = await db.select({ id: usersTable.id }).from(usersTable);
  const assessments = await db.select({ id: assessmentsTable.id }).from(assessmentsTable);
  const assessmentIds = assessments.map(a => a.id);
  const [{ count: telemetryCount }] = await db.select({ count: sql<number>`count(*)` }).from(telemetryEventsTable);
  const existing = Number(telemetryCount);
  const target = 5000;
  const needed = Math.max(0, target - existing);
  if (needed === 0) {
    console.log(`  ✓ Already have ${existing} telemetry events`);
  } else {
    console.log(`  Inserting ${needed} telemetry events…`);
    const BATCH = 200;
    let inserted = 0;
    while (inserted < needed) {
      const batchSize = Math.min(BATCH, needed - inserted);
      const rows = Array.from({ length: batchSize }, () => {
        const user = finalUsers[rand(0, finalUsers.length - 1)];
        const eventType = EVENT_TYPES[rand(0, EVENT_TYPES.length - 1)];
        const daysAgo = rand(0, 89);
        return {
          userId: user.id, eventType,
          assessmentId: assessmentIds.length > 0 && rand(0, 2) > 0 ? assessmentIds[rand(0, assessmentIds.length - 1)] : null,
          questionId: eventType === "question_answered" ? rand(1, 50) : null,
          decisionLatencyMs: eventType === "question_answered" ? rand(800, 18000) : null,
          confidenceRating: eventType === "question_answered" ? randFloat(20, 95) : null,
          attentionScore: randFloat(30, 95), payload: null,
          createdAt: new Date(Date.now() - daysAgo * 86400000 - rand(0, 23) * 3600000),
        };
      });
      await db.insert(telemetryEventsTable).values(rows);
      inserted += batchSize;
    }
    console.log(`  ✓ Inserted ${needed} telemetry events`);
  }

  console.log("✅ Seed complete!");
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
