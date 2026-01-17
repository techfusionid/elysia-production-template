import { db } from '@common/db';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sendEmail } from './email';
import { env } from './env';

/**
 * Better Auth configuration
 * Defines authentication methods, session behavior, and database integration
 * Review security defaults before production deployment
 */
export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg',
	}),
	emailAndPassword: {
		enabled: true,
		minPasswordLength: 8,
		maxPasswordLength: 128,
		requireEmailVerification: env.REQUIRE_EMAIL_VERIFICATION,

		// Password reset - enables /api/auth/request-password-reset endpoint
		sendResetPassword: async ({ user, url, token: _token }, _request) => {
			void sendEmail({
				to: user.email,
				subject: 'Reset your password',
				text: `Click the link to reset your password: ${url}`,
				html: `
					<h2>Reset Your Password</h2>
					<p>Click the link below to reset your password:</p>
					<a href="${url}">Reset Password</a>
					<p>This link will expire in 1 hour.</p>
					<p>If you didn't request this, please ignore this email.</p>
				`,
			});
		},

		// Optional hook after password reset (extend for logging, notifications, etc.)
		onPasswordReset: async ({ user: _user }, _request) => {},
	},
	// Email verification (separate from emailAndPassword)
	emailVerification: {
		sendVerificationEmail: async ({ user, url, token: _token }, _request) => {
			void sendEmail({
				to: user.email,
				subject: 'Verify your email address',
				text: `Click the link to verify your email: ${url}`,
				html: `
					<h2>Verify Your Email</h2>
					<p>Click the link below to verify your email address:</p>
					<a href="${url}">Verify Email</a>
				`,
			});
		},
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // 1 day
	},
	secret: env.BETTER_AUTH_SECRET!,
	baseURL: env.BETTER_AUTH_URL,
	advanced: {
		// Secure cookie defaults (adjust if deploying behind a reverse proxy)
		cookiePrefix: 'auth',
		useSecureCookies: env.NODE_ENV === 'production',
		defaultCookieAttributes: {
			sameSite: 'lax',
			httpOnly: true,
			secure: env.NODE_ENV === 'production',
			path: '/',
		},
	},
});
