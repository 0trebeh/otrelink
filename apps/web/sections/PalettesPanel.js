'use client';
// Theme → Color palettes: recolor the page (background, buttons, text, cards,
// accent) while keeping its fonts, button shapes and background type.
// Presets come from @otrelink/core; "My palettes" are saved per account.
import { useEffect, useMemo, useState } from 'react';
import { Check, Plus, Trash2, Pencil, Wand2, Loader2, Sun, Moon } from 'lucide-react';
import { palettes, applyPalette, paletteFromColor, sanitizePalette, PALETTE_KEYS, PALETTE_LABELS, MAX_CUSTOM_PALETTES, wallpaperBaseColor } from '@otrelink/core';
import { api, errorMessage } from '@/lib/client';
import { Panel, Button, Input, Modal, cx } from '@/components/ui';

/** Mini preview of a palette: background, a card with text, a button and the accent. */
function Swatch({ colors, className }) {
  return (
    <span className={cx('relative block aspect-[5/4] rounded-2xl overflow-hidden border border-black/5', className)} style={{ background: `linear-gradient(160deg, ${colors.bg} 45%, ${colors.bg2})` }} aria-hidden="true">
      <span className="absolute left-2.5 right-2.5 top-2.5 rounded-lg px-2 py-1.5 text-[11px] font-bold leading-none" style={{ background: colors.surface, color: colors.text }}>
        Aa <span className="inline-block size-2 rounded-full align-middle ml-1" style={{ background: colors.accent }} />
      </span>
      <span className="absolute left-2.5 right-2.5 bottom-2.5 h-4 rounded-full" style={{ background: colors.primary }} />
      <span className="absolute left-2.5 right-2.5 bottom-8 h-4 rounded-full opacity-80" style={{ background: colors.primary }} />
    </span>
  );
}

function PaletteTile({ pal, active, onApply, onEdit, onDelete }) {
  return (
    <div className="group relative text-center">
      <button type="button" onClick={onApply} aria-pressed={active} className="block w-full cursor-pointer" title={`Apply ${pal.name || pal.label}`}>
        <span className={cx('block rounded-[18px] border-2 transition', active ? 'border-accent' : 'border-transparent group-hover:border-ink/20')}>
          <Swatch colors={pal.colors} />
        </span>
        <span className="block text-[12.5px] font-medium mt-1.5 truncate">{pal.name || pal.label}</span>
      </button>
      {active && <span className="absolute top-2 right-2 size-6 rounded-full bg-accent text-white grid place-items-center pointer-events-none"><Check size={14} /></span>}
      {(onEdit || onDelete) && (
        <span className="absolute top-1.5 left-1.5 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition">
          {onEdit && <button type="button" onClick={onEdit} className="size-7 grid place-items-center rounded-full bg-white/90 text-ink shadow cursor-pointer" aria-label={`Edit ${pal.name}`}><Pencil size={13} /></button>}
          {onDelete && <button type="button" onClick={onDelete} className="size-7 grid place-items-center rounded-full bg-white/90 text-danger shadow cursor-pointer" aria-label={`Delete ${pal.name}`}><Trash2 size={13} /></button>}
        </span>
      )}
    </div>
  );
}

