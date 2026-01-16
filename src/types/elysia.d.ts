import 'elysia';

declare module 'elysia' {
	interface Context {
		user: {
			id: string;
			email?: string;
			name?: string;
			image?: string;
			role?: string;
		} | null;

		session: unknown | null;
	}
}
