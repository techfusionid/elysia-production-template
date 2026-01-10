import { Elysia } from 'elysia';
import { auth } from '@common/config/auth';

export const authModule = new Elysia({ prefix: '/api/auth' })
	.get('/*', ({ request }) => auth.handler(request))
	.post('/*', ({ request }) => auth.handler(request));
