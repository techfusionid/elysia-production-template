import { describe, expect, it } from 'bun:test';
import { createApp } from '../src/app';

describe('Auth Module', () => {
	const app = createApp();
	const testEmail = `test-${Date.now()}@example.com`;
	const testPassword = 'TestPassword123!';
	const testName = 'Test User';

	describe('Sign Up', () => {
		it('POST /api/auth/sign-up/email creates a new user', async () => {
			const response = await app.handle(
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

			expect(response.status).toBe(200);

			const body = await response.json();
			expect(body.user).toBeDefined();
			expect(body.user.email).toBe(testEmail);
			expect(body.user.name).toBe(testName);
		});

		it('POST /api/auth/sign-up/email fails with duplicate email', async () => {
			const response = await app.handle(
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

			// Better Auth returns 200 with error in body for some errors
			const body = await response.json();
			// Either status is not 200, or there's an error in body
			expect(response.status !== 200 || body.error !== undefined).toBe(true);
		});

		it('POST /api/auth/sign-up/email fails with weak password', async () => {
			const response = await app.handle(
				new Request('http://localhost/api/auth/sign-up/email', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						email: 'weak@example.com',
						password: '123', // Too short
						name: 'Weak User',
					}),
				}),
			);

			const body = await response.json();
			expect(response.status !== 200 || body.error !== undefined).toBe(true);
		});
	});

	describe('Sign In', () => {
		it('POST /api/auth/sign-in/email logs in with valid credentials', async () => {
			const response = await app.handle(
				new Request('http://localhost/api/auth/sign-in/email', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						email: testEmail,
						password: testPassword,
					}),
				}),
			);

			expect(response.status).toBe(200);

			const body = await response.json();
			expect(body.user).toBeDefined();
			expect(body.user.email).toBe(testEmail);
		});

		it('POST /api/auth/sign-in/email fails with wrong password', async () => {
			const response = await app.handle(
				new Request('http://localhost/api/auth/sign-in/email', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						email: testEmail,
						password: 'WrongPassword123!',
					}),
				}),
			);

			const body = await response.json();
			expect(response.status !== 200 || body.error !== undefined).toBe(true);
		});

		it('POST /api/auth/sign-in/email fails with non-existent user', async () => {
			const response = await app.handle(
				new Request('http://localhost/api/auth/sign-in/email', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						email: 'nonexistent@example.com',
						password: testPassword,
					}),
				}),
			);

			const body = await response.json();
			expect(response.status !== 200 || body.error !== undefined).toBe(true);
		});
	});

	describe('Session', () => {
		it('GET /api/auth/get-session returns session for authenticated user', async () => {
			// First sign in to get a fresh cookie
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

			const setCookie = signInResponse.headers.get('set-cookie');
			expect(setCookie).toBeDefined();

			// Now get session with cookie
			const response = await app.handle(
				new Request('http://localhost/api/auth/get-session', {
					method: 'GET',
					headers: {
						Cookie: setCookie!,
					},
				}),
			);

			expect(response.status).toBe(200);

			const body = await response.json();
			expect(body.user).toBeDefined();
			expect(body.user.email).toBe(testEmail);
			expect(body.session).toBeDefined();
		});

		it('GET /api/auth/get-session returns null for unauthenticated user', async () => {
			const response = await app.handle(
				new Request('http://localhost/api/auth/get-session', {
					method: 'GET',
				}),
			);

			expect(response.status).toBe(200);

			const body = await response.json();
			// Better Auth returns null directly when no session
			expect(body === null || body.session === null).toBe(true);
		});
	});

	describe('Password Reset', () => {
		it('POST /api/auth/request-password-reset accepts valid email', async () => {
			const response = await app.handle(
				new Request('http://localhost/api/auth/request-password-reset', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						email: testEmail,
					}),
				}),
			);

			// Should return 200 even for non-existent emails (security best practice)
			expect(response.status).toBe(200);
		});

		it('POST /api/auth/reset-password fails without valid token', async () => {
			const response = await app.handle(
				new Request('http://localhost/api/auth/reset-password', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						token: 'invalid-token',
						newPassword: 'NewPassword123!',
					}),
				}),
			);

			const body = await response.json();
			// Should fail with invalid token
			expect(response.status !== 200 || body.error !== undefined).toBe(true);
		});
	});

	describe('Sign Out', () => {
		it('POST /api/auth/sign-out ends the session', async () => {
			// First sign in
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

			const setCookie = signInResponse.headers.get('set-cookie');
			expect(setCookie).toBeDefined();

			// Sign out
			const signOutResponse = await app.handle(
				new Request('http://localhost/api/auth/sign-out', {
					method: 'POST',
					headers: {
						Cookie: setCookie!,
					},
				}),
			);

			expect(signOutResponse.status).toBe(200);

			// Verify session is gone
			const sessionResponse = await app.handle(
				new Request('http://localhost/api/auth/get-session', {
					method: 'GET',
					headers: {
						Cookie: setCookie!,
					},
				}),
			);

			const body = await sessionResponse.json();
			// Better Auth returns null directly when no session
			expect(body === null || body.session === null).toBe(true);
		});
	});
});
