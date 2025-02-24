import { Hono } from "hono";
import { getPersonById, getAllPersons } from "./person.service";
import { authenticated } from "../../middlewares/session";
import { auth } from "../../lib/auth";

const users = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

export const personRoutes = users
  .use(authenticated)
  .get("/", async (c) => {
    const users = await getAllPersons();
    return c.json(users);
  })
  .get("/:id", async (c) => {
    const user = await getPersonById(c.req.param("id"));
    return c.json(user);
  });

export type UserType = typeof personRoutes;
