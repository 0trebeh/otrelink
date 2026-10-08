import { getDb } from '@/lib/db';
import { handler, json, error, requireVerifiedUser, HttpError } from '@/lib/http';

// Revoke a token (works even if the plan no longer includes the API).
export const DELETE = handler(async (req, { params }) => {
  const user = await requireVerifiedUser();
  if (user.auth?.type === 'token') throw new HttpError(403, 'token_route_not_allowed');
  const { id } = await params;
  const db = await getDb();
  if (!(await db.tokens.remove(String(id), user.id))) return error(404, 'token_not_found');
  return json({ ok: true });
});
