// ─────────────────────────────────────────────────────────────
//  PAGE TEMPLATES
//  Ready-made pages to start from (dashboard → Templates, and “New page”).
//  Each template = a theme (+ design tweaks), a profile, social icons and blocks.
//  buildTemplatePage(id) returns { profile, socials, blocks, design, settings }.
//  Add one: append an entry; blocks are [type, data, children?] (see blocks/).
// ─────────────────────────────────────────────────────────────
import { newBlock, applyTheme, sanitizePage } from './page.js';
import { defaultDesign, resolveDesign } from './design.js';
import { uid } from './util/html.js';
import { TEMPLATES_V1 } from './templates-v1.js';

const ex = 'https://example.com';
// A date some days from today ("YYYY-MM-DD"), so countdowns and events stay in the future.
const inDays = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const weekdays = (from, to, days = ['mon', 'tue', 'wed', 'thu', 'fri']) => days.map((day, i) => ({ id: `h${i}`, day, from, to }));
const item = (o) => ({ id: uid('i'), ...o });
// Unsplash photo (free licence, hotlinking allowed), cropped to the size it is shown at.
const img = (id, w = 640, h = w) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;
const avatar = (id) => img(id, 320);
const banner = (id) => img(id, 1200, 720);
const eventImg = (id) => img(id, 960, 540);
// Block options, e.g. its own entrance: fx(['gallery', {...}], { enter: 'unfold' }).
const fx = (block, options) => Object.assign(block, { options });

// ── Shared styling of the redesigned templates ──────────────
// Every template follows a direction dealt by tasteskill v2 (.taste-skill/templates/<id>.json).
// kit() turns its type system into CSS for the blocks every template uses: five sizes
// (hero, heading, sub, body/lead, small), one display setting, one corner radius, no hover tricks
// (pages are built for phones), accent kept for actions.
const kit = ({ s, up = false, track = '-.02em', lead = 1, weight = 600, r = 0, align = 'left' }) => {
  const [s1, s2, s3, s4, s5] = s;
  const disp = `font-family:var(--ol-title-font);font-weight:${weight};letter-spacing:${track};line-height:${lead};text-transform:${up ? 'uppercase' : 'none'}`;
  return `.ol-root{--k1:${s1};--k2:${s2};--k3:${s3};--k4:${s4};--k5:${s5};--k-r:${r}px}`
    + `.ol-root .ol-title{${disp};font-size:var(--k1);display:block;overflow-wrap:normal}`
    + '.ol-root .ol-bio{font-size:var(--k4);line-height:1.45;opacity:1;max-width:32ch}'
    + '.ol-root .ol-btn{font-size:var(--k4);font-weight:500;text-transform:none}.ol-root .ol-btn-sub{font-size:var(--k5);opacity:.8}'
    + `.ol-root .ol-header,.ol-root .ol-ev-heading,.ol-root .ol-col-header h3,.ol-root .ol-cat-title{${disp};font-size:var(--k2);text-align:${align};margin:32px 0 12px}`
    + `.ol-root .ol-col-header{margin:0;text-align:${align}}.ol-root .ol-cat-head{background:none;color:inherit;padding:0}`
    + `.ol-root .ol-cat-sectitle{${disp};font-size:var(--k3)}`
    + '.ol-root .ol-ev-badge{width:48px;flex:none;padding:0;background:none;color:inherit;border-radius:0;align-items:flex-start}'
    + `.ol-root .ol-ev-badge b{font-family:var(--ol-title-font);font-weight:${weight};font-size:var(--k3);line-height:1}`
    + '.ol-root .ol-ev-badge small{font-size:var(--k5);font-weight:500;letter-spacing:0;text-transform:none;opacity:.8}'
    + `.ol-root .ol-ev-title{font-family:var(--ol-title-font);font-weight:${weight};font-size:var(--k3);line-height:1.05;letter-spacing:${track};text-transform:${up ? 'uppercase' : 'none'}}`
    + '.ol-root .ol-ev-sub,.ol-root .ol-ev-desc,.ol-root .ol-ev-meta{font-size:var(--k5);font-weight:400}.ol-root .ol-ev-meta svg{display:none}'
    + '.ol-root .ol-ev-link,.ol-root .ol-cat-buy,.ol-root .ol-cat-tab,.ol-root .ol-copybtn,.ol-root .ol-book-submit,.ol-root .ol-survey-submit{border-radius:var(--k-r)}'
    + '.ol-root .ol-ev-link{font-size:var(--k5);min-height:42px;padding:0 16px}'
    + '.ol-root .ol-cat-name{font-size:var(--k4);font-weight:500}.ol-root .ol-cat-desc{font-size:var(--k5)}.ol-root .ol-cat-price{font-size:var(--k4)}'
    + '.ol-root .ol-cat-badge,.ol-root .ol-cat-off,.ol-root .ol-cat-tag{font-size:var(--k5);letter-spacing:0;text-transform:none;border-radius:var(--k-r)}'
    + '.ol-root .ol-faq-item summary{font-size:var(--k4);font-weight:500}.ol-root .ol-faq-item div{font-size:var(--k4)}'
    + '.ol-root .ol-countdown p{font-size:var(--k4);font-weight:500}'
    + `.ol-root .ol-countdown-grid strong{font-family:var(--ol-title-font);font-weight:${weight};font-size:var(--k2);line-height:1;font-variant-numeric:tabular-nums}`
    + '.ol-root .ol-countdown-grid small{font-size:var(--k5);letter-spacing:0;text-transform:none}'
    + `.ol-root .ol-banner{box-shadow:none}.ol-root .ol-banner-eyebrow{display:none}.ol-root .ol-banner-title{${disp};font-size:var(--k2)}`
    + '.ol-root .ol-banner-text{font-size:var(--k4);opacity:1}.ol-root .ol-banner-btn{border-radius:var(--k-r);font-size:var(--k4);font-weight:500;min-height:48px;padding:0 18px}'
    + '.ol-root .ol-text{font-size:var(--k4);line-height:1.5}.ol-root .ol-b-text:last-child .ol-text{font-size:var(--k5);text-align:left;opacity:.8}'
    + '.ol-root .ol-status .ol-status-text,.ol-root .ol-route-place,.ol-root .ol-loc-place{font-size:var(--k4)}.ol-root .ol-route-dayname,.ol-root .ol-route-time,.ol-root .ol-loc-meta{font-size:var(--k5)}'
    + `.ol-root .ol-loc-title,.ol-root .ol-route-title,.ol-root .ol-loy-title{font-family:var(--ol-title-font);font-weight:${weight};font-size:var(--k3);letter-spacing:${track};line-height:1.1}`
    + '.ol-root .ol-status .ol-status-text,.ol-root .ol-cat-stock.is-out{color:inherit;opacity:1}'
    + '.ol-root .ol-col-text strong{font-size:var(--k4)}.ol-root .ol-col-text small{font-size:var(--k5)}.ol-root .ol-cat-tab,.ol-root .ol-cat-buy,.ol-root .ol-route-badge{font-size:var(--k5)}'
    + `.ol-root .ol-survey-title{font-family:var(--ol-title-font);font-weight:${weight};font-size:var(--k3)}`
    + '.ol-root a.ol-banner:hover,.ol-root .ol-col-card:hover,.ol-root .ol-col-show:hover{transform:none;box-shadow:none}';
};

// Phones first: pictures open as they scroll into view (scroll-driven, no script, no hover).
// Browsers without scroll timelines, and visitors who ask for less motion, see them still.
const MOTION_CSS = '@media (prefers-reduced-motion:no-preference){@supports (animation-timeline:view()){'
  + '.ol-root .ol-blocks img,.ol-root .ol-banner-bg{animation:ol-sv linear both;animation-timeline:view();animation-range:entry 0% cover 38%}}}'
  + '@keyframes ol-sv{from{clip-path:inset(12% 6% 12% 6%);scale:1.12}to{clip-path:inset(0 0 0 0);scale:1}}';
const credit = (who = 'Unsplash') => ['text', { align: 'left', text: `Photos: ${who}.` }];

// Musician — "Loud and flat" street-poster direction (tasteskill v2, seed 1513646365):
// acid-yellow ground, black ink, orange action, sage and black fields; Bebas Neue over EB Garamond;
// signature move: the band name rises out of a mask. Photos are real pictures of the band's world, credited on the page.
const MUSICIAN_CSS = `.ol-root{--no-y:#f0ff1c;--no-o:#fe7141;--no-s:#d1ddd3;--no-k:#000;--no-w:#f4f4f4;--no-ease:cubic-bezier(.16,1,.3,1);--no-1:min(23.5vw,148px);--no-2:clamp(56px,16vw,96px);--no-3:36px;--no-4:20px;--no-5:15px}
.ol-root .ol-profile{gap:0;margin-bottom:28px}
.ol-root .ol-title{order:1;position:relative;z-index:1;display:block;max-width:4.3em;font-size:var(--no-1);line-height:.85;letter-spacing:-.02em;text-transform:uppercase;overflow-wrap:normal;animation:no-mask .9s var(--no-ease) .1s both}
.ol-root .ol-avatar{order:2;align-self:flex-end;width:50%;height:auto;aspect-ratio:4/5;margin:calc(var(--no-1) * -.85) 3% 0 0;border-radius:0;position:relative;z-index:0;filter:grayscale(1) contrast(1.15);transform:rotate(4deg);animation:no-drift 9s ease-in-out 1s infinite alternate}
.ol-root .ol-bio{order:3;margin-top:22px;max-width:30ch;font-size:var(--no-4);line-height:1.4;opacity:1;animation:no-up .6s var(--no-ease) .55s both}
.ol-root .ol-profile .ol-socials{order:4;margin-top:16px;gap:18px;animation:no-up .6s var(--no-ease) .65s both}
.ol-root .ol-btn{font-size:var(--no-4);font-weight:600}
.ol-root .ol-btn-sub{font-size:var(--no-5);opacity:.85}
.ol-root .ol-ev-heading,.ol-root .ol-col-header h3{margin:40px 0 14px;font-family:var(--ol-title-font);font-weight:400;font-size:var(--no-2);line-height:.85;letter-spacing:-.01em;text-transform:uppercase;text-align:left;color:var(--no-k)}
.ol-root .ol-col-header{margin:0;text-align:left}
.ol-root .ol-countdown{padding:20px;text-align:left}
.ol-root .ol-countdown p{margin:0 0 14px;font-size:var(--no-4);font-weight:500;line-height:1.35}
.ol-root .ol-countdown-grid{justify-content:space-between;gap:8px}
.ol-root .ol-countdown-grid>div{background:none;padding:0;min-width:0;display:flex;flex-direction:column;align-items:flex-start}
.ol-root .ol-countdown-grid strong{font-family:var(--ol-title-font);font-weight:400;font-size:var(--no-2);line-height:.9;color:var(--no-y);font-variant-numeric:tabular-nums}
.ol-root .ol-countdown-grid small{font-size:var(--no-5);letter-spacing:0;text-transform:none;opacity:.85}
.ol-root .ol-ev-list{gap:0}
.ol-root .ol-ev-body{gap:18px;padding:18px 20px;align-items:flex-start}
.ol-root .ol-ev-badge{width:46px;flex:none;padding:0;background:none;color:var(--no-y);align-items:flex-start;border-radius:0}
.ol-root .ol-ev-badge b{font-size:var(--no-3);font-weight:400;line-height:.95}
.ol-root .ol-ev-badge small{margin-top:2px;font-family:var(--ol-body-font);font-size:var(--no-5);font-weight:500;letter-spacing:0;text-transform:none}
.ol-root .ol-ev-title{font-family:var(--ol-title-font);font-weight:400;font-size:var(--no-3);line-height:.95;letter-spacing:.01em;text-transform:uppercase}
.ol-root .ol-ev-sub{font-size:var(--no-4);font-style:italic;opacity:1}
.ol-root .ol-ev-meta{font-size:var(--no-5);font-weight:400;opacity:.85}
.ol-root .ol-ev-meta svg{display:none}
.ol-root .ol-ev-link{min-height:44px;padding:0 18px;border-radius:0;font-size:var(--no-5);font-weight:600}
.ol-root .ol-col-grid{gap:8px}
.ol-root .ol-col-card{position:relative;display:grid;aspect-ratio:1;border-radius:0;background:var(--no-s);color:var(--no-k)}
.ol-root .ol-col-noimg{display:none}
.ol-root .ol-col-text{place-self:center;align-items:center;padding:0;text-align:center}
.ol-root .ol-col-text strong{font-family:var(--ol-title-font);font-weight:400;font-size:var(--no-3);line-height:.9;text-transform:uppercase}
.ol-root .ol-col-cell:nth-child(4) .ol-col-card{background:var(--no-k);color:var(--no-y)}
.ol-root .ol-col-cell:nth-child(5) .ol-col-card{background:var(--no-o)}
.ol-root .ol-col-card:has(img) .ol-col-media{position:absolute;inset:0;aspect-ratio:auto}
.ol-root .ol-col-card:has(img) img{filter:grayscale(1) contrast(1.15);transition:filter .2s ease}
.ol-root .ol-col-card:has(img) .ol-col-text{position:relative;z-index:1;place-self:end start;padding:6px 10px;background:var(--no-k);color:var(--no-w)}
.ol-root .ol-col-card:has(img) .ol-col-text strong{font-family:var(--ol-body-font);font-size:var(--no-5);font-weight:500;line-height:1.2;text-transform:none}
.ol-root .ol-banner{border-radius:0;box-shadow:none}
.ol-root .ol-banner-body{flex:1;gap:14px;padding:24px 20px}
.ol-root .ol-banner-title{font-weight:400;font-size:var(--no-2);line-height:.85;letter-spacing:-.01em;text-transform:uppercase}
.ol-root .ol-banner-text{margin-top:auto;max-width:24ch;font-size:var(--no-4);line-height:1.35;opacity:1}
.ol-root .ol-banner-btn{align-self:stretch;justify-content:center;min-height:56px;padding:0 18px;border-radius:0;background:var(--no-o);color:var(--no-k);font-size:var(--no-4);font-weight:600}
.ol-root .ol-b-text .ol-text{font-size:var(--no-5);line-height:1.5;opacity:.85}
@keyframes no-mask{from{clip-path:inset(0 0 100% 0);transform:translateY(.3em)}to{clip-path:inset(-.2em);transform:none}}
@keyframes no-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes no-drift{from{transform:rotate(4deg)}to{transform:rotate(2.5deg) translateY(-8px)}}
@media (prefers-reduced-motion:reduce){.ol-root .ol-title,.ol-root .ol-avatar,.ol-root .ol-bio,.ol-root .ol-profile .ol-socials{animation:none}}`;

// css:artist
const CSS_ARTIST = `.ol-root .ol-profile{gap:0;margin-bottom:22px;padding:20px;background:#d3d2ce;min-height:34svh;justify-content:flex-end}
.ol-root .ol-bio{margin-top:12px}
.ol-root .ol-profile .ol-socials{margin-top:12px}
.ol-root .ol-gallery-grid{gap:8px;row-gap:14px}
.ol-root .ol-gallery img{border-radius:0;aspect-ratio:1}
.ol-root .ol-gallery figcaption{text-align:left;font-size:var(--k5);margin-top:6px;opacity:.85}
@media (prefers-reduced-motion:no-preference){.ol-root .ol-b-gallery figure:first-child img{animation:ar-shutter 1.1s cubic-bezier(.65,0,.35,1) .4s both}}
@keyframes ar-shutter{from{clip-path:inset(0 100% 0 0);scale:1.12}to{clip-path:inset(0 0 0 0);scale:1}}`;
// /css:artist

