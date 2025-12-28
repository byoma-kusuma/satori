import { Hono } from "hono";
import { getAllUsers, getUserById, updateUserRole, getUserRole, createUser, resendVerificationEmail, deleteUser, getAvailablePersons, updateUser, getDeletedUsers, undeleteUser } from "./user.service";
import { authenticated } from "../../middlewares/session";
import { requirePermission, adminOnly } from "../../middlewares/authorization";
import { auth } from "../../lib/auth";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import { userRoleEnum } from "../../types/user-roles";

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
  console.error(`User route error: ${err}`);

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
  });

export type UserType = typeof usersRoutes;
