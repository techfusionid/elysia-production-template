import { withAuth } from '@common/middleware/auth-guard';
import { Elysia, t } from 'elysia';
import { createPostSchema, updatePostSchema } from './schemas';
import * as service from './service';

/**
 * Posts CRUD Module
 *
 * Demonstrates public/protected routes with ownership validation.
 */
export const postsModule = withAuth(new Elysia({ prefix: '/api/posts' }))
	// GET /api/posts - Public (anyone can view)
	.get(
		'/',
		async () => {
			const posts = await service.getAllPosts();
			return {
				data: posts,
				total: posts.length,
			};
		},
		{
			detail: {
				tags: ['Posts'],
				summary: 'Get all posts',
				description: 'Public endpoint - returns all posts with author info',
			},
		},
	)

	// GET /api/posts/:id - Public
	.get(
		'/:id',
		async ({ params, set }) => {
			const post = await service.getPostById(params.id);

			if (!post) {
				set.status = 404;
				return { error: 'Not Found', message: 'Post not found' };
			}

			return { data: post };
		},
		{
			params: t.Object({
				id: t.String({ format: 'uuid' }),
			}),
			detail: {
				tags: ['Posts'],
				summary: 'Get post by ID',
				description: 'Public endpoint - returns a single post',
			},
		},
	)

	// POST /api/posts - Authenticated users
	.post(
		'/',
		async ({ body, user, set }: any) => {
			const post = await service.createPost({
				title: body.title,
				content: body.content,
				authorId: user.id,
			});

			set.status = 201;
			return {
				message: 'Post created successfully',
				data: post,
			};
		},
		{
			auth: true, // 👈 Require login (any authenticated user)
			body: t.Omit(createPostSchema, ['id', 'authorId', 'createdAt', 'updatedAt']),
			detail: {
				tags: ['Posts'],
				summary: 'Create post',
				description: 'Protected - creates a new post for authenticated user',
			},
		},
	)

	// PUT /api/posts/:id - Owner only
	.put(
		'/:id',
		async ({ params, body, user, set }: any) => {
			// ownership check
			const isOwner = await service.isPostOwner(params.id, user.id);

			if (!isOwner) {
				set.status = 403;
				return {
					error: 'Forbidden',
					message: 'You can only update your own posts',
				};
			}

			const post = await service.updatePost(params.id, body);

			if (!post) {
				set.status = 404;
				return { error: 'Not Found', message: 'Post not found' };
			}

			return {
				message: 'Post updated successfully',
				data: post,
			};
		},
		{
			auth: true, // 👈 Require login + ownership check in handler
			params: t.Object({
				id: t.String({ format: 'uuid' }),
			}),
			body: t.Omit(updatePostSchema, ['id', 'authorId', 'createdAt', 'updatedAt']),
			detail: {
				tags: ['Posts'],
				summary: 'Update post',
				description: 'Protected - updates a post (owner only)',
			},
		},
	)

	// DELETE /api/posts/:id - Owner only
	.delete(
		'/:id',
		async ({ params, user, set }: any) => {
			// ownership check
			const isOwner = await service.isPostOwner(params.id, user.id);

			if (!isOwner) {
				set.status = 403;
				return {
					error: 'Forbidden',
					message: 'You can only delete your own posts',
				};
			}

			await service.deletePost(params.id);

			return {
				message: 'Post deleted successfully',
			};
		},
		{
			auth: true, // 👈 Require login + ownership check in handler
			params: t.Object({
				id: t.String({ format: 'uuid' }),
			}),
			detail: {
				tags: ['Posts'],
				summary: 'Delete post',
				description: 'Protected - deletes a post (owner only)',
			},
		},
	);
