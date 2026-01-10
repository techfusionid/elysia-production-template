import { Elysia } from "elysia";
import { auth } from "@common/config/auth";

/** Inject optional session & user */
export const authMiddleware = new Elysia({ name: "auth-middleware" }).derive(
	async ({ headers }) => {
		const session = await auth.api.getSession({ headers });

		return {
			session: session?.session ?? null,
			user: session?.user ?? null,
		};
	}
);

/** Protect all routes in a module */
type RequireAuthContext = {
	user?: unknown | null;
	set: {
		status?: unknown;
	};
};

export const requireAuth = new Elysia({ name: "require-auth" })
	.use(authMiddleware)
	.onBeforeHandle((ctx: RequireAuthContext) => {
		if (!ctx.user) {
			ctx.set.status = 401;
			return { error: "Unauthorized" };
		}
	});

/**
 * Scoped auth guard (reusable)
 *
 * Usage:
 * .use(authMiddleware)
 * .guard(authGuard(), ...)
 */
type GuardContext = {
	user?: unknown | null;
	set: { status?: unknown };
};
export const authGuard = () => ({
	beforeHandle: [
		(ctx: GuardContext) => {
			if (!ctx.user) {
				ctx.set.status = 401;
				return { error: "Unauthorized" };
			}
		},
	],
});
