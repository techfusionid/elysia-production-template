/**
 * Profile feature module
 *
 * Reference implementation demonstrating:
 * - Public endpoints (anyone can view profiles)
 * - Protected endpoints (only owner can update)
 * - Scoped guards for flexible auth
 *
 * Can be modified or removed for your application.
 */
import { Elysia, t } from "elysia";
import { authMiddleware, isAuthenticated } from "@common/middleware/auth-guard";
import * as service from "./service";
import { updateProfileSchema, profileResponseSchema } from "./schemas";

export const profileModule = new Elysia({ prefix: "/api" })
	.use(authMiddleware)

	// PUBLIC: Get platform stats
	.get("/stats", async () => service.getStats(), {
		response: t.Object({ totalUsers: t.Number() }),
		detail: {
			tags: ["Public"],
			summary: "Get platform statistics",
			description: "Public endpoint - no auth required",
		},
	})

	// PUBLIC: View any user's profile
	.get(
		"/profiles/:userId",
		async ({ params, set }) => {
			const profile = await service.getPublicProfile(params.userId);

			if (!profile) {
				set.status = 404;
				throw new Error("Profile not found");
			}

			return profile;
		},
		{
			params: t.Object({ userId: t.String() }),
			response: profileResponseSchema,
			detail: {
				tags: ["Profiles"],
				summary: "View user profile",
				description: "Public endpoint - view any user's profile",
			},
		}
	)

	// PROTECTED: Scoped guard for authenticated endpoints
	.guard({ beforeHandle: [isAuthenticated] }, (app) =>
		app
			// Get my profile
			.get(
				"/profile/me",
				async (ctx) => {
					const { user } = ctx as typeof ctx & { user: any };
					const profile = await service.getMyProfile(user.id);
					if (!profile) {
						return {
							id: user.id,
							name: user.name,
							image: user.image,
							bio: null,
							website: null,
							location: null,
						};
					}
					return profile;
				},
				{
					response: profileResponseSchema,
					detail: {
						tags: ["Profiles"],
						summary: "Get my profile",
						description: "Protected - get authenticated user's profile",
					},
				}
			)

			// Update my profile
			.patch(
				"/profile/me",
				async (ctx) => {
					const { body, user } = ctx as typeof ctx & { user: any };
					const profile = await service.updateProfile(user.id, body);

					return (
						profile ?? {
							id: user.id,
							name: user.name,
							image: user.image,
							bio: body.bio ?? null,
							website: body.website ?? null,
							location: body.location ?? null,
						}
					);
				},
				{
					body: updateProfileSchema,
					response: profileResponseSchema,
					detail: {
						tags: ["Profiles"],
						summary: "Update my profile",
						description: "Protected - update authenticated user's profile",
					},
				}
			)
	);
