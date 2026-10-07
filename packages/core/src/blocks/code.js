// Code block: a snippet with syntax colors (SQL, HTML, CSS, JavaScript,
// Markdown / README, Python…), line numbers, highlighted lines, a file name
// bar and a Copy button. Colors are added in the browser by highlight.js
// (loaded only on pages with a code block, and only the languages needed).
import { esc } from '../util/html.js';
import { icon } from '../icons.js';
import { toggleButton } from './_shared.js';
import { copyText } from './copy.js';

/** Languages: id → { label, load, ext (file extensions / names that pick it) }. */
const L = (label, load, ext = []) => ({ label, load, ext });
export const CODE_LANGUAGES = {
  javascript: L('JavaScript', () => import('highlight.js/lib/languages/javascript'), ['js', 'mjs', 'cjs', 'jsx']),
  typescript: L('TypeScript', () => import('highlight.js/lib/languages/typescript'), ['ts', 'tsx']),
  xml: L('HTML / XML', () => import('highlight.js/lib/languages/xml'), ['html', 'htm', 'xml', 'svg', 'vue']),
  css: L('CSS', () => import('highlight.js/lib/languages/css'), ['css']),
  scss: L('SCSS', () => import('highlight.js/lib/languages/scss'), ['scss', 'sass']),
  json: L('JSON', () => import('highlight.js/lib/languages/json'), ['json']),
  sql: L('SQL', () => import('highlight.js/lib/languages/sql'), ['sql']),
  markdown: L('Markdown / README', () => import('highlight.js/lib/languages/markdown'), ['md', 'markdown', 'readme']),
  python: L('Python', () => import('highlight.js/lib/languages/python'), ['py']),
  bash: L('Bash / Shell', () => import('highlight.js/lib/languages/bash'), ['sh', 'bash', 'zsh']),
  powershell: L('PowerShell', () => import('highlight.js/lib/languages/powershell'), ['ps1']),
  php: L('PHP', () => import('highlight.js/lib/languages/php'), ['php']),
  java: L('Java', () => import('highlight.js/lib/languages/java'), ['java']),
  kotlin: L('Kotlin', () => import('highlight.js/lib/languages/kotlin'), ['kt']),
  c: L('C', () => import('highlight.js/lib/languages/c'), ['c', 'h']),
  cpp: L('C++', () => import('highlight.js/lib/languages/cpp'), ['cpp', 'cc', 'hpp']),
  csharp: L('C#', () => import('highlight.js/lib/languages/csharp'), ['cs']),
  go: L('Go', () => import('highlight.js/lib/languages/go'), ['go']),
  rust: L('Rust', () => import('highlight.js/lib/languages/rust'), ['rs']),
  ruby: L('Ruby', () => import('highlight.js/lib/languages/ruby'), ['rb']),
  swift: L('Swift', () => import('highlight.js/lib/languages/swift'), ['swift']),
  dart: L('Dart', () => import('highlight.js/lib/languages/dart'), ['dart']),
  lua: L('Lua', () => import('highlight.js/lib/languages/lua'), ['lua']),
  r: L('R', () => import('highlight.js/lib/languages/r'), ['r']),
  yaml: L('YAML', () => import('highlight.js/lib/languages/yaml'), ['yml', 'yaml']),
  ini: L('INI / TOML / .env', () => import('highlight.js/lib/languages/ini'), ['ini', 'toml', 'env', 'cfg']),
  dockerfile: L('Dockerfile', () => import('highlight.js/lib/languages/dockerfile'), ['dockerfile']),
  nginx: L('Nginx', () => import('highlight.js/lib/languages/nginx'), ['conf']),
  graphql: L('GraphQL', () => import('highlight.js/lib/languages/graphql'), ['graphql', 'gql']),
  diff: L('Diff', () => import('highlight.js/lib/languages/diff'), ['diff', 'patch']),
  plaintext: L('Plain text', null, ['txt', 'text', 'log']),
};

