import type { DefaultSession } from 'next-auth';

/**
 * Module augmentation for Auth.js.
 *
 * The session callback copies the user id from the token's `sub` claim onto
 * `session.user.id`. Declaring the shape here means every consumer of `auth()`
 * gets a typed `session.user.id` instead of a cast.
 *
 * Note there is deliberately no augmentation of `next-auth/jwt`: the id travels
 * in the standard `sub` claim, so no custom claim needs declaring.
 */

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}
