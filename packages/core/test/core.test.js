import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  blockTypes, themes, wallpapers, buttonStyles, fonts, socials,
  createDefaultPage, sanitizePage, sanitizeSlug, renderPage, applyTheme, newBlock, defaultDesign,
  designCss, resolveDesign, cssVariables, cssElements,
} from '../src/index.js';

test('every block type renders with its defaults', () => {
  for (const mod of blockTypes.list()) {
    const page = createDefaultPage({ slug: 'demo' });
    page.blocks = [newBlock(mod.type)];
    const { html } = renderPage(sanitizePage(page), { mode: 'preview' });
    assert.ok(html.includes(`ol-b-${mod.type}`), mod.type);
  }
});

test('every theme and wallpaper renders', () => {
  for (const t of themes.list()) {
    const page = createDefaultPage({ slug: 'demo' });
    page.design = applyTheme(page.design, t.id);
    const clean = sanitizePage(page);
    assert.equal(clean.design.theme, t.id);
    assert.ok(renderPage(clean).css.length > 100);
  }
  for (const w of wallpapers.list()) {
    const page = createDefaultPage({ slug: 'demo' });
    page.design.wallpaper = { type: w.id };
    assert.equal(sanitizePage(page).design.wallpaper.type, w.id);
  }
});

test('user content is escaped and unsafe urls removed', () => {
  const page = createDefaultPage({ slug: 'demo' });
  page.profile.title = '<script>alert(1)</script>';
  page.blocks = [{ id: 'x', type: 'link', enabled: true, data: { title: '"><img src=x onerror=alert(1)>', url: 'javascript:alert(1)' } }];
  page.design.customCss = '</style><script>alert(1)</script>';
  const clean = sanitizePage(page);
  assert.equal(clean.blocks[0].data.url, '');
  const { html, css } = renderPage(clean);
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<img src=x'));
  assert.ok(!css.includes('</style'));
});

test('urls are normalized', () => {
  const clean = sanitizePage({ blocks: [{ type: 'link', data: { title: 'a', url: 'instagram.com/me' } }] });
  assert.equal(clean.blocks[0].data.url, 'https://instagram.com/me');
});

test('unknown block types are kept but not rendered', () => {
  const clean = sanitizePage({ blocks: [{ id: 'z', type: 'removed-type', enabled: true, data: { a: 1 } }] });
  assert.equal(clean.blocks.length, 1);
  assert.ok(!renderPage(clean).html.includes('removed-type'));
});

test('scheduled blocks are hidden live, shown in preview', () => {
  const b = newBlock('link', { title: 'Later', url: 'https://a.com' });
  b.options.showFrom = new Date(Date.now() + 86400000).toISOString();
  const page = sanitizePage({ ...createDefaultPage({ slug: 'demo' }), blocks: [b] });
  assert.ok(!renderPage(page, { mode: 'live' }).html.includes('Later'));
  assert.ok(renderPage(page, { mode: 'preview' }).html.includes('Later'));
});

test('slugs', () => {
  assert.equal(sanitizeSlug('@OtreBeh'), 'otrebeh');
  assert.equal(sanitizeSlug('api'), '');
  assert.equal(sanitizeSlug('ab'), '');
});

test('registries are populated', () => {
  assert.ok(buttonStyles.list().length >= 6 && fonts.list().length >= 10 && socials.list().length >= 30);
  assert.equal(defaultDesign().wallpaper.type, 'solid');
});

test('header layout styles target the root element', () => {
  for (const layout of ['hero', 'left']) {
    const page = createDefaultPage({ slug: 'demo' });
    page.design.headerLayout = layout;
    const { html, css } = renderPage(sanitizePage(page));
    assert.ok(html.includes(`class="ol-root ol-layout-${layout}`), `root has ol-layout-${layout}`);
    // The layout class sits on .ol-root itself, so it must be ".ol-root.ol-layout-x", never ".ol-root .ol-layout-x".
    assert.ok(css.includes(`.ol-root.ol-layout-${layout}`), `css for ${layout}`);
    assert.ok(!css.includes(`.ol-root .ol-layout-`), 'no descendant layout selectors');
  }
});

