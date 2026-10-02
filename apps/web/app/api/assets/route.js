import { getDb } from '@/lib/db';
import { config } from '@/lib/config';
import { handler, json, error, requireUser, rateLimit } from '@/lib/http';

const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'];

// Upload an image (multipart field "file"). Returns an absolute URL.
export const POST = handler(async (req) => {
  const user = await requireUser();
  rateLimit(req, 'upload', 60, 60 * 60 * 1000);
  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!file || typeof file === 'string') return error(400, 'missing_file');
  if (!ALLOWED.includes(file.type)) return error(415, 'unsupported_type');
  if (file.size > config.maxUploadBytes) return error(413, 'file_too_large');

  const db = await getDb();
  const { id } = await db.assets.create({ userId: user.id, mime: file.type, data: Buffer.from(await file.arrayBuffer()) });
  const origin = new URL(req.url).origin;
  return json({ id, url: `${origin}/api/assets/${id}` }, { status: 201 });
});
