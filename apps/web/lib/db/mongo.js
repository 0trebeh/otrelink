// MongoDB driver (official driver, no ODM). Documents use string UUIDs as _id
// and are returned with `id` instead of `_id`.
import crypto from 'node:crypto';
import { MongoClient, Binary } from 'mongodb';
import { config } from '../config.js';

const out = (doc) => {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { id: _id, ...rest };
};

export async function createMongoDriver() {
  if (!config.mongoUri) throw new Error('MONGODB_URI is not set');
  const client = new MongoClient(config.mongoUri, { maxPoolSize: 10 });
  await client.connect();
  const db = client.db(config.mongoDb);
  const users = db.collection('users');
  const pages = db.collection('pages');
  const events = db.collection('events');
  const assets = db.collection('assets');

  await Promise.all([
    users.createIndex({ email: 1 }, { unique: true }),
    pages.createIndex({ slug: 1 }, { unique: true }),
    pages.createIndex({ userId: 1 }),
    events.createIndex({ pageId: 1, ts: -1 }),
    // Analytics events expire after 180 days.
    events.createIndex({ ts: 1 }, { expireAfterSeconds: 180 * 86400 }),
    assets.createIndex({ userId: 1 }),
  ]);

  const dupe = (err) => {
    if (err?.code === 11000) throw Object.assign(new Error('slug_taken'), { code: 'slug_taken' });
    throw err;
  };

  return {
    name: 'mongo',
    users: {
      findByEmail: async (email) => out(await users.findOne({ email })),
      findById: async (id) => out(await users.findOne({ _id: id })),
      create: async (user) => {
        const doc = { _id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...user };
        await users.insertOne(doc);
        return out(doc);
      },
    },
    pages: {
      listByUser: async (userId) => (await pages.find({ userId }).sort({ updatedAt: -1 }).toArray()).map(out),
      countByUser: async (userId) => pages.countDocuments({ userId }),
      findById: async (id) => out(await pages.findOne({ _id: id })),
      findBySlug: async (slug) => out(await pages.findOne({ slug })),
      create: async (page) => {
        const ts = new Date().toISOString();
        const doc = { _id: crypto.randomUUID(), createdAt: ts, updatedAt: ts, ...page };
        await pages.insertOne(doc).catch(dupe);
        return out(doc);
      },
      update: async (id, patch) => {
        const res = await pages
          .findOneAndUpdate({ _id: id }, { $set: { ...patch, updatedAt: new Date().toISOString() } }, { returnDocument: 'after' })
          .catch(dupe);
        return out(res);
      },
      remove: async (id) => { await pages.deleteOne({ _id: id }); },
    },
    events: {
      insert: async (ev) => { await events.insertOne({ ...ev, ts: new Date() }); },
      listForPage: async (pageId, since) =>
        (await events.find({ pageId, ts: { $gte: since } }, { projection: { _id: 0 } }).limit(200000).toArray())
          .map((e) => ({ ...e, ts: e.ts.toISOString() })),
      removeForPage: async (pageId) => { await events.deleteMany({ pageId }); },
    },
    assets: {
      create: async ({ userId, mime, data }) => {
        const id = crypto.randomUUID().replace(/-/g, '');
        await assets.insertOne({ _id: id, userId, mime, size: data.length, data: new Binary(data), createdAt: new Date() });
        return { id };
      },
      findById: async (id) => {
        const doc = await assets.findOne({ _id: id });
        return doc ? { id: doc._id, userId: doc.userId, mime: doc.mime, data: Buffer.from(doc.data.buffer) } : null;
      },
      remove: async (id) => { await assets.deleteOne({ _id: id }); },
    },
  };
}
