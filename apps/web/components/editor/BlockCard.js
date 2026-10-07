'use client';
import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronDown, Copy, Trash2, BarChart3, CalendarClock, Sparkles, FolderInput, Palette, RotateCcw } from 'lucide-react';
import { blockTypes, commonBlockFields, blockStyleFields, blockStyleFieldsFor, blockStyleGroups, blockStyleOf, icon, validateFields } from '@otrelink/core';
import { CoreIcon, IconButton, Toggle, cx } from '../ui';
import FieldList from '../fields/FieldList';

function titleOf(block, mod) {
  const d = block.data || {};
  return d.title || d.text || d.label || d.name || d.question || mod?.label || block.type;
}

/** Human title of a block (used in menus and the drag preview). */
export const blockTitle = (block) => titleOf(block, blockTypes.get(block?.type));

export default function BlockCard({
  block, depth = 0, expanded, dimmed, onToggleExpand, onChange, onOptions, onEnabled, onDuplicate, onDelete, clicks,
  childrenSlot, moveTargets, onMove,
}) {
  const mod = blockTypes.get(block.type);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const [showMore, setShowMore] = useState(false);
  const [showStyle, setShowStyle] = useState(false);
  // Only the style options that change this kind of block (e.g. no card colors for a link).
  const styleFields = blockStyleFieldsFor(block);
  const styled = Boolean(blockStyleOf(block.options, blockStyleGroups(block)));
  const errors = mod ? validateFields(mod.fields, block.data) : [];
  const scheduled = block.options?.showFrom || block.options?.showUntil;
  const animated = block.options?.animation && block.options.animation !== 'none';

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cx(
        'bg-panel border transition-shadow',
        depth === 0 ? 'rounded-3xl' : 'rounded-2xl',
        childrenSlot && 'border-accent/30',
        isDragging || dimmed ? 'opacity-40 border-dashed border-accent' : 'border-line/80',
        !block.enabled && !isDragging && 'opacity-70',
      )}
    >
      <div className="flex items-center gap-2 p-3 pl-1.5">
        <button ref={setActivatorNodeRef} {...attributes} {...listeners} className="p-1.5 text-muted hover:text-ink cursor-grab active:cursor-grabbing touch-none" aria-label="Drag to reorder">
          <GripVertical size={18} />
        </button>
        <CoreIcon svg={icon(mod?.icon || 'link', 18)} className="size-9 rounded-xl bg-soft shrink-0" />
        <button type="button" onClick={onToggleExpand} className="flex-1 min-w-0 text-left cursor-pointer" aria-expanded={expanded}>
          <span className="block font-semibold text-[15px] truncate">{titleOf(block, mod)}</span>
          <span className="flex items-center gap-2 text-xs text-muted truncate">
            {mod ? <span className="truncate">{mod.summary?.(block.data) || mod.label}</span> : <span className="text-danger">Block type “{block.type}” is not installed</span>}
            {errors.length > 0 && <span className="text-danger shrink-0">· Needs {errors.map((e) => e.key).join(', ')}</span>}
          </span>
        </button>
        <span className="hidden sm:flex items-center gap-2 text-muted">
          {scheduled && <CalendarClock size={15} aria-label="Scheduled" />}
          {animated && <Sparkles size={15} aria-label="Animated" />}
          {styled && <Palette size={15} aria-label="Own style" />}
          {clicks !== undefined && (
            <span className="inline-flex items-center gap-1 text-xs tabular-nums" title="Clicks in the last 30 days"><BarChart3 size={14} />{clicks}</span>
          )}
        </span>
        <Toggle size="sm" checked={block.enabled} onChange={onEnabled} label={block.enabled ? 'Hide block' : 'Show block'} />
        <IconButton label={expanded ? 'Collapse' : 'Edit'} onClick={onToggleExpand}>
          <ChevronDown size={18} className={cx('transition-transform', expanded && 'rotate-180')} />
        </IconButton>
      </div>

      {expanded && (
        <div className="border-t border-line/70 px-4 sm:px-5 py-4">
          {mod ? (
            <FieldList fields={mod.fields} values={block.data} onChange={onChange} />
          ) : (
            <p className="text-sm text-muted">This block is hidden on your page because its type was removed. Re-install the module or delete the block.</p>
          )}
          <div className="mt-4">
            <button type="button" onClick={() => setShowStyle((v) => !v)} className="text-[13px] font-semibold text-accent-ink cursor-pointer inline-flex items-center gap-1" aria-expanded={showStyle}>
              Style{styled ? ' · custom' : ''} <ChevronDown size={14} className={cx('transition-transform', showStyle && 'rotate-180')} />
            </button>
            {showStyle && (
              <div className="mt-3 rounded-2xl bg-soft p-4">
                <p className="text-xs text-muted mb-3">Change how this block looks. Anything left as “Same as the page” keeps your page style.{block.type === 'collection' ? ' The blocks inside use this style too, unless they have their own.' : ''}</p>
                <FieldList fields={styleFields} values={block.options || {}} onChange={onOptions} compact />
                {styled && (
                  <button type="button" onClick={() => blockStyleFields.forEach((f) => onOptions(f.key, ''))}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink cursor-pointer">
                    <RotateCcw size={13} /> Use the page style
                  </button>
                )}
                <CssSelector id={block.id} />
              </div>
            )}
          </div>
          <div className="mt-3">
            <button type="button" onClick={() => setShowMore((v) => !v)} className="text-[13px] font-semibold text-accent-ink cursor-pointer inline-flex items-center gap-1" aria-expanded={showMore}>
              Animation & schedule <ChevronDown size={14} className={cx('transition-transform', showMore && 'rotate-180')} />
            </button>
            {showMore && (
              <div className="mt-3 rounded-2xl bg-soft p-4">
                <FieldList fields={commonBlockFields} values={block.options || {}} onChange={onOptions} compact />
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-1 mt-4 pt-3 border-t border-line/70">
            {moveTargets && <MoveTo block={block} targets={moveTargets} onMove={onMove} />}
            <button type="button" onClick={onDuplicate} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-ink px-3 h-8 rounded-full hover:bg-soft cursor-pointer"><Copy size={14} /> Duplicate</button>
            <button type="button" onClick={onDelete} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-danger px-3 h-8 rounded-full hover:bg-danger/10 cursor-pointer"><Trash2 size={14} /> Delete</button>
          </div>
        </div>
      )}

      {childrenSlot && (
        <div className={cx('border-t border-line/70 bg-soft/60 px-2.5 sm:px-3 py-3', depth === 0 ? 'rounded-b-3xl' : 'rounded-b-2xl')}>
          {childrenSlot}
        </div>
      )}
    </div>
  );
}

