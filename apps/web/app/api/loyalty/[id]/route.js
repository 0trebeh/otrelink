import { getDb } from '@/lib/db';
import { handler, json, error, readJson, requireVerifiedUser } from '@/lib/http';
import { toOwnerCard, loadLoyaltyBlock } from '@/lib/loyalty';

// Stamp a card, give its reward or undo the last change.
//   POST { action: 'stamp', n?: 1..10 } | { action: 'redeem' } | { action: 'undo' }
export const POST = handler(async (req, { params }) => {
  const user = await requireVerifiedUser();
  const db = await getDb();
  const card = await db.cards.findById(String((await params).id || ''));
  if (!card || card.userId !== user.id) return error(404, 'not_found');
  const ctx = await loadLoyaltyBlock(db, card.pageId, card.blockId, { published: false });
  const goal = Number(ctx?.data.stamps) || 8;
  const { action, n } = await readJson(req);
  const now = new Date().toISOString();
  const history = [...(card.history || [])];
  let { stamps = 0, rewards = 0 } = card;
  let lastStampAt = card.lastStampAt || null;

  if (action === 'stamp') {
    const k = Math.min(10, Math.max(1, Math.round(Number(n) || 1)));
    stamps += k;
    lastStampAt = now;
    history.push({ type: 'stamp', n: k, at: now });
  } else if (action === 'redeem') {
    if (stamps < goal) return error(400, 'not_enough_stamps');
    stamps -= goal;
    rewards += 1;
    history.push({ type: 'redeem', n: goal, at: now });
  } else if (action === 'undo') {
    const last = history.pop();
    if (!last) return error(400, 'nothing_to_undo');
    if (last.type === 'stamp') stamps = Math.max(0, stamps - last.n);
    if (last.type === 'redeem') { stamps += last.n; rewards = Math.max(0, rewards - 1); }
    lastStampAt = [...history].reverse().find((h) => h.type === 'stamp')?.at || null;
  } else {
    return error(400, 'invalid_action');
  }
  const updated = await db.cards.update(card.id, { stamps, rewards, lastStampAt, history: history.slice(-100) });
  return json({ card: toOwnerCard(updated), goal });
});
