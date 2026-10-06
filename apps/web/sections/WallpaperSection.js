'use client';
import { useMemo, useState } from 'react';
import { wallpapers, defaultsFor, contrastRatio, wallpaperBaseColor, allowsWallpaper } from '@otrelink/core';
import { ProChip, UpgradeNote } from '@/components/PlanLock';
import { Button } from '@/components/ui';
import { Panel, cx } from '@/components/ui';
import FieldList from '@/components/fields/FieldList';
import { tileCss } from './tiles';

export default function WallpaperSection({ ed }) {
  const { page, set, plan } = ed;
  const [lockedPick, setLockedPick] = useState('');
  const current = page.design.wallpaper;
  const mod = wallpapers.resolve(current.type);

  const css = useMemo(() => wallpapers.list().map((w) => {
    const values = w.id === current.type ? current : { type: w.id, ...defaultsFor(w.fields) };
    return tileCss(`wp-${w.id}`, { ...page.design, wallpaper: values });
  }).join('\n'), [current, page.design]);

  const setWallpaper = (next, key) => set((p) => ({ ...p, design: { ...p.design, theme: 'custom', wallpaper: next } }), key);

  const base = wallpaperBaseColor(current);
  const lowContrast = base && contrastRatio(base, page.design.titleColor) < 3;
  const fixText = () => {
    const dark = contrastRatio(base, '#111111') >= contrastRatio(base, '#ffffff');
    const ink = dark ? '#111111' : '#ffffff';
    set((p) => ({ ...p, design: { ...p.design, theme: 'custom', titleColor: ink, textColor: dark ? '#333333' : '#f2f2f2', socialsColor: ink } }));
  };

  return (
    <div className="space-y-5">
      {lowContrast && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-accent-soft px-4 py-3 text-sm" role="status">
          <span>Your text is hard to read on this background.</span>
          <Button size="sm" variant="dark" onClick={fixText}>Fix text color</Button>
        </div>
      )}
      {lockedPick && <UpgradeNote>{lockedPick} backgrounds are part of the Pro plan.</UpgradeNote>}
      <Panel title="Wallpaper" description="The background behind your page.">
        <style>{css}</style>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {wallpapers.list().map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => {
                if (plan && !allowsWallpaper(plan, w.id)) { setLockedPick(w.label); return; }
                setLockedPick('');
                if (w.id !== current.type) setWallpaper({ type: w.id, ...defaultsFor(w.fields) });
              }}
              aria-pressed={w.id === current.type}
              className="cursor-pointer text-center"
            >
              <span className={cx(`wp-${w.id} relative block aspect-[3/4] rounded-2xl overflow-hidden border-2`, w.id === current.type ? 'border-accent' : 'border-line/60 hover:border-ink/25')}>
                <span className="tile-bg absolute inset-0 overflow-hidden" />
                {w.id === 'video' && <span className="absolute inset-0 grid place-items-center text-white text-xl">▶</span>}
                {plan && !allowsWallpaper(plan, w.id) && <ProChip className="absolute top-1.5 right-1.5" />}
              </span>
              <span className="block text-xs font-medium mt-1.5">{w.label}</span>
            </button>
          ))}
        </div>
      </Panel>
      <Panel title={`${mod.label} settings`}>
        <FieldList fields={mod.fields} values={current} onChange={(k, v) => setWallpaper({ ...current, [k]: v }, `wp:${k}`)} />
      </Panel>
    </div>
  );
}
