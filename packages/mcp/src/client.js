// Small client for the Otrelink API, authenticated with a personal API token
// (dashboard → API, Business plan). Every call acts as the token's owner.
import fs from 'node:fs/promises';
import path from 'node:path';

/** Readable messages for the API's error codes. */
const MESSAGES = {
  invalid_token: 'The API token is not valid. Create one in Otrelink → API and set OTRELINK_TOKEN.',
  token_expired: 'The API token expired. Create a new one in Otrelink → API.',
  token_read_only: 'This API token is read-only. Create a "Read & write" token to make changes.',
  token_route_not_allowed: 'API tokens can’t do this; it needs the Otrelink dashboard.',
  api_not_in_plan: 'API access is part of the Business plan (or it was turned off for this account).',
  unauthorized: 'Not signed in: check OTRELINK_TOKEN.',
  email_not_verified: 'The account’s email is not confirmed yet.',
  page_not_found: 'Page not found (or it belongs to another account).',
  page_limit: 'The plan’s page limit was reached.',
  slug_taken: 'That username (slug) is already taken.',
  invalid_slug: 'Invalid slug: 3–30 characters, a–z, 0–9, dot, dash or underscore, not starting or ending with a symbol.',
  plan_required: 'The plan doesn’t include this block or background.',
  too_many_requests: 'Too many requests (120 per minute per token). Wait a moment and try again.',
  unsupported_type: 'Unsupported file type (images: PNG, JPG, WebP, GIF, AVIF; or PDF).',
  file_too_large: 'The file is too large.',
};

export class OtrelinkError extends Error {
  constructor(status, code, data = {}) {
    const base = MESSAGES[code] || `Otrelink API error: ${code}`;
    super(data.limit ? `${base} (limit: ${data.limit})` : base);
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif', '.pdf': 'application/pdf' };

export function createClient({ baseUrl, token, fetch: doFetch = globalThis.fetch } = {}) {
  if (!baseUrl) throw new Error('OTRELINK_URL is not set (e.g. https://otrelink.example.com).');
  if (!token) throw new Error('OTRELINK_TOKEN is not set. Create a token in Otrelink → API (Business plan).');
  const root = String(baseUrl).replace(/\/+$/, '');

  async function call(method, pathname, { body, query, form } = {}) {
    const url = new URL(root + pathname);
    for (const [k, v] of Object.entries(query || {})) if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    let res;
    try {
      res = await doFetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
        body: form || (body ? JSON.stringify(body) : undefined),
      });
    } catch (err) {
      throw new OtrelinkError(0, 'network_error', { message: `Can’t reach ${root}: ${err.message}` });
    }
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new OtrelinkError(res.status, data?.error || `http_${res.status}`, data || {});
    return data;
  }

  return {
    baseUrl: root,
    me: () => call('GET', '/api/auth/me'),
    listPages: async () => (await call('GET', '/api/pages')).pages,
    getPage: async (id) => (await call('GET', `/api/pages/${encodeURIComponent(id)}`)).page,
    createPage: async ({ slug, title, template }) => (await call('POST', '/api/pages', { body: { slug, title, template } })).page,
    savePage: async (id, page) => (await call('PUT', `/api/pages/${encodeURIComponent(id)}`, { body: page })).page,
    deletePage: (id) => call('DELETE', `/api/pages/${encodeURIComponent(id)}`),
    checkSlug: (slug) => call('GET', '/api/slug-check', { query: { slug } }),
    getToday: async (id) => (await call('GET', `/api/pages/${encodeURIComponent(id)}/today`)).today,
    updateToday: async (id, patch) => (await call('PATCH', `/api/pages/${encodeURIComponent(id)}/today`, { body: patch })).today,
    analytics: (id, { days, tz } = {}) => call('GET', `/api/pages/${encodeURIComponent(id)}/analytics`, { query: { days, tz } }),
    listOrders: async (pageId, scope = 'active') => (await call('GET', '/api/orders', { query: { pageId, scope } })).orders,
    /** Upload a local file (image or PDF). → { url, … } */
    async uploadFile(filePath) {
      const ext = path.extname(filePath).toLowerCase();
      const type = MIME[ext];
      if (!type) throw new OtrelinkError(415, 'unsupported_type');
      const bytes = await fs.readFile(filePath);
      const form = new FormData();
      form.append('file', new Blob([bytes], { type }), path.basename(filePath));
      return call('POST', '/api/assets', { form });
    },
  };
}