// css:bakery
const CSS_BAKERY = `.ol-root .ol-profile{position:relative;gap:0;margin:0 -16px 22px;padding:0}
.ol-root .ol-avatar{width:100%;height:64svh;border-radius:0;margin:0}
.ol-root .ol-title{color:#ffffff;position:absolute;left:16px;right:16px;top:64svh;translate:0 -100%;padding-bottom:10px;z-index:1;max-width:5em;text-shadow:0 0 24px rgba(0,0,0,.35)}
.ol-root .ol-profile::after{content:"";position:absolute;left:0;right:0;top:36svh;height:28svh;background:linear-gradient(transparent,rgba(20,18,14,.55));pointer-events:none}
.ol-root .ol-bio,.ol-root .ol-profile .ol-socials{margin-left:16px;margin-right:16px}
.ol-root .ol-bio{margin-top:18px}
.ol-root .ol-profile .ol-socials{margin-top:14px}
.ol-root .ol-cat-title{color:#2a2a26}
.ol-root .ol-faq{border-radius:0}
@media (prefers-reduced-motion:no-preference){.ol-root .ol-avatar{animation:ba-drift 16s ease-in-out infinite alternate}}
@keyframes ba-drift{from{object-position:50% 40%}to{object-position:50% 60%}}`;
// /css:bakery

// css:businesscard
const CSS_BUSINESSCARD = `.ol-root .ol-profile{gap:0;min-height:58svh;justify-content:flex-end;margin-bottom:26px}
.ol-root .ol-title{max-width:4em}
.ol-root .ol-bio{margin-top:18px;font-size:var(--k3);line-height:1.3;max-width:22ch;color:#c5ccd8}
.ol-root .ol-profile .ol-socials{margin-top:18px}
.ol-root .ol-header{margin-top:40px}
.ol-root .ol-gallery-carousel figure{flex-basis:86%}.ol-root .ol-gallery img{border-radius:0;aspect-ratio:4/5}
.ol-root .ol-gallery figcaption{text-align:left;font-size:var(--k5);color:#c5ccd8}
.ol-root .ol-frame{border-radius:0;filter:grayscale(.6) brightness(.85)}
@media (prefers-reduced-motion:no-preference){.ol-root .ol-title{animation:bc-mask .9s cubic-bezier(.16,1,.3,1) .15s both}}
@keyframes bc-mask{from{clip-path:inset(0 0 100% 0);transform:translateY(.25em)}to{clip-path:inset(-.2em);transform:none}}`;
// /css:businesscard

// css:clinic
const CSS_CLINIC = `.ol-root .ol-profile{position:relative;gap:0;margin:0 -16px 22px;padding:0 16px;overflow:hidden}
.ol-root .ol-title{order:1;max-width:4.6em}
.ol-root .ol-bio{order:2;margin-top:14px}
.ol-root .ol-profile .ol-socials{order:3;margin-top:14px}
.ol-root .ol-avatar{order:4;width:130vw;max-width:none;height:130vw;max-height:none;margin:28px 0 -66vw -15vw;border-radius:50%;border:0;outline:22px solid #97aaf6;outline-offset:-1px}
.ol-root .ol-gallery-grid{gap:10px}.ol-root .ol-gallery img{border-radius:50%;aspect-ratio:1}
.ol-root .ol-gallery figcaption{font-size:var(--k5)}
.ol-root .ol-status{border-radius:28px}
.ol-root .ol-faq{background:#bbf697}
.ol-root .ol-frame{border-radius:28px}
@media (prefers-reduced-motion:no-preference){.ol-root .ol-avatar{animation:cl-shutter 1.1s cubic-bezier(.65,0,.35,1) .3s both}}
@keyframes cl-shutter{from{clip-path:circle(0% at 50% 30%);scale:1.12}to{clip-path:circle(75% at 50% 50%);scale:1}}`;
// /css:clinic

// css:coach
const CSS_COACH = `.ol-root .ol-profile{gap:0;margin:0 -16px 24px;padding:0}
.ol-root .ol-avatar{width:100%;height:auto;aspect-ratio:3/2;border-radius:0;margin:0 0 20px;object-position:50% 18%}
.ol-root .ol-title,.ol-root .ol-bio,.ol-root .ol-profile .ol-socials{margin-left:20px;margin-right:20px}
.ol-root .ol-title{max-width:4.6em}
.ol-root .ol-bio{margin-top:16px;font-size:var(--k3);line-height:1.3;max-width:24ch}
.ol-root .ol-profile .ol-socials{margin-top:16px}
.ol-root .ol-header{margin-top:40px}
.ol-root .ol-text{padding-left:14%}
.ol-root .ol-gallery-grid{gap:8px}.ol-root .ol-gallery img{border-radius:0;aspect-ratio:4/5}
.ol-root .ol-gallery figcaption{text-align:left;font-size:var(--k5)}
@media (prefers-reduced-motion:no-preference){.ol-root .ol-title{animation:co-mask .9s cubic-bezier(.16,1,.3,1) .15s both}}
@keyframes co-mask{from{clip-path:inset(0 0 100% 0);transform:translateY(.25em)}to{clip-path:inset(-.2em);transform:none}}`;
// /css:coach

// css:conference
const CSS_CONFERENCE = `.ol-root .ol-profile{gap:0;margin-bottom:30px}
.ol-root .ol-title{order:1;max-width:5.4em;text-align:center}
.ol-root .ol-avatar{order:2;width:100%;height:auto;aspect-ratio:3/2;border-radius:20px;margin:14px 0 0}
.ol-root .ol-bio{order:3;margin-top:18px;text-align:center;color:#ffe9eb}
.ol-root .ol-profile .ol-socials{order:4;margin-top:14px}
.ol-root .ol-countdown{background:#8a101c}
.ol-root .ol-gallery-grid{gap:10px}.ol-root .ol-gallery img{border-radius:20px}
.ol-root .ol-gallery figcaption{font-size:var(--k5);color:#ffe9eb}
.ol-root .ol-frame{border-radius:20px}
@media (prefers-reduced-motion:no-preference){.ol-root .ol-avatar{animation:cf-shutter 1.1s cubic-bezier(.65,0,.35,1) .35s both}}
@keyframes cf-shutter{from{clip-path:inset(0 0 100% 0 round 20px);scale:1.12}to{clip-path:inset(0 0 0 0 round 20px);scale:1}}`;
// /css:conference

// css:creator
const CSS_CREATOR = `.ol-root .ol-profile{position:relative;min-height:68svh;gap:0;margin:0 -16px 20px 0;padding-right:28vw;overflow:hidden}
.ol-root .ol-title{position:absolute;top:0;right:-3vw;writing-mode:vertical-rl;white-space:nowrap;color:#c6f19d}
.ol-root .ol-title svg{display:none}
.ol-root .ol-avatar{width:100%;height:auto;aspect-ratio:2/3;border-radius:0;margin:0 0 18px}
.ol-root .ol-bio{max-width:none}
.ol-root .ol-profile .ol-socials{margin-top:16px;gap:16px}
.ol-root .ol-header{margin-top:36px}
.ol-root .ol-gallery-carousel figure{flex-basis:80%}.ol-root .ol-gallery img{border-radius:0;aspect-ratio:4/5}
.ol-root .ol-gallery figcaption{text-align:left;font-size:var(--k5);opacity:.8}
.ol-root .ol-frame{border-radius:0}
@keyframes cr-shrink{to{scale:.92;translate:0 -4%}}
@media (prefers-reduced-motion:no-preference){@supports (animation-timeline:scroll()){.ol-root .ol-title{animation:cr-shrink linear both;animation-timeline:scroll(root);animation-range:0 70svh}}}`;
// /css:creator

// css:developer
const CSS_DEVELOPER = `.ol-root .ol-profile{gap:0;margin-bottom:6px;padding:18px 16px 16px;background:#f2f2f2;border-radius:8px}
.ol-root .ol-avatar{order:4;width:100%;height:auto;aspect-ratio:16/10;border-radius:8px;margin:16px 0 0}
.ol-root .ol-title{order:1}
.ol-root .ol-bio{order:2;margin-top:12px}
.ol-root .ol-profile .ol-socials{order:3;margin-top:12px}
.ol-root .ol-code{border-radius:8px}
.ol-root .ol-col-header h3{margin-top:22px}
.ol-root .ol-col-grid{gap:6px}
.ol-root .ol-col-card{background:#f2f2f2;border-radius:8px}
.ol-root .ol-col-media{aspect-ratio:4/3}
.ol-root .ol-col-text strong{font-size:var(--k4)}.ol-root .ol-col-text small{font-size:var(--k5)}
.ol-root .ol-col-cell:nth-child(4) .ol-col-card{background:#0a0a0a;color:#ffffff}
.ol-root .ol-col-cell:nth-child(4) .ol-col-noimg{background:#0a0a0a;color:#ffffff;font-size:var(--k2);opacity:1}
@media (prefers-reduced-motion:no-preference){.ol-root .ol-avatar{animation:dv-shutter 1.1s cubic-bezier(.65,0,.35,1) .3s both}}
@keyframes dv-shutter{from{clip-path:inset(0 100% 0 0);scale:1.12}to{clip-path:inset(0 0 0 0);scale:1}}`;
// /css:developer

// css:fitness
const CSS_FITNESS = `.ol-root .ol-profile{position:relative;gap:0;margin:0 -16px 22px;padding:0}
.ol-root .ol-avatar{width:100%;height:58svh;border-radius:0;margin:0;filter:grayscale(1) contrast(1.1)}
.ol-root .ol-title{position:absolute;top:18px;left:16px;z-index:1;max-width:5em;font-size:var(--k3);text-shadow:0 0 18px rgba(0,0,0,.4)}
.ol-root .ol-bio,.ol-root .ol-profile .ol-socials{margin-left:16px;margin-right:16px}
.ol-root .ol-bio{margin-top:18px}
.ol-root .ol-profile .ol-socials{margin-top:14px}
.ol-root .ol-countdown{text-align:left;padding:18px 20px}
.ol-root .ol-countdown-grid{justify-content:space-between}
.ol-root .ol-countdown-grid strong{color:#c6f19d}
.ol-root .ol-ev-list{gap:18px}
.ol-root .ol-ev:nth-child(1){margin-right:18%}.ol-root .ol-ev:nth-child(1) .ol-ev-media{aspect-ratio:4/5}
.ol-root .ol-ev:nth-child(2){margin-left:24%}.ol-root .ol-ev:nth-child(2) .ol-ev-media{aspect-ratio:1}
.ol-root .ol-ev:nth-child(3){margin-right:8%}.ol-root .ol-ev:nth-child(3) .ol-ev-media{aspect-ratio:3/2}
.ol-root .ol-image{margin-left:30%}.ol-root .ol-image img{border-radius:0}
@media (prefers-reduced-motion:no-preference){.ol-root .ol-avatar{animation:fi-drift 18s ease-in-out infinite alternate}}
@keyframes fi-drift{from{object-position:50% 20%}to{object-position:50% 45%}}`;
// /css:fitness

// css:foodtruck
const CSS_FOODTRUCK = `.ol-root .ol-profile{gap:0;margin:0 -16px 22px;padding:0}
.ol-root .ol-avatar{width:100%;height:44svh;border-radius:0;margin:0 0 14px}
.ol-root .ol-title,.ol-root .ol-bio,.ol-root .ol-profile .ol-socials{margin-left:16px;margin-right:16px}
.ol-root .ol-title{max-width:4.4em;transform-origin:left top}
.ol-root .ol-bio{margin-top:14px}
.ol-root .ol-profile .ol-socials{margin-top:14px}
.ol-root .ol-cat-head .ol-cat-title{margin-top:28px}
.ol-root .ol-cat-tab{background:#f4f4f2}
.ol-root .ol-loy{border-radius:0}
@media (prefers-reduced-motion:no-preference){@supports (animation-timeline:scroll()){.ol-root .ol-title{animation:ft-shrink linear both;animation-timeline:scroll(root);animation-range:0 60svh}}}
@keyframes ft-shrink{to{scale:.88}}`;
// /css:foodtruck

// css:minimal
const CSS_MINIMAL = `.ol-root .ol-profile{gap:0;margin-bottom:28px}
.ol-root .ol-title{order:1}
.ol-root .ol-bio{order:2;margin-top:10px;color:#6b6b6b}
.ol-root .ol-avatar{order:3;align-self:center;width:78vw;max-width:340px;height:auto;aspect-ratio:1;margin:32px 0 0;padding:13%;background:#f2f2f2;border-radius:0;object-fit:cover;animation:mi-breathe 14s ease-in-out infinite alternate}
.ol-root .ol-profile .ol-socials{order:4;margin-top:24px}
.ol-root .ol-btn{padding:10px 16px}
.ol-root .ol-header{margin-top:36px}
.ol-root .ol-gallery-grid{gap:6px}.ol-root .ol-gallery img{border-radius:0}
@keyframes mi-breathe{from{scale:1}to{scale:1.03}}
@media (prefers-reduced-motion:reduce){.ol-root .ol-avatar{animation:none}}`;
// /css:minimal

// css:nonprofit
const CSS_NONPROFIT = `.ol-root .ol-profile{position:relative;gap:0;margin:0 -4px 22px;padding:34px 22px 28px;background:#f6f4f1;-webkit-mask:radial-gradient(circle 18px at 0 0,transparent 97%,#000) top left/51% 100% no-repeat,radial-gradient(circle 18px at 100% 0,transparent 97%,#000) top right/51% 100% no-repeat;mask:radial-gradient(circle 18px at 0 0,transparent 97%,#000) top left/51% 100% no-repeat,radial-gradient(circle 18px at 100% 0,transparent 97%,#000) top right/51% 100% no-repeat}
.ol-root .ol-avatar{order:2;margin:20px 0 6px}
.ol-root .ol-title{order:1;text-align:center;max-width:7em}
.ol-root .ol-bio{order:3;margin-top:14px;text-align:center;max-width:30ch}
.ol-root .ol-profile .ol-socials{order:4;margin-top:16px}
.ol-root .ol-gallery-grid{gap:10px}.ol-root .ol-gallery img{border-radius:0;aspect-ratio:4/5}
.ol-root .ol-gallery figcaption{font-size:var(--k5)}
.ol-root .ol-banner{border-radius:0}
@media (prefers-reduced-motion:no-preference){.ol-root .ol-profile{animation:np-card .9s cubic-bezier(.16,1,.3,1) both}}
@keyframes np-card{from{translate:0 40px;opacity:0}to{translate:0 0;opacity:1}}`;
// /css:nonprofit

// css:photographer
const CSS_PHOTOGRAPHER = `.ol-root .ol-profile{gap:0;margin-bottom:26px}
.ol-root .ol-avatar{order:1;align-self:flex-end;width:46%;height:auto;aspect-ratio:3/2;border-radius:0;margin:0 0 14px}
.ol-root .ol-title{order:2;padding-left:22vw;text-indent:-22vw;max-width:4.2em}
.ol-root .ol-bio{order:3;margin-top:16px}
.ol-root .ol-profile .ol-socials{order:4;margin-top:14px}
.ol-root .ol-banner{border-radius:0}.ol-root .ol-banner-title{font-size:var(--k2);line-height:1.05}
.ol-root .ol-gallery-grid{grid-template-columns:repeat(6,1fr);gap:10px;align-items:start}
.ol-root .ol-gallery figure{grid-column:span 3}.ol-root .ol-gallery img{border-radius:0;aspect-ratio:auto}
.ol-root .ol-gallery figure:nth-child(1){grid-column:1/span 4}.ol-root .ol-gallery figure:nth-child(1) img{aspect-ratio:3/4}
.ol-root .ol-gallery figure:nth-child(2){grid-column:5/span 2;margin-top:42%}.ol-root .ol-gallery figure:nth-child(2) img{aspect-ratio:1}
.ol-root .ol-gallery figure:nth-child(3){grid-column:2/span 3}.ol-root .ol-gallery figure:nth-child(3) img{aspect-ratio:4/5}
.ol-root .ol-gallery figure:nth-child(4){grid-column:1/span 3;margin-top:-18%}.ol-root .ol-gallery figure:nth-child(4) img{aspect-ratio:3/4}
.ol-root .ol-gallery figure:nth-child(5){grid-column:4/span 3;margin-top:18%}.ol-root .ol-gallery figure:nth-child(5) img{aspect-ratio:1}
.ol-root .ol-gallery figure:nth-child(6){grid-column:1/-1}.ol-root .ol-gallery figure:nth-child(6) img{aspect-ratio:4/3}
@media (prefers-reduced-motion:no-preference){.ol-root .ol-title{animation:ph-mask .9s cubic-bezier(.16,1,.3,1) .1s both}}
@keyframes ph-mask{from{clip-path:inset(0 0 100% 0);transform:translateY(.25em)}to{clip-path:inset(-.2em);transform:none}}`;
// /css:photographer

