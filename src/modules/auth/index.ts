import { Elysia } from "elysia";
import { auth } from "@common/config/auth";

/**
 * Authentication Module (Better Auth)
 * @see https://better-auth.com/docs/api
 */

export const authModule = new Elysia({ prefix: "/api/auth" })
	// Sign Up with Email
	.post("/sign-up/email", ({ request }) => auth.handler(request), {
		detail: {
			tags: ["Auth"],
			summary: "Register with email",
			description:
				"Create a new user account using email and password.\n\n" +
				"**Request Body (JSON):**\n" +
				"- `email` (string, required): User email address\n" +
				"- `password` (string, required): Password (min 8 characters)\n" +
				"- `name` (string, required): User full name (min 2 characters)\n" +
				"- `image` (string, optional): Profile image URL\n" +
				"- `callbackURL` (string, optional): Redirect URL after signup",
		},
	})
	// Sign In with Email
	.post("/sign-in/email", ({ request }) => auth.handler(request), {
		detail: {
			tags: ["Auth"],
			summary: "Login with email",
			description:
				"Authenticate user and create a session.\n\n" +
				"**Request Body (JSON):**\n" +
				"- `email` (string, required): User email address\n" +
				"- `password` (string, required): User password\n" +
				"- `callbackURL` (string, optional): Redirect URL after login",
		},
	})
	// Sign Out
	.post("/sign-out", ({ request }) => auth.handler(request), {
		detail: {
			tags: ["Auth"],
			summary: "Logout",
			description:
				"End the current user session. Requires active session cookie.",
		},
	})
	// Get Session
	.get("/get-session", ({ request }) => auth.handler(request), {
		detail: {
			tags: ["Auth"],
			summary: "Get current session",
			description:
				"Retrieve the authenticated user's session information.\n\n" +
				"Returns user data and session details if authenticated, or null if not authenticated.",
		},
	})
	// Catch-all for other Better Auth routes (OAuth, password reset, verification, etc.)
	.all("/*", ({ request }) => auth.handler(request));
