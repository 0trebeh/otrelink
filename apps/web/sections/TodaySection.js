'use client';
// "Today": what changes during the day, saved right away (no need to press Save):
// open / closed, where you are, taking orders, and products sold out today.
import { useMemo, useState } from 'react';
import { LocateFixed, Loader2, MapPin, X, Search } from 'lucide-react';
import { flattenBlocks, sanitizeBlock, productKey, statusInfo, locationNow, formatMinutes, pageLocale } from '@otrelink/core';
import { api, errorMessage } from '@/lib/client';
import { Panel, Button, Input, Toggle, cx } from '@/components/ui';

const STATUS_OPTIONS = [
  { value: 'auto', label: 'Automatic', help: 'Follows the hours of your Open / Closed block.' },
  { value: 'open', label: 'Open now' },
  { value: 'closed', label: 'Closed now' },
];
const EMPTY = { status: 'auto', place: '', address: '', lat: null, lon: null, note: '', until: '', soldOut: [], ordersPaused: false };
const toMin = (t) => { const m = String(t || '').match(/^(\d{1,2}):(\d{2})$/); return m ? Number(m[1]) * 60 + Number(m[2]) : 0; };

export default function TodaySection({ ed }) {
  const { page } = ed;
  const today = { ...EMPTY, ...(ed.today || {}) };
  const blocks = useMemo(() => flattenBlocks(page.blocks).map((b) => sanitizeBlock(b)), [page.blocks]);
  const statusBlock = blocks.find((b) => b.type === 'status' && b.enabled);
  const locationBlock = blocks.find((b) => b.type === 'location' && b.enabled);
  const catalogs = blocks.filter((b) => b.type === 'catalog' && (b.data.products || []).some((p) => p.name));
  const takesOrders = catalogs.some((b) => b.data.ordering === 'pickup' && b.enabled);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');

  // Save a part of "Today" (optimistic: the preview changes at once).
  const patch = async (part, key = 'x') => {
    const before = ed.today;
    ed.setToday({ ...today, ...part });
    setBusy(key);
    setErr('');
    try {
      const r = await api(`/api/pages/${page.id}/today`, { method: 'PATCH', body: part });
      ed.setToday(r.today);
      return true;
    } catch (e) {
      ed.setToday(before);
      setErr(errorMessage(e));
      return false;
    } finally { setBusy(''); }
  };

  const shown = statusBlock ? statusInfo(statusBlock.data, { ...page, today }) : null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Today</h1>
        <p className="text-sm text-muted mt-1">Changes here go live right away, without pressing Save.</p>
        {err && <p className="text-sm text-danger mt-2" role="alert">{err}</p>}
      </div>

      <Panel title="Open or closed" description={statusBlock ? undefined : 'Add an “Open / Closed” block to show it on your page.'}>
        <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-soft" role="radiogroup" aria-label="Open or closed">
          {STATUS_OPTIONS.map((o) => (
            <button key={o.value} type="button" role="radio" aria-checked={today.status === o.value} onClick={() => patch({ status: o.value }, 'status')}
              className={cx('h-10 rounded-xl text-sm font-semibold cursor-pointer transition-colors',
                today.status === o.value ? (o.value === 'open' ? 'bg-teal text-white' : o.value === 'closed' ? 'bg-danger text-white' : 'bg-panel shadow-sm text-ink') : 'text-muted hover:text-ink')}>
              {o.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted mt-2">
          {today.status === 'auto' ? STATUS_OPTIONS[0].help : 'Stays like this until you switch back to Automatic.'}
          {shown && <> Your page shows: <b className={shown.open ? 'text-teal' : 'text-danger'}>{shown.text}</b>{shown.detail ? ` · ${shown.detail}` : ''}</>}
        </p>
      </Panel>

      <LocationCard ed={ed} today={today} patch={patch} busy={busy} locationBlock={locationBlock} />

      {takesOrders && (
        <Panel title="Pickup orders">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[13px] font-semibold">{today.ordersPaused ? 'Orders are paused' : 'Taking orders'}</p>
              <p className="text-xs text-muted mt-0.5">Pause them when you are too busy or about to close. Visitors still see your menu.</p>
            </div>
            <Toggle checked={!today.ordersPaused} onChange={(v) => patch({ ordersPaused: !v }, 'orders')} label="Taking orders" />
          </div>
        </Panel>
      )}

      {catalogs.length > 0 && <SoldOutCard catalogs={catalogs} today={today} patch={patch} />}
    </div>
  );
}

function LocationCard({ ed, today, patch, busy, locationBlock }) {
  const [form, setForm] = useState({ place: today.place, address: today.address, lat: today.lat, lon: today.lon, note: today.note, until: today.until });
  const [locating, setLocating] = useState(false);
  const [geoErr, setGeoErr] = useState('');
  const set = (p) => setForm((f) => ({ ...f, ...p }));
  const changed = ['place', 'address', 'lat', 'lon', 'note', 'until'].some((k) => (form[k] ?? '') !== (today[k] ?? ''));
  const hasPoint = Number.isFinite(form.lat) && Number.isFinite(form.lon);
  const live = locationBlock ? locationNow(locationBlock.data, { ...ed.page, today }) : null;
  const locale = pageLocale(ed.page);

  const locate = () => {
    if (!navigator.geolocation) { setGeoErr('This browser can’t share its location.'); return; }
    setLocating(true);
    setGeoErr('');
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = Math.round(pos.coords.latitude * 1e5) / 1e5;
      const lon = Math.round(pos.coords.longitude * 1e5) / 1e5;
      set({ lat, lon });
      // Fill the address when it is empty (OpenStreetMap).
      if (!form.address) {
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=17&lat=${lat}&lon=${lon}`, { headers: { 'Accept-Language': ed.page.settings?.language || 'en' } });
          const j = await r.json();
          const a = j.address || {};
          const text = [[a.road, a.house_number].filter(Boolean).join(' '), a.suburb || a.neighbourhood, a.city || a.town || a.village].filter(Boolean).join(', ');
          if (text) set({ address: text.slice(0, 200) });
        } catch { /* the address can be typed */ }
      }
      setLocating(false);
    }, (e) => {
      setGeoErr(e.code === 1 ? 'Location permission was denied. Allow it in your browser settings.' : 'Your location could not be found. Try again outside or type the address.');
      setLocating(false);
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
  };

  const save = () => patch({ place: form.place, address: form.address, lat: form.lat, lon: form.lon, note: form.note, until: form.until }, 'loc');
  const clear = async () => {
    const empty = { place: '', address: '', lat: null, lon: null, note: '', until: '' };
    if (await patch(empty, 'loc')) setForm(empty);
  };

  return (
    <Panel title="Where are you today?" description={locationBlock ? 'Shown in your “Where we are today” block until midnight.' : 'Add a “Where we are today” block to show it on your page.'}>
      <div className="grid gap-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block"><span className="block text-[13px] font-semibold mb-1.5">Place</span>
            <Input value={form.place} maxLength={80} placeholder="Central Park, north gate" onChange={(e) => set({ place: e.target.value })} /></label>
          <label className="block"><span className="block text-[13px] font-semibold mb-1.5">Until (optional)</span>
            <Input type="time" value={form.until} onChange={(e) => set({ until: e.target.value })} /></label>
        </div>
        <label className="block"><span className="block text-[13px] font-semibold mb-1.5">Address</span>
          <Input value={form.address} maxLength={200} placeholder="Street, number, city" onChange={(e) => set({ address: e.target.value })} /></label>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={locate} disabled={locating}>
            {locating ? <Loader2 size={15} className="animate-spin" /> : <LocateFixed size={15} />} Use my current location
          </Button>
          {hasPoint && (
            <span className="inline-flex items-center gap-1 h-8 pl-3 pr-1 rounded-full bg-soft text-xs text-muted">
              <MapPin size={13} /> {form.lat}, {form.lon}
              <button type="button" onClick={() => set({ lat: null, lon: null })} className="size-6 grid place-items-center rounded-full hover:bg-panel cursor-pointer" aria-label="Remove the map point"><X size={13} /></button>
            </span>
          )}
        </div>
        {geoErr && <p className="text-xs text-danger">{geoErr}</p>}
        {hasPoint && <p className="text-xs text-muted">The map and directions use this exact point.</p>}
        <label className="block"><span className="block text-[13px] font-semibold mb-1.5">Note (optional)</span>
          <Input value={form.note} maxLength={160} placeholder="Next to the fountain · Today until we sell out" onChange={(e) => set({ note: e.target.value })} /></label>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button variant="primary" size="sm" onClick={save} disabled={!changed || busy === 'loc'}>
            {busy === 'loc' && <Loader2 size={15} className="animate-spin" />} Save location
          </Button>
          {(today.place || today.address || Number.isFinite(today.lat)) && <Button size="sm" onClick={clear} disabled={busy === 'loc'}>Clear</Button>}
          {today.placeAt && (today.place || today.address) && !changed && (
            <span className="text-xs text-muted">Set at {new Date(today.placeAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
          )}
        </div>
        {locationBlock && (
          <p className="text-xs text-muted border-t border-line/70 pt-3">
            Your page shows: {live
              ? <b className="text-ink">{live.place || live.address}{live.source === 'route' ? ' (from your route)' : ''}{live.until ? ` · until ${formatMinutes(toMin(live.until), locale)}` : ''}</b>
              : <i>{locationBlock.data.emptyText}</i>}
          </p>
        )}
      </div>
    </Panel>
  );
}

function SoldOutCard({ catalogs, today, patch }) {
  const [q, setQ] = useState('');
  const soldOut = new Set(today.soldOut || []);
  const total = catalogs.reduce((n, b) => n + b.data.products.filter((p) => p.name).length, 0);
  const toggle = (key, out) => {
    const next = out ? [...soldOut, key] : [...soldOut].filter((k) => k !== key);
    patch({ soldOut: next }, 'sold');
  };
  const s = q.trim().toLowerCase();
  return (
    <Panel title="Sold out today" description="Switch off what you ran out of. Visitors see “Sold out” and can’t order it."
      actions={soldOut.size > 0 && <Button size="sm" className="whitespace-nowrap shrink-0" onClick={() => patch({ soldOut: [] }, 'sold')}>All back in stock</Button>}>
      {total > 8 && (
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a product" className="pl-9" aria-label="Find a product" />
        </div>
      )}
      <div className="space-y-4">
        {catalogs.map((b) => {
          const products = b.data.products.filter((p) => p.name && (!s || p.name.toLowerCase().includes(s) || (p.category || '').toLowerCase().includes(s)));
          if (!products.length) return null;
          return (
            <div key={b.id}>
              {catalogs.length > 1 && <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">{b.data.title || b.data.buttonLabel || 'Catalog'}</p>}
              <ul className="divide-y divide-line/70">
                {products.map((p) => {
                  const key = productKey(b.id, p.id);
                  const out = soldOut.has(key);
                  const noStock = String(p.stock ?? '').trim() === '0';
                  return (
                    <li key={p.id} className="flex items-center gap-3 py-2">
                      {p.image ? <img src={p.image} alt="" className="size-9 rounded-lg object-cover shrink-0" /> : <span className="size-9 rounded-lg bg-soft shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className={cx('text-sm font-medium truncate', out && 'line-through text-muted')}>{p.name}</p>
                        <p className="text-xs text-muted truncate">{noStock ? 'Stock is 0 in the block' : p.category || (out ? 'Sold out' : 'Available')}</p>
                      </div>
                      <Toggle size="sm" checked={!out && !noStock} onChange={(v) => !noStock && toggle(key, !v)} label={out ? `Mark ${p.name} as available` : `Mark ${p.name} as sold out`} />
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
