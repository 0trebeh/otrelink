// Tests of the MCP tools with an in-memory Otrelink API (no server needed).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { resolvePlan, sanitizePage, createDefaultPage, buildTemplatePage, sanitizeToday } from '@otrelink/core';
import { createOtrelinkServer } from '../src/server.js';
import { OtrelinkError } from '../src/client.js';

/** A fake API with the same methods as createClient(). */
function fakeApi({ plan = 'business' } = {}) {
  const user = { id: 'u1', email: 'me@x.co', name: 'Me', plan };
  const pages = new Map();
  let n = 0;
  const pub = () => ({ ...user, plan: resolvePlan(user), auth: { type: 'token', scope: 'write' } });
  const get = (id) => { const p = pages.get(id); if (!p) throw new OtrelinkError(404, 'page_not_found'); return structuredClone(p); };
  return {
    pages,
    me: async () => ({ user: pub(), pageUrl: 'https://p.example' }),
    listPages: async () => [...pages.values()].map((p) => structuredClone(p)),
    getPage: async (id) => get(id),
    createPage: async ({ slug, title, template }) => {
      if ([...pages.values()].some((p) => p.slug === slug)) throw new OtrelinkError(409, 'slug_taken');
      const content = (template && buildTemplatePage(template)) || sanitizePage(createDefaultPage({ slug, title }));
      const id = `00000000-0000-0000-0000-00000000000${++n}`;
      pages.set(id, { id, slug, ...content, today: sanitizeToday({}) });
      return get(id);
    },
    savePage: async (id, body) => {
      const cur = get(id);
      // Same plan rule as the server.
      const next = { ...cur, ...sanitizePage({ ...cur, ...body }), slug: body.slug || cur.slug };
      pages.set(id, next);
      return get(id);
    },
    deletePage: async (id) => { get(id); pages.delete(id); return { ok: true }; },
    checkSlug: async (slug) => ({ slug, available: ![...pages.values()].some((p) => p.slug === slug) }),
    getToday: async (id) => get(id).today,
    updateToday: async (id, patch) => { const p = get(id); p.today = sanitizeToday({ ...p.today, ...patch }); pages.set(id, p); return p.today; },
    analytics: async () => ({ days: 30, totals: { views: 3, clicks: 1 }, series: [{ date: '2026-10-01', views: 3, clicks: 1 }], hours: { views: [0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0] } }),
    listOrders: async () => [{ id: 'o1', code: 'A12', status: 'new', total: 9 }],
    uploadFile: async (p) => ({ id: 'abc', url: `https://x/api/assets/abc?${p}` }),
  };
}

async function connect(api) {
  const server = createOtrelinkServer({ client: api });
  const [a, b] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test', version: '1' });
  await Promise.all([server.connect(a), client.connect(b)]);
  const call = async (name, args = {}) => {
    const r = await client.callTool({ name, arguments: args });
    return { ...r, text: r.content.map((c) => c.text).join('\n') };
  };
  return { client, call };
}

test('exposes every tool, with instructions', async () => {
  const { client } = await connect(fakeApi());
  const { tools } = await client.listTools();
  const names = tools.map((t) => t.name).sort();
  assert.deepEqual(names, [
    'add_block', 'check_slug', 'create_page', 'delete_page', 'duplicate_block', 'get_account', 'get_analytics',
    'get_block_type', 'get_design_options', 'get_page', 'get_today', 'list_block_types', 'list_orders', 'list_pages',
    'list_templates', 'list_themes', 'move_block', 'publish_page', 'remove_block', 'set_theme', 'update_block',
    'update_design', 'update_page', 'update_today', 'upload_file',
  ]);
  assert.ok(tools.find((t) => t.name === 'delete_page').annotations.destructiveHint);
  assert.ok(tools.find((t) => t.name === 'list_pages').annotations.readOnlyHint);
  assert.match(client.getInstructions(), /list_block_types/);
});

test('catalog tools describe blocks, themes, templates and design options', async () => {
  const { call } = await connect(fakeApi());
  const types = JSON.parse((await call('list_block_types')).text);
  assert.ok(types.some((t) => t.type === 'link' && t.available));
  const link = JSON.parse((await call('get_block_type', { type: 'link' })).text);
  assert.ok(link.fields.some((f) => f.key === 'url' && f.required));
  assert.ok(link.blockOptions.style.some((f) => f.key === 'stAccentColor'));
  const themes = JSON.parse((await call('list_themes')).text);
  assert.ok(themes.some((t) => t.id === 'corporate'));
  const food = JSON.parse((await call('list_templates', { category: 'Food' })).text);
  assert.ok(food.some((t) => t.id === 'tacotruck'));
  const design = JSON.parse((await call('get_design_options')).text);
  assert.ok(design.design.groups.some((g) => g.fields.some((f) => f.key === 'accentColor')));
  assert.ok(design.socialPlatforms.some((p) => p.id === 'instagram'));
  assert.equal((await call('get_block_type', { type: 'nope' })).isError, true);
});

