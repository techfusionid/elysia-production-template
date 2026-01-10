/**
 * Profile schemas - validation for request/response
 */

import { t } from "elysia";

export const updateProfileSchema = t.Object({
	bio: t.Optional(t.String({ maxLength: 500 })),
	website: t.Optional(t.String({ maxLength: 200 })),
	location: t.Optional(t.String({ maxLength: 100 })),
});

export const profileResponseSchema = t.Object({
	id: t.String(),
	name: t.String(),
	image: t.Nullable(t.String()),
	bio: t.Nullable(t.String()),
	website: t.Nullable(t.String()),
	location: t.Nullable(t.String()),
});