/** Language of a block: the one chosen, or guessed from the file name ("README.md", "query.sql"). */
export function codeLanguage(d) {
  if (d.language && d.language !== 'auto' && CODE_LANGUAGES[d.language]) return d.language;
  const name = String(d.filename || '').trim().toLowerCase();
  if (!name) return 'auto';
  const ext = name.includes('.') ? name.split('.').pop() : name;
  if (/^readme/.test(name)) return 'markdown';
  if (/^dockerfile/.test(name)) return 'dockerfile';
  if (/^\.env/.test(name)) return 'ini';
  return Object.keys(CODE_LANGUAGES).find((k) => CODE_LANGUAGES[k].ext.includes(ext)) || 'auto';
}

/** "1,3-5" → Set {1,3,4,5} */
export function parseLineList(text) {
  const out = new Set();
  for (const part of String(text || '').split(/[\s,]+/)) {
    const m = part.match(/^(\d{1,5})(?:-(\d{1,5}))?$/);
    if (!m) continue;
    const a = Number(m[1]);
    const b = Math.min(Number(m[2] || m[1]), a + 2000);
    for (let i = a; i <= b; i++) out.add(i);
  }
  return out;
}

/**
 * Split highlighted HTML into lines, closing and reopening the <span>s that
 * cross a line break (multi-line comments, strings…).
 */
export function splitHtmlLines(html) {
  const lines = [];
  const open = [];
  let cur = '';
  for (const part of String(html).split(/(<span[^>]*>|<\/span>|\n)/)) {
    if (!part) continue;
    if (part === '\n') {
      lines.push(cur + '</span>'.repeat(open.length));
      cur = open.join('');
    } else if (part.startsWith('<span')) { open.push(part); cur += part; } else if (part === '</span>') { open.pop(); cur += part; } else cur += part;
  }
  lines.push(cur);
  return lines;
}

const linesHtml = (lines, marked, start) => lines.map((l, i) => {
  const n = start + i;
  return `<span class="ol-code-line${marked.has(n) ? ' is-marked' : ''}" data-n="${n}">${l || ' '}</span>`;
}).join('');

/** Code with tabs as the chosen width and no trailing blank lines. */
const prepare = (d) => String(d.code || '').replace(/\r\n?/g, '\n').replace(/\n+$/, '').replace(/\t/g, ' '.repeat(Number(d.tabSize) || 2));

