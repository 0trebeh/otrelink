import { exportSite } from '@/lib/export';
import { config } from '@/lib/config';
import { publicOrigin } from '@/lib/origin';
import { handler, requireOwnedPage, rateLimit } from '@/lib/http';

// Download the page as a static website (.zip). Uses the last saved version.
export const GET = handler(async (req, { params }) => {
  rateLimit(req, 'export', 30, 60 * 60 * 1000);
  const { page, user } = await requireOwnedPage((await params).id);
  const { filename, data } = await exportSite(page, { homeUrl: publicOrigin(req), liveUrl: `${config.pageUrl}/${page.slug}`, plan: user.plan });
  return new Response(data, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(data.length),
      'Cache-Control': 'no-store',
    },
  });
});
