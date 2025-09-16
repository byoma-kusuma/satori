import { config } from "dotenv";
config({ override: true }); // Load environment variables from .env file, overriding existing ones

import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./lib/auth";
import { getEmailVerifiedTemplate } from "./templates/email-verified";
import { usersRoutes } from "./api/user/user.route";
import { personsRoutes } from "./api/person/person.route";
import { groupsRoutes } from "./api/group/group.route";
import { eventsRoutes } from "./api/event/event.route";

const app = new Hono();

// check if origin is set in environment variables if not default to localhost for development
if (!process.env.ORIGIN) {
  console.log("No ORIGIN set in environment variables, defaulting to http://localhost:3000");
  process.env.ORIGIN = `http://localhost:${process.env.FRONTEND_PORT ?? 3000}`;
}

console.log("Allowed origins:", process.env.ORIGIN);

// CORS middleware configuration
app.use(
  '*',
  cors({
     origin: (origin:any) => {
      const allowed = process.env.ORIGIN?.split(',').map(o => o.trim()) || []
      // only return the origin if it's explicitly allowed
      if (origin && allowed.includes(origin)) {
        return origin
      }
      return null // no header -> browser blocks it
    },
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    credentials: true,
  })
);

app.get("/api/auth/*", (c) => auth.handler(c.req.raw));
app.post("/api/auth/*", (c) => auth.handler(c.req.raw));

// Email verification success page
app.get("/user_verified", (c) => {
  const html = getEmailVerifiedTemplate(process.env.ORIGIN!);
  return c.html(html);
});

app.route("/api/user", usersRoutes);
app.route("/api/person", personsRoutes);
app.route("/api/group", groupsRoutes);
app.route("/api/event", eventsRoutes);

export default {
  port: process.env.PORT || 3000,
  hostname: "0.0.0.0",
  fetch: app.fetch,
};