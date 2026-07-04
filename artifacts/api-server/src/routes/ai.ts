import { Router } from "express";
import OpenAI from "openai";
import { and, avg, count, desc, eq } from "drizzle-orm";
import {
  assessmentResultsTable,
  auditLogsTable,
  courseModulesTable,
  coursesTable,
  db,
  psychometricProfilesTable,
  userCourseProgressTable,
  usersTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router = Router();

let openai: OpenAI | null = null;
const AI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is required for AI chat");
  }

  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return openai;
}

const SYSTEM_PROMPT = `You are CyberCultX AI, the cyber culture and human-risk intelligence assistant embedded in the CyberCultX platform.

Primary mission:
- Help employees, HR, executives, admins, and superadmins understand cyber culture, human risk, readiness assessment results, learning priorities, phishing resilience, and behavior change.
- Turn platform data into practical next steps, not generic cybersecurity advice.
- Explain the CyberCultX Security Readiness Assessment scoring model:
  - 8-14 points: High Risk, Impulsive User
  - 15-21 points: Elevated Risk, Reactive User
  - 22-28 points: Moderate Risk, Security Aware User
  - 29-32 points: Low Risk, Security Champion Potential
- Recommend training using assessment points, risk profile, and available courses when context is provided.

Operating rules:
- Answer in the same language as the user's latest message. Use Arabic when the user writes Arabic.
- Be concise, data-driven, and action-oriented.
- If platform context says data is unavailable, say that clearly instead of inventing numbers.
- Never expose secrets, API keys, tokens, passwords, or raw private user data.
- Do not provide offensive cyber instructions, exploit steps, credential theft guidance, or phishing payloads. For risky requests, redirect to safe awareness, detection, reporting, or defensive simulation guidance.
- When speaking to executives, focus on risk, trend, business impact, and prioritized decisions.
- When speaking to HR, focus on employee readiness, training assignment, coaching, and privacy-aware reporting.
- When speaking to employees, focus on clear next actions and personal improvement.`;

async function buildPlatformContext(userId: number, role: string) {
  const roleKey = role.toLowerCase();

  try {
    const [currentUser] = await db.select({
      id: usersTable.id,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      role: usersTable.role,
      departmentId: usersTable.departmentId,
      jobTitle: usersTable.jobTitle,
      onboardingCompleted: usersTable.onboardingCompleted,
    }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);

    const visibleCourseCondition = and(eq(coursesTable.isActive, true), eq(courseModulesTable.isActive, true));
    const [courseSummary] = await db
      .select({ total: count() })
      .from(coursesTable)
      .innerJoin(courseModulesTable, eq(coursesTable.moduleId, courseModulesTable.id))
      .where(visibleCourseCondition);
    const recommendedCourses = await db.select({
      title: coursesTable.title,
      category: coursesTable.category,
      difficulty: coursesTable.difficulty,
      minScore: coursesTable.minScore,
      maxScore: coursesTable.maxScore,
      durationMinutes: coursesTable.durationMinutes,
    })
      .from(coursesTable)
      .innerJoin(courseModulesTable, eq(coursesTable.moduleId, courseModulesTable.id))
      .where(visibleCourseCondition)
      .orderBy(coursesTable.displayOrder)
      .limit(8);

    const context: Record<string, unknown> = {
      currentUser: currentUser ? {
        id: currentUser.id,
        name: `${currentUser.firstName} ${currentUser.lastName}`,
        role: currentUser.role,
        jobTitle: currentUser.jobTitle,
        onboardingCompleted: currentUser.onboardingCompleted,
      } : null,
      activeTrainingVideos: Number(courseSummary?.total ?? 0),
      availableTrainingSample: recommendedCourses,
    };

    const [profile] = await db.select().from(psychometricProfilesTable).where(eq(psychometricProfilesTable.userId, userId)).limit(1);
    if (profile) {
      context["currentUserReadiness"] = {
        points: profile.securityReadinessScore,
        riskCategory: profile.riskCategory,
        behavioralProfile: profile.behavioralType,
        securityAwareness: profile.securityAwareness,
        decisionMaking: profile.decisionMaking,
        complianceBehavior: profile.complianceBehavior,
      };
    }

    const [latestAssessment] = await db.select({
      overallScore: assessmentResultsTable.overallScore,
      completedAt: assessmentResultsTable.completedAt,
    }).from(assessmentResultsTable)
      .where(eq(assessmentResultsTable.userId, userId))
      .orderBy(desc(assessmentResultsTable.completedAt))
      .limit(1);
    if (latestAssessment) {
      context["latestAssessment"] = {
        overallScore: latestAssessment.overallScore,
        completedAt: latestAssessment.completedAt.toISOString(),
      };
    }

    const [learningSummary] = await db.select({
      avgProgress: avg(userCourseProgressTable.progressPct),
      completed: count(),
    }).from(userCourseProgressTable).where(eq(userCourseProgressTable.userId, userId));
    context["currentUserLearning"] = {
      averageProgressPct: Number(learningSummary?.avgProgress ?? 0),
      progressRecords: Number(learningSummary?.completed ?? 0),
    };

    if (["admin", "superadmin", "hr", "executive"].includes(roleKey)) {
      const [userSummary] = await db.select({ total: count() }).from(usersTable);
      const roleRows = await db.select({
        role: usersTable.role,
        total: count(),
      }).from(usersTable).groupBy(usersTable.role);
      const [auditSummary] = await db.select({ total: count() }).from(auditLogsTable);
      const [orgReadiness] = await db.select({
        averageReadiness: avg(psychometricProfilesTable.securityReadinessScore),
      }).from(psychometricProfilesTable);

      context["organization"] = {
        totalUsers: Number(userSummary?.total ?? 0),
        usersByRole: roleRows,
        auditEvents: Number(auditSummary?.total ?? 0),
        averageReadinessScore: orgReadiness?.averageReadiness === null
          ? null
          : Number(orgReadiness?.averageReadiness ?? 0),
      };
    }

    return JSON.stringify(context, null, 2);
  } catch (err) {
    console.error("AI context error:", err);
    return JSON.stringify({
      warning: "Platform context could not be loaded. Answer from general CyberCultX methodology and ask the user to retry for live data.",
    });
  }
}

router.post("/ai/chat", requireAuth, async (req, res) => {
  const { message, history = [] } = req.body as {
    message: string;
    history: { role: "user" | "assistant"; content: string }[];
  };

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  if (message.length > 2000) {
    res.status(400).json({ error: "Message too long" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    const platformContext = await buildPlatformContext(req.user!.userId, req.user!.role);
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "system",
        content: `Live CyberCultX platform context. Use this for answers when relevant. If a value is absent or null, say the platform does not have enough data yet.\n${platformContext}`,
      },
      ...history.slice(-10).map((h) => ({
        role: h.role,
        content: h.content,
      })),
      { role: "user", content: message },
    ];

    const stream = await getOpenAI().chat.completions.create({
      model: AI_MODEL,
      messages,
      stream: true,
      max_tokens: 1024,
      temperature: 0.3,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    console.error("AI chat error:", err);
    res.write(`data: ${JSON.stringify({ error: "AI service unavailable" })}\n\n`);
    res.end();
  }
});

export default router;
