// Health check for hosting platforms (Render, Railway, Docker…).
// Does not touch the database so it stays fast and never flaps.
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json({ ok: true, uptime: Math.round(process.uptime()) }, { headers: { 'Cache-Control': 'no-store' } });
}
