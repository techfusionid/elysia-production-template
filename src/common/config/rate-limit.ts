import { rateLimit } from "elysia-rate-limit";
import { env } from "./env";
import { logger } from "@common/logger";

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
 * Temporary storage for request context during rate limit check
 * Used to include IP/path/method in rate limit violation logs
 */
let currentRequestContext: { ip: string; path: string; method: string } | null =
	null;

/**
 * GLOBAL rate limiter with logging
 * Default: 100 requests per minute per IP
 */
export const globalRateLimit = rateLimit({
	duration: env.RATE_LIMIT_WINDOW_MS ?? 60000, // 1 minute
	max: env.RATE_LIMIT_MAX ?? 100, // 100 requests
	generator: (req) => {
		const ip = getClientIP(req);
		const pathname = new URL(req.url).pathname;
		currentRequestContext = { ip, path: pathname, method: req.method };
		return ip;
	},

	errorResponse: new Proxy(
		new Response(
			JSON.stringify({
				error: "Too Many Requests",
				message: "Rate limit exceeded. Please try again later.",
			}),
			{
				status: 429,
				headers: { "Content-Type": "application/json" },
			}
		),
		{
			get(target, prop) {
				if (prop === "clone") {
					return function () {
						// Log rate limit violation with request details
						if (currentRequestContext) {
							logger.warn(
								{
									ip: currentRequestContext.ip,
									path: currentRequestContext.path,
									method: currentRequestContext.method,
								},
								"Rate limit exceeded"
							);
						} else {
							logger.warn("Rate limit exceeded");
						}
						return target.clone();
					};
				}
				return Reflect.get(target, prop);
			},
		}
	),

	skip: (req) => {
		// Skip CORS preflight and health checks
		if (req.method === "OPTIONS") return true;
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
