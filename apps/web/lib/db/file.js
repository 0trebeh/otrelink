// JSON file driver — zero setup, for local development and small installs.
// Data lives in apps/web/data/db.json, uploads in apps/web/data/assets/.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const DIR = path.join(process.cwd(), 'data');
const FILE = path.join(DIR, 'db.json');
const ASSETS = path.join(DIR, 'assets');

export async function createFileDriver() {
  await fs.mkdir(ASSETS, { recursive: true });
  let state = { users: [], pages: [], events: [], assets: [], bookings: [], push: [], responses: [], reviews: [] };
  try { state = { ...state, ...JSON.parse(await fs.readFile(FILE, 'utf8')) }; } catch { /* first run */ }

  let writing = Promise.resolve();
  const persist = () => {
    writing = writing.then(() => fs.writeFile(FILE + '.tmp', JSON.stringify(state)).then(() => fs.rename(FILE + '.tmp', FILE)));
    return writing;
  };
  const clone = (v) => (v ? structuredClone(v) : null);
  const now = () => new Date().toISOString();

  return {
    name: 'file',
    users: {
      findByEmail: async (email) => clone(state.users.find((u) => u.email === email)),
      findById: async (id) => clone(state.users.find((u) => u.id === id)),
      findByCalendarToken: async (token) => clone(state.users.find((u) => token && u.calendarToken === token)),
      update: async (id, patch) => {
        const u = state.users.find((x) => x.id === id);
        if (!u) return null;
        Object.assign(u, patch);
        await persist();
        return clone(u);
      },
      create: async (user) => {
        const doc = { id: crypto.randomUUID(), createdAt: now(), ...user };
        state.users.push(doc);
        await persist();
        return clone(doc);
      },
    },
    pages: {
      listByUser: async (userId) => clone(state.pages.filter((p) => p.userId === userId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))),
      countByUser: async (userId) => state.pages.filter((p) => p.userId === userId).length,
      findById: async (id) => clone(state.pages.find((p) => p.id === id)),
      findBySlug: async (slug) => clone(state.pages.find((p) => p.slug === slug)),
      create: async (page) => {
        if (state.pages.some((p) => p.slug === page.slug)) throw Object.assign(new Error('slug_taken'), { code: 'slug_taken' });
        const doc = { id: crypto.randomUUID(), createdAt: now(), updatedAt: now(), ...page };
        state.pages.push(doc);
        await persist();
        return clone(doc);
      },
      update: async (id, patch) => {
        const i = state.pages.findIndex((p) => p.id === id);
        if (i < 0) return null;
        if (patch.slug && state.pages.some((p) => p.slug === patch.slug && p.id !== id)) {
          throw Object.assign(new Error('slug_taken'), { code: 'slug_taken' });
        }
        state.pages[i] = { ...state.pages[i], ...patch, updatedAt: now() };
        await persist();
        return clone(state.pages[i]);
      },
      remove: async (id) => {
        state.pages = state.pages.filter((p) => p.id !== id);
        await persist();
      },
    },
    events: {
      insert: async (ev) => {
        state.events.push({ ...ev, ts: now() });
        // Keep the file small: drop events older than 180 days.
        if (state.events.length % 500 === 0) {
          const cutoff = new Date(Date.now() - 180 * 864e5).toISOString();
          state.events = state.events.filter((e) => e.ts >= cutoff);
        }
        await persist();
      },
      listForPage: async (pageId, since) => {
        const s = since.toISOString();
        return state.events.filter((e) => e.pageId === pageId && e.ts >= s);
      },
      removeForPage: async (pageId) => {
        state.events = state.events.filter((e) => e.pageId !== pageId);
        await persist();
      },
    },
    bookings: {
      create: async (b) => {
        if (b.slotKey && state.bookings.some((x) => x.slotKey === b.slotKey)) throw Object.assign(new Error('slot_taken'), { code: 'slot_taken' });
        const doc = { id: crypto.randomUUID(), createdAt: now(), remindersSent: [], ...b };
        state.bookings.push(doc);
        await persist();
        return clone(doc);
      },
      findById: async (id) => clone(state.bookings.find((b) => b.id === id)),
      list: async ({ pageId, blockId, userId, from, to, statuses, desc = false, limit = 500 } = {}) => clone(state.bookings
        .filter((b) => (!pageId || b.pageId === pageId) && (!blockId || b.blockId === blockId) && (!userId || b.userId === userId)
          && (!from || b.start >= from) && (!to || b.start < to) && (!statuses || statuses.includes(b.status)))
        .sort((a, b) => (desc ? b.start.localeCompare(a.start) : a.start.localeCompare(b.start)))
        .slice(0, limit)),
      update: async (id, patch) => {
        const i = state.bookings.findIndex((b) => b.id === id);
        if (i < 0) return null;
        const next = { ...state.bookings[i], ...patch, updatedAt: now() };
        if (next.slotKey === null) delete next.slotKey;
        if (next.slotKey && state.bookings.some((x) => x.id !== id && x.slotKey === next.slotKey)) throw Object.assign(new Error('slot_taken'), { code: 'slot_taken' });
        state.bookings[i] = next;
        await persist();
        return clone(next);
      },
    },
    // Survey responses (newest first in lists).
    responses: {
      create: async (r) => {
        const doc = { id: crypto.randomUUID(), createdAt: now(), ...r };
        state.responses.push(doc);
        await persist();
        return clone(doc);
      },
      findById: async (id) => clone(state.responses.find((r) => r.id === id)),
      list: async ({ pageId, blockId, limit = 500 } = {}) => clone(state.responses
        .filter((r) => r.pageId === pageId && (!blockId || r.blockId === blockId))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit)),
      count: async ({ pageId, blockId }) => state.responses.filter((r) => r.pageId === pageId && (!blockId || r.blockId === blockId)).length,
      remove: async (id) => {
        state.responses = state.responses.filter((r) => r.id !== id);
        await persist();
      },
      removeMany: async ({ pageId, blockId }) => {
        state.responses = state.responses.filter((r) => !(r.pageId === pageId && (!blockId || r.blockId === blockId)));
        await persist();
      },
    },
    // Reviews (newest first in lists).
    reviews: {
      create: async (r) => {
        const doc = { id: crypto.randomUUID(), createdAt: now(), reply: '', ...r };
        state.reviews.push(doc);
        await persist();
        return clone(doc);
      },
      findById: async (id) => clone(state.reviews.find((r) => r.id === id)),
      list: async ({ pageId, blockId, statuses, before, limit = 50 } = {}) => clone(state.reviews
        .filter((r) => r.pageId === pageId && (!blockId || r.blockId === blockId) && (!statuses || statuses.includes(r.status)) && (!before || r.createdAt < before))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit)),
      count: async ({ pageId, blockId, status }) => state.reviews.filter((r) => r.pageId === pageId && (!blockId || r.blockId === blockId) && (!status || r.status === status)).length,
      stats: async ({ pageId, blockId }) => {
        const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        for (const r of state.reviews) if (r.pageId === pageId && r.blockId === blockId && r.status === 'published') dist[r.rating]++;
        return dist;
      },
      update: async (id, patch) => {
        const i = state.reviews.findIndex((r) => r.id === id);
        if (i < 0) return null;
        state.reviews[i] = { ...state.reviews[i], ...patch, updatedAt: now() };
        await persist();
        return clone(state.reviews[i]);
      },
      remove: async (id) => {
        state.reviews = state.reviews.filter((r) => r.id !== id);
        await persist();
      },
      removeMany: async ({ pageId }) => {
        state.reviews = state.reviews.filter((r) => r.pageId !== pageId);
        await persist();
      },
    },
    push: {
      save: async (userId, sub) => {
        state.push = state.push.filter((p) => p.endpoint !== sub.endpoint);
        state.push.push({ userId, endpoint: sub.endpoint, keys: sub.keys, createdAt: now() });
        await persist();
      },
      listByUser: async (userId) => clone(state.push.filter((p) => p.userId === userId)),
      remove: async (endpoint) => {
        state.push = state.push.filter((p) => p.endpoint !== endpoint);
        await persist();
      },
    },
    assets: {
      create: async ({ userId, mime, data, name = '' }) => {
        const id = crypto.randomUUID().replace(/-/g, '');
        await fs.writeFile(path.join(ASSETS, id), data);
        state.assets.push({ id, userId, mime, name, size: data.length, createdAt: now() });
        await persist();
        return { id };
      },
      findById: async (id) => {
        const meta = state.assets.find((a) => a.id === id);
        if (!meta) return null;
        const data = await fs.readFile(path.join(ASSETS, id)).catch(() => null);
        return data ? { ...meta, data } : null;
      },
      remove: async (id) => {
        state.assets = state.assets.filter((a) => a.id !== id);
        await fs.rm(path.join(ASSETS, id), { force: true });
        await persist();
      },
    },
  };
}
