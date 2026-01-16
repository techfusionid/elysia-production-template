import { env } from '@common/config/env';
import pino from 'pino';

const isTest = process.env.NODE_ENV === 'test'; // Bun sets this during `bun test`

export const appLogger = pino({
	level: isTest ? 'silent' : (env.LOG_LEVEL ?? 'info'),
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