test('docs: every CSS variable written by designCss is documented (and vice versa)', () => {
  const written = [...designCss(resolveDesign({})).matchAll(/(--ol-[\w-]+):/g)].map((m) => m[1]);
  const documented = cssVariables.map((v) => v.name);
  assert.deepEqual([...documented].sort(), [...written].sort());
});

test('docs: documented class names exist in the rendered output', () => {
  const page = createDefaultPage({ slug: 'demo' });
  page.blocks = blockTypes.list().map((m) => newBlock(m.type));
  const { html, css } = renderPage(sanitizePage(page), { mode: 'preview' });
  const all = html + css;
  const firstClass = (sel) => sel.match(/\.(ol-[\w-]+)/)?.[1];
  for (const mod of blockTypes.list()) {
    assert.ok(Array.isArray(mod.cssClasses) && mod.cssClasses.length, `${mod.type} documents its classes`);
    for (const c of mod.cssClasses) assert.ok(all.includes(firstClass(c.selector)), `${mod.type}: ${c.selector}`);
  }
  for (const e of cssElements) {
    const cls = firstClass(e.selector);
    if (cls && cls !== 'ol-gate') assert.ok(all.includes(cls), e.selector);
  }
});

import {
  moveBlock, canMoveInto, findBlock, parentIdOf, flattenBlocks, isContainerType, MAX_DEPTH, cloneBlock,
} from '../src/index.js';

test('collections hold any block, including other collections', () => {
  const inner = newBlock('collection', { title: 'Inner', layout: 'grid' });
  const outer = newBlock('collection', { title: 'Outer' });
  outer.children = [newBlock('video', { url: 'https://youtu.be/dQw4w9WgXcQ' }), inner, newBlock('text', { text: 'hi' })];
  const page = sanitizePage({ ...createDefaultPage({ slug: 'demo' }), blocks: [outer] });
  assert.equal(page.blocks[0].children.length, 3);
  assert.equal(page.blocks[0].children[1].children.length, 2); // default links of the inner collection
  const { html } = renderPage(page);
  assert.ok(html.includes('ol-b-video') && html.includes('Inner') && html.includes('ol-col-card')); // links as cards inside a grid
});

test('old collections (data.items) become link blocks', () => {
  const page = sanitizePage({ blocks: [{ id: 'c', type: 'collection', data: { title: 'Old', items: [{ id: 'x1', title: 'A', url: 'https://a.com', image: '' }, { id: 'x2', title: 'B', url: 'https://b.com' }] } }] });
  const kids = page.blocks[0].children;
  assert.deepEqual(kids.map((k) => [k.type, k.data.title, k.data.url]), [['link', 'A', 'https://a.com/'], ['link', 'B', 'https://b.com/']]);
  assert.equal(page.blocks[0].data.items, undefined);
});

test('nesting depth is limited and children are dropped from non-containers', () => {
  let deep = newBlock('collection');
  for (let i = 0; i < MAX_DEPTH + 3; i++) { const c = newBlock('collection'); c.children = [deep]; deep = c; }
  const page = sanitizePage({ blocks: [deep, { ...newBlock('link', { title: 'x', url: 'https://x.com' }), children: [newBlock('text')] }] });
  let depth = 0;
  for (let b = page.blocks[0]; b?.children?.length; b = b.children.find((c) => c.type === 'collection')) depth++;
  assert.ok(depth <= MAX_DEPTH - 1);
  assert.equal(page.blocks[1].children, undefined);
});

