import { Elysia } from "elysia";
import { appLogger } from "@common/logger";

export const requestLogger = () =>
	new Elysia().onAfterResponse(({ request, set }) => {
		const url = new URL(request.url);
		const durationMs = (set as any).responseTime ?? 0;
		appLogger.info(
			`${set.status} ${request.method} ${url.pathname} (${durationMs}ms)`
		);
	});
