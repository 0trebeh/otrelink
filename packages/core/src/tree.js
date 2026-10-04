// Helpers for the block tree. Container blocks (e.g. Collection) hold other
// blocks in `children`. All functions are immutable: they return new arrays.

/** Maximum nesting (a collection inside a collection inside…). */
export const MAX_DEPTH = 4;

/** Call fn(block, depth, parent) for every block, depth-first. */
export function walkBlocks(blocks = [], fn, depth = 0, parent = null) {
  for (const b of blocks) {
    fn(b, depth, parent);
    if (Array.isArray(b.children)) walkBlocks(b.children, fn, depth + 1, b);
  }
}

/** All blocks in a flat list. */
export function flattenBlocks(blocks = []) {
  const out = [];
  walkBlocks(blocks, (b) => out.push(b));
  return out;
}

export function findBlock(blocks, id) {
  let found = null;
  walkBlocks(blocks, (b) => { if (!found && b.id === id) found = b; });
  return found;
}

/** Id of the parent container (null = top level), or undefined if not found. */
export function parentIdOf(blocks, id) {
  let result;
  walkBlocks(blocks, (b, _d, parent) => { if (result === undefined && b.id === id) result = parent ? parent.id : null; });
  return result;
}

/** Children list of a container (null = top level). */
export function childrenOf(blocks, parentId) {
  if (parentId === null || parentId === undefined) return blocks;
  return findBlock(blocks, parentId)?.children || [];
}

/** Depth of the deepest descendant (a block without children = 0). */
export function subtreeHeight(block) {
  if (!block?.children?.length) return 0;
  return 1 + Math.max(...block.children.map(subtreeHeight));
}

export function depthOf(blocks, id) {
  let depth = -1;
  walkBlocks(blocks, (b, d) => { if (b.id === id) depth = d; });
  return depth;
}

/** true if `id` is `block` itself or one of its descendants. */
export function containsBlock(block, id) {
  if (!block) return false;
  if (block.id === id) return true;
  return (block.children || []).some((c) => containsBlock(c, id));
}

/** Apply fn to the children list of parentId (null = top level). */
export function updateChildren(blocks, parentId, fn) {
  if (parentId === null || parentId === undefined) return fn(blocks);
  return blocks.map((b) => {
    if (b.id === parentId) return { ...b, children: fn(b.children || []) };
    if (b.children) return { ...b, children: updateChildren(b.children, parentId, fn) };
    return b;
  });
}

/** Replace one block (anywhere in the tree) with fn(block). */
export function updateBlock(blocks, id, fn) {
  return blocks.map((b) => {
    if (b.id === id) return fn(b);
    if (b.children) return { ...b, children: updateBlock(b.children, id, fn) };
    return b;
  });
}

/** Remove a block. Returns { blocks, removed }. */
export function removeBlock(blocks, id) {
  let removed = null;
  const strip = (list) => list.filter((b) => {
    if (b.id === id) { removed = b; return false; }
    return true;
  }).map((b) => (b.children ? { ...b, children: strip(b.children) } : b));
  const next = strip(blocks);
  return { blocks: next, removed };
}

/** Insert a block into parentId's children at index (end if omitted). */
export function insertBlock(blocks, parentId, index, block) {
  return updateChildren(blocks, parentId, (list) => {
    const i = index === undefined || index < 0 || index > list.length ? list.length : index;
    return [...list.slice(0, i), block, ...list.slice(i)];
  });
}

/**
 * Can `id` be moved into `parentId`? Not into itself or its own descendants,
 * not into a non-container, and not deeper than MAX_DEPTH.
 * `isContainer(type)` tells which block types accept children.
 */
export function canMoveInto(blocks, id, parentId, isContainer) {
  if (parentId === null || parentId === undefined) return true;
  const moving = findBlock(blocks, id);
  const target = findBlock(blocks, parentId);
  if (!moving || !target || !isContainer(target.type)) return false;
  if (containsBlock(moving, parentId)) return false;
  // Depths start at 0, so the deepest allowed level is MAX_DEPTH - 1.
  return depthOf(blocks, parentId) + 1 + subtreeHeight(moving) <= MAX_DEPTH - 1;
}

/** Move a block to parentId at index. Returns the same array if not allowed. */
export function moveBlock(blocks, id, parentId, index, isContainer) {
  if (!canMoveInto(blocks, id, parentId, isContainer)) return blocks;
  const { blocks: without, removed } = removeBlock(blocks, id);
  if (!removed) return blocks;
  return insertBlock(without, parentId, index, removed);
}
