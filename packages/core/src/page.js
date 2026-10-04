// The page document: shape, defaults and sanitizing.
//
// page = {
//   slug, profile: { title, bio, avatar, verified },
//   socials: [{ id, platform, url }],
//   blocks:  [{ id, type, enabled, data: {...}, options: { animation, showFrom, showUntil }, children?: [...] }],
//            (children only on container types such as Collection, nested up to MAX_DEPTH)
//   design:  { theme, ...design fields, wallpaper: { type, ...wallpaper fields } },
//   settings:{ published, seoTitle, seoDescription, ogImage, hideFooter, sensitive, sensitiveMessage }
// }

import { blockTypes, commonBlockFields } from './blocks/index.js';
import { socials } from './socials.js';
import { themes } from './themes.js';
import { defaultsFor, sanitizeFields } from './fields.js';
import { defaultDesign, resolveDesign, sanitizeDesign } from './design.js';
import { uid } from './util/html.js';
import { MAX_DEPTH } from './tree.js';

export const profileFields = [
  { key: 'title', type: 'text', label: 'Title', max: 60, default: '' },
  { key: 'bio', type: 'textarea', label: 'Bio', max: 300, default: '' },
  { key: 'avatar', type: 'image', label: 'Profile picture', default: '' },
  { key: 'verified', type: 'toggle', label: 'Show verified badge', default: false },
];

export const settingsFields = [
  { key: 'published', type: 'toggle', label: 'Page is public', default: true, help: 'When off, only you can see it in the dashboard.' },
  { key: 'seoTitle', type: 'text', label: 'SEO title', max: 70, help: 'Browser tab and search results. Defaults to your title.' },
  { key: 'seoDescription', type: 'textarea', label: 'SEO description', max: 200 },
  { key: 'ogImage', type: 'image', label: 'Sharing image', help: 'Shown when your link is shared on social media.' },
  { key: 'hideFooter', type: 'toggle', label: 'Hide “Made with Otrelink” footer', default: true },
  { key: 'sensitive', type: 'toggle', label: 'Sensitive content warning', default: false, help: 'Visitors must confirm before seeing the page.' },
  { key: 'sensitiveMessage', type: 'text', label: 'Warning message', default: 'This page may contain sensitive content.', showIf: { key: 'sensitive', truthy: true } },
];

export const RESERVED_SLUGS = new Set([
  'api', 'admin', 'dashboard', 'login', 'register', 'logout', 'settings', 'static', 'assets', 'public',
  'about', 'help', 'support', 'privacy', 'terms', 'www', 'app', 'otrelink', '_next', 'favicon.ico',
]);

/** Returns a clean slug or '' if invalid. */
export function sanitizeSlug(slug) {
  const s = String(slug || '').trim().toLowerCase().replace(/^@/, '').replace(/[^a-z0-9._-]/g, '');
  if (s.length < 3 || s.length > 30 || RESERVED_SLUGS.has(s) || /^[._-]|[._-]$/.test(s)) return '';
  return s;
}

/** A new block with default values. */
/** Block types that can hold other blocks (declared with `container: true`). */
export const isContainerType = (type) => Boolean(blockTypes.get(type)?.container);

/** A new block with default values. Containers may come with sample children. */
export function newBlock(type, data = {}) {
  const mod = blockTypes.get(type);
  if (!mod) throw new Error(`Unknown block type "${type}"`);
  const block = {
    id: uid('b'),
    type,
    enabled: true,
    data: { ...defaultsFor(mod.fields), ...data },
    options: defaultsFor(commonBlockFields),
  };
  if (mod.container) block.children = mod.defaultChildren ? mod.defaultChildren(newBlock) : [];
  return block;
}

/** Deep copy of a block with new ids (used by "Duplicate"). */
export function cloneBlock(block) {
  return {
    ...structuredClone(block),
    id: uid('b'),
    ...(block.children ? { children: block.children.map(cloneBlock) } : {}),
  };
}

const MAX_BLOCKS = 300;

/**
 * Sanitize one block (and its children, for containers).
 * `state.count` limits the total number of blocks in a page.
 */
export function sanitizeBlock(b, depth = 0, state = { count: 0 }) {
  if (!b || typeof b !== 'object' || state.count >= MAX_BLOCKS) return null;
  state.count++;
  const id = String(b.id || '').slice(0, 40) || uid('b');
  let mod = blockTypes.get(b.type);
  const options = sanitizeFields(commonBlockFields, b.options || {});
  if (!mod) {
    // Type was removed from the registry: keep the data untouched (hidden on the page)
    // so re-adding the module brings it back.
    const json = JSON.stringify({ data: b.data ?? {}, children: b.children });
    if (json.length > 50000) return null;
    const keep = JSON.parse(json);
    return { id, type: String(b.type).slice(0, 40), enabled: Boolean(b.enabled), data: keep.data, options, ...(keep.children ? { children: keep.children } : {}) };
  }
  // Modules can upgrade old data (e.g. collections that stored links in data.items).
  if (mod.migrate) b = mod.migrate(b, newBlock) || b;
  const block = { id, type: mod.type, enabled: b.enabled !== false, data: sanitizeFields(mod.fields, b.data || {}), options };
  if (mod.container) {
    const kids = Array.isArray(b.children) && depth < MAX_DEPTH - 1 ? b.children : [];
    block.children = kids.map((c) => sanitizeBlock(c, depth + 1, state)).filter(Boolean);
  }
  return block;
}

export function sanitizeSocials(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((s) => s && socials.has(s.platform))
    .slice(0, 30)
    .map((s) => ({ id: String(s.id || '').slice(0, 40) || uid('s'), platform: s.platform, url: String(s.url || '').trim().slice(0, 500) }));
}

/** Sanitize the whole block tree. */
export function sanitizeBlocks(blocks) {
  const state = { count: 0 };
  return (Array.isArray(blocks) ? blocks : []).map((b) => sanitizeBlock(b, 0, state)).filter(Boolean);
}

/** Sanitize the editable content of a page (everything except owner/slug/ids). */
export function sanitizePage(input = {}) {
  return {
    profile: sanitizeFields(profileFields, input.profile || {}),
    socials: sanitizeSocials(input.socials),
    blocks: sanitizeBlocks(input.blocks),
    design: sanitizeDesign(resolveDesign(input.design || {})),
    settings: sanitizeFields(settingsFields, input.settings || {}),
  };
}

/** Apply a theme: start from defaults, apply the theme preset, keep custom CSS. */
export function applyTheme(design, themeId) {
  const theme = themes.get(themeId);
  if (!theme) return design;
  const base = defaultDesign();
  return resolveDesign({
    ...base,
    ...theme.design,
    wallpaper: { ...theme.design.wallpaper },
    entrance: design.entrance ?? base.entrance,
    customCss: design.customCss ?? '',
    theme: theme.id,
  });
}

/** Content for a brand-new page. */
export function createDefaultPage({ slug, title }) {
  const design = applyTheme(defaultDesign(), 'air');
  return {
    slug,
    profile: { title: title || `@${slug}`, bio: 'Welcome to my page ✨', avatar: '', verified: false },
    socials: [],
    blocks: [
      newBlock('link', { title: 'My first link', url: 'https://example.com' }),
      newBlock('text', { text: 'Edit this page from your **Otrelink** dashboard.' }),
    ],
    design,
    settings: defaultsFor(settingsFields),
  };
}
