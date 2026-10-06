// Reviews block: visitors rate your service with stars and a comment, and can
// read what earlier clients wrote. Reviews live on the server
// (/api/public/reviews); you moderate and reply in the dashboard (Reviews).
import { esc } from '../util/html.js';
import { icon } from '../icons.js';

const STAR_PATH = 'm12 2.8 2.8 5.7 6.3.9-4.55 4.43 1.07 6.27L12 17.13 6.38 20.1l1.07-6.27L2.9 9.4l6.3-.9z';
const star = (size) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><path fill="currentColor" d="${STAR_PATH}"/></svg>`;

/** Five stars filled up to `value` (0–5, decimals allowed). */
export function starsHtml(value, size = 16) {
  const pct = Math.max(0, Math.min(100, (Number(value) || 0) * 20));
  const row = star(size).repeat(5);
  return `<span class="ol-rev-stars" role="img" aria-label="${(Number(value) || 0).toFixed(1).replace(/\.0$/, '')} out of 5 stars">`
    + `<span class="ol-rev-stars-bg">${row}</span><span class="ol-rev-stars-fg" style="width:${pct}%">${row}</span></span>`;
}

export default {
  type: 'reviews',
  label: 'Reviews',
  description: 'Clients rate you with stars and a comment; everyone can read the reviews.',
  icon: 'star',
  category: 'Contact',
  cssClasses: [
    { selector: '.ol-reviews', description: 'Wrapper (details element, [open] when expanded)' },
    { selector: '.ol-reviews > .ol-btn', description: 'The reviews button (shows the average rating)' },
    { selector: '.ol-rev', description: 'Card with the reviews' },
    { selector: '.ol-rev-summary', description: 'Average rating and bars per star' },
    { selector: '.ol-rev-stars', description: 'Star rating (filled part: .ol-rev-stars-fg)' },
    { selector: '.ol-rev-write', description: '“Write a review” button' },
    { selector: '.ol-rev-form', description: 'Form to write a review' },
    { selector: '.ol-rev-item', description: 'One review' },
    { selector: '.ol-rev-reply', description: 'Your public reply under a review' },
    { selector: '.ol-rev-more', description: '“Show more” button' },
    { selector: '.ol-rev-mine', description: 'The visitor’s own review with Edit / Delete (.is-published, .is-pending, .is-hidden)' },
  ],
  fields: [
    { key: 'buttonLabel', type: 'text', label: 'Button text', default: 'Reviews' },
    { key: 'description', type: 'text', label: 'Button subtitle (optional)', help: 'Leave empty to show the average rating (e.g. ★ 4.8 · 23 reviews).' },
    { key: 'title', type: 'text', label: 'Title inside (optional)', placeholder: 'What my clients say', max: 120 },
    { key: 'allowNew', type: 'toggle', label: 'Accept new reviews', default: true },
    { key: 'moderation', type: 'select', label: 'New reviews', default: 'auto', showIf: { key: 'allowNew', truthy: true }, options: [
      { value: 'auto', label: 'Publish right away' }, { value: 'manual', label: 'I approve each one' },
    ], help: 'Either way you can hide, delete or reply to any review in Reviews.' },
    { key: 'requireComment', type: 'toggle', label: 'Comment is required', default: false, showIf: { key: 'allowNew', truthy: true } },
    { key: 'oneReview', type: 'toggle', label: 'One review per device', default: true, showIf: { key: 'allowNew', truthy: true } },
    { key: 'notify', type: 'toggle', label: 'Notify me of new reviews', default: true, help: 'Push notification on your devices (turn it on in Agenda or Reviews).' },
    { key: 'perPage', type: 'range', label: 'Reviews shown at first', min: 3, max: 20, default: 5 },
    { key: 'startOpen', type: 'toggle', label: 'Show the reviews open', default: false },
  ],
  summary: (d) => `${d.allowNew ? 'Open' : 'Closed'} · ${d.moderation === 'manual' ? 'you approve' : 'auto publish'}`,
  render(d, ctx) {
    const label = esc(d.buttonLabel || 'Reviews');
    if (ctx.mode === 'export') {
      return ctx.liveUrl
        ? `<a class="ol-btn has-media" href="${esc(ctx.liveUrl)}" target="_blank" rel="noopener"><span class="ol-btn-icon">${icon('star', 20)}</span>`
          + `<span class="ol-btn-label"><span class="ol-btn-title">${label}</span><span class="ol-btn-sub">Opens the reviews online</span></span><span class="ol-btn-spacer"></span></a>`
        : '';
    }
    return `<details class="ol-reviews"${d.startOpen ? ' open' : ''}>`
      + `<summary class="ol-btn has-media" data-ol-track="${esc(ctx.blockId)}"><span class="ol-btn-icon">${icon('star', 20)}</span>`
      + `<span class="ol-btn-label"><span class="ol-btn-title">${label}</span><span class="ol-btn-sub"${d.description ? '' : ' hidden'}>${esc(d.description)}</span></span>`
      + `<span class="ol-btn-icon ol-rev-chevron">${icon('chevron', 18)}</span></summary>`
      + `<div class="ol-card ol-rev" data-api="${esc(ctx.apiBase)}" data-page="${esc(ctx.page?.id || '')}" data-block="${esc(ctx.blockId)}" data-mode="${esc(ctx.mode)}" data-owner="${esc(ctx.page?.profile?.title || '')}">`
      + '<p class="ol-rev-note">Loading reviews…</p></div></details>';
  },
  hydrate(el, data) {
    const details = el.querySelector(':scope > .ol-reviews');
    const box = details?.querySelector('.ol-rev');
    if (!box) return;
    reviewsApp(el.ownerDocument, details, box, data);
  },
  css: `.ol-root .ol-reviews>summary{list-style:none}
