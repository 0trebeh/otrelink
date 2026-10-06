// Fonts available in the Style panel. `google` is the Google Fonts family spec
// (omit for system fonts). To add a font: append an entry.

import { createRegistry } from './util/registry.js';

export const fonts = createRegistry('fonts', [
  { id: 'inter', label: 'Inter', stack: "'Inter', system-ui, sans-serif", google: 'Inter:wght@400;500;600;700;800', category: 'Sans' },
  { id: 'system', label: 'System UI', stack: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", category: 'Sans' },
  { id: 'dm-sans', label: 'DM Sans', stack: "'DM Sans', sans-serif", google: 'DM+Sans:wght@400;500;700', category: 'Sans' },
  { id: 'poppins', label: 'Poppins', stack: "'Poppins', sans-serif", google: 'Poppins:wght@400;500;600;700;800', category: 'Sans' },
  { id: 'manrope', label: 'Manrope', stack: "'Manrope', sans-serif", google: 'Manrope:wght@400;500;700;800', category: 'Sans' },
  { id: 'space-grotesk', label: 'Space Grotesk', stack: "'Space Grotesk', sans-serif", google: 'Space+Grotesk:wght@400;500;700', category: 'Sans' },
  { id: 'outfit', label: 'Outfit', stack: "'Outfit', sans-serif", google: 'Outfit:wght@400;500;700;800', category: 'Sans' },
  { id: 'syne', label: 'Syne', stack: "'Syne', sans-serif", google: 'Syne:wght@400;600;700;800', category: 'Display' },
  { id: 'bricolage', label: 'Bricolage Grotesque', stack: "'Bricolage Grotesque', sans-serif", google: 'Bricolage+Grotesque:wght@400;600;800', category: 'Display' },
  { id: 'unbounded', label: 'Unbounded', stack: "'Unbounded', sans-serif", google: 'Unbounded:wght@400;600;800', category: 'Display' },
  { id: 'archivo-black', label: 'Archivo Black', stack: "'Archivo Black', sans-serif", google: 'Archivo+Black', category: 'Display' },
  { id: 'playfair', label: 'Playfair Display', stack: "'Playfair Display', serif", google: 'Playfair+Display:wght@400;600;800', category: 'Serif' },
  { id: 'dm-serif', label: 'DM Serif Display', stack: "'DM Serif Display', serif", google: 'DM+Serif+Display', category: 'Serif' },
  { id: 'fraunces', label: 'Fraunces', stack: "'Fraunces', serif", google: 'Fraunces:wght@400;600;800', category: 'Serif' },
  { id: 'roboto-slab', label: 'Roboto Slab', stack: "'Roboto Slab', serif", google: 'Roboto+Slab:wght@400;600;800', category: 'Serif' },
  { id: 'lora', label: 'Lora', stack: "'Lora', serif", google: 'Lora:wght@400;600;700', category: 'Serif' },
  { id: 'jetbrains-mono', label: 'JetBrains Mono', stack: "'JetBrains Mono', monospace", google: 'JetBrains+Mono:wght@400;600;800', category: 'Mono' },
  { id: 'space-mono', label: 'Space Mono', stack: "'Space Mono', monospace", google: 'Space+Mono:wght@400;700', category: 'Mono' },
  { id: 'caveat', label: 'Caveat', stack: "'Caveat', cursive", google: 'Caveat:wght@400;700', category: 'Handwriting' },
  { id: 'pacifico', label: 'Pacifico', stack: "'Pacifico', cursive", google: 'Pacifico', category: 'Handwriting' },
  { id: 'bangers', label: 'Bangers', stack: "'Bangers', 'Impact', sans-serif", google: 'Bangers', category: 'Display' },
  { id: 'permanent-marker', label: 'Permanent Marker', stack: "'Permanent Marker', cursive", google: 'Permanent+Marker', category: 'Handwriting' },
  { id: 'rubik', label: 'Rubik', stack: "'Rubik', sans-serif", google: 'Rubik:wght@400;500;700;800;900', category: 'Sans' },
  { id: 'press-start', label: 'Press Start 2P', stack: "'Press Start 2P', monospace", google: 'Press+Start+2P', category: 'Display' },
]);

/** Google Fonts stylesheet URL for a set of font ids (or '' if none needed). */
export function googleFontsHref(ids) {
  const families = [...new Set(ids)].map((id) => fonts.get(id)?.google).filter(Boolean);
  if (!families.length) return '';
  return `https://fonts.googleapis.com/css2?${families.map((f) => `family=${f}`).join('&')}&display=swap`;
}
