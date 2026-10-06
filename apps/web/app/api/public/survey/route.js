import { NextResponse } from 'next/server';
import { findBlock, sanitizeBlock, validateAnswers, answerText } from '@otrelink/core';
import { getDb } from '@/lib/db';
import { pushToUser } from '@/lib/notify';
import { handler, corsHeaders, rateLimit, HttpError } from '@/lib/http';
import { ownerPlan } from '@/lib/plans';
import { allowsBlock } from '@otrelink/core';

// A visitor answers a Survey block. Public (used by the link page).
export const POST = handler(async (req) => {
  rateLimit(req, 'survey', 20, 60 * 60 * 1000);
  const headers = corsHeaders(req);
  const fail = (status, code, extra = {}) => NextResponse.json({ error: code, ...extra }, { status, headers });
  const raw = await req.text();
  if (raw.length > 100_000) return fail(413, 'too_large');
  let body;
  try { body = JSON.parse(raw); } catch { throw new HttpError(400, 'invalid_json'); }

  // Honeypot: real people never fill the hidden "website" field.
  if (body.website) return fail(400, 'invalid');

  const db = await getDb();
  const page = await db.pages.findById(String(body.pageId || '').slice(0, 64));
  const found = page && findBlock(page.blocks || [], String(body.blockId || '').slice(0, 64));
  if (!page?.settings?.published || !found || found.type !== 'survey' || !found.enabled) return fail(404, 'not_found');
  const block = sanitizeBlock(found);
  const plan = await ownerPlan(db, page);
  if (!plan) return fail(404, 'not_found');
  if (!allowsBlock(plan, 'survey')) return fail(403, 'plan_required');

  const { answers, errors } = validateAnswers(block.data.questions, body.answers && typeof body.answers === 'object' ? body.answers : {});
  if (errors.length) return fail(422, 'invalid_answers', { errors });
  if (!answers.some((a) => a.value !== '' && !(Array.isArray(a.value) && !a.value.length))) return fail(422, 'empty', { errors: [] });

  const country = (req.headers.get('cf-ipcountry') || req.headers.get('x-vercel-ip-country') || '').slice(0, 2).toUpperCase();
  const response = await db.responses.create({ userId: page.userId, pageId: page.id, blockId: block.id, answers, country });

  if (block.data.notify) {
    const first = answers.find((a) => answerText(a));
    await pushToUser(page.userId, {
      title: `New response · ${block.data.title || block.data.buttonLabel || 'Survey'}`,
      body: first ? `${first.label}: ${answerText(first)}`.slice(0, 140) : 'Someone answered your survey.',
      url: `/dashboard/${page.id}#responses`,
      tag: `survey-${block.id}`,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, id: response.id }, { status: 201, headers });
});

export const OPTIONS = (req) => new Response(null, { status: 204, headers: corsHeaders(req) });
