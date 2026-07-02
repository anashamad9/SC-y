import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pg = require("../lib/db/node_modules/pg");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || databaseUrl.includes("YOUR-PASSWORD") || databaseUrl.includes("YOUR-PROJECT-REF") || databaseUrl.includes("[YOUR")) {
  console.error("DATABASE_URL is missing or still uses the placeholder value. Set .env.local to the real VPS/Supabase Postgres URL first.");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
});

const modules = [
  {
    title: "Security Readiness Foundation",
    description: "Core behaviors every employee needs before moving into role-specific security training.",
    difficulty: "beginner",
    displayOrder: 10,
  },
  {
    title: "Human Risk Reduction",
    description: "Focused training for users with elevated human-risk signals or low readiness scores.",
    difficulty: "intermediate",
    displayOrder: 20,
  },
  {
    title: "Advanced Cyber Culture",
    description: "Scenario-based training for employees ready to strengthen team-level cyber culture.",
    difficulty: "advanced",
    displayOrder: 30,
  },
];

const courses = [
  {
    moduleTitle: "Security Readiness Foundation",
    title: "Phishing Recognition Essentials",
    category: "phishing",
    description: "Learn how to identify suspicious messages, risky links, spoofed senders, and urgent social engineering patterns.",
    difficulty: "beginner",
    minScore: 8,
    maxScore: 16,
    thumbnailColor: "#dc143c",
    durationMinutes: 18,
    xpReward: 120,
    lessonCount: 3,
    displayOrder: 10,
    lessons: ["Spot sender and domain mismatches", "Inspect links and attachments safely", "Report suspected phishing quickly"],
  },
  {
    moduleTitle: "Security Readiness Foundation",
    title: "Password and MFA Habits",
    category: "password_security",
    description: "Build practical habits for strong passphrases, password managers, MFA prompts, and account recovery safety.",
    difficulty: "beginner",
    minScore: 8,
    maxScore: 20,
    thumbnailColor: "#0ea5e9",
    durationMinutes: 15,
    xpReward: 100,
    lessonCount: 3,
    displayOrder: 20,
    lessons: ["Use password managers effectively", "Handle MFA prompts safely", "Protect recovery channels"],
  },
  {
    moduleTitle: "Human Risk Reduction",
    title: "Social Engineering Decision Checks",
    category: "social_engineering",
    description: "Practice the pause-and-verify decisions that reduce impulsive clicks, oversharing, and unsafe approvals.",
    difficulty: "intermediate",
    minScore: 17,
    maxScore: 24,
    thumbnailColor: "#f97316",
    durationMinutes: 22,
    xpReward: 160,
    lessonCount: 4,
    displayOrder: 30,
    lessons: ["Recognize pressure tactics", "Verify unusual requests", "Escalate sensitive decisions", "Apply a response checklist"],
  },
  {
    moduleTitle: "Human Risk Reduction",
    title: "Data Handling for Daily Work",
    category: "data_protection",
    description: "Understand how to classify, share, store, and dispose of sensitive business data in everyday workflows.",
    difficulty: "intermediate",
    minScore: 17,
    maxScore: 28,
    thumbnailColor: "#22c55e",
    durationMinutes: 24,
    xpReward: 170,
    lessonCount: 4,
    displayOrder: 40,
    lessons: ["Classify information correctly", "Share data through approved channels", "Avoid unsafe downloads", "Clean up sensitive files"],
  },
  {
    moduleTitle: "Advanced Cyber Culture",
    title: "Incident Response for Employees",
    category: "incident_response",
    description: "Learn what to do in the first minutes after a suspected account compromise, data exposure, or malware warning.",
    difficulty: "advanced",
    minScore: 25,
    maxScore: 32,
    thumbnailColor: "#8b5cf6",
    durationMinutes: 28,
    xpReward: 220,
    lessonCount: 5,
    displayOrder: 50,
    lessons: ["Preserve evidence", "Report with useful context", "Contain risky activity", "Coordinate with security teams", "Review lessons learned"],
  },
  {
    moduleTitle: "Advanced Cyber Culture",
    title: "Deepfake and Voice Scam Awareness",
    category: "deepfake_awareness",
    description: "Use verification steps for synthetic media, voice cloning attempts, and executive impersonation scenarios.",
    difficulty: "advanced",
    minScore: 21,
    maxScore: 32,
    thumbnailColor: "#06b6d4",
    durationMinutes: 20,
    xpReward: 190,
    lessonCount: 4,
    displayOrder: 60,
    lessons: ["Identify synthetic-media red flags", "Verify high-risk requests", "Use alternate channels", "Report impersonation attempts"],
  },
];

