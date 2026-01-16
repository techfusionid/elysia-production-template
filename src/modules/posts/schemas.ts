import { t } from 'elysia';

export const postSchema = t.Object({
	id: t.String({ format: 'uuid' }),
	title: t.String(),
	content: t.String(),
	authorId: t.String(),
	authorName: t.Union([t.String(), t.Null()]),
	createdAt: t.Date(),
	updatedAt: t.Date(),
});

export const createPostSchema = t.Object({
	title: t.String({ minLength: 1, maxLength: 255 }),
	content: t.String({ minLength: 1 }),
});

export const updatePostSchema = t.Object({
	title: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
	content: t.Optional(t.String({ minLength: 1 })),
});

export const postIdParamSchema = t.Object({
	id: t.String({ format: 'uuid' }),
});
