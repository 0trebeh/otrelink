// Animated blurred color blobs.
export default {
  id: 'aurora',
  label: 'Aurora',
  fields: [
    { key: 'bg', type: 'color', label: 'Background', default: '#0d0b1f' },
    { key: 'c1', type: 'color', label: 'Color 1', default: '#7c3aed' },
    { key: 'c2', type: 'color', label: 'Color 2', default: '#06b6d4' },
    { key: 'c3', type: 'color', label: 'Color 3', default: '#ec4899' },
    { key: 'speed', type: 'range', label: 'Speed (s per loop)', min: 6, max: 60, default: 18 },
  ],
  css: (w, sel) =>
    `${sel}{background:${w.bg}}`
    + `${sel}::before{content:"";position:absolute;inset:-30%;background:radial-gradient(closest-side at 25% 30%,${w.c1},transparent),radial-gradient(closest-side at 75% 35%,${w.c2},transparent),radial-gradient(closest-side at 50% 80%,${w.c3},transparent);filter:blur(40px);opacity:.75;animation:ol-aurora ${w.speed}s ease-in-out infinite alternate}`
    + '@keyframes ol-aurora{0%{transform:rotate(0) scale(1)}50%{transform:rotate(25deg) scale(1.15)}100%{transform:rotate(-15deg) scale(1.05)}}'
    + '@media (prefers-reduced-motion:reduce){.ol-bg::before{animation:none}}',
};
