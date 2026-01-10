import { db } from "@common/db";
import { userProfiles } from "@/common/db/schema/profile";
import { user } from "@common/db/schema";
import { eq } from "drizzle-orm";

/**
 * Profile service layer
 * Business logic for user profile operations
 */


export async function getPublicProfile(userId: string) {
	const [result] = await db
		.select({
			id: user.id,
			name: user.name,
			image: user.image,
			bio: userProfiles.bio,
			website: userProfiles.website,
			location: userProfiles.location,
		})
		.from(user)
		.leftJoin(userProfiles, eq(user.id, userProfiles.userId))
		.where(eq(user.id, userId));

	return result;
}

export async function getMyProfile(userId: string) {
	return await getPublicProfile(userId);
}

export async function updateProfile(
	userId: string,
	data: {
		bio?: string;
		website?: string;
		location?: string;
	}
) {
	await db
		.insert(userProfiles)
		.values({
			userId,
			...data,
			updatedAt: new Date(),
		})
		.onConflictDoUpdate({
			target: userProfiles.userId,
			set: {
				...data,
				updatedAt: new Date(),
			},
		})
		.returning();

	return await getPublicProfile(userId);
}

export async function getStats() {
	const [result] = await db
		.select({
			totalUsers: db.$count(user.id),
		})
		.from(user);

	return {
		totalUsers: result?.totalUsers ?? 0,
	};
}
