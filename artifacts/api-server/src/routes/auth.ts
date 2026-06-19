import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import {
  db,
  usersTable,
  departmentsTable,
  sessionsTable,
  auditLogsTable,
  gamificationProfilesTable,
  AUDIT_ACTIONS,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { signAccessToken, verifyToken, generateRefreshToken, refreshTokenExpiresAt } from "../lib/jwt";
import { requireAuth } from "../middlewares/auth";
import {
  LoginBody,
  RegisterBody,
  ForgotPasswordBody,
  VerifyMfaBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;
const ACCESS_MAX_AGE = 15 * 60 * 1000;
const REFRESH_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const TEST_ROLES = ["employee", "executive", "hr", "admin", "superadmin"] as const;

type TestRole = (typeof TEST_ROLES)[number];

function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  const secure = process.env.NODE_ENV === "production";
  const sameSite = secure ? "none" : "lax";

  res.cookie("ccx_access", accessToken, {
    httpOnly: true,
    secure,
    sameSite,
    path: "/api",
    maxAge: ACCESS_MAX_AGE,
  });

  res.cookie("ccx_refresh", refreshToken, {
    httpOnly: true,
    secure,
    sameSite,
    path: "/api/auth/refresh",
    maxAge: REFRESH_MAX_AGE,
  });
}

function clearAuthCookies(res: Response): void {
  const secure = process.env.NODE_ENV === "production";
  const sameSite = secure ? "none" : "lax";

  res.clearCookie("ccx_access", { path: "/api", secure, sameSite });
  res.clearCookie("ccx_refresh", { path: "/api/auth/refresh", secure, sameSite });
}

function getClientInfo(req: Request): { ip: string; userAgent: string } {
  return {
    ip: (req.ip ?? req.socket?.remoteAddress ?? "unknown").replace(/^::ffff:/, ""),
    userAgent: (req.headers["user-agent"] ?? "unknown").slice(0, 500),
  };
}

async function writeAudit(
  action: string,
  userId: number | null,
  req: Request,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const { ip, userAgent } = getClientInfo(req);
  await db.insert(auditLogsTable).values({
    userId,
    action,
    ipAddress: ip,
    userAgent,
    metadata: metadata ?? null,
  });
}

function buildUserResponse(user: typeof usersTable.$inferSelect, deptName?: string | null) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    departmentId: user.departmentId,
    departmentName: deptName ?? null,
    avatarUrl: user.avatarUrl,
    jobTitle: user.jobTitle,
    onboardingCompleted: user.onboardingCompleted,
    mfaEnabled: user.mfaEnabled,
    createdAt: user.createdAt.toISOString(),
  };
}

async function getDeptName(departmentId: number | null): Promise<string | null> {
  if (!departmentId) return null;
  const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, departmentId));
  return dept?.name ?? null;
}

async function issueTokens(userId: number, email: string, role: string) {
  const accessToken = signAccessToken({ userId, email, role });
  const refreshToken = generateRefreshToken();
  const expiresAt = refreshTokenExpiresAt();

  await db.insert(sessionsTable).values({ userId, token: refreshToken, expiresAt });

  return { accessToken, refreshToken };
}

function isTempLoginEnabled() {
  return process.env.ENABLE_TEMP_LOGIN === "true" || process.env.NODE_ENV !== "production";
}

function isTestRole(value: unknown): value is TestRole {
  return typeof value === "string" && TEST_ROLES.includes(value as TestRole);
}

async function getOrCreateTestDepartment() {
  const [existing] = await db
    .select()
    .from(departmentsTable)
    .where(eq(departmentsTable.name, "Testing"))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(departmentsTable)
    .values({ name: "Testing", description: "Temporary role login accounts" })
    .returning();

  return created;
}

