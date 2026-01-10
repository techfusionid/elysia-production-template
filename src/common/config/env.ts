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

	// Better Auth
	BETTER_AUTH_SECRET: Type.String({
		minLength: 32,
		description: "Secret key for Better Auth (min 32 characters)",
	}),
	BETTER_AUTH_URL: Type.String({
		default: "http://localhost:3000",
		description: "Base URL for authentication callbacks",
		pattern: "^https?://.+",
	}),

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
	CORS_ORIGIN: Type.String({
		description: "Allowed CORS origins (comma-separated)",
		default: ["http://localhost:3000"],
	}),
});

export type Env = Static<typeof EnvSchema>;

/**
 * Validate and parse environment variables
 * Throws error if validation fails
 */
export function validateEnv(): Env {
	const rawEnv = {
		NODE_ENV: process.env["NODE_ENV"] || "development",
		PORT: Number(process.env["PORT"] ?? 3000),
		HOST: process.env["HOST"] || "0.0.0.0",
		DATABASE_URL: process.env["DATABASE_URL"],
		BETTER_AUTH_SECRET: process.env["BETTER_AUTH_SECRET"],
		BETTER_AUTH_URL: process.env["BETTER_AUTH_URL"] || "http://localhost:3000",
		LOG_LEVEL: process.env["LOG_LEVEL"] || "info",
		CORS_ORIGIN: process.env["CORS_ORIGIN"],
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
