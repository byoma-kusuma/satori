import { Next } from "hono";
import { auth } from "../lib/auth";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";

export const authenticated = async (c: Context, next: Next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    c.set("user", null);
    c.set("session", null);
    throw new HTTPException(401, {
      message: "Unauthorized",
    });
  }

  c.set("user", session.user);
  c.set("session", session.session);
  return next();
};
