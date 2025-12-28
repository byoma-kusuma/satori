import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import { auth } from "../lib/auth";
import type { JsonValue } from "../types";

const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(jsonValueSchema), z.record(jsonValueSchema)]),
);

const getSessionResponseSchema = z.union([
  z.null(),
  z.object({
    session: z.record(jsonValueSchema),
    user: z.record(jsonValueSchema),
  }),
]);

export const authenticated = async (c: Context, next: Next) => {
  try {
    const getSessionUrl = new URL("/api/auth/get-session", process.env.BETTER_AUTH_URL ?? "http://localhost");
    const origin = process.env.ORIGIN?.split(",")[0]?.trim();

    const headers = new Headers(c.req.raw.headers);
    if (origin) headers.set("origin", origin);

    const response = await auth.handler(
      new Request(getSessionUrl, {
        method: "GET",
        headers,
      }),
    );

    if (!response.ok) {
      c.set("user", null);
      c.set("session", null);
      throw new HTTPException(401, { message: "Unauthorized" });
    }

    const payload = getSessionResponseSchema.parse(await response.json());

    if (!payload) {
      c.set("user", null);
      c.set("session", null);
      throw new HTTPException(401, {
        message: "Unauthorized",
      });
    }

    c.set("user", payload.user);
    c.set("session", payload.session);
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
