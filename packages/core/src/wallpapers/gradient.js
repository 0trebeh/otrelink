export default {
  id: 'gradient',
  label: 'Gradient',
  fields: [
    { key: 'kind', type: 'select', label: 'Type', default: 'linear', options: [
      { value: 'linear', label: 'Linear' }, { value: 'radial', label: 'Radial' }, { value: 'conic', label: 'Conic' },
    ] },
    { key: 'from', type: 'color', label: 'From', default: '#7c3aed' },
    { key: 'via', type: 'color', label: 'Middle (optional)', default: 'transparent' },
    { key: 'to', type: 'color', label: 'To', default: '#ec4899' },
    { key: 'angle', type: 'range', label: 'Angle', min: 0, max: 360, step: 5, default: 160, showIf: { key: 'kind', notEquals: 'radial' } },
  ],
  css: (w, sel) => {
    const stops = [w.from, w.via !== 'transparent' ? w.via : null, w.to].filter(Boolean).join(',');
    const g = w.kind === 'radial'
      ? `radial-gradient(circle at 50% 0%,${stops})`
      : w.kind === 'conic'
        ? `conic-gradient(from ${w.angle}deg at 50% 40%,${stops},${w.from})`
        : `linear-gradient(${w.angle}deg,${stops})`;
    return `${sel}{background:${g}}`;
  },
};
