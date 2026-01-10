import { Elysia } from "elysia";
import { auth } from "@common/config/auth";

/**
 * Adds optional session/user to context via Better Auth
 */
export const authMiddleware = new Elysia({ name: "auth-middleware" }).derive(
	async ({ headers }) => {
		const session = await auth.api.getSession({ headers });

		return {
			session: session?.session ?? null,
			user: session?.user ?? null,
		};
	}
);

/**
 * Module-level auth guard - protects all routes in the module
 * Usage: new Elysia().use(requireAuth).get(...)
 */
export const requireAuth = new Elysia({ name: "require-auth" })
	.use(authMiddleware)
	.onBeforeHandle(async (context) => {
		const { user, set } = context as typeof context & { user: any };

		if (!user) {
			set.status = 401;
			return { error: "Unauthorized" };
		}
	});

/**
 * Reusable guard for scoped protection
 * Requires authMiddleware
 * Usage: .use(authMiddleware).guard({ beforeHandle: [isAuthenticated] }, ...)
 */
export async function isAuthenticated(ctx: any) {
	if (!ctx.user) {
		ctx.set.status = 401;
		return { error: "Unauthorized" };
	}
}

// Example: Compose multiple guards
// .guard({ beforeHandle: [isAuthenticated, isAdmin] }, ...)
//
// export async function isAdmin(ctx: any) {
// 	if (ctx.user?.role !== "admin") {
// 		ctx.set.status = 403;
// 		return { error: "Forbidden" };
// 	}
// }
