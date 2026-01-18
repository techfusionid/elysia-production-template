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
		try {
			const resend = new Resend(env.RESEND_API_KEY);
			const result = await resend.emails.send({
				from: env.EMAIL_FROM,
				to,
				subject,
				text,
				html,
			});
			if (result.error) {
				appLogger.error({ to, subject, error: result.error }, 'Failed to send email via Resend');
			} else {
				appLogger.info({ to, subject, id: result.data?.id }, 'Email sent via Resend');
			}
		} catch (error) {
			appLogger.error({ to, subject, error }, 'Error sending email via Resend');
		}
	} else {
		// Development: Log to console
		appLogger.info({ to, subject, text }, 'Email (not sent - no RESEND_API_KEY)');
	}
};
