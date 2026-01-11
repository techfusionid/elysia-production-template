import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { env } from "@common/config/env";
import { logger } from "@common/logger";
import { authModule } from "@modules/auth";
import { healthModule } from "@modules/health";
import { postsModule } from "@modules/posts";

/**
 * Application composition root.
 *
 * Registers global middleware, OpenAPI/Scalar documentation,
 * error handling, and feature modules.
 */

export const app = new Elysia()
	.use(
		cors({
			origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
			credentials: true,
		})
	)
	.use(
swagger({
			documentation: {
				info: {
					title: "Elysia Production API",
					version: "1.0.0",
					description:
						"Production-ready Elysia.js backend with auth, database, and best practices.\n\n" +
						"**Authentication Endpoints** (via Better Auth):\n" +
						"- POST `/api/auth/sign-up/email` - Register with email\n" +
						"- POST `/api/auth/sign-in/email` - Login with email\n" +
						"- POST `/api/auth/sign-out` - Logout\n" +
						"- GET `/api/auth/get-session` - Get current session\n\n" +
						"Full Better Auth docs: https://better-auth.com",
				},
				tags: [
					{ name: "Health", description: "Health check endpoints" },
					{ name: "Auth", description: "Authentication endpoints (Better Auth)" },
					{ name: "Posts", description: "Posts CRUD endpoints (reference implementation)" },
				],
			},
			scalarConfig: {
				theme: "purple",
			},
		})
	)
	.onError(({ code, error, set }) => {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.error({ code, error: errorMessage });

		if (code === "NOT_FOUND") {
			set.status = 404;
			return { error: "Route not found" };
		}

		if (code === "VALIDATION") {
			set.status = 400;
			return { error: "Validation error", message: errorMessage };
		}

		set.status = 500;
		return {
			error: "Internal server error",
			message: env.NODE_ENV === "development" ? errorMessage : undefined,
		};
	})
	.onRequest(({ request }) => {
		logger.info({
			method: request.method,
			url: request.url,
		});
	})
	// Feature Modules
	.use(healthModule)
	.use(authModule)
	.use(postsModule);
