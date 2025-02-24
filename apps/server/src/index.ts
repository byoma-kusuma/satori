import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./lib/auth";
import { getEmailVerifiedTemplate } from "./templates/email-verified";
import { usersRoutes } from "./api/user/user.route";
import { personRoutes } from "./api/person/person.route";

const app = new Hono();

// CORS middleware configuration
app.use(
  '/api/*',
  cors({
    origin: process.env.ORIGIN!,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
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
app.route("/api/person", personRoutes);

export default app;