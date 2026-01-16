import { db } from '@common/db';
import { posts, user } from '@common/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function getAllPosts() {
	return await db
		.select({
			id: posts.id,
			title: posts.title,
			content: posts.content,
			authorId: posts.authorId,
			authorName: user.name,
			createdAt: posts.createdAt,
			updatedAt: posts.updatedAt,
		})
		.from(posts)
		.leftJoin(user, eq(posts.authorId, user.id))
		.orderBy(desc(posts.createdAt));
}

export async function getPostById(id: string) {
	const [post] = await db
		.select({
			id: posts.id,
			title: posts.title,
			content: posts.content,
			authorId: posts.authorId,
			authorName: user.name,
			createdAt: posts.createdAt,
			updatedAt: posts.updatedAt,
		})
		.from(posts)
		.leftJoin(user, eq(posts.authorId, user.id))
		.where(eq(posts.id, id));

	return post;
}

export async function createPost(data: {
	title: string;
	content: string;
	authorId: string;
}) {
	const [post] = await db.insert(posts).values(data).returning();

	return post;
}

export async function updatePost(id: string, data: { title?: string; content?: string }) {
	const [post] = await db
		.update(posts)
		.set({
			...data,
			updatedAt: new Date(),
		})
		.where(eq(posts.id, id))
		.returning();

	return post;
}

export async function deletePost(id: string) {
	await db.delete(posts).where(eq(posts.id, id));
}

export async function isPostOwner(postId: string, userId: string): Promise<boolean> {
	const [post] = await db
		.select({ authorId: posts.authorId })
		.from(posts)
		.where(eq(posts.id, postId));

	return post?.authorId === userId;
}
