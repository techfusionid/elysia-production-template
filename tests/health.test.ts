import { describe, expect, it } from 'bun:test';
import { createApp } from '../src/app';

describe('Health Module', () => {
	const app = createApp();
	it('GET /health returns ok status', async () => {
		const response = await app.handle(new Request('http://localhost/health'));
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.status).toBe('ok');
		expect(body.database).toBe('healthy');
		expect(body).toHaveProperty('timestamp');
		expect(body).toHaveProperty('uptime');
		expect(body).toHaveProperty('responseTime');
	});
});
