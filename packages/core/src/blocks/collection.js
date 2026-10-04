// Collection: a container that holds any blocks (links, videos, text… and
// other collections). Children are shown as a list, grid, carousel or
// showcase, either always visible or behind a button that expands.
//
// `container: true` tells the editor and the renderer this block has
// `children`. The renderer passes them already rendered in ctx.children.
import { esc } from '../util/html.js';
import { icon } from '../icons.js';

const LAYOUTS = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'showcase', label: 'Showcase' },
];

export default {
  type: 'collection',
  label: 'Collection',
  description: 'Group any blocks — even other collections — as a list, grid, carousel or showcase. Can open from a button.',
  icon: 'collection',
  category: 'Essentials',
  container: true,
  cssClasses: [
    { selector: '.ol-collection', description: 'Wrapper (a details element in Button mode, [open] when expanded)' },
    { selector: '.ol-col-header', description: 'Title and description (Always visible mode)' },
    { selector: '.ol-collection > .ol-btn', description: 'The button that expands the collection (Button mode)' },
    { selector: '.ol-col-count', description: 'Number of items shown on the button' },
    { selector: '.ol-col-items', description: 'Items container. Also .ol-col-list / -grid / -carousel / -showcase' },
    { selector: '.ol-col-cell', description: 'Wrapper of each child block' },
    { selector: '.ol-col-card', description: 'A Link shown as a card (Grid and Carousel)' },
    { selector: '.ol-col-show', description: 'A Link shown as a big image card (Showcase)' },
    { selector: '.ol-col-media', description: 'Card image (or initial when the link has no thumbnail)' },
    { selector: '.ol-col-text', description: 'Card title (strong) and subtitle (small)' },
    { selector: '.ol-col-arrow', description: 'Carousel arrows (desktop)' },
  ],
  fields: [
    { key: 'title', type: 'text', label: 'Collection title', default: 'My collection', max: 80 },
    { key: 'description', type: 'text', label: 'Description (optional)', max: 160 },
    { key: 'mode', type: 'choice', label: 'How it appears', default: 'open', options: [
      { value: 'open', label: 'Always visible' }, { value: 'button', label: 'Button that expands' },
    ] },
    { key: 'startOpen', type: 'toggle', label: 'Start expanded', default: false, showIf: { key: 'mode', equals: 'button' } },
    { key: 'layout', type: 'choice', label: 'Layout', default: 'list', options: LAYOUTS },
    { key: 'columns', type: 'range', label: 'Columns', min: 2, max: 3, default: 2, showIf: { key: 'layout', equals: 'grid' } },
  ],
  // New collections start with two links so the layout is visible right away.
  defaultChildren: (make) => [
    make('link', { title: 'First link', url: 'https://example.com' }),
    make('link', { title: 'Second link', url: 'https://example.com' }),
  ],
  // Collections created before nesting existed stored simple links in data.items.
  migrate(block, make) {
    if (Array.isArray(block.children) || !Array.isArray(block.data?.items)) return block;
    const children = block.data.items.map((it) => ({
      ...make('link', { title: it.title || 'Link', url: it.url || '', subtitle: it.subtitle || '', thumbnail: it.image || '' }),
      ...(it.id ? { id: `b_${String(it.id).slice(0, 30)}` } : {}),
    }));
    return { ...block, children };
  },
  summary: (d) => `${LAYOUTS.find((l) => l.value === d.layout)?.label || 'List'}${d.mode === 'button' ? ' · button' : ''}`,
  render(d, ctx) {
    const kids = ctx.children || [];
    let cells = kids.map((c) => `<div class="ol-col-cell">${c.html}</div>`).join('');
    if (!cells && ctx.mode === 'preview') cells = '<div class="ol-card ol-col-empty">Empty collection — drag blocks into it in the editor</div>';
    const arrows = d.layout === 'carousel' && kids.length > 1
      ? `<button type="button" class="ol-col-arrow ol-col-prev" aria-label="Previous">${icon('arrowLeft', 18)}</button><button type="button" class="ol-col-arrow ol-col-next" aria-label="Next">${icon('arrowRight', 18)}</button>`
      : '';
    const body = `<div class="ol-col-wrap"><div class="ol-col-items ol-col-${d.layout}" style="--cols:${d.columns}">${cells}</div>${arrows}</div>`;

    if (d.mode === 'button') {
      return `<details class="ol-collection ol-col-collapsible"${d.startOpen ? ' open' : ''}>`
        + `<summary class="ol-btn has-media" data-ol-track="${esc(ctx.blockId)}"><span class="ol-btn-icon">${icon('collection', 20)}</span>`
        + `<span class="ol-btn-label"><span class="ol-btn-title">${esc(d.title || 'Collection')}</span>${d.description ? `<span class="ol-btn-sub">${esc(d.description)}</span>` : ''}</span>`
        + `<span class="ol-col-count">${kids.length}</span><span class="ol-btn-icon ol-col-chevron">${icon('chevron', 18)}</span></summary>`
        + `<div class="ol-col-body">${body}</div></details>`;
    }
    const header = d.title || d.description
      ? `<div class="ol-col-header">${d.title ? `<h3>${esc(d.title)}</h3>` : ''}${d.description ? `<p>${esc(d.description)}</p>` : ''}</div>`
      : '';
    return `<div class="ol-collection">${header}${body}</div>`;
  },
  // Carousel arrows. Selectors are scoped (:scope >) so a nested collection's
  // carousel is handled by its own block, not by the parent.
  hydrate(el) {
    const col = el.querySelector(':scope > .ol-collection');
    const wrap = col?.querySelector(':scope > .ol-col-wrap, :scope > .ol-col-body > .ol-col-wrap');
    const track = wrap?.querySelector(':scope > .ol-col-carousel');
    if (!track) return;
    const prev = wrap.querySelector(':scope > .ol-col-prev');
    const next = wrap.querySelector(':scope > .ol-col-next');
    if (!prev || !next) return;
    const step = () => (track.firstElementChild?.getBoundingClientRect().width || 200) + 10;
    const update = () => {
      const max = track.scrollWidth - track.clientWidth - 2;
      prev.hidden = track.scrollLeft <= 2;
      next.hidden = track.scrollLeft >= max;
    };
    prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
    track.addEventListener('scroll', update, { passive: true });
    if (col.tagName === 'DETAILS') col.addEventListener('toggle', update);
    update();
  },
  css: `.ol-root .ol-collection>summary{list-style:none}
.ol-root .ol-collection>summary::-webkit-details-marker{display:none}
.ol-root .ol-col-chevron{transition:transform .2s}
.ol-root .ol-collection[open]>summary .ol-col-chevron{transform:rotate(180deg)}
.ol-root .ol-col-count{font-size:.75em;font-weight:700;min-width:24px;height:24px;padding:0 7px;border-radius:999px;display:inline-grid;place-items:center;background:color-mix(in srgb,currentColor 14%,transparent)}
.ol-root .ol-col-body{padding-top:var(--ol-gap);animation:ol-col-in .22s ease}
@keyframes ol-col-in{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
.ol-root .ol-col-header{text-align:center;margin:6px 0 10px}
.ol-root .ol-col-header h3{margin:0;font-family:var(--ol-title-font);color:var(--ol-title-color);font-weight:var(--ol-title-weight);font-size:1.15em}
.ol-root .ol-col-header p{margin:4px 0 0;opacity:.8;font-size:.9em}
.ol-root .ol-col-wrap{position:relative}
.ol-root .ol-col-cell{min-width:0}
.ol-root .ol-col-cell>.ol-block{height:100%}
.ol-root .ol-col-list,.ol-root .ol-col-showcase{display:flex;flex-direction:column;gap:var(--ol-gap)}
.ol-root .ol-col-grid{display:grid;grid-template-columns:repeat(var(--cols),minmax(0,1fr));gap:10px;align-items:stretch}
.ol-root .ol-col-carousel{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding-bottom:2px}
.ol-root .ol-col-carousel::-webkit-scrollbar{display:none}
.ol-root .ol-col-carousel>.ol-col-cell{flex:0 0 72%;scroll-snap-align:start}
.ol-root .ol-col-empty{text-align:center;opacity:.7;font-size:.9em;border:1.5px dashed color-mix(in srgb,var(--ol-surface-fg) 30%,transparent)}
.ol-root .ol-col-card{display:flex;flex-direction:column;height:100%;background:var(--ol-surface);color:var(--ol-surface-fg);border-radius:var(--ol-surface-radius);overflow:hidden;text-decoration:none;transition:transform .18s}
.ol-root a.ol-col-card:hover,.ol-root a.ol-col-show:hover{transform:translateY(-2px)}
.ol-root .ol-col-media{display:block;aspect-ratio:1;overflow:hidden;background:color-mix(in srgb,var(--ol-surface-fg) 8%,transparent)}
.ol-root .ol-col-carousel .ol-col-media{aspect-ratio:4/5}
.ol-root .ol-col-media img{width:100%;height:100%;object-fit:cover;display:block}
.ol-root .ol-col-noimg{display:grid;place-items:center;font-family:var(--ol-title-font);font-weight:800;font-size:2em;opacity:.7}
.ol-root .ol-col-text{display:flex;flex-direction:column;gap:2px;padding:10px 12px;text-align:left;min-width:0}
.ol-root .ol-col-text strong{font-size:.92em;overflow-wrap:anywhere}
.ol-root .ol-col-text small{font-size:.78em;opacity:.75}
.ol-root .ol-col-show{position:relative;display:block;border-radius:var(--ol-surface-radius);overflow:hidden;color:#fff;text-decoration:none;transition:transform .18s;background:var(--ol-surface)}
.ol-root .ol-col-show .ol-col-media{aspect-ratio:16/10}
.ol-root .ol-col-show .ol-col-noimg{color:var(--ol-surface-fg)}
.ol-root .ol-col-show .ol-col-text{position:absolute;inset:auto 0 0 0;padding:32px 16px 14px;background:linear-gradient(transparent,rgba(0,0,0,.72))}
.ol-root .ol-col-show .ol-col-text strong{font-size:1.05em}
.ol-root .ol-col-arrow{position:absolute;top:calc(50% - 40px);width:34px;height:34px;border-radius:50%;border:0;display:grid;place-items:center;cursor:pointer;background:var(--ol-surface);color:var(--ol-surface-fg);box-shadow:0 2px 8px rgba(0,0,0,.25);z-index:2}
.ol-root .ol-col-arrow[hidden]{display:none}
.ol-root .ol-col-prev{left:-6px}.ol-root .ol-col-next{right:-6px}
@media (hover:none){.ol-root .ol-col-arrow{display:none}}`,
};
