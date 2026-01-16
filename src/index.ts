import { env } from '@common/config/env';
import { closeDatabase } from '@common/db';
import { appLogger } from '@common/logger';
import { createApp } from './app';

// App entrypoint
const app = createApp();

const server = app.listen({
	hostname: env.HOST,
	port: env.PORT,
});

// Startup logs
appLogger.info(`[SERVER] Running at ${env.HOST}:${env.PORT}`);
appLogger.info(`[API] Documentation available at ${env.HOST}:${env.PORT}/docs`);
appLogger.info(`[HEALTH] Health check endpoint: ${env.HOST}:${env.PORT}/health`);

// Graceful shutdown
let isShuttingDown = false;

const shutdown = async (signal: string) => {
	if (isShuttingDown) return;
	isShuttingDown = true;

	appLogger.info(`${signal} received, shutting down gracefully...`);

	try {
		await Promise.resolve(server.stop());
		await closeDatabase();
		appLogger.info('Server closed successfully');
		process.exit(0);
	} catch (error) {
		appLogger.error({ error }, 'Error during shutdown');
		process.exit(1);
	}
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
