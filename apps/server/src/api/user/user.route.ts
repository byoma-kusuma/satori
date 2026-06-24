import { Hono } from "hono";
import { getAllUsers, getUserById, updateUserRole, getUserRole, createUser, resendVerificationEmail, deleteUser, getAvailablePersons, updateUser, getDeletedUsers, undeleteUser } from "./user.service";
import { authenticated } from "../../middlewares/session";
import { requirePermission, adminOnly } from "../../middlewares/authorization";
import { auth } from "../../lib/auth";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import { userRoleEnum } from "../../types/user-roles";
import { db } from "../../database";

const users = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(userRoleEnum).optional(),
  personId: z.string().uuid().optional().nullable(),
});

const updateRoleSchema = z.object({
  role: z.enum(userRoleEnum),
});

const updateUserSchema = z.object({
  personId: z.string().uuid().nullable().optional(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(userRoleEnum).optional(),
});

const paramsSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

users.onError((err, c) => {
  if (err instanceof z.ZodError) {
    return c.json({
      success: false,
      message: "Validation error",
      errors: err.errors
    }, 400);
  }

  if (err instanceof HTTPException) {
    return c.json({
      success: false,
      message: err.message
    }, err.status);
  }

  return c.json({
    success: false,
    message: "Internal server error"
  }, 500);
});

export const usersRoutes = users
  .use(authenticated)
  .get("/", requirePermission("canViewUsers"), async (c) => {
    const users = await getAllUsers();
    return c.json(users);
  })
  .get("/deleted", requirePermission("canManageUsers"), async (c) => {
    const users = await getDeletedUsers();
    return c.json(users);
  })
  .get("/available-persons", requirePermission("canManageUsers"), async (c) => {
    const persons = await getAvailablePersons();
    return c.json(persons);
  })
  .post("/", zValidator("json", createUserSchema), requirePermission("canManageUsers"), async (c) => {
    const data = createUserSchema.parse(c.req.valid("json"));
    const user = await createUser(data);
    return c.json(user, 201);
  })
  .get("/me", async (c) => {
    const sessionUser = c.get("user");
    if (!sessionUser) {
      throw new HTTPException(401, { message: "Authentication required" });
    }
    const user = await getUserById(sessionUser.id);
    return c.json(user);
  })
  .get("/:id", zValidator("param", paramsSchema), requirePermission("canViewUsers"), async (c) => {
    const { id } = c.req.valid("param");
    const user = await getUserById(id);
    return c.json(user);
  })
  .get("/:id/role", zValidator("param", paramsSchema), requirePermission("canViewUsers"), async (c) => {
    const { id } = c.req.valid("param");
    const role = await getUserRole(id);
    return c.json({ role });
  })
  .put("/:id/role", zValidator("param", paramsSchema), zValidator("json", updateRoleSchema), requirePermission("canManageUsers"), async (c) => {
    const { id } = c.req.valid("param");
    const { role } = c.req.valid("json");

    const updatedUser = await updateUserRole(id, role);
    return c.json(updatedUser);
  })
  .post("/:id/resend-verification", zValidator("param", paramsSchema), requirePermission("canManageUsers"), async (c) => {
    const { id } = c.req.valid("param");

    await resendVerificationEmail(id);
    return c.json({ success: true, message: "Verification email sent successfully" });
  })
  .put("/:id", zValidator("param", paramsSchema), zValidator("json", updateUserSchema), requirePermission("canManageUsers"), async (c) => {
    const { id } = c.req.valid("param")
    const payload = c.req.valid("json")

    const updated = await updateUser(id, payload)
    return c.json(updated)
  })
  .delete("/:id", zValidator("param", paramsSchema), requirePermission("canManageUsers"), async (c) => {
    const { id } = c.req.valid("param");

    await deleteUser(id);
    return c.json({ success: true, message: "User deleted successfully" });
  })
  .post("/:id/undelete", zValidator("param", paramsSchema), requirePermission("canManageUsers"), async (c) => {
    const { id } = c.req.valid("param");

    const user = await undeleteUser(id);
    return c.json(user);
  })
  // GET /api/users/:id/centers - get assigned centers for a center_admin
  .get("/:id/centers", zValidator("param", paramsSchema), requirePermission("canManageUsers"), async (c) => {
    const { id } = c.req.valid("param")
    const assignments = await db
      .selectFrom('user_center_assignment')
      .innerJoin('center', 'center.id', 'user_center_assignment.center_id')
      .select(['user_center_assignment.center_id', 'center.name as centerName'])
      .where('user_id', '=', id)
      .execute()
    return c.json(assignments)
  })
  // PUT /api/users/:id/centers - replace assigned centers for a center_admin
  .put("/:id/centers", zValidator("param", paramsSchema), requirePermission("canManageUsers"), async (c) => {
    const { id } = c.req.valid("param")
    const body = await c.req.json()
    const centerIds: string[] = body.centerIds ?? []

    await db.deleteFrom('user_center_assignment').where('user_id', '=', id).execute()
    if (centerIds.length > 0) {
      await db.insertInto('user_center_assignment').values(centerIds.map((cid) => ({ user_id: id, center_id: cid }))).execute()
    }
    return c.json({ success: true })
  })
  // GET /api/users/:id/groups - get assigned groups for a group_admin
  .get("/:id/groups", zValidator("param", paramsSchema), requirePermission("canManageUsers"), async (c) => {
    const { id } = c.req.valid("param")
    const assignments = await db
      .selectFrom('user_group_assignment')
      .innerJoin('group', 'group.id', 'user_group_assignment.group_id')
      .select(['user_group_assignment.group_id', 'group.name as groupName'])
      .where('user_id', '=', id)
      .execute()
    return c.json(assignments)
  })
  // PUT /api/users/:id/groups - replace assigned groups for a group_admin
  .put("/:id/groups", requirePermission("canManageUsers"), async (c) => {
    const id = c.req.param("id")
    const body = await c.req.json()
    const groupIds: string[] = body.groupIds ?? []

    await db.deleteFrom('user_group_assignment').where('user_id', '=', id).execute()
    if (groupIds.length > 0) {
      await db.insertInto('user_group_assignment').values(groupIds.map((gid) => ({ user_id: id, group_id: gid }))).execute()
    }
    return c.json({ success: true })
  });

export type UserType = typeof usersRoutes;
