import { getDb } from '@/lib/db';
import { handler, error } from '@/lib/http';

export const GET = handler(async (_req, { params }) => {
  const { id } = await params;
  if (!/^[a-f0-9]{32}$/.test(id)) return error(404, 'not_found');
  const db = await getDb();
  const asset = await db.assets.findById(id);
  if (!asset) return error(404, 'not_found');
  return new Response(asset.data, {
    headers: {
      'Content-Type': asset.mime,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'X-Content-Type-Options': 'nosniff',
    },
  });
});
