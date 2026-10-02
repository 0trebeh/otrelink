'use client';
import { useState } from 'react';
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from './dnd';
import { Plus } from 'lucide-react';
import { newBlock, uid } from '@otrelink/core';
import { Button } from '@/components/ui';
import BlockCard from '@/components/editor/BlockCard';
import AddBlockModal from '@/components/editor/AddBlockModal';

export default function LinksSection({ ed }) {
  const { page, set, analytics } = ed;
  const [adding, setAdding] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const setBlocks = (fn, key) => set((p) => ({ ...p, blocks: fn(p.blocks) }), key);
  const patchBlock = (id, fn, key) => setBlocks((bs) => bs.map((b) => (b.id === id ? fn(b) : b)), key);

  const add = (type) => {
    const b = newBlock(type);
    setBlocks((bs) => [b, ...bs]);
    setExpanded(b.id);
    setAdding(false);
  };

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    setBlocks((bs) => arrayMove(bs, bs.findIndex((b) => b.id === active.id), bs.findIndex((b) => b.id === over.id)));
  };

  return (
    <div className="space-y-4">
      <Button variant="primary" size="lg" className="w-full" onClick={() => setAdding(true)}>
        <Plus size={18} /> Add block
      </Button>

      {page.blocks.length === 0 && (
        <div className="rounded-3xl border border-dashed border-line p-10 text-center">
          <p className="font-display text-lg font-bold">Your page has no blocks yet</p>
          <p className="text-sm text-muted mt-1">Add a link, a video, a FAQ or anything else to get started.</p>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd} modifiers={[restrictToVerticalAxis]}>
        <SortableContext items={page.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {page.blocks.map((b) => (
              <BlockCard
                key={b.id}
                block={b}
                expanded={expanded === b.id}
                onToggleExpand={() => setExpanded((cur) => (cur === b.id ? null : b.id))}
                onChange={(k, v) => patchBlock(b.id, (x) => ({ ...x, data: { ...x.data, [k]: v } }), `block:${b.id}:${k}`)}
                onOptions={(k, v) => patchBlock(b.id, (x) => ({ ...x, options: { ...x.options, [k]: v } }), `opt:${b.id}:${k}`)}
                onEnabled={(v) => patchBlock(b.id, (x) => ({ ...x, enabled: v }))}
                onDuplicate={() => setBlocks((bs) => {
                  const i = bs.findIndex((x) => x.id === b.id);
                  const copy = { ...structuredClone(b), id: uid('b') };
                  return [...bs.slice(0, i + 1), copy, ...bs.slice(i + 1)];
                })}
                onDelete={() => setBlocks((bs) => bs.filter((x) => x.id !== b.id))}
                clicks={analytics ? analytics.blocks?.[b.id] || 0 : undefined}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <AddBlockModal open={adding} onClose={() => setAdding(false)} onAdd={add} />
    </div>
  );
}
