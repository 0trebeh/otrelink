// Collection: a titled group of links shown as a list, grid, carousel or
// showcase. In "Button" mode the whole collection is a button that expands.
import { esc, safeUrl } from '../util/html.js';
import { icon } from '../icons.js';
import { button } from './_shared.js';

const LAYOUTS = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'showcase', label: 'Showcase' },
];

/** <a> when the item has a URL, <div> otherwise. */
function wrap(tag, cls, url, ctx, inner) {
  return url
    ? `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer" data-ol-track="${esc(ctx.blockId)}">${inner}</a>`
    : `<div class="${cls}">${inner}</div>`;
}

function media(item, cls) {
  const img = safeUrl(item.image);
  return img
    ? `<span class="${cls}"><img src="${esc(img)}" alt="" loading="lazy"></span>`
    : `<span class="${cls} ol-col-noimg" aria-hidden="true">${esc((item.title || '?').trim().charAt(0).toUpperCase())}</span>`;
}

function renderItem(item, layout, ctx) {
  const url = safeUrl(item.url);
  if (layout === 'list') {
    return button({ href: url, label: item.title, sub: item.subtitle, thumb: safeUrl(item.image), ctx });
  }
  const text = `<span class="ol-col-text"><strong>${esc(item.title)}</strong>${item.subtitle ? `<small>${esc(item.subtitle)}</small>` : ''}</span>`;
  if (layout === 'showcase') return wrap('a', 'ol-col-show', url, ctx, media(item, 'ol-col-media') + text);
  return wrap('a', 'ol-col-card', url, ctx, media(item, 'ol-col-media') + text);
}

