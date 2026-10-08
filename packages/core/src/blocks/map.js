// Map block: a place on a map, in two flavours.
//  • Google Maps (embed, no key needed). Its look can change with color
//    filters: grayscale, dark, sepia, night… (the map itself is Google's).
//  • Styled map: map styles (light, dark, streets, minimal, satellite,
//    topographic) from tile servers that need no API key, your own marker color and controls. Drawn with
//    Leaflet inside a sandboxed frame, so it works the same on the page, in the
//    dashboard preview and in exported sites. It needs the place's coordinates,
//    found from the address in the dashboard (or typed by hand).
import { esc, safeUrl } from '../util/html.js';
import { frame, toggleButton } from './_shared.js';
import { icon } from '../icons.js';

const LEAFLET = {
  js: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js',
  jsSri: 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=',
  css: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css',
  cssSri: 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=',
};

const OSM = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/';
const esri = (path) => `${ESRI}${path}/MapServer/tile/{z}/{y}/{x}`;
const ESRI_CANVAS = 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors, and the GIS user community';

/**
 * Map styles of the styled map. All tile servers work without an API key
 * (Esri's public basemaps and OpenTopoMap). `labels` = a second layer with the
 * place names on top; `native` = the deepest zoom the server has (Leaflet
 * enlarges beyond it).
 */
