'use client';
// Browser-side API helper.

export class ApiError extends Error {
  constructor(status, code, data = {}) { super(code); this.status = status; this.code = code; this.data = data; }
}

export async function api(path, { method = 'GET', body, form } = {}) {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: form || (body ? JSON.stringify(body) : undefined),
    credentials: 'same-origin',
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.error || 'request_failed', data || {});
  return data;
}

const MESSAGES = {
  invalid_email: 'Enter a valid email address.',
  weak_password: 'Use at least 8 characters for your password.',
  invalid_slug: 'Use 3–30 letters, numbers, dots, dashes or underscores.',
  email_taken: 'An account with this email already exists. Log in instead.',
  slug_taken: 'That username is taken. Try another one.',
  invalid_credentials: 'Email or password is incorrect.',
  too_many_requests: 'Too many attempts. Wait a minute and try again.',
  page_limit: 'You reached the maximum number of pages.',
  file_too_large: 'That image is larger than 3 MB.',
  unsupported_type: 'Upload a PNG, JPG, WebP, GIF or AVIF image.',
  unauthorized: 'Your session expired. Log in again.',
};

export function errorMessage(err) {
  if (err?.code === 'too_many_requests' && err.data?.retryAfter) {
    const min = Math.ceil(err.data.retryAfter / 60);
    return `Too many attempts. Try again in ${min} minute${min === 1 ? '' : 's'}.`;
  }
  if (err?.code === 'internal_error') return 'The server had a problem. Try again in a moment.';
  return MESSAGES[err?.code] || 'Something went wrong. Try again.';
}

/** Resize an image file in the browser before uploading (keeps GIFs as-is). */
export async function prepareImage(file, maxSize = 1600) {
  if (file.type === 'image/gif' || !file.type.startsWith('image/')) return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 600 * 1024) return file;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/webp', 0.86));
  return blob ? new File([blob], file.name.replace(/\.\w+$/, '.webp'), { type: 'image/webp' }) : file;
}

export async function uploadImage(file, maxSize) {
  const form = new FormData();
  form.append('file', await prepareImage(file, maxSize));
  return api('/api/assets', { method: 'POST', form });
}
