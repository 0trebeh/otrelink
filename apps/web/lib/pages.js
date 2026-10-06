// Page helpers shared by API routes.
import { sanitizePage, stripPrivateFields, stripLockedBlocks, allowsWallpaper } from '@otrelink/core';

/** Shape returned to the dashboard. */
export const toDashboardPage = (p) => ({
  id: p.id, slug: p.slug, profile: p.profile, socials: p.socials, blocks: p.blocks,
  design: p.design, settings: p.settings, createdAt: p.createdAt, updatedAt: p.updatedAt,
});

/**
 * Shape returned to the public page app (no owner info).
 * `plan` = the owner's plan: blocks and backgrounds it doesn't include are not
 * shown (e.g. after a downgrade to Free).
 */
export const toPublicPage = (p, plan) => {
  const clean = sanitizePage(p);
  let blocks = onlyEnabled(clean.blocks);
  let { design } = clean;
  if (plan) {
    blocks = stripLockedBlocks(blocks, plan);
    if (!allowsWallpaper(plan, design.wallpaper?.type)) {
      design = { ...design, wallpaper: { type: 'solid', color: design.wallpaper?.color || '#222222' } };
    }
  }
  return {
    id: p.id,
    slug: p.slug,
    ...clean,
    design,
    // Hide disabled blocks (at any depth) from the public payload entirely.
    // Private fields (e.g. a meeting link) never reach visitors through the page data.
    blocks: stripPrivateFields(blocks),
  };
};

function onlyEnabled(blocks) {
  return blocks.filter((b) => b.enabled).map((b) => (b.children ? { ...b, children: onlyEnabled(b.children) } : b));
}
