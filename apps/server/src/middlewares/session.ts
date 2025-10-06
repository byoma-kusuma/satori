import { Next } from "hono";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";

const auth = require("../lib/auth").auth as any;

export const authenticated = async (c: Context, next: Next) => {
  try {
    // Use require() to bypass Better Auth type instantiation depth issues
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
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    c.set("user", null);
    c.set("session", null);
    throw new HTTPException(401, {
      message: "Unauthorized",
    });
  }
};