.ol-root .ol-reviews>summary::-webkit-details-marker{display:none}
.ol-root .ol-rev-chevron{transition:transform .2s}
.ol-root .ol-reviews[open]>summary .ol-rev-chevron{transform:rotate(180deg)}
.ol-root .ol-reviews .ol-btn-sub .ol-rev-stars{vertical-align:-2px;margin-right:4px}
.ol-root .ol-rev{margin-top:8px;padding:18px 16px;text-align:left;display:flex;flex-direction:column;gap:14px;animation:ol-rev-in .2s ease}
@keyframes ol-rev-in{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
.ol-root .ol-rev button{font:inherit;color:inherit;cursor:pointer}
.ol-root .ol-rev-title{margin:0;font-weight:800;font-size:1.1em}
.ol-root .ol-rev-note{margin:0;font-size:.85em;opacity:.7}
.ol-root .ol-rev-error{margin:0;font-size:.85em;color:#dc2626}
.ol-root .ol-rev-ok{margin:0;padding:10px 12px;border-radius:12px;font-size:.9em;background:color-mix(in srgb,#0f9d58 14%,transparent)}
.ol-root .ol-rev-stars{position:relative;display:inline-block;line-height:0;white-space:nowrap}
.ol-root .ol-rev-stars-bg{color:color-mix(in srgb,var(--ol-surface-fg) 20%,transparent)}
.ol-root .ol-rev-stars-fg{position:absolute;inset:0 auto 0 0;overflow:hidden;color:#f5b301}
.ol-root .ol-btn .ol-rev-stars-bg{color:color-mix(in srgb,currentColor 25%,transparent)}
.ol-root .ol-rev-summary{display:grid;grid-template-columns:auto minmax(0,1fr);gap:16px;align-items:center}
.ol-root .ol-rev-avg{display:flex;flex-direction:column;align-items:center;gap:4px;min-width:96px}
.ol-root .ol-rev-avg strong{font-size:2.4em;line-height:1;font-weight:800;font-variant-numeric:tabular-nums}
.ol-root .ol-rev-avg small{font-size:.78em;opacity:.7}
.ol-root .ol-rev-bars{display:flex;flex-direction:column;gap:4px;font-size:.78em}
.ol-root .ol-rev-bar{display:grid;grid-template-columns:1.6em minmax(0,1fr) 2em;gap:6px;align-items:center;font-variant-numeric:tabular-nums}
.ol-root .ol-rev-bar i{display:block;height:7px;border-radius:9px;background:color-mix(in srgb,var(--ol-surface-fg) 10%,transparent);overflow:hidden}
.ol-root .ol-rev-bar i b{display:block;height:100%;background:#f5b301;border-radius:9px}
.ol-root .ol-rev-bar span:last-child{text-align:right;opacity:.65}
.ol-root .ol-rev-write,.ol-root .ol-rev-submit{border:0;border-radius:999px;min-height:44px;font-weight:700;background:var(--ol-surface-fg);color:var(--ol-surface)!important}
.ol-root .ol-rev-submit[disabled]{opacity:.5;cursor:default}
.ol-root .ol-rev-form{display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:14px;background:color-mix(in srgb,var(--ol-surface-fg) 5%,transparent)}
.ol-root .ol-rev-form label.ol-rev-lbl{font-weight:700;font-size:.9em}
.ol-root .ol-rev-form input:not([type=radio]),.ol-root .ol-rev-form textarea{font:inherit;color:var(--ol-surface-fg);background:var(--ol-surface);border:1.5px solid color-mix(in srgb,var(--ol-surface-fg) 18%,transparent);border-radius:10px;padding:10px 12px;width:100%;box-sizing:border-box}
.ol-root .ol-rev-form textarea{min-height:90px;resize:vertical}
.ol-root .ol-rev-form :is(input,textarea):focus-visible{outline:2px solid var(--ol-surface-fg);outline-offset:1px}
.ol-root .ol-rev-pick{display:flex;flex-direction:row-reverse;justify-content:flex-end;gap:2px}
.ol-root .ol-rev-pick input{position:absolute;opacity:0;width:1px;height:1px}
.ol-root .ol-rev-pick label{cursor:pointer;line-height:0;padding:2px;border-radius:6px;color:color-mix(in srgb,var(--ol-surface-fg) 22%,transparent);transition:color .12s,transform .12s}
.ol-root .ol-rev-pick input:checked~label,.ol-root .ol-rev-pick label:hover,.ol-root .ol-rev-pick label:hover~label{color:#f5b301}
.ol-root .ol-rev-pick label:hover{transform:scale(1.1)}
.ol-root .ol-rev-pick input:focus-visible+label{outline:2px solid var(--ol-surface-fg)}
.ol-root .ol-rev-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}
.ol-root .ol-rev-cancel,.ol-root .ol-rev-more{align-self:center;border:0;background:transparent;padding:4px 8px;font-size:.85em;text-decoration:underline;opacity:.75}
.ol-root .ol-rev-list{display:flex;flex-direction:column;margin:0;padding:0;list-style:none}
.ol-root .ol-rev-item{display:flex;flex-direction:column;gap:6px;padding:14px 0;border-top:1px solid color-mix(in srgb,var(--ol-surface-fg) 10%,transparent)}
.ol-root .ol-rev-head{display:flex;align-items:center;gap:10px}
.ol-root .ol-rev-avatar{flex:none;display:grid;place-items:center;width:34px;height:34px;border-radius:50%;font-weight:800;font-size:.85em;background:color-mix(in srgb,var(--ol-surface-fg) 9%,transparent)}
.ol-root .ol-rev-who{display:flex;flex-direction:column;min-width:0;gap:2px}
.ol-root .ol-rev-who strong{font-size:.92em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ol-root .ol-rev-meta{display:flex;align-items:center;gap:6px;font-size:.75em;opacity:.75}
.ol-root .ol-rev-meta span{opacity:.9}
.ol-root .ol-rev-text{margin:0;font-size:.92em;line-height:1.5;white-space:pre-line;overflow-wrap:anywhere}
.ol-root .ol-rev-reply{margin:2px 0 0;padding:10px 12px;border-radius:12px;font-size:.86em;background:color-mix(in srgb,var(--ol-surface-fg) 6%,transparent);white-space:pre-line;overflow-wrap:anywhere}
.ol-root .ol-rev-reply strong{display:block;font-size:.85em;margin-bottom:2px;opacity:.8}
.ol-root .ol-rev-step{margin:0;font-size:.8em;font-weight:700;opacity:.7}
.ol-root .ol-rev-mine{display:flex;flex-direction:column;gap:8px;padding:14px;border-radius:14px;background:color-mix(in srgb,var(--ol-surface-fg) 5%,transparent);border:1.5px solid color-mix(in srgb,var(--ol-surface-fg) 12%,transparent)}
.ol-root .ol-rev-mine.is-pending,.ol-root .ol-rev-mine.is-hidden{border-style:dashed}
.ol-root .ol-rev-actions,.ol-root .ol-rev-confirm{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px}
.ol-root .ol-rev-confirm{font-size:.88em;font-weight:600}
.ol-root .ol-rev-edit,.ol-root .ol-rev-delete{border:1.5px solid color-mix(in srgb,var(--ol-surface-fg) 18%,transparent);background:transparent;border-radius:999px;padding:6px 16px;font-size:.85em;font-weight:600}
.ol-root .ol-rev-delete{color:#dc2626!important;border-color:color-mix(in srgb,#dc2626 35%,transparent)}
.ol-root .ol-rev-delete-yes{border:0;border-radius:999px;padding:7px 14px;background:#dc2626;color:#fff!important;font-weight:700}
.ol-root .ol-rev-delete-yes[disabled]{opacity:.6}
.ol-root .ol-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}`,
};

// ── Browser behavior ─────────────────────────────────────────────────────
function reviewsApp(doc, details, box, data) {
  const api = box.dataset.api || '';
  const pageId = box.dataset.page;
  const blockId = box.dataset.block;
  const preview = box.dataset.mode === 'preview';
  const owner = box.dataset.owner || 'the owner';
  // This browser's review: { id, token }. The secret token lets only this
  // browser edit or delete it. (Older pages stored just a timestamp.)
  const storeKey = `ol-review:${pageId}:${blockId}`;
  const readStore = () => { try { return localStorage.getItem(storeKey); } catch { return null; } };
  const reviewed = () => Boolean(readStore());
  const myKey = () => { try { const v = JSON.parse(readStore()); return v?.id && v?.token ? v : null; } catch { return null; } };
  const saveMine = (id, token) => { try { localStorage.setItem(storeKey, JSON.stringify({ id, token })); } catch { /* ignore */ } };
  const forgetMine = () => { try { localStorage.removeItem(storeKey); } catch { /* ignore */ } };
  const st = {
    stats: null, reviews: [], hasMore: false, loaded: false, loading: false, error: '',
    writing: false, editing: false, sending: false, formError: '', sent: '',
    mine: null, confirmDelete: false, deleting: false, mineError: '',
  };

  const h = (tag, attrs = {}, ...kids) => {
    const n = doc.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'on') for (const [ev, fn] of Object.entries(v)) n.addEventListener(ev, fn);
      else if (k === 'html') n.innerHTML = v; // only used with our own trusted markup (stars)
      else if (v !== false && v != null) n.setAttribute(k, v === true ? '' : v);
    }
    for (const c of kids.flat(Infinity)) if (c != null && c !== false && c !== '') n.append(c.nodeType ? c : doc.createTextNode(String(c)));
    return n;
  };
  const fmtDate = (iso) => new Date(iso).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  const plural = (n) => `${n} review${n === 1 ? '' : 's'}`;
  const post = async (path, body) => {
    // text/plain keeps it a "simple" CORS request (no preflight).
    const res = await fetch(`${api}${path}`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(body) });
    return { res, json: await res.json().catch(() => ({})) };
  };
  const errorText = (code) => ({
    too_many_requests: 'Too many attempts. Try again later.', closed: 'This page is not accepting new reviews.',
    comment_required: 'Write a short comment.', not_found: 'This review no longer exists.',
  }[code] || 'Something went wrong. Try again.');

  function setSubtitle() {
    if (data.description) return;
    const sub = details.querySelector(':scope > summary .ol-btn-sub');
    if (!sub || !st.stats) return;
    if (st.stats.count) {
      sub.innerHTML = `${starsHtml(st.stats.average, 13)}${st.stats.average.toFixed(1)} · ${plural(st.stats.count)}`;
    } else {
      sub.textContent = data.allowNew ? 'Be the first to leave a review' : '';
    }
    sub.hidden = !sub.textContent;
  }

  async function load(more = false) {
    if (st.loading) return;
    st.loading = true; st.error = ''; if (more) draw();
    try {
      const q = new URLSearchParams({ pageId, blockId, limit: String(data.perPage || 5) });
      if (more && st.reviews.length) q.set('before', st.reviews[st.reviews.length - 1].createdAt);
      const key = !more && !preview && myKey();
      if (key) q.set('mine', `${key.id}~${key.token}`);
      const res = await fetch(`${api}/api/public/reviews?${q}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error === 'not_found' && preview ? 'Save the page to see the reviews here.' : 'Could not load the reviews.');
      st.stats = json.stats;
      st.reviews = more ? [...st.reviews, ...json.reviews] : json.reviews;
      st.hasMore = json.hasMore;
      if (key) {
        st.mine = json.mine || null;
        if (!json.mine) forgetMine(); // deleted by the page owner
      }
      st.loaded = true;
      setSubtitle();
    } catch (err) { st.error = err.message; }
    st.loading = false;
    if (details.open || more) draw();
  }

  /** Put the latest version of the visitor's review into the public list (or take it out). */
  function syncList(review) {
    const rest = st.reviews.filter((r) => r.id !== review?.id);
    st.reviews = review?.status === 'published' ? [review, ...rest].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : rest;
  }

  async function submit(form) {
    const fd = new FormData(form);
    const rating = Number(fd.get('rating'));
    const comment = String(fd.get('comment') || '').trim();
    if (!rating) { st.formError = 'Choose from 1 to 5 stars.'; return draw(); }
    if (data.requireComment && !comment) { st.formError = 'Write a short comment.'; return draw(); }
    if (preview) { st.formError = 'Sending is disabled in the dashboard preview.'; return draw(); }
    st.sending = true; st.formError = ''; draw();
    const fields = { rating, comment, name: String(fd.get('name') || '') };
    try {
      if (st.editing) {
        const key = myKey();
        const { res, json } = await post('/api/public/reviews/edit', { action: 'update', pageId, blockId, id: key?.id, token: key?.token, ...fields });
        if (!res.ok) throw new Error(errorText(json.error));
        st.mine = json.review;
        syncList(json.review);
        st.stats = json.stats || st.stats;
        st.sent = json.review.status === 'pending' ? 'Saved. Your changes will appear once they are approved.' : 'Your review was updated.';
      } else {
        const { res, json } = await post('/api/public/reviews', { pageId, blockId, ...fields, website: String(fd.get('website') || '') });
        if (!res.ok) throw new Error(errorText(json.error));
        saveMine(json.review.id, json.token);
        st.mine = json.review;
        syncList(json.review);
        st.stats = json.stats || st.stats;
        st.sent = json.review.status === 'published' ? 'Thanks! Your review is published.' : 'Thanks! Your review will appear once it is approved.';
      }
      setSubtitle();
      st.writing = false; st.editing = false; formEl = null;
    } catch (err) { st.formError = err.message; }
    st.sending = false; draw();
  }

  async function removeMine() {
    const key = myKey();
    st.deleting = true; st.mineError = ''; draw();
    try {
      const { res, json } = await post('/api/public/reviews/edit', { action: 'delete', pageId, blockId, id: key?.id, token: key?.token });
      if (!res.ok && res.status !== 404) throw new Error(errorText(json.error));
      forgetMine();
      st.reviews = st.reviews.filter((r) => r.id !== key?.id);
      st.mine = null; st.confirmDelete = false;
      if (json.stats) { st.stats = json.stats; setSubtitle(); }
      st.sent = 'Your review was deleted.';
    } catch (err) { st.mineError = err.message; }
    st.deleting = false; draw();
  }

  function summaryView() {
    const s = st.stats;
    if (!s?.count) return h('p', { class: 'ol-rev-note' }, data.allowNew ? 'No reviews yet. Be the first!' : 'No reviews yet.');
    return h('div', { class: 'ol-rev-summary' },
      h('div', { class: 'ol-rev-avg' }, h('strong', {}, s.average.toFixed(1)), h('span', { html: starsHtml(s.average, 15) }), h('small', {}, plural(s.count))),
      h('div', { class: 'ol-rev-bars', 'aria-label': 'Reviews per rating' }, [5, 4, 3, 2, 1].map((n) => {
        const c = s.dist?.[n] || 0;
        return h('div', { class: 'ol-rev-bar' }, h('span', {}, `${n}★`), h('i', {}, h('b', { style: `width:${s.count ? (c / s.count) * 100 : 0}%` })), h('span', {}, c));
      })));
  }

  // The form is built once and reused, so typed text survives re-draws.
  let formEl = null;
  function formView() {
    const submitLabel = st.editing ? 'Save changes' : 'Publish review';
    if (formEl) {
      const errEl = formEl.querySelector('.ol-rev-error');
      errEl.textContent = st.formError; errEl.hidden = !st.formError;
      const btn = formEl.querySelector('.ol-rev-submit');
      btn.disabled = st.sending; btn.textContent = st.sending ? 'Sending…' : submitLabel;
      return formEl;
    }
    const uid = `olr-${blockId}`;
    const init = st.editing && st.mine ? st.mine : {};
    const form = h('form', { class: 'ol-rev-form', novalidate: true, on: {
      submit: (e) => { e.preventDefault(); submit(e.target); },
      change: () => { if (st.formError) { st.formError = ''; formView(); } },
    } },
      st.editing && h('p', { class: 'ol-rev-step' }, 'Edit your review'),
      h('label', { class: 'ol-rev-lbl', id: `${uid}-l` }, 'Your rating'),
      h('div', { class: 'ol-rev-pick', role: 'radiogroup', 'aria-labelledby': `${uid}-l` }, [5, 4, 3, 2, 1].map((n) => [
        h('input', { type: 'radio', name: 'rating', value: String(n), id: `${uid}-${n}`, checked: init.rating === n }),
        h('label', { for: `${uid}-${n}`, title: `${n} of 5`, html: `<span class="ol-sr">${n} of 5</span>${star(30)}` }),
      ])),
      h('label', { class: 'ol-rev-lbl', for: `${uid}-c` }, data.requireComment ? 'Your comment' : 'Your comment (optional)'),
      h('textarea', { id: `${uid}-c`, name: 'comment', maxlength: '1000', placeholder: 'How was your experience?' }, init.comment || ''),
      h('label', { class: 'ol-rev-lbl', for: `${uid}-n` }, 'Your name (optional)'),
      h('input', { id: `${uid}-n`, name: 'name', maxlength: '60', autocomplete: 'name', placeholder: 'Shown with your review', value: init.name || '' }),
      h('input', { name: 'website', class: 'ol-rev-hp', tabindex: '-1', autocomplete: 'off', 'aria-hidden': 'true' }),
      h('p', { class: 'ol-rev-error', role: 'alert', hidden: !st.formError }, st.formError),
      h('button', { type: 'submit', class: 'ol-rev-submit' }, submitLabel),
      h('button', { type: 'button', class: 'ol-rev-cancel', on: { click: () => { st.writing = false; st.editing = false; st.formError = ''; formEl = null; draw(); } } }, 'Cancel'),
    );
    formEl = form;
    return formView();
  }

  const statusNote = { pending: 'Waiting for approval: not visible on the page yet.', hidden: 'Hidden by the page owner: not visible on the page.' };

  /** The visitor's own review, with Edit / Delete. */
  function mineView() {
    const r = st.mine;
    return h('div', { class: `ol-rev-mine is-${r.status}` },
      h('p', { class: 'ol-rev-step' }, 'Your review'),
      h('div', { class: 'ol-rev-meta' }, h('span', { html: starsHtml(r.rating, 15) }), h('span', {}, `${fmtDate(r.createdAt)}${r.editedAt ? ' · edited' : ''}`)),
      r.comment && h('p', { class: 'ol-rev-text' }, r.comment),
      statusNote[r.status] && h('p', { class: 'ol-rev-note' }, statusNote[r.status]),
      r.reply && h('div', { class: 'ol-rev-reply' }, h('strong', {}, `Reply from ${owner}`), r.reply),
      st.confirmDelete
        ? h('div', { class: 'ol-rev-confirm', role: 'group', 'aria-label': 'Delete review' },
          h('span', {}, 'Delete your review?'),
          h('button', { type: 'button', class: 'ol-rev-delete-yes', disabled: st.deleting, on: { click: removeMine } }, st.deleting ? 'Deleting…' : 'Yes, delete'),
          h('button', { type: 'button', class: 'ol-rev-cancel', on: { click: () => { st.confirmDelete = false; st.mineError = ''; draw(); } } }, 'Keep it'))
        : h('div', { class: 'ol-rev-actions' },
          h('button', { type: 'button', class: 'ol-rev-edit', on: { click: () => { st.editing = true; st.writing = false; st.sent = ''; formEl = null; draw(); box.querySelector('.ol-rev-form textarea')?.focus({ preventScroll: true }); } } }, 'Edit'),
          h('button', { type: 'button', class: 'ol-rev-delete', on: { click: () => { st.confirmDelete = true; st.sent = ''; draw(); } } }, 'Delete')),
      st.mineError && h('p', { class: 'ol-rev-error', role: 'alert' }, st.mineError));
  }

  function itemView(r) {
    const name = r.name || 'Anonymous';
    return h('li', { class: 'ol-rev-item' },
      h('div', { class: 'ol-rev-head' },
        h('span', { class: 'ol-rev-avatar', 'aria-hidden': 'true' }, name.trim().charAt(0).toUpperCase() || '?'),
        h('div', { class: 'ol-rev-who' },
          h('strong', {}, name),
          h('div', { class: 'ol-rev-meta' }, h('span', { html: starsHtml(r.rating, 13) }), h('span', {}, `${fmtDate(r.createdAt)}${r.editedAt ? ' · edited' : ''}`)))),
      r.comment && h('p', { class: 'ol-rev-text' }, r.comment),
      r.reply && h('div', { class: 'ol-rev-reply' }, h('strong', {}, `Reply from ${owner}`), r.reply));
  }

  function draw() {
    box.textContent = '';
    if (data.title) box.append(h('p', { class: 'ol-rev-title' }, data.title));
    if (!st.loaded) { box.append(h('p', { class: st.error ? 'ol-rev-error' : 'ol-rev-note' }, st.error || 'Loading reviews…')); return; }
    box.append(summaryView());
    if (st.sent) box.append(h('p', { class: 'ol-rev-ok', role: 'status' }, st.sent));
    if (st.editing) box.append(formView());
    else if (st.mine) box.append(mineView());
    const canWrite = data.allowNew && !st.editing && !(data.oneReview && !preview && reviewed());
    if (st.writing) box.append(formView());
    else if (canWrite) box.append(h('button', { type: 'button', class: 'ol-rev-write', on: { click: () => { st.writing = true; st.sent = ''; formEl = null; draw(); box.querySelector('.ol-rev-pick input')?.focus({ preventScroll: true }); } } }, 'Write a review'));
    const others = st.reviews.filter((r) => r.id !== st.mine?.id);
    if (others.length) box.append(h('ul', { class: 'ol-rev-list' }, others.map(itemView)));
    if (st.error) box.append(h('p', { class: 'ol-rev-error' }, st.error));
    if (st.hasMore) box.append(h('button', { type: 'button', class: 'ol-rev-more', disabled: st.loading, on: { click: () => load(true) } }, st.loading ? 'Loading…' : 'Show more reviews'));
  }

  // Load right away so the button can show the average rating.
  load();
  details.addEventListener('toggle', () => { if (details.open) draw(); });
}
