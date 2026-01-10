import {
	pgTable,
	text,
	timestamp,
	boolean,
	integer,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

/**
 * Example Tables: tasks
 *
 * This is a sample implementation to demonstrate CRUD patterns.
 * You can modify, replace, or delete these tables based on your application needs.
 */

export const tasks = pgTable("tasks", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
	title: text("title").notNull(),
	description: text("description"),
	completed: boolean("completed").notNull().default(false),
	dueDate: timestamp("due_date"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