export const CODE_THEMES = {
  'github-dark': { label: 'GitHub Dark', bg: '#0d1117', fg: '#e6edf3', bar: '#161b22', gutter: '#6e7681', mark: 'rgba(56,139,253,.15)', kw: '#ff7b72', str: '#a5d6ff', num: '#79c0ff', com: '#8b949e', fn: '#d2a8ff', type: '#ffa657', attr: '#79c0ff', tag: '#7ee787', var: '#ffa657', meta: '#8b949e', add: '#3fb950', del: '#f85149' },
  'github-light': { label: 'GitHub Light', bg: '#ffffff', fg: '#1f2328', bar: '#f6f8fa', gutter: '#8c959f', mark: 'rgba(84,174,255,.18)', kw: '#cf222e', str: '#0a3069', num: '#0550ae', com: '#6e7781', fn: '#8250df', type: '#953800', attr: '#0550ae', tag: '#116329', var: '#953800', meta: '#6e7781', add: '#116329', del: '#82071e', light: true },
  'one-dark': { label: 'One Dark', bg: '#282c34', fg: '#abb2bf', bar: '#21252b', gutter: '#5c6370', mark: 'rgba(97,175,239,.14)', kw: '#c678dd', str: '#98c379', num: '#d19a66', com: '#7f848e', fn: '#61afef', type: '#e5c07b', attr: '#d19a66', tag: '#e06c75', var: '#e06c75', meta: '#56b6c2', add: '#98c379', del: '#e06c75' },
  dracula: { label: 'Dracula', bg: '#282a36', fg: '#f8f8f2', bar: '#21222c', gutter: '#6272a4', mark: 'rgba(189,147,249,.16)', kw: '#ff79c6', str: '#f1fa8c', num: '#bd93f9', com: '#6272a4', fn: '#50fa7b', type: '#8be9fd', attr: '#50fa7b', tag: '#ff79c6', var: '#f8f8f2', meta: '#ffb86c', add: '#50fa7b', del: '#ff5555' },
  monokai: { label: 'Monokai', bg: '#272822', fg: '#f8f8f2', bar: '#1e1f1c', gutter: '#75715e', mark: 'rgba(230,219,116,.12)', kw: '#f92672', str: '#e6db74', num: '#ae81ff', com: '#75715e', fn: '#a6e22e', type: '#66d9ef', attr: '#a6e22e', tag: '#f92672', var: '#fd971f', meta: '#75715e', add: '#a6e22e', del: '#f92672' },
  nord: { label: 'Nord', bg: '#2e3440', fg: '#d8dee9', bar: '#272c36', gutter: '#616e88', mark: 'rgba(136,192,208,.14)', kw: '#81a1c1', str: '#a3be8c', num: '#b48ead', com: '#7b88a1', fn: '#88c0d0', type: '#8fbcbb', attr: '#8fbcbb', tag: '#81a1c1', var: '#d8dee9', meta: '#5e81ac', add: '#a3be8c', del: '#bf616a' },
  'night-owl': { label: 'Night Owl', bg: '#011627', fg: '#d6deeb', bar: '#01111d', gutter: '#4b6479', mark: 'rgba(130,170,255,.14)', kw: '#c792ea', str: '#ecc48d', num: '#f78c6c', com: '#637777', fn: '#82aaff', type: '#ffcb8b', attr: '#addb67', tag: '#7fdbca', var: '#addb67', meta: '#7fdbca', add: '#addb67', del: '#ef5350' },
  'solarized-light': { label: 'Solarized Light', bg: '#fdf6e3', fg: '#586e75', bar: '#eee8d5', gutter: '#93a1a1', mark: 'rgba(181,137,0,.12)', kw: '#859900', str: '#2aa198', num: '#d33682', com: '#93a1a1', fn: '#268bd2', type: '#b58900', attr: '#b58900', tag: '#268bd2', var: '#cb4b16', meta: '#cb4b16', add: '#859900', del: '#dc322f', light: true },
};
const themeVars = (id) => {
  const t = CODE_THEMES[id] || CODE_THEMES['github-dark'];
  return Object.entries(t).filter(([k]) => !['label', 'light'].includes(k)).map(([k, v]) => `--c-${k}:${v}`).join(';');
};

