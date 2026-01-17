import { appLogger } from '@common/logger';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

/**
 * Database Migration Script
 * Runs all pending migrations from the ./drizzle folder.
 * * Usage: bun run db:migrate
 */

const DATABASE_URL = process.env['DATABASE_URL']!;

async function runMigrations() {
	appLogger.info('[MIGRATION] Starting database migration...');

	const migrationClient = postgres(DATABASE_URL, { max: 1 });
	const db = drizzle(migrationClient);

	try {
		await migrate(db, { migrationsFolder: './drizzle' });
		appLogger.info('[MIGRATION] Migrations completed successfully');
	} catch (error) {
		appLogger.error({ error }, '[MIGRATION] Migration failed');
		throw error;
	} finally {
		await migrationClient.end();
	}
}

runMigrations()
	.then(() => {
		appLogger.info('[MIGRATION] Migration script finished');
		process.exit(0);
	})
	.catch((error) => {
		console.error('[MIGRATION] Critical error:', error);
		appLogger.error({ error }, '[MIGRATION] Migration script failed');
		process.exit(1);
	});
