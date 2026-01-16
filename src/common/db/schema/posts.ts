import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { user } from './auth';

/**
 * Posts table - User-created posts with CRUD operations
 * Demonstrates public read, protected write/update/delete patterns
 */
export const posts = pgTable('posts', {
	id: uuid('id').primaryKey().defaultRandom(),
	title: text('title').notNull(),
	content: text('content').notNull(),
	authorId: text('author_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
