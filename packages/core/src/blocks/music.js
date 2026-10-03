import { esc } from '../util/html.js';
import { frame } from './_shared.js';

export function parseMusic(url, compact) {
  const u = String(url || '');
  let m = u.match(/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(track|album|playlist|artist|episode|show)\/([A-Za-z0-9]+)/);
  if (m) return { src: `https://open.spotify.com/embed/${m[1]}/${m[2]}`, height: compact || m[1] === 'track' || m[1] === 'episode' ? 152 : 352 };
  if (/soundcloud\.com\//.test(u)) {
    return { src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(u)}&visual=${compact ? 'false' : 'true'}`, height: compact ? 166 : 300 };
  }
  m = u.match(/music\.apple\.com\/(.+)/);
  if (m) return { src: `https://embed.music.apple.com/${m[1]}`, height: /[?&]i=/.test(u) || compact ? 175 : 450 };
  return null;
}

export default {
  type: 'music',
  label: 'Music',
  description: 'Spotify, SoundCloud or Apple Music player.',
  icon: 'music',
  category: 'Media',
  cssClasses: [
    { selector: '.ol-frame', description: 'Spotify / SoundCloud / Apple Music embed' },
  ],
  fields: [
    { key: 'url', type: 'url', label: 'Song, album or playlist URL', required: true, placeholder: 'https://open.spotify.com/track/…' },
    { key: 'compact', type: 'toggle', label: 'Compact player', default: true },
  ],
  summary: (d) => d.url,
  render(d) {
    const m = parseMusic(d.url, d.compact);
    if (!m) return '<div class="ol-card">Unsupported music URL</div>';
    return frame(m.src, { height: m.height, title: 'Music player', allow: 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture' });
  },
};
