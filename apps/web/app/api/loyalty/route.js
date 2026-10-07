import { parseCardCode } from '@otrelink/core';
import { getDb } from '@/lib/db';
import { handler, json, error, requireVerifiedUser } from '@/lib/http';
import { toOwnerCard, loyaltyBlocks } from '@/lib/loyalty';

// Loyalty cards of one of my pages.
//   GET ?pageId=…&code=K7Q2MX   → { card } (a scanned or typed code)
//   GET ?pageId=…[&q=name]      → { cards, blocks, total }
export const GET = handler(async (req) => {
  const user = await requireVerifiedUser();
  const q = new URL(req.url).searchParams;
  const db = await getDb();
  const page = await db.pages.findById(String(q.get('pageId') || ''));
  if (!page || page.userId !== user.id) return error(404, 'page_not_found');
  if (q.has('code')) {
    const code = parseCardCode(q.get('code'));
    const card = code ? await db.cards.findByCode(page.id, code) : null;
    return card ? json({ card: toOwnerCard(card) }) : error(404, 'card_not_found');
  }
  const blocks = loyaltyBlocks(page).map((b) => ({ id: b.id, title: b.data.title, reward: b.data.reward, stamps: b.data.stamps, icon: b.data.icon, oneStampEvery: Number(b.data.oneStampEvery) || 0, enabled: b.enabled }));
  const [cards, total] = await Promise.all([
    db.cards.list({ pageId: page.id, q: String(q.get('q') || '').slice(0, 60), limit: 50 }),
    db.cards.count({ pageId: page.id }),
  ]);
  return json({ cards: cards.map(toOwnerCard), blocks, total });
});