export default {
  type: 'collection',
  label: 'Collection',
  description: 'A group of links shown as a list, grid, carousel or showcase. Can open from a button.',
  icon: 'collection',
  category: 'Essentials',
  cssClasses: [
    { selector: '.ol-collection', description: 'Wrapper (a details element in Button mode, [open] when expanded)' },
    { selector: '.ol-col-header', description: 'Title and description (Open mode)' },
    { selector: '.ol-collection > .ol-btn', description: 'The button that expands the collection (Button mode)' },
    { selector: '.ol-col-count', description: 'Number of links shown on the button' },
    { selector: '.ol-col-items', description: 'Items container. Also .ol-col-list / -grid / -carousel / -showcase' },
    { selector: '.ol-col-card', description: 'One item in Grid and Carousel' },
    { selector: '.ol-col-show', description: 'One item in Showcase' },
    { selector: '.ol-col-media', description: 'Item image (or initial when there is no image)' },
    { selector: '.ol-col-text', description: 'Item title (strong) and subtitle (small)' },
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
    { key: 'items', type: 'list', label: 'Links', itemLabel: 'link', max: 30, fields: [
      { key: 'title', type: 'text', label: 'Title', required: true, max: 100 },
      { key: 'url', type: 'url', label: 'URL', placeholder: 'https://' },
      { key: 'subtitle', type: 'text', label: 'Subtitle', max: 120 },
      { key: 'image', type: 'image', label: 'Image', help: 'Used as thumbnail (List) or cover (Grid, Carousel, Showcase).' },
    ], default: [
      { id: 'c1', title: 'First link', url: '', subtitle: '', image: '' },
      { id: 'c2', title: 'Second link', url: '', subtitle: '', image: '' },
      { id: 'c3', title: 'Third link', url: '', subtitle: '', image: '' },
    ] },
  ],
  summary: (d) => `${LAYOUTS.find((l) => l.value === d.layout)?.label || 'List'} · ${d.items.length} link${d.items.length === 1 ? '' : 's'}${d.mode === 'button' ? ' · button' : ''}`,
  render(d, ctx) {
    const items = d.items.filter((it) => it.title || it.image);
    const list = items.length
      ? items.map((it) => renderItem(it, d.layout, ctx)).join('')
      : '<div class="ol-card">Add links to this collection</div>';
    const arrows = d.layout === 'carousel'
      ? `<button type="button" class="ol-col-arrow ol-col-prev" aria-label="Previous">${icon('arrowLeft', 18)}</button><button type="button" class="ol-col-arrow ol-col-next" aria-label="Next">${icon('arrowRight', 18)}</button>`
      : '';
    const body = `<div class="ol-col-wrap"><div class="ol-col-items ol-col-${d.layout}" style="--cols:${d.columns}">${list}</div>${arrows}</div>`;

    if (d.mode === 'button') {
      return `<details class="ol-collection ol-col-collapsible"${d.startOpen ? ' open' : ''}>`
        + `<summary class="ol-btn has-media" data-ol-track="${esc(ctx.blockId)}"><span class="ol-btn-icon">${icon('collection', 20)}</span>`
        + `<span class="ol-btn-label"><span class="ol-btn-title">${esc(d.title || 'Collection')}</span>${d.description ? `<span class="ol-btn-sub">${esc(d.description)}</span>` : ''}</span>`
        + `<span class="ol-col-count">${items.length}</span><span class="ol-btn-icon ol-col-chevron">${icon('chevron', 18)}</span></summary>`
        + `<div class="ol-col-body">${body}</div></details>`;
    }
    const header = d.title || d.description
      ? `<div class="ol-col-header">${d.title ? `<h3>${esc(d.title)}</h3>` : ''}${d.description ? `<p>${esc(d.description)}</p>` : ''}</div>`
      : '';
    return `<div class="ol-collection">${header}${body}</div>`;
  },
  // Carousel arrows (only useful with a mouse; touch users swipe).
  hydrate(el) {
    const track = el.querySelector('.ol-col-carousel');
    if (!track) return;
    const prev = el.querySelector('.ol-col-prev');
    const next = el.querySelector('.ol-col-next');
    const step = () => (track.firstElementChild?.getBoundingClientRect().width || 200) + 10;
    const update = () => {
      const max = track.scrollWidth - track.clientWidth - 2;
      prev.hidden = track.scrollLeft <= 2;
      next.hidden = track.scrollLeft >= max;
    };
    prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
    track.addEventListener('scroll', update, { passive: true });
    // Re-check when a collapsed collection opens.
    el.querySelector('details')?.addEventListener('toggle', update);
    update();
  },
  css: `.ol-root .ol-collection>summary{list-style:none}
.ol-root .ol-collection>summary::-webkit-details-marker{display:none}
.ol-root .ol-col-chevron{transition:transform .2s}
.ol-root .ol-collection[open] .ol-col-chevron{transform:rotate(180deg)}
.ol-root .ol-col-count{font-size:.75em;font-weight:700;min-width:24px;height:24px;padding:0 7px;border-radius:999px;display:inline-grid;place-items:center;background:color-mix(in srgb,currentColor 14%,transparent)}
.ol-root .ol-col-body{padding-top:var(--ol-gap);animation:ol-col-in .22s ease}
@keyframes ol-col-in{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
.ol-root .ol-col-header{text-align:center;margin:6px 0 10px}
.ol-root .ol-col-header h3{margin:0;font-family:var(--ol-title-font);color:var(--ol-title-color);font-weight:var(--ol-title-weight);font-size:1.15em}
.ol-root .ol-col-header p{margin:4px 0 0;opacity:.8;font-size:.9em}
.ol-root .ol-col-wrap{position:relative}
.ol-root .ol-col-list{display:flex;flex-direction:column;gap:var(--ol-gap)}
.ol-root .ol-col-grid{display:grid;grid-template-columns:repeat(var(--cols),minmax(0,1fr));gap:10px}
.ol-root .ol-col-carousel{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding-bottom:2px}
.ol-root .ol-col-carousel::-webkit-scrollbar{display:none}
.ol-root .ol-col-carousel>*{flex:0 0 68%;scroll-snap-align:start}
.ol-root .ol-col-showcase{display:flex;flex-direction:column;gap:var(--ol-gap)}
.ol-root .ol-col-card{display:flex;flex-direction:column;background:var(--ol-surface);color:var(--ol-surface-fg);border-radius:var(--ol-surface-radius);overflow:hidden;text-decoration:none;transition:transform .18s}
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
.ol-root .ol-col-arrow{position:absolute;top:calc(50% - 40px);width:34px;height:34px;border-radius:50%;border:0;display:grid;place-items:center;cursor:pointer;background:var(--ol-surface);color:var(--ol-surface-fg);box-shadow:0 2px 8px rgba(0,0,0,.25)}
.ol-root .ol-col-arrow[hidden]{display:none}
.ol-root .ol-col-prev{left:-6px}.ol-root .ol-col-next{right:-6px}
@media (hover:none){.ol-root .ol-col-arrow{display:none}}`,
};
