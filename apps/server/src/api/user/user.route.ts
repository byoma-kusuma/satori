import { Hono } from "hono";
import { getAllUsers, getUserById, updateUserRole, getUserRole } from "./user.service";
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

const updateRoleSchema = z.object({
  role: z.enum(userRoleEnum),
});

const paramsSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

users.onError((err, c) => {
  console.error(`${err}`);
  
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
  });

export type UserType = typeof usersRoutes;
