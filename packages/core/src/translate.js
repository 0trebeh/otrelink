// Second language for a page, written by its owner (no machine translation).
//
// The page is written in settings.language (en | es). With settings.translateButton
// on, the owner can also write the texts in the other language; visitors switch
// with the ES / EN button. Texts left empty show the original.
//
//   page.translations = {
//     es: {
//       profile:  { title, bio },
//       settings: { seoTitle, seoDescription, sensitiveMessage },
//       blocks:   { [blockId]: { title: '…', items: { [itemId]: { question: '…' } } } },
//     },
//   }
//
// Only text and textarea fields are translated (not URLs, prices as numbers,
// colors…). A field can opt out with `translate: false`; private fields never are.

import { blockTypes } from './blocks/index.js';
import { fieldTypes } from './fields.js';

export const PAGE_LANGUAGES = {
  en: { label: 'English', short: 'EN' },
  es: { label: 'Español', short: 'ES' },
};

/** Language a page is written in. */
export const pageLanguage = (page) => (PAGE_LANGUAGES[page?.settings?.language] ? page.settings.language : 'en');
/** The other language the switch offers. */
export const otherLanguage = (lang) => (lang === 'es' ? 'en' : 'es');
/** Whether the page has a second language. */
export const hasSecondLanguage = (page) => Boolean(page?.settings?.translateButton);

/** Profile and settings fields that can be translated. */
export const PROFILE_TRANSLATABLE = ['title', 'bio'];
export const SETTINGS_TRANSLATABLE = ['seoTitle', 'seoDescription', 'sensitiveMessage'];

const TEXT_TYPES = new Set(['text', 'textarea']);

/**
 * The fields of a list that can be translated. List fields come back with only
 * their translatable sub-fields (and are left out when they have none).
 */
export function translatableFields(fields = []) {
  const out = [];
  for (const f of fields) {
    if (f.translate === false || f.private) continue;
    if (TEXT_TYPES.has(f.type)) out.push(f);
    else if (f.type === 'list') {
      const sub = translatableFields(f.fields || []);
      if (sub.length) out.push({ ...f, fields: sub });
    }
  }
  return out;
}

const cleanText = (f, v) => {
  if (typeof v !== 'string') return '';
  const s = fieldTypes[f.type].sanitize(v, f);
  return typeof s === 'string' ? s : '';
};

/** Clean one block's translation against its fields and current data. */
function sanitizeBlockTranslation(block, input) {
  const mod = blockTypes.get(block.type);
  if (!mod || !input || typeof input !== 'object') return null;
  const out = {};
  for (const f of translatableFields(mod.fields)) {
    const v = input[f.key];
    if (f.type === 'list') {
      const items = Array.isArray(block.data?.[f.key]) ? block.data[f.key] : [];
      const map = {};
      for (const item of items) {
        const t = v && typeof v === 'object' ? v[item.id] : null;
        if (!t || typeof t !== 'object') continue;
        const row = {};
        for (const sf of f.fields) { const s = cleanText(sf, t[sf.key]); if (s) row[sf.key] = s; }
        if (Object.keys(row).length) map[item.id] = row;
      }
      if (Object.keys(map).length) out[f.key] = map;
    } else {
      const s = cleanText(f, v);
      if (s) out[f.key] = s;
    }
  }
  return Object.keys(out).length ? out : null;
}

const pickTexts = (fields, keys, input) => {
  const out = {};
  for (const k of keys) {
    const f = fields.find((x) => x.key === k);
    const s = f ? cleanText(f, input?.[k]) : '';
    if (s) out[k] = s;
  }
  return out;
};

/**
 * Clean the translations of a page: only the other language, only blocks and
 * list items that exist, only translatable fields, no empty strings.
 * `profileFields` / `settingsFields` come from page.js (avoids a circular import).
 */
export function sanitizeTranslations(input, { blocks = [], language = 'en', profileFields = [], settingsFields = [] } = {}) {
  if (!input || typeof input !== 'object') return {};
  const lang = otherLanguage(PAGE_LANGUAGES[language] ? language : 'en');
  const src = input[lang];
  if (!src || typeof src !== 'object') return {};
  const out = {};
  const profile = pickTexts(profileFields, PROFILE_TRANSLATABLE, src.profile);
  const settings = pickTexts(settingsFields, SETTINGS_TRANSLATABLE, src.settings);
  if (Object.keys(profile).length) out.profile = profile;
  if (Object.keys(settings).length) out.settings = settings;
  const tb = {};
  const walk = (list) => {
    for (const b of list || []) {
      const t = sanitizeBlockTranslation(b, src.blocks?.[b.id]);
      if (t) tb[b.id] = t;
      if (Array.isArray(b.children)) walk(b.children);
    }
  };
  walk(blocks);
  if (Object.keys(tb).length) out.blocks = tb;
  return Object.keys(out).length ? { [lang]: out } : {};
}

/** Keep only the translations of blocks that are still in `blocks` (e.g. after hiding some). */
export function pruneTranslations(translations, blocks = []) {
  if (!translations || typeof translations !== 'object') return {};
  const ids = new Set();
  const walk = (list) => { for (const b of list || []) { ids.add(b.id); walk(b.children); } };
  walk(blocks);
  const out = {};
  for (const [lang, t] of Object.entries(translations)) {
    const tb = Object.fromEntries(Object.entries(t?.blocks || {}).filter(([id]) => ids.has(id)));
    out[lang] = { ...t, blocks: tb };
  }
  return out;
}

