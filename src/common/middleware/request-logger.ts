import { Elysia } from "elysia";
import { logger } from "@common/logger";

/**
 * Request/response logging middleware
 * Logs all requests with method, URL, status, and duration
 */
export const requestLogger = new Elysia({ name: "request-logger" })
	.onRequest(({ store }: any) => {
		store.startTime = Date.now();
	})
	.onAfterResponse(({ request, set, store, response }: any) => {
		const duration = Date.now() - (store.startTime || 0);
		const actualStatus = response?.status ?? set.status ?? 200;

		// Skip 429s - already logged by rate limiter with IP details
		if (actualStatus === 429) return;

		const logData: Record<string, any> = {
			method: request.method,
			url: request.url,
			status: actualStatus,
			duration: `${duration}ms`,
		};

		if (actualStatus >= 500) {
			logger.error(logData);
		} else if (actualStatus >= 400) {
			logger.warn(logData);
		} else {
			logger.info(logData);
		}
	});
