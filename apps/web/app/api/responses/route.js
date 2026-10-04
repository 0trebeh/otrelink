import { NextResponse } from 'next/server';
import { flattenBlocks, sanitizeBlock, responsesCsv } from '@otrelink/core';
import { handler, json, error, requireOwnedPage } from '@/lib/http';

// Owner: survey responses of a page.
//   GET ?pageId=…                       → { counts: { [blockId]: n } }
//   GET ?pageId=…&blockId=…             → { responses }  (newest first, max 1000)
//   GET ?pageId=…&blockId=…&format=csv  → CSV download
//   DELETE ?pageId=…&blockId=…          → delete all responses of that survey
export const GET = handler(async (req) => {
  const q = new URL(req.url).searchParams;
  const { db, page } = await requireOwnedPage(q.get('pageId'));
  const blockId = q.get('blockId');

  if (!blockId) {
    const surveys = flattenBlocks(page.blocks || []).filter((b) => b.type === 'survey');
    const counts = Object.fromEntries(await Promise.all(surveys.map(async (b) => [b.id, await db.responses.count({ pageId: page.id, blockId: b.id })])));
    return json({ counts });
  }

  const responses = await db.responses.list({ pageId: page.id, blockId, limit: 1000 });
  if (q.get('format') === 'csv') {
    const block = flattenBlocks(page.blocks || []).find((b) => b.id === blockId);
    const questions = block ? sanitizeBlock(block).data.questions : [];
    const name = `${page.slug}-survey-${new Date().toISOString().slice(0, 10)}.csv`;
    return new NextResponse(responsesCsv(questions, responses), {
      headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${name}"`, 'Cache-Control': 'no-store' },
    });
  }
  return json({ responses: responses.map(({ id, createdAt, answers, country }) => ({ id, createdAt, answers, country: country || '' })) });
});

export const DELETE = handler(async (req) => {
  const q = new URL(req.url).searchParams;
  const { db, page } = await requireOwnedPage(q.get('pageId'));
  const blockId = q.get('blockId');
  if (!blockId) return error(400, 'missing_block');
  await db.responses.removeMany({ pageId: page.id, blockId });
  return json({ ok: true });
});
