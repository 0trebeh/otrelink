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
