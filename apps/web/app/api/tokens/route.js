import { getDb } from '@/lib/db';
import { handler, json, error, readJson, requireVerifiedUser, rateLimit, HttpError } from '@/lib/http';
import { newToken, sanitizeTokenInput, toPublicToken, MAX_TOKENS } from '@/lib/tokens';

// Tokens are managed from the dashboard only: a token can't list or create tokens.
async function sessionUser() {
  const user = await requireVerifiedUser();
  if (user.auth?.type === 'token') throw new HttpError(403, 'token_route_not_allowed');
  return user;
}

// My API tokens
export const GET = handler(async () => {
  const user = await sessionUser();
  const db = await getDb();
  const tokens = await db.tokens.listByUser(user.id);
  return json({ tokens: tokens.map(toPublicToken), max: MAX_TOKENS, allowed: Boolean(user.plan.features.api) });
});

// Create a token. The full token is in the answer once and never again.
export const POST = handler(async (req) => {
  const user = await sessionUser();
  if (!user.plan.features.api) return error(403, 'api_not_in_plan');
  await rateLimit(req, 'token-create', 20, 60 * 60 * 1000, user.id);
  const input = sanitizeTokenInput(await readJson(req));
  const db = await getDb();
  if ((await db.tokens.countByUser(user.id)) >= MAX_TOKENS) return error(403, 'token_limit', { limit: MAX_TOKENS });
  const { token, hash, hint } = newToken();
  const doc = await db.tokens.create({ userId: user.id, ...input, hash, hint });
  return json({ token, info: toPublicToken(doc) }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
});
