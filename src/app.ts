import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { env } from "@common/config/env";
import { healthModule } from "@modules/health";
import { postsModule } from "@modules/posts";
import { authModule } from "@modules/auth";
import { appLogger } from "./common/logger";
import { requestLogger } from "./common/middleware/request-logger";

/**
 * Application composition root.
 *
 * Registers global middleware, OpenAPI/Scalar documentation,
 * error handling, and feature modules.
 * * @see https://elysiajs.com/concepts/plugin.html
 */

export const app = new Elysia()
	.use(requestLogger)
	.use(
		cors({
			origin: env.CORS_ORIGIN,
			credentials: true,
		})
	)
	// ---  API Documentation (open at /docs) ---
	.use(
		swagger({
			path: "/docs",
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
					{
						name: "Auth",
						description: "Authentication endpoints (Better Auth)",
					},
					{
						name: "Posts",
						description: "Posts CRUD endpoints (reference implementation)",
					},
				],
			},
			scalarConfig: {
				theme: "purple",
			},
		})
	)
	.onError(({ code, error, set }) => {
		const errorMessage = error instanceof Error ? error.message : String(error);

		appLogger.error({
			code,
			error: errorMessage,
			stack:
				env.NODE_ENV === "development" && error instanceof Error
					? error.stack
					: undefined,
		});

		if (code === "NOT_FOUND") {
			set.status = 404;
			return { error: "Route not found" };
		}

		if (code === "VALIDATION") {
			set.status = 400;

			let parsedMessage = errorMessage;
			try {
				if (typeof errorMessage === "string" && errorMessage.startsWith("{")) {
					parsedMessage = JSON.parse(errorMessage);
				}
			} catch {}

			return {
				error: "Validation error",
				message: parsedMessage,
			};
		}

		set.status = 500;
		return {
			error: "Internal server error",
			message: env.NODE_ENV === "development" ? errorMessage : undefined,
		};
	})

	/**
	 * Feature Modules
	 * Register your business logic modules here.
	 */
	.use(healthModule)
	.use(postsModule);

if (env.ENABLE_AUTH) {
	app.use(authModule);
	appLogger.info("[AUTH] Authentication module enabled");
} else {
	appLogger.info("[AUTH] Authentication disabled (ENABLE_AUTH=false)");
}
