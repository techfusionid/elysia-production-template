import { describe, expect, it } from 'bun:test';
import { createApp } from '../src/app';

describe('Posts Module', () => {
	const app = createApp();
	const testEmail = `posts-test-${Date.now()}@example.com`;
	const testPassword = 'TestPassword123!';
	const testName = 'Posts Test User';

	// Helper to sign up and get auth cookie
	async function getAuthCookie(): Promise<string> {
		// Sign up
		await app.handle(
			new Request('http://localhost/api/auth/sign-up/email', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: testEmail,
					password: testPassword,
					name: testName,
				}),
			}),
		);

		// Sign in
		const signInResponse = await app.handle(
			new Request('http://localhost/api/auth/sign-in/email', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: testEmail,
					password: testPassword,
				}),
			}),
		);

		return signInResponse.headers.get('set-cookie') || '';
	}

	describe('Public Routes', () => {
		it('GET /api/posts returns list of posts', async () => {
			const response = await app.handle(new Request('http://localhost/api/posts'));
			const body = await response.json();

			expect(response.status).toBe(200);
			expect(body).toHaveProperty('data');
			expect(body).toHaveProperty('total');
			expect(Array.isArray(body.data)).toBe(true);
		});

		it('GET /api/posts/:id returns 404 for non-existent post', async () => {
			const fakeId = '11111111-1111-4111-8111-111111111111';

			const response = await app.handle(new Request(`http://localhost/api/posts/${fakeId}`));
			const body = await response.json();

			expect(response.status).toBe(404);
			expect(body.error).toBe('Not Found');
		});

		it('GET /api/posts/:id returns 400 for invalid UUID', async () => {
			const response = await app.handle(new Request('http://localhost/api/posts/invalid-uuid'));
			expect(response.status).toBe(400);
		});
	});

	describe('Protected Routes - Unauthenticated', () => {
		it('POST /api/posts returns 401 without auth', async () => {
			const response = await app.handle(
				new Request('http://localhost/api/posts', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						title: 'Test Post',
						content: 'Test content',
					}),
				}),
			);

			expect(response.status).toBe(401);
		});

		it('PUT /api/posts/:id returns 401 without auth', async () => {
			const fakeId = '11111111-1111-4111-8111-111111111111';

			const response = await app.handle(
				new Request(`http://localhost/api/posts/${fakeId}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						title: 'Updated Title',
					}),
				}),
			);

			expect(response.status).toBe(401);
		});

		it('DELETE /api/posts/:id returns 401 without auth', async () => {
			const fakeId = '11111111-1111-4111-8111-111111111111';

			const response = await app.handle(
				new Request(`http://localhost/api/posts/${fakeId}`, {
					method: 'DELETE',
				}),
			);

			expect(response.status).toBe(401);
		});
	});

	describe('Protected Routes - Authenticated', () => {
		let authCookie: string;
		let createdPostId: string;

		it('POST /api/posts creates a post for authenticated user', async () => {
			authCookie = await getAuthCookie();

			const response = await app.handle(
				new Request('http://localhost/api/posts', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Cookie: authCookie,
					},
					body: JSON.stringify({
						title: 'Test Post Title',
						content: 'Test post content here',
					}),
				}),
			);

			expect(response.status).toBe(201);

			const body = await response.json();
			expect(body.message).toBe('Post created successfully');
			expect(body.data).toBeDefined();
			expect(body.data.title).toBe('Test Post Title');
			expect(body.data.content).toBe('Test post content here');

			createdPostId = body.data.id;
		});

		it('GET /api/posts/:id returns created post', async () => {
			const response = await app.handle(new Request(`http://localhost/api/posts/${createdPostId}`));

			expect(response.status).toBe(200);

			const body = await response.json();
			expect(body.data.id).toBe(createdPostId);
			expect(body.data.title).toBe('Test Post Title');
		});

		it('PUT /api/posts/:id updates own post', async () => {
			const response = await app.handle(
				new Request(`http://localhost/api/posts/${createdPostId}`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
						Cookie: authCookie,
					},
					body: JSON.stringify({
						title: 'Updated Post Title',
					}),
				}),
			);

			expect(response.status).toBe(200);

			const body = await response.json();
			expect(body.message).toBe('Post updated successfully');
			expect(body.data.title).toBe('Updated Post Title');
		});

		it('DELETE /api/posts/:id deletes own post', async () => {
			const response = await app.handle(
				new Request(`http://localhost/api/posts/${createdPostId}`, {
					method: 'DELETE',
					headers: {
						Cookie: authCookie,
					},
				}),
			);

			expect(response.status).toBe(200);

			const body = await response.json();
			expect(body.message).toBe('Post deleted successfully');

			// Verify post is gone
			const getResponse = await app.handle(
				new Request(`http://localhost/api/posts/${createdPostId}`),
			);
			expect(getResponse.status).toBe(404);
		});
	});

	describe('Ownership Checks', () => {
		it('PUT /api/posts/:id returns 403 for non-owner', async () => {
			// Create first user and post
			const user1Email = `owner-${Date.now()}@example.com`;
			await app.handle(
				new Request('http://localhost/api/auth/sign-up/email', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						email: user1Email,
						password: 'TestPassword123!',
						name: 'Owner User',
					}),
				}),
			);

			const user1SignIn = await app.handle(
				new Request('http://localhost/api/auth/sign-in/email', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						email: user1Email,
						password: 'TestPassword123!',
					}),
				}),
			);
			const user1Cookie = user1SignIn.headers.get('set-cookie')!;

			// Create post as user1
			const createResponse = await app.handle(
				new Request('http://localhost/api/posts', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Cookie: user1Cookie,
					},
					body: JSON.stringify({
						title: 'User1 Post',
						content: 'Content',
					}),
				}),
			);
			const postId = (await createResponse.json()).data.id;

			// Create second user
			const user2Email = `nonowner-${Date.now()}@example.com`;
			await app.handle(
				new Request('http://localhost/api/auth/sign-up/email', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						email: user2Email,
						password: 'TestPassword123!',
						name: 'Non-Owner User',
					}),
				}),
			);

			const user2SignIn = await app.handle(
				new Request('http://localhost/api/auth/sign-in/email', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						email: user2Email,
						password: 'TestPassword123!',
					}),
				}),
			);
			const user2Cookie = user2SignIn.headers.get('set-cookie')!;

			// Try to update as user2
			const updateResponse = await app.handle(
				new Request(`http://localhost/api/posts/${postId}`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
						Cookie: user2Cookie,
					},
					body: JSON.stringify({
						title: 'Hacked Title',
					}),
				}),
			);

			expect(updateResponse.status).toBe(403);

			const body = await updateResponse.json();
			expect(body.error).toBe('Forbidden');
		});

		it('DELETE /api/posts/:id returns 403 for non-owner', async () => {
			// Create first user and post
			const user1Email = `delete-owner-${Date.now()}@example.com`;
			await app.handle(
				new Request('http://localhost/api/auth/sign-up/email', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						email: user1Email,
						password: 'TestPassword123!',
						name: 'Delete Owner',
					}),
				}),
			);

			const user1SignIn = await app.handle(
				new Request('http://localhost/api/auth/sign-in/email', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						email: user1Email,
						password: 'TestPassword123!',
					}),
				}),
			);
			const user1Cookie = user1SignIn.headers.get('set-cookie')!;

			// Create post
			const createResponse = await app.handle(
				new Request('http://localhost/api/posts', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Cookie: user1Cookie,
					},
					body: JSON.stringify({
						title: 'Post to Delete',
						content: 'Content',
					}),
				}),
			);
			const postId = (await createResponse.json()).data.id;

			// Create second user
			const user2Email = `delete-nonowner-${Date.now()}@example.com`;
			await app.handle(
				new Request('http://localhost/api/auth/sign-up/email', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						email: user2Email,
						password: 'TestPassword123!',
						name: 'Delete Non-Owner',
					}),
				}),
			);

			const user2SignIn = await app.handle(
				new Request('http://localhost/api/auth/sign-in/email', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						email: user2Email,
						password: 'TestPassword123!',
					}),
				}),
			);
			const user2Cookie = user2SignIn.headers.get('set-cookie')!;

			// Try to delete as user2
			const deleteResponse = await app.handle(
				new Request(`http://localhost/api/posts/${postId}`, {
					method: 'DELETE',
					headers: {
						Cookie: user2Cookie,
					},
				}),
			);

			expect(deleteResponse.status).toBe(403);

			const body = await deleteResponse.json();
			expect(body.error).toBe('Forbidden');
		});
	});

	describe('Validation', () => {
		it('POST /api/posts returns 400 for missing title', async () => {
			const authCookie = await getAuthCookie();

			const response = await app.handle(
				new Request('http://localhost/api/posts', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Cookie: authCookie,
					},
					body: JSON.stringify({
						content: 'Content without title',
					}),
				}),
			);

			expect(response.status).toBe(400);
		});

		it('POST /api/posts returns 400 for empty title', async () => {
			const authCookie = await getAuthCookie();

			const response = await app.handle(
				new Request('http://localhost/api/posts', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Cookie: authCookie,
					},
					body: JSON.stringify({
						title: '',
						content: 'Content',
					}),
				}),
			);

			expect(response.status).toBe(400);
		});
	});
});
