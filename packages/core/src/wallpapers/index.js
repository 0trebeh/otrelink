// Wallpaper (page background) registry.
// Each wallpaper module: { id, label, fields, css(values, selector), html?(values) }
// To add one: create a file in this folder and add it to the list below.

import { createRegistry } from '../util/registry.js';
import solid from './solid.js';
import gradient from './gradient.js';
import image from './image.js';
import pattern from './pattern.js';
import aurora from './aurora.js';
import grain from './grain.js';
import video from './video.js';

export const wallpapers = createRegistry('wallpapers', [
  solid,
  gradient,
  image,
  pattern,
  aurora,
  grain,
  video,
]);