const badges = [
  {
    name: "First Course",
    description: "Completed the first security learning course.",
    iconName: "BookOpen",
    category: "learning",
    xpRequired: 100,
  },
  {
    name: "Readiness Starter",
    description: "Completed the security readiness assessment.",
    iconName: "ShieldCheck",
    category: "assessment",
    xpRequired: 100,
  },
  {
    name: "Phishing Aware",
    description: "Completed phishing recognition training.",
    iconName: "Target",
    category: "learning",
    xpRequired: 200,
  },
  {
    name: "Security Streak",
    description: "Kept an active security learning streak.",
    iconName: "Flame",
    category: "streak",
    xpRequired: 300,
  },
  {
    name: "Human Risk Reducer",
    description: "Completed intermediate human-risk reduction training.",
    iconName: "TrendingDown",
    category: "achievement",
    xpRequired: 500,
  },
  {
    name: "Culture Champion",
    description: "Reached advanced cyber-culture learning milestones.",
    iconName: "Trophy",
    category: "achievement",
    xpRequired: 800,
  },
];

async function ensureModule(client, module) {
  const inserted = await client.query(
    `insert into course_modules (title, description, difficulty, display_order, is_active)
     select $1, $2, $3, $4, true
     where not exists (select 1 from course_modules where lower(title) = lower($1))
     returning id`,
    [module.title, module.description, module.difficulty, module.displayOrder],
  );

  if (inserted.rows[0]) return inserted.rows[0].id;

  const existing = await client.query("select id from course_modules where lower(title) = lower($1) limit 1", [module.title]);
  return existing.rows[0].id;
}

async function ensureCourse(client, course, moduleId) {
  const inserted = await client.query(
    `insert into courses (
       module_id, title, category, description, difficulty, min_score, max_score,
       thumbnail_color, duration_minutes, xp_reward, lesson_count, is_active, display_order
     )
     select $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, $12
     where not exists (select 1 from courses where lower(title) = lower($2))
     returning id`,
    [
      moduleId,
      course.title,
      course.category,
      course.description,
      course.difficulty,
      course.minScore,
      course.maxScore,
      course.thumbnailColor,
      course.durationMinutes,
      course.xpReward,
      course.lessonCount,
      course.displayOrder,
    ],
  );

  const courseId = inserted.rows[0]?.id ?? (await client.query("select id from courses where lower(title) = lower($1) limit 1", [course.title])).rows[0].id;
  const lessonCount = await client.query("select count(*)::int as count from lessons where course_id = $1", [courseId]);

  if (lessonCount.rows[0].count === 0) {
    for (const [index, title] of course.lessons.entries()) {
      await client.query(
        `insert into lessons (course_id, title, type, content, xp_reward, display_order)
         values ($1, $2, 'video', $3, $4, $5)`,
        [courseId, title, course.description, Math.max(20, Math.round(course.xpReward / course.lessons.length)), index + 1],
      );
    }
  }
}

async function ensureBadge(client, badge) {
  await client.query(
    `insert into badges (name, description, icon_name, category, xp_required, is_active)
     select $1, $2, $3, $4, $5, true
     where not exists (select 1 from badges where lower(name) = lower($1))`,
    [badge.name, badge.description, badge.iconName, badge.category, badge.xpRequired],
  );
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query("begin");

    const moduleIds = new Map();
    for (const module of modules) {
      moduleIds.set(module.title, await ensureModule(client, module));
    }

    for (const course of courses) {
      await ensureCourse(client, course, moduleIds.get(course.moduleTitle));
    }

    for (const badge of badges) {
      await ensureBadge(client, badge);
    }

    await client.query("commit");

    const summary = await client.query(
      `select
        (select count(*)::int from course_modules where is_active = true) as active_modules,
        (select count(*)::int from courses where is_active = true) as active_courses,
        (select count(*)::int from lessons) as lessons,
        (select count(*)::int from badges where is_active = true) as active_badges`,
    );

    console.log(JSON.stringify(summary.rows[0], null, 2));
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
