// Field types: the schema language used by every module.
//
// A module declares its settings as a list of fields, e.g.
//   { key: 'url', type: 'url', label: 'URL', required: true }
// From that single declaration:
//   - the API sanitizes/validates the stored value (sanitize below)
//   - the dashboard auto-generates the editor input (apps/web/components/fields)
//
// Common field props:
//   key, type, label, help, placeholder, default, required,
//   showIf: { key, equals } | { key, in: [...] } | { key, truthy: true }
//
// To add a field type: add an entry here AND a React input with the same
// name in apps/web/components/fields/index.js.

import { safeUrl } from './util/html.js';

const str = (v) => (v === null || v === undefined ? '' : String(v));
const clamp = (n, min, max) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));

/** Field options can be a static array or a function (lazy registries). */
export function fieldOptions(field) {
  const opts = typeof field.options === 'function' ? field.options() : field.options || [];
  return opts.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
}

function normalizeUrl(value) {
  let v = str(value).trim();
  if (!v) return '';
  // "instagram.com/me" -> "https://instagram.com/me"
  if (!/^[a-z][a-z0-9+.-]*:/i.test(v) && !v.startsWith('/') && /^[^\s]+\.[^\s]+/.test(v)) v = 'https://' + v;
  return safeUrl(v);
}

export const fieldTypes = {
  text: {
    default: '',
    sanitize: (v, f) => str(v).replace(/[\r\n]+/g, ' ').trim().slice(0, f.max ?? 200),
  },
  textarea: {
    default: '',
    sanitize: (v, f) => str(v).replace(/\r\n/g, '\n').trim().slice(0, f.max ?? 2000),
  },
  code: {
    default: '',
    // Raw CSS. "<" is stripped so it can never close the <style> tag.
    sanitize: (v, f) => str(v).replace(/</g, '').replace(/@import/gi, '').slice(0, f.max ?? 10000),
  },
  url: {
    default: '',
    sanitize: (v) => normalizeUrl(v).slice(0, 2048),
  },
  image: {
    default: '',
    sanitize: (v) => {
      const u = normalizeUrl(v);
      return /^(https?:|\/)/.test(u) ? u.slice(0, 2048) : '';
    },
  },
  email: {
    default: '',
    sanitize: (v) => {
      const e = str(v).trim().slice(0, 254);
      return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(e) ? e : '';
    },
  },
  tel: {
    default: '',
    sanitize: (v) => str(v).replace(/[^\d+()\-\s]/g, '').trim().slice(0, 32),
  },
  number: {
    default: 0,
    sanitize: (v, f) => {
      const n = Number(v);
      return Number.isFinite(n) ? clamp(n, f.min, f.max) : f.default ?? 0;
    },
  },
  range: {
    default: 0,
    sanitize: (v, f) => {
      const n = Number(v);
      if (!Number.isFinite(n)) return f.default ?? f.min ?? 0;
      const step = f.step ?? 1;
      return clamp(Math.round(n / step) * step, f.min, f.max);
    },
  },
  toggle: {
    default: false,
    sanitize: (v) => v === true || v === 'true' || v === 1,
  },
  select: {
    default: '',
    sanitize: (v, f) => {
      const opts = fieldOptions(f).map((o) => o.value);
      return opts.includes(v) ? v : f.default ?? opts[0] ?? '';
    },
  },
  // Same as select but rendered as visual tiles in the dashboard.
  choice: {
    default: '',
    sanitize: (v, f) => fieldTypes.select.sanitize(v, f),
  },
  font: {
    default: 'inter',
    sanitize: (v, f) => fieldTypes.select.sanitize(v, f),
  },
  color: {
    default: '#000000',
    sanitize: (v, f) => {
      const c = str(v).trim();
      if (/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(c)) return c.toLowerCase();
      if (c === 'transparent') return c;
      return f.default ?? '#000000';
    },
  },
  datetime: {
    default: '',
    sanitize: (v) => {
      if (!v) return '';
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? '' : d.toISOString();
    },
  },
  // A repeatable group of sub-fields, e.g. accordion items or gallery images.
  list: {
    default: [],
    sanitize: (v, f) => {
      if (!Array.isArray(v)) return [];
      return v.slice(0, f.max ?? 50).map((item) => ({
        id: str(item?.id).slice(0, 40) || Math.random().toString(36).slice(2, 10),
        ...sanitizeFields(f.fields || [], item || {}),
      }));
    },
  },
};

export function fieldDefault(field) {
  if (field.default !== undefined) return structuredCloneSafe(field.default);
  const t = fieldTypes[field.type];
  return t ? structuredCloneSafe(t.default) : '';
}

function structuredCloneSafe(v) {
  return v && typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v;
}

/** Default values object for a list of fields. */
export function defaultsFor(fields) {
  const out = {};
  for (const f of fields) out[f.key] = fieldDefault(f);
  return out;
}

/** Sanitize an object against a list of fields. Unknown keys are dropped. */
export function sanitizeFields(fields, input = {}) {
  const out = {};
  for (const f of fields) {
    const type = fieldTypes[f.type];
    if (!type) continue;
    const raw = input[f.key];
    out[f.key] = raw === undefined ? fieldDefault(f) : type.sanitize(raw, f);
  }
  return out;
}

/** Returns a list of { key, message } for required fields that are empty. */
export function validateFields(fields, values = {}) {
  const errors = [];
  for (const f of fields) {
    if (!f.required || !isVisible(f, values)) continue;
    const v = values[f.key];
    if (v === '' || v === null || v === undefined || (Array.isArray(v) && !v.length)) {
      errors.push({ key: f.key, message: `${f.label || f.key} is required` });
    }
  }
  return errors;
}

/** Evaluate a field's showIf condition against current values. */
export function isVisible(field, values = {}) {
  const c = field.showIf;
  if (!c) return true;
  const v = values[c.key];
  if ('equals' in c) return v === c.equals;
  if ('notEquals' in c) return v !== c.notEquals;
  if (c.in) return c.in.includes(v);
  if (c.truthy) return Boolean(v);
  return true;
}
