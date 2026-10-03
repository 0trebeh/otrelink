import { esc, safeUrl } from '../util/html.js';
import { frame } from './_shared.js';

export function parseVideo(url) {
  const u = String(url || '');
  let m = u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
  if (m) return { provider: 'youtube', src: `https://www.youtube-nocookie.com/embed/${m[1]}`, vertical: /shorts\//.test(u) };
  m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (m) return { provider: 'vimeo', src: `https://player.vimeo.com/video/${m[1]}` };
  m = u.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/);
  if (m) return { provider: 'tiktok', src: `https://www.tiktok.com/embed/v2/${m[1]}`, vertical: true };
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(u)) return { provider: 'file', src: u };
  return null;
}

export default {
  type: 'video',
  label: 'Video',
  description: 'YouTube, Vimeo, TikTok or a video file.',
  icon: 'video',
  category: 'Media',
  cssClasses: [
    { selector: '.ol-frame', description: 'YouTube / Vimeo / TikTok embed' },
    { selector: '.ol-video', description: 'Native player for .mp4/.webm files' },
  ],
  fields: [
    { key: 'url', type: 'url', label: 'Video URL', required: true, placeholder: 'https://youtube.com/watch?v=…' },
    { key: 'title', type: 'text', label: 'Title (optional)' },
  ],
  summary: (d) => d.title || d.url,
  render(d) {
    const v = parseVideo(d.url);
    const title = d.title ? `<p class="ol-embed-title">${esc(d.title)}</p>` : '';
    if (!v) return `${title}<div class="ol-card">Unsupported video URL</div>`;
    if (v.provider === 'file') {
      return `${title}<video class="ol-video" src="${esc(safeUrl(v.src))}" controls playsinline preload="metadata"></video>`;
    }
    return title + frame(v.src, { ratio: v.vertical ? '9 / 16' : '16 / 9', title: d.title || 'Video', allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share' });
  },
  css: `.ol-root .ol-video{width:100%;border-radius:var(--ol-surface-radius);display:block;background:#000}`,
};
