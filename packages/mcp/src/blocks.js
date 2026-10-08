// Block tree helpers: find, insert, move and remove blocks (containers such as
// Collection hold children), check new block data, and a readable outline.
import { blockTypes, newBlock, sanitizeBlock, validateFields, isContainerType, blockStyleFields, commonBlockFields, MAX_DEPTH } from '@otrelink/core';

/** → { block, list, index, parent, depth } or null. */
export function findBlock(blocks, id, parent = null, depth = 0) {
  for (let i = 0; i < (blocks || []).length; i++) {
    const b = blocks[i];
    if (b.id === id) return { block: b, list: blocks, index: i, parent, depth };
    if (b.children) {
      const hit = findBlock(b.children, id, b, depth + 1);
      if (hit) return hit;
    }
  }
  return null;
}

const contains = (block, id) => Boolean(block.children && findBlock(block.children, id));

/**
 * Where a block goes: { parentId?, index?, beforeId?, afterId? }.
 * beforeId / afterId win over parentId + index. Returns { list, index, parent, depth }.
 */
export function resolvePosition(blocks, { parentId, index, beforeId, afterId } = {}) {
  const anchorId = beforeId || afterId;
  if (anchorId) {
    const hit = findBlock(blocks, anchorId);
    if (!hit) throw new Error(`Block "${anchorId}" not found.`);
    return { list: hit.list, index: hit.index + (afterId ? 1 : 0), parent: hit.parent, depth: hit.depth };
  }
  let list = blocks;
  let parent = null;
  let depth = 0;
  if (parentId) {
    const hit = findBlock(blocks, parentId);
    if (!hit) throw new Error(`Parent block "${parentId}" not found.`);
    if (!isContainerType(hit.block.type)) throw new Error(`Block "${parentId}" (${hit.block.type}) can’t hold other blocks. Use a "collection" block.`);
    hit.block.children ||= [];
    list = hit.block.children;
    parent = hit.block;
    depth = hit.depth + 1;
  }
  const i = Number.isInteger(index) ? Math.max(0, Math.min(index, list.length)) : list.length;
  return { list, index: i, parent, depth };
}

const STYLE_KEYS = new Set([...blockStyleFields, ...commonBlockFields].map((f) => f.key));

/**
 * Build a new block from what the assistant sent and report problems:
 * unknown data keys (dropped), required fields still empty, unknown options.
 */
export function buildBlock(type, data = {}, options = {}) {
  const mod = blockTypes.get(type);
  if (!mod) throw new Error(`Unknown block type "${type}". Use list_block_types.`);
  const known = new Set(mod.fields.map((f) => f.key));
  const warnings = [];
  const unknown = Object.keys(data || {}).filter((k) => !known.has(k));
  if (unknown.length) warnings.push(`Ignored unknown fields for "${type}": ${unknown.join(', ')}.`);
  const badOpts = Object.keys(options || {}).filter((k) => !STYLE_KEYS.has(k));
  if (badOpts.length) warnings.push(`Ignored unknown options: ${badOpts.join(', ')}.`);
  const raw = newBlock(type, data || {});
  raw.options = { ...raw.options, ...(options || {}) };
  const block = sanitizeBlock(raw);
  for (const e of validateFields(mod.fields, block.data)) warnings.push(`Missing: ${e.message}.`);
  return { block, warnings };
}

/** Re-check an edited block the same way (data merged by the caller). */
export function checkBlock(block, dataPatch = {}, optionsPatch = {}) {
  const mod = blockTypes.get(block.type);
  const warnings = [];
  if (!mod) return { block, warnings: [`Block type "${block.type}" no longer exists.`] };
  const known = new Set(mod.fields.map((f) => f.key));
  const unknown = Object.keys(dataPatch || {}).filter((k) => !known.has(k));
  if (unknown.length) warnings.push(`Ignored unknown fields for "${block.type}": ${unknown.join(', ')}.`);
  const badOpts = Object.keys(optionsPatch || {}).filter((k) => !STYLE_KEYS.has(k));
  if (badOpts.length) warnings.push(`Ignored unknown options: ${badOpts.join(', ')}.`);
  const clean = sanitizeBlock(block);
  for (const e of validateFields(mod.fields, clean.data)) warnings.push(`Missing: ${e.message}.`);
  return { block: clean, warnings };
}

export function insertBlock(blocks, block, position) {
  const where = resolvePosition(blocks, position);
  if (block.children && where.depth >= MAX_DEPTH - 1) throw new Error('Too deep: containers can’t be nested that far.');
  where.list.splice(where.index, 0, block);
  return where;
}

export function removeBlock(blocks, id) {
  const hit = findBlock(blocks, id);
  if (!hit) throw new Error(`Block "${id}" not found.`);
  hit.list.splice(hit.index, 1);
  return hit.block;
}

export function moveBlock(blocks, id, position) {
  const hit = findBlock(blocks, id);
  if (!hit) throw new Error(`Block "${id}" not found.`);
  for (const k of ['parentId', 'beforeId', 'afterId']) {
    if (position[k] === id || (position[k] && contains(hit.block, position[k]))) throw new Error('A block can’t be moved inside itself.');
  }
  // Moving down in the same list: the index shifts after removing the block.
  hit.list.splice(hit.index, 1);
  try {
    return insertBlock(blocks, hit.block, position);
  } catch (err) {
    hit.list.splice(hit.index, 0, hit.block);
    throw err;
  }
}

/** The text that best names a block (title, text, question…). */
export function blockLabel(b) {
  const mod = blockTypes.get(b.type);
  const d = b.data || {};
  const name = d.title || d.text || d.name || d.label || d.buttonLabel || d.question || '';
  let summary = '';
  try { summary = mod?.summary ? String(mod.summary(d) || '') : ''; } catch { /* ignore */ }
  const parts = [name, summary && summary !== name ? summary : ''].filter(Boolean).map((s) => String(s).replace(/\s+/g, ' ').slice(0, 70));
  return parts.join(' — ');
}

/** Readable outline of a page's blocks with their ids. */
export function outline(blocks, depth = 0) {
  const lines = [];
  (blocks || []).forEach((b, i) => {
    const label = blockLabel(b);
    const flags = [b.enabled === false ? 'hidden' : '', b.options?.showFrom || b.options?.showUntil ? 'scheduled' : ''].filter(Boolean);
    lines.push(`${'  '.repeat(depth)}${i + 1}. [${b.type}] id=${b.id}${label ? ` · ${label}` : ''}${flags.length ? ` (${flags.join(', ')})` : ''}`);
    if (b.children?.length) lines.push(...outline(b.children, depth + 1));
  });
  return lines;
}

/** All blocks of a type at any depth. */
export function blocksOfType(blocks, type, out = []) {
  for (const b of blocks || []) {
    if (b.type === type) out.push(b);
    if (b.children) blocksOfType(b.children, type, out);
  }
  return out;
}
