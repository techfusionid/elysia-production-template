import pino from 'pino';
import { env } from '@common/config/env';

/**
 * Application logger (Pino)
 * Pretty formatting in development, JSON in production
 */
export const logger = pino({
	level: env.LOG_LEVEL,
	transport:
		env.NODE_ENV === 'development'
			? {
					target: 'pino-pretty',
					options: {
						colorize: true,
						translateTime: 'HH:MM:ss',
						ignore: 'pid,hostname',
					},
				}
			: undefined,
});
