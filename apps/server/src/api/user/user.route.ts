import { Hono } from "hono";
import { getAllUsers, getUserById } from "./user.service";
import { authenticated } from "../../middlewares/session";
import { auth } from "../../lib/auth";

const users = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

export const usersRoutes = users
  .use(authenticated)
  .get("/", async (c) => {
    const users = await getAllUsers();
    return c.json(users);
  })
  .get("/:id", async (c) => {
    const user = await getUserById(c.req.param("id"));
    return c.json(user);
  });

export type UserType = typeof usersRoutes;