const overlay = (base, t) => {
  if (!t) return base;
  const next = { ...base };
  for (const [k, v] of Object.entries(t)) if (typeof v === 'string' && v) next[k] = v;
  return next;
};

/** A translated text, through the field's own `localize(original, translated)` when it has one. */
const textFor = (f, orig, tr) => (typeof tr === 'string' && tr ? (f.localize ? f.localize(orig, tr) : tr) : orig);

/** Block data with the translated texts in place of the original ones. */
function localizeData(block, t) {
  const mod = blockTypes.get(block.type);
  if (!t || !mod) return block.data;
  const data = { ...block.data };
  for (const f of translatableFields(mod.fields)) {
    const v = t[f.key];
    if (f.type === 'list') {
      if (v && typeof v === 'object' && Array.isArray(data[f.key])) {
        data[f.key] = data[f.key].map((item) => {
          const tr = v[item.id];
          if (!tr) return item;
          const next = { ...item };
          for (const sf of f.fields) next[sf.key] = textFor(sf, item[sf.key], tr[sf.key]);
          return next;
        });
      }
    } else data[f.key] = textFor(f, data[f.key], v);
  }
  return data;
}

/**
 * The page as visitors see it in `lang`: translated texts replace the original
 * ones (empty translations keep the original). The original language, or a
 * page without a second language, comes back unchanged.
 */
export function localizePage(page, lang) {
  if (!page || !lang || lang === pageLanguage(page) || !hasSecondLanguage(page)) return page;
  const t = page.translations?.[lang];
  const blocks = (list) => (list || []).map((b) => {
    const bt = t?.blocks?.[b.id];
    const next = bt ? { ...b, data: localizeData(b, bt) } : b;
    return Array.isArray(b.children) ? { ...next, children: blocks(b.children) } : next;
  });
  return {
    ...page,
    profile: overlay(page.profile || {}, t?.profile),
    settings: { ...overlay(page.settings || {}, t?.settings), language: lang },
    blocks: blocks(page.blocks),
  };
}

/** The language to render: `wanted` if the page offers it, else its own language. */
export function resolveLanguage(page, wanted) {
  const source = pageLanguage(page);
  if (!hasSecondLanguage(page)) return source;
  return wanted === source || wanted === otherLanguage(source) ? wanted : source;
}

const storeKey = (page) => `ol-lang:${page?.slug || page?.id || ''}`;

/**
 * The language a visitor sees first: ?lang= in the URL, then the one they
 * picked before on this page, then their browser's language, else the page's own.
 */
export function pickLanguage(page, win = globalThis.window) {
  const source = pageLanguage(page);
  if (!hasSecondLanguage(page) || !win) return source;
  const other = otherLanguage(source);
  const ok = (l) => (l === source || l === other ? l : '');
  try {
    const q = ok(new URLSearchParams(win.location?.search || '').get('lang'));
    if (q) return q;
  } catch { /* ignore */ }
  try {
    const saved = ok(win.localStorage?.getItem(storeKey(page)));
    if (saved) return saved;
  } catch { /* storage blocked */ }
  for (const l of win.navigator?.languages || [win.navigator?.language]) {
    const base = String(l || '').slice(0, 2).toLowerCase();
    if (base === source) return source;
    if (base === other) return other;
  }
  return source;
}

/** Remember the visitor's choice for this page. */
export function rememberLanguage(page, lang, win = globalThis.window) {
  try { win?.localStorage?.setItem(storeKey(page), lang); } catch { /* storage blocked */ }
}

/**
 * How much of a page is translated: { done, total } over the texts that have
 * something written in the original language.
 */
export function translationProgress(page, lang = otherLanguage(pageLanguage(page))) {
  const t = page?.translations?.[lang] || {};
  let done = 0;
  let total = 0;
  const count = (orig, tr) => { if (String(orig || '').trim()) { total++; if (String(tr || '').trim()) done++; } };
  for (const k of PROFILE_TRANSLATABLE) count(page?.profile?.[k], t.profile?.[k]);
  const walk = (list) => {
    for (const b of list || []) {
      const r = blockTranslationProgress(b, t.blocks?.[b.id]);
      done += r.done; total += r.total;
      walk(b.children);
    }
  };
  walk(page?.blocks);
  return { done, total };
}

/** { done, total } for one block. */
export function blockTranslationProgress(block, t = {}) {
  const mod = blockTypes.get(block?.type);
  let done = 0;
  let total = 0;
  if (!mod) return { done, total };
  const count = (orig, tr) => { if (String(orig || '').trim()) { total++; if (String(tr || '').trim()) done++; } };
  for (const f of translatableFields(mod.fields)) {
    if (f.type === 'list') {
      for (const item of block.data?.[f.key] || []) for (const sf of f.fields) count(item[sf.key], t?.[f.key]?.[item.id]?.[sf.key]);
    } else count(block.data?.[f.key], t?.[f.key]);
  }
  return { done, total };
}
