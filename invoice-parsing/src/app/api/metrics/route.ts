import { NextResponse } from 'next/server';
import { register } from '@/monitoring/metrics';

// Force Node.js runtime (important — Prometheus client depends on Node timers)
export const runtime = 'nodejs';

/**
 * GET /api/metrics
 * Returns all collected Prometheus metrics in text/plain format.
 */
export async function GET() {
  const metrics = await register.metrics();

  return new NextResponse(metrics, {
    status: 200,
    headers: {
      'Content-Type': register.contentType,
      'Cache-Control': 'no-cache',
    },
  });
}