export default {
  type: 'code',
  label: 'Code',
  description: 'A code snippet with syntax colors: SQL, HTML, CSS, JavaScript, Markdown / README, Python and more.',
  icon: 'code',
  category: 'Content',
  cssClasses: [
    { selector: '.ol-code', description: 'Code box (theme colors as --c-bg, --c-fg, --c-kw, --c-str…)' },
    { selector: '.ol-code-bar', description: 'Bar with the file name, language and Copy button' },
    { selector: '.ol-code-pre', description: 'The code (scrolls sideways unless “Wrap long lines” is on)' },
    { selector: '.ol-code-line', description: 'One line (.is-marked when highlighted)' },
  ],
  fields: [
    { key: 'filename', type: 'text', label: 'File name or title (optional)', max: 80, placeholder: 'README.md, query.sql, index.html…',
      help: 'With “Detect” as the language, the extension picks it (README → Markdown).' },
    { key: 'language', type: 'select', label: 'Language', default: 'auto', options: () => [
      { value: 'auto', label: 'Detect' },
      ...Object.entries(CODE_LANGUAGES).map(([value, l]) => ({ value, label: l.label })),
    ] },
    { key: 'code', type: 'source', label: 'Code', max: 20000, required: true, default: 'SELECT name, price\nFROM products\nWHERE stock > 0\nORDER BY price DESC;' },
    { key: 'theme', type: 'select', label: 'Colors', default: 'github-dark', options: Object.entries(CODE_THEMES).map(([value, t]) => ({ value, label: t.label })) },
    { key: 'lineNumbers', type: 'toggle', label: 'Line numbers', default: true },
    { key: 'startLine', type: 'number', label: 'First line number', min: 1, max: 99999, default: 1, showIf: { key: 'lineNumbers', truthy: true } },
    { key: 'marked', type: 'text', label: 'Highlight lines (optional)', max: 120, placeholder: '3, 7-9', translate: false },
    { key: 'wrap', type: 'toggle', label: 'Wrap long lines', default: false, help: 'Off: long lines scroll sideways.' },
    { key: 'maxHeight', type: 'range', label: 'Max height', min: 0, max: 800, step: 20, default: 0, unit: 'px', help: '0 = show all the code.' },
    { key: 'fontSize', type: 'range', label: 'Text size', min: 11, max: 18, default: 13, unit: 'px' },
    { key: 'tabSize', type: 'select', label: 'Tab width', default: '2', options: [{ value: '2', label: '2 spaces' }, { value: '4', label: '4 spaces' }, { value: '8', label: '8 spaces' }] },
    { key: 'bar', type: 'choice', label: 'Top bar', default: 'window', options: [
      { value: 'window', label: 'Window (● ● ●)' }, { value: 'simple', label: 'Simple' }, { value: 'none', label: 'None' },
    ] },
    { key: 'copyButton', type: 'toggle', label: 'Copy button', default: true },
    { key: 'display', type: 'choice', label: 'Show as', default: 'always', options: [
      { value: 'always', label: 'Always visible' }, { value: 'button', label: 'Button that opens it' },
    ] },
    { key: 'buttonLabel', type: 'text', label: 'Button text', placeholder: 'Defaults to the file name or “See the code”', showIf: { key: 'display', equals: 'button' } },
    { key: 'startOpen', type: 'toggle', label: 'Start open', default: false, showIf: { key: 'display', equals: 'button' } },
  ],
  summary: (d) => {
    const lang = codeLanguage(d);
    const n = prepare(d).split('\n').length;
    return `${d.filename ? `${d.filename} · ` : ''}${lang === 'auto' ? 'Detect' : CODE_LANGUAGES[lang].label} · ${n} line${n === 1 ? '' : 's'}`;
  },
  render(d, ctx) {
    const code = prepare(d);
    const lang = codeLanguage(d);
    const marked = parseLineList(d.marked);
    const start = d.lineNumbers ? Number(d.startLine) || 1 : 1;
    const lines = code.split('\n').map(esc);
    const digits = String(start + lines.length - 1).length;
    const label = lang === 'auto' ? '' : CODE_LANGUAGES[lang].label.split(' / ')[0];
    const bar = d.bar === 'none' ? '' : `<div class="ol-code-bar">`
      + (d.bar === 'window' ? '<span class="ol-code-dots" aria-hidden="true"><i></i><i></i><i></i></span>' : '')
      + `<span class="ol-code-name">${esc(d.filename || label)}</span>`
      + (d.filename && label ? `<span class="ol-code-lang">${esc(label)}</span>` : '')
      + (d.copyButton ? `<button type="button" class="ol-code-copy" aria-label="Copy the code">${icon('copy', 14)}<span>Copy</span></button>` : '')
      + '</div>';
    const floating = d.bar === 'none' && d.copyButton
      ? `<button type="button" class="ol-code-copy is-floating" aria-label="Copy the code">${icon('copy', 14)}</button>` : '';
    const box = `<div class="ol-code notranslate${d.lineNumbers ? ' has-numbers' : ''}${d.wrap ? ' is-wrapped' : ''}${CODE_THEMES[d.theme]?.light ? ' is-light' : ''}" translate="no"`
      + ` style="${themeVars(d.theme)};--c-size:${Number(d.fontSize) || 13}px;--c-digits:${digits}ch${Number(d.maxHeight) ? `;--c-max:${Number(d.maxHeight)}px` : ''}" data-lang="${esc(lang)}">`
      + `${bar}${floating}<pre class="ol-code-pre" tabindex="0"><code class="ol-code-src">${linesHtml(lines, marked, start)}</code></pre></div>`;
    if (d.display === 'button') {
      return toggleButton({ ctx, iconName: 'code', label: d.buttonLabel || d.filename || 'See the code', sub: label, body: box, open: d.startOpen });
    }
    return box;
  },
  hydrate(el, d) {
    const box = el.querySelector('.ol-code');
    if (!box) return;
    const code = prepare(d);
    // Copy button.
    box.querySelectorAll('.ol-code-copy').forEach((btn) => btn.addEventListener('click', async () => {
      const ok = await copyText(el.ownerDocument, String(d.code || '').replace(/\r\n?/g, '\n').replace(/\n+$/, ''));
      const text = btn.querySelector('span');
      btn.classList.toggle('is-done', ok);
      if (text) text.textContent = ok ? 'Copied!' : 'Copy failed';
      setTimeout(() => { btn.classList.remove('is-done'); if (text) text.textContent = 'Copy'; }, 1600);
    }));
    // Syntax colors (highlight.js, loaded on demand).
    const lang = box.dataset.lang;
    if (lang === 'plaintext' || !code.trim()) return;
    highlight(code, lang).then((res) => {
      if (!res || !el.isConnected) return;
      const marked = parseLineList(d.marked);
      const start = d.lineNumbers ? Number(d.startLine) || 1 : 1;
      box.querySelector('.ol-code-src').innerHTML = linesHtml(splitHtmlLines(res.html), marked, start);
      if (lang === 'auto' && res.language && d.bar !== 'none' && !d.filename) {
        const name = box.querySelector('.ol-code-name');
        if (name && !name.textContent) name.textContent = CODE_LANGUAGES[res.language]?.label.split(' / ')[0] || '';
      }
    }).catch((err) => console.warn('[otrelink] code colors', err));
  },
  css: `.ol-root .ol-code{position:relative;background:var(--c-bg);color:var(--c-fg);border-radius:var(--ol-surface-radius);overflow:hidden;text-align:left;font-size:var(--c-size);box-shadow:0 1px 0 rgba(255,255,255,.04) inset,0 10px 30px -18px rgba(0,0,0,.5)}
.ol-root .ol-code.is-light{box-shadow:0 0 0 1px rgba(0,0,0,.08)}
.ol-root .ol-code-bar{display:flex;align-items:center;gap:10px;padding:9px 12px;background:var(--c-bar);border-bottom:1px solid color-mix(in srgb,var(--c-fg) 10%,transparent);font:600 12px/1.2 system-ui,-apple-system,sans-serif;min-height:38px}
.ol-root .ol-code-dots{display:flex;gap:6px;flex:none}
.ol-root .ol-code-dots i{width:11px;height:11px;border-radius:50%;background:#ff5f57}
.ol-root .ol-code-dots i:nth-child(2){background:#febc2e}.ol-root .ol-code-dots i:nth-child(3){background:#28c840}
.ol-root .ol-code-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;opacity:.85}
.ol-root .ol-code-lang{flex:none;font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;opacity:.5}
.ol-root .ol-code-copy{flex:none;display:inline-flex;align-items:center;gap:5px;font:inherit;font-size:11.5px;border:0;border-radius:7px;padding:5px 9px;cursor:pointer;background:color-mix(in srgb,var(--c-fg) 10%,transparent);color:var(--c-fg);transition:background .15s}
.ol-root .ol-code-copy:hover{background:color-mix(in srgb,var(--c-fg) 18%,transparent)}
.ol-root .ol-code-copy.is-done{background:color-mix(in srgb,var(--c-add) 30%,transparent)}
.ol-root .ol-code-copy.is-floating{position:absolute;top:8px;right:8px;z-index:1;padding:7px;opacity:.75}
.ol-root .ol-code-pre{margin:0;padding:12px 0;overflow:auto;max-height:var(--c-max,none);font:400 1em/1.6 ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,"Liberation Mono",monospace;tab-size:2;scrollbar-width:thin;outline:none}
.ol-root .ol-code-pre:focus-visible{box-shadow:inset 0 0 0 2px var(--c-num)}
.ol-root .ol-code-src{display:block;min-width:max-content;font:inherit;background:none;padding:0}
.ol-root .is-wrapped .ol-code-src{min-width:0}
.ol-root .ol-code-line{display:block;padding:0 16px;white-space:pre}
.ol-root .is-wrapped .ol-code-line{white-space:pre-wrap;overflow-wrap:anywhere}
.ol-root .has-numbers .ol-code-line{padding-left:calc(var(--c-digits) + 30px);text-indent:calc(-1 * (var(--c-digits) + 14px))}
.ol-root .has-numbers .ol-code-line::before{content:attr(data-n);display:inline-block;width:var(--c-digits);margin-right:14px;text-align:right;color:var(--c-gutter);text-indent:0;-webkit-user-select:none;user-select:none}
.ol-root .ol-code-line.is-marked{background:var(--c-mark);box-shadow:inset 3px 0 0 var(--c-num)}
.ol-root .ol-code .hljs-keyword,.ol-root .ol-code .hljs-selector-tag,.ol-root .ol-code .hljs-built_in.hljs-keyword,.ol-root .ol-code .hljs-doctag{color:var(--c-kw)}
.ol-root .ol-code .hljs-string,.ol-root .ol-code .hljs-regexp,.ol-root .ol-code .hljs-template-string,.ol-root .ol-code .hljs-char{color:var(--c-str)}
.ol-root .ol-code .hljs-number,.ol-root .ol-code .hljs-literal,.ol-root .ol-code .hljs-symbol,.ol-root .ol-code .hljs-bullet,.ol-root .ol-code .hljs-link{color:var(--c-num)}
.ol-root .ol-code .hljs-comment,.ol-root .ol-code .hljs-quote{color:var(--c-com);font-style:italic}
.ol-root .ol-code .hljs-title,.ol-root .ol-code .hljs-title.function_,.ol-root .ol-code .hljs-function .hljs-title,.ol-root .ol-code .hljs-section{color:var(--c-fn)}
.ol-root .ol-code .hljs-type,.ol-root .ol-code .hljs-title.class_,.ol-root .ol-code .hljs-built_in,.ol-root .ol-code .hljs-selector-class,.ol-root .ol-code .hljs-selector-id{color:var(--c-type)}
.ol-root .ol-code .hljs-attr,.ol-root .ol-code .hljs-attribute,.ol-root .ol-code .hljs-property,.ol-root .ol-code .hljs-selector-attr,.ol-root .ol-code .hljs-selector-pseudo{color:var(--c-attr)}
.ol-root .ol-code .hljs-tag,.ol-root .ol-code .hljs-name{color:var(--c-tag)}
.ol-root .ol-code .hljs-tag .hljs-attr{color:var(--c-attr)}
.ol-root .ol-code .hljs-tag .hljs-string{color:var(--c-str)}
.ol-root .ol-code .hljs-variable,.ol-root .ol-code .hljs-template-variable,.ol-root .ol-code .hljs-params{color:var(--c-var)}
.ol-root .ol-code .hljs-meta,.ol-root .ol-code .hljs-meta .hljs-keyword{color:var(--c-meta)}
.ol-root .ol-code .hljs-addition{color:var(--c-add);background:color-mix(in srgb,var(--c-add) 12%,transparent)}
.ol-root .ol-code .hljs-deletion{color:var(--c-del);background:color-mix(in srgb,var(--c-del) 12%,transparent)}
.ol-root .ol-code .hljs-emphasis{font-style:italic}
.ol-root .ol-code .hljs-strong{font-weight:700}
.ol-root .ol-code .hljs-code{color:var(--c-str)}`,
};

