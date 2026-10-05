import { imgStyle } from '../util/image.js';
import { button, iconOptions, linkCard } from './_shared.js';
import { esc, safeUrl } from '../util/html.js';

export default {
  type: 'link',
  label: 'Link',
  description: 'A button to any website.',
  icon: 'link',
  category: 'Essentials',
  cssClasses: [
    { selector: '.ol-btn', description: 'Classic link button' },
    { selector: '.ol-featured', description: 'Featured layout (image card)' },
    { selector: '.ol-featured-text', description: 'Text over the featured image' },
  ],
  fields: [
    { key: 'title', type: 'text', label: 'Title', placeholder: 'My website', required: true, max: 100 },
    { key: 'url', type: 'url', label: 'URL', placeholder: 'https://', required: true },
    { key: 'subtitle', type: 'text', label: 'Subtitle', placeholder: 'Optional second line', max: 120 },
    { key: 'layout', type: 'choice', label: 'Layout', default: 'classic', options: [
      { value: 'classic', label: 'Classic' }, { value: 'featured', label: 'Featured' },
    ] },
    { key: 'thumbnail', type: 'image', label: 'Thumbnail', help: 'Shown on the left (classic) or as a cover (featured).' },
    { key: 'thumbnailAdjust', type: 'imageAdjust', label: 'Adjust thumbnail', image: 'thumbnail', frame: 'square', showIf: { key: 'thumbnail', truthy: true } },
    { key: 'icon', type: 'select', label: 'Icon', default: '', options: iconOptions, showIf: { key: 'thumbnail', equals: '' } },
    { key: 'newTab', type: 'toggle', label: 'Open in new tab', default: true },
  ],
  summary: (d) => d.url,
  render(d, ctx) {
    // Inside a Collection with Grid / Carousel / Showcase: card with cover image.
    const parentLayout = ctx.container?.layout;
    if (parentLayout && parentLayout !== 'list') {
      return linkCard({ url: d.url, title: d.title, subtitle: d.subtitle, image: d.thumbnail, adjust: d.thumbnailAdjust }, parentLayout === 'showcase' ? 'show' : 'card', ctx);
    }
    if (d.layout === 'featured' && d.thumbnail) {
      const url = safeUrl(d.url);
      return `<a class="ol-featured" href="${esc(url)}" target="_blank" rel="noopener noreferrer" data-ol-track="${esc(ctx.blockId)}">`
        + `<img src="${esc(d.thumbnail)}" alt="" loading="lazy"${imgStyle(d.thumbnailAdjust) ? ` style="${imgStyle(d.thumbnailAdjust)}"` : ''}><span class="ol-featured-text"><strong>${esc(d.title)}</strong>${d.subtitle ? `<small>${esc(d.subtitle)}</small>` : ''}</span></a>`;
    }
    return button({ href: d.url, label: d.title, sub: d.subtitle, thumb: d.thumbnail, thumbAdjust: d.thumbnailAdjust, iconName: d.icon, newTab: d.newTab, ctx });
  },
  css: `.ol-root .ol-featured{display:block;position:relative;border-radius:var(--ol-btn-radius);overflow:hidden;aspect-ratio:16/9;color:#fff;text-decoration:none;transition:transform .2s}
.ol-root .ol-featured:hover{transform:translateY(-2px)}
.ol-root .ol-featured img{width:100%;height:100%;object-fit:cover;display:block}
.ol-root .ol-featured-text{position:absolute;inset:auto 0 0 0;padding:28px 16px 14px;background:linear-gradient(transparent,rgba(0,0,0,.75));display:flex;flex-direction:column;gap:2px;text-align:left}
.ol-root .ol-featured-text small{opacity:.85}`,
};
