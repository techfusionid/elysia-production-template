/**
 * Task schemas (example SCHEMA)
 *
 * Reference implementation for TypeBox validation patterns
 * for request and response payloads.
 *
 * Use these schemas as a blueprint when defining schemas
 * for your own feature modules.
 */

import { t } from "elysia";

export const createTaskSchema = t.Object({
	title: t.String({ minLength: 1, maxLength: 255 }),
	description: t.Optional(t.String()),
	completed: t.Optional(t.Boolean({ default: false })),
	dueDate: t.Optional(t.String({ format: "date-time" })),
});

export const updateTaskSchema = t.Partial(createTaskSchema);

export const taskResponseSchema = t.Object({
	id: t.Number(),
	title: t.String(),
	description: t.Union([t.String(), t.Null()]),
	completed: t.Boolean(),
	dueDate: t.Union([t.Date(), t.Null()]),
	userId: t.String(),
	createdAt: t.Date(),
	updatedAt: t.Date(),
});
