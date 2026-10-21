import { checkDatabaseConnection } from '@neevpass/db';
import { NextResponse } from 'next/server';

/**
 * Health check.
 *
 * Two distinct questions, answered by two endpoints by convention:
 *   - `/api/health` (liveness): is the process up and able to serve?
 *   - the database probe below (readiness): can it actually do useful work?
 *
 * The database check is included here but reported per-dependency, so a load
 * balancer can decide whether to route traffic while an operator can see
 * exactly what is degraded.
 *
 * `force-dynamic` is essential: a cached health check reports the state of the
 * world at build time, which is worse than having none at all.
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface HealthResponse {
  status: 'ok' | 'degraded';
  checks: {
    database: boolean;
  };
  uptimeSeconds: number;
  timestamp: string;
}

export async function GET(): Promise<NextResponse<HealthResponse>> {
  const databaseOk = await checkDatabaseConnection();

  const body: HealthResponse = {
    status: databaseOk ? 'ok' : 'degraded',
    checks: { database: databaseOk },
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  };

  // 503 rather than 200 when a dependency is down, so an orchestrator does not
  // keep sending traffic to an instance that cannot serve it.
  return NextResponse.json(body, {
    status: databaseOk ? 200 : 503,
    headers: { 'cache-control': 'no-store' },
  });
}