test('moving blocks in and out of collections', () => {
  const a = newBlock('link', { title: 'A', url: 'https://a.com' });
  const col = newBlock('collection');
  let blocks = [a, col];
  blocks = moveBlock(blocks, a.id, col.id, 0, isContainerType);
  assert.equal(parentIdOf(blocks, a.id), col.id);
  assert.equal(blocks.length, 1);
  blocks = moveBlock(blocks, a.id, null, 0, isContainerType);
  assert.equal(parentIdOf(blocks, a.id), null);
  // a collection can't go inside itself or into a link
  assert.equal(canMoveInto(blocks, col.id, col.id, isContainerType), false);
  assert.equal(canMoveInto(blocks, col.id, a.id, isContainerType), false);
  // duplicate gives new ids to every descendant
  const copy = cloneBlock(findBlock(blocks, col.id));
  const ids = new Set(flattenBlocks(blocks).map((b) => b.id));
  assert.ok(flattenBlocks([copy]).every((b) => !ids.has(b.id)));
});

import { computeSlots, zonedToUtc, bookableDays, icsCalendar } from '../src/index.js';

const bookingData = (extra = {}) => ({
  timezone: 'America/Caracas', // UTC-4, no DST
  services: [{ id: 's1', name: 'Cut', duration: '60' }],
  hours: [{ id: 'h', day: 'mon', from: '09:00', to: '12:00' }],
  slotStep: 'service', buffer: '0', minNotice: '0', maxDays: 30, ...extra,
});
const NOW = new Date('2026-10-01T12:00:00Z'); // a Thursday

test('booking: slots follow business hours in the block time zone', () => {
  const slots = computeSlots({ data: bookingData(), serviceId: 's1', date: '2026-10-05', now: NOW });
  assert.deepEqual(slots, ['2026-10-05T13:00:00.000Z', '2026-10-05T14:00:00.000Z', '2026-10-05T15:00:00.000Z']);
  assert.deepEqual(computeSlots({ data: bookingData(), serviceId: 's1', date: '2026-10-06', now: NOW }), []); // Tuesday: closed
});

test('booking: existing bookings, buffer and minimum notice remove slots', () => {
  const taken = [{ start: '2026-10-05T14:00:00.000Z', end: '2026-10-05T15:00:00.000Z' }];
  assert.deepEqual(computeSlots({ data: bookingData(), serviceId: 's1', date: '2026-10-05', bookings: taken, now: NOW }), ['2026-10-05T13:00:00.000Z', '2026-10-05T15:00:00.000Z']);
  assert.deepEqual(computeSlots({ data: bookingData({ buffer: '15' }), serviceId: 's1', date: '2026-10-05', bookings: taken, now: NOW }), []);
  const nearNow = new Date('2026-10-05T12:30:00Z');
  assert.deepEqual(computeSlots({ data: bookingData({ minNotice: '2' }), serviceId: 's1', date: '2026-10-05', now: nearNow }), ['2026-10-05T15:00:00.000Z']);
});

test('booking: DST-aware conversion and bookable days', () => {
  // New York: EDT (UTC-4) in October, EST (UTC-5) in December.
  assert.equal(zonedToUtc('2026-10-05', 9 * 60, 'America/New_York').toISOString(), '2026-10-05T13:00:00.000Z');
  assert.equal(zonedToUtc('2026-12-07', 9 * 60, 'America/New_York').toISOString(), '2026-12-07T14:00:00.000Z');
  const days = bookableDays(bookingData({ maxDays: 14 }), NOW);
  assert.deepEqual(days, ['2026-10-05', '2026-10-12']);
});

test('booking: ics has the event and alarms', () => {
  const ics = icsCalendar([{ uid: 'x@o', start: '2026-10-05T13:00:00Z', end: '2026-10-05T14:00:00Z', title: 'Cut, wash', alarms: [60] }]);
  assert.ok(ics.includes('DTSTART:20261005T130000Z') && ics.includes('SUMMARY:Cut\\, wash') && ics.includes('TRIGGER:-PT60M'));
});

// ── Survey ───────────────────────────────────────────────────────────────
import { validateAnswers, responsesCsv, summarizeResponses } from '../src/index.js';

