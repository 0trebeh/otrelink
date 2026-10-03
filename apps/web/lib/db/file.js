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
  let state = { users: [], pages: [], events: [], assets: [] };
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
