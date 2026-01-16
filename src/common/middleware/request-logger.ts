import { appLogger } from '@common/logger';
import { Elysia } from 'elysia';

export const requestLogger = () =>
	new Elysia()
		.onRequest(({ store }) => {
			(store as any).startTime = Date.now();
		})
		.onAfterResponse(({ request, set, store }) => {
			const url = new URL(request.url);
			const startTime = (store as any).startTime;
			const durationMs = startTime ? Date.now() - startTime : 0;

			appLogger.info(`${set.status} ${request.method} ${url.pathname} (${durationMs}ms)`);
		});
