import { handlers } from '@/lib/auth';

/**
 * Auth.js route handler.
 *
 * Handles every endpoint the library needs: sign-in, callback, sign-out,
 * session, CSRF token and provider metadata.
 */
export const { GET, POST } = handlers;
