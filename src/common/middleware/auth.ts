import { Elysia } from 'elysia';
import { auth } from '@common/config/auth';

/**
 * Auth middleware that derives session and user from Better Auth
 * All routes using this middleware will have session and user in context
 */
export const authMiddleware = new Elysia({ name: 'auth-middleware' }).derive(
	async ({ headers }) => {
		const session = await auth.api.getSession({ headers });

		return {
			session: session?.session ?? null,
			user: session?.user ?? null,
		};
	},
);

/**
 * Protected route guard - requires authentication
 * Returns 401 if user is not logged in
 */
export const requireAuth = new Elysia({ name: 'require-auth' })
	.use(authMiddleware)
	.onBeforeHandle(async (context) => {
		// Type assertion needed due to Elysia derive type inference limitations
		const { user, set } = context as typeof context & { user: any };

		if (!user) {
			set.status = 401;
			return { error: 'Unauthorized' };
		}
	});