/** The colors a page uses right now, as a palette (to start a custom one). */
function currentColors(d) {
  const w = d.wallpaper || {};
  const bg = wallpaperBaseColor(w) || '#ffffff';
  const bg2 = w.to || w.fg || w.c3 || bg;
  const hex = (v, f) => (/^#[0-9a-f]{6}/i.test(v || '') ? v.slice(0, 7) : f);
  return {
    bg: hex(w.type === 'grain' ? w.to : bg, '#ffffff'), bg2: hex(w.type === 'grain' ? w.from : bg2, '#eeeeee'),
    surface: hex(d.surfaceColor, '#ffffff'), text: hex(d.titleColor, '#111111'),
    primary: hex(d.buttonColor, '#111111'), accent: hex(d.accentColor || d.avatarBorderColor, '#7c3aed'),
  };
}

export default function PalettesPanel({ ed }) {
  const { page, set } = ed;
  const [filter, setFilter] = useState('all');
  const [mine, setMine] = useState(null);
  const [editing, setEditing] = useState(null); // { id?, name, colors }
  const [err, setErr] = useState('');
  const active = page.design.palette;

  useEffect(() => { api('/api/palettes').then((r) => setMine(r.palettes)).catch(() => setMine([])); }, []);

  const presets = useMemo(() => palettes.list().map((x) => ({ ...x, name: x.label })), []);
  const shown = presets.filter((x) => filter === 'all' || (filter === 'dark' ? x.dark : !x.dark));

  const apply = (pal) => set((p) => ({ ...p, design: applyPalette(p.design, pal) }));

  const saveMine = async (list) => {
    setErr('');
    try { const r = await api('/api/palettes', { method: 'PUT', body: { palettes: list } }); setMine(r.palettes); return r.palettes; } catch (e) { setErr(errorMessage(e)); return null; }
  };
  const remove = async (pal) => {
    if (!window.confirm(`Delete the palette “${pal.name}”? Pages already using it keep their colors.`)) return;
    await saveMine(mine.filter((x) => x.id !== pal.id));
  };

  return (
    <Panel
      title="Color palettes"
      description="Recolor the background, buttons, text and cards in one click. Fonts, button shapes and the background type stay as they are."
      actions={<Button size="sm" onClick={() => setEditing({ name: '', colors: currentColors(page.design) })}><Plus size={14} /> Create</Button>}
    >
      {err && <p className="mb-3 rounded-xl bg-danger/10 text-danger px-3 py-2 text-sm" role="alert">{err}</p>}

      {mine?.length > 0 && (
        <>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2">My palettes</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
            {mine.map((pal) => (
              <PaletteTile key={pal.id} pal={pal} active={active === pal.id} onApply={() => apply(pal)}
                onEdit={() => setEditing(pal)} onDelete={() => remove(pal)} />
            ))}
          </div>
        </>
      )}

      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">Presets</h3>
        <div className="flex gap-1 text-xs" role="group" aria-label="Filter palettes">
          {[['all', 'All'], ['light', 'Light'], ['dark', 'Dark']].map(([v, l]) => (
            <button key={v} type="button" onClick={() => setFilter(v)} aria-pressed={filter === v}
              className={cx('px-2.5 py-1 rounded-full font-semibold cursor-pointer', filter === v ? 'bg-ink text-white' : 'text-muted hover:bg-soft')}>{l}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {shown.map((pal) => <PaletteTile key={pal.id} pal={pal} active={active === pal.id} onApply={() => apply(pal)} />)}
      </div>

      <PaletteEditor
        value={editing}
        onClose={() => setEditing(null)}
        canSave={Boolean(editing?.id) || (mine?.length ?? 0) < MAX_CUSTOM_PALETTES}
        onApply={(pal) => apply(pal)}
        onSave={async (pal) => {
          const clean = sanitizePalette(pal);
          if (!clean) return false;
          const list = mine || [];
          const next = list.some((x) => x.id === clean.id) ? list.map((x) => (x.id === clean.id ? clean : x)) : [...list, clean];
          const saved = await saveMine(next);
          if (saved) { apply(saved.find((x) => x.id === clean.id) || clean); setEditing(null); }
          return Boolean(saved);
        }}
      />
    </Panel>
  );
}

function PaletteEditor({ value, onClose, onSave, onApply, canSave }) {
  const [name, setName] = useState('');
  const [colors, setColors] = useState({});
  const [base, setBase] = useState('#7c3aed');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!value) return;
    setName(value.name || '');
    setColors({ ...value.colors });
    setBase(value.colors?.primary || '#7c3aed');
  }, [value]);
  if (!value) return null;

  const generate = (mode) => setColors(paletteFromColor(base, mode).colors);
  const pal = { id: value.id, name: name.trim() || 'My palette', colors };

  return (
    <Modal open={Boolean(value)} onClose={onClose} title={value.id ? 'Edit palette' : 'New palette'} wide>
      <div className="grid sm:grid-cols-[1fr_180px] gap-5">
        <div className="grid gap-4">
          <div className="rounded-2xl bg-soft p-3">
            <p className="text-sm font-semibold flex items-center gap-1.5"><Wand2 size={15} /> From one color</p>
            <p className="text-xs text-muted mt-0.5">Pick your brand color and get a matching palette.</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <input type="color" value={base} onChange={(e) => setBase(e.target.value)} aria-label="Brand color" className="size-10 rounded-xl border border-line cursor-pointer bg-panel" />
              <Button size="sm" onClick={() => generate('light')}><Sun size={14} /> Light</Button>
              <Button size="sm" onClick={() => generate('dark')}><Moon size={14} /> Dark</Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {PALETTE_KEYS.map((k) => (
              <label key={k} className="grid gap-1 text-xs font-semibold">
                {PALETTE_LABELS[k]}
                <span className="flex items-center gap-2">
                  <input type="color" value={colors[k] || '#000000'} onChange={(e) => setColors({ ...colors, [k]: e.target.value })} className="size-9 rounded-lg border border-line cursor-pointer bg-panel shrink-0" aria-label={PALETTE_LABELS[k]} />
                  <Input value={colors[k] || ''} onChange={(e) => setColors({ ...colors, [k]: e.target.value.trim() })} className="!h-9 font-mono !text-xs" spellCheck={false} maxLength={7} />
                </span>
              </label>
            ))}
          </div>
          <label className="grid gap-1.5 text-sm font-medium">
            Name
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. My brand" maxLength={40} />
          </label>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted mb-1.5">Preview</p>
          <Swatch colors={{ bg2: colors.bg, ...colors }} />
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-2 mt-5">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={() => { const c = sanitizePalette(pal); if (c) onApply({ ...c, id: value.id || 'custom' }); }}>Apply only</Button>
        <Button variant="primary" disabled={busy || !canSave} title={canSave ? undefined : `Up to ${MAX_CUSTOM_PALETTES} palettes`}
          onClick={async () => { setBusy(true); await onSave(pal); setBusy(false); }}>
          {busy && <Loader2 size={15} className="animate-spin" />} Save &amp; apply
        </Button>
      </div>
    </Modal>
  );
}
