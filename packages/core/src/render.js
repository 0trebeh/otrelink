// Renderer: page document -> HTML + CSS.
// Used by the public page (vanilla) and by the dashboard live preview, so
// both always look exactly the same.

import { adjustedImg } from './util/image.js';
import { blockTypes } from './blocks/index.js';
import { buttonStyles, buttonHovers } from './buttons/index.js';
import { wallpapers } from './wallpapers/index.js';
import { attentionAnimations, entranceAnimations } from './animations.js';
import { googleFontsHref } from './fonts.js';
import { designCss, resolveDesign, colorSchemeOf } from './design.js';
import { socialHref, socialIcon, socials } from './socials.js';
import { esc, safeUrl, miniMarkdown } from './util/html.js';
import { verifiedSvg } from './icons.js';
import { flattenBlocks } from './tree.js';

const BASE_CSS = `
.ol-root{position:relative;min-height:100%;font-family:var(--ol-body-font);font-size:var(--ol-body-size);color:var(--ol-text-color);-webkit-font-smoothing:antialiased;isolation:isolate}
.ol-root *,.ol-root *::before,.ol-root *::after{box-sizing:border-box}
.ol-root .ol-bg{position:fixed;inset:0;z-index:-1;overflow:hidden}
.ol-root .ol-main{max-width:var(--ol-max-width);margin:0 auto;padding:var(--ol-pad-top) 16px 40px;display:flex;flex-direction:column;min-height:100vh;min-height:100dvh}
.ol-root .ol-profile{display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;margin-bottom:24px}
.ol-root .ol-avatar{width:var(--ol-avatar-size);height:var(--ol-avatar-size);object-fit:cover;border:var(--ol-avatar-bw) solid var(--ol-avatar-bc);margin-bottom:8px;flex-shrink:0;display:grid;place-items:center;font-size:calc(var(--ol-avatar-size)*.4);font-weight:700;background:color-mix(in srgb,var(--ol-title-color) 12%,transparent);color:var(--ol-title-color);font-family:var(--ol-title-font)}
.ol-root img.ol-avatar-natural{height:auto}
.ol-root .ol-zoom{overflow:hidden}.ol-root .ol-zoom>img{display:block;width:100%;height:100%}
.ol-root .ol-avatar-circle{border-radius:50%}.ol-root .ol-avatar-rounded{border-radius:22%}.ol-root .ol-avatar-square{border-radius:4px}
.ol-root .ol-title{margin:0;font-family:var(--ol-title-font);font-size:var(--ol-title-size);font-weight:var(--ol-title-weight);color:var(--ol-title-color);line-height:1.2;display:inline-flex;align-items:center;gap:6px;overflow-wrap:anywhere}
.ol-root .ol-title svg{color:#3b82f6;font-size:.8em;flex-shrink:0}
.ol-root .ol-bio{margin:0;line-height:1.5;max-width:46ch;opacity:.92}
.ol-root .ol-bio a{color:inherit}
.ol-root.ol-layout-hero .ol-avatar{width:100%;height:auto;aspect-ratio:4/3;border-radius:var(--ol-surface-radius);margin-bottom:16px;font-size:64px}
.ol-root.ol-layout-left .ol-profile{align-items:flex-start;text-align:left}
.ol-root .ol-socials{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:10px}
.ol-root.ol-layout-left .ol-profile .ol-socials{justify-content:flex-start}
.ol-root .ol-socials-bottom{margin:28px 0 0}
.ol-root .ol-social{color:var(--ol-social-color);display:inline-grid;place-items:center;transition:transform .15s,opacity .15s;text-decoration:none}
.ol-root .ol-social svg{width:var(--ol-social-size);height:var(--ol-social-size)}
.ol-root .ol-social:hover{transform:translateY(-2px)}
.ol-root .ol-socials-filled .ol-social{background:var(--ol-social-color);color:var(--ol-social-fg,#fff);padding:9px;border-radius:50%}
.ol-root .ol-socials-outline .ol-social{border:1.5px solid var(--ol-social-color);padding:8px;border-radius:50%}
.ol-root .ol-blocks{display:flex;flex-direction:column;gap:var(--ol-gap)}
.ol-root .ol-btn{display:flex;align-items:center;gap:12px;width:100%;min-height:var(--ol-btn-h);padding:8px 16px;border-radius:var(--ol-btn-radius);text-decoration:none;font:inherit;font-weight:600;text-align:var(--ol-btn-align);text-transform:var(--ol-btn-transform);cursor:pointer;transition:transform .18s ease,box-shadow .18s ease,background .18s,color .18s,opacity .18s;position:relative;-webkit-tap-highlight-color:transparent}
.ol-root .ol-btn-label{flex:1;display:flex;flex-direction:column;min-width:0;overflow-wrap:anywhere}
.ol-root .ol-btn-sub{font-weight:400;font-size:.85em;opacity:.8;text-transform:none}
.ol-root .ol-btn-thumb{width:calc(var(--ol-btn-h) - 16px);height:calc(var(--ol-btn-h) - 16px);border-radius:calc(var(--ol-btn-radius)*.6);object-fit:cover;flex-shrink:0;margin-left:-8px}
.ol-root .ol-btn-icon{display:inline-grid;place-items:center;width:28px;flex-shrink:0}
.ol-root .ol-btn-spacer{width:28px;flex-shrink:0}
.ol-root .ol-btn.has-media .ol-btn-thumb+.ol-btn-label+.ol-btn-spacer{width:calc(var(--ol-btn-h) - 24px)}
.ol-root .ol-btn-disabled{opacity:.5;cursor:default}
.ol-root .ol-card{background:var(--ol-surface);color:var(--ol-surface-fg);border-radius:var(--ol-surface-radius);padding:14px 16px}
.ol-root .ol-frame{width:100%;border-radius:var(--ol-surface-radius);overflow:hidden;background:color-mix(in srgb,var(--ol-text-color) 8%,transparent)}
.ol-root .ol-frame iframe{width:100%;height:100%;border:0;display:block}
.ol-root .ol-toggle>summary{list-style:none}.ol-root .ol-toggle>summary::-webkit-details-marker{display:none}
.ol-root .ol-toggle-chevron{transition:transform .2s}.ol-root .ol-toggle[open]>summary .ol-toggle-chevron{transform:rotate(180deg)}
.ol-root .ol-toggle-body{margin-top:8px;animation:ol-toggle-in .2s ease}
@keyframes ol-toggle-in{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
.ol-root .ol-embed-title{margin:0 0 8px;font-weight:600;text-align:center}
.ol-root .ol-footer{margin-top:auto;padding-top:40px;text-align:center;font-size:12px}
.ol-root .ol-footer a{color:var(--ol-text-color);opacity:.7;text-decoration:none;display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:999px;background:color-mix(in srgb,var(--ol-text-color) 8%,transparent);font-weight:600}
.ol-root .ol-block-scheduled{opacity:.45;outline:1px dashed currentColor;outline-offset:3px;border-radius:var(--ol-btn-radius)}
.ol-root .ol-gate{position:fixed;inset:0;z-index:50;display:grid;place-items:center;padding:24px;background:rgba(0,0,0,.55);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
.ol-root .ol-gate div{background:#fff;color:#111;border-radius:20px;padding:24px;max-width:340px;text-align:center;font-family:system-ui,sans-serif}
.ol-root .ol-gate p{margin:0 0 16px;line-height:1.5}
.ol-root .ol-gate button{font:inherit;font-weight:600;border:0;border-radius:999px;padding:12px 22px;background:#111;color:#fff;cursor:pointer}
@media (prefers-reduced-motion:reduce){.ol-root *{animation:none!important;transition:none!important}}
`;

