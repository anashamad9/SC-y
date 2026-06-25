import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import {
  db,
  usersTable,
  tenantsTable,
  departmentsTable,
  sessionsTable,
  auditLogsTable,
  gamificationProfilesTable,
  systemConfigTable,
  AUDIT_ACTIONS,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { signAccessToken, verifyToken, generateRefreshToken, refreshTokenExpiresAt } from "../lib/jwt";
import { logger } from "../lib/logger";
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
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

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
    tenantId: user.tenantId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    departmentId: user.departmentId,
    departmentName: deptName ?? null,
    avatarUrl: user.avatarUrl,
    jobTitle: user.jobTitle,
    onboardingCompleted: user.onboardingCompleted,
    approvalStatus: user.approvalStatus,
    approvedBy: user.approvedBy,
    approvedAt: user.approvedAt?.toISOString() ?? null,
    rejectedAt: user.rejectedAt?.toISOString() ?? null,
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

function getEmailDomain(email: string) {
  return email.split("@").at(1)?.trim().toLowerCase() ?? "";
}

async function getOrCreateFallbackTenant() {
  const [existing] = await db.select().from(tenantsTable).limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(tenantsTable)
    .values({
      name: "Default Tenant",
      domain: "default.local",
      plan: "starter",
      status: "active",
      employeeCount: 0,
      adminEmail: "admin@default.local",
      industry: "general",
      country: "UAE",
    })
    .returning();

  return created;
}

async function getTenantForEmail(email: string) {
  const domain = getEmailDomain(email);
  if (domain) {
    const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.domain, domain)).limit(1);
    if (tenant) return tenant;
  }

  return getOrCreateFallbackTenant();
}

function isTempLoginEnabled() {
  return process.env.ENABLE_TEMP_LOGIN === "true" || process.env.NODE_ENV !== "production";
}

function isTestRole(value: unknown): value is TestRole {
  return typeof value === "string" && TEST_ROLES.includes(value as TestRole);
}

function hashResetToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function canExposeResetToken() {
  return process.env.EXPOSE_PASSWORD_RESET_TOKEN === "true" && process.env.NODE_ENV !== "production";
}

function resetConfigKey(tokenHash: string) {
  return `auth.password_reset.${tokenHash}`;
}

function generateTotpSecret(length = 20) {
  const bytes = crypto.randomBytes(length);
  let bits = "";
  for (const byte of bytes) bits += byte.toString(2).padStart(8, "0");
  let secret = "";
  for (let i = 0; i < bits.length; i += 5) {
    secret += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5).padEnd(5, "0"), 2)];
  }
  return secret;
}

function base32ToBuffer(secret: string) {
  const clean = secret.replace(/=+$/g, "").replace(/\s+/g, "").toUpperCase();
  let bits = "";
  for (const char of clean) {
    const value = BASE32_ALPHABET.indexOf(char);
    if (value === -1) continue;
    bits += value.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function totp(secret: string, timeStep = Math.floor(Date.now() / 30000)) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(timeStep));
  const hmac = crypto.createHmac("sha1", base32ToBuffer(secret)).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 1_000_000).padStart(6, "0");
}

function verifyTotp(secret: string, code: string) {
  const step = Math.floor(Date.now() / 30000);
  return [-1, 0, 1].some(offset => totp(secret, step + offset) === code);
}

async function getOrCreateTestDepartment() {
  const tenant = await getOrCreateFallbackTenant();
  const [existing] = await db
    .select()
    .from(departmentsTable)
    .where(eq(departmentsTable.name, "Testing"))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(departmentsTable)
    .values({ tenantId: tenant.id, name: "Testing", description: "Temporary role login accounts" })
    .returning();

  return created;
}

