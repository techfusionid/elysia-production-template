import { describe, expect, it } from 'bun:test';
import { createApp } from '../src/app';

describe('Posts Module', () => {
	const app = createApp();
	it('GET /api/posts returns list of posts', async () => {
		const response = await app.handle(new Request('http://localhost/api/posts'));
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body).toHaveProperty('data');
		expect(body).toHaveProperty('total');
		expect(Array.isArray(body.data)).toBe(true);
	});

	it('GET /api/posts/:id returns 404 for non-existent post', async () => {
		const fakeId = '00000000-0000-0000-0000-000000000000';
		const response = await app.handle(new Request(`http://localhost/api/posts/${fakeId}`));
		const body = await response.json();

		expect(response.status).toBe(404);
		expect(body.error).toBe('Not Found');
	});

	it('POST /api/posts requires authentication', async () => {
		const response = await app.handle(
			new Request('http://localhost/api/posts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: 'Test', content: 'Test content' }),
			}),
		);
		const body = await response.json();

		expect(response.status).toBe(401);
		expect(body.error).toBe('Unauthorized');
	});
});