function isScheduledOut(block, now) {
  const { showFrom, showUntil } = block.options || {};
  if (showFrom && new Date(showFrom).getTime() > now) return true;
  if (showUntil && new Date(showUntil).getTime() < now) return true;
  return false;
}

function renderSocials(page, d, position) {
  if (d.socialsPosition !== position || !page.socials?.length) return '';
  const items = page.socials
    .filter((s) => socials.has(s.platform) && s.url)
    .map((s) => {
      const p = socials.get(s.platform);
      const href = safeUrl(socialHref(s.platform, s.url), { allowRelative: false });
      if (!href) return '';
      const brandColor = d.socialsStyle === 'brand' ? ` style="color:${p.color}"` : '';
      const target = /^https?:/.test(href) ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a class="ol-social" href="${esc(href)}"${target} aria-label="${esc(p.label)}" data-ol-track="social:${esc(s.platform)}"${brandColor}>${socialIcon(s.platform)}</a>`;
    })
    .join('');
  const style = d.socialsStyle === 'brand' ? 'plain' : d.socialsStyle;
  return items ? `<nav class="ol-socials ol-socials-${position} ol-socials-${style}${position === 'bottom' ? ' ol-enter' : ''}" aria-label="Social links">${items}</nav>` : '';
}

function renderProfile(page, d) {
  const p = page.profile || {};
  let avatar = '';
  if (d.avatarShape !== 'hidden') {
    const shape = `ol-avatar ol-avatar-${d.avatarShape}`;
    const src = safeUrl(p.avatar);
    const adj = p.avatarAdjust;
    avatar = src
      ? adjustedImg({ src, alt: p.title, cls: `${shape}${adj?.fit === 'natural' ? ' ol-avatar-natural' : ''}`, adj })
      : `<div class="${shape}" aria-hidden="true">${esc((p.title || '?').replace(/^@/, '').charAt(0).toUpperCase())}</div>`;
  }
  const badge = p.verified ? verifiedSvg : '';
  return `<header class="ol-profile ol-enter">${avatar}`
    + `${p.title ? `<h1 class="ol-title">${esc(p.title)}${badge}</h1>` : ''}`
    + `${p.bio ? `<p class="ol-bio">${miniMarkdown(p.bio)}</p>` : ''}`
    + `${renderSocials(page, d, 'top')}</header>`;
}

/**
 * Render a page.
 * @param {object} page   page document
 * @param {object} opts   { mode: 'live' | 'preview', animate: boolean, now: number, footerUrl: string }
 * @returns {{ html: string, css: string, fontsHref: string }}
 */
export function renderPage(page, opts = {}) {
  const mode = opts.mode || 'live';
  const now = opts.now ?? Date.now();
  const animate = opts.animate ?? mode !== 'preview';
  const d = resolveDesign(page.design);
  const usedTypes = new Set();
  const usedAnims = new Set();

  // Renders a list of blocks. Containers (collections) get their rendered
  // children in ctx.children, plus ctx.container for children to adapt their look.
  const renderBlocks = (blocks, depth, container) => (blocks || [])
    .map((block) => {
      const mod = blockTypes.get(block.type);
      if (!mod || !block.enabled) return '';
      const scheduledOut = isScheduledOut(block, now);
      if (scheduledOut && mode !== 'preview') return '';
      usedTypes.add(mod.type);
      const anim = block.options?.animation && block.options.animation !== 'none' ? block.options.animation : '';
      if (anim) usedAnims.add(anim);
      const ctx = { blockId: block.id, design: d, page, mode, depth, container, apiBase: opts.apiBase ?? '', liveUrl: opts.liveUrl || '' };
      if (mod.container) {
        const me = { type: mod.type, id: block.id, layout: block.data?.layout };
        ctx.children = (block.children || [])
          .map((child) => ({ block: child, html: renderBlocks([child], depth + 1, me) }))
          .filter((c) => c.html);
      }
      let inner;
      try {
        inner = mod.render(block.data || {}, ctx);
      } catch (err) {
        console.error(`[otrelink] block "${block.type}" failed to render`, err);
        return '';
      }
      const cls = ['ol-block', `ol-b-${mod.type}`, depth === 0 && 'ol-enter', anim && `ol-anim-${anim}`, scheduledOut && 'ol-block-scheduled'].filter(Boolean).join(' ');
      return `<div class="${cls}" data-block-id="${esc(block.id)}" data-block-type="${esc(mod.type)}">${inner}</div>`;
    })
    .join('');
  const blocksHtml = renderBlocks(page.blocks, 0, null);

  const wp = wallpapers.resolve(d.wallpaper.type);
  const footer = page.settings?.hideFooter
    ? ''
    : `<footer class="ol-footer ol-enter"><a href="${esc(opts.footerUrl || '/')}" target="_blank" rel="noopener">🔗 Made with Otrelink</a></footer>`;
  const gate = page.settings?.sensitive
    ? `<div class="ol-gate" role="dialog" aria-modal="true"><div><p>${esc(page.settings.sensitiveMessage)}</p><button type="button" data-ol-gate>Continue</button></div></div>`
    : '';

  const entrance = animate && d.entrance !== 'none' ? `ol-enter-${d.entrance}` : '';
  const html = `<div class="ol-root ol-layout-${d.headerLayout} ${entrance}" data-mode="${mode}">`
    + `<div class="ol-bg" aria-hidden="true">${wp.html ? wp.html(d.wallpaper) : ''}</div>`
    + `<main class="ol-main">${renderProfile(page, d)}<section class="ol-blocks">${blocksHtml}</section>${renderSocials(page, d, 'bottom')}${footer}</main>`
    + `${gate}</div>`;

  const css = [
    BASE_CSS,
    designCss(d),
    wp.css(d.wallpaper, '.ol-root .ol-bg'),
    buttonStyles.resolve(d.buttonStyle).css,
    buttonHovers.resolve(d.buttonHover).css,
    entrance ? entranceAnimations.resolve(d.entrance).css : '',
    ...[...usedTypes].map((t) => blockTypes.get(t).css || ''),
    ...[...usedAnims].map((a) => attentionAnimations.get(a)?.css || ''),
    d.customCss || '',
  ].join('\n');

  return { html, css, fontsHref: googleFontsHref([d.titleFont, d.bodyFont]) };
}

/**
 * Render a page into a DOM container and wire up behavior.
 * Works in any document (main page or the dashboard's preview iframe).
 * @param {Element} container
 * @param {object} page
 * @param {object} opts  renderPage options + { onTrack(blockId, href), interceptLinks: boolean }
 * @returns {() => void} cleanup function
 */
export function mountPage(container, page, opts = {}) {
  const { html, css, fontsHref } = renderPage(page, opts);
  const fonts = fontsHref ? `<link rel="stylesheet" href="${esc(fontsHref)}">` : '';
  container.innerHTML = `${fonts}<style>${css}</style>${html}`;
  return hydratePage(container, page, opts);
}

/**
 * Tell the browser the page has its own colors, so its dark mode (e.g. Chrome
 * "auto dark" on Android) never repaints it. "only light" opts out of forced
 * darkening; a dark design declares "dark".
 */
export function applyColorScheme(doc, scheme) {
  if (!doc?.documentElement) return;
  const value = scheme === 'dark' ? 'dark' : 'only light';
  doc.documentElement.style.colorScheme = value;
  let meta = doc.querySelector('meta[name="color-scheme"]');
  if (!meta) {
    meta = doc.createElement('meta');
    meta.name = 'color-scheme';
    doc.head?.prepend(meta);
  }
  meta.content = value;
  // Dark-mode extensions (Dark Reader) skip pages with this tag.
  if (!doc.querySelector('meta[name="darkreader-lock"]')) {
    const lock = doc.createElement('meta');
    lock.name = 'darkreader-lock';
    doc.head?.append(lock);
  }
}

/**
 * Add browser behavior to an already rendered page: entrance animation
 * stagger, block behaviors (countdown, copy buttons, carousels…), the
 * sensitive-content gate and click tracking.
 * Used by mountPage() and by exported static sites (HTML is pre-rendered).
 * @returns {() => void} cleanup function
 */
export function hydratePage(container, page, opts = {}) {
  applyColorScheme(container.ownerDocument, colorSchemeOf(resolveDesign(page.design)));
  // Stagger entrance animations.
  container.querySelectorAll('.ol-enter').forEach((el, i) => {
    el.style.animationDelay = `${Math.min(i, 14) * 55}ms`;
  });

  // Per-block browser behavior.
  const byId = new Map(flattenBlocks(page.blocks).map((b) => [b.id, b]));
  for (const el of container.querySelectorAll('[data-block-id]')) {
    const mod = blockTypes.get(el.dataset.blockType);
    const block = byId.get(el.dataset.blockId);
    if (mod?.hydrate && block) {
      try { mod.hydrate(el, block.data, { blockId: block.id, mode: opts.mode }); } catch (err) { console.error(err); }
    }
  }

  const onClick = (e) => {
    const gateBtn = e.target.closest('[data-ol-gate]');
    if (gateBtn) { gateBtn.closest('.ol-gate')?.remove(); return; }
    const el = e.target.closest('[data-ol-track]');
    if (!el) {
      if (opts.interceptLinks && e.target.closest('a[href]')) e.preventDefault();
      return;
    }
    opts.onTrack?.(el.dataset.olTrack, el.getAttribute('href') || '');
    if (opts.interceptLinks && el.tagName === 'A') e.preventDefault();
  };
  container.addEventListener('click', onClick);
  return () => container.removeEventListener('click', onClick);
}
