// Builds scoped CSS so theme / wallpaper tiles look like the real thing,
// using the same core modules as the renderer.
import { wallpapers, buttonStyles, designCss, resolveDesign } from '@otrelink/core';

export function tileCss(scope, design) {
  const d = resolveDesign(design);
  const wp = wallpapers.resolve(d.wallpaper.type);
  const sel = `.${scope}`;
  return [
    designCss(d).replace('.ol-root', sel),
    wp.css(d.wallpaper, `${sel} .tile-bg`),
    buttonStyles.resolve(d.buttonStyle).css.replaceAll('.ol-root .ol-btn', `${sel} .ol-btn`),
    `${sel} .ol-btn{display:block;height:22px;border-radius:min(var(--ol-btn-radius),11px)}`,
    `${sel} .tile-aa{font-family:var(--ol-title-font);color:var(--ol-title-color);font-weight:var(--ol-title-weight)}`,
  ].join('\n');
}
