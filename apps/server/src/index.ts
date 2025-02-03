import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./lib/auth";

const app = new Hono();

app.use(
	"/api/auth/*",
	cors({
		origin: process.env.ORIGIN!,
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["POST", "GET", "OPTIONS"],
		exposeHeaders: ["Content-Length"],
		credentials: true,
	}),
);

app.get("/api/auth/*", (c) => auth.handler(c.req.raw));
app.post("/api/auth/*", (c) => auth.handler(c.req.raw));

app.get("/user_verified", (c) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verified</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                background-color: #f5f5f5;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
            }
            .container {
                background: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                text-align: center;
                max-width: 400px;
            }
            .icon {
                color: #10b981;
                font-size: 48px;
                margin-bottom: 1rem;
            }
            h1 {
                color: #111827;
                margin-bottom: 1rem;
            }
            p {
                color: #6b7280;
                margin-bottom: 0.5rem;
            }
            .redirect-text {
                font-size: 0.875rem;
                color: #9ca3af;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="icon">✓</div>
            <h1>Email Verified!</h1>
            <p>Your email has been successfully verified.</p>
            <p class="redirect-text">Redirecting you back in a few seconds...</p>
        </div>
        <script>
            setTimeout(() => {
                window.location.href = "${process.env.ORIGIN}";
            }, 3000);
        </script>
    </body>
    </html>
  `;
  
  return c.html(html);
});

export default app;