// css:podcast
const CSS_PODCAST = `.ol-root .ol-profile{gap:0;margin-bottom:56px}
.ol-root .ol-avatar{order:1;width:72px;height:72px;margin:0 0 18px}
.ol-root .ol-title{order:2;text-transform:lowercase;max-width:5em;text-align:center}
.ol-root .ol-bio{order:3;margin-top:14px;text-align:center}
.ol-root .ol-profile .ol-socials{order:4;margin-top:14px}
.ol-root .ol-blocks{margin:0 -16px}
.ol-root .ol-blocks>.ol-block{position:relative;padding:26px 20px 30px;background:#c3edce;border-radius:18px 18px 0 0;margin-top:22px}
.ol-root .ol-blocks>.ol-block::before{content:"";position:absolute;top:-20px;left:20px;width:38%;height:22px;background:inherit;border-radius:12px 12px 0 0}
.ol-root .ol-blocks>.ol-block:nth-child(3n+2){background:#f8c7c9}
.ol-root .ol-blocks>.ol-block:nth-child(3n+3){background:#ffffff}
.ol-root .ol-blocks>.ol-block:nth-child(even)::before{left:auto;right:20px}
.ol-root .ol-blocks>.ol-block:last-child{background:#f8f8f8;margin-top:0}
.ol-root .ol-blocks>.ol-block:last-child::before{display:none}
.ol-root .ol-col-header h3{margin-top:0}
.ol-root .ol-col-card{background:rgba(255,255,255,.6)}
.ol-root .ol-col-list .ol-btn,.ol-root .ol-btn{background:rgba(255,255,255,.7)}
.ol-root .ol-b-survey .ol-btn{background:#1f6b3a}
.ol-root .ol-frame{border-radius:12px}`;
// /css:podcast

// css:realestate
const CSS_REALESTATE = `.ol-root .ol-main{margin-top:56svh;background:#ffffff;border-radius:16px 16px 0 0;padding-top:24px;position:relative}
.ol-root .ol-profile{display:grid;grid-template-columns:auto 1fr;column-gap:14px;align-items:center;margin-bottom:22px}
.ol-root .ol-avatar{grid-row:1;grid-column:1;width:64px;height:64px;margin:0}
.ol-root .ol-title{grid-row:1;grid-column:2}
.ol-root .ol-bio,.ol-root .ol-profile .ol-socials{grid-column:1/-1;margin-top:14px}
.ol-root .ol-header{margin-top:36px}
.ol-root .ol-gallery-carousel figure{flex-basis:78%}.ol-root .ol-gallery img{border-radius:12px;aspect-ratio:4/5}
.ol-root .ol-gallery figcaption{text-align:left;font-size:var(--k5)}
.ol-root .ol-frame{border-radius:12px}`;
// /css:realestate

// css:restaurant
const CSS_RESTAURANT = `.ol-root .ol-profile{position:relative;gap:0;margin:0 -16px 18px;padding:0}
.ol-root .ol-avatar{width:100%;height:68svh;border-radius:0;margin:0;filter:brightness(.72)}
.ol-root .ol-title,.ol-root .ol-bio,.ol-root .ol-profile .ol-socials{position:relative;z-index:1;align-self:stretch;margin-left:16px;margin-right:16px}
.ol-root .ol-title{margin-top:-30svh;padding:22px 20px 0;background:#1f2725;border-radius:2px 2px 0 0}
.ol-root .ol-bio{margin-top:0;padding:10px 20px 0;background:#1f2725;max-width:none;color:#c9c8bf}
.ol-root .ol-profile .ol-socials{padding:16px 20px 22px;background:#1f2725;border-radius:0 0 2px 2px;justify-content:flex-start}
.ol-root .ol-cat-sec{gap:10px}
.ol-root .ol-cat-sectitle{position:sticky;top:0;z-index:2;margin:0;padding:14px 0 8px;background:#161c1a;color:#e3e2da}
.ol-root .ol-cat-item{background:#1f2725}
.ol-root .is-list .ol-cat-media{width:120px;min-height:120px}
.ol-root .ol-cat-tag{background:#2a3431;color:#e3e2da}
.ol-root .ol-frame{border-radius:2px;filter:grayscale(.6) brightness(.85)}
@media (prefers-reduced-motion:no-preference){.ol-root .ol-avatar{animation:re-lamp 2.4s ease-out both}}
@keyframes re-lamp{from{filter:brightness(.2)}to{filter:brightness(.72)}}`;
// /css:restaurant

// css:salon
const CSS_SALON = `.ol-root .ol-profile{gap:0;margin-bottom:26px;padding-top:12svh}
.ol-root .ol-avatar{width:70%;height:auto;aspect-ratio:4/5;border-radius:2px;margin:0 0 26px}
.ol-root .ol-title{width:100%;text-align:center;padding-left:.32em}
.ol-root .ol-bio{margin-top:14px;color:#cfcfcf;text-align:center}
.ol-root .ol-profile .ol-socials{margin-top:14px}
.ol-root .ol-gallery-carousel figure{flex-basis:76%}.ol-root .ol-gallery img{border-radius:2px;aspect-ratio:4/5}
.ol-root .ol-gallery figcaption{font-size:var(--k5);color:#cfcfcf}
.ol-root .ol-frame{border-radius:2px;filter:grayscale(.7) brightness(.8)}
@media (prefers-reduced-motion:no-preference){.ol-root .ol-avatar{animation:sa-lamp 2.4s ease-out both}}
@keyframes sa-lamp{from{filter:brightness(.15)}to{filter:brightness(1)}}`;
// /css:salon

// css:store
const CSS_STORE = `.ol-root .ol-profile{gap:0;margin-bottom:22px}
.ol-root .ol-bio{margin-top:12px;font-size:var(--k5);color:#c9c4bd;max-width:38ch}
.ol-root .ol-profile .ol-socials{margin-top:12px}
.ol-root .is-grid .ol-cat-list{gap:12px 12px}
.ol-root .ol-cat-item{background:none}
.ol-root .ol-cat-info{padding:8px 0 0;gap:2px}
.ol-root .ol-cat-name,.ol-root .ol-cat-price,.ol-root .ol-cat-old,.ol-root .ol-cat-stock{font-size:var(--k5)}
.ol-root .ol-cat-name{font-family:var(--ol-title-font);font-weight:500;letter-spacing:0}
.ol-root .ol-cat-buy{min-height:40px;background:#181512;color:#ffffff!important}
.ol-root .ol-cat-badges{top:6px;left:6px}
.ol-root .ol-copybtn{min-height:56px}`;
// /css:store

// css:streamer
const CSS_STREAMER = `.ol-root .ol-profile{position:relative;gap:0;margin:0 -8px 22px;padding:8px;background:#151515;border-radius:4px}
.ol-root .ol-avatar{width:100%;height:60svh;border-radius:2px;margin:0;filter:brightness(.8)}
.ol-root .ol-title{position:absolute;top:calc(8px + 9svh);left:22px;right:22px;z-index:1;max-width:4.4em;text-shadow:0 0 22px rgba(0,0,0,.5)}
.ol-root .ol-bio,.ol-root .ol-profile .ol-socials{margin:14px 8px 0}
.ol-root .ol-profile .ol-socials{margin-bottom:8px}
.ol-root .ol-b-events{margin:0 -16px;padding:28px 16px;background:#efefef;color:#0a0a0a}
.ol-root .ol-b-events .ol-ev-heading{color:#0a0a0a}
.ol-root .ol-b-events .ol-ev{background:#ffffff;color:#0a0a0a}
.ol-root .ol-col-card{background:#151515}
.ol-root .ol-col-media{aspect-ratio:1}
.ol-root .ol-frame{border-radius:4px}
@media (prefers-reduced-motion:no-preference){.ol-root .ol-avatar{animation:st-glow 6s ease-in-out infinite alternate}}
@keyframes st-glow{from{filter:brightness(.7)}to{filter:brightness(.9)}}`;
// /css:streamer

// css:tacotruck
const CSS_TACOTRUCK = `.ol-root .ol-profile{gap:0;margin:0 -4px 22px}
.ol-root .ol-avatar{width:100%;height:56svh;border-radius:18px;margin:0}
.ol-root .ol-title{position:relative;z-index:1;margin-top:-.38em;font-style:italic;white-space:nowrap;transform-origin:left bottom}
.ol-root .ol-bio,.ol-root .ol-profile .ol-socials{margin-left:4px}
.ol-root .ol-bio{margin-top:12px}
.ol-root .ol-profile .ol-socials{margin-top:12px}
.ol-root .is-list .ol-cat-media{width:112px;min-height:112px}
.ol-root .ol-cat-tag{background:#5c0b23;color:#ff99d3}
.ol-root .ol-cat-tab{background:#4d0519;color:#ff99d3}
.ol-root .ol-frame{border-radius:18px}
@media (prefers-reduced-motion:no-preference){@supports (animation-timeline:scroll()){.ol-root .ol-title{animation:tt-shrink linear both;animation-timeline:scroll(root);animation-range:0 55svh}}}
@keyframes tt-shrink{to{scale:.86}}`;
// /css:tacotruck

// css:teacher
const CSS_TEACHER = `.ol-root .ol-profile{gap:0;margin-bottom:54px}
.ol-root .ol-avatar{order:1;width:84px;height:84px;margin:0 0 18px}
.ol-root .ol-title{order:2;text-align:center}
.ol-root .ol-bio{order:3;margin-top:14px;text-align:center}
.ol-root .ol-profile .ol-socials{order:4;margin-top:14px}
.ol-root .ol-blocks{margin:0 -16px}
.ol-root .ol-blocks>.ol-block{position:relative;padding:24px 20px 28px;background:#e3e1dc;color:#1f2b4d;border-radius:14px 14px 0 0;margin-top:20px}
.ol-root .ol-blocks>.ol-block::before{content:"";position:absolute;top:-18px;left:20px;width:34%;height:20px;background:inherit;border-radius:10px 10px 0 0}
.ol-root .ol-blocks>.ol-block:nth-child(2){background:#1f2b4d;color:#ffffff}
.ol-root .ol-blocks>.ol-block:nth-child(2) .ol-ev-heading{color:#ffffff}
.ol-root .ol-blocks>.ol-block:nth-child(even)::before{left:auto;right:20px}
.ol-root .ol-blocks>.ol-block:nth-child(3){background:#f4f4f2}
.ol-root .ol-blocks>.ol-block:last-child{background:#ffffff;margin-top:0}
.ol-root .ol-blocks>.ol-block:last-child::before{display:none}
.ol-root .ol-ev-heading,.ol-root .ol-col-header h3{margin-top:0}
.ol-root .ol-image img{border-radius:10px}`;
// /css:teacher

// css:tours
const CSS_TOURS = `.ol-root .ol-profile{position:relative;gap:0;margin:0 -16px 22px;overflow:hidden}
.ol-root .ol-profile::before{content:"";position:absolute;top:0;left:0;right:0;height:110px;background:#2b2622}
.ol-root .ol-title{order:1;position:relative;z-index:1;width:max-content;max-width:none;height:110px;display:flex;align-items:center;white-space:nowrap;padding:0 4vw;color:#ebe5e3}
.ol-root .ol-avatar{order:2;width:100%;height:auto;aspect-ratio:4/5;border-radius:0;margin:0}
.ol-root .ol-bio,.ol-root .ol-profile .ol-socials{order:3;margin-left:16px;margin-right:16px}
.ol-root .ol-bio{margin-top:16px}
.ol-root .ol-profile .ol-socials{order:4;margin-top:14px}
.ol-root .is-list .ol-cat-media{width:112px;min-height:112px}
@media (prefers-reduced-motion:no-preference){.ol-root .ol-title{animation:to-marquee 22s ease-in-out infinite alternate}}
@keyframes to-marquee{from{translate:0 0}to{translate:calc(-100% + 100vw) 0}}`;
// /css:tours

// css:wedding
const CSS_WEDDING = `.ol-root .ol-profile{gap:0;margin-bottom:24px}
.ol-root .ol-avatar{width:100%;height:48svh;border-radius:16px;margin:0}
.ol-root .ol-title,.ol-root .ol-bio{align-self:stretch;background:#f4f3ee;margin:0 10px}
.ol-root .ol-title{position:relative;margin-top:-24px;padding:26px 18px 0;border-radius:16px 16px 0 0;border-top:8px solid #bfb21a;text-align:center}
.ol-root .ol-bio{padding:12px 22px 26px;border-radius:0 0 16px 16px;text-align:center;max-width:none}
.ol-root .ol-image img{border-radius:16px}
.ol-root .ol-ev-media{border-radius:16px 16px 0 0}
.ol-root .ol-frame{border-radius:16px}
@media (prefers-reduced-motion:no-preference){.ol-root .ol-avatar{animation:we-drift 18s ease-in-out infinite alternate}}
@keyframes we-drift{from{object-position:50% 40%}to{object-position:50% 60%}}`;
// /css:wedding

export const TEMPLATE_CATEGORIES = ['Personal', 'Creators', 'Business', 'Food', 'Services', 'Events'];

