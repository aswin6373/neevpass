import { PrismaAdapter } from '@auth/prisma-adapter';
import { emailSchema } from '@neevpass/domain';
import { prisma } from '@neevpass/db';
import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import LinkedIn from 'next-auth/providers/linkedin';
import { z } from 'zod';

import { getServerEnv } from './env';
import { logger } from './logger';
import { passwordHasher } from './password';

/**
 * Auth.js v5 configuration.
 *
 * SESSION STRATEGY: JWT, not database sessions.
 * The Credentials provider cannot use database sessions — there is no session
 * row to attach to a credentials sign-in — so JWT is required as soon as
 * email/password is offered. The `Session` table stays in the schema because the
 * Prisma adapter manages it for OAuth, and because moving to database sessions
 * later should not need a migration.
 *
 * AUTHORISATION: this file authenticates. It does not authorise. Ownership of a
 * profile is decided by `requireProfileForUser` in @neevpass/db, which is the
 * only place that question is answered.
 */

const env = getServerEnv();

/**
 * Sign-in input schema.
 *
 * Note it validates only that the password is a non-empty string. Applying the
 * full password *policy* here would be wrong twice over: it would reject any
 * legacy password that predates a policy change, and it would tell an attacker
 * something about our rules.
 */
const credentialsSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.'),
});

/**
 * A syntactically valid digest that matches no password. Verifying against it
 * when the account does not exist keeps the response time for an unknown email
 * address close to that of a known one, so latency cannot be used to enumerate
 * registered accounts.
 */
const DUMMY_DIGEST = `scrypt$32768$8$1$${'A'.repeat(24)}$${'A'.repeat(88)}`;

function buildOAuthProviders(): NextAuthConfig['providers'] {
  const providers: NextAuthConfig['providers'] = [];

  if (env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET) {
    providers.push(GitHub({ clientId: env.AUTH_GITHUB_ID, clientSecret: env.AUTH_GITHUB_SECRET }));
  }

  if (env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET) {
    providers.push(Google({ clientId: env.AUTH_GOOGLE_ID, clientSecret: env.AUTH_GOOGLE_SECRET }));
  }

  if (env.AUTH_LINKEDIN_ID && env.AUTH_LINKEDIN_SECRET) {
    providers.push(
      LinkedIn({ clientId: env.AUTH_LINKEDIN_ID, clientSecret: env.AUTH_LINKEDIN_SECRET }),
    );
  }

  return providers;
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // refresh the token at most once a day
  },

  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },

  providers: [
    ...buildOAuthProviders(),

    Credentials({
      name: 'Email and password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse({
          email: rawCredentials?.email,
          password: rawCredentials?.password,
        });

        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, name: true, image: true, passwordHash: true, deletedAt: true },
        });

        // An account with no password hash is an OAuth-only account. It must not
        // be signable-into with a password, and we still burn the same time.
        const digest = user?.passwordHash ?? DUMMY_DIGEST;
        const passwordMatches = await passwordHasher.verify(digest, password);

        if (!user || !user.passwordHash || !passwordMatches || user.deletedAt) {
          // One generic log line, no distinction between "no such user" and
          // "wrong password" — the distinction is exactly what an attacker wants.
          logger.warn('Failed sign-in attempt');
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],

  callbacks: {
    /**
     * Runs before a sign-in completes; returning false blocks it.
     * A deactivated account must not be able to sign in.
     */
    async signIn({ user }) {
      if (!user.email) return false;

      const existing = await prisma.user.findUnique({
        where: { email: user.email },
        select: { deletedAt: true },
      });

      if (existing?.deletedAt) {
        logger.warn('Blocked sign-in for a deactivated account', { userId: user.id });
        return false;
      }

      return true;
    },

    /**
     * Copies the database user id onto the token at sign-in time.
     * `sub` is the standard subject claim; setting it here keeps the session
     * callback independent of any custom claim.
     */
    jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      return token;
    },

    /**
     * Surfaces the user id to the app so no route has to look it up again.
     *
     * `token.sub` is Auth.js' own subject claim, which it populates with the
     * database user id. Reading it directly is more robust than adding a custom
     * claim: it survives adapter changes and needs no type augmentation on the
     * JWT interface.
     */
    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },

  events: {
    signIn({ user, isNewUser }) {
      logger.info('User signed in', { userId: user.id, isNewUser: Boolean(isNewUser) });
    },
    signOut() {
      logger.info('User signed out');
    },
  },

  // Auth.js is extremely chatty at debug level; opt in per-environment instead.
  debug: false,

  trustHost: env.AUTH_TRUST_HOST === 'true' || env.NODE_ENV !== 'production',
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
