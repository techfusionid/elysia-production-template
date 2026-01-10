import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '@common/config/env';
import * as schema from './schema';

// Postgres connection
const client = postgres(env.DATABASE_URL, {
	max: 10,
	idle_timeout: 20,
	connect_timeout: 10,
});

// Drizzle instance
export const db = drizzle(client, { schema });

// Graceful shutdown
export async function closeDatabase() {
	await client.end();
}