// ── highlight.js on demand ────────────────────────────────────
let corePromise = null;
const registered = new Set();
async function hljsCore() {
  if (!corePromise) corePromise = import('highlight.js/lib/core').then((m) => m.default || m);
  return corePromise;
}
async function useLanguage(hljs, id) {
  if (registered.has(id) || !CODE_LANGUAGES[id]?.load) return;
  const mod = await CODE_LANGUAGES[id].load();
  if (!registered.has(id)) { hljs.registerLanguage(id, mod.default || mod); registered.add(id); }
}

/** → { html, language } */
export async function highlight(code, lang) {
  const hljs = await hljsCore();
  if (lang === 'auto') {
    await Promise.all(Object.keys(CODE_LANGUAGES).map((id) => useLanguage(hljs, id)));
    const r = hljs.highlightAuto(code, Object.keys(CODE_LANGUAGES).filter((id) => CODE_LANGUAGES[id].load));
    return { html: r.value, language: r.language };
  }
  await useLanguage(hljs, lang);
  // HTML colors its <style> and <script> with these.
  if (lang === 'xml') await Promise.all(['css', 'javascript'].map((id) => useLanguage(hljs, id)));
  return { html: hljs.highlight(code, { language: lang, ignoreIllegals: true }).value, language: lang };
}
