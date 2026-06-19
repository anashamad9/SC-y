import { Router, type IRouter } from "express";
import { db, departmentsTable, usersTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";
import { CreateDepartmentBody, GetDepartmentParams, UpdateDepartmentParams, UpdateDepartmentBody, DeleteDepartmentParams } from "@workspace/api-zod";

const router: IRouter = Router();

async function withMemberCount(dept: typeof departmentsTable.$inferSelect) {
  const [{ value }] = await db.select({ value: count() }).from(usersTable).where(eq(usersTable.departmentId, dept.id));
  return {
    id: dept.id,
    name: dept.name,
    description: dept.description,
    memberCount: Number(value),
    createdAt: dept.createdAt.toISOString(),
  };
}

router.get("/departments", requireAuth, async (_req, res): Promise<void> => {
  const depts = await db.select().from(departmentsTable).orderBy(departmentsTable.name);
  const results = await Promise.all(depts.map(withMemberCount));
  res.json(results);
});

router.post("/departments", requireAuth, requireRole("admin", "superadmin"), async (req, res): Promise<void> => {
  const parsed = CreateDepartmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [dept] = await db.insert(departmentsTable).values({
    name: parsed.data.name,
    description: parsed.data.description,
  }).returning();

  res.status(201).json(await withMemberCount(dept));
});

router.get("/departments/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetDepartmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, params.data.id));
  if (!dept) {
    res.status(404).json({ error: "Department not found" });
    return;
  }

  res.json(await withMemberCount(dept));
});

router.patch("/departments/:id", requireAuth, requireRole("admin", "superadmin"), async (req, res): Promise<void> => {
  const params = UpdateDepartmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateDepartmentBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updateData: Partial<typeof departmentsTable.$inferInsert> = {};
  if (body.data.name !== undefined) updateData.name = body.data.name;
  if (body.data.description !== undefined) updateData.description = body.data.description;

  const [dept] = await db.update(departmentsTable).set(updateData).where(eq(departmentsTable.id, params.data.id)).returning();
  if (!dept) {
    res.status(404).json({ error: "Department not found" });
    return;
  }

  res.json(await withMemberCount(dept));
});

router.delete("/departments/:id", requireAuth, requireRole("admin", "superadmin"), async (req, res): Promise<void> => {
  const params = DeleteDepartmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [dept] = await db.delete(departmentsTable).where(eq(departmentsTable.id, params.data.id)).returning();
  if (!dept) {
    res.status(404).json({ error: "Department not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
