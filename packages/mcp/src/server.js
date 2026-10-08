// Otrelink MCP server: the tools an AI assistant uses to create and edit the
// pages of the token's owner. Transport-agnostic: index.js connects it to
// stdio; tests connect it in memory.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  blockTypes, themes, applyTheme, allowsBlock, allowsWallpaper, featureForWallpaper, featureForBlock,
  designFields, cloneBlock, socials, sanitizeSlug, productKey, TEMPLATES,
} from '@otrelink/core';
import { createClient, OtrelinkError } from './client.js';
import {
  findBlock, insertBlock, removeBlock, moveBlock, buildBlock, checkBlock, outline, blocksOfType,
} from './blocks.js';
import {
  listBlockTypes, blockTypeDetail, blockOptionFields, listThemes, listTemplates, templateCategories,
  designOptions, profileOptions, settingsOptions, socialPlatforms,
} from './describe.js';

export const SERVER_INSTRUCTIONS = `Otrelink builds link-in-bio pages ("pages") made of blocks.
Every tool acts as the owner of the API token, on their own pages only.

Typical flow:
1. get_account (plan, page limit, which features are on), then list_pages.
2. To start a page: list_templates and create_page with a template, or create_page empty.
3. To add content: list_block_types → get_block_type (fields and defaults) → add_block.
   Blocks inside a "collection" use parentId. Positions use index, beforeId or afterId.
4. get_page shows the outline with block ids; use them in update_block, move_block, remove_block.
5. Look: list_themes + set_theme, or get_design_options + update_design.
Changes are saved right away and go live if the page is published. Images must be URLs:
use upload_file for local files. Don't invent block fields: unknown ones are ignored.
If the owner has the page open in the dashboard with unsaved changes, saving there can overwrite yours.`;

const text = (s) => ({ content: [{ type: 'text', text: s }] });
const json = (value, note) => text(`${note ? `${note}\n\n` : ''}${JSON.stringify(value, null, 2)}`);
const fail = (msg) => ({ isError: true, content: [{ type: 'text', text: msg }] });

const pageRef = z.string().min(1).describe('Page id or slug (username), from list_pages.');
const positionShape = {
  parentId: z.string().optional().describe('Put it inside this container block (e.g. a collection). Omit for the top level.'),
  index: z.number().int().min(0).optional().describe('Position in that list, 0 = first. Omit to add at the end.'),
  beforeId: z.string().optional().describe('Place right before this block (any level).'),
  afterId: z.string().optional().describe('Place right after this block (any level).'),
};
const anyObject = z.record(z.string(), z.any());

/** What PUT /api/pages/:id takes. */
const editable = (p) => ({ slug: p.slug, profile: p.profile, socials: p.socials, blocks: p.blocks, design: p.design, settings: p.settings });

