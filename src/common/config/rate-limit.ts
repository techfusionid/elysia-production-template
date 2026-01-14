import { rateLimit } from "elysia-rate-limit";
import { env } from "./env";

/**
 * Extract client IP from request headers
 * Handles proxied requests (production behind load balancer)
 */
export const getClientIP = (req: Request): string => {
	const forwarded = req.headers.get("x-forwarded-for");
	if (forwarded) {
		const ip = forwarded.split(",")[0]?.trim();
		if (ip) return ip;
	}
	return req.headers.get("x-real-ip") ?? "unknown";
};

/**
 * GLOBAL rate limiter
 * Default: 100 requests per minute per IP
 *
 * Note: Detailed logging is disabled to prevent body consumption conflicts
 * with Better Auth. Rate limit violations return 429 status code.
 */
export const globalRateLimit = rateLimit({
	duration: env.RATE_LIMIT_WINDOW_MS ?? 60000, // 1 minute
	max: env.RATE_LIMIT_MAX ?? 100, // 100 requests
	generator: getClientIP,

	skip: (req) => {
		// Skip CORS preflight and health checks
		if (req.method === "OPTIONS") return true;
		const pathname = new URL(req.url).pathname;

		// Skip health check
		if (pathname === "/health") return true;

		// Skip auth routes to prevent body consumption conflict with Better Auth
		if (pathname.startsWith("/api/auth")) return true;

		return false;
	},
});

/**
 * Strict rate limiter for AUTH ENDPOINTS
 * 10 requests per minute per IP (prevent brute force)
 */
export const authRateLimit = rateLimit({
	duration: env.AUTH_RATE_LIMIT_WINDOW_MS ?? 60000, // 1 minute
	max: env.AUTH_RATE_LIMIT_MAX ?? 10, // 10 requests
	errorResponse: new Response(
		JSON.stringify({
			error: "Too Many Requests",
			message: "Too many authentication attempts. Please try again later.",
		}),
		{
			status: 429,
			headers: { "Content-Type": "application/json" },
		}
	),
	generator: getClientIP,
});
