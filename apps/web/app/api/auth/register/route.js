import bcrypt from 'bcryptjs';
import { createDefaultPage, sanitizeSlug, sanitizePage } from '@otrelink/core';
import { getDb } from '@/lib/db';
import { createSession, publicUser } from '@/lib/auth';
import { handler, json, error, readJson, rateLimit } from '@/lib/http';

export const POST = handler(async (req) => {
  rateLimit(req, 'register', 15, 15 * 60 * 1000);
  const body = await readJson(req);
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const slug = sanitizeSlug(body.slug);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error(400, 'invalid_email');
  if (password.length < 8) return error(400, 'weak_password');
  if (!slug) return error(400, 'invalid_slug');

  const db = await getDb();
  if (await db.users.findByEmail(email)) return error(409, 'email_taken');
  if (await db.pages.findBySlug(slug)) return error(409, 'slug_taken');

  const user = await db.users.create({ email, name: String(body.name || '').slice(0, 60), passwordHash: await bcrypt.hash(password, 10) });
  const content = sanitizePage(createDefaultPage({ slug, title: body.name ? String(body.name) : `@${slug}` }));
  const page = await db.pages.create({ userId: user.id, slug, ...content });

  await createSession(user);
  return json({ user: publicUser(user), pageId: page.id }, { status: 201 });
});