test('pages: create (empty and from a template), update, publish, slug and delete', async () => {
  const api = fakeApi();
  const { call } = await connect(api);
  const made = await call('create_page', { slug: 'mi-tienda', title: 'Mi tienda' });
  assert.match(made.text, /Created/);
  assert.match((await call('create_page', { slug: 'taco', template: 'tacotruck' })).text, /tacotruck/);
  assert.equal((await call('create_page', { slug: 'x', title: 'bad' })).isError, true);
  assert.equal((await call('create_page', { slug: 'mi-tienda' })).isError, true);
  const list = JSON.parse((await call('list_pages')).text);
  assert.equal(list.length, 2);
  assert.equal(list[0].url, 'https://p.example/mi-tienda');

  await call('update_page', { page: 'mi-tienda', profile: { bio: 'Hola' }, socials: [{ platform: 'instagram', url: 'https://instagram.com/x' }, { platform: 'myspace', url: 'x' }], settings: { language: 'es' } });
  const p = [...api.pages.values()].find((x) => x.slug === 'mi-tienda');
  assert.equal(p.profile.bio, 'Hola');
  assert.equal(p.profile.title, 'Mi tienda');
  assert.deepEqual(p.socials.map((s) => s.platform), ['instagram']);
  assert.equal(p.settings.language, 'es');

  await call('publish_page', { page: 'mi-tienda', published: false });
  assert.equal([...api.pages.values()].find((x) => x.slug === 'mi-tienda').settings.published, false);
  await call('update_page', { page: 'mi-tienda', slug: 'mi-tienda-2' });
  assert.ok([...api.pages.values()].some((x) => x.slug === 'mi-tienda-2'));

  assert.equal((await call('delete_page', { page: 'taco' })).isError, true, 'needs confirm');
  await call('delete_page', { page: 'taco', confirm: true });
  assert.equal(api.pages.size, 1);
  assert.equal((await call('get_page', { page: 'nope' })).isError, true);
});

test('blocks: add (top level, into a collection, positions), update, move, duplicate, remove', async () => {
  const api = fakeApi();
  const { call } = await connect(api);
  await call('create_page', { slug: 'blocks', title: 'B' });
  const page = () => [...api.pages.values()][0];
  page().blocks = []; // start empty

  const r1 = await call('add_block', { page: 'blocks', type: 'link', data: { title: 'Shop', url: 'https://shop.example', bogus: 1 } });
  assert.match(r1.text, /Ignored unknown fields for "link": bogus/);
  await call('add_block', { page: 'blocks', type: 'header', data: { text: 'Top' }, index: 0 });
  await call('add_block', { page: 'blocks', type: 'collection', data: { title: 'More' } });
  assert.deepEqual(page().blocks.find((b) => b.type === 'collection').children, [], 'containers start empty');
  const fresh = [...api.pages.values()][0];
  const collId = fresh.blocks.find((b) => b.type === 'collection').id;
  await call('add_block', { page: 'blocks', type: 'link', data: { title: 'Inside', url: 'https://a.example' }, parentId: collId });
  const r = await call('add_block', { page: 'blocks', type: 'text', data: { text: 'Hello' }, parentId: [...api.pages.values()][0].blocks[0].id });
  assert.equal(r.isError, true, 'header is not a container');
  assert.match((await call('add_block', { page: 'blocks', type: 'link', data: {} })).text, /Missing: Title is required/);

  let p = [...api.pages.values()][0];
  assert.deepEqual(p.blocks.map((b) => b.type), ['header', 'link', 'collection', 'link']);
  assert.equal(p.blocks[2].children[0].data.title, 'Inside');

  const shop = p.blocks[1];
  await call('update_block', { page: 'blocks', blockId: shop.id, data: { subtitle: 'New things' }, options: { stButtonColor: '#ff0000' } });
  p = [...api.pages.values()][0];
  assert.equal(p.blocks[1].data.title, 'Shop');
  assert.equal(p.blocks[1].data.subtitle, 'New things');
  assert.equal(p.blocks[1].options.stButtonColor, '#ff0000');
  await call('update_block', { page: 'blocks', blockId: shop.id, enabled: false });
  assert.match((await call('get_page', { page: 'blocks' })).text, new RegExp(`id=${shop.id}.*hidden`));

  // Move the shop link into the collection, first; then back to the top, first.
  await call('move_block', { page: 'blocks', blockId: shop.id, parentId: p.blocks[2].id, index: 0 });
  p = [...api.pages.values()][0];
  assert.deepEqual(p.blocks.map((b) => b.type), ['header', 'collection', 'link']);
  assert.equal(p.blocks[1].children[0].id, shop.id);
  await call('move_block', { page: 'blocks', blockId: shop.id, toTop: true, index: 0 });
  p = [...api.pages.values()][0];
  assert.equal(p.blocks[0].id, shop.id);
  await call('move_block', { page: 'blocks', blockId: shop.id, afterId: p.blocks[1].id });
  p = [...api.pages.values()][0];
  assert.equal(p.blocks[1].id, shop.id);
  assert.equal((await call('move_block', { page: 'blocks', blockId: p.blocks[2].id, parentId: p.blocks[2].id })).isError, true);

  const dup = await call('duplicate_block', { page: 'blocks', blockId: shop.id });
  assert.match(dup.text, /Duplicated/);
  p = [...api.pages.values()][0];
  assert.equal(p.blocks.length, 5);
  await call('remove_block', { page: 'blocks', blockId: shop.id });
  p = [...api.pages.values()][0];
  assert.ok(!p.blocks.some((b) => b.id === shop.id));
});

