// Banner block: a wide card with a background image (or color / gradient),
// a title, a short text and an optional button. With a link, the whole
// banner is clickable.
import { esc, safeUrl } from '../util/html.js';
import { imgStyle } from '../util/image.js';
import { icon } from '../icons.js';

const RATIOS = [
  { value: '3 / 1', label: 'Wide (3:1)' },
  { value: '2 / 1', label: 'Landscape (2:1)' },
  { value: '16 / 9', label: 'Video (16:9)' },
  { value: '4 / 3', label: 'Classic (4:3)' },
  { value: '1 / 1', label: 'Square' },
  { value: '4 / 5', label: 'Portrait (4:5)' },
  { value: 'auto', label: 'Fit the text' },
];

export default {
  type: 'banner',
  label: 'Banner',
  description: 'A wide card with an image or color, a title and a button.',
  icon: 'banner',
  category: 'Media',
  cssClasses: [
    { selector: '.ol-banner', description: 'The banner (a link when it has one)' },
    { selector: '.ol-banner-bg', description: 'Background image' },
    { selector: '.ol-banner-shade', description: 'Dark layer over the image' },
    { selector: '.ol-banner-body', description: 'Text area' },
    { selector: '.ol-banner-eyebrow', description: 'Small label above the title' },
    { selector: '.ol-banner-title', description: 'Title' },
    { selector: '.ol-banner-text', description: 'Text' },
    { selector: '.ol-banner-btn', description: 'Button' },
  ],
  fields: [
    { key: 'eyebrow', type: 'text', label: 'Small label (optional)', max: 40, placeholder: 'NEW · 20% OFF' },
    { key: 'title', type: 'text', label: 'Title', max: 120, default: 'Your big announcement' },
    { key: 'text', type: 'textarea', label: 'Text (optional)', max: 300, placeholder: 'One or two lines about it' },
    { key: 'url', type: 'url', label: 'Link (optional)', help: 'The whole banner opens this link.' },
    { key: 'buttonLabel', type: 'text', label: 'Button text (optional)', max: 40, placeholder: 'Learn more', showIf: { key: 'url', truthy: true } },
    { key: 'image', type: 'image', label: 'Background image (optional)' },
    { key: 'alt', type: 'text', label: 'Image description', help: 'For screen readers. Leave empty if the image is only decoration.', showIf: { key: 'image', truthy: true } },
    { key: 'ratio', type: 'select', label: 'Shape', default: '2 / 1', options: RATIOS },
    { key: 'adjust', type: 'imageAdjust', label: 'Adjust image', image: 'image', frame: 'ratio', showIf: { key: 'image', truthy: true } },
    { key: 'shade', type: 'range', label: 'Darken image', min: 0, max: 80, step: 5, default: 35, unit: '%', showIf: { key: 'image', truthy: true },
      help: 'Makes the text easier to read over the image.' },
    { key: 'bgColor', type: 'color', label: 'Background color', default: '#1f2937' },
    { key: 'gradient', type: 'toggle', label: 'Gradient', default: false },
    { key: 'bgColor2', type: 'color', label: 'Second color', default: '#7c3aed', showIf: { key: 'gradient', truthy: true } },
    { key: 'textColor', type: 'color', label: 'Text color', default: '#ffffff' },
    { key: 'align', type: 'select', label: 'Text alignment', default: 'left', options: [
      { value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' },
    ] },
    { key: 'position', type: 'select', label: 'Text position', default: 'bottom', showIf: { key: 'ratio', notEquals: 'auto' }, options: [
      { value: 'top', label: 'Top' }, { value: 'center', label: 'Middle' }, { value: 'bottom', label: 'Bottom' },
    ] },
  ],
  summary: (d) => d.title || d.eyebrow || 'Banner',
  render(d, ctx) {
    const url = safeUrl(d.url);
    const bg = d.gradient ? `linear-gradient(135deg,${d.bgColor},${d.bgColor2})` : d.bgColor;
    const style = [`--ol-banner-fg:${d.textColor}`, `--ol-banner-bg:${d.bgColor}`, `background:${bg}`,
      d.ratio !== 'auto' && `aspect-ratio:${d.ratio}`].filter(Boolean).join(';');
    const cls = `ol-banner al-${d.align} at-${d.ratio === 'auto' ? 'auto' : d.position}${d.image ? ' has-image' : ''}`;
    const img = d.image
      ? `<img class="ol-banner-bg" src="${esc(d.image)}" alt="${esc(d.alt)}" loading="lazy" style="${imgStyle({ ...d.adjust, fit: d.adjust?.fit === 'contain' ? 'contain' : 'cover' })}">`
        + (d.shade ? `<span class="ol-banner-shade" style="opacity:${d.shade / 100}"></span>` : '')
      : '';
    const body = '<span class="ol-banner-body">'
      + (d.eyebrow ? `<span class="ol-banner-eyebrow">${esc(d.eyebrow)}</span>` : '')
      + (d.title ? `<span class="ol-banner-title">${esc(d.title)}</span>` : '')
      + (d.text ? `<span class="ol-banner-text">${esc(d.text)}</span>` : '')
      + (url && d.buttonLabel ? `<span class="ol-banner-btn">${esc(d.buttonLabel)}${icon('arrowRight', 16)}</span>` : '')
      + '</span>';
    return url
      ? `<a class="${cls}" style="${style}" href="${esc(url)}" target="_blank" rel="noopener noreferrer" data-ol-track="${esc(ctx.blockId)}">${img}${body}</a>`
      : `<div class="${cls}" style="${style}">${img}${body}</div>`;
  },
  css: `.ol-root .ol-banner{position:relative;display:flex;flex-direction:column;overflow:hidden;isolation:isolate;border-radius:var(--ol-surface-radius);color:var(--ol-banner-fg)!important;text-decoration:none;min-height:96px;box-shadow:0 1px 2px rgba(0,0,0,.08)}
.ol-root a.ol-banner{transition:transform .2s ease,box-shadow .2s ease}
.ol-root a.ol-banner:hover{transform:translateY(-2px);box-shadow:0 10px 24px -12px rgba(0,0,0,.45)}
.ol-root a.ol-banner:focus-visible{outline:3px solid var(--ol-banner-fg);outline-offset:-6px}
.ol-root .ol-banner.at-top{justify-content:flex-start}
.ol-root .ol-banner.at-center{justify-content:center}
.ol-root .ol-banner.at-bottom{justify-content:flex-end}
.ol-root .ol-banner.at-auto{justify-content:center;min-height:72px}
.ol-root .ol-banner.has-image .ol-banner-body{text-shadow:0 1px 10px rgba(0,0,0,.3)}
.ol-root .ol-banner-bg{position:absolute;inset:0;width:100%;height:100%;z-index:-2;display:block;border-radius:0}
.ol-root .ol-banner-shade{position:absolute;inset:0;z-index:-1;background:#000}
.ol-root .ol-banner-body{display:flex;flex-direction:column;gap:6px;padding:18px 20px;text-align:left;align-items:flex-start;line-height:1.3}
.ol-root .ol-banner.al-center .ol-banner-body{text-align:center;align-items:center}
.ol-root .ol-banner.al-right .ol-banner-body{text-align:right;align-items:flex-end}
.ol-root .ol-banner-eyebrow{font-size:.7em;font-weight:800;letter-spacing:.08em;text-transform:uppercase;opacity:.85}
.ol-root .ol-banner-title{font-family:var(--ol-title-font);font-weight:800;font-size:1.3em;line-height:1.15;text-wrap:balance}
.ol-root .ol-banner-text{font-size:.9em;opacity:.9;white-space:pre-line;text-wrap:pretty}
.ol-root .ol-banner-btn{margin-top:6px;display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:999px;font-weight:700;font-size:.9em;background:var(--ol-banner-fg);color:var(--ol-banner-bg);text-shadow:none}
.ol-root .ol-banner-btn svg{transition:transform .2s ease}
.ol-root a.ol-banner:hover .ol-banner-btn svg{transform:translateX(3px)}
@media (prefers-reduced-motion:reduce){.ol-root a.ol-banner,.ol-root a.ol-banner:hover{transform:none}}`,
};