const QS = [
  { id: 'a', label: 'Name', type: 'short', required: true },
  { id: 'b', label: 'Where', type: 'single', options: 'Instagram\nTikTok', required: false },
  { id: 'c', label: 'Topics', type: 'multiple', options: 'Art\nMusic\nTech' },
  { id: 'd', label: 'Rate', type: 'rating', required: true },
  { id: 'e', label: 'Email', type: 'email' },
];

test('survey: answers are validated against the questions', () => {
  const ok = validateAnswers(QS, { a: ' Ana ', b: 'TikTok', c: ['Tech', 'Art', 'Tech'], d: '4', e: '', x: 'ignored' });
  assert.deepEqual(ok.errors, []);
  assert.deepEqual(ok.answers.map((a) => a.value), ['Ana', 'TikTok', ['Art', 'Tech'], 4, '']);
  const bad = validateAnswers(QS, { a: '', b: 'Facebook', c: ['Cooking'], d: 9, e: 'nope' });
  assert.deepEqual(bad.errors.map((e) => e.id), ['a', 'b', 'c', 'd', 'e']);
});

test('survey: csv and summary', () => {
  const responses = [
    { createdAt: '2026-10-02T10:00:00Z', answers: validateAnswers(QS, { a: '=cmd', b: 'TikTok', c: ['Art'], d: 5 }).answers },
    { createdAt: '2026-10-01T10:00:00Z', answers: validateAnswers(QS, { a: 'Luis, "L"', b: 'Instagram', c: ['Art', 'Music'], d: 3 }).answers },
  ];
  const csv = responsesCsv(QS, responses);
  assert.ok(csv.startsWith('﻿Date,Name,Where,Topics,Rate,Email'));
  assert.ok(csv.includes("'=cmd") && csv.includes('"Luis, ""L"""') && csv.includes('"Art, Music"') && csv.includes('5/5'));
  const sum = summarizeResponses(QS, responses);
  assert.deepEqual(sum.find((s) => s.id === 'c').counts, { Art: 2, Music: 1, Tech: 0 });
  assert.equal(sum.find((s) => s.id === 'd').average, 4);
});

test('survey: renders every question type', () => {
  const page = createDefaultPage({ slug: 'demo' });
  const b = newBlock('survey');
  b.data.questions = ['short', 'long', 'single', 'multiple', 'dropdown', 'rating', 'scale', 'yesno', 'email', 'number', 'date']
    .map((type, i) => ({ id: `q${i}`, label: `Q<${type}>`, type, options: 'One\nTwo', hint: '', required: i === 0 }));
  page.blocks = [b];
  const { html } = renderPage(sanitizePage(page), { mode: 'live' });
  for (const t of ['short', 'long', 'rating', 'scale', 'date']) assert.ok(html.includes(`data-type="${t}"`), t);
  assert.ok(html.includes('Q&lt;short&gt;') && !html.includes('Q<short>'));
  const exp = renderPage(sanitizePage(page), { mode: 'export', liveUrl: 'https://x.io/demo' }).html;
  assert.ok(exp.includes('https://x.io/demo') && !exp.includes('<form'));
});

test('booking: private fields (meeting link) are removed from public blocks', async () => {
  const { stripPrivateFields } = await import('../src/index.js');
  const blocks = [{ id: 'c', type: 'collection', data: {}, children: [{ id: 'b', type: 'booking', data: { meetingUrl: 'https://meet.google.com/abc', buttonLabel: 'Book' } }] }];
  const out = stripPrivateFields(blocks);
  assert.equal(out[0].children[0].data.meetingUrl, undefined);
  assert.equal(out[0].children[0].data.buttonLabel, 'Book');
  assert.equal(blocks[0].children[0].data.meetingUrl, 'https://meet.google.com/abc'); // original untouched
});

