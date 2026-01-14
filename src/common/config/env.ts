import { Type, type Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

/**
 * Environment configuration and validation.
 *
 * Validates all required environment variables at startup
 * to fail fast on misconfiguration.
 */

const EnvSchema = Type.Object({
	// Application
	NODE_ENV: Type.Union(
		[
			Type.Literal("development"),
			Type.Literal("production"),
			Type.Literal("test"),
		],
		{
			default: "development",
		}
	),
	PORT: Type.Number({
		default: 3000,
	}),
	HOST: Type.String({
		default: "0.0.0.0",
	}),

	// Database
	DATABASE_URL: Type.String({
		description: "PostgreSQL connection string",
		pattern: "^postgresql://.+",
	}),

	// Authentication
	ENABLE_AUTH: Type.Boolean({
		default: true,
		description: "Enable/disable Better Auth module",
	}),

	// Better Auth (required if ENABLE_AUTH=true)
	BETTER_AUTH_SECRET: Type.Optional(
		Type.String({
			minLength: 32,
			description: "Secret key for Better Auth (min 32 characters)",
		})
	),
	BETTER_AUTH_URL: Type.Optional(
		Type.String({
			default: "http://localhost:3000",
			description: "Base URL for authentication callbacks",
			pattern: "^https?://.+",
		})
	),

	// Optional: OAuth providers (uncomment if needed)
	// GITHUB_CLIENT_ID: Type.Optional(Type.String()),
	// GITHUB_CLIENT_SECRET: Type.Optional(Type.String()),
	// GOOGLE_CLIENT_ID: Type.Optional(Type.String()),
	// GOOGLE_CLIENT_SECRET: Type.Optional(Type.String()),

	// Logging
	LOG_LEVEL: Type.Union(
		[
			Type.Literal("fatal"),
			Type.Literal("error"),
			Type.Literal("warn"),
			Type.Literal("info"),
			Type.Literal("debug"),
			Type.Literal("trace"),
		],
		{
			default: "info",
		}
	),

	// CORS
	CORS_ORIGIN: Type.Array(Type.String(), {
		description: "Allowed CORS origins (comma-separated)",
		default: ["http://localhost:3000"],
	}),

	// Email (Optional - for email verification and password reset)
	RESEND_API_KEY: Type.Optional(
		Type.String({
			description:
				"Resend API key for sending emails (optional - logs to console if not set)",
		})
	),
	EMAIL_FROM: Type.String({
		description: "Email sender address",
		default: "noreply@example.com",
	}),

	// Rate Limiting
	RATE_LIMIT_WINDOW_MS: Type.Optional(
		Type.Number({
			description: "Global rate limit window in milliseconds",
			default: 60000,
		})
	),
	RATE_LIMIT_MAX: Type.Optional(
		Type.Number({
			description: "Max requests per window",
			default: 100,
		})
	),
	AUTH_RATE_LIMIT_WINDOW_MS: Type.Optional(
		Type.Number({
			description: "Auth rate limit window in milliseconds",
			default: 60000,
		})
	),
	AUTH_RATE_LIMIT_MAX: Type.Optional(
		Type.Number({
			description: "Max auth requests per window",
			default: 10,
		})
	),
});

export type Env = Static<typeof EnvSchema>;

/**
 * Validate and parse environment variables
 * Throws error if validation fails
 */
export function validateEnv(): Env {
	const rawCorsOrigin = process.env["CORS_ORIGIN"];
	const corsOriginArray = rawCorsOrigin
		? rawCorsOrigin.split(",").map((origin) => origin.trim())
		: ["http://localhost:3000"]; // Default fallback

	const rawEnv = {
		NODE_ENV: process.env["NODE_ENV"] || "development",
		PORT: Number(process.env["PORT"] ?? 3000),
		HOST: process.env["HOST"] || "0.0.0.0",
		DATABASE_URL: process.env["DATABASE_URL"],
		ENABLE_AUTH: process.env["ENABLE_AUTH"] !== "false",
		BETTER_AUTH_SECRET: process.env["BETTER_AUTH_SECRET"],
		BETTER_AUTH_URL: process.env["BETTER_AUTH_URL"] || "http://localhost:3000",
		LOG_LEVEL: process.env["LOG_LEVEL"] || "info",
		CORS_ORIGIN: corsOriginArray,
		RESEND_API_KEY: process.env["RESEND_API_KEY"],
		EMAIL_FROM: process.env["EMAIL_FROM"] || "noreply@example.com",
		RATE_LIMIT_WINDOW_MS: process.env["RATE_LIMIT_WINDOW_MS"]
			? Number(process.env["RATE_LIMIT_WINDOW_MS"])
			: undefined,
		RATE_LIMIT_MAX: process.env["RATE_LIMIT_MAX"]
			? Number(process.env["RATE_LIMIT_MAX"])
			: undefined,
		AUTH_RATE_LIMIT_WINDOW_MS: process.env["AUTH_RATE_LIMIT_WINDOW_MS"]
			? Number(process.env["AUTH_RATE_LIMIT_WINDOW_MS"])
			: undefined,
		AUTH_RATE_LIMIT_MAX: process.env["AUTH_RATE_LIMIT_MAX"]
			? Number(process.env["AUTH_RATE_LIMIT_MAX"])
			: undefined,
	};

	// Validate against schema
	if (!Value.Check(EnvSchema, rawEnv)) {
		const errors = [...Value.Errors(EnvSchema, rawEnv)];
		const errorMessages = errors
			.map((error) => `  - ${error.path}: ${error.message}`)
			.join("\n");

		throw new Error(`[ERROR] Environment validation failed:\n${errorMessages}`);
	}

	return Value.Decode(EnvSchema, rawEnv);
}

/**
 * Validated environment variables
 * Use this throughout the application instead of process.env
 */
export const env = validateEnv();