export const MAP_STYLES = {
  light: { label: 'Light', url: esri('Canvas/World_Light_Gray_Base'), labels: esri('Canvas/World_Light_Gray_Reference'), attribution: ESRI_CANVAS, native: 16, max: 19, preview: '#f5f3ef,#dfe6ea' },
  dark: { label: 'Dark', url: esri('Canvas/World_Dark_Gray_Base'), labels: esri('Canvas/World_Dark_Gray_Reference'), attribution: ESRI_CANVAS, native: 16, max: 19, preview: '#262626,#3b3f46', dark: true },
  voyager: { label: 'Streets', url: esri('World_Street_Map'), attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, USGS, &copy; OpenStreetMap contributors', native: 19, max: 19, preview: '#f2efe9,#aad3df,#f6cf86' },
  minimal: { label: 'Minimal', url: esri('Canvas/World_Light_Gray_Base'), attribution: ESRI_CANVAS, native: 16, max: 19, preview: '#fafafa,#e8e8e8' },
  satellite: { label: 'Satellite', url: esri('World_Imagery'), labels: esri('Reference/World_Boundaries_and_Places'), attribution: 'Tiles &copy; Esri &mdash; Esri, Maxar, Earthstar Geographics', native: 19, max: 19, preview: '#2f4a2b,#5d6b45,#3c5d7a', dark: true },
  topo: { label: 'Topographic', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attribution: `${OSM}, SRTM | &copy; <a href="https://opentopomap.org">OpenTopoMap</a>`, sub: 'abc', native: 17, max: 17, preview: '#e9e4c7,#b9d29a,#c8a77a' },
};

/** Color filters for the Google Maps embed. */
export const GOOGLE_FILTERS = {
  normal: { label: 'Normal', css: '', preview: '#e8eaed,#aadaff,#fde293' },
  grayscale: { label: 'Grayscale', css: 'grayscale(1)', preview: '#eee,#bbb' },
  dark: { label: 'Dark', css: 'invert(.92) hue-rotate(180deg) brightness(.95) contrast(.9)', preview: '#1f2329,#3a4250' },
  night: { label: 'Night blue', css: 'invert(.9) hue-rotate(200deg) saturate(.7) brightness(.85)', preview: '#14213d,#2b3f66' },
  sepia: { label: 'Vintage', css: 'sepia(.65) saturate(1.3) contrast(.95)', preview: '#e6d3b3,#c9a97c' },
  muted: { label: 'Soft', css: 'saturate(.45) brightness(1.05) contrast(.92)', preview: '#eef0f0,#cfdce0' },
  blueprint: { label: 'Blueprint', css: 'grayscale(1) invert(1) sepia(1) hue-rotate(170deg) saturate(3.5) brightness(.85)', preview: '#0d3b66,#3e7cb1' },
};

const preview = (p) => ({ background: `linear-gradient(135deg,${p})` });
const hasPoint = (p) => Number.isFinite(p?.lat) && Number.isFinite(p?.lon);

/** The sandboxed document that draws the styled map. */
export function styledMapDoc(d, { color = '#111111' } = {}) {
  const style = MAP_STYLES[d.mapStyle] || MAP_STYLES.light;
  const cfg = {
    lat: d.point.lat, lon: d.point.lon, zoom: Number(d.zoom) || 15,
    tiles: style.url, labels: style.labels || '', attribution: style.attribution, sub: style.sub || 'abc', max: style.max, native: style.native || style.max,
    color: d.markerColor || color, marker: d.marker, label: d.markerLabel || '',
    zoomControl: d.zoomControl !== false, scroll: Boolean(d.scrollZoom), drag: d.dragging !== false,
  };
  const json = JSON.stringify(cfg).replace(/</g, '\\u003c');
  return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    + `<meta name="color-scheme" content="only light"><meta name="darkreader-lock">`
    + `<link rel="stylesheet" href="${LEAFLET.css}" integrity="${LEAFLET.cssSri}" crossorigin="">`
    + '<style>html,body,#m{margin:0;height:100%;background:' + (style.dark ? '#1d1f23' : '#eef0f2') + '}'
    + '.pin{position:relative;width:30px;height:42px}.pin svg{display:block;filter:drop-shadow(0 3px 4px rgba(0,0,0,.35))}'
    + '.dot{width:18px;height:18px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 6px color-mix(in srgb,var(--c) 30%,transparent),0 2px 6px rgba(0,0,0,.35)}'
    + '.leaflet-tooltip.lbl{font:600 13px system-ui,sans-serif;border:0;border-radius:8px;padding:5px 9px;box-shadow:0 3px 10px rgba(0,0,0,.2)}'
    + '.leaflet-container a{color:#0b6bcb}</style></head><body><div id="m"></div>'
    + `<script src="${LEAFLET.js}" integrity="${LEAFLET.jsSri}" crossorigin=""></script>`
    + `<script>(function(){var c=${json};if(!window.L){document.body.innerHTML='<p style="font:14px system-ui;padding:16px;color:#666">The map could not be loaded.</p>';return}`
    + 'var m=L.map("m",{zoomControl:c.zoomControl,scrollWheelZoom:c.scroll,dragging:c.drag,tap:c.drag,attributionControl:true}).setView([c.lat,c.lon],c.zoom);'
    + 'L.tileLayer(c.tiles,{subdomains:c.sub,maxZoom:c.max,maxNativeZoom:c.native,attribution:c.attribution}).addTo(m);'
    + 'if(c.labels)L.tileLayer(c.labels,{maxZoom:c.max,maxNativeZoom:c.native}).addTo(m);'
    + 'm.attributionControl.setPrefix(false);'
    + 'var h=c.marker==="dot"?\'<div class="dot" style="background:\'+c.color+\';--c:\'+c.color+\'"></div>\''
    + ':\'<div class="pin"><svg width="30" height="42" viewBox="0 0 30 42"><path d="M15 0C6.7 0 0 6.6 0 14.8 0 25.9 15 42 15 42s15-16.1 15-27.2C30 6.6 23.3 0 15 0z" fill="\'+c.color+\'"/><circle cx="15" cy="14.5" r="5.5" fill="#fff"/></svg></div>\';'
    + 'if(c.marker!=="none"){var k=L.marker([c.lat,c.lon],{icon:L.divIcon({html:h,className:"",iconSize:c.marker==="dot"?[24,24]:[30,42],iconAnchor:c.marker==="dot"?[12,12]:[15,42]})}).addTo(m);'
    + 'if(c.label)k.bindTooltip(c.label.replace(/[<>&]/g,""),{permanent:true,direction:"top",offset:c.marker==="dot"?[0,-12]:[0,-42],className:"lbl"})}'
    + '})()</script></body></html>';
}

const providerIs = (v) => ({ key: 'provider', equals: v });

export default {
  type: 'map',
  label: 'Map',
  description: 'Show a place on Google Maps or on a styled map (light, dark, satellite…).',
  icon: 'map',
  category: 'Content',
  cssClasses: [
    { selector: '.ol-frame', description: 'The map frame' },
    { selector: '.ol-map-go', description: '“Get directions” button under the map' },
    { selector: '.ol-toggle', description: 'Wrapper in “Button that opens it” mode (details, [open] when expanded)' },
  ],
  fields: [
    { key: 'address', type: 'text', label: 'Address or place', required: true, placeholder: 'Eiffel Tower, Paris' },
    { key: 'title', type: 'text', label: 'Title (optional)' },
    { key: 'provider', type: 'choice', label: 'Map', default: 'google', options: [
      { value: 'google', label: 'Google Maps', preview: preview('#e8eaed,#aadaff,#fde293') },
      { value: 'styled', label: 'Styled map', preview: preview('#262626,#3b3f46,#f6cf86') },
    ], help: 'Styled map: map styles that need no API key, your marker color and more control.' },
    { key: 'googleStyle', type: 'choice', label: 'Colors', default: 'normal', showIf: providerIs('google'),
      options: Object.entries(GOOGLE_FILTERS).map(([value, f]) => ({ value, label: f.label, preview: preview(f.preview) })),
      help: 'A color filter over the Google map (the map, its labels and photos get the same tint).' },
    { key: 'mapStyle', type: 'choice', label: 'Style', default: 'light', showIf: providerIs('styled'),
      options: Object.entries(MAP_STYLES).map(([value, s]) => ({ value, label: s.label, preview: preview(s.preview) })) },
    { key: 'point', type: 'geoPoint', label: 'Location on the map', address: 'address', showIf: providerIs('styled'),
      help: 'Found from the address. Adjust the numbers if the pin is not exactly in place.' },
    { key: 'marker', type: 'select', label: 'Marker', default: 'pin', showIf: providerIs('styled'), options: [
      { value: 'pin', label: 'Pin' }, { value: 'dot', label: 'Dot' }, { value: 'none', label: 'None' },
    ] },
    { key: 'markerColor', type: 'color', label: 'Marker color', default: '', allowEmpty: true, showIf: providerIs('styled'), help: 'Empty = your button color.' },
    { key: 'markerLabel', type: 'text', label: 'Label on the marker (optional)', max: 60, showIf: providerIs('styled'), placeholder: 'We are here!' },
    { key: 'zoomControl', type: 'toggle', label: 'Zoom buttons', default: true, showIf: providerIs('styled') },
    { key: 'scrollZoom', type: 'toggle', label: 'Zoom with the mouse wheel', default: false, showIf: providerIs('styled'),
      help: 'Off: scrolling the page never gets stuck on the map.' },
    { key: 'dragging', type: 'toggle', label: 'Visitors can move the map', default: true, showIf: providerIs('styled') },
    { key: 'zoom', type: 'range', label: 'Zoom', min: 3, max: 20, default: 15 },
    { key: 'height', type: 'range', label: 'Height', min: 160, max: 480, step: 10, default: 260, unit: 'px' },
    { key: 'directions', type: 'toggle', label: '“Get directions” button', default: false },
    { key: 'directionsLabel', type: 'text', label: 'Button text', default: 'Get directions', max: 30, showIf: { key: 'directions', truthy: true } },
    { key: 'display', type: 'choice', label: 'Show as', default: 'always', options: [
      { value: 'always', label: 'Always visible' }, { value: 'button', label: 'Button that opens it' },
    ] },
    { key: 'buttonLabel', type: 'text', label: 'Button text', placeholder: 'Defaults to the title or “See on the map”', showIf: { key: 'display', equals: 'button' } },
    { key: 'buttonSub', type: 'text', label: 'Button subtitle (optional)', placeholder: 'Defaults to the address', showIf: { key: 'display', equals: 'button' } },
    { key: 'startOpen', type: 'toggle', label: 'Start open', default: false, showIf: { key: 'display', equals: 'button' } },
  ],
  summary: (d) => `${d.display === 'button' ? 'Button · ' : ''}${d.provider === 'styled' ? `${MAP_STYLES[d.mapStyle]?.label || 'Styled'} · ` : ''}${d.address}`,
  render(d, ctx) {
    const styled = d.provider === 'styled' && hasPoint(d.point);
    let map;
    if (styled) {
      const color = /^#[0-9a-f]{3,8}$/i.test(ctx.design?.buttonColor || '') ? ctx.design.buttonColor : '#111111';
      map = `<div class="ol-frame ol-map-styled" style="height:${Number(d.height) || 260}px"><iframe sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" srcdoc="${esc(styledMapDoc(d, { color }))}" title="${esc(d.title || d.address || 'Map')}" loading="lazy"></iframe></div>`;
    } else {
      const src = `https://maps.google.com/maps?q=${encodeURIComponent(d.address)}&z=${d.zoom}&output=embed`;
      map = frame(src, { height: d.height, title: d.title || d.address });
      const filter = d.provider !== 'styled' ? GOOGLE_FILTERS[d.googleStyle]?.css : '';
      if (filter) map = map.replace('<iframe ', `<iframe style="filter:${esc(filter)}" `);
      if (d.provider === 'styled' && ctx.mode === 'preview') map += '<p class="ol-embed-title" style="font-size:.8em;opacity:.7">Styled map: find the address on the map in the block settings.</p>';
    }
    const q = hasPoint(d.point) && d.provider === 'styled' ? `${d.point.lat},${d.point.lon}` : d.address;
    const go = d.directions && q
      ? `<a class="ol-btn ol-map-go has-media" href="${esc(safeUrl(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`))}" target="_blank" rel="noopener noreferrer" data-ol-track="${esc(ctx.blockId)}">`
        + `<span class="ol-btn-icon">${icon('navigate', 18)}</span><span class="ol-btn-label"><span class="ol-btn-title">${esc(d.directionsLabel || 'Get directions')}</span></span><span class="ol-btn-spacer"></span></a>` : '';
    const body = `${map}${go}`;
    if (d.display === 'button') {
      return toggleButton({ ctx, iconName: 'map', label: d.buttonLabel || d.title || 'See on the map', sub: d.buttonSub || d.address, body, open: d.startOpen });
    }
    return `${d.title ? `<p class="ol-embed-title">${esc(d.title)}</p>` : ''}${body}`;
  },
  css: '.ol-root .ol-map-go{margin-top:8px}.ol-root .ol-map-styled iframe{color-scheme:light}',
};
