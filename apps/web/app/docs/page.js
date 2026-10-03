import Link from 'next/link';
import {
  blockTypes, themes, wallpapers, buttonStyles, buttonHovers, fonts, socials, attentionAnimations, entranceAnimations,
  designGroups, cssVariables, cssElements, cssModifiers, cssRecipes, pageStructure, icon,
} from '@otrelink/core';
import { Logo, CoreIcon } from '@/components/ui';
import CodeBlock from '@/components/docs/CodeBlock';

export const metadata = {
  title: 'Docs — Otrelink',
  description: 'How to use Otrelink: blocks, styling, custom CSS reference, sharing and analytics.',
};

// Table of contents. Everything below is generated from @otrelink/core where possible,
// so new modules (blocks, variables, themes…) appear here automatically.
const toc = [
  { id: 'getting-started', label: 'Getting started' },
  { id: 'blocks', label: 'Blocks' },
  { id: 'customizing', label: 'Customizing' },
  { id: 'custom-css', label: 'Custom CSS' },
  { id: 'css-structure', label: 'Page structure', sub: true },
  { id: 'css-elements', label: 'Elements', sub: true },
  { id: 'css-variables', label: 'Variables', sub: true },
  { id: 'css-blocks', label: 'Block classes', sub: true },
  { id: 'css-modifiers', label: 'Modifiers', sub: true },
  { id: 'css-recipes', label: 'Recipes', sub: true },
  { id: 'css-tips', label: 'Tips & limits', sub: true },
  { id: 'sharing', label: 'Sharing & analytics' },
  { id: 'data', label: 'Backup & data' },
  { id: 'shortcuts', label: 'Keyboard shortcuts' },
];

const fieldLabel = Object.fromEntries(designGroups.flatMap((g) => g.fields.map((f) => [f.key, `${g.label} → ${f.label}`])));

