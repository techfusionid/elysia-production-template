import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

/**
 * User profiles - extended user data
 * Reference implementation for CRUD and auth patterns
 */
export const userProfiles = pgTable("user_profiles", {
	userId: text("user_id")
		.primaryKey()
		.references(() => user.id, { onDelete: "cascade" }),
	bio: text("bio"),
	website: text("website"),
	location: text("location"),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
