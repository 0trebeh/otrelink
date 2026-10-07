'use client';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { countryName, flag } from './geo';

const COLOR = { views: '#7a2cf0', clicks: '#0e9f8f' };

/**
 * Map of visits or clicks (OpenStreetMap tiles, no API key). Each circle is a
 * place (~1 km); its size grows with the count. Based on the tinyURL map.
 */
export default function VisitMap({ points, metric }) {
  const box = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);
  const fitted = useRef(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const L = (await import('leaflet')).default;
      if (!alive || !box.current) return;
      if (!map.current) {
        map.current = L.map(box.current, { worldCopyJump: true, scrollWheelZoom: false, attributionControl: true }).setView([20, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
        }).addTo(map.current);
        layer.current = L.layerGroup().addTo(map.current);
        map.current.on('focus', () => map.current.scrollWheelZoom.enable());
        map.current.on('blur', () => map.current.scrollWheelZoom.disable());
      }
      layer.current.clearLayers();
      const pts = points.filter((p) => p[metric] > 0);
      const max = Math.max(1, ...pts.map((p) => p[metric]));
      const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
      [...pts].sort((a, b) => a[metric] - b[metric]).forEach((p) => {
        const n = p[metric];
        const radius = 6 + 16 * Math.sqrt(n / max);
        const place = p.city || countryName(p.cc) || '';
        L.circleMarker([p.lat, p.lon], { radius, color: '#ffffff', weight: 2, fillColor: COLOR[metric], fillOpacity: p.approx ? 0.45 : 0.78, dashArray: p.approx ? '3 3' : null })
          .bindPopup(
            `<div style="font:13px/1.4 system-ui,sans-serif;min-width:150px"><b>${flag(p.cc)} ${esc(place || '—')}</b><br>`
            + `<span style="opacity:.75">${esc([p.region, countryName(p.cc)].filter(Boolean).join(', '))}</span>`
            + `<div style="margin-top:6px"><b>${p.views}</b> visit${p.views === 1 ? '' : 's'} · <b>${p.clicks}</b> click${p.clicks === 1 ? '' : 's'}</div>`
            + (p.approx ? '<div style="opacity:.6;font-size:12px;margin-top:4px">≈ estimated from the time zone</div>' : '')
            + '</div>',
          )
          .bindTooltip(`${place}: ${n}`, { direction: 'top', offset: [0, -radius] })
          .addTo(layer.current);
      });
      map.current.invalidateSize();
      if (!fitted.current && pts.length) {
        fitted.current = true;
        if (pts.length === 1) map.current.setView([pts[0].lat, pts[0].lon], 6);
        else map.current.fitBounds(L.latLngBounds(pts.map((p) => [p.lat, p.lon])).pad(0.25), { maxZoom: 8 });
      }
    })();
    return () => { alive = false; };
  }, [points, metric]);

  useEffect(() => () => { map.current?.remove(); map.current = null; }, []);

  return <div ref={box} className="ol-visit-map h-80 sm:h-96 rounded-2xl overflow-hidden border border-line/70 isolate" role="region" aria-label={`Map of ${metric}`} tabIndex={0} />;
}
