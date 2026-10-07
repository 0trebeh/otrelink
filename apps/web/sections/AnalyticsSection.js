'use client';
import { useEffect, useMemo, useState } from 'react';
import { blockTypes, socials, findBlock } from '@otrelink/core';
import dynamic from 'next/dynamic';
import { api } from '@/lib/client';
import { Panel, cx } from '@/components/ui';
import TimeBars from './analytics/TimeBars';
import { countryName, flag } from './analytics/geo';

// Leaflet only runs in the browser.
const VisitMap = dynamic(() => import('./analytics/VisitMap'), { ssr: false, loading: () => <div className="h-80 sm:h-96 rounded-2xl bg-soft animate-pulse" /> });

const VIEWS = '#7a2cf0';
const CLICKS = '#0e9f8f';
const fmt = (n) => new Intl.NumberFormat('en', { notation: n > 9999 ? 'compact' : 'standard' }).format(n);

function Stat({ label, value }) {
  return (
    <div className="rounded-3xl bg-panel border border-line/70 p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="font-display text-3xl font-bold mt-1 tabular-nums">{value}</p>
    </div>
  );
}

function TrendChart({ series }) {
  const [hover, setHover] = useState(null);
  const W = 640, H = 220, P = { l: 36, r: 12, t: 12, b: 26 };
  const max = Math.max(4, ...series.flatMap((d) => [d.views, d.clicks]));
  const nice = Math.ceil(max / 4) * 4;
  const x = (i) => P.l + (series.length === 1 ? 0 : (i / (series.length - 1)) * (W - P.l - P.r));
  const y = (v) => H - P.b - (v / nice) * (H - P.t - P.b);
  const path = (k) => series.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d[k]).toFixed(1)}`).join('');
  const ticks = [0, nice / 4, nice / 2, (3 * nice) / 4, nice];
  const labelEvery = Math.ceil(series.length / 6);
  const h = hover !== null ? series[hover] : null;

  return (
    <div className="relative">
      <div className="flex gap-4 text-xs mb-2" aria-hidden="true">
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-0.5 rounded" style={{ background: VIEWS }} />Views</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-0.5 rounded" style={{ background: CLICKS }} />Clicks</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Views and clicks per day"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W;
          const i = Math.round(((px - P.l) / (W - P.l - P.r)) * (series.length - 1));
          setHover(Math.max(0, Math.min(series.length - 1, i)));
        }}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} style={{ stroke: 'var(--color-line)' }} />
            <text x={P.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" style={{ fill: 'var(--color-muted)' }}>{fmt(t)}</text>
          </g>
        ))}
        {series.map((d, i) => (i % labelEvery === 0 ? (
          <text key={d.date} x={x(i)} y={H - 6} textAnchor="middle" fontSize="11" style={{ fill: 'var(--color-muted)' }}>{new Date(d.date + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' })}</text>
        ) : null))}
        {h && <line x1={x(hover)} x2={x(hover)} y1={P.t} y2={H - P.b} style={{ stroke: 'var(--color-ink)' }} strokeOpacity=".25" />}
        <path d={path('views')} fill="none" stroke={VIEWS} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <path d={path('clicks')} fill="none" stroke={CLICKS} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {h && <>
          <circle cx={x(hover)} cy={y(h.views)} r="4.5" fill={VIEWS} stroke="#fff" strokeWidth="2" />
          <circle cx={x(hover)} cy={y(h.clicks)} r="4.5" fill={CLICKS} stroke="#fff" strokeWidth="2" />
        </>}
      </svg>
      {h && (
        <div className="pointer-events-none absolute top-6 rounded-xl bg-ink text-white text-xs px-3 py-2 shadow-lg" style={{ left: `clamp(0px, calc(${(x(hover) / W) * 100}% - 60px), calc(100% - 130px))` }}>
          <p className="font-semibold mb-1">{new Date(h.date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
          <p className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: VIEWS }} />{h.views} views</p>
          <p className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: CLICKS }} />{h.clicks} clicks</p>
        </div>
      )}
    </div>
  );
}

function BarList({ title, rows, empty = 'No data yet', limit = 8 }) {
  const [all, setAll] = useState(false);
  const shown = all ? rows : rows.slice(0, limit);
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <Panel title={title}>
      {rows.length === 0 ? <p className="text-sm text-muted">{empty}</p> : (
        <ul className="space-y-2">
          {shown.map((r) => (
            <li key={r.key} className="relative rounded-xl overflow-hidden">
              <span className="absolute inset-y-0 left-0 bg-accent-soft rounded-xl" style={{ width: `${(r.count / max) * 100}%` }} />
              <span className="relative flex justify-between gap-3 px-3 py-2 text-sm">
                <span className="truncate">{r.label ?? r.key}</span>
                <span className="tabular-nums font-semibold">{fmt(r.count)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {rows.length > limit && (
        <button type="button" onClick={() => setAll((v) => !v)} className="mt-3 text-xs font-semibold text-accent-ink hover:underline cursor-pointer">
          {all ? 'Show less' : `Show all ${rows.length}`}
        </button>
      )}
    </Panel>
  );
}

const ago = (ts) => {
  const s = Math.round((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60) return 'just now';
  for (const [u, n] of [['day', 86400], ['hour', 3600], ['minute', 60]]) {
    if (s >= n) { const v = Math.floor(s / n); return `${v} ${u}${v === 1 ? '' : 's'} ago`; }
  }
  return '';
};
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const HOURS_FULL = HOURS.map((h) => `${h}:00–${h}:59`);
// Weeks start on Monday on screen (data index 0 = Sunday).
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const WEEK_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEK_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function RecentVisits({ rows }) {
  if (!rows.length) return <p className="text-sm text-muted">No visits in this range yet.</p>;
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm min-w-[520px]">
        <thead>
          <tr className="text-left text-xs text-muted">
            <th className="font-semibold px-1 pb-2">When</th>
            <th className="font-semibold px-1 pb-2">Where</th>
            <th className="font-semibold px-1 pb-2">Device</th>
            <th className="font-semibold px-1 pb-2">From</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line/70">
          {rows.map((v, i) => (
            <tr key={i}>
              <td className="px-1 py-2 whitespace-nowrap" title={new Date(v.ts).toLocaleString()}>
                {ago(v.ts)}{v.returning && <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-accent-ink">returning</span>}
              </td>
              <td className="px-1 py-2">
                {v.cc || v.city
                  ? <span title={[v.city, v.region, countryName(v.cc)].filter(Boolean).join(', ')}>{flag(v.cc)} {v.city || countryName(v.cc)}{v.approx && <span className="text-muted" title="Estimated from the time zone"> ≈</span>}</span>
                  : <span className="text-muted">Unknown</span>}
              </td>
              <td className="px-1 py-2 text-muted whitespace-nowrap">{[v.device && v.device.charAt(0).toUpperCase() + v.device.slice(1), v.os, v.browser].filter(Boolean).join(' · ')}</td>
              <td className="px-1 py-2 text-muted truncate max-w-40">{v.referrer}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AnalyticsSection({ ed }) {
  const { page } = ed;
  const [days, setDays] = useState(30);
  const [metric, setMetric] = useState('views');
  const [data, setData] = useState(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let alive = true;
    setErr(false);
    api(`/api/pages/${page.id}/analytics?days=${days}&tz=${encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone || '')}`).then((d) => alive && setData(d)).catch(() => alive && setErr(true));
    return () => { alive = false; };
  }, [page.id, days]);

  const blockRows = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.blocks).map(([id, count]) => {
      const b = findBlock(page.blocks, id);
      const d = b?.data || {};
      return { key: id, count, label: b ? d.title || d.label || d.text || blockTypes.get(b.type)?.label || b.type : 'Deleted block' };
    }).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [data, page.blocks]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold tracking-tight">Analytics</h2>
        <div className="inline-flex rounded-full bg-panel border border-line p-1" role="group" aria-label="Date range">
          {[7, 30, 90].map((d) => (
            <button key={d} type="button" onClick={() => setDays(d)} aria-pressed={days === d} className={cx('h-8 px-3.5 rounded-full text-[13px] font-semibold cursor-pointer', days === d ? 'bg-ink text-white' : 'text-muted hover:text-ink')}>
              {d} days
            </button>
          ))}
        </div>
      </div>
      {err && <Panel><p className="text-sm text-danger">Analytics couldn't be loaded. Refresh the page to try again.</p></Panel>}
      {!data && !err && <div className="h-64 rounded-3xl bg-panel/60 animate-pulse" />}
      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Page visits" value={fmt(data.totals.views)} />
            <Stat label="Unique visitors" value={fmt(data.totals.visitors)} />
            <Stat label="Clicks" value={fmt(data.totals.clicks)} />
            <Stat label="Click rate" value={`${(data.totals.ctr * 100).toFixed(1)}%`} />
          </div>
          <Panel title="Visits and clicks per day">
            {data.totals.views + data.totals.clicks === 0
              ? <p className="text-sm text-muted">No visits in this range yet. Share your link to start collecting data.</p>
              : <TrendChart series={data.series} />}
          </Panel>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <h3 className="font-display text-lg font-bold tracking-tight">Where and when</h3>
            <div className="inline-flex rounded-full bg-panel border border-line p-1" role="group" aria-label="Show">
              {[['views', 'Visits'], ['clicks', 'Clicks']].map(([k, l]) => (
                <button key={k} type="button" onClick={() => setMetric(k)} aria-pressed={metric === k}
                  className={cx('h-8 px-3.5 rounded-full text-[13px] font-semibold cursor-pointer', metric === k ? 'bg-ink text-white' : 'text-muted hover:text-ink')}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <Panel title={metric === 'views' ? 'Map of visits' : 'Map of clicks'}>
            <VisitMap points={data.points} metric={metric} />
            <p className="text-xs text-muted mt-2">
              {data.points.filter((p) => p[metric] > 0).length} places
              {data.totals.views > 0 && ` · ${data.totals.located} of ${data.totals.views} visits located`}
              {data.totals.approx > 0 && ` (${data.totals.approx} estimated from the time zone, dashed circles)`}
              . Locations are approximate (by IP, about 1 km); IP addresses are never stored.
            </p>
          </Panel>

          <div className="grid lg:grid-cols-2 gap-5">
            <Panel title="Hour of the day" description="In your visitors’ local time.">
              <TimeBars values={data.hours[metric]} labels={HOURS} full={HOURS_FULL} every={3}
                color={metric === 'views' ? VIEWS : CLICKS} unit={metric === 'views' ? 'visits' : 'clicks'} />
            </Panel>
            <Panel title="Day of the week" description="In your visitors’ local time.">
              <TimeBars values={WEEK_ORDER.map((d) => data.weekdays[metric][d])} labels={WEEK_ORDER.map((d) => WEEK_SHORT[d])}
                full={WEEK_ORDER.map((d) => WEEK_FULL[d])} color={metric === 'views' ? VIEWS : CLICKS} unit={metric === 'views' ? 'visits' : 'clicks'} />
            </Panel>
            <BarList title="Countries" rows={data.countries[metric].map((r) => ({ ...r, label: `${flag(r.key)} ${countryName(r.key)}` }))} />
            <BarList title="Cities" rows={data.cities[metric].map((r) => { const [city, cc] = r.key.split('|'); return { ...r, label: `${flag(cc)} ${city}` }; })} />
          </div>

          <h3 className="font-display text-lg font-bold tracking-tight pt-2">Blocks and visitors</h3>
          <div className="grid lg:grid-cols-2 gap-5">
            <BarList title="Top blocks" rows={blockRows} empty="No clicks yet" />
            <BarList title="Social icons" rows={data.socials.map((r) => ({ ...r, label: socials.get(r.key)?.label || r.key }))} empty="No clicks yet" />
            <BarList title="Referrers" rows={data.referrers} />
            <BarList title="Devices" rows={data.devices.map((r) => ({ ...r, label: r.key.charAt(0).toUpperCase() + r.key.slice(1) }))} />
            <BarList title="Operating systems" rows={data.os} />
            <BarList title="Browsers" rows={data.browsers} />
          </div>

          <Panel title="Latest visits" description="The last 30 visits in this range.">
            <RecentVisits rows={data.recent} />
          </Panel>
        </>
      )}
    </div>
  );
}
