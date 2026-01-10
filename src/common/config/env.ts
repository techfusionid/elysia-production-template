import { Type, type Static } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

/**
 * Environment configuration schema
 * Using TypeBox for runtime validation and type inference
 */
const EnvSchema = Type.Object({
	// Application
	NODE_ENV: Type.Union(
		[Type.Literal('development'), Type.Literal('production'), Type.Literal('test')],
		{
			default: 'development',
		},
	),
	PORT: Type.String({
		default: '3000',
		pattern: '^[0-9]+$',
	}),
	HOST: Type.String({
		default: '0.0.0.0',
	}),

	// Database
	DATABASE_URL: Type.String({
		format: 'uri',
		description: 'PostgreSQL connection string',
	}),

	// Better Auth
	BETTER_AUTH_SECRET: Type.String({
		minLength: 32,
		description: 'Secret key for Better Auth (min 32 characters)',
	}),
	BETTER_AUTH_URL: Type.String({
		format: 'uri',
		default: 'http://localhost:3000',
		description: 'Base URL for authentication callbacks',
	}),

	// Optional: OAuth providers (uncomment if needed)
	// GITHUB_CLIENT_ID: Type.Optional(Type.String()),
	// GITHUB_CLIENT_SECRET: Type.Optional(Type.String()),
	// GOOGLE_CLIENT_ID: Type.Optional(Type.String()),
	// GOOGLE_CLIENT_SECRET: Type.Optional(Type.String()),

	// Logging
	LOG_LEVEL: Type.Union(
		[
			Type.Literal('fatal'),
			Type.Literal('error'),
			Type.Literal('warn'),
			Type.Literal('info'),
			Type.Literal('debug'),
			Type.Literal('trace'),
		],
		{
			default: 'info',
		},
	),

	// CORS
	CORS_ORIGIN: Type.String({
		default: '*',
		description: 'Allowed CORS origins (comma-separated for multiple)',
	}),
});

export type Env = Static<typeof EnvSchema>;

/**
 * Validate and parse environment variables
 * Throws error if validation fails
 */
export function validateEnv(): Env {
	const rawEnv = {
		NODE_ENV: process.env.NODE_ENV || 'development',
		PORT: process.env.PORT || '3000',
		HOST: process.env.HOST || '0.0.0.0',
		DATABASE_URL: process.env.DATABASE_URL,
		BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
		BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
		LOG_LEVEL: process.env.LOG_LEVEL || 'info',
		CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
	};

	// Validate against schema
	if (!Value.Check(EnvSchema, rawEnv)) {
		const errors = [...Value.Errors(EnvSchema, rawEnv)];
		const errorMessages = errors
			.map((error) => `  - ${error.path}: ${error.message}`)
			.join('\n');

		throw new Error(`❌ Environment validation failed:\n${errorMessages}`);
	}

	return Value.Decode(EnvSchema, rawEnv);
}

/**
 * Validated environment variables
 * Use this throughout the application instead of process.env
 */
export const env = validateEnv();
