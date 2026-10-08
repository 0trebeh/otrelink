// Turn the @otrelink/core registries (block types, fields, themes, design
// options) into compact JSON an AI assistant can read. Everything is generated
// from the registries, so new blocks or themes show up here by themselves.
import {
  blockTypes, blockStyleFields, blockStyleGroups, commonBlockFields, fieldOptions, newBlock,
  featureForBlock, allowsBlock, themes, designGroups, wallpapers, buttonStyles, buttonHovers, fonts,
  platforms, templateList, TEMPLATE_CATEGORIES, PLAN_FEATURES, profileFields, settingsFields,
} from '@otrelink/core';

const MAX_OPTIONS = 40;

/** One field → { key, type, label, … } (only what helps to fill it in). */
export function describeField(f) {
  const out = { key: f.key, type: f.type };
  if (f.label) out.label = f.label;
  if (f.required) out.required = true;
  if (f.default !== undefined && f.default !== '' && !(Array.isArray(f.default) && !f.default.length)) out.default = f.default;
  if (f.help) out.help = f.help;
  if (f.placeholder) out.example = f.placeholder;
  for (const k of ['min', 'max', 'step', 'unit']) if (f[k] !== undefined) out[k] = f[k];
  if (f.allowEmpty) out.emptyMeans = 'use the page value';
  if (['select', 'choice', 'tags', 'font'].includes(f.type) || f.options) {
    const opts = fieldOptions(f);
    if (opts.length) {
      out.options = opts.slice(0, MAX_OPTIONS).map((o) => (o.label && o.label !== o.value ? `${o.value} (${o.label})` : o.value));
      if (opts.length > MAX_OPTIONS) out.moreOptions = opts.length - MAX_OPTIONS;
    }
  }
  if (f.showIf) out.onlyWhen = f.showIf;
  if (f.private) out.private = 'never shown to visitors';
  if (f.type === 'list' || f.type === 'weeklyHours') out.itemFields = (f.fields || []).map(describeField);
  if (f.type === 'weeklyHours') out.note = 'List of { day: mon…sun, from: "HH:MM", to: "HH:MM" }.';
  if (f.type === 'dateRules') out.note = 'List of { from: "YYYY-MM-DD", to, kind: closed|block|open, ranges: [{ from, to }], note }.';
  if (f.type === 'geoPoint') out.note = '{ lat, lon, query, label }.';
  if (f.type === 'image' || f.type === 'file') out.note = 'A URL. Upload local files with upload_file first.';
  if (f.type === 'date') out.note = '"YYYY-MM-DD".';
  if (f.type === 'time') out.note = '"HH:MM" (24 h).';
  if (f.type === 'datetime') out.note = 'ISO date-time.';
  if (f.type === 'color') out.note = '#rrggbb or #rrggbbaa.';
  return out;
}

/** Short entry for list_block_types. */
export function blockTypeSummary(mod, plan) {
  const feature = featureForBlock(mod.type);
  return {
    type: mod.type,
    label: mod.label,
    category: mod.category || 'Other',
    description: mod.description || '',
    ...(mod.container ? { container: true } : {}),
    ...(feature ? { planFeature: feature } : {}),
    ...(plan ? { available: allowsBlock(plan, mod.type) } : {}),
  };
}

/** Full entry for get_block_type: every field, styles and an example. */
export function blockTypeDetail(mod, plan) {
  const sample = newBlock(mod.type);
  return {
    ...blockTypeSummary(mod, plan),
    fields: mod.fields.map(describeField),
    ...(mod.container ? { children: 'Holds other blocks: add them with add_block and parentId = this block’s id.' } : {}),
    styleGroups: blockStyleGroups(sample),
    defaults: sample.data,
  };
}

export const listBlockTypes = (plan, category) => blockTypes.list()
  .filter((m) => !category || (m.category || 'Other').toLowerCase() === category.toLowerCase())
  .map((m) => blockTypeSummary(m, plan));

/** Options every block has (block.options): animation, schedule, menu label and per-block style. */
export const blockOptionFields = () => ({
  common: commonBlockFields.map(describeField),
  style: blockStyleFields.map((f) => ({ ...describeField(f), group: f.group })),
});

export const listThemes = () => themes.list().map((t) => {
  const d = t.design || {};
  const w = d.wallpaper || {};
  return {
    id: t.id,
    label: t.label,
    background: w.type === 'solid' ? w.color : `${w.type}${w.from ? ` ${w.from}→${w.to}` : ''}${w.bg ? ` ${w.bg}` : ''}`,
    buttons: `${d.buttonStyle || 'fill'} ${d.buttonColor || ''}`.trim(),
    fonts: [d.titleFont, d.bodyFont].filter(Boolean).join(' / '),
    dark: isDark(w.color || w.bg || w.to || w.from),
  };
});

function isDark(hex) {
  const h = String(hex || '').replace('#', '');
  if (!/^[0-9a-f]{6}/i.test(h)) return undefined;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

export const listTemplates = (category) => templateList()
  .filter((t) => !category || t.category.toLowerCase() === category.toLowerCase())
  .map((t) => ({ ...t }));

export const templateCategories = () => [...TEMPLATE_CATEGORIES];

/** Every design option, grouped like the dashboard's Style panel, plus backgrounds. */
export const designOptions = () => ({
  groups: designGroups.map((g) => ({ id: g.id, label: g.label, fields: g.fields.map(describeField) })),
  wallpaper: {
    note: 'design.wallpaper = { type, …fields of that type }. Changing the type resets its other fields.',
    types: wallpapers.list().map((w) => ({
      type: w.id, label: w.label, fields: (w.fields || []).map(describeField),
      ...(PLAN_FEATURES.mediaWallpaper.wallpapers.includes(w.id) ? { planFeature: 'mediaWallpaper' } : {}),
    })),
  },
  buttonStyles: buttonStyles.keys(),
  buttonHovers: buttonHovers.keys(),
  fonts: fonts.keys(),
});

export const profileOptions = () => profileFields.filter((f) => f.type !== 'imageAdjust').map(describeField);
export const settingsOptions = () => settingsFields.filter((f) => f.type !== 'imageAdjust').map(describeField);
export const socialPlatforms = () => platforms.map((p) => ({ id: p.id, label: p.label, example: p.placeholder }));
