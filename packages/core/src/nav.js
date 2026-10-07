// Navigation menu of the public page (Settings → Navigation menu): a
// hamburger button that lists the sections of a long page and jumps to them.
// Items: Header blocks (or every block with a title), plus any block with a
// "Menu label" (block → Animation & schedule).

const TITLE_KEYS = ['text', 'title', 'label', 'name', 'question', 'filename', 'buttonLabel', 'reward'];
const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, 60);

/** Anchor id for a label: "Our menu" → "our-menu". */
export const navSlug = (label) => String(label || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'section';

/**
 * Menu items of a page: [{ id: blockId, anchor, label, depth }] in page order.
 * `visible(block)` tells if a block is shown (enabled, not scheduled out…).
 */
export function navItems(page, visible = (b) => b.enabled !== false) {
  const s = page?.settings || {};
  if (!s.navMenu) return [];
  const out = [];
  const used = new Set();
  const walk = (list, depth) => {
    for (const b of list || []) {
      if (!visible(b)) continue;
      const own = clean(b.options?.navLabel);
      let label = own;
      if (!label && b.type === 'header') label = clean(b.data?.text);
      if (!label && s.navItems === 'all') label = clean(TITLE_KEYS.map((k) => b.data?.[k]).find((v) => typeof v === 'string' && v.trim()));
      if (label) {
        let anchor = navSlug(label);
        for (let i = 2; used.has(anchor); i++) anchor = `${navSlug(label)}-${i}`;
        used.add(anchor);
        out.push({ id: b.id, anchor, label, depth });
      }
      if (b.children) walk(b.children, depth + 1);
    }
  };
  walk(page.blocks, 0);
  return out.slice(0, 60);
}
