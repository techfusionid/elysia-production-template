/**
 * Example feature module: Tasks
 *
 * This module serves as a reference implementation for:
 * - protected routes
 * - request/response validation
 * - basic CRUD patterns
 *
 * You can adapt this module to your own,
 * or use it as a blueprint for new features.
 */
import { Elysia, t } from "elysia";
import { requireAuth } from "@common/middleware/auth";
import * as service from "./service";
import {
	createTaskSchema,
	updateTaskSchema,
	taskResponseSchema,
} from "./schemas";

export const exampleModule = new Elysia({ prefix: "/api/tasks" })
	.use(requireAuth)
	.post(
		"/",
		async (ctx) => {
			const { body, user } = ctx as typeof ctx & { user: any };
			const task = await service.createTask({
				...body,
				userId: user.id,
				dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
			});
			return task!;
		},
		{
			body: createTaskSchema,
			response: taskResponseSchema,
			detail: {
				tags: ["Tasks"],
				summary: "Create a new task",
				description: "Create a new task for the authenticated user",
			},
		}
	)
	.get(
		"/",
		async (ctx) => {
			const { user } = ctx as typeof ctx & { user: any };
			return await service.getUserTasks(user.id);
		},
		{
			response: t.Array(taskResponseSchema),
			detail: {
				tags: ["Tasks"],
				summary: "Get all user tasks",
				description: "Retrieve all tasks created by the authenticated user",
			},
		}
	)
	.get(
		"/:id",
		async (ctx) => {
			const { params, user, set } = ctx as typeof ctx & { user: any };
			const task = await service.getTaskById(Number(params.id), user.id);
			if (!task) {
				set.status = 404;
				throw new Error("Task not found");
			}
			return task;
		},
		{
			params: t.Object({ id: t.String() }),
			response: taskResponseSchema,
			detail: {
				tags: ["Tasks"],
				summary: "Get a task by ID",
				description: "Retrieve a specific task by its ID",
			},
		}
	)
	.patch(
		"/:id",
		async (ctx) => {
			const { params, body, user, set } = ctx as typeof ctx & { user: any };
			const task = await service.updateTask(Number(params.id), user.id, {
				...body,
				dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
			});
			if (!task) {
				set.status = 404;
				throw new Error("Task not found");
			}
			return task;
		},
		{
			params: t.Object({ id: t.String() }),
			body: updateTaskSchema,
			response: taskResponseSchema,
			detail: {
				tags: ["Tasks"],
				summary: "Update a task",
				description: "Update an existing task",
			},
		}
	)
	.delete(
		"/:id",
		async (ctx) => {
			const { params, user, set } = ctx as typeof ctx & { user: any };
			const task = await service.deleteTask(Number(params.id), user.id);
			if (!task) {
				set.status = 404;
				throw new Error("Task not found");
			}
			return { success: true, deletedTask: task };
		},
		{
			params: t.Object({ id: t.String() }),
			detail: {
				tags: ["Tasks"],
				summary: "Delete a task",
				description: "Delete a task by its ID",
			},
		}
	);
