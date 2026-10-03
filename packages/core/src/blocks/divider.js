export default {
  type: 'divider',
  label: 'Divider',
  description: 'A line or empty space between blocks.',
  icon: 'divider',
  category: 'Content',
  cssClasses: [
    { selector: '.ol-divider', description: 'Line (hr)' },
    { selector: '.ol-divider-dots', description: 'Dots variant' },
  ],
  fields: [
    { key: 'style', type: 'select', label: 'Style', default: 'line', options: [
      { value: 'line', label: 'Line' }, { value: 'dashed', label: 'Dashed' }, { value: 'dots', label: 'Dots' }, { value: 'space', label: 'Empty space' },
    ] },
    { key: 'size', type: 'range', label: 'Spacing', min: 0, max: 80, default: 12, unit: 'px' },
    { key: 'width', type: 'range', label: 'Width', min: 10, max: 100, step: 5, default: 60, unit: '%' },
  ],
  summary: (d) => d.style,
  render(d) {
    const pad = `padding:${d.size}px 0`;
    if (d.style === 'space') return `<div style="${pad}" aria-hidden="true"></div>`;
    if (d.style === 'dots') return `<div class="ol-divider-dots" style="${pad}" aria-hidden="true">• • •</div>`;
    return `<div style="${pad}" aria-hidden="true"><hr class="ol-divider" style="width:${d.width}%;border-top-style:${d.style === 'dashed' ? 'dashed' : 'solid'}"></div>`;
  },
  css: `.ol-root .ol-divider{border:0;border-top:1px solid currentColor;opacity:.35;margin:0 auto}
.ol-root .ol-divider-dots{text-align:center;letter-spacing:.4em;opacity:.6}`,
};
