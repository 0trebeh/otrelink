import { getDb } from '@/lib/db';
import { handler, error } from '@/lib/http';

// Serve an uploaded file. PDFs open in the browser; add ?download=1 to download.
export const GET = handler(async (req, { params }) => {
  const { id } = await params;
  if (!/^[a-f0-9]{32}$/.test(id)) return error(404, 'not_found');
  const db = await getDb();
  const asset = await db.assets.findById(id);
  if (!asset) return error(404, 'not_found');

  const download = new URL(req.url).searchParams.has('download');
  const ext = asset.mime === 'application/pdf' ? '.pdf' : '';
  const name = (asset.name || `file-${id.slice(0, 8)}${ext}`).replace(/"/g, '');
  return new Response(asset.data, {
    headers: {
      'Content-Type': asset.mime,
      'Content-Length': String(asset.data.length),
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${name}"`,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'X-Content-Type-Options': 'nosniff',
    },
  });
});
