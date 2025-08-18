import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./lib/auth";
import { getEmailVerifiedTemplate } from "./templates/email-verified";
import { usersRoutes } from "./api/user/user.route";
import { personsRoutes } from "./api/person/person.route";
import { groupsRoutes } from "./api/group/group.route";
import { eventsRoutes } from "./api/event/event.route";

const app = new Hono();

// CORS middleware configuration
app.use(
  '*',
  cors({
    origin: process.env.NODE_ENV === 'development'
      ? [`http://localhost:${process.env.FRONTEND_PORT}`]
      : (process.env.ORIGIN ? process.env.ORIGIN.split(',').map(o => o.trim()) : [`http://localhost:${process.env.FRONTEND_PORT}`]),
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