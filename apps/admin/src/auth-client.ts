import { createAuthClient } from "better-auth/client";

// Create the auth client with the appropriate endpoint.
// Adjust the endpoint URL if necessary.
export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
});