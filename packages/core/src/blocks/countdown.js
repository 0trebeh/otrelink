import { esc } from '../util/html.js';

const units = [['d', 86400000, 'days'], ['h', 3600000, 'hours'], ['m', 60000, 'min'], ['s', 1000, 'sec']];

function parts(ms) {
  let rest = Math.max(0, ms);
  return units.map(([k, size, label]) => {
    const v = Math.floor(rest / size);
    rest -= v * size;
    return { k, v, label };
  });
}

export default {
  type: 'countdown',
  label: 'Countdown',
  description: 'Count down to a launch, drop or event.',
  icon: 'clock',
  category: 'Content',
  cssClasses: [
    { selector: '.ol-countdown', description: 'Card' },
    { selector: '.ol-countdown-grid', description: 'Row of numbers' },
    { selector: '.ol-countdown-grid strong / small', description: 'Number / unit label' },
  ],
  fields: [
    { key: 'title', type: 'text', label: 'Title', default: 'Something big is coming' },
    { key: 'date', type: 'datetime', label: 'Date & time', required: true },
    { key: 'doneText', type: 'text', label: 'Text when finished', default: "It's here! 🎉" },
  ],
  summary: (d) => (d.date ? new Date(d.date).toLocaleString() : 'No date'),
  render(d) {
    const ms = new Date(d.date).getTime() - Date.now();
    const cells = parts(ms).map((p) => `<div><strong data-u="${p.k}">${String(p.v).padStart(2, '0')}</strong><small>${p.label}</small></div>`).join('');
    return `<div class="ol-card ol-countdown" data-date="${esc(d.date)}" data-done="${esc(d.doneText)}">`
      + `${d.title ? `<p>${esc(d.title)}</p>` : ''}<div class="ol-countdown-grid">${ms > 0 ? cells : `<span>${esc(d.doneText)}</span>`}</div></div>`;
  },
  // Runs in the browser after render. Keep it dependency free.
  hydrate(el) {
    const box = el.querySelector('.ol-countdown');
    if (!box) return;
    const target = new Date(box.dataset.date).getTime();
    const tick = () => {
      if (!box.isConnected) return clearInterval(timer);
      const ms = target - Date.now();
      if (ms <= 0) {
        box.querySelector('.ol-countdown-grid').textContent = box.dataset.done;
        return clearInterval(timer);
      }
      for (const p of parts(ms)) {
        const n = box.querySelector(`[data-u="${p.k}"]`);
        if (n) n.textContent = String(p.v).padStart(2, '0');
      }
    };
    const timer = setInterval(tick, 1000);
  },
  css: `.ol-root .ol-countdown{text-align:center;padding:16px}
.ol-root .ol-countdown p{margin:0 0 10px;font-weight:600}
.ol-root .ol-countdown-grid{display:flex;justify-content:center;gap:10px}
.ol-root .ol-countdown-grid div{display:flex;flex-direction:column;min-width:56px}
.ol-root .ol-countdown-grid strong{font-size:1.7em;font-family:var(--ol-title-font);font-variant-numeric:tabular-nums}
.ol-root .ol-countdown-grid small{opacity:.7;font-size:.75em;text-transform:uppercase;letter-spacing:.06em}`,
};
