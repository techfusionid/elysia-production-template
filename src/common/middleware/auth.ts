import { Elysia } from 'elysia';
import { auth } from '@common/config/auth';

/**
 * Auth middleware - injects session and user into context
 * Use .derive() to make session data available to all routes
 */
export const authMiddleware = new Elysia({ name: 'auth-middleware' }).derive(
	async ({ headers }) => {
		const session = await auth.api.getSession({
			headers,
		});

		return {
			session: session?.session ?? null,
			user: session?.user ?? null,
		};
	},
);

/**
 * Protected route guard
 * Throws 401 if user is not authenticated
 */
export const requireAuth = new Elysia({ name: 'require-auth' })
	.use(authMiddleware)
	.derive(({ user }) => {
		if (!user) {
			throw new Error('Unauthorized');
		}
		return { user };
	});