test('plan limits: locked blocks and backgrounds are refused before saving', async () => {
  const api = fakeApi({ plan: 'free' });
  const { call } = await connect(api);
  await call('create_page', { slug: 'free-page', title: 'F' });
  const r = await call('add_block', { page: 'free-page', type: 'catalog', data: {} });
  assert.equal(r.isError, true);
  assert.match(r.text, /doesn’t include the "catalog" block/);
  assert.equal((await call('update_design', { page: 'free-page', design: { wallpaper: { type: 'video' } } })).isError, true);
  assert.equal((await call('add_block', { page: 'free-page', type: 'code', data: { code: 'x' } })).isError, undefined);
});

test('design: set_theme and update_design (partial, wallpaper merge, unknown keys)', async () => {
  const api = fakeApi();
  const { call } = await connect(api);
  await call('create_page', { slug: 'design', title: 'D' });
  await call('set_theme', { page: 'design', theme: 'luxe' });
  let p = [...api.pages.values()][0];
  assert.equal(p.design.theme, 'luxe');
  assert.equal(p.design.buttonStyle, 'double');
  assert.equal((await call('set_theme', { page: 'design', theme: 'nope' })).isError, true);
  const r = await call('update_design', { page: 'design', design: { accentColor: '#E11D48', titleFont: 'playfair', nonsense: 1, wallpaper: { type: 'solid', color: '#101010' } } });
  assert.match(r.text, /Ignored unknown keys: nonsense/);
  p = [...api.pages.values()][0];
  assert.equal(p.design.accentColor, '#e11d48');
  assert.equal(p.design.titleFont, 'playfair');
  assert.deepEqual([p.design.wallpaper.type, p.design.wallpaper.color], ['solid', '#101010']);
  await call('update_design', { page: 'design', design: { wallpaper: { color: '#202020' } } });
  assert.equal([...api.pages.values()][0].design.wallpaper.color, '#202020');
});

test('business tools: analytics, orders, today and upload', async () => {
  const api = fakeApi();
  const { call } = await connect(api);
  await call('create_page', { slug: 'truck', template: 'tacotruck' });
  const an = (await call('get_analytics', { page: 'truck' })).text;
  assert.match(an, /2026-10-01: 3 visits/);
  assert.match(an, /"09:00: 2 visits",\s*"20:00: 1 visits"/);
  assert.match((await call('list_orders', { page: 'truck' })).text, /A12/);
  const today = JSON.parse((await call('get_today', { page: 'truck' })).text);
  assert.ok(today.products.length > 3 && today.products[0].key.includes(':'));
  await call('update_today', { page: 'truck', status: 'open', place: 'Downtown', until: '22:00', soldOut: [today.products[0].key] });
  const t = [...api.pages.values()][0].today;
  assert.deepEqual([t.status, t.place, t.until, t.soldOut.length], ['open', 'Downtown', '22:00', 1]);
  assert.equal((await call('update_today', { page: 'truck', until: '25:00' })).isError, true);
  assert.match((await call('upload_file', { path: '/tmp/a.png' })).text, /api\/assets\/abc/);
  const acct = JSON.parse((await call('get_account')).text);
  assert.equal(acct.plan, 'Business');
  assert.ok(acct.featuresOn.includes('api'));
});

test('API errors come back as readable tool errors', async () => {
  const api = fakeApi();
  api.listPages = async () => { throw new OtrelinkError(403, 'token_read_only'); };
  const { call } = await connect(api);
  const r = await call('list_pages');
  assert.equal(r.isError, true);
  assert.match(r.text, /read-only/);
});
