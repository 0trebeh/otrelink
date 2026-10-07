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
  { id: 'bookings', label: 'Bookings & agenda' },
  { id: 'surveys', label: 'Surveys' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'catalog', label: 'Catalog' },
  { id: 'plans', label: 'Plans' },
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
function Warning({ title = 'Important', children }) {
  return (
    <div role="note" className="rounded-2xl border border-amber-300 bg-amber-50 text-amber-950 text-[14px] leading-6 px-4 py-3 mb-6 max-w-[68ch]">
      <p className="font-semibold mb-1">⚠️ {title}</p>
      {children}
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
          <P><b>Block style:</b> open a block and use <i>Style</i> to give it its own look: button style, button, text, border and shadow colors, corner radius, card colors and text color (plus opacity and blur for Glass). Anything left as “Same as the page” keeps your page design. A collection&apos;s style also applies to the blocks inside it, unless they have their own. Styled blocks get the class <C>.ol-styled</C> (and <C>.ol-bs-&lt;style&gt;</C> when they change the button style).</P>
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
          <P><b>Collections</b> can hold any block, including other collections (up to 4 levels). Drag a block onto a collection&apos;s area to put it inside, drag it out to take it out, or use <i>Move to…</i> in the block. In Grid, Carousel and Showcase layouts, links are shown as image cards (their thumbnail is the cover).</P>
          <P><b>Embed</b> takes the embed code from almost any service (YouTube, Spotify, Calendly, Google Forms, Typeform, widgets…) or just an https link. Choose <i>Always visible</i> or <i>Button that opens it</i>; <b>Map</b> has the same option. Leave the height at 0 to use the size from the code (videos keep their proportions) or to fit the content automatically.</P>
          <Note>For safety, an embed with scripts runs in an isolated frame: it can’t read your page or your visitors’ data. A few widgets that need cookies or storage may not work there; if the service offers a plain <C>&lt;iframe&gt;</C> code, use that one.</Note>
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
          <P><b>Adjusting images.</b> The profile picture, the wallpaper image, the Image block (with a shape other than Original) and link thumbnails have an <i>Adjust</i> control under the image. Click or drag on the preview to choose the part that stays visible, use <i>Zoom</i> to get closer, and pick <i>Fill</i> (fills the shape and crops), <i>Whole image</i> (no crop) or, for the profile picture, <i>Original shape</i> (keeps its proportions).</P>

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
            <li><b>Target one block:</b> open the block in <i>Links → Style</i> and copy its selector (<C>[data-block-id=&quot;…&quot;]</C>).</li>
            <li><b>Media queries</b> work as usual, e.g. <C>@media (min-width: 768px)</C>.</li>
            <li><b>Not allowed:</b> <C>@import</C> and the <C>&lt;</C> character are removed for security. To use a font, pick it in <i>Style → Typography</i>.</li>
            <li><b>Wallpaper effects</b> often use <C>.ol-bg::before</C> and <C>.ol-bg::after</C>. Override them there.</li>
            <li><b>Background images:</b> upload the image somewhere in the dashboard (e.g. an Image block), copy its URL and use <C>url(&quot;…&quot;)</C>.</li>
            <li>Maximum length is 10,000 characters. If something breaks, clear the box and save: the page goes back to normal.</li>
          </ul>

          {/* ── Sharing ── */}
          <H2 id="bookings">Bookings &amp; agenda</H2>
          <P>Add a <i>Booking</i> block (Contact category) to let visitors book an appointment. Set your services (name, duration, price), weekly hours and your time zone. Visitors see the free times in their own time zone; a taken time disappears for everyone.</P>
          <Table
            head={['Option', 'What it does']}
            rows={[
              ['Weekly hours', 'Turn each day on or off and give it one or more time ranges (several ranges = breaks, e.g. 9:00–13:00 and 14:00–18:00). Use the copy button to repeat a day’s hours on other days. An end time of 00:00 means midnight.'],
              ['Days off & special dates', 'For one date or a range of dates: Closed (no bookings), Block hours (your usual hours except some times) or Special hours (only those hours, even on a day you are normally closed). You can add a private note. Also editable from Agenda.'],
              ['Slot step', 'How often a start time is offered (every 5 min to 2 hours, or the length of the service).'],
              ['Buffer', 'Free minutes kept after each appointment.'],
              ['Minimum notice', 'How soon a visitor can book (from 30 minutes to 1 week ahead).'],
              ['Days ahead', 'How far into the future bookings are allowed (up to 365 days).'],
              ['Appointments per day', 'Optional daily limit. When a day reaches it, it shows no free times.'],
              ['Confirmation', 'Automatic, or Manual: bookings stay Pending until you confirm them in Agenda.'],
              ['Reminders', 'When you get a reminder before each appointment (e.g. 1 day and 1 hour before).'],
              ['Meeting link', 'Your recurring Zoom, Google Meet or Teams link. It is added to every appointment: in the visitor’s calendar file, in your calendar feed and in emails. Choose whether visitors get it as soon as they book or only after you confirm.'],
              ['Visitors can cancel', 'Lets visitors cancel from your page, up to the time you choose (e.g. 2 hours before). The time becomes free again and you get a notification.'],
            ]}
          />
          <P>The <i>Agenda</i> section of the dashboard lists upcoming, pending, past and cancelled bookings. From there you can confirm, reschedule or cancel, and contact the visitor by email, phone or WhatsApp. A badge shows how many bookings are waiting for confirmation.</P>
          <P><b>Notifications:</b> in Agenda, press <i>Turn on</i> to get an alert on this device for every new booking and for reminders. Install the dashboard as an app for the best result.</P>
          <P><b>Calendar:</b> copy the private calendar link from Agenda and subscribe to it from Google Calendar, Apple Calendar or Outlook. If the link leaks, press <i>Reset link</i>.</P>
          <P>Visitors can add the appointment to their calendar (with alarms that follow your <i>Reminders</i> setting) after booking, and receive emails when the server has email configured. When they come back to your page on the same browser, the button shows their next appointment, and the calendar shows it again with its status (waiting for confirmation, confirmed or cancelled) and an <i>Add to calendar</i> button, a <i>Join meeting</i> button when you set a meeting link (it turns on 15 minutes before the start and off when the appointment ends), and <i>Cancel appointment</i> when cancelling is allowed. If you reschedule it, they get the new time. Appointments cancelled by the visitor show “Cancelled by visitor” in Agenda.</P>
          <Note>The meeting link is private: it is not part of your public page. Only people who booked receive it (from the browser they booked with, by email, or in the calendar file).</Note>
          <Warning>
            <ul className="list-disc pl-5 space-y-1">
              <li>On iPhone/iPad you have to add the app to the Home Screen (iOS 16.4 or later) before turning on notifications.</li>
              <li>You can't book in the editor preview or in exported sites: there the block links to your live page.</li>
            </ul>
          </Warning>

          <H2 id="surveys">Surveys</H2>
          <P>Add a <i>Survey</i> block (Contact category). It shows a button; when visitors tap it, a form with your questions opens right on your page. Write each question, pick its answer type and mark it as required if needed.</P>
          <Table
            head={['Answer type', 'What visitors see']}
            rows={[
              ['Short answer · Paragraph', 'A one-line or a multi-line text box.'],
              ['One choice · Checkboxes · Dropdown', 'Your options (one per line in the Options box). Checkboxes allow several.'],
              ['Rating', '1 to 5 stars.'],
              ['Scale', 'A 0–10 scale (“How likely are you to recommend…”).'],
              ['Yes / No', 'Two buttons.'],
              ['Email · Number · Date', 'A field that only accepts that kind of value.'],
            ]}
          />
          <P>Answers appear in the <i>Responses</i> section of the dashboard: a <b>Summary</b> per question (bars with percentages, average rating, latest text answers) and every <b>Individual</b> response. Use <i>Download CSV</i> to open them in Excel or Google Sheets. Turn on <i>Notify me of new responses</i> in the block to get a push notification for each one.</P>
          <P><i>One response per device</i> hides the form after someone answers. It stops accidental double answers, but it is not a strict limit (clearing the browser data allows answering again).</P>
          <Warning>
            <ul className="list-disc pl-5 space-y-1">
              <li>You can't send answers from the editor preview or from exported sites: there the block links to your live page.</li>
              <li>If you edit or delete a question, old responses keep the question text they were answered with.</li>
            </ul>
          </Warning>

          <H2 id="reviews">Reviews</H2>
          <P>Add a <i>Reviews</i> block (Contact category). The button shows your average rating (e.g. ★ 4.8 · 23 reviews). When visitors open it they see the summary, every published review with its stars, comment and date, and a <i>Write a review</i> button to leave their own: 1 to 5 stars, a comment and, if they want, their name.</P>
          <Table
            head={['Option', 'What it does']}
            rows={[
              ['Accept new reviews', 'Turn it off to keep showing reviews without accepting new ones.'],
              ['New reviews', 'Publish right away, or wait for your approval in Reviews.'],
              ['Comment is required', 'Ask for a comment, not only stars.'],
              ['One review per device', 'Hides the form after someone writes a review (not a strict limit: clearing the browser data allows another one).'],
              ['Notify me of new reviews', 'Push notification for each new review.'],
              ['Reviews shown at first', 'How many reviews load at once; visitors can tap “Show more reviews”.'],
            ]}
          />
          <P>In the <i>Reviews</i> section of the dashboard you see every review with its status. You can <b>approve</b> or <b>show</b>, <b>hide</b> (it stays saved but nobody sees it), <b>delete</b>, and <b>reply</b>: your reply appears under the review on your page. A badge shows how many reviews are waiting for approval. Hidden and pending reviews don’t count in the average.</P>
          <P>Clients can <b>edit or delete their own review</b> from your page: when they open the reviews on the same browser they wrote it with, they see <i>Your review</i> with <i>Edit</i> and <i>Delete</i>. Edited reviews show “edited”. With <i>I approve each one</i>, an edited review waits for your approval again; a review you hid stays hidden.</P>
          <Warning>
            <ul className="list-disc pl-5 space-y-1">
              <li>You can’t write reviews from the editor preview or from exported sites: there the block links to your live page.</li>
              <li>Reviews are anonymous (no account needed), so anyone with your link can write one. Use “I approve each one” if you get spam.</li>
            </ul>
          </Warning>

          <H2 id="catalog">Catalog</H2>
          <P>Add a <i>Catalog</i> block (Content category, Pro plan) to show your products. By default it is a button that opens the catalog on your page; choose <i>Always visible</i> to show the products directly. Pick a grid (2 per row) or a list.</P>
          <Table
            head={['Product option', 'What it does']}
            rows={[
              ['Name, image, description', 'What visitors see. Adjust the image focus and zoom like any other image.'],
              ['Price', 'Shown with your currency and number format (1,234.50 or 1.234,50). Leave it at 0 to hide the price.'],
              ['Discount', 'Shows the new price, the old one crossed out and a “-20%” label.'],
              ['Stock', 'Empty: not shown. 0: “Sold out” and the buy button turns off. A low number shows “Only N left” (you choose from which number).'],
              ['Label', 'A small tag on the image, like “New” or “Best seller”.'],
              ['Link', 'Your product or checkout page (Buy button).'],
            ]}
          />
          <P><b>Order via WhatsApp:</b> add your number and every product without its own link gets an <i>Order</i> button that opens WhatsApp with the message already written (you can change it; <C>{'{product}'}</C> and <C>{'{price}'}</C> are filled in). Clicks on Buy and Order buttons count in Analytics.</P>

          <H2 id="plans">Plans</H2>
          <Table
            head={['Plan', 'What it includes']}
            rows={[
              ['Free', '1 page with links, socials and the basic blocks (text, images, video, music, maps, PDF, contact, collections) and analytics.'],
              ['Pro · $10/month', 'Up to 10 pages, Embeds, Booking & agenda, Reviews, Surveys, the product Catalog and photo or video backgrounds.'],
              ['Business', 'Custom number of pages and features, set up with the Otrelink team.'],
            ]}
          />
          <P>See and change your plan in <i>Your pages → plan button</i> (or <C>/dashboard/plan</C>). Pay with a card (Stripe) or PayPal; you can cancel any time and keep Pro until the end of the period you paid. If you go back to Free, what you already built stays saved and editable, but Pro blocks and photo/video backgrounds are not shown on your public page until you upgrade again.</P>

          <H2 id="sharing">Sharing &amp; analytics</H2>
          <P>In <i>Settings</i> you can copy your link, download a QR code, change your username, add an SEO title, description and sharing image, hide the page, hide the footer, or show a sensitive-content warning.</P>
          <P><b>Protect content:</b> <i>Block text selection</i> stops visitors from selecting or dragging text and images, and <i>Block right-click</i> turns off the right-click menu (and the long-press menu on images). Form fields keep working so visitors can still type and paste. This makes copying harder, but it can’t stop someone determined (screenshots, developer tools). Use the <i>Copy button</i> block when you do want visitors to copy something, like a discount code or an account number.</P>
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
          <P><i>Settings → Download as website</i> gives you a .zip with <C>index.html</C>, <C>style.css</C>, <C>script.js</C> and an <C>assets/</C> folder with your images and PDFs. Open <C>index.html</C> on any computer: it works without the Otrelink server or database (internet is only needed for Google Fonts, videos, music players and maps). You can also upload that folder to any static host. It uses your last saved version, and visits to it are not counted in Analytics.</P>
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
