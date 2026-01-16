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
		const fakeId = '11111111-1111-4111-8111-111111111111';

		const response = await app.handle(new Request(`http://localhost/api/posts/${fakeId}`));
		const body = await response.json();

		expect(response.status).toBe(404);
		expect(body.error).toBe('Not Found');
	});
});
