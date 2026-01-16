import { db } from '@common/db';
import { sql } from 'drizzle-orm';
import { Elysia, t } from 'elysia';

export const healthModule = new Elysia({ prefix: '/health' }).get(
	'/',
	async () => {
		const startTime = Date.now();

		// Check database connection
		let dbStatus = 'healthy';
		try {
			await db.execute(sql`SELECT 1`);
		} catch {
			dbStatus = 'unhealthy';
		}

		const responseTime = Date.now() - startTime;

		return {
			status: (dbStatus === 'healthy' ? 'ok' : 'degraded') as 'ok' | 'degraded',
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			database: dbStatus,
			responseTime: `${responseTime}ms`,
		};
	},
	{
		detail: {
			tags: ['Health'],
			summary: 'Health check endpoint',
			description: 'Returns server health status and database connectivity',
		},
		response: t.Object({
			status: t.Union([t.Literal('ok'), t.Literal('degraded')]),
			timestamp: t.String(),
			uptime: t.Number(),
			database: t.String(),
			responseTime: t.String(),
		}),
	},
);
