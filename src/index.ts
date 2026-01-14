import { app } from "./app";
import { env } from "@common/config/env";
import { logger } from "@common/logger";
import { closeDatabase } from "@common/db";

/**
 * Application entry point
 * Starts HTTP server and handles graceful shutdown
 */

const server = app.listen({
	hostname: env.HOST,
	port: env.PORT,
});

// Startup logs
logger.info(`[SERVER] Running at http://${env.HOST}:${env.PORT}`);
logger.info(
	`[API] Documentation available at http://${env.HOST}:${env.PORT}/docs`
);
logger.info(
	`[HEALTH] Health check endpoint: http://${env.HOST}:${env.PORT}/health`
);

// Graceful shutdown
const shutdown = async (signal: string) => {
	logger.info(`${signal} received, shutting down gracefully...`);

	try {
		await server.stop();
		await closeDatabase();
		logger.info("Server closed successfully");
		process.exit(0);
	} catch (error) {
		logger.error({ error }, "Error during shutdown");
		process.exit(1);
	}
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