// v2: the redesign. Same ids as before, so pages and links that name a template keep working.
const TEMPLATES_V2 = [
  {
    id: 'minimal', name: 'Minimal', category: 'Personal', description: 'Quiet and exact: a name, one object, three links.',
    theme: 'air',
    // tasteskill "The quiet instrument" (seed 611115478): Archivo, white with signal red on the one action.
    design: {
      wallpaper: { type: 'solid', color: '#ffffff' },
      titleFont: 'archivo', bodyFont: 'archivo', titleWeight: '400', bodySize: 17, titleColor: '#0a0a0a', textColor: '#0a0a0a',
      headerLayout: 'left', avatarShape: 'square', avatarSize: 160, avatarBorderWidth: 0,
      socialsStyle: 'plain', socialsColor: '#0a0a0a', socialsSize: 22,
      buttonStyle: 'fill', buttonColor: '#f2f2f2', buttonTextColor: '#0a0a0a', buttonBorderWidth: 0, buttonShadowColor: '#00000000', buttonRadius: 0, buttonHeight: 56, buttonHover: 'none', buttonAlign: 'left',
      surfaceColor: '#f2f2f2', surfaceTextColor: '#0a0a0a', surfaceRadius: 0, accentColor: '#d92b21', accentTextColor: '#ffffff',
      maxWidth: 480, gap: 8, paddingTop: 32,
      entrance: 'fade-up', entranceSpeed: 'slow', entranceStagger: 80, entranceOnScroll: true, buttonPress: true,
      customCss: kit({ s: ['clamp(34px,9vw,52px)', '24px', '20px', '17px', '15px'], weight: 400, lead: 1.05 }) + CSS_MINIMAL,
    },
    profile: { title: 'Alex Rivera', avatar: img('1544723795-3fb6469f5b39', 640, 640), bio: 'Designer in Madrid. I make identities and interfaces for small, careful companies.' },
    socials: [['instagram', 'https://instagram.com/'], ['linkedin', 'https://linkedin.com/in/'], ['email', 'hello@example.com']],
    blocks: [
      fx(['link', { title: 'Book a coffee chat', subtitle: '30 minutes, online or in Malasaña', url: ex }], { stButtonColor: '#d92b21', stButtonTextColor: '#ffffff' }),
      ['link', { title: 'Portfolio', subtitle: 'Identities and interfaces, 2019 to now', url: ex }],
      ['link', { title: 'How I plan my week', subtitle: 'Latest article', url: ex }],
      ['header', { text: 'Recent work', align: 'left' }],
      ['gallery', { layout: 'grid', columns: 3, items: [
        item({ image: img('1590690726318-b1733e44515a', 480), caption: '' }),
        item({ image: img('1777652918753-d66882b15391', 480), caption: '' }),
        item({ image: img('1764737740462-2a310c7b2c39', 480), caption: '' }),
      ] }],
      credit(),
    ],
  },
  {
    id: 'creator', name: 'Content creator', category: 'Creators', description: 'Your name as a monument, the newest video and every way to follow.',
    theme: 'dark',
    // tasteskill "The name as a monument" (seed 1557667388): Unbounded over Onest, forest black with pale lime.
    design: {
      wallpaper: { type: 'solid', color: '#0f1f10' },
      titleFont: 'unbounded', bodyFont: 'onest', titleWeight: '800', bodySize: 18, titleColor: '#ffffff', textColor: '#ffffff',
      headerLayout: 'left', avatarShape: 'square', avatarSize: 160, avatarBorderWidth: 0,
      socialsStyle: 'plain', socialsColor: '#ffffff', socialsSize: 24,
      buttonStyle: 'fill', buttonColor: '#162a17', buttonTextColor: '#ffffff', buttonBorderWidth: 0, buttonShadowColor: '#00000000', buttonRadius: 0, buttonHeight: 58, buttonHover: 'none', buttonAlign: 'left',
      surfaceColor: '#162a17', surfaceTextColor: '#ffffff', surfaceRadius: 0, accentColor: '#c6f19d', accentTextColor: '#0f1f10',
      maxWidth: 520, gap: 10, paddingTop: 20,
      entrance: 'fade-up', entranceStagger: 70, entranceOnScroll: true, buttonPress: true,
      customCss: kit({ s: ['25vw', '30px', '22px', '18px', '15px'], up: true, weight: 800, track: '-.03em', lead: .85 }) + CSS_CREATOR,
    },
    profile: { title: 'Mia Creates', avatar: img('1567516364473-233c4b6fcfbe', 640, 800), bio: 'Lifestyle and travel films. A new one every Sunday.', verified: true },
    socials: [['youtube', 'https://youtube.com/'], ['tiktok', 'https://tiktok.com/'], ['instagram', 'https://instagram.com/'], ['patreon', 'https://patreon.com/']],
    blocks: [
      fx(['link', { title: 'Join my community', subtitle: 'Exclusive posts and behind the scenes', url: ex }], { stButtonColor: '#c6f19d', stButtonTextColor: '#0f1f10' }),
      ['video', { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', title: 'Newest video' }],
      ['header', { text: 'Last trip', align: 'left' }],
      ['gallery', { layout: 'carousel', items: [
        item({ image: img('1469854523086-cc02fe5d8800', 720, 900), caption: 'Day one' }),
        item({ image: img('1585208798174-6cedd86e019a', 720, 900), caption: 'Lisbon' }),
        item({ image: img('1631635490744-229e551afade', 720, 900), caption: 'The lake' }),
      ] }],
      ['header', { text: 'Work with me', align: 'left' }],
      ['link', { title: 'Brand partnerships', subtitle: 'Media kit and rates', url: ex }],
      ['copy', { title: 'Discount code', text: 'MIA15', subtitle: '15% off my favourite gear' }],
      credit(),
    ],
  },
  {
    id: 'musician', name: 'Musician', category: 'Creators', description: 'Album, a countdown to the release show, tour dates and where to listen.',
    theme: 'air',
    design: {
      wallpaper: { type: 'solid', color: '#f0ff1c' },
      titleFont: 'bebas-neue', bodyFont: 'eb-garamond', titleWeight: '400', titleSize: 48, bodySize: 18, titleColor: '#000000', textColor: '#000000',
      headerLayout: 'left', avatarShape: 'square', avatarSize: 160, avatarBorderWidth: 0,
      socialsStyle: 'plain', socialsColor: '#000000', socialsSize: 26,
      buttonStyle: 'fill', buttonColor: '#fe7141', buttonTextColor: '#000000', buttonBorderColor: '#000000', buttonBorderWidth: 0, buttonShadowColor: '#00000000',
      buttonRadius: 0, buttonHeight: 60, buttonHover: 'invert', buttonAlign: 'left',
      surfaceColor: '#000000', surfaceTextColor: '#f4f4f4', surfaceRadius: 0, accentColor: '#fe7141', accentTextColor: '#000000',
      maxWidth: 600, gap: 12, paddingTop: 28,
      entrance: 'rise', entranceStagger: 70, entranceOnScroll: true, buttonPress: true,
      customCss: MUSICIAN_CSS,
    },
    profile: { title: 'The Night Owls', avatar: 'https://live.staticflickr.com/8488/8216365436_5496420b99_b.jpg',
      bio: 'Indie band from Austin, Texas. The new album is out now, and we are taking it to three Texas stages.' },
    socials: [['spotify', 'https://open.spotify.com/'], ['applemusic', 'https://music.apple.com/'], ['youtube', 'https://youtube.com/'], ['instagram', 'https://instagram.com/']],
    blocks: [
      ['link', { title: 'Release show tickets', subtitle: 'The Parish, Austin', url: ex }],
      ['countdown', { title: 'Doors open in', date: `${inDays(13)}T02:00:00.000Z`, doneText: 'Doors are open at The Parish' }],
      ['music', { url: 'https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy' }],
      ['events', { title: 'Tour', layout: 'banners', dateFormat: 'medium', events: [
        item({ title: 'Austin — The Parish', subtitle: 'Album release show', date: inDays(12), from: '20:00', to: '23:00', location: 'Austin, TX', url: ex, buttonLabel: 'Tickets' }),
        item({ title: 'Dallas — Trees', date: inDays(19), from: '21:00', to: '23:30', location: 'Dallas, TX', url: ex, buttonLabel: 'Tickets' }),
        item({ title: 'Houston — White Oak', date: inDays(26), from: '20:00', to: '23:00', location: 'Houston, TX', url: ex, buttonLabel: 'Tickets' }),
      ] }],
      fx(['collection', { title: 'Listen, watch, wear', layout: 'grid', columns: 2 }, [
        ['link', { title: 'Listen', url: 'https://open.spotify.com/' }],
        ['link', { title: 'Austin tickets', url: ex, thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Sixth_Street_%28Austin%29_at_night.jpg/960px-Sixth_Street_%28Austin%29_at_night.jpg' }],
        ['link', { title: 'Dallas tickets', url: ex, thumbnail: 'https://live.staticflickr.com/3555/3348708455_22de3d0335_b.jpg' }],
        ['link', { title: 'Watch', url: 'https://youtube.com/' }],
        ['link', { title: 'Merch', url: ex }],
        ['link', { title: 'Houston tickets', url: ex, thumbnail: 'https://live.staticflickr.com/142/325984071_aafc8f7146_b.jpg' }],
        ['link', { title: 'Our hometown', url: ex, thumbnail: 'https://live.staticflickr.com/8300/7991482075_5461f69f1f_b.jpg' }],
        ['link', { title: 'Vinyl', url: ex }],
      ]], { enter: 'fade' }),
      fx(['banner', { title: 'Stay up late with us', text: 'Join the list for new songs, first tickets and the odd midnight show.', bgColor: '#000000', textColor: '#f0ff1c', ratio: '4 / 5', position: 'top', url: ex, buttonLabel: 'Join the list' }], { enter: 'unfold' }),
      ['text', { align: 'left', text: 'Photos: [Barred owl](https://www.flickr.com/photos/89953135@N07/8216365436) by btrentler, CC BY 2.0 · [Sixth Street at night](https://commons.wikimedia.org/w/index.php?curid=73287041) by Kevin Payravi, CC BY-SA 4.0 · [Club Dada](https://www.flickr.com/photos/23860276@N05/3348708455) by Schlüsselbein2007, CC BY 2.0 · [Houston at night](https://www.flickr.com/photos/98063470@N00/325984071) by TheFriendlyFiend, CC BY-SA 2.0 · [Greetings from Austin](https://www.flickr.com/photos/24724221@N07/7991482075) by Shook Photos, CC BY 2.0.' }],
    ],
  },
  {
    id: 'photographer', name: 'Photographer', category: 'Creators', description: 'Prints on a wall: an uneven gallery, wedding dates and bookings.',
    theme: 'air',
    // tasteskill "Photographs at uneven sizes" (seed 50992784): light Fraunces over Hanken Grotesk, olive on bone.
    design: {
      wallpaper: { type: 'solid', color: '#ecebe7' },
      titleFont: 'fraunces', bodyFont: 'hanken-grotesk', titleWeight: '400', bodySize: 17, titleColor: '#38450f', textColor: '#38450f',
      headerLayout: 'left', avatarShape: 'square', avatarSize: 160, avatarBorderWidth: 0,
      socialsStyle: 'plain', socialsColor: '#38450f', socialsSize: 22,
      buttonStyle: 'fill', buttonColor: '#e1dfd9', buttonTextColor: '#38450f', buttonBorderWidth: 0, buttonShadowColor: '#00000000', buttonRadius: 0, buttonHeight: 56, buttonHover: 'none', buttonAlign: 'left',
      surfaceColor: '#e1dfd9', surfaceTextColor: '#38450f', surfaceRadius: 0, accentColor: '#38450f', accentTextColor: '#ecebe7',
      maxWidth: 560, gap: 12, paddingTop: 28,
      entrance: 'fade', entranceSpeed: 'slow', entranceStagger: 90, entranceOnScroll: true, buttonPress: true,
      customCss: kit({ s: ['17vw', '30px', '22px', '17px', '15px'], weight: 300, track: '-.01em', lead: 1 }) + CSS_PHOTOGRAPHER,
    },
    profile: { title: 'Lena Brooks', avatar: img('1541516160071-4bb0c5af65ba', 720, 480), bio: 'Weddings, portraits and editorial work, photographed slowly and in natural light.' },
    socials: [['instagram', 'https://instagram.com/'], ['behance', 'https://behance.net/'], ['pinterest', 'https://pinterest.com/']],
    blocks: [
      fx(['booking', { buttonLabel: 'Book a session', services: [
        item({ name: 'Portrait session', description: '1 hour, 20 edited photos', duration: '60', price: '$150' }),
        item({ name: 'Engagement shoot', description: '2 hours, 40 edited photos', duration: '120', price: '$300' }),
      ], hours: weekdays('10:00', '18:00', ['tue', 'wed', 'thu', 'fri', 'sat']) }], { stButtonColor: '#38450f', stButtonTextColor: '#ecebe7' }),
      ['banner', { title: '2026 weddings: a few dates left', text: 'Ceremonies, portraits and the quiet hours in between.', image: img('1519741497674-611481863552', 900, 1125), shade: 30, bgColor: '#38450f', textColor: '#ecebe7', ratio: '4 / 5', url: ex, buttonLabel: 'Check availability' }],
      ['gallery', { layout: 'grid', columns: 2, items: [
        item({ image: img('1639330907580-1be70acbc1e1', 600, 800) }),
        item({ image: img('1639330945576-8ce15e5920f2', 600, 600) }),
        item({ image: img('1492667154321-99c184cc8b89', 600, 750) }),
        item({ image: img('1506863530036-1efeddceb993', 600, 800) }),
        item({ image: img('1540076156429-35ffe82b7870', 600, 600) }),
        item({ image: img('1502389498275-fe50566c4c5a', 800, 600) }),
      ] }],
      ['link', { title: 'Full portfolio', subtitle: 'Weddings, portraits, editorial', url: ex }],
      ['reviews', { title: 'What clients say' }],
      credit(),
    ],
  },
  {
    id: 'restaurant', name: 'Restaurant & café', category: 'Food', description: 'A dim room and lit plates: menu, hours, a table, the map.',
    theme: 'dark',
    // tasteskill "The dark room" (seed 1578617846): one dark field, dishes lit like exhibits; DM Sans stands in for Switzer.
    design: {
      wallpaper: { type: 'solid', color: '#161c1a' },
      titleFont: 'dm-sans', bodyFont: 'dm-sans', titleWeight: '400', bodySize: 17, titleColor: '#e3e2da', textColor: '#e3e2da',
      headerLayout: 'left', avatarShape: 'square', avatarSize: 160, avatarBorderWidth: 0,
      socialsStyle: 'plain', socialsColor: '#e3e2da', socialsSize: 22,
      buttonStyle: 'fill', buttonColor: '#1f2725', buttonTextColor: '#e3e2da', buttonBorderWidth: 0, buttonShadowColor: '#00000000', buttonRadius: 2, buttonHeight: 56, buttonHover: 'none', buttonAlign: 'left',
      surfaceColor: '#1f2725', surfaceTextColor: '#e3e2da', surfaceRadius: 2, accentColor: '#9fc7b8', accentTextColor: '#161c1a',
      maxWidth: 540, gap: 10, paddingTop: 0,
      entrance: 'fade', entranceSpeed: 'slow', entranceStagger: 80, entranceOnScroll: true, buttonPress: true,
      customCss: kit({ s: ['clamp(34px,9vw,44px)', '28px', '20px', '17px', '15px'], weight: 400, track: '-.03em', lead: 1.1, r: 2 }) + CSS_RESTAURANT,
    },
    profile: { title: 'Casa Olivo', avatar: img('1709548145082-04d0cde481d4', 900, 1200), bio: 'Mediterranean kitchen in Madrid since 2012. Wood fire, olive oil, long dinners.' },
    socials: [['instagram', 'https://instagram.com/'], ['whatsapp', 'https://wa.me/'], ['phone', '+15551234567']],
    blocks: [
      ['status', { hours: weekdays('12:00', '23:00', ['tue', 'wed', 'thu', 'fri', 'sat', 'sun']) }],
      fx(['link', { title: 'Book a table', subtitle: 'Tonight or any evening', url: ex }], { stButtonColor: '#9fc7b8', stButtonTextColor: '#161c1a' }),
      ['catalog', { display: 'always', title: 'Menu', layout: 'list', products: [
        item({ name: 'Burrata & tomatoes', image: img('1555072930-714bba1d24e2'), category: 'Starters', description: 'Heirloom tomatoes, basil oil', price: 12, tags: ['vegetarian'] }),
        item({ name: 'Grilled octopus', image: img('1535980156496-87fc2cfcb832'), category: 'Starters', description: 'Potato, paprika, olive oil', price: 16, tags: ['popular'] }),
        item({ name: 'Seafood paella', image: img('1694685367640-05d6624e57f1'), category: 'Mains', description: 'Rice from Valencia, for two', price: 38 }),
        item({ name: 'Lamb tagine', image: img('1761168955192-d710bf401325'), category: 'Mains', description: 'Apricots, almonds, couscous', price: 24, tags: ['spicy'] }),
        item({ name: 'Basque cheesecake', image: img('1676300185983-d5f242babe34'), category: 'Desserts', description: 'Burnt top, soft middle', price: 8 }),
      ] }],
      ['map', { address: 'Gran Vía 1, Madrid', title: 'Find us' }],
      ['reviews', { title: 'Reviews' }],
      credit(),
    ],
  },
  {
    id: 'foodtruck', name: 'Food truck', category: 'Food', description: 'Where the truck is today, the menu to order ahead, the week’s route.',
    theme: 'air',
    // tasteskill "The place carries it" (seed 1999782521): the truck first, the name under it; Newsreader stands in for Sentient.
    design: {
      wallpaper: { type: 'solid', color: '#ffffff' },
      titleFont: 'newsreader', bodyFont: 'newsreader', titleWeight: '400', bodySize: 18, titleColor: '#1f2b4d', textColor: '#1f2b4d',
      headerLayout: 'left', avatarShape: 'square', avatarSize: 160, avatarBorderWidth: 0,
      socialsStyle: 'plain', socialsColor: '#1f2b4d', socialsSize: 22,
      buttonStyle: 'fill', buttonColor: '#f4f4f2', buttonTextColor: '#1f2b4d', buttonBorderWidth: 0, buttonShadowColor: '#00000000', buttonRadius: 0, buttonHeight: 56, buttonHover: 'none', buttonAlign: 'left',
      surfaceColor: '#f4f4f2', surfaceTextColor: '#1f2b4d', surfaceRadius: 0, accentColor: '#f7941d', accentTextColor: '#1f2b4d',
      maxWidth: 540, gap: 10, paddingTop: 0,
      entrance: 'fade-up', entranceStagger: 70, entranceOnScroll: true, buttonPress: true,
      customCss: kit({ s: ['23vw', '34px', '22px', '18px', '15px'], weight: 300, track: '-.015em', lead: .95 }) + CSS_FOODTRUCK,
    },
    profile: { title: 'Burger Bus', avatar: img('1565123409695-7b5ef63a2efb', 900, 900), bio: 'Smash burgers on wheels. Order ahead and skip the line.' },
    socials: [['instagram', 'https://instagram.com/'], ['tiktok', 'https://tiktok.com/'], ['whatsapp', 'https://wa.me/']],
    blocks: [
      ['status', { source: 'route', style: 'card' }],
      ['catalog', { display: 'always', title: 'Order ahead', ordering: 'pickup', products: [
        item({ name: 'Classic smash', image: img('1572802419224-296b0aeee0d9'), category: 'Burgers', description: 'Double patty, cheddar, pickles', price: 9, tags: ['popular'], extras: 'Bacon = 2\nExtra cheese = 1\nNo onion' }),
        item({ name: 'Spicy chicken', image: img('1606755962773-d324e0a13086'), category: 'Burgers', description: 'Crispy thigh, chili mayo', price: 10, tags: ['spicy'], extras: 'Jalapeños = 0.5' }),
        item({ name: 'Veggie burger', image: img('1586190848861-99aa4a171e90'), category: 'Burgers', description: 'Black bean patty, smoked cheddar', price: 9, tags: ['vegetarian'] }),
        item({ name: 'Fries', image: img('1630384060421-cb20d0e0649d'), category: 'Sides', description: 'Skin on, sea salt', price: 4 }),
        item({ name: 'Lemonade', image: img('1623084921164-4a8c5c37a912'), category: 'Drinks', description: 'Squeezed this morning', price: 3 }),
      ] }],
      ['location', { title: 'Where we are today' }],
      ['route', { stops: [
        item({ day: 'mon', place: 'Downtown square', from: '11:00', to: '15:00' }),
        item({ day: 'wed', place: 'University campus', from: '12:00', to: '16:00' }),
        item({ day: 'fri', place: 'Night market', from: '18:00', to: '23:00' }),
        item({ day: 'sat', place: 'Beach parking', from: '12:00', to: '20:00' }),
      ] }],
      ['loyalty', { reward: 'A free burger', stamps: 8, icon: '🍔' }],
      credit(),
    ],
  },
  {
    id: 'bakery', name: 'Bakery & desserts', category: 'Food', description: 'Your name like a film title over the counter: cakes, pastries, WhatsApp orders.',
    theme: 'paper',
    // tasteskill "The name as a monument" (seed 358064438): Barlow Condensed over Barlow, moss and sand.
    design: {
      wallpaper: { type: 'solid', color: '#ddd6c6' },
      titleFont: 'barlow-condensed', bodyFont: 'barlow', titleWeight: '700', bodySize: 18, titleColor: '#2a2a26', textColor: '#2a2a26',
      headerLayout: 'left', avatarShape: 'square', avatarSize: 160, avatarBorderWidth: 0,
      socialsStyle: 'plain', socialsColor: '#2a2a26', socialsSize: 22,
      buttonStyle: 'fill', buttonColor: '#d2cab8', buttonTextColor: '#2a2a26', buttonBorderWidth: 0, buttonShadowColor: '#00000000', buttonRadius: 0, buttonHeight: 56, buttonHover: 'none', buttonAlign: 'left',
      surfaceColor: '#d2cab8', surfaceTextColor: '#2a2a26', surfaceRadius: 0, accentColor: '#4f6238', accentTextColor: '#ffffff',
      maxWidth: 540, gap: 10, paddingTop: 0,
      entrance: 'fade-up', entranceStagger: 70, entranceOnScroll: true, buttonPress: true,
      customCss: kit({ s: ['21vw', '40px', '24px', '18px', '15px'], up: true, weight: 700, track: '-.02em', lead: .88 }) + CSS_BAKERY,
    },
    profile: { title: 'Sugar & Flour', avatar: img('1583338917451-face2751d8d5', 900, 1200), bio: 'Custom cakes and fresh pastries. Order 48 hours ahead, one week for custom cakes.' },
    socials: [['instagram', 'https://instagram.com/'], ['whatsapp', 'https://wa.me/'], ['facebook', 'https://facebook.com/']],
    blocks: [
      fx(['link', { title: 'Order on WhatsApp', subtitle: 'Tell us the day and the cake', url: 'https://wa.me/15551234567' }], { stButtonColor: '#4f6238', stButtonTextColor: '#ffffff' }),
      ['catalog', { display: 'always', title: 'From the counter', layout: 'grid', whatsapp: '+15551234567', products: [
        item({ name: 'Chocolate cake', image: img('1606890737304-57a1ca8a5b62'), description: 'Eight slices, dark ganache', price: 35, badge: 'Best seller' }),
        item({ name: 'Croissant box', image: img('1623334044303-241021148842'), description: 'Six butter croissants', price: 14 }),
        item({ name: 'Macarons', image: img('1569864358642-9d1684040f43'), description: 'Box of twelve', price: 18, discount: 10 }),
        item({ name: 'Custom cake', image: img('1625649611137-df49dc542f6a'), description: 'Tell us your idea', price: 0 }),
      ] }],
      ['faq', { title: 'Good to know', items: [
        item({ question: 'Do you deliver?', answer: 'Yes, within the city for $5.' }),
        item({ question: 'How early should I order?', answer: 'At least 48 hours before, one week for custom cakes.' }),
      ] }],
      credit(),
    ],
  },
  {
    id: 'store', name: 'Online store', category: 'Business', description: 'Every product at once, like a contact sheet: a promo code, the range, shipping answers.',
    theme: 'dark',
    // tasteskill "The contact sheet" (seed 1172998330): Libre Franklin over Source Serif 4, warm black and gold.
    design: {
      wallpaper: { type: 'solid', color: '#0c0a08' },
      titleFont: 'libre-franklin', bodyFont: 'source-serif', titleWeight: '700', bodySize: 17, titleColor: '#ffffff', textColor: '#ffffff',
      headerLayout: 'left', avatarShape: 'hidden', avatarSize: 96, avatarBorderWidth: 0,
      socialsStyle: 'plain', socialsColor: '#ffffff', socialsSize: 22,
      buttonStyle: 'fill', buttonColor: '#181512', buttonTextColor: '#ffffff', buttonBorderWidth: 0, buttonShadowColor: '#00000000', buttonRadius: 0, buttonHeight: 54, buttonHover: 'none', buttonAlign: 'left',
      surfaceColor: '#181512', surfaceTextColor: '#ffffff', surfaceRadius: 0, accentColor: '#c9a45a', accentTextColor: '#0c0a08',
      maxWidth: 560, gap: 12, paddingTop: 28,
      entrance: 'fade-up', entranceStagger: 60, entranceOnScroll: true, buttonPress: true,
      customCss: kit({ s: ['15vw', '28px', '17px', '17px', '15px'], up: true, weight: 700, track: '-.035em', lead: .92 }) + CSS_STORE,
    },
    profile: { title: 'Nord Goods', bio: 'Minimal home objects, made to last. Small batches from three workshops in Denmark and Portugal.' },
    socials: [['instagram', 'https://instagram.com/'], ['pinterest', 'https://pinterest.com/'], ['etsy', 'https://etsy.com/']],
    blocks: [
      fx(['copy', { title: '20% off ceramics this week', text: 'NORD20', subtitle: 'Tap to copy the code' }], { stButtonColor: '#c9a45a', stButtonTextColor: '#0c0a08' }),
      ['catalog', { display: 'always', title: 'The range', layout: 'grid', products: [
        item({ name: 'Ceramic mug', image: img('1616241673111-508b4662c707', 600), price: 18, discount: 20, stock: '12', url: ex }),
        item({ name: 'Linen tote', image: img('1544816155-12df9643f363', 600), price: 32, url: ex }),
        item({ name: 'Candle set', image: img('1640095889747-2090ee12fa7d', 600), price: 26, stock: '3', url: ex }),
        item({ name: 'Oak tray', image: img('1784901393087-988ae280ea4c', 600), price: 45, stock: '0', url: ex }),
        item({ name: 'Vase pair', image: img('1597696929736-6d13bed8e6a8', 600), price: 48, url: ex }),
        item({ name: 'Ribbed bowls', image: img('1784901391108-d9a0f3911bea', 600), price: 36, url: ex }),
      ] }],
      ['faq', { title: 'Shipping & returns', items: [
        item({ question: 'How long is shipping?', answer: 'Two to four business days in Europe.' }),
        item({ question: 'Can I return an item?', answer: 'Yes, within 30 days, unused.' }),
      ] }],
      credit(),
    ],
  },
  {
    id: 'coach', name: 'Coach & consultant', category: 'Services', description: 'Set like a printed report: a masthead portrait, sessions to book, client stories.',
    theme: 'mineral',
    // tasteskill "The printed annual" (seed 1093886672): Instrument Serif and Manrope stand in for Gambarino and General Sans; teal on paper.
    design: {
      wallpaper: { type: 'solid', color: '#f7f9f8' },
      titleFont: 'instrument-serif', bodyFont: 'manrope', titleWeight: '400', bodySize: 17, titleColor: '#06525c', textColor: '#06525c',
      headerLayout: 'left', avatarShape: 'square', avatarSize: 160, avatarBorderWidth: 0,
      socialsStyle: 'plain', socialsColor: '#06525c', socialsSize: 22,
      buttonStyle: 'fill', buttonColor: '#ebf0ee', buttonTextColor: '#06525c', buttonBorderWidth: 0, buttonShadowColor: '#00000000', buttonRadius: 0, buttonHeight: 56, buttonHover: 'none', buttonAlign: 'left',
      surfaceColor: '#ebf0ee', surfaceTextColor: '#06525c', surfaceRadius: 0, accentColor: '#06525c', accentTextColor: '#f7f9f8',
      maxWidth: 560, gap: 12, paddingTop: 0,
      entrance: 'fade-up', entranceStagger: 70, entranceOnScroll: true, buttonPress: true,
      customCss: kit({ s: ['15vw', '34px', '22px', '17px', '15px'], weight: 400, track: '-.02em', lead: .92 }) + CSS_COACH,
    },
    profile: { title: 'Dr. Sam Patel', avatar: img('1500648767791-00dcc994a43e', 1200, 800), bio: 'Career coach. I help people change jobs on purpose, not by accident.' },
    socials: [['linkedin', 'https://linkedin.com/in/'], ['youtube', 'https://youtube.com/'], ['email', 'sam@example.com']],
    blocks: [
      fx(['booking', { buttonLabel: 'Book a session', description: 'Online, by video call', services: [
        item({ name: 'Free intro call', duration: '20', price: 'Free' }),
        item({ name: 'Coaching session', duration: '60', price: '$90' }),
        item({ name: 'CV review', duration: '45', price: '$60' }),
      ], hours: weekdays('09:00', '17:00') }], { stButtonColor: '#06525c', stButtonTextColor: '#f7f9f8' }),
      ['header', { text: 'How we work', align: 'left' }],
      ['text', { align: 'left', text: 'We meet online, set two or three goals and follow up every two weeks. You leave each session with one thing to do before the next.' }],
      ['gallery', { layout: 'grid', columns: 3, items: [
        item({ image: img('1573497620053-ea5300f94f21', 480, 600), caption: 'Sessions' }),
        item({ image: img('1513128034602-7814ccaddd4e', 480, 600), caption: 'Plans' }),
        item({ image: img('1643966391593-3c18419d9ae8', 480, 600), caption: 'Offers' }),
      ] }],
      ['reviews', { title: 'Client stories' }],
      ['faq', { title: 'Questions', items: [
        item({ question: 'How does it work?', answer: 'We meet online, set goals and follow up every two weeks.' }),
        item({ question: 'Can I cancel?', answer: 'Yes, up to 24 hours before.' }),
      ] }],
      ['link', { title: 'Free career guide', subtitle: 'PDF, 24 pages', url: ex, icon: 'download' }],
      credit(),
    ],
  },
  {
    id: 'developer', name: 'Developer', category: 'Personal', description: 'A well-kept board of tiles: your name, a snippet, projects and how to hire you.',
    theme: 'air',
    // tasteskill "The well-kept board" (seed 298761133): Albert Sans, white with signal red on the action.
    design: {
      wallpaper: { type: 'solid', color: '#ffffff' },
      titleFont: 'albert-sans', bodyFont: 'albert-sans', titleWeight: '600', bodySize: 17, titleColor: '#0a0a0a', textColor: '#0a0a0a',
      headerLayout: 'left', avatarShape: 'square', avatarSize: 160, avatarBorderWidth: 0,
      socialsStyle: 'plain', socialsColor: '#0a0a0a', socialsSize: 22,
      buttonStyle: 'fill', buttonColor: '#f2f2f2', buttonTextColor: '#0a0a0a', buttonBorderWidth: 0, buttonShadowColor: '#00000000', buttonRadius: 8, buttonHeight: 56, buttonHover: 'none', buttonAlign: 'left',
      surfaceColor: '#f2f2f2', surfaceTextColor: '#0a0a0a', surfaceRadius: 8, accentColor: '#d92b21', accentTextColor: '#ffffff',
      maxWidth: 560, gap: 6, paddingTop: 10,
      entrance: 'zoom', entranceSpeed: 'fast', entranceStagger: 50, entranceOnScroll: true, buttonPress: true,
      customCss: kit({ s: ['21vw', '28px', '20px', '17px', '15px'], weight: 600, track: '-.035em', lead: .95, r: 8 }) + CSS_DEVELOPER,
    },
    profile: { title: 'dev.jordan', avatar: img('1498050108023-c5249f4df085', 900, 560), bio: 'Full-stack developer. React, Node and Postgres. Open source on weekends.' },
    socials: [['github', 'https://github.com/'], ['linkedin', 'https://linkedin.com/in/'], ['x', 'https://x.com/']],
    blocks: [
      fx(['contact', { email: 'jordan@example.com', emailLabel: 'Hire me' }], { stButtonColor: '#d92b21', stButtonTextColor: '#ffffff' }),
      ['code', { filename: 'hello.js', code: "const me = {\n  stack: ['React', 'Node', 'Postgres'],\n  available: true,\n};\n\nconsole.log(`Let's build something!`);", theme: 'night-owl' }],
      fx(['collection', { title: 'Projects', layout: 'grid', columns: 2 }, [
        ['link', { title: 'Otrelink', subtitle: 'Open-source link pages', url: ex, thumbnail: img('1515879218367-8466d910aaa4', 480) }],
        ['link', { title: 'Tiny links', subtitle: 'Short links with analytics', url: ex, thumbnail: img('1608742213509-815b97c30b36', 480) }],
        ['link', { title: 'Night shift', subtitle: 'A desk app for focus', url: ex, thumbnail: img('1510519138101-570d1dca3d66', 480) }],
        ['link', { title: 'Writing', subtitle: 'Notes on shipping', url: ex }],
      ]], { enter: 'fade' }),
      credit(),
    ],
  },
  {
    id: 'realestate', name: 'Real estate agent', category: 'Business', description: 'The house stays on screen while the details slide up over it.',
    theme: 'air',
    // tasteskill "The split stage" (seed 280765028): the listing photo holds still, a white sheet scrolls over it; Space Grotesk stands in for Clash Grotesk.
    design: {
      wallpaper: { type: 'image', image: 'https://images.unsplash.com/photo-1781795290283-893dd050eeb3?auto=format&w=1600&q=80', color: '#d9dde3', overlay: '#000000', overlayOpacity: 0, blur: 0, adjust: { x: 50, y: 0, zoom: 100, fit: 'contain' } },
      backgroundMotion: 'breathe',
      titleFont: 'space-grotesk', bodyFont: 'space-grotesk', titleWeight: '500', bodySize: 17, titleColor: '#111111', textColor: '#111111',
      headerLayout: 'left', avatarShape: 'circle', avatarSize: 72, avatarBorderWidth: 0,
      socialsStyle: 'plain', socialsColor: '#111111', socialsSize: 22,
      buttonStyle: 'fill', buttonColor: '#f4f4f4', buttonTextColor: '#111111', buttonBorderWidth: 0, buttonShadowColor: '#00000000', buttonRadius: 12, buttonHeight: 56, buttonHover: 'none', buttonAlign: 'left',
      surfaceColor: '#f4f4f4', surfaceTextColor: '#111111', surfaceRadius: 12, accentColor: '#1a4be0', accentTextColor: '#ffffff',
      maxWidth: 560, gap: 10, paddingTop: 0,
      entrance: 'fade-up', entranceStagger: 60, entranceOnScroll: true, buttonPress: true,
      customCss: kit({ s: ['12vw', '28px', '20px', '17px', '15px'], weight: 500, track: '-.03em', lead: .95, r: 12 }) + CSS_REALESTATE,
    },
    profile: { title: 'Grace Kim', avatar: img('1494790108377-be9c29b29330', 240), bio: 'Realtor in San Diego. I help families find a home near the water.' },
    socials: [['instagram', 'https://instagram.com/'], ['facebook', 'https://facebook.com/'], ['phone', '+15551234567']],
    blocks: [
      fx(['link', { title: '3-bed house in La Jolla', subtitle: '$1,250,000 · Ocean view · Open house Sunday', url: ex }], { stButtonColor: '#1a4be0', stButtonTextColor: '#ffffff' }),
      ['link', { title: 'All my listings', url: ex }],
      ['link', { title: 'What is my home worth?', subtitle: 'A free estimate in 48 hours', url: ex }],
      ['header', { text: 'The neighbourhood', align: 'left' }],
      ['gallery', { layout: 'carousel', items: [
        item({ image: img('1654054413716-0a2986b9cd3d', 720, 900), caption: 'The cove, ten minutes away' }),
        item({ image: img('1668277155756-0ebb2801f6b4', 720, 900), caption: 'Sunset from the living room' }),
        item({ image: img('1767567467844-ce73778da9ac', 720, 900), caption: 'Houses on the cliff' }),
      ] }],
      ['vcard', { name: 'Grace Kim', role: 'Realtor', org: 'Sunrise Realty', phone: '+15551234567', email: 'grace@example.com' }],
      ['map', { address: 'La Jolla, San Diego, CA', title: 'Office' }],
      credit(),
    ],
  },
  {
    id: 'fitness', name: 'Fitness trainer', category: 'Services', description: 'A training photo with open sky, the challenge countdown, bookings and classes.',
    theme: 'dark',
    // tasteskill "Photographs at uneven sizes" (seed 1856298337): Young Serif over Source Serif 4, forest black with pale lime.
    design: {
      wallpaper: { type: 'solid', color: '#0f1f10' },
      titleFont: 'young-serif', bodyFont: 'source-serif', titleWeight: '400', bodySize: 18, titleColor: '#ffffff', textColor: '#ffffff',
      headerLayout: 'left', avatarShape: 'square', avatarSize: 160, avatarBorderWidth: 0,
      socialsStyle: 'plain', socialsColor: '#ffffff', socialsSize: 22,
      buttonStyle: 'fill', buttonColor: '#162a17', buttonTextColor: '#ffffff', buttonBorderWidth: 0, buttonShadowColor: '#00000000', buttonRadius: 0, buttonHeight: 56, buttonHover: 'none', buttonAlign: 'left',
      surfaceColor: '#162a17', surfaceTextColor: '#ffffff', surfaceRadius: 0, accentColor: '#c6f19d', accentTextColor: '#0f1f10',
      maxWidth: 560, gap: 12, paddingTop: 0,
      entrance: 'fade-up', entranceStagger: 70, entranceOnScroll: true, buttonPress: true,
      customCss: kit({ s: ['clamp(40px,12vw,64px)', '30px', '22px', '18px', '15px'], weight: 400, track: '-.02em', lead: .95 }) + CSS_FITNESS,
    },
    profile: { title: 'FitWithLuis', avatar: img('1526506118085-60ce8714f8c5', 900, 1300), bio: 'Personal trainer. Strength, HIIT and the habit of showing up.' },
    socials: [['instagram', 'https://instagram.com/'], ['youtube', 'https://youtube.com/'], ['whatsapp', 'https://wa.me/']],
    blocks: [
      fx(['booking', { buttonLabel: 'Book a training', services: [
        item({ name: 'Personal training', duration: '60', price: '$40' }),
        item({ name: 'Online plan call', duration: '30', price: '$25' }),
      ], hours: weekdays('06:00', '20:00', ['mon', 'tue', 'wed', 'thu', 'fri', 'sat']) }], { stButtonColor: '#c6f19d', stButtonTextColor: '#0f1f10' }),
      ['countdown', { title: 'The 30-day challenge starts in', date: `${inDays(9)}T07:00:00.000Z`, doneText: 'The challenge has started' }],
      ['events', { title: 'Group classes', layout: 'banners', dateFormat: 'medium', events: [
        item({ title: 'HIIT in the park', image: eventImg('1778996454753-ca8b1d21b4c7'), date: inDays(2), from: '07:00', to: '08:00', location: 'Central Park' }),
        item({ title: 'Strength basics', image: eventImg('1558611848-73f7eb4001a1'), date: inDays(4), from: '18:00', to: '19:00', location: 'Iron Gym' }),
        item({ title: 'Sunday mobility', image: eventImg('1552196527-bffef41ef674'), date: inDays(6), from: '09:00', to: '10:00', location: 'Online' }),
      ] }],
      ['image', { image: img('1601422407692-ec4eeec1d9b3', 800, 1000), alt: 'Kettlebell get-up', ratio: '4 / 5' }],
      credit(),
    ],
  },
  {
    id: 'salon', name: 'Beauty salon & barber', category: 'Services', description: 'A dark room and one lit chair: booking, a gallery, hours and the map.',
    theme: 'dark',
    // tasteskill "The dark room" (seed 1340990563): soot black with pale lime; DM Sans stands in for Switzer.
    design: {
      wallpaper: { type: 'solid', color: '#0f0f0f' },
      titleFont: 'dm-sans', bodyFont: 'dm-sans', titleWeight: '500', bodySize: 17, titleColor: '#ffffff', textColor: '#ffffff',
      headerLayout: 'classic', avatarShape: 'square', avatarSize: 160, avatarBorderWidth: 0,
      socialsStyle: 'plain', socialsColor: '#ffffff', socialsSize: 22,
      buttonStyle: 'fill', buttonColor: '#1a1a1a', buttonTextColor: '#ffffff', buttonBorderWidth: 0, buttonShadowColor: '#00000000', buttonRadius: 2, buttonHeight: 56, buttonHover: 'none', buttonAlign: 'left',
      surfaceColor: '#1a1a1a', surfaceTextColor: '#ffffff', surfaceRadius: 2, accentColor: '#dafa9c', accentTextColor: '#0f0f0f',
      maxWidth: 520, gap: 10, paddingTop: 0,
      entrance: 'fade', entranceSpeed: 'slow', entranceStagger: 80, entranceOnScroll: true, buttonPress: true,
      customCss: kit({ s: ['28px', '28px', '20px', '17px', '15px'], up: true, weight: 500, track: '.32em', lead: 1.1, r: 2, align: 'center' }) + CSS_SALON,
    },
    profile: { title: 'Velvet Studio', avatar: img('1580618672591-eb180b1a973f', 720, 900), bio: 'Hair, nails and brows in Miami. Walk-ins welcome before noon.' },
    socials: [['instagram', 'https://instagram.com/'], ['tiktok', 'https://tiktok.com/'], ['whatsapp', 'https://wa.me/']],
    blocks: [
      fx(['booking', { buttonLabel: 'Book an appointment', services: [
        item({ name: 'Haircut', duration: '45', price: '$35' }),
        item({ name: 'Color', duration: '120', price: '$90' }),
        item({ name: 'Manicure', duration: '45', price: '$25' }),
        item({ name: 'Brow lamination', duration: '60', price: '$45' }),
      ], hours: weekdays('10:00', '19:00', ['tue', 'wed', 'thu', 'fri', 'sat']) }], { stButtonColor: '#dafa9c', stButtonTextColor: '#0f0f0f' }),
      ['status', { style: 'card', hours: weekdays('10:00', '19:00', ['tue', 'wed', 'thu', 'fri', 'sat']) }],
      ['gallery', { layout: 'carousel', items: [
        item({ image: img('1634449571010-02389ed0f9b0', 720, 900), caption: 'Cut and style' }),
        item({ image: img('1616394584738-fc6e612e71b9', 720, 900), caption: 'Facials' }),
        item({ image: img('1604654894610-df63bc536371', 720, 900), caption: 'Nails' }),
      ] }],
      ['reviews', { title: 'Reviews' }],
      ['map', { address: 'Main Street 10, Miami', title: 'Visit us' }],
      credit(),
    ],
  },
  {
    id: 'podcast', name: 'Podcast', category: 'Creators', description: 'Colour chapters filed like folders: the latest episode, where to listen, recent shows.',
    theme: 'air',
    // tasteskill "Colour chapters" (seed 17943696): mint, pink and white chapters; Bricolage Grotesque stands in for Cabinet Grotesk.
    design: {
      wallpaper: { type: 'solid', color: '#f8f8f8' },
      titleFont: 'bricolage', bodyFont: 'bricolage', titleWeight: '800', bodySize: 17, titleColor: '#0a0a0a', textColor: '#0a0a0a',
      headerLayout: 'classic', avatarShape: 'circle', avatarSize: 96, avatarBorderWidth: 0,
      socialsStyle: 'plain', socialsColor: '#0a0a0a', socialsSize: 22,
      buttonStyle: 'fill', buttonColor: '#ffffff', buttonTextColor: '#0a0a0a', buttonBorderWidth: 0, buttonShadowColor: '#00000000', buttonRadius: 12, buttonHeight: 56, buttonHover: 'none', buttonAlign: 'left',
      surfaceColor: '#ffffff', surfaceTextColor: '#0a0a0a', surfaceRadius: 12, accentColor: '#1f6b3a', accentTextColor: '#ffffff',
      maxWidth: 560, gap: 0, paddingTop: 60,
      entrance: 'rise', entranceStagger: 70, entranceOnScroll: true, buttonPress: true,
      customCss: kit({ s: ['15vw', '34px', '22px', '17px', '15px'], weight: 800, track: '-.035em', lead: .9, r: 12, align: 'left' }) + CSS_PODCAST,
    },
    profile: { title: 'Curious Minds', avatar: img('1485579149621-3123dd979885', 240), bio: 'A weekly podcast about science and the questions you forgot to ask.' },
    socials: [['spotify', 'https://open.spotify.com/'], ['applemusic', 'https://podcasts.apple.com/'], ['youtube', 'https://youtube.com/']],
    blocks: [
      ['music', { url: 'https://open.spotify.com/episode/4rOoJ6Egrf8K2IrywzwOMk' }],
      ['collection', { title: 'Recent episodes', layout: 'list' }, [
        ['link', { title: 'Why do we yawn?', subtitle: 'Episode 112 · 38 min', url: ex, thumbnail: img('1581547848545-a75a2634ba23', 240) }],
        ['link', { title: 'The microscope that changed medicine', subtitle: 'Episode 111 · 44 min', url: ex, thumbnail: img('1614308459036-779d0dfe51ff', 240) }],
        ['link', { title: 'What telescopes hear', subtitle: 'Episode 110 · 41 min', url: ex, thumbnail: img('1548124771-9f2040b66df8', 240) }],
      ]],
      fx(['survey', { buttonLabel: 'Suggest a topic', title: 'What should we talk about next?' }], { stButtonColor: '#1f6b3a', stButtonTextColor: '#ffffff' }),
      ['link', { title: 'Support the show', subtitle: 'From $3 a month', url: ex, icon: 'patreon' }],
      credit(),
    ],
  },
  {
    id: 'conference', name: 'Conference & event', category: 'Events', description: 'The name is the sentence, a photograph sits in it: countdown, tickets, schedule, venue.',
    theme: '3d',
    // tasteskill "The sentence is the layout" (seed 2141352527): carmine field; Manrope stands in for General Sans.
    design: {
      wallpaper: { type: 'solid', color: '#9c1220' },
      titleFont: 'manrope', bodyFont: 'manrope', titleWeight: '800', bodySize: 17, titleColor: '#ffffff', textColor: '#ffffff',
      headerLayout: 'classic', avatarShape: 'square', avatarSize: 160, avatarBorderWidth: 0,
      socialsStyle: 'plain', socialsColor: '#ffffff', socialsSize: 22,
      buttonStyle: 'fill', buttonColor: '#8a101c', buttonTextColor: '#ffffff', buttonBorderWidth: 0, buttonShadowColor: '#00000000', buttonRadius: 999, buttonHeight: 56, buttonHover: 'none', buttonAlign: 'center',
      surfaceColor: '#8a101c', surfaceTextColor: '#ffffff', surfaceRadius: 20, accentColor: '#ffd9dc', accentTextColor: '#9c1220',
      maxWidth: 560, gap: 12, paddingTop: 48,
      entrance: 'fade-up', entranceStagger: 70, entranceOnScroll: true, buttonPress: true,
      customCss: kit({ s: ['13vw', '30px', '20px', '17px', '15px'], weight: 800, track: '-.03em', lead: .9, r: 999, align: 'center' }) + CSS_CONFERENCE,
    },
    profile: { title: 'FutureDev Summit', avatar: img('1762968274962-20c12e6e8ecd', 900, 600), bio: 'Two days of talks, workshops and late conversations. Moscone Center, San Francisco.' },
    socials: [['linkedin', 'https://linkedin.com/'], ['x', 'https://x.com/'], ['youtube', 'https://youtube.com/']],
    blocks: [
      fx(['link', { title: 'Get your ticket', subtitle: 'Early bird ends soon', url: ex }], { stButtonColor: '#ffd9dc', stButtonTextColor: '#9c1220' }),
      ['countdown', { title: 'Doors open in', date: `${inDays(30)}T16:00:00.000Z`, doneText: 'Doors are open' }],
      ['events', { title: 'Schedule', layout: 'calendar', events: [
        item({ title: 'Opening keynote', date: inDays(30), from: '09:30', to: '10:30', location: 'Main hall' }),
        item({ title: 'Workshops', date: inDays(30), from: '11:00', to: '17:00', location: 'Rooms A–D' }),
        item({ title: 'Day 2: talks & party', date: inDays(31), from: '10:00', to: '22:00', location: 'Main hall' }),
      ] }],
      ['gallery', { layout: 'grid', columns: 2, items: [
        item({ image: img('1607799279861-4dd421887fb3', 600, 600), caption: 'Hands-on workshops' }),
        item({ image: img('1501594907352-04cda38ebc29', 600, 600), caption: 'San Francisco' }),
      ] }],
      ['map', { address: 'Moscone Center, San Francisco', title: 'Venue' }],
      ['faq', { title: 'Questions', items: [item({ question: 'Is there a student discount?', answer: 'Yes, 50% with a valid student ID.' })] }],
      credit(),
    ],
  },
  {
    id: 'nonprofit', name: 'Nonprofit & cause', category: 'Business', description: 'Built as an adoption card: donate, adopt, volunteer, share.',
    theme: 'breeze',
    // tasteskill "The page is the object" (seed 689767592): the adoption card; Libre Franklin over Source Serif 4, oxblood on grey.
    design: {
      wallpaper: { type: 'solid', color: '#e2e2e2' },
      titleFont: 'libre-franklin', bodyFont: 'source-serif', titleWeight: '800', bodySize: 18, titleColor: '#7d0c14', textColor: '#3a1a1d',
      headerLayout: 'classic', avatarShape: 'circle', avatarSize: 140, avatarBorderWidth: 0,
      socialsStyle: 'plain', socialsColor: '#7d0c14', socialsSize: 22,
      buttonStyle: 'fill', buttonColor: '#d6d6d6', buttonTextColor: '#3a1a1d', buttonBorderWidth: 0, buttonShadowColor: '#00000000', buttonRadius: 0, buttonHeight: 56, buttonHover: 'none', buttonAlign: 'left',
      surfaceColor: '#d6d6d6', surfaceTextColor: '#3a1a1d', surfaceRadius: 0, accentColor: '#7d0c14', accentTextColor: '#f6f4f1',
      maxWidth: 520, gap: 10, paddingTop: 48,
      entrance: 'fade-up', entranceStagger: 70, entranceOnScroll: true, buttonPress: true,
      customCss: kit({ s: ['11vw', '28px', '20px', '18px', '15px'], up: true, weight: 800, track: '-.035em', lead: .92, align: 'center' }) + CSS_NONPROFIT,
    },
    profile: { title: 'Green Paws Rescue', avatar: img('1553688738-a278b9f063e0', 400), bio: 'We rescue and rehome dogs. Every adoption since 2015 started with a card like this one.' },
    socials: [['instagram', 'https://instagram.com/'], ['facebook', 'https://facebook.com/'], ['paypal', 'https://paypal.me/']],
    blocks: [
      fx(['link', { title: 'Donate', subtitle: 'Every $10 feeds a dog for a week', url: ex }], { stButtonColor: '#7d0c14', stButtonTextColor: '#f6f4f1' }),
      ['link', { title: 'Adopt a dog', subtitle: 'Meet the dogs waiting for a home', url: ex }],
      ['link', { title: 'Become a volunteer', subtitle: 'Walks on Saturday mornings', url: ex }],
      ['gallery', { layout: 'grid', columns: 2, items: [
        item({ image: img('1675701917791-debd2d61cc4a', 600, 750), caption: 'Waiting for a home' }),
        item({ image: img('1569992274375-e56b14e234f1', 600, 750), caption: 'Saturday walks' }),
      ] }],
      ['banner', { title: 'Every $10 feeds a dog for a week', image: img('1761943840993-1c38354e8603', 900, 900), shade: 35, bgColor: '#7d0c14', textColor: '#ffffff', ratio: '1 / 1', url: ex, buttonLabel: 'Donate' }],
      ['copy', { title: 'Bank transfer', text: 'ES12 3456 7890 1234 5678', subtitle: 'Green Paws Rescue' }],
      ['share', { label: 'Share our page' }],
      credit(),
    ],
  },
  {
    id: 'wedding', name: 'Wedding', category: 'Events', description: 'An invitation card under your photograph: countdown, the day, RSVP, the venue.',
    theme: 'paper',
    // tasteskill "The page is the object" (seed 2010330778): the invitation; Barlow Condensed over Barlow, paper grey with brass.
    design: {
      wallpaper: { type: 'solid', color: '#e8e8e3' },
      titleFont: 'barlow-condensed', bodyFont: 'barlow', titleWeight: '700', bodySize: 18, titleColor: '#181715', textColor: '#181715',
      headerLayout: 'classic', avatarShape: 'square', avatarSize: 160, avatarBorderWidth: 0,
      socialsStyle: 'plain', socialsColor: '#181715', socialsSize: 22,
      buttonStyle: 'fill', buttonColor: '#dcdcd6', buttonTextColor: '#181715', buttonBorderWidth: 0, buttonShadowColor: '#00000000', buttonRadius: 16, buttonHeight: 56, buttonHover: 'none', buttonAlign: 'center',
      surfaceColor: '#dcdcd6', surfaceTextColor: '#181715', surfaceRadius: 16, accentColor: '#bfb21a', accentTextColor: '#181715',
      maxWidth: 520, gap: 12, paddingTop: 12,
      entrance: 'fade', entranceSpeed: 'slow', entranceStagger: 90, entranceOnScroll: true, buttonPress: true,
      customCss: kit({ s: ['15vw', '34px', '22px', '18px', '15px'], up: true, weight: 700, track: '-.02em', lead: .9, r: 16, align: 'center' }) + CSS_WEDDING,
    },
    profile: { title: 'Sofía & Daniel', avatar: img('1520854221256-17451cc331bf', 900, 800), bio: 'We are getting married, and we would love you to be there.' },
    socials: [],
    blocks: [
      fx(['survey', { buttonLabel: 'RSVP', title: 'Will you come?', startOpen: false }], { stButtonColor: '#bfb21a', stButtonTextColor: '#181715' }),
      ['countdown', { title: 'The big day is in', date: `${inDays(60)}T17:00:00.000Z`, doneText: 'Just married' }],
      ['events', { title: 'The day', layout: 'banners', dateFormat: 'long', events: [
        item({ title: 'Ceremony', image: eventImg('1696238173596-554e92268051'), date: inDays(60), from: '17:00', to: '18:00', location: 'San Lorenzo Church' }),
        item({ title: 'Dinner & party', image: eventImg('1536392706976-e486e2ba97af'), date: inDays(60), from: '19:30', to: '02:00', location: 'Hacienda Las Flores' }),
      ] }],
      ['map', { address: 'Hacienda Las Flores', title: 'How to get there', directions: true }],
      ['image', { image: img('1622398925373-3f91b1e275f5', 900, 600), alt: 'Two wedding bands', ratio: '3 / 2' }],
      ['link', { title: 'Gift registry', subtitle: 'Or just come, that is the gift', url: ex }],
      credit(),
    ],
  },
  {
    id: 'artist', name: 'Artist portfolio', category: 'Creators', description: 'The work laid out like a contact sheet: commissions, the wall of pieces, the print shop.',
    theme: 'art-pop',
    // tasteskill "The contact sheet" (seed 754533859): Bricolage Grotesque, stone and blueprint blue.
    design: {
      wallpaper: { type: 'solid', color: '#dfdedb' },
      titleFont: 'bricolage', bodyFont: 'bricolage', titleWeight: '600', bodySize: 17, titleColor: '#26251e', textColor: '#26251e',
      headerLayout: 'left', avatarShape: 'hidden', avatarSize: 96, avatarBorderWidth: 0,
      socialsStyle: 'plain', socialsColor: '#26251e', socialsSize: 22,
      buttonStyle: 'fill', buttonColor: '#d3d2ce', buttonTextColor: '#26251e', buttonBorderWidth: 0, buttonShadowColor: '#00000000', buttonRadius: 0, buttonHeight: 54, buttonHover: 'none', buttonAlign: 'left',
      surfaceColor: '#d3d2ce', surfaceTextColor: '#26251e', surfaceRadius: 0, accentColor: '#2456d6', accentTextColor: '#ffffff',
      maxWidth: 560, gap: 8, paddingTop: 28,
      entrance: 'fade', entranceStagger: 60, entranceOnScroll: true, buttonPress: true,
      customCss: kit({ s: ['clamp(30px,9vw,48px)', '24px', '17px', '17px', '15px'], weight: 600, track: '-.04em', lead: .92 }) + CSS_ARTIST,
    },
    profile: { title: 'Kai Mendez', bio: 'Illustration, murals and prints. Commissions open for portraits, book covers and walls.' },
    socials: [['instagram', 'https://instagram.com/'], ['behance', 'https://behance.net/'], ['kofi', 'https://ko-fi.com/']],
    blocks: [
      fx(['link', { title: 'Request a commission', subtitle: 'Reply within two days', url: ex }], { stButtonColor: '#2456d6', stButtonTextColor: '#ffffff' }),
      ['gallery', { layout: 'grid', columns: 3, items: [
        item({ image: img('1580566176138-daa588058b59', 400), caption: 'Bloom, 2025' }),
        item({ image: img('1655998233171-ee5b130acba5', 400), caption: 'Heat, 2025' }),
        item({ image: img('1614850715776-a749a85b4144', 400), caption: 'Stripes, 2024' }),
        item({ image: img('1540929819775-fcc7d4649250', 400), caption: 'Wall, Lisbon' }),
        item({ image: img('1632267071031-1cda764f851f', 400), caption: 'Wall, Austin' }),
        item({ image: img('1758366278313-70468ec8cb2c', 400), caption: 'Print room' }),
      ] }],
      ['link', { title: 'Print shop', subtitle: 'A3 and A2 giclée prints', url: ex }],
      ['link', { title: 'Full portfolio', url: ex }],
      credit(),
    ],
  },
  {
    id: 'teacher', name: 'Teacher & courses', category: 'Services', description: 'Your lessons filed in a folder: book a class, group sessions, free resources.',
    theme: 'mineral',
    // tasteskill "The page is the object" (seed 2081540731): an index folder; Anton over Work Sans, navy with an orange tab.
    design: {
      wallpaper: { type: 'solid', color: '#ffffff' },
      titleFont: 'anton', bodyFont: 'work-sans', titleWeight: '400', bodySize: 17, titleColor: '#1f2b4d', textColor: '#1f2b4d',
      headerLayout: 'classic', avatarShape: 'circle', avatarSize: 96, avatarBorderWidth: 0,
      socialsStyle: 'plain', socialsColor: '#1f2b4d', socialsSize: 22,
      buttonStyle: 'fill', buttonColor: '#ffffff', buttonTextColor: '#1f2b4d', buttonBorderWidth: 0, buttonShadowColor: '#00000000', buttonRadius: 10, buttonHeight: 56, buttonHover: 'none', buttonAlign: 'left',
      surfaceColor: '#ffffff', surfaceTextColor: '#1f2b4d', surfaceRadius: 10, accentColor: '#f7941d', accentTextColor: '#1f2b4d',
      maxWidth: 560, gap: 0, paddingTop: 56,
      entrance: 'rise', entranceStagger: 70, entranceOnScroll: true, buttonPress: true,
      customCss: kit({ s: ['17vw', '32px', '22px', '17px', '15px'], up: true, weight: 400, track: '-.01em', lead: .86, r: 10, align: 'left' }) + CSS_TEACHER,
    },
    profile: { title: 'Profe Ana', avatar: img('1590650213165-c1fef80648c4', 240), bio: 'Spanish lessons online, from first words to fluent conversation.' },
    socials: [['youtube', 'https://youtube.com/'], ['instagram', 'https://instagram.com/'], ['whatsapp', 'https://wa.me/']],
    blocks: [
      fx(['booking', { buttonLabel: 'Book a lesson', services: [
        item({ name: 'Trial lesson', duration: '30', price: '$10' }),
        item({ name: 'Private lesson', duration: '60', price: '$25' }),
      ], hours: weekdays('08:00', '20:00') }], { stButtonColor: '#f7941d', stButtonTextColor: '#1f2b4d' }),
      ['events', { title: 'Group classes', layout: 'banners', events: [
        item({ title: 'Beginners A1', image: eventImg('1522199755839-a2bacb67c546'), date: inDays(3), from: '18:00', to: '19:00', location: 'Zoom' }),
        item({ title: 'Conversation club', image: eventImg('1582298538104-fe2e74c27f59'), date: inDays(5), from: '19:00', to: '20:00', location: 'Zoom' }),
      ] }],
      ['collection', { title: 'Free resources', layout: 'list' }, [
        ['link', { title: 'Verb conjugation cheat sheet', subtitle: 'PDF, 2 pages', url: ex }],
        ['link', { title: '100 everyday phrases', subtitle: 'With audio', url: ex }],
      ]],
      ['image', { image: img('1783286925012-f20b6a63ed4d', 900, 600), alt: 'A Spanish phrasebook on a stack of books', ratio: '3 / 2' }],
      credit(),
    ],
  },
  {
    id: 'businesscard', name: 'Digital business card', category: 'Business', description: 'Words first, pictures later: your name on a dark field, every way to reach you, the company.',
    theme: 'corporate',
    // tasteskill "Type and nothing else" (seed 223204597): light Newsreader on blue-black, cornflower for the action.
    design: {
      wallpaper: { type: 'solid', color: '#0a0d14' },
      titleFont: 'newsreader', bodyFont: 'newsreader', titleWeight: '300', bodySize: 18, titleColor: '#e9edf3', textColor: '#e9edf3',
      headerLayout: 'left', avatarShape: 'hidden', avatarSize: 88, avatarBorderWidth: 0,
      socialsStyle: 'plain', socialsColor: '#e9edf3', socialsSize: 22,
      buttonStyle: 'fill', buttonColor: '#131824', buttonTextColor: '#e9edf3', buttonBorderWidth: 0, buttonShadowColor: '#00000000', buttonRadius: 0, buttonHeight: 56, buttonHover: 'none', buttonAlign: 'left',
      surfaceColor: '#131824', surfaceTextColor: '#e9edf3', surfaceRadius: 0, accentColor: '#5a9bfc', accentTextColor: '#0a0d14',
      maxWidth: 540, gap: 10, paddingTop: 20,
      entrance: 'fade-up', entranceStagger: 70, entranceOnScroll: true, buttonPress: true,
      customCss: kit({ s: ['12.5vw', '30px', '22px', '18px', '15px'], weight: 300, track: '-.05em', lead: .9 }) + CSS_BUSINESSCARD,
    },
    profile: { title: 'Martín López', bio: 'Sales Director at Andes Logistics. Freight and supply chain across Latin America.' },
    socials: [['linkedin', 'https://linkedin.com/in/'], ['email', 'martin@example.com'], ['phone', '+15551234567'], ['whatsapp', 'https://wa.me/']],
    blocks: [
      fx(['contact', { email: 'martin@example.com', emailLabel: 'Email', phone: '+15551234567', phoneLabel: 'Call', whatsapp: '+15551234567', whatsappLabel: 'WhatsApp', layout: 'row' }], { stButtonColor: '#5a9bfc', stButtonTextColor: '#0a0d14' }),
      ['vcard', { label: 'Save my contact', name: 'Martín López', role: 'Sales Director', org: 'Andes Logistics', phone: '+15551234567', email: 'martin@example.com', website: ex }],
      ['header', { text: 'Andes Logistics', align: 'left' }],
      ['gallery', { layout: 'carousel', items: [
        item({ image: img('1785761607942-c0f9d41a74e0', 720, 900), caption: 'Road freight through the Andes' }),
        item({ image: img('1605732562742-3023a888e56e', 720, 900), caption: 'Container logistics' }),
        item({ image: img('1670121180530-cfcba4438038', 720, 900), caption: 'Port operations' }),
        item({ image: img('1689850543263-01a52ccc6943', 720, 900), caption: 'Head office, Santiago' }),
      ] }],
      ['link', { title: 'Company website', subtitle: 'andeslogistics.com', url: ex, icon: 'website' }],
      ['link', { title: 'Book a meeting', subtitle: '30 minutes, video call', url: ex }],
      ['link', { title: 'Company brochure', subtitle: 'PDF, 2 MB', url: ex }],
      ['map', { address: 'Av. Providencia 1234, Santiago', title: 'Office', directions: true }],
      credit(),
    ],
  },
  {
    id: 'tacotruck', name: 'Taco truck', category: 'Food', description: 'The tacos up top, the name crossing them: open status, today’s spot, the menu, festival dates.',
    theme: 'citrus',
    // tasteskill "The split stage" (seed 911550203): italic EB Garamond, burgundy with bubblegum pink.
    design: {
      wallpaper: { type: 'solid', color: '#3d0012' },
      titleFont: 'eb-garamond', bodyFont: 'eb-garamond', titleWeight: '400', bodySize: 19, titleColor: '#ff99d3', textColor: '#ff99d3',
      headerLayout: 'left', avatarShape: 'square', avatarSize: 160, avatarBorderWidth: 0,
      socialsStyle: 'plain', socialsColor: '#ff99d3', socialsSize: 22,
      buttonStyle: 'fill', buttonColor: '#4d0519', buttonTextColor: '#ff99d3', buttonBorderWidth: 0, buttonShadowColor: '#00000000', buttonRadius: 18, buttonHeight: 56, buttonHover: 'none', buttonAlign: 'left',
      surfaceColor: '#4d0519', surfaceTextColor: '#ff99d3', surfaceRadius: 18, accentColor: '#ff99d3', accentTextColor: '#3d0012',
      maxWidth: 540, gap: 10, paddingTop: 12,
      entrance: 'fade-up', entranceStagger: 70, entranceOnScroll: true, buttonPress: true,
      customCss: kit({ s: ['21vw', '34px', '22px', '19px', '15px'], weight: 400, track: '-.01em', lead: 1, r: 18 }) + CSS_TACOTRUCK,
    },
    profile: { title: 'Taco Loco', avatar: img('1648437595587-e6a8b0cdf1f9', 900, 1100), bio: 'Street tacos made fresh on the truck. Follow us around town.' },
    socials: [['instagram', 'https://instagram.com/'], ['tiktok', 'https://tiktok.com/'], ['whatsapp', 'https://wa.me/'], ['facebook', 'https://facebook.com/']],
    blocks: [
      ['status', { source: 'route', style: 'card' }],
      fx(['link', { title: 'Order on WhatsApp', subtitle: 'Pick up at the window', url: 'https://wa.me/15551234567' }], { stButtonColor: '#ff99d3', stButtonTextColor: '#3d0012' }),
      ['catalog', { display: 'always', title: 'Menu', layout: 'list', ordering: 'links', whatsapp: '+15551234567', products: [
        item({ name: 'Al pastor', image: img('1640983743761-4f0e0204bc58'), category: 'Tacos', description: 'Pork, pineapple, onion, cilantro', price: 3, tags: ['popular'] }),
        item({ name: 'Carne asada', image: img('1599974579688-8dbdd335c77f'), category: 'Tacos', description: 'Grilled steak, salsa verde', price: 3.5 }),
        item({ name: 'Baja fish', image: img('1711989874705-bb85dc205541'), category: 'Tacos', description: 'Crispy fish, cabbage, chipotle mayo', price: 4 }),
        item({ name: 'Mushroom & corn', image: img('1644085128237-9ba593123ac3'), category: 'Tacos', description: 'Roasted mushrooms, charred corn', price: 3, tags: ['vegetarian'] }),
        item({ name: 'Loaded quesadilla', image: img('1719957770167-bb66133ba808'), category: 'Specials', description: 'Cheese, choice of meat, guacamole', price: 9, tags: ['spicy'] }),
        item({ name: 'Elote', image: img('1635572228172-ff4ea7f07e8f'), category: 'Sides', description: 'Street corn, cotija, chili', price: 4 }),
        item({ name: 'Horchata', image: img('1724198218800-ef4be935d3a8'), category: 'Drinks', description: 'Rice, cinnamon, cold', price: 3 }),
      ] }],
      ['location', { title: 'Find the truck today' }],
      ['route', { stops: [
        item({ day: 'tue', place: 'Office park', from: '11:30', to: '14:30' }),
        item({ day: 'thu', place: 'Brewery district', from: '17:00', to: '22:00' }),
        item({ day: 'fri', place: 'Downtown plaza', from: '18:00', to: '23:30' }),
        item({ day: 'sun', place: 'Farmers market', from: '09:00', to: '14:00' }),
      ] }],
      ['events', { title: 'Catch us at', layout: 'carousel', events: [
        item({ title: 'Street Food Fest', image: eventImg('1683731505481-a529c4df34f8'), subtitle: 'Booth 12', kind: 'range', date: inDays(10), endDate: inDays(12), allDay: true, location: 'Riverside Park' }),
        item({ title: 'Live music night', image: eventImg('1786206570618-0e9dbf4aac1e'), date: inDays(17), from: '19:00', to: '23:00', location: 'The Yard' }),
      ] }],
      ['link', { title: 'Book the truck for your party', subtitle: 'Weddings, offices, birthdays', url: ex }],
      credit(),
    ],
  },
  {
    id: 'streamer', name: 'Streamer & gamer', category: 'Creators', description: 'The glow of your setup carries the page: live now, the schedule, the gear, ways to support.',
    theme: 'aurora',
    // tasteskill "The place carries it" (seed 1752747873): black and crimson chapters; light Fraunces over Hanken Grotesk.
    design: {
      wallpaper: { type: 'solid', color: '#0a0a0a' },
      titleFont: 'fraunces', bodyFont: 'hanken-grotesk', titleWeight: '300', bodySize: 17, titleColor: '#efefef', textColor: '#efefef',
      headerLayout: 'left', avatarShape: 'square', avatarSize: 160, avatarBorderWidth: 0,
      socialsStyle: 'plain', socialsColor: '#efefef', socialsSize: 22,
      buttonStyle: 'fill', buttonColor: '#151515', buttonTextColor: '#efefef', buttonBorderWidth: 0, buttonShadowColor: '#00000000', buttonRadius: 4, buttonHeight: 56, buttonHover: 'none', buttonAlign: 'left',
      surfaceColor: '#151515', surfaceTextColor: '#efefef', surfaceRadius: 4, accentColor: '#b11226', accentTextColor: '#ffffff',
      maxWidth: 560, gap: 10, paddingTop: 8,
      entrance: 'fade-up', entranceStagger: 70, entranceOnScroll: true, buttonPress: true,
      customCss: kit({ s: ['12vw', '30px', '20px', '17px', '15px'], weight: 300, track: '-.01em', lead: 1, r: 4 }) + CSS_STREAMER,
    },
    profile: { title: 'PixelNova', avatar: img('1616588589676-62b3bd4ff6d2', 900, 1300), bio: 'Variety streamer. Speedruns, cozy games and a lot of chaos.' },
    socials: [['twitch', 'https://twitch.tv/'], ['youtube', 'https://youtube.com/'], ['discord', 'https://discord.gg/'], ['tiktok', 'https://tiktok.com/']],
    blocks: [
      fx(['link', { title: 'Watch live on Twitch', subtitle: 'Mon · Wed · Fri at 8 PM', url: ex, icon: 'twitch' }], { stButtonColor: '#b11226', stButtonTextColor: '#ffffff' }),
      ['video', { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', title: 'Latest highlight' }],
      ['events', { title: 'Stream schedule', layout: 'grid', dateFormat: 'short', events: [
        item({ title: 'Speedrun Monday', image: eventImg('1612287230202-1ff1d85d1bdf'), subtitle: 'Any% attempts', date: inDays(1), from: '20:00', to: '23:00' }),
        item({ title: 'Cozy Wednesday', image: eventImg('1665041950905-adcdd2aaab54'), subtitle: 'Farming and chill', date: inDays(3), from: '20:00', to: '22:30' }),
        item({ title: 'Community games', image: eventImg('1493711662062-fa541adb3fc8'), subtitle: 'Play with subs', date: inDays(5), from: '20:00', to: '23:59' }),
      ] }],
      ['collection', { title: 'My setup', layout: 'grid', columns: 2 }, [
        ['link', { title: 'Mic', url: ex, thumbnail: img('1660631228116-b3643559f611', 480) }],
        ['link', { title: 'Camera', url: ex, thumbnail: img('1612548403247-aa2873e9422d', 480) }],
        ['link', { title: 'Keyboard', url: ex, thumbnail: img('1618384887929-16ec33fab9ef', 480) }],
        ['link', { title: 'Chair', url: ex, thumbnail: img('1770195483917-b3bb444b7a29', 480) }],
      ]],
      ['link', { title: 'Join the Discord', url: ex, icon: 'discord' }],
      ['link', { title: 'Support me', subtitle: 'Tips keep the stream going', url: ex, icon: 'kofi' }],
      credit(),
    ],
  },
  {
    id: 'clinic', name: 'Clinic & health', category: 'Services', description: 'One shape runs everything, the circle of a smile: hours, appointments, answers, the way in.',
    theme: 'ocean',
    // tasteskill "One motif" (seed 824012185): the circle; Outfit stands in for Chillax; card pastels with magenta for the action.
    design: {
      wallpaper: { type: 'solid', color: '#f7f7f5' },
      titleFont: 'outfit', bodyFont: 'outfit', titleWeight: '700', bodySize: 18, titleColor: '#000000', textColor: '#000000',
      headerLayout: 'left', avatarShape: 'circle', avatarSize: 160, avatarBorderWidth: 0,
      socialsStyle: 'plain', socialsColor: '#000000', socialsSize: 22,
      buttonStyle: 'fill', buttonColor: '#ebebe8', buttonTextColor: '#000000', buttonBorderWidth: 0, buttonShadowColor: '#00000000', buttonRadius: 999, buttonHeight: 56, buttonHover: 'none', buttonAlign: 'left',
      surfaceColor: '#ebebe8', surfaceTextColor: '#000000', surfaceRadius: 28, accentColor: '#d0106f', accentTextColor: '#ffffff',
      maxWidth: 540, gap: 10, paddingTop: 32,
      entrance: 'fade-up', entranceStagger: 70, entranceOnScroll: true, buttonPress: true,
      customCss: kit({ s: ['13vw', '30px', '22px', '18px', '15px'], weight: 700, track: '-.03em', lead: 1, r: 999 }) + CSS_CLINIC,
    },
    profile: { title: 'Sonrisa Dental', avatar: img('1629909613654-28e377c37b09', 1000, 1000), bio: 'Family dentistry in Panama City. Check-ups, whitening and orthodontics.' },
    socials: [['whatsapp', 'https://wa.me/'], ['instagram', 'https://instagram.com/'], ['phone', '+15551234567']],
    blocks: [
      fx(['booking', { buttonLabel: 'Book an appointment', description: 'Pick a service and a time that works for you', services: [
        item({ name: 'Check-up & cleaning', duration: '45', price: '$60' }),
        item({ name: 'Teeth whitening', duration: '60', price: '$180' }),
        item({ name: 'Orthodontics consult', duration: '30', price: 'Free' }),
        item({ name: 'Emergency visit', duration: '30', price: '$80' }),
      ], hours: weekdays('08:00', '18:00') }], { stButtonColor: '#d0106f', stButtonTextColor: '#ffffff' }),
      ['status', { style: 'card', hours: weekdays('08:00', '18:00', ['mon', 'tue', 'wed', 'thu', 'fri', 'sat']) }],
      ['contact', { phone: '+15551234567', phoneLabel: 'Call', whatsapp: '+15551234567', whatsappLabel: 'WhatsApp', layout: 'row' }],
      ['gallery', { layout: 'grid', columns: 3, items: [
        item({ image: img('1663755489920-5e09f66d011a', 480), caption: 'Check-ups' }),
        item({ image: img('1607613009820-a29f7bb81c04', 480), caption: 'Care at home' }),
        item({ image: img('1598041543955-0d88c390f3b5', 480), caption: 'Panama City' }),
      ] }],
      ['faq', { title: 'Questions', items: [
        item({ question: 'Do you accept insurance?', answer: 'Yes, most major plans. Send us a photo of your card on WhatsApp to check.' }),
        item({ question: 'Do you treat children?', answer: 'Yes, from age 3. We make the first visit fun.' }),
        item({ question: 'What about emergencies?', answer: 'Call us: we keep slots free every day for urgent cases.' }),
      ] }],
      ['map', { address: 'Calle 50, Panama City', title: 'Our clinic', directions: true }],
      ['reviews', { title: 'Patient reviews' }],
      credit(),
    ],
  },
  {
    id: 'tours', name: 'Tours & travel', category: 'Events', description: 'Your name as a band moving across the mountains: departures, tours, answers, reviews.',
    theme: 'forest',
    // tasteskill "The name as a monument" (seed 630871021): rose grey and green; Newsreader stands in for Erode.
    design: {
      wallpaper: { type: 'solid', color: '#ebe5e3' },
      titleFont: 'newsreader', bodyFont: 'newsreader', titleWeight: '500', bodySize: 18, titleColor: '#2b2622', textColor: '#2b2622',
      headerLayout: 'left', avatarShape: 'square', avatarSize: 160, avatarBorderWidth: 0,
      socialsStyle: 'plain', socialsColor: '#2b2622', socialsSize: 22,
      buttonStyle: 'fill', buttonColor: '#e1dad7', buttonTextColor: '#2b2622', buttonBorderWidth: 0, buttonShadowColor: '#00000000', buttonRadius: 6, buttonHeight: 56, buttonHover: 'none', buttonAlign: 'left',
      surfaceColor: '#e1dad7', surfaceTextColor: '#2b2622', surfaceRadius: 6, accentColor: '#0f7d45', accentTextColor: '#ffffff',
      maxWidth: 560, gap: 10, paddingTop: 14,
      entrance: 'fade-up', entranceStagger: 70, entranceOnScroll: true, buttonPress: true,
      customCss: kit({ s: ['26vw', '34px', '22px', '18px', '15px'], weight: 500, track: '-.025em', lead: .95, r: 6 }) + CSS_TOURS,
    },
    profile: { title: 'Andes Trails', avatar: img('1637580980556-085dee659c7e', 1000, 1250), bio: 'Small-group hikes and adventures in Patagonia, never more than ten people.' },
    socials: [['instagram', 'https://instagram.com/'], ['whatsapp', 'https://wa.me/'], ['youtube', 'https://youtube.com/']],
    blocks: [
      fx(['link', { title: 'Torres del Paine W Trek', subtitle: '5 days · max 10 people · all included', url: ex }], { stButtonColor: '#0f7d45', stButtonTextColor: '#ffffff' }),
      ['events', { title: 'Upcoming departures', layout: 'banners', events: [
        item({ title: 'W Trek', image: eventImg('1641370460764-7a4a314687b7'), subtitle: '3 spots left', kind: 'range', date: inDays(20), endDate: inDays(24), allDay: true, location: 'Puerto Natales' }),
        item({ title: 'Glacier kayaking', image: eventImg('1552751753-0fc84ae5b6c8'), kind: 'range', date: inDays(35), endDate: inDays(36), allDay: true, location: 'Grey Lake' }),
        item({ title: 'Fitz Roy sunrise hike', image: eventImg('1585424335022-13ad7f66f74c'), date: inDays(45), from: '03:30', to: '12:00', location: 'El Chaltén' }),
      ] }],
      ['catalog', { display: 'always', title: 'Tours', layout: 'list', whatsapp: '+15551234567', products: [
        item({ name: 'W Trek (5 days)', image: img('1776582837216-c698aef2c075'), category: 'Multi-day', description: 'Refugios, meals and guide', price: 1290 }),
        item({ name: 'O Circuit (9 days)', image: img('1784295423905-cf7d7e304e99'), category: 'Multi-day', description: 'For experienced hikers', price: 2150 }),
        item({ name: 'Glacier kayak', image: img('1673209378872-a36ba431f248'), category: 'Day trips', description: 'Equipment included', price: 180 }),
        item({ name: 'Private guide', image: img('1551632811-561732d1e306'), category: 'Day trips', description: 'Your route, your pace', price: 250 }),
      ] }],
      ['faq', { title: 'Before you go', items: [
        item({ question: 'How fit do I need to be?', answer: 'You should be able to walk six to eight hours with a light backpack.' }),
        item({ question: 'What is included?', answer: 'Guide, transport from Puerto Natales, meals and camping gear.' }),
      ] }],
      ['reviews', { title: 'Traveler reviews' }],
      credit(),
    ],
  },
];

/** Template versions shown in the gallery; the first one is the default. */
export const TEMPLATE_VERSIONS = [
  { id: 1, label: 'Classic', description: 'The templates built on the themes, with photos and entrance animations.' },
  { id: 2, label: 'v2 · Experimental', description: 'A phone-first redesign: each template has its own art direction and scroll animations. Still being refined.' },
];

/** Every template, both versions. `family` = the template's id in v2; v1 ids end in "-v1". */
export const TEMPLATES = [
  ...TEMPLATES_V1,
  ...TEMPLATES_V2.map((t) => ({ ...t, family: t.id, version: 2 })),
];

const byId = new Map(TEMPLATES.map((t) => [t.id, t]));

/** Build the page content of a template: { profile, socials, blocks, design, settings }. */
export function buildTemplatePage(id) {
  const t = byId.get(id);
  if (!t) return null;
  const make = (tuple) => {
    const [type, data = {}, children] = tuple;
    const b = newBlock(type, data);
    if (tuple.options) b.options = { ...b.options, ...tuple.options };
    if (children) b.children = children.map(make);
    return b;
  };
  const themed = applyTheme(defaultDesign(), t.theme);
  // The scroll-driven picture reveal belongs to v2 only.
  const customCss = [t.design?.customCss, t.version === 1 ? '' : MOTION_CSS].filter(Boolean).join('\n');
  const design = resolveDesign({ ...themed, ...(t.design || {}), customCss, wallpaper: { ...themed.wallpaper, ...(t.design?.wallpaper || {}) } });
  const page = sanitizePage({
    profile: { avatar: '', verified: false, ...t.profile },
    socials: (t.socials || []).map(([platform, url]) => ({ id: uid('s'), platform, url })),
    blocks: t.blocks.map(make),
    design,
    settings: { published: true },
  });
  return page;
}

/** Template list for galleries (no blocks). */
export const templateList = () => TEMPLATES.map(({ id, name, category, description, theme, family, version }) => ({ id, name, category, description, theme, family, version }));
