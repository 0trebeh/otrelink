'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, KeyboardSensor, useSensor, useSensors, useDroppable,
  pointerWithin, rectIntersection, closestCenter,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import {
  blockTypes, newBlock, cloneBlock, icon, isContainerType,
  updateBlock, updateChildren, removeBlock, insertBlock, moveBlock, canMoveInto,
  parentIdOf, childrenOf, findBlock, flattenBlocks,
} from '@otrelink/core';
import { Button, CoreIcon, cx } from '@/components/ui';
import BlockCard, { blockTitle } from '@/components/editor/BlockCard';
import AddBlockModal from '@/components/editor/AddBlockModal';
import { restrictToVerticalAxis } from './dnd';

const ROOT = 'root';
const containerId = (parentId) => `container:${parentId ?? ROOT}`;
const parseContainer = (id) => {
  const s = String(id);
  if (!s.startsWith('container:')) return undefined;
  const v = s.slice(10);
  return v === ROOT ? null : v;
};

export default function LinksSection({ ed }) {
  const { page, set, analytics } = ed;
  const [adding, setAdding] = useState(false); // false | null (top level) | collection id
  const [expanded, setExpanded] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const blocksRef = useRef(page.blocks);
  blocksRef.current = page.blocks;
  const snapshot = useRef(null);
  const excluded = useRef(new Set());
  const lastOver = useRef(null);
  const justMoved = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => { requestAnimationFrame(() => { justMoved.current = false; }); }, [page.blocks]);

  const setBlocks = (fn, key) => set((p) => ({ ...p, blocks: fn(p.blocks) }), key);

  // ── Block operations (work anywhere in the tree) ──────────────────────
  const ops = useMemo(() => ({
    patch: (id, fn, key) => setBlocks((bs) => updateBlock(bs, id, fn), key),
    remove: (id) => setBlocks((bs) => removeBlock(bs, id).blocks),
    duplicate: (id) => setBlocks((bs) => {
      const parent = parentIdOf(bs, id);
      const list = childrenOf(bs, parent);
      const i = list.findIndex((b) => b.id === id);
      return insertBlock(bs, parent, i + 1, cloneBlock(list[i]));
    }),
    moveTo: (id, parentId) => setBlocks((bs) => moveBlock(bs, id, parentId, undefined, isContainerType)),
  }), [set]); // eslint-disable-line react-hooks/exhaustive-deps

  const add = (type) => {
    const b = newBlock(type);
    const target = adding;
    // Top level: new blocks go first. Inside a collection: at the end.
    setBlocks((bs) => insertBlock(bs, target, target === null ? 0 : undefined, b));
    setExpanded(b.id);
    setAdding(false);
  };

  // Collections a block can be moved into (for the "Move to" menu).
  const moveTargets = (id) => [
    { id: null, label: 'Top level' },
    ...flattenBlocks(page.blocks)
      .filter((b) => isContainerType(b.type) && canMoveInto(page.blocks, id, b.id, isContainerType))
      .map((b) => ({ id: b.id, label: blockTitle(b) })),
  ];

  // ── Drag & drop across nested lists ──────────────────────────────────
  // Pick the innermost droppable under the pointer, never one inside the dragged block.
  const collisionDetection = (args) => {
    if (justMoved.current && lastOver.current) return [{ id: lastOver.current }];
    let hits = pointerWithin(args);
    if (!hits.length) hits = rectIntersection(args);
    hits = hits.filter((h) => !excluded.current.has(h.id));
    if (!hits.length) return closestCenter({ ...args, droppableContainers: args.droppableContainers.filter((c) => !excluded.current.has(c.id)) });
    const area = (id) => { const r = args.droppableRects.get(id); return r ? r.width * r.height : Infinity; };
    const best = [...hits].sort((a, b) => area(a.id) - area(b.id))[0];
    lastOver.current = best.id;
    return [best];
  };

  const onDragStart = ({ active }) => {
    setActiveId(active.id);
    snapshot.current = blocksRef.current;
    // Droppables inside the dragged block (its children and its own list) are off-limits.
    const self = findBlock(blocksRef.current, active.id);
    const ids = new Set();
    for (const b of flattenBlocks(self?.children || [])) { ids.add(b.id); ids.add(containerId(b.id)); }
    ids.add(containerId(active.id));
    // The dragged block's own placeholder is never a target: the drop position
    // always comes from the block under the pointer.
    ids.add(active.id);
    excluded.current = ids;
  };

  const onDragOver = ({ active, over }) => {
    if (!over || over.id === active.id) return;
    const blocks = blocksRef.current;
    const from = parentIdOf(blocks, active.id);
    let to = parseContainer(over.id);
    let index;
    if (to === undefined) {
      to = parentIdOf(blocks, over.id);
      const list = childrenOf(blocks, to);
      index = list.findIndex((b) => b.id === over.id);
      const r = active.rect.current.translated;
      if (r && over.rect && r.top + r.height / 2 > over.rect.top + over.rect.height / 2) index += 1;
    }
    if (from === to || to === undefined) return;
    if (!canMoveInto(blocks, active.id, to, isContainerType)) return;
    justMoved.current = true;
    setBlocks((bs) => moveBlock(bs, active.id, to, index, isContainerType), `drag:${active.id}`);
  };

  const onDragEnd = ({ active, over }) => {
    setActiveId(null);
    lastOver.current = null;
    if (!over || active.id === over.id || parseContainer(over.id) !== undefined) return;
    const blocks = blocksRef.current;
    const parent = parentIdOf(blocks, active.id);
    if (parent !== parentIdOf(blocks, over.id)) return;
    setBlocks((bs) => updateChildren(bs, parent, (list) => arrayMove(list, list.findIndex((b) => b.id === active.id), list.findIndex((b) => b.id === over.id))), `drag:${active.id}`);
  };

  const onDragCancel = () => {
    setActiveId(null);
    lastOver.current = null;
    if (snapshot.current) set((p) => ({ ...p, blocks: snapshot.current }));
  };

  const tree = { ops, expanded, setExpanded, analytics, setAdding, moveTargets, activeId };
  const active = activeId ? findBlock(page.blocks, activeId) : null;

  return (
    <div className="space-y-4">
      <Button variant="primary" size="lg" className="w-full" onClick={() => setAdding(null)}>
        <Plus size={18} /> Add block
      </Button>

      {page.blocks.length === 0 && (
        <div className="rounded-3xl border border-dashed border-line p-10 text-center">
          <p className="font-display text-lg font-bold">Your page has no blocks yet</p>
          <p className="text-sm text-muted mt-1">Add a link, a video, a FAQ or anything else to get started.</p>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
        modifiers={[restrictToVerticalAxis]}
      >
        <BlockList parentId={null} blocks={page.blocks} depth={0} tree={tree} />
        <DragOverlay dropAnimation={null}>
          {active && (
            <div className="flex items-center gap-3 rounded-2xl bg-panel border border-accent shadow-xl px-3 py-2.5 cursor-grabbing">
              <CoreIcon svg={icon(blockTypes.get(active.type)?.icon || 'link', 18)} className="size-9 rounded-xl bg-soft shrink-0" />
              <span className="font-semibold text-[15px] truncate">{blockTitle(active)}</span>
              {active.children?.length > 0 && <span className="text-xs text-muted shrink-0">+{flattenBlocks(active.children).length} inside</span>}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <AddBlockModal
        open={adding !== false}
        onClose={() => setAdding(false)}
        onAdd={add}
        title={adding ? `Add to “${blockTitle(findBlock(page.blocks, adding) || {})}”` : undefined}
      />
    </div>
  );
}

/** One sortable list (top level or a collection's children). Recursive. */
function BlockList({ parentId, blocks, depth, tree }) {
  const { setNodeRef, isOver } = useDroppable({ id: containerId(parentId) });
  const empty = blocks.length === 0;
  return (
    <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        className={cx(
          depth === 0 ? 'space-y-3 min-h-8' : 'space-y-2 rounded-2xl p-1.5 -m-1.5 min-h-14 transition-colors',
          depth > 0 && isOver && 'bg-accent-soft/70',
        )}
      >
        {blocks.map((b) => (
          <BlockCard
            key={b.id}
            block={b}
            depth={depth}
            expanded={tree.expanded === b.id}
            dimmed={tree.activeId === b.id}
            onToggleExpand={() => tree.setExpanded((cur) => (cur === b.id ? null : b.id))}
            onChange={(k, v) => tree.ops.patch(b.id, (x) => ({ ...x, data: { ...x.data, [k]: v } }), `block:${b.id}:${k}`)}
            onOptions={(k, v) => tree.ops.patch(b.id, (x) => ({ ...x, options: { ...x.options, [k]: v } }), `opt:${b.id}:${k}`)}
            onEnabled={(v) => tree.ops.patch(b.id, (x) => ({ ...x, enabled: v }))}
            onDuplicate={() => tree.ops.duplicate(b.id)}
            onDelete={() => tree.ops.remove(b.id)}
            moveTargets={() => tree.moveTargets(b.id)}
            onMove={(target) => tree.ops.moveTo(b.id, target)}
            clicks={tree.analytics ? tree.analytics.blocks?.[b.id] || 0 : undefined}
            childrenSlot={isContainerType(b.type) ? (
              <div className="space-y-2">
                <BlockList parentId={b.id} blocks={b.children || []} depth={depth + 1} tree={tree} />
                <button
                  type="button"
                  onClick={() => tree.setAdding(b.id)}
                  className="w-full h-9 rounded-xl border border-dashed border-line text-[13px] font-semibold text-muted hover:text-accent-ink hover:border-accent cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  <Plus size={15} /> Add block inside
                </button>
              </div>
            ) : null}
          />
        ))}
        {empty && depth > 0 && (
          <p className="h-12 grid place-items-center text-xs text-muted rounded-xl border border-dashed border-line">Drag blocks here</p>
        )}
      </div>
    </SortableContext>
  );
}
