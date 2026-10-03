import { esc, safeUrl } from '../util/html.js';

export default {
  type: 'gallery',
  label: 'Gallery',
  description: 'A grid or swipeable carousel of images.',
  icon: 'images',
  category: 'Media',
  cssClasses: [
    { selector: '.ol-gallery', description: 'Wrapper' },
    { selector: '.ol-gallery-grid / .ol-gallery-carousel', description: 'Layout variants' },
    { selector: '.ol-gallery figure', description: 'One image + caption' },
  ],
  fields: [
    { key: 'layout', type: 'choice', label: 'Layout', default: 'carousel', options: [
      { value: 'carousel', label: 'Carousel' }, { value: 'grid', label: 'Grid' },
    ] },
    { key: 'columns', type: 'range', label: 'Columns', min: 2, max: 4, default: 2, showIf: { key: 'layout', equals: 'grid' } },
    { key: 'items', type: 'list', label: 'Images', itemLabel: 'image', max: 24, fields: [
      { key: 'image', type: 'image', label: 'Image', required: true },
      { key: 'caption', type: 'text', label: 'Caption' },
      { key: 'url', type: 'url', label: 'Link (optional)' },
    ], default: [] },
  ],
  summary: (d) => `${d.items.length} image${d.items.length === 1 ? '' : 's'}`,
  render(d, ctx) {
    const items = d.items.filter((it) => it.image).map((it) => {
      const img = `<img src="${esc(it.image)}" alt="${esc(it.caption)}" loading="lazy">`;
      const url = safeUrl(it.url);
      const body = url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" data-ol-track="${esc(ctx.blockId)}">${img}</a>` : img;
      return `<figure>${body}${it.caption ? `<figcaption>${esc(it.caption)}</figcaption>` : ''}</figure>`;
    }).join('');
    if (!items) return '<div class="ol-card">Add images to your gallery</div>';
    return `<div class="ol-gallery ol-gallery-${d.layout}" style="--cols:${d.columns}">${items}</div>`;
  },
  css: `.ol-root .ol-gallery figure{margin:0}.ol-root .ol-gallery img{width:100%;aspect-ratio:1;object-fit:cover;display:block;border-radius:var(--ol-surface-radius)}
.ol-root .ol-gallery figcaption{font-size:.8em;opacity:.8;margin-top:4px;text-align:center}
.ol-root .ol-gallery-grid{display:grid;grid-template-columns:repeat(var(--cols),1fr);gap:8px}
.ol-root .ol-gallery-carousel{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:6px;scrollbar-width:thin}
.ol-root .ol-gallery-carousel figure{flex:0 0 72%;scroll-snap-align:center}`,
};
