// Storage layer. Every driver implements the same interface, so the rest of
// the app never knows (or cares) which database is behind it.
//
//   users:  findByEmail(email), findById(id), create(user)
//   pages:  listByUser(userId), findById(id), findBySlug(slug), create(page),
//           update(id, patch), remove(id), countByUser(userId)
//   events: insert(event), listForPage(pageId, since), removeForPage(pageId)
//   assets: create(asset), findById(id), remove(id)
//
// To add a driver (Postgres, SQLite, Supabase…): create a file exporting
// createXDriver() with the interface above and add it to `drivers`.

import { config } from '../config.js';

const drivers = {
  mongo: () => import('./mongo.js').then((m) => m.createMongoDriver()),
  file: () => import('./file.js').then((m) => m.createFileDriver()),
};

let dbPromise = globalThis.__otrelinkDb;

export function getDb() {
  if (!dbPromise) {
    const load = drivers[config.dbDriver];
    if (!load) throw new Error(`Unknown DB_DRIVER "${config.dbDriver}"`);
    dbPromise = load().catch((err) => {
      // Don't cache a failed connection: the next request retries.
      dbPromise = null;
      globalThis.__otrelinkDb = null;
      console.error(`[otrelink] Could not connect to the "${config.dbDriver}" database:`, err?.message || err);
      throw err;
    });
    // Survive hot reloads in dev.
    globalThis.__otrelinkDb = dbPromise;
  }
  return dbPromise;
}
