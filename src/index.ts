import { env } from '@common/config/env';
import { closeDatabase } from '@common/db';
import { appLogger } from '@common/logger';
import { app } from './app';

// App entrypoint
const server = app.listen({
	hostname: env.HOST,
	port: env.PORT,
});

// Startup logs
appLogger.info(`[SERVER] Running at http://${env.HOST}:${env.PORT}`);
appLogger.info(`[API] Documentation available at http://${env.HOST}:${env.PORT}/docs`);
appLogger.info(`[HEALTH] Health check endpoint: http://${env.HOST}:${env.PORT}/health`);

// Graceful shutdown
const shutdown = async (signal: string) => {
	appLogger.info(`${signal} received, shutting down gracefully...`);

	try {
		await server.stop();
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
