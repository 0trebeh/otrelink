'use client';
import { useMemo } from 'react';
import { Check } from 'lucide-react';
import { themes, applyTheme, googleFontsHref, resolveDesign } from '@otrelink/core';
import { Panel, cx } from '@/components/ui';
import { tileCss } from './tiles';
import PalettesPanel from './PalettesPanel';

export default function ThemeSection({ ed }) {
  const { page, set } = ed;
  const list = themes.list();
  const css = useMemo(() => list.map((t) => tileCss(`theme-${t.id}`, applyTheme(resolveDesign({}), t.id))).join('\n'), [list]);
  const fontsHref = useMemo(() => googleFontsHref(list.flatMap((t) => [t.design.titleFont, t.design.bodyFont].filter(Boolean))), [list]);

  return (
    <div className="grid gap-5">
    <Panel title="Theme" description="Start from a preset, then fine-tune anything in Wallpaper and Style.">
      {fontsHref && <link rel="stylesheet" href={fontsHref} />}
      <style>{css}</style>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {list.map((t) => {
          const active = page.design.theme === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => set((p) => ({ ...p, design: applyTheme(p.design, t.id) }))}
              className="group text-center cursor-pointer"
              aria-pressed={active}
            >
              <span className={cx(`theme-${t.id} relative block aspect-[4/5] rounded-2xl overflow-hidden border-2 transition`, active ? 'border-accent' : 'border-transparent group-hover:border-ink/20')}>
                <span className="tile-bg absolute inset-0 overflow-hidden" />
                <span className="relative flex flex-col h-full justify-between p-3">
                  <span className="tile-aa text-3xl text-left leading-none">Aa</span>
                  <span className="space-y-1.5"><span className="ol-btn" /><span className="ol-btn" /></span>
                </span>
                {active && <span className="absolute top-2 right-2 size-6 rounded-full bg-accent text-white grid place-items-center"><Check size={14} /></span>}
              </span>
              <span className="block text-[13px] font-medium mt-1.5">{t.label}</span>
            </button>
          );
        })}
      </div>
    </Panel>
    <PalettesPanel ed={ed} />
    </div>
  );
}