/** "Move to" menu: an alternative to drag & drop. */
function MoveTo({ block, targets, onMove }) {
  const [open, setOpen] = useState(false);
  const list = open ? targets() : [];
  return (
    <span className="relative mr-auto">
      <button type="button" onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-ink px-3 h-8 rounded-full hover:bg-soft cursor-pointer" aria-expanded={open}>
        <FolderInput size={14} /> Move to…
      </button>
      {open && (
        <span className="absolute left-0 bottom-9 z-20 w-60 max-h-64 overflow-auto rounded-2xl bg-panel border border-line shadow-xl p-1.5 flex flex-col">
          {list.map((t) => (
            <button
              key={t.id ?? 'root'}
              type="button"
              onClick={() => { setOpen(false); onMove(t.id); }}
              className="text-left text-[13px] px-3 py-2 rounded-xl hover:bg-soft cursor-pointer truncate"
            >
              {t.id ? `Inside “${t.label}”` : t.label}
            </button>
          ))}
          {list.length === 1 && <span className="text-xs text-muted px-3 py-2">Add a Collection to group blocks.</span>}
        </span>
      )}
    </span>
  );
}

/** Shows the CSS selector of this block so it can be styled in Custom CSS. */
function CssSelector({ id }) {
  const [copied, setCopied] = useState(false);
  const selector = `.ol-root [data-block-id="${id}"]`;
  return (
    <div className="mt-4 pt-3 border-t border-line">
      <p className="text-[13px] font-semibold mb-1.5">CSS selector</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 min-w-0 truncate font-mono text-xs bg-panel border border-line rounded-lg px-2.5 py-2">{selector}</code>
        <button
          type="button"
          onClick={async () => { await navigator.clipboard.writeText(selector); setCopied(true); setTimeout(() => setCopied(false), 1400); }}
          className="shrink-0 h-8 px-3 rounded-full border border-line bg-panel text-xs font-semibold hover:border-ink/30 cursor-pointer"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="text-xs text-muted mt-1">For anything these options don’t cover, target this block in Style → Custom CSS. <a href="/docs#css-blocks" target="_blank" rel="noreferrer" className="underline">See block classes</a></p>
    </div>
  );
}
