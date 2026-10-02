// Solid or two-tone color with film grain on top.
const noise = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>";

export default {
  id: 'grain',
  label: 'Grain',
  fields: [
    { key: 'from', type: 'color', label: 'Top color', default: '#3a3a3a' },
    { key: 'to', type: 'color', label: 'Bottom color', default: '#1c1c1c' },
    { key: 'amount', type: 'range', label: 'Grain', min: 0, max: 60, step: 5, default: 25 },
  ],
  css: (w, sel) =>
    `${sel}{background:radial-gradient(ellipse at 50% 20%,${w.from},${w.to})}`
    + `${sel}::after{content:"";position:absolute;inset:0;background:url("${noise}");opacity:${w.amount / 100};mix-blend-mode:overlay}`,
};
