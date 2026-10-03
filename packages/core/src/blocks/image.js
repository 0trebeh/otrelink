import { esc, safeUrl } from '../util/html.js';

export default {
  type: 'image',
  label: 'Image',
  description: 'A picture, optionally linked.',
  icon: 'image',
  category: 'Media',
  cssClasses: [
    { selector: '.ol-image', description: 'figure wrapper' },
    { selector: '.ol-image img', description: 'The image' },
    { selector: '.ol-image figcaption', description: 'Caption' },
  ],
  fields: [
    { key: 'image', type: 'image', label: 'Image', required: true },
    { key: 'alt', type: 'text', label: 'Alt text', help: 'Describes the image for screen readers.' },
    { key: 'caption', type: 'text', label: 'Caption' },
    { key: 'url', type: 'url', label: 'Link (optional)' },
    { key: 'ratio', type: 'select', label: 'Shape', default: 'auto', options: [
      { value: 'auto', label: 'Original' }, { value: '1 / 1', label: 'Square' }, { value: '4 / 5', label: 'Portrait' }, { value: '16 / 9', label: 'Wide' },
    ] },
  ],
  summary: (d) => d.caption || d.alt || 'Image',
  render(d, ctx) {
    const style = d.ratio !== 'auto' ? ` style="aspect-ratio:${d.ratio};object-fit:cover"` : '';
    let img = `<img src="${esc(d.image)}" alt="${esc(d.alt)}" loading="lazy"${style}>`;
    const url = safeUrl(d.url);
    if (url) img = `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" data-ol-track="${esc(ctx.blockId)}">${img}</a>`;
    return `<figure class="ol-image">${img}${d.caption ? `<figcaption>${esc(d.caption)}</figcaption>` : ''}</figure>`;
  },
  css: `.ol-root .ol-image{margin:0}.ol-root .ol-image img{width:100%;display:block;border-radius:var(--ol-surface-radius)}
.ol-root .ol-image figcaption{font-size:.85em;opacity:.8;margin-top:6px;text-align:center}`,
};
