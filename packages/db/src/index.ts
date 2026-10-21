/**
 * Prisma client singleton.
 *
 * Prisma 7 connects through a driver adapter rather than a URL embedded in the
 * schema, so the connection string is read from the environment here.
 *
 * Next.js hot-reloads modules in development, which would otherwise create a
 * new connection pool on every save and exhaust Postgres' connection limit.
 * Caching the client on `globalThis` keeps a single pool per process.
 */

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from './generated/prisma/client';

export type { Prisma } from './generated/prisma/client';
export { PrismaClient } from './generated/prisma/client';
export * from './generated/prisma/enums';

const globalForPrisma = globalThis as unknown as { __neevpassPrisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    // Fail loudly at the point of use with an actionable message. Silently
    // defaulting to a local URL is how a misconfigured deploy ends up writing
    // to the wrong database.
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env at the repository root and run `npm run db:up`.',
    );
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log: ['warn', 'error'],
    errorFormat: process.env.NODE_ENV === 'production' ? 'minimal' : 'pretty',
  });
}

export const prisma: PrismaClient = globalForPrisma.__neevpassPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__neevpassPrisma = prisma;
}

/**
 * Liveness probe for the database. Used by /api/health.
 * Deliberately cheap: it does not touch any user table.
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

export * from './access';
export * from './profile';
export * from './taxonomy';
export * from './career';
export * from './opportunities';
export * from './documents';
