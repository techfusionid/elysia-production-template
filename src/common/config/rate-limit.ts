import { rateLimit } from "elysia-rate-limit";
import { env } from "./env";

/** Helper to create rate limit error responses */
const rateLimitResponse = (message: string) =>
	new Response(JSON.stringify({ error: "Too Many Requests", message }), {
		status: 429,
		headers: { "Content-Type": "application/json" },
	});

/**
 * Extract client IP from request headers
 * Handles proxied requests (production behind load balancer)
 */
const getClientIP = (req: Request): string => {
	const forwarded = req.headers.get("x-forwarded-for");
	if (forwarded) {
		const ip = forwarded.split(",")[0]?.trim();
		if (ip) return ip;
	}
	return req.headers.get("x-real-ip") ?? "unknown";
};

/**
 * GLOBAL rate limiter config
 * Default: 100 requests per minute per IP
 */
export const globalRateLimit = rateLimit({
	duration: env.RATE_LIMIT_WINDOW_MS ?? 60000, // 1 minute
	max: env.RATE_LIMIT_MAX ?? 100, // 100 requests
	errorResponse: rateLimitResponse(
		"Rate limit exceeded. Please try again later."
	),
	generator: getClientIP,

	skip: (req) => {
		if (req.method === "OPTIONS") return true;

		// Skip rate limit for health check
		const pathname = new URL(req.url).pathname;
		return pathname === "/health";
	},
});

/**
 * Strict rate limiter for AUTH ENDPOINTS
 * 10 requests per minute per IP (prevent brute force)
 */
export const authRateLimit = rateLimit({
	duration: env.AUTH_RATE_LIMIT_WINDOW_MS ?? 60000, // 1 minute
	max: env.AUTH_RATE_LIMIT_MAX ?? 10, // 10 requests
	errorResponse: rateLimitResponse(
		"Too many authentication attempts. Please try again later."
	),
	generator: getClientIP,
});