export function createOtrelinkServer({ client, name = 'otrelink', version = '1.0.0' } = {}) {
  const api = client || createClient({ baseUrl: process.env.OTRELINK_URL, token: process.env.OTRELINK_TOKEN });
  const server = new McpServer({ name, version }, { instructions: SERVER_INSTRUCTIONS });

  // The account (plan, page URL) is read once and refreshed when the plan may have changed.
  let account = null;
  const getAccount = async (fresh = false) => {
    if (!account || fresh) account = await api.me();
    return account;
  };
  const plan = async () => (await getAccount()).user.plan;
  const publicUrl = async (slug) => {
    const base = (await getAccount()).pageUrl;
    return base ? `${String(base).replace(/\/+$/, '')}/${slug}` : undefined;
  };

  async function resolvePage(ref) {
    const r = String(ref).trim().replace(/^@/, '');
    if (/^[0-9a-f-]{20,}$/i.test(r)) {
      try { return await api.getPage(r); } catch (err) { if (err.code !== 'page_not_found') throw err; }
    }
    // The page list already has whole pages: one request instead of two.
    const pages = await api.listPages();
    const hit = pages.find((p) => p.id === r || p.slug === r.toLowerCase());
    if (!hit) throw new OtrelinkError(404, 'page_not_found');
    return hit;
  }

  /** Load a page, change it, save it; returns the saved page. */
  async function editPage(ref, change) {
    const page = await resolvePage(ref);
    const extra = await change(page);
    const saved = await api.savePage(page.id, editable(page));
    return { page: saved, extra };
  }

  async function pageReport(p, note) {
    const url = await publicUrl(p.slug);
    const lines = [
      note,
      `Page "${p.profile?.title || p.slug}" · slug ${p.slug} · id ${p.id} · ${p.settings?.published === false ? 'NOT published' : 'published'}${url ? ` · ${url}` : ''}`,
      `Theme: ${p.design?.theme || 'custom'} · ${p.blocks?.length || 0} top-level blocks`,
      ...(p.blocks?.length ? ['', ...outline(p.blocks)] : ['', '(no blocks yet)']),
    ].filter((l) => l !== undefined);
    return lines.join('\n');
  }

  /** Run a tool; turn errors into a readable tool error. */
  const run = (fn) => async (args) => {
    try {
      return await fn(args || {});
    } catch (err) {
      if (err instanceof OtrelinkError) {
        if (['api_not_in_plan', 'plan_required'].includes(err.code)) account = null;
        return fail(err.code === 'network_error' ? err.data.message : err.message);
      }
      return fail(err?.message || String(err));
    }
  };

  const tool = (toolName, config, fn) => server.registerTool(toolName, config, run(fn));
  const READ = { readOnlyHint: true, openWorldHint: false };
  const WRITE = { readOnlyHint: false, destructiveHint: false, openWorldHint: false };

  // ── Account & catalog ───────────────────────────────────────
  tool('get_account', {
    title: 'Account',
    description: 'Who the token belongs to, their plan, page limit, which plan features are on, and where public pages live.',
    inputSchema: {},
    annotations: READ,
  }, async () => {
    const a = await getAccount(true);
    const pages = await api.listPages();
    const p = a.user.plan;
    return json({
      email: a.user.email, name: a.user.name,
      plan: p.label, pages: `${pages.length} of ${p.maxPages}`,
      featuresOn: Object.keys(p.features).filter((k) => p.features[k]),
      featuresOff: Object.keys(p.features).filter((k) => !p.features[k]),
      tokenScope: a.user.auth?.scope,
      publicPagesAt: a.pageUrl,
    });
  });

  tool('list_block_types', {
    title: 'List block types',
    description: 'Every block type (link, text, catalog, events…) with its category and whether the plan allows it. Call get_block_type for the fields.',
    inputSchema: { category: z.string().optional().describe('Only this category, e.g. "Essentials".') },
    annotations: READ,
  }, async ({ category }) => json(listBlockTypes(await plan(), category)));

  tool('get_block_type', {
    title: 'Block type details',
    description: 'All fields of a block type (keys, types, options, defaults, which are required), its style groups and the options every block has.',
    inputSchema: { type: z.string().describe('Block type, e.g. "link", "catalog", "events".') },
    annotations: READ,
  }, async ({ type }) => {
    const mod = blockTypes.get(type);
    if (!mod) return fail(`Unknown block type "${type}". Use list_block_types.`);
    return json({ ...blockTypeDetail(mod, await plan()), blockOptions: blockOptionFields() });
  });

  tool('list_themes', {
    title: 'List themes',
    description: 'Theme presets (colors, fonts, button style) to use with set_theme.',
    inputSchema: {},
    annotations: READ,
  }, async () => json(listThemes()));

  tool('list_templates', {
    title: 'List templates',
    description: 'Ready-made pages (restaurant, food truck, musician, business card…) to start from with create_page.',
    inputSchema: { category: z.string().optional().describe(`One of: ${templateCategories().join(', ')}.`) },
    annotations: READ,
  }, async ({ category }) => json(listTemplates(category)));

  tool('get_design_options', {
    title: 'Design options',
    description: 'Every design key for update_design (colors, fonts, buttons, cards, accent, layout), background types, plus profile, settings and social platforms for update_page.',
    inputSchema: {},
    annotations: READ,
  }, async () => json({ design: designOptions(), profile: profileOptions(), settings: settingsOptions(), socialPlatforms: socialPlatforms() }));

  // ── Pages ───────────────────────────────────────────────────
  tool('list_pages', {
    title: 'List pages',
    description: 'The owner’s pages: id, slug, title, published, number of blocks, public URL.',
    inputSchema: {},
    annotations: READ,
  }, async () => {
    const pages = await api.listPages();
    return json(await Promise.all(pages.map(async (p) => ({
      id: p.id, slug: p.slug, title: p.profile?.title || '', published: p.settings?.published !== false,
      blocks: p.blocks?.length || 0, theme: p.design?.theme, updatedAt: p.updatedAt, url: await publicUrl(p.slug),
    }))));
  });

  tool('get_page', {
    title: 'Get page',
    description: 'A page with its block outline (ids, types, titles). format "json" returns the full page: profile, socials, blocks with all data, design and settings.',
    inputSchema: { page: pageRef, format: z.enum(['outline', 'json']).optional().describe('Default "outline".') },
    annotations: READ,
  }, async ({ page, format = 'outline' }) => {
    const p = await resolvePage(page);
    if (format === 'json') return json({ ...editable(p), id: p.id, url: await publicUrl(p.slug), today: p.today });
    return text(await pageReport(p, `Bio: ${p.profile?.bio || '(empty)'} · socials: ${(p.socials || []).map((s) => s.platform).join(', ') || 'none'}`));
  });

  tool('create_page', {
    title: 'Create page',
    description: 'Create a page, empty or from a template (list_templates). The slug is the public username.',
    inputSchema: {
      slug: z.string().describe('Public username: 3–30 chars, a–z 0–9 . _ -'),
      title: z.string().max(60).optional().describe('Page title (empty pages only; templates bring their own, change it with update_page).'),
      template: z.string().optional().describe('Template id, e.g. "tacotruck", "businesscard".'),
    },
    annotations: WRITE,
  }, async ({ slug, title, template }) => {
    const clean = sanitizeSlug(slug);
    if (!clean) return fail('Invalid slug: 3–30 characters (a–z, 0–9, dot, dash, underscore), not starting or ending with a symbol, and not a reserved word.');
    if (template && !TEMPLATES.some((t) => t.id === template)) return fail(`Unknown template "${template}". Use list_templates.`);
    const page = await api.createPage({ slug: clean, title, template });
    return text(await pageReport(page, `Created${template ? ` from the "${template}" template` : ''}.`));
  });

  tool('update_page', {
    title: 'Update page',
    description: 'Change a page’s slug, profile (title, bio, avatar URL, verified), social icons or settings (published, navigation menu, language, translate button, SEO…). Only what you send changes; socials replaces the whole list.',
    inputSchema: {
      page: pageRef,
      slug: z.string().optional().describe('New public username.'),
      profile: z.object({
        title: z.string().optional(), bio: z.string().optional(), avatar: z.string().optional().describe('Image URL (upload_file for local files).'), verified: z.boolean().optional(),
      }).optional(),
      socials: z.array(z.object({ platform: z.string().describe('e.g. instagram, tiktok, whatsapp, email, phone, website…'), url: z.string() })).optional()
        .describe('Replaces all social icons, in this order. Platforms: see get_design_options → socialPlatforms.'),
      settings: anyObject.optional().describe('Keys from get_design_options → settings, e.g. { navMenu: true, language: "es" }.'),
    },
    annotations: WRITE,
  }, async ({ page, slug, profile, socials: list, settings }) => {
    const warnings = [];
    const { page: saved } = await editPage(page, (p) => {
      if (slug !== undefined) {
        const clean = sanitizeSlug(slug);
        if (!clean) throw new Error('Invalid slug.');
        p.slug = clean;
      }
      if (profile) p.profile = { ...p.profile, ...profile };
      if (list) {
        const unknown = list.filter((s) => !socials.has(s.platform)).map((s) => s.platform);
        if (unknown.length) warnings.push(`Unknown platforms ignored: ${unknown.join(', ')}.`);
        p.socials = list.filter((s) => socials.has(s.platform)).map((s, i) => ({ id: p.socials?.[i]?.id || `s${Date.now().toString(36)}${i}`, platform: s.platform, url: s.url }));
      }
      if (settings) p.settings = { ...p.settings, ...settings };
    });
    return text(await pageReport(saved, ['Saved.', ...warnings].join(' ')));
  });

  tool('publish_page', {
    title: 'Publish / unpublish page',
    description: 'Make a page public (published: true) or hide it (false).',
    inputSchema: { page: pageRef, published: z.boolean() },
    annotations: WRITE,
  }, async ({ page, published }) => {
    const { page: saved } = await editPage(page, (p) => { p.settings = { ...p.settings, published }; });
    return text(`${published ? 'Published' : 'Hidden'}: ${saved.slug}${published ? ` → ${await publicUrl(saved.slug) || ''}` : ''}`);
  });

  tool('delete_page', {
    title: 'Delete page',
    description: 'Delete a page forever, with its analytics, orders, reviews, loyalty cards and invoices. Ask the owner first.',
    inputSchema: { page: pageRef, confirm: z.literal(true).describe('Must be true: the owner confirmed.') },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
  }, async ({ page }) => {
    const p = await resolvePage(page);
    await api.deletePage(p.id);
    return text(`Deleted page ${p.slug} (${p.id}).`);
  });

  tool('check_slug', {
    title: 'Check slug',
    description: 'Whether a public username (slug) is valid and free.',
    inputSchema: { slug: z.string() },
    annotations: READ,
  }, async ({ slug }) => json(await api.checkSlug(slug)));

  // ── Blocks ──────────────────────────────────────────────────
  tool('add_block', {
    title: 'Add block',
    description: 'Add a block to a page. Get the fields first with get_block_type; missing fields take their defaults. Lists (FAQ items, products, events…) are arrays of objects.',
    inputSchema: {
      page: pageRef,
      type: z.string().describe('Block type from list_block_types.'),
      data: anyObject.optional().describe('Block fields, e.g. { title: "My shop", url: "https://…" }.'),
      options: anyObject.optional().describe('Block options: style (stButtonColor, stAccentColor…), animation, showFrom/showUntil, navLabel.'),
      enabled: z.boolean().optional().describe('false = added but hidden.'),
      sampleChildren: z.boolean().optional().describe('Containers only: keep the sample blocks the dashboard adds (default false = start empty).'),
      ...positionShape,
    },
    annotations: WRITE,
  }, async ({ page, type, data, options, enabled, sampleChildren, ...position }) => {
    const mod = blockTypes.get(type);
    if (!mod) return fail(`Unknown block type "${type}". Use list_block_types.`);
    if (!allowsBlock(await plan(), type)) return fail(`The plan doesn’t include the "${type}" block (feature "${featureForBlock(type)}").`);
    let built;
    const { page: saved } = await editPage(page, (p) => {
      built = buildBlock(type, data, options);
      if (enabled === false) built.block.enabled = false;
      if (built.block.children && !sampleChildren) built.block.children = [];
      insertBlock(p.blocks, built.block, position);
    });
    return text(await pageReport(saved, [`Added [${type}] id=${built.block.id}.`, ...built.warnings].join(' ')));
  });

  tool('update_block', {
    title: 'Update block',
    description: 'Change fields of a block. data is merged into the current data (send a whole array to replace a list such as products or FAQ items). options merges the block options. Use get_page format "json" to see current values.',
    inputSchema: {
      page: pageRef,
      blockId: z.string(),
      data: anyObject.optional(),
      options: anyObject.optional().describe('Style / animation / schedule options; "" resets a style to the page value.'),
      enabled: z.boolean().optional().describe('false hides the block, true shows it.'),
    },
    annotations: WRITE,
  }, async ({ page, blockId, data, options, enabled }) => {
    let warnings = [];
    let type;
    const { page: saved } = await editPage(page, (p) => {
      const hit = findBlock(p.blocks, blockId);
      if (!hit) throw new Error(`Block "${blockId}" not found. Use get_page for ids.`);
      const b = hit.block;
      type = b.type;
      const next = { ...b, data: { ...b.data, ...(data || {}) }, options: { ...b.options, ...(options || {}) } };
      if (enabled !== undefined) next.enabled = enabled;
      const checked = checkBlock(next, data, options);
      warnings = checked.warnings;
      hit.list[hit.index] = { ...checked.block, ...(b.children ? { children: b.children } : {}) };
    });
    return text(await pageReport(saved, [`Updated [${type}] id=${blockId}.`, ...warnings].join(' ')));
  });

  tool('move_block', {
    title: 'Move block',
    description: 'Move a block: to a position (index), next to another block (beforeId / afterId), into a container (parentId) or back to the top level (toTop: true).',
    inputSchema: {
      page: pageRef,
      blockId: z.string(),
      toTop: z.boolean().optional().describe('Move out of a container to the top level.'),
      ...positionShape,
    },
    annotations: WRITE,
  }, async ({ page, blockId, toTop, ...position }) => {
    const { page: saved } = await editPage(page, (p) => {
      const hit = findBlock(p.blocks, blockId);
      if (!hit) throw new Error(`Block "${blockId}" not found.`);
      // Without a target list, keep it in the list it is in.
      const pos = { ...position };
      if (!pos.beforeId && !pos.afterId && !pos.parentId && !toTop && hit.parent) pos.parentId = hit.parent.id;
      moveBlock(p.blocks, blockId, pos);
    });
    return text(await pageReport(saved, `Moved ${blockId}.`));
  });

  tool('remove_block', {
    title: 'Remove block',
    description: 'Delete a block (and the blocks inside it, for containers).',
    inputSchema: { page: pageRef, blockId: z.string() },
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  }, async ({ page, blockId }) => {
    let removed;
    const { page: saved } = await editPage(page, (p) => { removed = removeBlock(p.blocks, blockId); });
    return text(await pageReport(saved, `Removed [${removed.type}] ${blockId}.`));
  });

  tool('duplicate_block', {
    title: 'Duplicate block',
    description: 'Copy a block (with its children) right after the original.',
    inputSchema: { page: pageRef, blockId: z.string() },
    annotations: WRITE,
  }, async ({ page, blockId }) => {
    let copy;
    const { page: saved } = await editPage(page, (p) => {
      const hit = findBlock(p.blocks, blockId);
      if (!hit) throw new Error(`Block "${blockId}" not found.`);
      copy = cloneBlock(hit.block);
      hit.list.splice(hit.index + 1, 0, copy);
    });
    return text(await pageReport(saved, `Duplicated ${blockId} → id=${copy.id}.`));
  });

  // ── Design ──────────────────────────────────────────────────
  tool('set_theme', {
    title: 'Set theme',
    description: 'Apply a theme preset (list_themes). It resets colors, fonts, buttons and background to the theme; custom CSS and the entrance animation are kept.',
    inputSchema: { page: pageRef, theme: z.string() },
    annotations: WRITE,
  }, async ({ page, theme }) => {
    const t = themes.get(theme);
    if (!t) return fail(`Unknown theme "${theme}". Use list_themes.`);
    const wp = t.design?.wallpaper?.type;
    if (wp && !allowsWallpaper(await plan(), wp)) return fail(`The plan doesn’t include "${wp}" backgrounds (feature "${featureForWallpaper(wp)}").`);
    const { page: saved } = await editPage(page, (p) => { p.design = applyTheme(p.design || {}, theme); });
    return text(`Theme "${t.label}" applied to ${saved.slug}.`);
  });

  tool('update_design', {
    title: 'Update design',
    description: 'Change design values, e.g. { buttonColor: "#ff6b35", titleFont: "playfair", accentColor: "#e11d48", wallpaper: { type: "gradient", from: "#000", to: "#333" } }. Keys: get_design_options. Only what you send changes.',
    inputSchema: { page: pageRef, design: anyObject },
    annotations: WRITE,
  }, async ({ page, design }) => {
    const known = new Set([...designFields.map((f) => f.key), 'wallpaper', 'customCss']);
    const unknown = Object.keys(design).filter((k) => !known.has(k));
    const wpType = design.wallpaper?.type;
    if (wpType && !allowsWallpaper(await plan(), wpType)) return fail(`The plan doesn’t include "${wpType}" backgrounds (feature "${featureForWallpaper(wpType)}").`);
    const { page: saved } = await editPage(page, (p) => {
      const cur = p.design || {};
      const { wallpaper, ...rest } = design;
      let nextWp = cur.wallpaper;
      if (wallpaper && typeof wallpaper === 'object') {
        nextWp = wallpaper.type && wallpaper.type !== cur.wallpaper?.type ? wallpaper : { ...cur.wallpaper, ...wallpaper };
      }
      const clean = Object.fromEntries(Object.entries(rest).filter(([k]) => known.has(k)));
      p.design = { ...cur, ...clean, wallpaper: nextWp };
    });
    const d = saved.design;
    const changed = Object.keys(design).filter((k) => known.has(k));
    return json(Object.fromEntries(changed.map((k) => [k, d[k]])), [`Design saved on ${saved.slug}.`, unknown.length ? `Ignored unknown keys: ${unknown.join(', ')}.` : ''].filter(Boolean).join(' '));
  });

  // ── Business ────────────────────────────────────────────────
  tool('get_analytics', {
    title: 'Page analytics',
    description: 'Visits, unique visitors, clicks, click rate, daily series, top links, countries and devices for the last N days.',
    inputSchema: { page: pageRef, days: z.number().int().min(1).max(365).optional().describe('Default 30.'), timezone: z.string().optional().describe('IANA time zone for hours/weekdays, e.g. America/Caracas.') },
    annotations: READ,
  }, async ({ page, days = 30, timezone }) => {
    const p = await resolvePage(page);
    const a = await api.analytics(p.id, { days, tz: timezone });
    // Keep it short: one line per day, and only the busiest hours / weekdays.
    if (Array.isArray(a.series)) a.series = a.series.map((s) => `${s.date}: ${s.views} visits, ${s.clicks} clicks`);
    for (const [key, labels] of [['hours', (i) => `${String(i).padStart(2, '0')}:00`], ['weekdays', (i) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i] || i]]) {
      const v = a[key]?.views;
      if (Array.isArray(v)) {
        a[key] = v.map((n, i) => [labels(i), n]).filter(([, n]) => n > 0).sort((x, y) => y[1] - x[1]).slice(0, 5).map(([l, n]) => `${l}: ${n} visits`);
      }
    }
    return json(a, `Analytics of ${p.slug}, last ${days} days.`);
  });

  tool('list_orders', {
    title: 'List pickup orders',
    description: 'Pickup orders of a page (Catalog block with pickup ordering). scope "active" = new, accepted and ready; "done" = picked up or cancelled. Read only.',
    inputSchema: { page: pageRef, scope: z.enum(['active', 'done']).optional() },
    annotations: READ,
  }, async ({ page, scope = 'active' }) => {
    const p = await resolvePage(page);
    const orders = await api.listOrders(p.id, scope);
    return json(orders, `${orders.length} ${scope} order(s) on ${p.slug}.`);
  });

  tool('get_today', {
    title: 'Get “Today”',
    description: 'The page’s live state: open/closed override, where the food truck is today, note, sold-out products (with product keys) and whether orders are paused.',
    inputSchema: { page: pageRef },
    annotations: READ,
  }, async ({ page }) => {
    const p = await resolvePage(page);
    const products = blocksOfType(p.blocks, 'catalog').flatMap((b) => (b.data.products || []).map((x) => ({ key: productKey(b.id, x.id), name: x.name })));
    return json({ today: await api.getToday(p.id), products });
  });

  tool('update_today', {
    title: 'Update “Today”',
    description: 'Change the live state right away (no page save needed): open/closed, today’s location, a note, sold-out products, pausing orders. Only what you send changes.',
    inputSchema: {
      page: pageRef,
      status: z.enum(['auto', 'open', 'closed']).optional().describe('"auto" follows the opening hours.'),
      place: z.string().max(80).optional().describe('Name of today’s spot, e.g. "Downtown plaza".'),
      address: z.string().max(200).optional(),
      lat: z.number().min(-90).max(90).nullable().optional(),
      lon: z.number().min(-180).max(180).nullable().optional(),
      until: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).or(z.literal('')).optional().describe('"HH:MM" — there until this time.'),
      note: z.string().max(160).optional(),
      soldOut: z.array(z.string()).optional().describe('Product keys from get_today (replaces the list).'),
      ordersPaused: z.boolean().optional(),
    },
    annotations: WRITE,
  }, async ({ page, ...patch }) => {
    const p = await resolvePage(page);
    const today = await api.updateToday(p.id, patch);
    return json(today, `“Today” updated on ${p.slug}.`);
  });

  // ── Files ───────────────────────────────────────────────────
  tool('upload_file', {
    title: 'Upload file',
    description: 'Upload a local image (PNG, JPG, WebP, GIF, AVIF) or PDF from this computer and get its URL, for avatars, thumbnails, galleries or PDF blocks.',
    inputSchema: { path: z.string().describe('Absolute path of the file on this computer.') },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  }, async ({ path }) => json(await api.uploadFile(path), 'Uploaded. Use this url in block or profile fields.'));

  return server;
}