test('reviews: renders a button + card, and links to the live page in exports', async () => {
  const { starsHtml } = await import('../src/blocks/reviews.js');
  const page = createDefaultPage({ slug: 'demo' });
  page.blocks = [newBlock('reviews', { title: 'What <clients> say' })];
  const { html } = renderPage(sanitizePage(page), { mode: 'live' });
  assert.ok(html.includes('class="ol-reviews"') && html.includes('class="ol-card ol-rev"') && !html.includes('<clients>'));
  const exp = renderPage(sanitizePage(page), { mode: 'export', liveUrl: 'https://x.io/demo' }).html;
  assert.ok(exp.includes('https://x.io/demo') && !exp.includes('ol-rev"'));
  assert.ok(starsHtml(4.5).includes('width:90%'));
});

test('image adjustments: sanitized and applied to avatar, thumbnails, image block and wallpaper', () => {
  const page = createDefaultPage({ slug: 'demo' });
  page.profile.avatar = 'https://x.io/a.jpg';
  page.profile.avatarAdjust = { x: 30, y: 200, zoom: 150, fit: 'cover' };
  page.blocks = [
    newBlock('link', { title: 'L', url: 'https://x.io', thumbnail: 'https://x.io/t.jpg', thumbnailAdjust: { x: 10, y: 90, zoom: 100, fit: 'contain' } }),
    newBlock('image', { image: 'https://x.io/i.jpg', ratio: '1 / 1', adjust: { x: 50, y: 20, zoom: 200, fit: 'cover' } }),
  ];
  page.design.wallpaper = { type: 'image', image: 'https://x.io/bg.jpg', adjust: { x: 40, y: 60, zoom: 120, fit: 'cover' } };
  const clean = sanitizePage(page);
  assert.deepEqual(clean.profile.avatarAdjust, { x: 30, y: 100, zoom: 150, fit: 'cover' });
  const { html, css } = renderPage(clean, { mode: 'live' });
  assert.ok(html.includes('<span class="ol-avatar ol-avatar-circle ol-zoom"><img src="https://x.io/a.jpg"'));
  assert.ok(html.includes('transform:scale(1.5);transform-origin:30% 100%'));
  assert.ok(html.includes('class="ol-btn-thumb" src="https://x.io/t.jpg"') && html.includes('object-fit:contain;object-position:10% 90%'));
  assert.ok(html.includes('<span class="ol-image-frame" style="aspect-ratio:1 / 1">'));
  assert.ok(css.includes('40% 60%/cover') && css.includes('scale(1.2)'));
});

test('embed: plain iframes are rebuilt, other code is sandboxed, both can be a button', async () => {
  const { parseEmbed } = await import('../src/blocks/embed.js');
  assert.equal(parseEmbed('<iframe src="javascript:alert(1)"></iframe>'), null);
  const yt = parseEmbed('<iframe width="560" height="315" src="https://www.youtube.com/embed/x?a=1&amp;b=2" title="YT" allow="autoplay; encrypted-media" onload="evil()"></iframe>');
  assert.deepEqual(yt, { kind: 'iframe', src: 'https://www.youtube.com/embed/x?a=1&b=2', allow: 'autoplay; encrypted-media', title: 'YT', width: 560, height: 315 });

  const page = createDefaultPage({ slug: 'demo' });
  page.blocks = [
    newBlock('embed', { code: '<iframe width="560" height="315" src="https://www.youtube.com/embed/x" onload="evil()"></iframe>' }),
    newBlock('embed', { code: '<div id="w"></div><script src="https://widget.example/w.js"></script>', display: 'button', buttonLabel: 'Book a call' }),
    newBlock('map', { address: 'Caracas', display: 'button' }),
  ];
  const { html } = renderPage(sanitizePage(page), { mode: 'live' });
  assert.ok(html.includes('aspect-ratio:560 / 315') && !html.includes('evil'));
  assert.ok(html.includes('sandbox="allow-scripts') && !html.includes('allow-same-origin') && !html.includes('<script src="https://widget'));
  assert.ok(html.includes('srcdoc="&lt;!doctype html&gt;'));
  assert.ok(html.includes('<details class="ol-toggle"') && html.includes('Book a call') && html.includes('See on the map'));
});