async function getOrCreateTestUser(role: TestRole) {
  const email = `test.${role}@cybercultx.local`;
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing) return existing;

  const department = await getOrCreateTestDepartment();
  const tenant = await getOrCreateFallbackTenant();
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
      tenantId: tenant.id,
      departmentId: department.id,
      jobTitle: names[role].jobTitle,
      onboardingCompleted: true,
      approvalStatus: "approved",
      approvedAt: new Date(),
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

  if (user.approvalStatus === "pending") {
    await writeAudit(AUDIT_ACTIONS.LOGIN_PENDING_APPROVAL, user.id, req, { email });
    res.status(403).json({
      error: "Your account is waiting for super admin approval.",
      approvalStatus: user.approvalStatus,
    });
    return;
  }

  if (user.approvalStatus === "rejected") {
    await writeAudit(AUDIT_ACTIONS.LOGIN_REJECTED, user.id, req, { email });
    res.status(403).json({
      error: "Your access request has been rejected. Please contact the super admin.",
      approvalStatus: user.approvalStatus,
    });
    return;
  }

  const deptName = await getDeptName(user.departmentId);
  const { accessToken, refreshToken } = await issueTokens(user.id, user.email, user.role);

  setAuthCookies(res, accessToken, refreshToken);
  await writeAudit(AUDIT_ACTIONS.LOGIN_SUCCESS, user.id, req);

  res.json({ token: accessToken, refreshToken, user: buildUserResponse(user, deptName) });
});

router.post("/auth/temp-login", async (req, res): Promise<void> => {
  try {
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
    const [updatedUser] = await db.update(usersTable)
      .set({
        failedLoginAttempts: 0,
        lockedUntil: null,
        approvalStatus: "approved",
        approvedAt: new Date(),
        rejectedAt: null,
      })
      .where(eq(usersTable.id, user.id))
      .returning();

    const activeUser = updatedUser ?? user;
    const deptName = await getDeptName(activeUser.departmentId);
    const { accessToken, refreshToken } = await issueTokens(activeUser.id, activeUser.email, activeUser.role);

    setAuthCookies(res, accessToken, refreshToken);
    await writeAudit(AUDIT_ACTIONS.LOGIN_SUCCESS, activeUser.id, req, { temporary: true, role });

    res.json({ token: accessToken, refreshToken, user: buildUserResponse(activeUser, deptName) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Temporary login failed";
    logger.error({ err }, "Temporary login failed");
    res.status(500).json({ error: message });
  }
});

router.post("/auth/register", async (req, res): Promise<void> => {
  try {
    const parsed = RegisterBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const { email, password, firstName, lastName, role, departmentId } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail));
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const validRole = ["employee", "executive", "hr", "admin", "superadmin"].includes(role ?? "")
      ? (role ?? "employee")
      : "employee";
    const tenant = validRole === "superadmin" ? null : await getTenantForEmail(normalizedEmail);

    const [user] = await db.insert(usersTable).values({
      email: normalizedEmail,
      passwordHash,
      firstName,
      lastName,
      role: validRole,
      tenantId: tenant?.id ?? null,
      departmentId: departmentId ?? null,
      approvalStatus: "pending",
    }).returning();

    await writeAudit(AUDIT_ACTIONS.REGISTER_PENDING_APPROVAL, user.id, req, {
      email: user.email,
      role: user.role,
      approvalStatus: user.approvalStatus,
    });

    res.status(201).json({
      message: "Your account request has been submitted and is waiting for super admin approval.",
      approvalStatus: user.approvalStatus,
      user: buildUserResponse(user),
    });
  } catch (err) {
    logger.error({ err }, "Registration failed");
    res.status(500).json({ error: "Registration failed. Please try again or contact support." });
  }
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
  const email = parsed.data.email.toLowerCase();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

  let resetUrl: string | undefined;
  if (user) {
    const token = crypto.randomBytes(32).toString("base64url");
    const tokenHash = hashResetToken(token);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await db.insert(systemConfigTable)
      .values({
        key: resetConfigKey(tokenHash),
        value: JSON.stringify({ userId: user.id, expiresAt: expiresAt.toISOString() }),
        category: "auth",
      })
      .onConflictDoUpdate({
        target: systemConfigTable.key,
        set: {
          value: JSON.stringify({ userId: user.id, expiresAt: expiresAt.toISOString() }),
          updatedAt: new Date(),
        },
      });

    await writeAudit("PASSWORD_RESET_REQUESTED", user.id, req);
    if (canExposeResetToken()) {
      const origin = process.env.NEXT_PUBLIC_SITE_URL || `${req.protocol}://${req.get("host")}`;
      resetUrl = `${origin}/reset-password?token=${token}`;
    }
  }

  res.json({
    message: "If that email exists, recovery instructions have been sent.",
    ...(resetUrl ? { resetUrl } : {}),
  });
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const { token, password } = req.body as { token?: string; password?: string };
  if (!token || !password || password.length < 8) {
    res.status(400).json({ error: "A valid token and password of at least 8 characters are required." });
    return;
  }

  const tokenHash = hashResetToken(token);
  const [resetRow] = await db.select().from(systemConfigTable).where(eq(systemConfigTable.key, resetConfigKey(tokenHash))).limit(1);
  const resetData = resetRow?.value ? JSON.parse(resetRow.value) as { userId?: number; expiresAt?: string } : null;
  if (!resetData?.userId || !resetData.expiresAt || new Date(resetData.expiresAt) < new Date()) {
    res.status(400).json({ error: "Reset link is invalid or expired." });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, resetData.userId)).limit(1);
  if (!user) {
    res.status(400).json({ error: "Reset link is invalid or expired." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.update(usersTable)
    .set({
      passwordHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
    })
    .where(eq(usersTable.id, user.id));
  await db.delete(sessionsTable).where(eq(sessionsTable.userId, user.id));
  await db.delete(systemConfigTable).where(eq(systemConfigTable.key, resetConfigKey(tokenHash)));
  await writeAudit("PASSWORD_RESET_COMPLETED", user.id, req);
  res.json({ message: "Password has been reset. Sign in with your new password." });
});

router.post("/auth/change-password", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
  if (!currentPassword || !newPassword || newPassword.length < 8) {
    res.status(400).json({ error: "Current password and a new password of at least 8 characters are required." });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    await writeAudit("PASSWORD_CHANGE_FAILED", user.id, req);
    res.status(401).json({ error: "Current password is incorrect." });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, user.id));
  await writeAudit("PASSWORD_CHANGED", user.id, req);
  res.json({ message: "Password updated successfully." });
});

