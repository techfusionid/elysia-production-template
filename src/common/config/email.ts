import { appLogger } from '@common/logger';
import { Resend } from 'resend';
import { env } from './env';

/**
 * Email sending helper using Resend
 * Falls back to console logging if RESEND_API_KEY is not set
 */
export const sendEmail = async ({
	to,
	subject,
	text,
	html,
}: {
	to: string;
	subject: string;
	text: string;
	html?: string;
}) => {
	if (env.RESEND_API_KEY && env.RESEND_API_KEY.length > 0) {
		const resend = new Resend(env.RESEND_API_KEY);
		await resend.emails.send({
			from: env.EMAIL_FROM,
			to,
			subject,
			text,
			html,
		});
		appLogger.info({ to, subject }, 'Email sent via Resend');
	} else {
		// Development: Log to console
		appLogger.info({ to, subject, text }, 'Email (not sent - no RESEND_API_KEY)');
	}
};