async function getOrCreateTestUser(role: TestRole) {
  const email = `test.${role}@cybercultx.local`;
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing) return existing;

  const department = await getOrCreateTestDepartment();
  const passwordHash = await bcrypt.hash(`temporary-${role}-${Date.now()}`, 4);
  const names: Record<TestRole, { firstName: string; lastName: string; jobTitle: string }> = {
    employee: { firstName: "Test", lastName: "Employee", jobTitle: "Security Learner" },
    executive: { firstName: "Test", lastName: "Executive", jobTitle: "Executive User" },
    hr: { firstName: "Test", lastName: "HR", jobTitle: "HR User" },
    admin: { firstName: "Test", lastName: "Admin", jobTitle: "Admin User" },
    superadmin: { firstName: "Test", lastName: "SuperAdmin", jobTitle: "Super Admin User" },
  };

  const [user] = await db
    .insert(usersTable)
    .values({
      email,
      passwordHash,
      firstName: names[role].firstName,
      lastName: names[role].lastName,
      role,
      departmentId: department.id,
      jobTitle: names[role].jobTitle,
      onboardingCompleted: true,
    })
    .returning();

  await db
    .insert(gamificationProfilesTable)
    .values({ userId: user.id })
    .onConflictDoNothing();

  return user;
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { email, password } = parsed.data;
  const now = new Date();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (!user) {
    await writeAudit(AUDIT_ACTIONS.LOGIN_FAILED, null, req, { email });
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  if (user.lockedUntil && user.lockedUntil > now) {
    const retryAfterSec = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 1000);
    await writeAudit(AUDIT_ACTIONS.LOGIN_LOCKED, user.id, req, { email });
    res.status(423).json({
      error: "Account temporarily locked due to too many failed attempts.",
      retryAfter: retryAfterSec,
    });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const newAttempts = user.failedLoginAttempts + 1;
    const willLock = newAttempts >= LOCKOUT_THRESHOLD;
    const lockedUntil = willLock ? new Date(now.getTime() + LOCKOUT_DURATION_MS) : null;

    await db.update(usersTable)
      .set({ failedLoginAttempts: newAttempts, ...(willLock ? { lockedUntil } : {}) })
      .where(eq(usersTable.id, user.id));

    await writeAudit(AUDIT_ACTIONS.LOGIN_FAILED, user.id, req, {
      email,
      attempts: newAttempts,
      locked: willLock,
    });

    if (willLock) {
      res.status(423).json({
        error: "Account locked for 15 minutes after too many failed attempts.",
        retryAfter: LOCKOUT_DURATION_MS / 1000,
      });
    } else {
      res.status(401).json({
        error: "Invalid credentials",
        attemptsRemaining: LOCKOUT_THRESHOLD - newAttempts,
      });
    }
    return;
  }

  await db.update(usersTable)
    .set({ failedLoginAttempts: 0, lockedUntil: null })
    .where(eq(usersTable.id, user.id));

  const deptName = await getDeptName(user.departmentId);
  const { accessToken, refreshToken } = await issueTokens(user.id, user.email, user.role);

  setAuthCookies(res, accessToken, refreshToken);
  await writeAudit(AUDIT_ACTIONS.LOGIN_SUCCESS, user.id, req);

  res.json({ token: accessToken, refreshToken, user: buildUserResponse(user, deptName) });
});

