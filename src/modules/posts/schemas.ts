import { posts } from '@/common/db/schema';
import { createInsertSchema, createUpdateSchema } from 'drizzle-typebox';
import { t } from 'elysia';

/**
 * API validation schemas using drizzle-typebox.
 * When you add/remove fields in Drizzle, they auto-include here.
 *
 * @see https://elysiajs.com/integrations/drizzle
 */

export const createPostSchema = createInsertSchema(posts, {
	title: t.String({ minLength: 1, maxLength: 255 }),
	content: t.String({ minLength: 1 }),
});

export const updatePostSchema = createUpdateSchema(posts, {
	title: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
	content: t.Optional(t.String({ minLength: 1 })),
});
