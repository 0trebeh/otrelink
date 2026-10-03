// ─────────────────────────────────────────────────────────────
//  BLOCK TYPES REGISTRY
//  Add a block type:    create a file in this folder, import it, add it to the list.
//  Remove a block type: delete it from the list (existing blocks of that type are
//                       simply hidden on public pages; nothing breaks).
//
//  A block module looks like:
//  {
//    type: 'my-block',            unique id stored in the database
//    label, description, icon,    shown in the dashboard "Add" modal
//    category: 'Essentials',      groups blocks in the "Add" modal
//    cssClasses?: [{ selector, description }]  documented on the /docs page
//    fields: [...],               settings (see ../fields.js) -> form + validation
//    summary(data) -> string,     one-line summary in the dashboard list
//    render(data, ctx) -> html,   ESCAPE user values with esc()/safeUrl()
//    css?: string,                included once if the block is used
//    hydrate?(el, data, ctx),     optional browser behavior (timers, buttons...)
//  }
// ─────────────────────────────────────────────────────────────

import { createRegistry } from '../util/registry.js';
import { attentionAnimations } from '../animations.js';

import link from './link.js';
import header from './header.js';
import text from './text.js';
import image from './image.js';
import gallery from './gallery.js';
import video from './video.js';
import music from './music.js';
import map from './map.js';
import contact from './contact.js';
import vcard from './vcard.js';
import faq from './faq.js';
import countdown from './countdown.js';
import divider from './divider.js';
import share from './share.js';

export const blockTypes = createRegistry('blockTypes', [
  link,
  header,
  text,
  image,
  gallery,
  video,
  music,
  map,
  contact,
  vcard,
  faq,
  countdown,
  divider,
  share,
], 'type');

/** Settings every block has, regardless of type (shown in an "Advanced" area). */
export const commonBlockFields = [
  { key: 'animation', type: 'select', label: 'Attention animation', default: 'none', options: () => attentionAnimations.options() },
  { key: 'showFrom', type: 'datetime', label: 'Show from', help: 'Leave empty to show right away.' },
  { key: 'showUntil', type: 'datetime', label: 'Hide after', help: 'Leave empty to never hide.' },
];