router.post("/auth/temp-login", async (req, res): Promise<void> => {
  if (!isTempLoginEnabled()) {
    res.status(403).json({
      error: "Temporary login is disabled. Set ENABLE_TEMP_LOGIN=true to enable it.",
    });
    return;
  }

  const role = req.body?.role;
  if (!isTestRole(role)) {
    res.status(400).json({ error: `Role must be one of: ${TEST_ROLES.join(", ")}` });
    return;
  }

  const user = await getOrCreateTestUser(role);
  await db.update(usersTable)
    .set({ failedLoginAttempts: 0, lockedUntil: null })
    .where(eq(usersTable.id, user.id));

  const deptName = await getDeptName(user.departmentId);
  const { accessToken, refreshToken } = await issueTokens(user.id, user.email, user.role);

  setAuthCookies(res, accessToken, refreshToken);
  await writeAudit(AUDIT_ACTIONS.LOGIN_SUCCESS, user.id, req, { temporary: true, role });

  res.json({ token: accessToken, refreshToken, user: buildUserResponse(user, deptName) });
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { email, password, firstName, lastName, role, departmentId } = parsed.data;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const validRole = ["employee", "executive", "hr", "admin", "superadmin"].includes(role ?? "")
    ? (role ?? "employee")
    : "employee";

  const [user] = await db.insert(usersTable).values({
    email: email.toLowerCase(),
    passwordHash,
    firstName,
    lastName,
    role: validRole,
    departmentId: departmentId ?? null,
  }).returning();

  const { accessToken, refreshToken } = await issueTokens(user.id, user.email, user.role);

  setAuthCookies(res, accessToken, refreshToken);
  await writeAudit(AUDIT_ACTIONS.REGISTER, user.id, req, { email: user.email, role: user.role });

  res.status(201).json({ token: accessToken, refreshToken, user: buildUserResponse(user) });
});

router.post("/auth/refresh", async (req, res): Promise<void> => {
  const tokenFromCookie = req.cookies?.ccx_refresh as string | undefined;
  const tokenFromBody = (req.body as { refreshToken?: string })?.refreshToken;
  const refreshToken = tokenFromCookie ?? tokenFromBody;

  if (!refreshToken || typeof refreshToken !== "string") {
    res.status(400).json({ error: "Refresh token is required" });
    return;
  }

  const now = new Date();
  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.token, refreshToken));

  if (!session || session.expiresAt < now) {
    clearAuthCookies(res);
    await writeAudit(AUDIT_ACTIONS.REFRESH_FAILED, null, req);
    res.status(401).json({ error: "Invalid or expired refresh token" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));
  if (!user) {
    clearAuthCookies(res);
    res.status(401).json({ error: "User not found" });
    return;
  }

  await db.delete(sessionsTable).where(eq(sessionsTable.id, session.id));
  const { accessToken, refreshToken: newRefreshToken } = await issueTokens(user.id, user.email, user.role);

  setAuthCookies(res, accessToken, newRefreshToken);
  await writeAudit(AUDIT_ACTIONS.REFRESH, user.id, req);

  res.json({ token: accessToken, refreshToken: newRefreshToken });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  const tokenFromCookie = req.cookies?.ccx_refresh as string | undefined;
  const tokenFromBody = (req.body as { refreshToken?: string })?.refreshToken;
  const refreshToken = tokenFromCookie ?? tokenFromBody;

  if (refreshToken && typeof refreshToken === "string") {
    await db.delete(sessionsTable).where(eq(sessionsTable.token, refreshToken));
  }

  let userId: number | null = null;
  try {
    const accessToken = req.cookies?.ccx_access as string | undefined;
    if (accessToken) {
      const payload = verifyToken(accessToken);
      userId = payload.userId;
    }
  } catch {
    // token may already be expired — that's fine
  }

  clearAuthCookies(res);
  await writeAudit(AUDIT_ACTIONS.LOGOUT, userId, req);

  res.json({ message: "Logged out successfully" });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const deptName = await getDeptName(user.departmentId);
  res.json(buildUserResponse(user, deptName));
});

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const parsed = ForgotPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  res.json({ message: "If that email exists, a reset link has been sent." });
});

router.post("/auth/mfa/setup", requireAuth, async (_req, res): Promise<void> => {
  res.status(501).json({ error: "MFA setup requires a real TOTP provider and is not configured yet." });
});

router.post("/auth/mfa/verify", requireAuth, async (req, res): Promise<void> => {
  const parsed = VerifyMfaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  res.status(501).json({ error: "MFA verification requires a real TOTP provider and is not configured yet." });
});

// POST /auth/complete-onboarding — marks onboarding wizard as finished
router.post("/auth/complete-onboarding", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  await db.update(usersTable).set({ onboardingCompleted: true }).where(eq(usersTable.id, userId));
  res.json({ success: true, message: "Onboarding complete" });
});

export default router;
