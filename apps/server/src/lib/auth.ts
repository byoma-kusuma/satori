import { betterAuth } from "better-auth";
import type { BetterAuthOptions } from "better-auth";
import { Pool } from "pg";
import { sendEmail } from "./email";
import { validateEmailForSignup } from "./email-validation";

const authOptions: BetterAuthOptions = {
  logger: {
    level: "debug",
  },
  trustedOrigins: process.env.ORIGIN
    ? process.env.ORIGIN.split(",").map((o) => o.trim())
    : [],
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url, token }, request) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        text: `Click the link to reset your password: ${url}`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url, token }, request) => {
      // Validate email before sending verification
      validateEmailForSignup(user.email);
      
      await sendEmail({
        to: user.email,
        subject: "Verify your email address",
        text: `Click the link to verify your email: ${url}`,
      });
    },
    autoSignInAfterVerification: true,
  },
};

export const auth = betterAuth(authOptions);
