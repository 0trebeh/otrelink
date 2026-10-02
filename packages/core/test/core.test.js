import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  blockTypes, themes, wallpapers, buttonStyles, fonts, socials,
  createDefaultPage, sanitizePage, sanitizeSlug, renderPage, applyTheme, newBlock, defaultDesign,
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
