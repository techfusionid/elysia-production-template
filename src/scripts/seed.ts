import { db } from "@common/db";
import { user, userProfiles } from "@common/db/schema";
import { logger } from "@common/logger";

/**
 * Database Seed Script
 *
 * Populates the database with sample data for development.
 * Usage: bun run db:seed
 *
 * WARNING: Only run this in development environments.
 */

async function seed() {
	logger.info("[SEED] Starting database seeding...");

	try {
		// Create sample users
		logger.info("[SEED] Creating sample users...");
		const [user1, user2] = await db
			.insert(user)
			.values([
				{
					id: "sample-user-1",
					name: "Alice Demo",
					email: "alice@example.com",
					emailVerified: true,
				},
				{
					id: "sample-user-2",
					name: "Bob Sample",
					email: "bob@example.com",
					emailVerified: true,
				},
			])
			.onConflictDoNothing()
			.returning();

		if (user1) {
			logger.info(`[SEED] Created user: ${user1.email}`);

			// Create profile for user1
			await db
				.insert(userProfiles)
				.values({
					userId: user1.id,
					bio: "Full-stack developer passionate about building great products",
					website: "https://alice.dev",
					location: "San Francisco, CA",
				})
				.onConflictDoNothing();

			logger.info("[SEED] Created profile for Alice");
		} else {
			logger.info("[SEED] Sample users already exist");
		}

		if (user2) {
			logger.info(`[SEED] Created user: ${user2.email}`);

			// Create profile for user2
			await db
				.insert(userProfiles)
				.values({
					userId: user2.id,
					bio: "Designer and creative thinker",
					website: "https://bobdesigns.com",
					location: "New York, NY",
				})
				.onConflictDoNothing();

			logger.info("[SEED] Created profile for Bob");
		}

		logger.info("[SEED] Database seeding completed successfully");
	} catch (error) {
		logger.error({ error }, "[SEED] Seeding failed");
		throw error;
	} finally {
		process.exit(0);
	}
}

seed();
