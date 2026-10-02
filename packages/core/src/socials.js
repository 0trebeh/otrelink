// Social platforms shown as icons under the profile.
// To add a platform: add an entry to `platforms`. To remove: delete it.
// Brand icon paths come from simple-icons (CC0).

import {
  siInstagram, siTiktok, siX, siYoutube, siFacebook, siThreads, siBluesky, siTwitch, siKick,
  siDiscord, siSpotify, siApplemusic, siSoundcloud, siBandcamp, siGithub, siTelegram,
  siWhatsapp, siSignal, siPinterest, siSnapchat, siReddit, siMastodon, siTumblr, siBehance,
  siDribbble, siPatreon, siKofi, siBuymeacoffee, siSubstack, siMedium, siVimeo, siPaypal,
  siCashapp, siEtsy, siSteam,
} from 'simple-icons';
import { iconPaths } from './icons.js';
import { createRegistry } from './util/registry.js';

const brand = (id, si, placeholder) => ({ id, label: si.title, path: si.path, color: `#${si.hex}`, placeholder });
const generic = (id, label, iconName, placeholder) => ({ id, label, stroke: iconPaths[iconName], color: '#555555', placeholder });

export const platforms = [
  brand('instagram', siInstagram, 'https://instagram.com/username'),
  brand('tiktok', siTiktok, 'https://tiktok.com/@username'),
  brand('x', siX, 'https://x.com/username'),
  brand('youtube', siYoutube, 'https://youtube.com/@channel'),
  brand('facebook', siFacebook, 'https://facebook.com/username'),
  brand('threads', siThreads, 'https://threads.net/@username'),
  brand('bluesky', siBluesky, 'https://bsky.app/profile/you.bsky.social'),
  generic('linkedin', 'LinkedIn', 'briefcase', 'https://linkedin.com/in/username'),
  brand('twitch', siTwitch, 'https://twitch.tv/username'),
  brand('kick', siKick, 'https://kick.com/username'),
  brand('discord', siDiscord, 'https://discord.gg/invite'),
  brand('spotify', siSpotify, 'https://open.spotify.com/artist/…'),
  brand('applemusic', siApplemusic, 'https://music.apple.com/…'),
  brand('soundcloud', siSoundcloud, 'https://soundcloud.com/username'),
  brand('bandcamp', siBandcamp, 'https://username.bandcamp.com'),
  brand('github', siGithub, 'https://github.com/username'),
  brand('telegram', siTelegram, 'https://t.me/username'),
  brand('whatsapp', siWhatsapp, 'https://wa.me/15551234567'),
  brand('signal', siSignal, 'https://signal.me/#p/+15551234567'),
  brand('pinterest', siPinterest, 'https://pinterest.com/username'),
  brand('snapchat', siSnapchat, 'https://snapchat.com/add/username'),
  brand('reddit', siReddit, 'https://reddit.com/u/username'),
  brand('mastodon', siMastodon, 'https://mastodon.social/@username'),
  brand('tumblr', siTumblr, 'https://username.tumblr.com'),
  brand('behance', siBehance, 'https://behance.net/username'),
  brand('dribbble', siDribbble, 'https://dribbble.com/username'),
  brand('patreon', siPatreon, 'https://patreon.com/username'),
  brand('kofi', siKofi, 'https://ko-fi.com/username'),
  brand('buymeacoffee', siBuymeacoffee, 'https://buymeacoffee.com/username'),
  brand('substack', siSubstack, 'https://username.substack.com'),
  brand('medium', siMedium, 'https://medium.com/@username'),
  brand('vimeo', siVimeo, 'https://vimeo.com/username'),
  brand('paypal', siPaypal, 'https://paypal.me/username'),
  brand('cashapp', siCashapp, 'https://cash.app/$username'),
  brand('etsy', siEtsy, 'https://etsy.com/shop/name'),
  brand('steam', siSteam, 'https://steamcommunity.com/id/username'),
  generic('email', 'Email', 'mail', 'you@example.com'),
  generic('phone', 'Phone', 'phone', '+1 555 123 4567'),
  generic('website', 'Website', 'globe', 'https://example.com'),
];

export const socials = createRegistry('socials', platforms);

/** Full SVG for a platform, filled with currentColor. */
export function socialIcon(platformId, size = 24) {
  const p = socials.resolve(platformId);
  if (p.stroke) {
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p.stroke}</svg>`;
  }
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true"><path d="${p.path}"/></svg>`;
}

/** Turn what the user typed into a usable href for the platform. */
export function socialHref(platformId, value) {
  const v = String(value || '').trim();
  if (!v) return '';
  if (platformId === 'email') return v.startsWith('mailto:') ? v : `mailto:${v}`;
  if (platformId === 'phone') return v.startsWith('tel:') ? v : `tel:${v.replace(/[^\d+]/g, '')}`;
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v.replace(/^\/+/, '')}`;
}
