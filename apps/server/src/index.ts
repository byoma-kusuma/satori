import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./lib/auth";
import { getEmailVerifiedTemplate } from "./templates/email-verified";
import { usersRoutes } from "./api/user/user.route";

const app = new Hono();

// CORS middleware configuration
const corsMiddleware = cors({
	origin: process.env.ORIGIN!,
	allowHeaders: ["Content-Type", "Authorization"],
	allowMethods: ["POST", "GET", "OPTIONS"],
	exposeHeaders: ["Content-Length"],
	credentials: true,
});

// Auth routes
app.use("/api/auth/*", corsMiddleware);
app.get("/api/auth/*", (c) => auth.handler(c.req.raw));
app.post("/api/auth/*", (c) => auth.handler(c.req.raw));

// Email verification success page
app.get("/user_verified", (c) => {
	const html = getEmailVerifiedTemplate(process.env.ORIGIN!);
	return c.html(html);
});

app.route("/api/user", usersRoutes);

export default app;