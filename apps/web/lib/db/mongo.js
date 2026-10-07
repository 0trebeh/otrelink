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
  const bookings = db.collection('bookings');
  const pushSubs = db.collection('push_subscriptions');
  const responses = db.collection('survey_responses');
  const reviews = db.collection('reviews');
  const orders = db.collection('orders');
  const cards = db.collection('loyalty_cards');
  const limits = db.collection('rate_limits');

  console.log(`[otrelink] MongoDB connected (database "${config.mongoDb}")`);

  // Index problems (e.g. old data in the same database) must not take the app down.
  const indexes = [
    [users, { email: 1 }, { unique: true }],
    [pages, { slug: 1 }, { unique: true }],
    [pages, { userId: 1 }, {}],
    [events, { pageId: 1, ts: -1 }, {}],
    // Analytics events expire after 180 days.
    [events, { ts: 1 }, { expireAfterSeconds: 180 * 86400 }],
    [assets, { userId: 1 }, {}],
    // One active booking per block and start time (slotKey is removed on cancel).
    [bookings, { slotKey: 1 }, { unique: true, sparse: true }],
    [bookings, { pageId: 1, start: 1 }, {}],
    [bookings, { start: 1 }, {}],
    [pushSubs, { endpoint: 1 }, { unique: true }],
    [pushSubs, { userId: 1 }, {}],
    [users, { calendarToken: 1 }, { sparse: true }],
    [users, { 'billing.subscriptionId': 1 }, { sparse: true }],
    [users, { createdAt: -1 }, {}],
    [responses, { pageId: 1, blockId: 1, createdAt: -1 }, {}],
    [reviews, { pageId: 1, blockId: 1, status: 1, createdAt: -1 }, {}],
    [orders, { pageId: 1, status: 1, createdAt: -1 }, {}],
    // Orders are kept 180 days (createdAtDate is a Date copy of createdAt for the TTL).
    [orders, { createdAtDate: 1 }, { expireAfterSeconds: 180 * 86400 }],
    [cards, { pageId: 1, code: 1 }, { unique: true }],
    [cards, { pageId: 1, updatedAt: -1 }, {}],
    // Rate-limit counters delete themselves when their window ends.
    [limits, { expiresAt: 1 }, { expireAfterSeconds: 0 }],
    [users, { verifyTokenHash: 1 }, { sparse: true }],
    [users, { pendingSlug: 1 }, { sparse: true }],
  ];
  const results = await Promise.allSettled(indexes.map(([col, keys, opts]) => col.createIndex(keys, opts)));
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.warn(`[otrelink] Could not create index ${JSON.stringify(indexes[i][1])} on "${indexes[i][0].collectionName}":`, r.reason?.message);
    }
  });

  const dupe = (err) => {
    if (err?.code === 11000) throw Object.assign(new Error('slug_taken'), { code: 'slug_taken' });
    throw err;
  };

  return {
    name: 'mongo',
    users: {
      findByEmail: async (email) => out(await users.findOne({ email })),
      findById: async (id) => out(await users.findOne({ _id: id })),
      findByCalendarToken: async (token) => (token ? out(await users.findOne({ calendarToken: token })) : null),
      update: async (id, patch) => out(await users.findOneAndUpdate({ _id: id }, { $set: patch }, { returnDocument: 'after' })),
      create: async (user) => {
        const doc = { _id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...user };
        await users.insertOne(doc);
        return out(doc);
      },
      findBySubscription: async (id) => (id ? out(await users.findOne({ 'billing.subscriptionId': id })) : null),
      // Username reserved by an account that hasn't confirmed its email (until its link expires).
      findByPendingSlug: async (slug) => (slug ? out(await users.findOne({ pendingSlug: slug, verifyExpires: { $gt: new Date().toISOString() } })) : null),
      findByVerifyToken: async (hash) => (hash ? out(await users.findOne({ verifyTokenHash: hash })) : null),
      // Cancelled subscriptions whose paid period is over (still on Pro).
      listBillingEnded: async (nowIso) => (await users.find({
        plan: 'pro', 'billing.status': 'canceled', 'billing.downgraded': { $ne: true }, 'billing.endsAt': { $lte: nowIso },
      }).limit(500).toArray()).map(out),
      // Admin: search + filters. plan 'pro' includes accounts from before plans (no plan field).
      list: async ({ q = '', plan = '', status = '', skip = 0, limit = 50 } = {}) => {
        const and = [];
        const s = q.trim().toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (s) and.push({ $or: [{ email: { $regex: s } }, { name: { $regex: s, $options: 'i' } }] });
        if (plan === 'pro') and.push({ $or: [{ plan: 'pro' }, { plan: { $exists: false } }] });
        else if (plan) and.push({ plan });
        if (status === 'banned') and.push({ banned: true });
        else if (status === 'paying') and.push({ 'billing.status': { $in: ['active', 'past_due'] } });
        else if (status === 'active') and.push({ banned: { $ne: true } });
        const q2 = and.length ? { $and: and } : {};
        const [rows, total] = await Promise.all([
          users.find(q2, { projection: { passwordHash: 0 } }).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
          users.countDocuments(q2),
        ]);
        return { users: rows.map(out), total };
      },
      stats: async (sinceIso) => {
        const [facet] = await users.aggregate([{ $facet: {
          plans: [{ $group: { _id: { $ifNull: ['$plan', 'pro'] }, n: { $sum: 1 } } }],
          banned: [{ $match: { banned: true } }, { $count: 'n' }],
          paying: [{ $match: { 'billing.status': { $in: ['active', 'past_due'] } } }, { $group: { _id: '$billing.provider', n: { $sum: 1 } } }],
          signups: [{ $match: { createdAt: { $gte: sinceIso } } }, { $group: { _id: { $substr: ['$createdAt', 0, 10] }, n: { $sum: 1 } } }],
          total: [{ $count: 'n' }],
        } }]).toArray();
        const byPlan = { free: 0, pro: 0, business: 0 };
        for (const r of facet.plans) byPlan[r._id] = r.n;
        const byProvider = { stripe: 0, paypal: 0 };
        for (const r of facet.paying) byProvider[r._id] = r.n;
        return {
          total: facet.total[0]?.n || 0, byPlan, banned: facet.banned[0]?.n || 0,
          paying: facet.paying.reduce((s, r) => s + r.n, 0), byProvider,
          signups: Object.fromEntries(facet.signups.map((r) => [r._id, r.n])),
          pages: await pages.estimatedDocumentCount(),
        };
      },
      // Delete an account and everything it owns.
      remove: async (id) => {
        const pageIds = (await pages.find({ userId: id }, { projection: { _id: 1 } }).toArray()).map((p) => p._id);
        await Promise.all([
          pages.deleteMany({ userId: id }), assets.deleteMany({ userId: id }), pushSubs.deleteMany({ userId: id }),
          events.deleteMany({ pageId: { $in: pageIds } }), bookings.deleteMany({ pageId: { $in: pageIds } }),
          responses.deleteMany({ pageId: { $in: pageIds } }), reviews.deleteMany({ pageId: { $in: pageIds } }),
          orders.deleteMany({ pageId: { $in: pageIds } }), cards.deleteMany({ pageId: { $in: pageIds } }),
        ]);
        await users.deleteOne({ _id: id });
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
    bookings: {
      create: async (b) => {
        const doc = { _id: crypto.randomUUID(), createdAt: new Date().toISOString(), remindersSent: [], ...b };
        await bookings.insertOne(doc).catch((err) => { if (err?.code === 11000) throw Object.assign(new Error('slot_taken'), { code: 'slot_taken' }); throw err; });
        return out(doc);
      },
      findById: async (id) => out(await bookings.findOne({ _id: id })),
      list: async ({ pageId, blockId, userId, from, to, statuses, desc = false, limit = 500 } = {}) => {
        const q = {};
        if (pageId) q.pageId = pageId;
        if (blockId) q.blockId = blockId;
        if (userId) q.userId = userId;
        if (statuses) q.status = { $in: statuses };
        if (from || to) q.start = { ...(from ? { $gte: from } : {}), ...(to ? { $lt: to } : {}) };
        return (await bookings.find(q).sort({ start: desc ? -1 : 1 }).limit(limit).toArray()).map(out);
      },
      update: async (id, patch) => {
        const set = { ...patch, updatedAt: new Date().toISOString() };
        const unset = {};
        if (patch.slotKey === null) { delete set.slotKey; unset.slotKey = ''; }
        const res = await bookings
          .findOneAndUpdate({ _id: id }, { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) }, { returnDocument: 'after' })
          .catch((err) => { if (err?.code === 11000) throw Object.assign(new Error('slot_taken'), { code: 'slot_taken' }); throw err; });
        return out(res);
      },
    },
    responses: {
      create: async (r) => {
        const doc = { _id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...r };
        await responses.insertOne(doc);
        return out(doc);
      },
      findById: async (id) => out(await responses.findOne({ _id: id })),
      list: async ({ pageId, blockId, limit = 500 } = {}) =>
        (await responses.find({ pageId, ...(blockId ? { blockId } : {}) }).sort({ createdAt: -1 }).limit(limit).toArray()).map(out),
      count: async ({ pageId, blockId }) => responses.countDocuments({ pageId, ...(blockId ? { blockId } : {}) }),
      remove: async (id) => { await responses.deleteOne({ _id: id }); },
      removeMany: async ({ pageId, blockId }) => { await responses.deleteMany({ pageId, ...(blockId ? { blockId } : {}) }); },
    },
    limits: {
      hit: async (id, expiresAt) => {
        const doc = await limits.findOneAndUpdate(
          { _id: id }, { $inc: { n: 1 }, $setOnInsert: { expiresAt } }, { upsert: true, returnDocument: 'after' },
        );
        return doc?.n ?? 1;
      },
      get: async (id) => (await limits.findOne({ _id: id }))?.n || 0,
    },
    reviews: {
      create: async (r) => {
        const doc = { _id: crypto.randomUUID(), createdAt: new Date().toISOString(), reply: '', ...r };
        await reviews.insertOne(doc);
        return out(doc);
      },
      findById: async (id) => out(await reviews.findOne({ _id: id })),
      list: async ({ pageId, blockId, statuses, before, limit = 50 } = {}) => {
        const q = { pageId };
        if (blockId) q.blockId = blockId;
        if (statuses) q.status = { $in: statuses };
        if (before) q.createdAt = { $lt: before };
        return (await reviews.find(q).sort({ createdAt: -1 }).limit(limit).toArray()).map(out);
      },
      count: async ({ pageId, blockId, status }) => reviews.countDocuments({ pageId, ...(blockId ? { blockId } : {}), ...(status ? { status } : {}) }),
      stats: async ({ pageId, blockId }) => {
        const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        const rows = await reviews.aggregate([{ $match: { pageId, blockId, status: 'published' } }, { $group: { _id: '$rating', n: { $sum: 1 } } }]).toArray();
        for (const r of rows) if (r._id in dist) dist[r._id] = r.n;
        return dist;
      },
      update: async (id, patch) => out(await reviews.findOneAndUpdate({ _id: id }, { $set: { ...patch, updatedAt: new Date().toISOString() } }, { returnDocument: 'after' })),
      remove: async (id) => { await reviews.deleteOne({ _id: id }); },
      removeMany: async ({ pageId }) => { await reviews.deleteMany({ pageId }); },
    },
    orders: {
      create: async (o) => {
        const created = new Date();
        const doc = { _id: crypto.randomUUID(), createdAt: created.toISOString(), createdAtDate: created, ...o };
        await orders.insertOne(doc);
        const { createdAtDate, ...rest } = doc;
        return out(rest);
      },
      findById: async (id) => out(await orders.findOne({ _id: id }, { projection: { createdAtDate: 0 } })),
      list: async ({ pageId, userId, statuses, since, limit = 100 } = {}) => {
        const q = {};
        if (pageId) q.pageId = pageId;
        if (userId) q.userId = userId;
        if (statuses) q.status = { $in: statuses };
        if (since) q.createdAt = { $gte: since };
        return (await orders.find(q, { projection: { createdAtDate: 0 } }).sort({ createdAt: -1 }).limit(limit).toArray()).map(out);
      },
      count: async ({ pageId, statuses, since }) => orders.countDocuments({ pageId, ...(statuses ? { status: { $in: statuses } } : {}), ...(since ? { createdAt: { $gte: since } } : {}) }),
      update: async (id, patch) => out(await orders.findOneAndUpdate({ _id: id }, { $set: { ...patch, updatedAt: new Date().toISOString() } }, { returnDocument: 'after', projection: { createdAtDate: 0 } })),
      removeMany: async ({ pageId }) => { await orders.deleteMany({ pageId }); },
    },
    cards: {
      create: async (c) => {
        const t = new Date().toISOString();
        const doc = { _id: crypto.randomUUID(), createdAt: t, updatedAt: t, ...c };
        await cards.insertOne(doc).catch((err) => { if (err?.code === 11000) throw Object.assign(new Error('code_taken'), { code: 'code_taken' }); throw err; });
        return out(doc);
      },
      findById: async (id) => out(await cards.findOne({ _id: id })),
      findByCode: async (pageId, code) => out(await cards.findOne({ pageId, code })),
      list: async ({ pageId, blockId, q = '', limit = 50 } = {}) => {
        const query = { pageId };
        if (blockId) query.blockId = blockId;
        const s = q.trim();
        if (s) {
          const code = s.toUpperCase().replace(/[\s-]/g, '').replace(/[^A-Z0-9]/g, '');
          const rx = s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          query.$or = [{ name: { $regex: rx, $options: 'i' } }, ...(code ? [{ code: { $regex: code } }] : [])];
        }
        return (await cards.find(query).sort({ updatedAt: -1 }).limit(limit).toArray()).map(out);
      },
      count: async ({ pageId, blockId }) => cards.countDocuments({ pageId, ...(blockId ? { blockId } : {}) }),
      update: async (id, patch) => out(await cards.findOneAndUpdate({ _id: id }, { $set: { ...patch, updatedAt: new Date().toISOString() } }, { returnDocument: 'after' })),
      removeMany: async ({ pageId }) => { await cards.deleteMany({ pageId }); },
    },
    push: {
      save: async (userId, sub) => {
        await pushSubs.updateOne({ endpoint: sub.endpoint }, { $set: { userId, keys: sub.keys, createdAt: new Date().toISOString() } }, { upsert: true });
      },
      listByUser: async (userId) => (await pushSubs.find({ userId }).toArray()).map(({ _id, ...p }) => p),
      remove: async (endpoint) => { await pushSubs.deleteOne({ endpoint }); },
    },
    assets: {
      create: async ({ userId, mime, data, name = '' }) => {
        const id = crypto.randomUUID().replace(/-/g, '');
        await assets.insertOne({ _id: id, userId, mime, name, size: data.length, data: new Binary(data), createdAt: new Date() });
        return { id };
      },
      findById: async (id) => {
        const doc = await assets.findOne({ _id: id });
        return doc ? { id: doc._id, userId: doc.userId, mime: doc.mime, name: doc.name || '', data: Buffer.from(doc.data.buffer) } : null;
      },
      remove: async (id) => { await assets.deleteOne({ _id: id }); },
    },
  };
}
