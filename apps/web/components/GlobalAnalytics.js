'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, ChevronDown } from 'lucide-react';
import { api } from '@/lib/client';
import { Panel, cx } from './ui';
import { Stat, TrendChart, BarList } from '@/sections/AnalyticsSection';
import { countryName, flag } from '@/sections/analytics/geo';

const fmt = (n) => new Intl.NumberFormat('en', { notation: n > 9999 ? 'compact' : 'standard' }).format(n);
const WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const OPEN_KEY = 'ol-overview-open';

/** Simple analytics of all the user's pages, on the "Your pages" screen. */
export default function GlobalAnalytics() {
  const [open, setOpen] = useState(true);
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [err, setErr] = useState(false);

  useEffect(() => { try { if (localStorage.getItem(OPEN_KEY) === '0') setOpen(false); } catch { /* ignore */ } }, []);
  const toggle = () => setOpen((v) => { try { localStorage.setItem(OPEN_KEY, v ? '0' : '1'); } catch { /* ignore */ } return !v; });

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setErr(false);
    const tz = encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone || '');
    api(`/api/analytics?days=${days}&tz=${tz}`).then((d) => alive && setData(d)).catch(() => alive && setErr(true));
    return () => { alive = false; };
  }, [open, days]);

  const hour = data?.busiestHour;
  const day = data?.busiestDay;

  return (
    <section className="mb-8" aria-labelledby="overview-title">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <button type="button" onClick={toggle} aria-expanded={open} className="inline-flex items-center gap-2 cursor-pointer">
          <BarChart3 size={18} className="text-accent" />
          <h2 id="overview-title" className="font-display text-xl font-bold tracking-tight">Overview</h2>
          <span className="text-sm text-muted">all pages</span>
          <ChevronDown size={16} className={cx('text-muted transition-transform', open && 'rotate-180')} />
        </button>
        {open && (
          <div className="inline-flex rounded-full bg-panel border border-line p-1" role="group" aria-label="Date range">
            {[7, 30, 90].map((d) => (
              <button key={d} type="button" onClick={() => setDays(d)} aria-pressed={days === d}
                className={cx('h-8 px-3.5 rounded-full text-[13px] font-semibold cursor-pointer', days === d ? 'bg-ink text-white' : 'text-muted hover:text-ink')}>
                {d} days
              </button>
            ))}
          </div>
        )}
      </div>

      {open && (
        <>
          {err && <Panel><p className="text-sm text-danger">Analytics couldn&apos;t be loaded. Refresh the page to try again.</p></Panel>}
          {!data && !err && <div className="h-48 rounded-3xl bg-panel/60 animate-pulse" />}
          {data && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Stat label="Page visits" value={fmt(data.totals.views)} />
                <Stat label="Unique visitors" value={fmt(data.totals.visitors)} />
                <Stat label="Clicks" value={fmt(data.totals.clicks)} />
                <Stat label="Click rate" value={`${(data.totals.ctr * 100).toFixed(1)}%`} />
              </div>

              <div className="grid lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-5">
                <Panel title="Visits and clicks per day">
                  {data.totals.views + data.totals.clicks === 0
                    ? <p className="text-sm text-muted">No visits in this range yet. Share your links to start collecting data.</p>
                    : <TrendChart series={data.series} />}
                  {(hour !== null || day !== null) && (
                    <p className="text-xs text-muted mt-3">
                      Busiest time: {day !== null && <b className="text-ink">{WEEK[day]}s</b>}
                      {day !== null && hour !== null && ' · '}
                      {hour !== null && <b className="text-ink">{String(hour).padStart(2, '0')}:00–{String(hour).padStart(2, '0')}:59</b>}
                      {' '}(visitors&apos; local time)
                    </p>
                  )}
                </Panel>

                <Panel title="By page">
                  <ul className="divide-y divide-line/70 -my-1">
                    {data.pages.map((p) => (
                      <li key={p.id} className="flex items-center gap-3 py-2.5">
                        <div className="flex-1 min-w-0">
                          <Link href={`/dashboard/${p.id}#analytics`} className="font-semibold text-sm truncate block hover:underline">{p.title || `@${p.slug}`}</Link>
                          <p className="text-xs text-muted truncate">/{p.slug}{!p.published && ' · Hidden'}</p>
                        </div>
                        <div className="text-right text-xs tabular-nums shrink-0">
                          <p><b className="text-sm">{fmt(p.views)}</b> <span className="text-muted">visits</span></p>
                          <p className="text-muted">{fmt(p.clicks)} clicks · {(p.ctr * 100).toFixed(0)}%</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Panel>
              </div>

              <div className="grid lg:grid-cols-3 gap-5">
                <BarList title="Countries" limit={6} rows={data.countries.map((r) => ({ ...r, label: `${flag(r.key)} ${countryName(r.key)}` }))} />
                <BarList title="Referrers" limit={6} rows={data.referrers} />
                <BarList title="Devices" limit={6} rows={data.devices.map((r) => ({ ...r, label: r.key.charAt(0).toUpperCase() + r.key.slice(1) }))} />
              </div>
              <p className="text-xs text-muted">Open a page and go to <i>Analytics</i> for its map, hours, cities, browsers and latest visits.</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
