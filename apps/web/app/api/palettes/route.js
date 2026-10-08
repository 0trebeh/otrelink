import { sanitizePaletteList } from '@otrelink/core';
import { getDb } from '@/lib/db';
import { handler, json, readJson, requireVerifiedUser, rateLimit } from '@/lib/http';

// My saved color palettes (dashboard → Theme → Color palettes), shared by all my pages.
export const GET = handler(async () => {
  const user = await requireVerifiedUser();
  const db = await getDb();
  const full = await db.users.findById(user.id);
  return json({ palettes: sanitizePaletteList(full?.palettes) });
});

// Replace the whole list: { palettes: [{ id, name, colors }] }.
export const PUT = handler(async (req) => {
  const user = await requireVerifiedUser();
  await rateLimit(req, 'palettes', 120, 60 * 60 * 1000, user.id);
  const body = await readJson(req);
  const palettes = sanitizePaletteList(body?.palettes);
  const db = await getDb();
  await db.users.update(user.id, { palettes });
  return json({ palettes });
});