router.post("/auth/mfa/setup", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const secret = user.mfaSecret || generateTotpSecret();
  await db.update(usersTable).set({ mfaSecret: secret, mfaEnabled: false }).where(eq(usersTable.id, user.id));
  const label = encodeURIComponent(`CyberCultX:${user.email}`);
  const issuer = encodeURIComponent("CyberCultX");
  const otpauthUrl = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
  res.json({
    secret,
    otpauthUrl,
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(otpauthUrl)}`,
  });
});

router.post("/auth/mfa/verify", requireAuth, async (req, res): Promise<void> => {
  const parsed = VerifyMfaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const userId = req.user!.userId;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user?.mfaSecret) {
    res.status(400).json({ error: "MFA setup has not been started." });
    return;
  }

  if (!verifyTotp(user.mfaSecret, parsed.data.code)) {
    await writeAudit("MFA_VERIFY_FAILED", user.id, req);
    res.status(401).json({ error: "Invalid MFA code" });
    return;
  }

  await db.update(usersTable).set({ mfaEnabled: true }).where(eq(usersTable.id, user.id));
  await writeAudit("MFA_ENABLED", user.id, req);
  res.json({ message: "MFA enabled successfully." });
});

// POST /auth/complete-onboarding — marks onboarding wizard as finished
router.post("/auth/complete-onboarding", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  await db.update(usersTable).set({ onboardingCompleted: true }).where(eq(usersTable.id, userId));
  res.json({ success: true, message: "Onboarding complete" });
});

export default router;
