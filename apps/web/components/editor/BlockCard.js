'use client';
import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronDown, Copy, Trash2, BarChart3, CalendarClock, Sparkles } from 'lucide-react';
import { blockTypes, commonBlockFields, icon, validateFields } from '@otrelink/core';
import { CoreIcon, IconButton, Toggle, cx } from '../ui';
import FieldList from '../fields/FieldList';

function titleOf(block, mod) {
  const d = block.data || {};
  return d.title || d.text || d.label || d.name || d.question || mod?.label || block.type;
}

export default function BlockCard({ block, expanded, onToggleExpand, onChange, onOptions, onEnabled, onDuplicate, onDelete, clicks }) {
  const mod = blockTypes.get(block.type);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const [showMore, setShowMore] = useState(false);
  const errors = mod ? validateFields(mod.fields, block.data) : [];
  const scheduled = block.options?.showFrom || block.options?.showUntil;
  const animated = block.options?.animation && block.options.animation !== 'none';

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cx('rounded-3xl bg-panel border transition-shadow', isDragging ? 'shadow-xl z-10 relative border-accent' : 'border-line/80', !block.enabled && 'opacity-70')}
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
            <button type="button" onClick={() => setShowMore((v) => !v)} className="text-[13px] font-semibold text-accent-ink cursor-pointer inline-flex items-center gap-1">
              Animation & schedule <ChevronDown size={14} className={cx('transition-transform', showMore && 'rotate-180')} />
            </button>
            {showMore && (
              <div className="mt-3 rounded-2xl bg-soft p-4">
                <FieldList fields={commonBlockFields} values={block.options || {}} onChange={onOptions} compact />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-1 mt-4 pt-3 border-t border-line/70">
            <button type="button" onClick={onDuplicate} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-ink px-3 h-8 rounded-full hover:bg-soft cursor-pointer"><Copy size={14} /> Duplicate</button>
            <button type="button" onClick={onDelete} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-danger px-3 h-8 rounded-full hover:bg-danger/10 cursor-pointer"><Trash2 size={14} /> Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}
