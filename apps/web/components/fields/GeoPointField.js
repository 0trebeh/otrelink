'use client';
// A point on the map (Map block → Styled map), found from the address field
// with OpenStreetMap search (Nominatim). The numbers can be fixed by hand.
import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin, Search } from 'lucide-react';
import { Button, Input } from '../ui';

async function geocode(q) {
  const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`, {
    headers: { 'Accept-Language': navigator.language || 'en' },
  });
  if (!r.ok) throw new Error('search_failed');
  const [hit] = await r.json();
  return hit ? { lat: Math.round(Number(hit.lat) * 1e6) / 1e6, lon: Math.round(Number(hit.lon) * 1e6) / 1e6, label: hit.display_name || '' } : null;
}

export default function GeoPointField({ id, value, onChange, field, values }) {
  const address = String(values?.[field.address] || '').trim();
  const point = value && Number.isFinite(value.lat) && Number.isFinite(value.lon) ? value : null;
  const [state, setState] = useState(''); // '' | 'searching' | 'notfound' | 'error'
  const latest = useRef(address);
  latest.current = address;

  const find = async (q = address) => {
    if (!q) return;
    setState('searching');
    try {
      const hit = await geocode(q);
      if (latest.current !== q) return; // the address changed meanwhile
      if (!hit) { setState('notfound'); return; }
      onChange({ ...hit, query: q });
      setState('');
    } catch { setState('error'); }
  };

  // Find it on its own when the address changes (and the point wasn't found from it).
  useEffect(() => {
    if (!address || point?.query === address) return undefined;
    const t = setTimeout(() => find(address), 1200);
    return () => clearTimeout(t);
  }, [address]); // eslint-disable-line react-hooks/exhaustive-deps

  const setNum = (k, v) => onChange({ ...(point || { lat: 0, lon: 0 }), [k]: v === '' ? '' : Number(v), query: point?.query || address, label: point?.label || '' });

  return (
    <div id={id} className="rounded-2xl border border-line p-3 grid gap-2">
      <div className="flex items-start gap-2 text-sm">
        {state === 'searching' ? <Loader2 size={16} className="animate-spin shrink-0 mt-0.5 text-muted" /> : <MapPin size={16} className="shrink-0 mt-0.5 text-accent" />}
        <p className="min-w-0 flex-1">
          {state === 'searching' ? <span className="text-muted">Finding the address…</span>
            : state === 'notfound' ? <span className="text-danger">The address was not found. Write it with the city and country, or type the numbers below.</span>
              : state === 'error' ? <span className="text-danger">The search didn’t answer. Try again in a moment.</span>
                : point ? <span className="line-clamp-2">{point.label || `${point.lat}, ${point.lon}`}</span>
                  : <span className="text-muted">Write an address above to find it.</span>}
        </p>
        <Button size="sm" onClick={() => find()} disabled={!address || state === 'searching'}><Search size={14} /> Find</Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-muted">Latitude<Input type="number" step="0.000001" min={-90} max={90} value={point?.lat ?? ''} onChange={(e) => setNum('lat', e.target.value)} className="h-9 mt-1" /></label>
        <label className="text-xs text-muted">Longitude<Input type="number" step="0.000001" min={-180} max={180} value={point?.lon ?? ''} onChange={(e) => setNum('lon', e.target.value)} className="h-9 mt-1" /></label>
      </div>
      {point && <a href={`https://www.openstreetmap.org/?mlat=${point.lat}&mlon=${point.lon}#map=17/${point.lat}/${point.lon}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-accent-ink hover:underline justify-self-start">Check it on OpenStreetMap ↗</a>}
    </div>
  );
}
