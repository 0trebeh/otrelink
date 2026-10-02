'use client';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { profileFields, socials, socialIcon, uid } from '@otrelink/core';
import { Panel, Button, Input, Select, IconButton, CoreIcon } from '@/components/ui';
import FieldList from '@/components/fields/FieldList';
import { restrictToVerticalAxis } from './dnd';

function SocialRow({ item, onChange, onRemove }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition } = useSortable({ id: item.id });
  const p = socials.get(item.platform);
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }} className="flex items-center gap-2 bg-panel">
      <button ref={setActivatorNodeRef} {...attributes} {...listeners} className="p-1 text-muted cursor-grab touch-none" aria-label="Drag to reorder"><GripVertical size={16} /></button>
      <CoreIcon svg={socialIcon(item.platform, 18)} className="size-10 rounded-xl bg-soft shrink-0" />
      <div className="w-32 sm:w-40 shrink-0">
        <Select value={item.platform} onChange={(e) => onChange({ platform: e.target.value })} aria-label="Platform">
          {socials.list().map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </Select>
      </div>
      <div className="flex-1 min-w-0">
        <Input value={item.url} onChange={(e) => onChange({ url: e.target.value })} placeholder={p?.placeholder} aria-label={`${p?.label || 'Social'} link`} />
      </div>
      <IconButton label="Remove" onClick={onRemove} className="shrink-0"><Trash2 size={16} /></IconButton>
    </div>
  );
}

export default function ProfileSection({ ed }) {
  const { page, set } = ed;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const setSocials = (fn, key) => set((p) => ({ ...p, socials: fn(p.socials) }), key);
  const unused = socials.list().find((s) => !page.socials.some((x) => x.platform === s.id)) || socials.list()[0];

  return (
    <div className="space-y-5">
      <Panel title="Profile" description="How you introduce yourself at the top of your page.">
        <FieldList
          fields={profileFields}
          values={page.profile}
          onChange={(k, v) => set((p) => ({ ...p, profile: { ...p.profile, [k]: v } }), `profile:${k}`)}
        />
      </Panel>

      <Panel title="Social icons" description="Small icons under your bio. Drag to reorder.">
        <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={({ active, over }) => {
          if (over && active.id !== over.id) setSocials((s) => arrayMove(s, s.findIndex((x) => x.id === active.id), s.findIndex((x) => x.id === over.id)));
        }}>
          <SortableContext items={page.socials.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {page.socials.map((s) => (
                <SocialRow
                  key={s.id}
                  item={s}
                  onChange={(patch) => setSocials((all) => all.map((x) => (x.id === s.id ? { ...x, ...patch } : x)), `social:${s.id}`)}
                  onRemove={() => setSocials((all) => all.filter((x) => x.id !== s.id))}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        {page.socials.length === 0 && <p className="text-sm text-muted mb-3">Add Instagram, TikTok, YouTube and 35+ other platforms.</p>}
        <Button size="sm" className="mt-3" onClick={() => setSocials((s) => [...s, { id: uid('s'), platform: unused.id, url: '' }])}>
          <Plus size={15} /> Add social icon
        </Button>
      </Panel>
    </div>
  );
}
