import { db } from '@common/db';
import { posts, user } from '@common/db/schema';
import { appLogger } from '@common/logger';

/**
 * Database Seed Script (OPTIONAL)
 * Populates the database with sample data for development.
 * * Usage: bun run db:seed
 *
 * WARNING: Only run this in development environments.
 */

async function seed() {
	appLogger.info('[SEED] Starting database seeding...');

	try {
		// Create sample users
		appLogger.info('[SEED] Creating sample users...');
		const [user1, user2] = await db
			.insert(user)
			.values([
				{
					id: 'sample-user-1',
					name: 'Alice Demo',
					email: 'alice@example.com',
					emailVerified: true,
				},
				{
					id: 'sample-user-2',
					name: 'Bob Sample',
					email: 'bob@example.com',
					emailVerified: true,
				},
			])
			.onConflictDoNothing()
			.returning();

		if (user1 && user2) {
			appLogger.info(`[SEED] Created users: ${user1.email}, ${user2.email}`);

			// Create sample posts
			appLogger.info('[SEED] Creating sample posts...');
			await db
				.insert(posts)
				.values([
					{
						title: 'Getting Started with Elysia',
						content:
							'Elysia is a fast and lightweight TypeScript framework built on top of Bun. It provides an intuitive API and excellent TypeScript support.',
						authorId: user1.id,
					},
					{
						title: 'Understanding Better Auth',
						content:
							'Better Auth is a modern authentication library that provides secure, cookie-based authentication out of the box. It handles sessions, CSRF protection, and more.',
						authorId: user1.id,
					},
					{
						title: 'Database Design Tips',
						content:
							'When designing your database schema, always consider relationships, indexing, and normalization. Use foreign keys to maintain referential integrity.',
						authorId: user2.id,
					},
					{
						title: 'TypeScript Best Practices',
						content:
							'Use strict mode, leverage type inference, and prefer interfaces over type aliases for object shapes. Always type your function parameters and return values.',
						authorId: user2.id,
					},
				])
				.onConflictDoNothing();

			appLogger.info('[SEED] Created sample posts');
		} else {
			appLogger.info('[SEED] Sample data already exists');
		}

		appLogger.info('[SEED] Database seeding completed successfully');
	} catch (error) {
		appLogger.error({ error }, '[SEED] Seeding failed');
		throw error;
	} finally {
		process.exit(0);
	}
}

seed();
