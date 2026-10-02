const patterns = {
  dots: (fg, s) => `radial-gradient(${fg} 1.5px,transparent 1.6px) 0 0/${s}px ${s}px`,
  grid: (fg, s) => `linear-gradient(${fg} 1px,transparent 1px) 0 0/${s}px ${s}px,linear-gradient(90deg,${fg} 1px,transparent 1px) 0 0/${s}px ${s}px`,
  stripes: (fg, s) => `repeating-linear-gradient(45deg,${fg} 0 ${s / 4}px,transparent ${s / 4}px ${s / 2}px)`,
  checks: (fg, s) => `conic-gradient(${fg} 25%,transparent 0 50%,${fg} 0 75%,transparent 0) 0 0/${s}px ${s}px`,
  zigzag: (fg, s) => `linear-gradient(135deg,${fg} 25%,transparent 25%) -${s / 2}px 0/${s}px ${s}px,linear-gradient(225deg,${fg} 25%,transparent 25%) -${s / 2}px 0/${s}px ${s}px,linear-gradient(315deg,${fg} 25%,transparent 25%) 0 0/${s}px ${s}px,linear-gradient(45deg,${fg} 25%,transparent 25%) 0 0/${s}px ${s}px`,
};

export default {
  id: 'pattern',
  label: 'Pattern',
  fields: [
    { key: 'pattern', type: 'select', label: 'Pattern', default: 'dots', options: Object.keys(patterns) },
    { key: 'bg', type: 'color', label: 'Background', default: '#fdf6ec' },
    { key: 'fg', type: 'color', label: 'Pattern color', default: '#e8d8bf' },
    { key: 'size', type: 'range', label: 'Size', min: 8, max: 80, step: 2, default: 22 },
  ],
  css: (w, sel) => `${sel}{background:${(patterns[w.pattern] || patterns.dots)(w.fg, w.size)},${w.bg}}`,
};
