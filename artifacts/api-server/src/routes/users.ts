import { Router, type IRouter } from "express";
import { db, usersTable, departmentsTable } from "@workspace/db";
import { eq, count, desc, inArray } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";
import { GetUserParams, UpdateUserParams, UpdateUserBody, ListUsersQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

const ELEVATED_ROLES = ["admin", "superadmin", "hr"] as const;
type ElevatedRole = (typeof ELEVATED_ROLES)[number];

function isElevated(role: string): role is ElevatedRole {
  return (ELEVATED_ROLES as readonly string[]).includes(role);
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

router.get("/users", requireAuth, requireRole("admin", "superadmin", "hr"), async (req, res): Promise<void> => {
  const params = ListUsersQueryParams.safeParse(req.query);
  const page = params.success ? (params.data.page ?? 1) : 1;
  const limit = params.success ? (params.data.limit ?? 20) : 20;
  const offset = (page - 1) * limit;

  const users = await db.select().from(usersTable).orderBy(desc(usersTable.id)).limit(limit).offset(offset);

  const deptIds = [...new Set(users.map(u => u.departmentId).filter(Boolean))] as number[];
  const depts = deptIds.length > 0
    ? await db.select().from(departmentsTable).where(inArray(departmentsTable.id, deptIds))
    : [];
  const deptMap = Object.fromEntries(depts.map(d => [d.id, d.name]));

  const [{ value: total }] = await db.select({ value: count() }).from(usersTable);

  res.json({
    users: users.map(u => buildUserResponse(u, u.departmentId ? deptMap[u.departmentId] : null)),
    total: Number(total),
  });
});

// Stats only for admin/superadmin/hr — not exposed to general authenticated users
router.get(
  "/users/stats/summary",
  requireAuth,
  requireRole("admin", "superadmin", "hr"),
  async (_req, res): Promise<void> => {
    const allUsers = await db.select({ role: usersTable.role, createdAt: usersTable.createdAt }).from(usersTable);
    const total = allUsers.length;

    const roleCounts: Record<string, number> = {};
    for (const u of allUsers) {
      roleCounts[u.role] = (roleCounts[u.role] ?? 0) + 1;
    }

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentSignups = allUsers.filter(u => u.createdAt >= weekAgo).length;

    res.json({
      total,
      byRole: Object.entries(roleCounts).map(([role, count]) => ({ role, count })),
      recentSignups,
    });
  },
);

// Self-read OR elevated role (admin/superadmin/hr) can read any user
router.get("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }

  const requesterId = req.user!.userId;
  const requesterRole = req.user!.role;
  const targetId = params.data.id;

  if (!isElevated(requesterRole) && requesterId !== targetId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, targetId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  let deptName: string | null = null;
  if (user.departmentId) {
    const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, user.departmentId));
    deptName = dept?.name ?? null;
  }

  res.json(buildUserResponse(user, deptName));
});

// Field-level RBAC:
//   superadmin — can update any user, assign any role
//   admin — can update any user, assign any role except superadmin; cannot demote superadmin
//   hr — can update any user's basic profile fields (no role/department changes)
//   employee/executive — can only update their own profile; cannot change role, departmentId, or jobTitle
router.patch("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }

  const body = UpdateUserBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const requesterId = req.user!.userId;
  const requesterRole = req.user!.role.toLowerCase();
  const targetId = params.data.id;
  const isSelf = requesterId === targetId;
  const elevated = isElevated(requesterRole);

  // Non-elevated users can only modify their own record
  if (!elevated && !isSelf) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  // Fetch current target to check their role
  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, targetId));
  if (!target) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Only superadmin can touch superadmin accounts
  if (target.role === "superadmin" && requesterRole !== "superadmin") {
    res.status(403).json({ error: "Only a superadmin can modify a superadmin account" });
    return;
  }

  // Determine allowed fields based on role
  const updateData: Partial<typeof usersTable.$inferInsert> = {};

  // Fields anyone can update on their own profile
  if (body.data.firstName !== undefined) updateData.firstName = body.data.firstName;
  if (body.data.lastName !== undefined) updateData.lastName = body.data.lastName;
  if (body.data.avatarUrl !== undefined) updateData.avatarUrl = body.data.avatarUrl;

  // jobTitle: employees can update their own title; elevated roles can update anyone's
  if (body.data.jobTitle !== undefined) {
    updateData.jobTitle = body.data.jobTitle;
  }

  // departmentId: only admin/superadmin/hr can change
  if (body.data.departmentId !== undefined) {
    if (requesterRole === "admin" || requesterRole === "superadmin" || requesterRole === "hr") {
      updateData.departmentId = body.data.departmentId;
    } else {
      res.status(403).json({ error: "You do not have permission to change department" });
      return;
    }
  }

  // role: only admin/superadmin can change; admin cannot assign superadmin
  if (body.data.role !== undefined) {
    if (requesterRole === "superadmin") {
      updateData.role = body.data.role;
    } else if (requesterRole === "admin") {
      if (body.data.role === "superadmin") {
        res.status(403).json({ error: "Admins cannot assign the superadmin role" });
        return;
      }
      updateData.role = body.data.role;
    } else {
      res.status(403).json({ error: "You do not have permission to change roles" });
      return;
    }
  }

  if (Object.keys(updateData).length === 0) {
    res.status(400).json({ error: "No valid fields to update" });
    return;
  }

  const [updated] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, targetId)).returning();
  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(buildUserResponse(updated));
});

// POST /users — create a new user (admin/superadmin)
router.post("/users", requireAuth, requireRole("admin", "superadmin"), async (req, res): Promise<void> => {
  const { email, firstName, lastName, role, departmentId, jobTitle, password } = req.body;
  if (!email || !firstName || !lastName) {
    res.status(400).json({ error: "email, firstName, and lastName are required" }); return;
  }
  const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (existing.length > 0) {
    res.status(409).json({ error: "A user with this email already exists" }); return;
  }
  const ALLOWED_ROLES = ["employee", "admin", "executive", "hr"];
  const requesterRole = req.user!.role.toLowerCase();
  const requestedRole = (role || "employee").toLowerCase();
  // Only superadmin can create superadmin accounts; admins cannot elevate to superadmin
  if (requestedRole === "superadmin" && requesterRole !== "superadmin") {
    res.status(403).json({ error: "Only a superadmin can create a superadmin account" }); return;
  }
  if (!ALLOWED_ROLES.includes(requestedRole) && requestedRole !== "superadmin") {
    res.status(400).json({ error: `Invalid role. Allowed: ${ALLOWED_ROLES.join(", ")}, superadmin` }); return;
  }
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(password || "Welcome1!", 12);
  const [user] = await db.insert(usersTable).values({
    email: email.toLowerCase(),
    firstName,
    lastName,
    role: requestedRole,
    departmentId: departmentId ? parseInt(departmentId) : null,
    jobTitle: jobTitle || null,
    passwordHash,
  }).returning();
  res.status(201).json(buildUserResponse(user));
});

// DELETE /users/:id — delete a user (admin/superadmin only; cannot delete own or superadmin accounts)
router.delete("/users/:id", requireAuth, requireRole("admin", "superadmin"), async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid user id" }); return; }
  const requesterId = req.user!.userId;
  if (id === requesterId) { res.status(400).json({ error: "Cannot delete your own account" }); return; }
  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!target) { res.status(404).json({ error: "User not found" }); return; }
  if (target.role === "superadmin" && req.user!.role.toLowerCase() !== "superadmin") {
    res.status(403).json({ error: "Only a superadmin can delete a superadmin account" }); return;
  }
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.json({ success: true });
});

export default router;