function H2({ id, children }) {
  return <h2 id={id} className="font-display text-3xl font-extrabold tracking-tight scroll-mt-24 mt-16 mb-4">{children}</h2>;
}
function H3({ id, children }) {
  return <h3 id={id} className="font-display text-xl font-bold tracking-tight scroll-mt-24 mt-10 mb-3">{children}</h3>;
}
function P({ children }) {
  return <p className="text-[15px] leading-7 text-ink/80 mb-4 max-w-[68ch]">{children}</p>;
}
function C({ children }) {
  return <code className="font-mono text-[0.86em] bg-panel border border-line rounded-md px-1.5 py-0.5 [overflow-wrap:anywhere]">{children}</code>;
}
function Table({ head, rows }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-panel mb-6">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted border-b border-line">
            {head.map((h) => <th key={h} className="font-medium px-4 py-2.5 whitespace-nowrap">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-line/60 last:border-0 align-top">
              {r.map((cell, j) => <td key={j} className="px-4 py-2.5">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Note({ children }) {
  return <div className="rounded-2xl bg-accent-soft text-[14px] leading-6 px-4 py-3 mb-6 max-w-[68ch]">{children}</div>;
}

export default function DocsPage() {
  const categories = [...new Set(blockTypes.list().map((b) => b.category || 'Other'))];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 bg-canvas/90 backdrop-blur border-b border-line/70">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <Link href="/"><Logo /></Link>
            <span className="text-muted text-sm">Docs</span>
          </div>
          <Link href="/dashboard" className="h-9 px-4 inline-flex items-center rounded-full bg-ink text-white text-sm font-semibold">Open dashboard</Link>
        </div>
        <nav className="lg:hidden flex gap-1 overflow-x-auto px-4 pb-2 [scrollbar-width:none]" aria-label="Docs sections">
          {toc.filter((t) => !t.sub).map((t) => (
            <a key={t.id} href={`#${t.id}`} className="shrink-0 h-8 px-3 inline-flex items-center rounded-full bg-panel border border-line text-[13px]">{t.label}</a>
          ))}
        </nav>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-12">
        <nav className="hidden lg:block sticky top-20 self-start py-8" aria-label="Docs sections">
          <ul className="space-y-0.5 text-sm">
            {toc.map((t) => (
              <li key={t.id}>
                <a href={`#${t.id}`} className={`block py-1.5 rounded-lg hover:text-ink ${t.sub ? 'pl-4 text-muted text-[13px]' : 'font-medium text-ink/80'}`}>{t.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <main className="py-8 pb-24 min-w-0">
          <h1 className="font-display text-5xl font-extrabold tracking-tight">Otrelink docs</h1>
          <P>Everything you need to build your page: how blocks work, every styling option, and a complete reference for custom CSS.</P>

          {/* ── Getting started ── */}
          <H2 id="getting-started">Getting started</H2>
          <ol className="list-decimal pl-5 space-y-2 text-[15px] leading-7 text-ink/80 mb-6 max-w-[68ch]">
            <li><b>Create an account</b> and pick your username. Your page lives at <C>your-domain/username</C>.</li>
            <li><b>Add blocks</b> in <i>Links</i> with <i>Add block</i>. Drag the handle to reorder, use the switch to hide a block without deleting it.</li>
            <li><b>Make it yours</b> in <i>Profile</i>, <i>Theme</i>, <i>Wallpaper</i> and <i>Style</i>. The phone preview updates as you type.</li>
            <li><b>Save</b> with the Save button or <C>Ctrl + S</C>. Changes are not public until you save.</li>
            <li><b>Share</b> your link or QR code from <i>Settings</i>.</li>
          </ol>
          <Note>You can have up to 10 pages per account. Create more from <i>Your pages</i>.</Note>

          {/* ── Blocks ── */}
          <H2 id="blocks">Blocks</H2>
          <P>Blocks are the pieces of your page. Every block also has <i>Animation &amp; schedule</i> options: an attention animation, and dates to show it from or hide it after (scheduled blocks are dimmed in the preview and hidden on the public page outside their dates).</P>
          {categories.map((cat) => (
            <div key={cat} className="mb-6">
              <h3 className="font-semibold text-sm text-muted mb-2">{cat}</h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {blockTypes.list().filter((b) => (b.category || 'Other') === cat).map((b) => (
                  <div key={b.type} className="flex items-start gap-3 rounded-2xl bg-panel border border-line p-3">
                    <CoreIcon svg={icon(b.icon, 18)} className="size-9 rounded-xl bg-soft shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">{b.label} <span className="font-mono text-xs text-muted">.ol-b-{b.type}</span></p>
                      <p className="text-xs text-muted mt-0.5">{b.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <P>Text blocks and FAQ answers support light formatting: <C>**bold**</C>, <C>*italic*</C>, <C>~~strike~~</C> and <C>[link text](https://…)</C>.</P>

          {/* ── Customizing ── */}
          <H2 id="customizing">Customizing</H2>
          <Table
            head={['Section', 'What it does']}
            rows={[
              ['Theme', `${themes.list().length} presets (${themes.list().map((t) => t.label).join(', ')}). Picking a theme resets colors, fonts and buttons to that preset; your Custom CSS and entrance animation are kept.`],
              ['Wallpaper', `${wallpapers.list().length} background types: ${wallpapers.list().map((w) => w.label).join(', ')}. When text becomes hard to read you get a one-click fix.`],
              ['Style → Buttons', `${buttonStyles.list().length} styles (${buttonStyles.list().map((s) => s.label).join(', ')}), radius, colors, border, shadow, height, hover effect (${buttonHovers.list().map((h) => h.label).join(', ')}), alignment and text case.`],
              ['Style → Typography', `${fonts.list().length} fonts for title and body, colors, sizes and weight.`],
              ['Style → Header', 'Layout (Classic, Hero = big cover photo, Left aligned), avatar shape/size/border and social icons position, style and color.'],
              ['Style → Cards & surfaces', 'Background, text color and radius of cards (text, FAQ, countdown) and embeds.'],
              ['Style → Layout & motion', `Content width, spacing, top padding and entrance animation (${entranceAnimations.list().map((a) => a.label).join(', ')}).`],
              ['Style → Custom CSS', 'Your own CSS on top of everything. See below.'],
              ['Profile', `Picture, title, bio, verified badge and social icons (${socials.list().length} platforms).`],
            ]}
          />

          {/* ── Custom CSS ── */}
          <H2 id="custom-css">Custom CSS</H2>
          <P>Go to <i>Style → Custom CSS</i> and write regular CSS. It is added after all other styles, so it wins over the built-in ones, and you see the result live in the preview.</P>
          <Note>
            <b>Always start your selectors with <C>.ol-root</C></b> (for example <C>.ol-root .ol-btn</C>). That keeps your CSS inside your page and gives it enough priority over the default styles.
          </Note>
          <CodeBlock code={`.ol-root .ol-btn {\n  border-radius: 6px;\n  letter-spacing: .04em;\n}\n\n.ol-root .ol-title {\n  font-size: 32px;\n}`} />

          <H3 id="css-structure">Page structure</H3>
          <P>This is how a rendered page is built. Class names are stable: they won&apos;t change between versions without notice.</P>
          <CodeBlock code={pageStructure} label="HTML structure" />

          <H3 id="css-elements">Elements</H3>
          <Table head={['Selector', 'What it is']} rows={cssElements.map((e) => [<C key="s">{e.selector}</C>, e.description])} />

          <H3 id="css-variables">Variables</H3>
          <P>The options in <i>Style</i> are exposed as CSS variables on <C>.ol-root</C>. Use them to stay consistent with your settings, or override them to change many things at once.</P>
          <CodeBlock code={`/* Use them */\n.ol-root .ol-bio {\n  color: var(--ol-title-color);\n  font-family: var(--ol-title-font);\n}\n\n/* Or override them */\n.ol-root {\n  --ol-gap: 20px;\n  --ol-btn-radius: 0px;\n}`} />
          <div className="mt-6" />
          <Table
            head={['Variable', 'Set by', 'Description']}
            rows={cssVariables.map((v) => [<C key="n">{v.name}</C>, <span key="s" className="text-muted whitespace-nowrap">{fieldLabel[v.setting] || v.setting}</span>, v.description])}
          />

          <H3 id="css-blocks">Block classes</H3>
          <P>Every block is wrapped in <C>.ol-block.ol-b-&#123;type&#125;</C>. Inside, each type uses these classes:</P>
          <Table
            head={['Block', 'Wrapper', 'Inner classes']}
            rows={blockTypes.list().map((b) => [
              <span key="l" className="font-medium whitespace-nowrap">{b.label}</span>,
              <C key="w">.ol-b-{b.type}</C>,
              <ul key="c" className="space-y-1">
                {(b.cssClasses || []).map((c) => <li key={c.selector}><C>{c.selector}</C> <span className="text-muted">— {c.description}</span></li>)}
              </ul>,
            ])}
          />

          <H3 id="css-modifiers">Modifiers</H3>
          <Table head={['Selector', 'When it applies']} rows={cssModifiers.map((m) => [<C key="s">{m.selector}</C>, m.description])} />
          <P>Attention animations available: {attentionAnimations.list().filter((a) => a.id !== 'none').map((a) => a.id).join(', ')}.</P>

          <H3 id="css-recipes">Recipes</H3>
          <P>Copy, paste in <i>Style → Custom CSS</i>, and adjust.</P>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
            {cssRecipes.map((r) => (
              <div key={r.title}>
                <p className="font-semibold text-sm mb-2">{r.title}</p>
                <CodeBlock code={r.css} />
              </div>
            ))}
          </div>

          <H3 id="css-tips">Tips &amp; limits</H3>
          <ul className="list-disc pl-5 space-y-2 text-[15px] leading-7 text-ink/80 mb-6 max-w-[68ch]">
            <li><b>Target one block:</b> open the block in <i>Links → Animation &amp; schedule</i> and copy its selector (<C>[data-block-id=&quot;…&quot;]</C>).</li>
            <li><b>Media queries</b> work as usual, e.g. <C>@media (min-width: 768px)</C>.</li>
            <li><b>Not allowed:</b> <C>@import</C> and the <C>&lt;</C> character are removed for security. To use a font, pick it in <i>Style → Typography</i>.</li>
            <li><b>Wallpaper effects</b> often use <C>.ol-bg::before</C> and <C>.ol-bg::after</C>. Override them there.</li>
            <li><b>Background images:</b> upload the image somewhere in the dashboard (e.g. an Image block), copy its URL and use <C>url(&quot;…&quot;)</C>.</li>
            <li>Maximum length is 10,000 characters. If something breaks, clear the box and save: the page goes back to normal.</li>
          </ul>

          {/* ── Sharing ── */}
          <H2 id="sharing">Sharing &amp; analytics</H2>
          <P>In <i>Settings</i> you can copy your link, download a QR code, change your username, add an SEO title, description and sharing image, hide the page, hide the footer, or show a sensitive-content warning.</P>
          <Table
            head={['Metric', 'Meaning']}
            rows={[
              ['Views', 'Times your public page was opened (bots are ignored).'],
              ['Unique visitors', 'Different browsers that opened your page in the selected range.'],
              ['Clicks', 'Clicks on links, buttons, images with a link and social icons.'],
              ['Click rate', 'Clicks ÷ views.'],
              ['Top blocks / Social icons', 'Which links get the most clicks. Also shown on each block card in Links.'],
              ['Referrers', 'Where visitors came from (e.g. instagram.com, direct).'],
              ['Devices / Countries', 'Mobile, desktop or tablet; country when the host provides it.'],
            ]}
          />
          <Note>The dashboard preview never counts views or clicks. Analytics are kept for 180 days.</Note>

          {/* ── Data ── */}
          <H2 id="data">Backup &amp; data</H2>
          <P><i>Settings → Backup</i> exports your page as a JSON file and imports it back (useful to copy a design to another page). Importing replaces the current content until you save. <i>Delete page</i> removes the page, its link and its analytics permanently.</P>

          {/* ── Shortcuts ── */}
          <H2 id="shortcuts">Keyboard shortcuts</H2>
          <Table
            head={['Keys', 'Action']}
            rows={[
              [<C key="1">Ctrl / ⌘ + S</C>, 'Save'],
              [<C key="2">Ctrl / ⌘ + Z</C>, 'Undo (when not typing in a field)'],
              [<C key="3">Ctrl / ⌘ + Shift + Z</C>, 'Redo (also Ctrl + Y)'],
            ]}
          />
        </main>
      </div>
    </div>
  );
}
