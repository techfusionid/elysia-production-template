/**
 * Task service layer (example CRUD)
 *
 * Reference implementation of business logic for feature modules.
 * Demonstrates common CRUD and ownership patterns.
 */

import { db } from "@common/db";
import { tasks } from "@common/db/schema";
import { eq, and } from "drizzle-orm";

export async function createTask(data: {
	title: string;
	description?: string;
	userId: string;
	completed?: boolean;
	dueDate?: Date;
}) {
	const [task] = await db
		.insert(tasks)
		.values({
			title: data.title,
			description: data.description,
			userId: data.userId,
			completed: data.completed ?? false,
			dueDate: data.dueDate,
		})
		.returning();

	return task;
}

export async function getTaskById(id: number, userId: string) {
	const [task] = await db
		.select()
		.from(tasks)
		.where(and(eq(tasks.id, id), eq(tasks.userId, userId)));

	return task;
}

export async function getUserTasks(userId: string) {
	return await db.select().from(tasks).where(eq(tasks.userId, userId));
}

export async function updateTask(
	id: number,
	userId: string,
	data: Partial<{
		title: string;
		description: string;
		completed: boolean;
		dueDate: Date;
	}>
) {
	const [task] = await db
		.update(tasks)
		.set({ ...data, updatedAt: new Date() })
		.where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
		.returning();

	return task;
}

export async function deleteTask(id: number, userId: string) {
	const [task] = await db
		.delete(tasks)
		.where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
		.returning();

	return task;
}
