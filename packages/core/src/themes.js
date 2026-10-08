// Themes are presets: a partial design that is merged on top of the
// current design when the user picks it. The user can keep customizing after.
// To add a theme: append an object with any design keys you want to set.

import { createRegistry } from './util/registry.js';

export const themes = createRegistry('themes', [
  {
    id: 'air', label: 'Air',
    design: {
      wallpaper: { type: 'solid', color: '#eeeef3' },
      buttonStyle: 'fill', buttonColor: '#ffffff', buttonTextColor: '#111111', buttonBorderColor: '#e2e2ea', buttonBorderWidth: 1, buttonRadius: 40,
      buttonShadowColor: '#00000014', titleFont: 'inter', bodyFont: 'inter', titleColor: '#111111', textColor: '#3b3b46',
      socialsColor: '#111111', surfaceColor: '#ffffff', surfaceTextColor: '#111111', headerLayout: 'classic',
    },
  },
  {
    id: 'blocks', label: 'Blocks',
    design: {
      wallpaper: { type: 'solid', color: '#8b2cf5' },
      buttonStyle: 'hard-shadow', buttonColor: '#e14fd9', buttonTextColor: '#ffffff', buttonBorderColor: '#000000', buttonBorderWidth: 2,
      buttonShadowColor: '#000000', buttonRadius: 0, titleFont: 'space-grotesk', bodyFont: 'space-grotesk', titleColor: '#ffffff', textColor: '#f3e8ff',
      socialsColor: '#ffffff', surfaceColor: '#ffffff', surfaceTextColor: '#111111', headerLayout: 'classic',
    },
  },
  {
    id: 'bloom', label: 'Bloom',
    design: {
      wallpaper: { type: 'gradient', kind: 'linear', from: '#a1224f', via: 'transparent', to: '#3b2fbf', angle: 135 },
      buttonStyle: 'outline', buttonColor: '#ffffff', buttonTextColor: '#3b2fbf', buttonBorderColor: '#ffffff', buttonRadius: 40,
      titleFont: 'outfit', bodyFont: 'outfit', titleColor: '#ffffff', textColor: '#f6e9ff', socialsColor: '#ffffff',
      surfaceColor: '#ffffff26', surfaceTextColor: '#ffffff', headerLayout: 'classic',
    },
  },
  {
    id: 'breeze', label: 'Breeze',
    design: {
      wallpaper: { type: 'gradient', kind: 'linear', from: '#f8b4d9', via: '#e9a8f0', to: '#f7c7a3', angle: 160 },
      buttonStyle: 'glass', buttonColor: '#ffffff', buttonTextColor: '#3d2240', buttonBorderColor: '#ffffff', buttonRadius: 18,
      titleFont: 'playfair', bodyFont: 'dm-sans', titleColor: '#3d2240', textColor: '#5b3a5e', socialsColor: '#3d2240',
      surfaceColor: '#ffffff59', surfaceTextColor: '#3d2240', headerLayout: 'classic',
    },
  },
  {
    id: 'lake', label: 'Lake',
    design: {
      wallpaper: { type: 'grain', from: '#2b2f3d', to: '#0f1117', amount: 20 },
      buttonStyle: 'fill', buttonColor: '#1b1e29', buttonTextColor: '#e8eaf2', buttonBorderColor: '#2f3445', buttonBorderWidth: 1, buttonRadius: 10,
      titleFont: 'inter', bodyFont: 'inter', titleColor: '#ffffff', textColor: '#b4b9c9', socialsColor: '#ffffff',
      surfaceColor: '#1b1e29', surfaceTextColor: '#e8eaf2', headerLayout: 'classic',
    },
  },
  {
    id: 'mineral', label: 'Mineral',
    design: {
      wallpaper: { type: 'solid', color: '#fbefe4' },
      buttonStyle: 'outline', buttonColor: '#b59a86', buttonTextColor: '#fbefe4', buttonBorderColor: '#b59a86', buttonRadius: 40,
      titleFont: 'fraunces', bodyFont: 'dm-sans', titleColor: '#4a3426', textColor: '#6b5244', socialsColor: '#4a3426',
      surfaceColor: '#fff8f1', surfaceTextColor: '#4a3426', headerLayout: 'classic',
    },
  },
  {
    id: 'noir', label: 'Noir',
    design: {
      wallpaper: { type: 'solid', color: '#0a0a0a' },
      buttonStyle: 'fill', buttonColor: '#ffffff', buttonTextColor: '#0a0a0a', buttonRadius: 4, buttonBorderWidth: 0,
      titleFont: 'syne', bodyFont: 'inter', titleColor: '#ffffff', textColor: '#a3a3a3', socialsColor: '#ffffff', titleWeight: '800',
      surfaceColor: '#171717', surfaceTextColor: '#f5f5f5', headerLayout: 'left', buttonAlign: 'left', buttonTransform: 'uppercase',
    },
  },
  {
    id: 'aurora', label: 'Aurora',
    design: {
      wallpaper: { type: 'aurora', bg: '#0d0b1f', c1: '#7c3aed', c2: '#06b6d4', c3: '#ec4899', speed: 18 },
      buttonStyle: 'glass', buttonColor: '#ffffff', buttonTextColor: '#ffffff', buttonRadius: 16,
      titleFont: 'unbounded', bodyFont: 'manrope', titleColor: '#ffffff', textColor: '#d6d3f0', socialsColor: '#ffffff',
      surfaceColor: '#ffffff1f', surfaceTextColor: '#ffffff', headerLayout: 'hero',
    },
  },
  {
    id: 'retro', label: 'Retro',
    design: {
      wallpaper: { type: 'pattern', pattern: 'checks', bg: '#ffe066', fg: '#ffd23f', size: 40 },
      buttonStyle: 'hard-shadow', buttonColor: '#ff6b6b', buttonTextColor: '#1b1b1b', buttonBorderColor: '#1b1b1b', buttonBorderWidth: 3,
      buttonShadowColor: '#1b1b1b', buttonRadius: 12, titleFont: 'archivo-black', bodyFont: 'space-mono', titleColor: '#1b1b1b',
      textColor: '#1b1b1b', socialsColor: '#1b1b1b', surfaceColor: '#ffffff', surfaceTextColor: '#1b1b1b', headerLayout: 'classic',
    },
  },
  {
    id: 'neon', label: 'Neon',
    design: {
      wallpaper: { type: 'pattern', pattern: 'grid', bg: '#07070d', fg: '#1a1a2e', size: 28 },
      buttonStyle: 'neon', buttonColor: '#39ff88', buttonTextColor: '#07070d', buttonRadius: 8,
      titleFont: 'press-start', bodyFont: 'jetbrains-mono', titleColor: '#39ff88', textColor: '#b8ffd6', titleSize: 18, socialsColor: '#39ff88',
      surfaceColor: '#0f1a14', surfaceTextColor: '#b8ffd6', headerLayout: 'classic', buttonHover: 'glow',
    },
  },
  {
    id: 'paper', label: 'Paper',
    design: {
      wallpaper: { type: 'pattern', pattern: 'dots', bg: '#fdfbf6', fg: '#e3ddcf', size: 18 },
      buttonStyle: 'underline', buttonColor: '#222222', buttonTextColor: '#fdfbf6', buttonBorderWidth: 1, buttonAlign: 'left',
      titleFont: 'dm-serif', bodyFont: 'lora', titleColor: '#222222', textColor: '#4a4a4a', socialsColor: '#222222', titleSize: 32,
      surfaceColor: '#f4efe4', surfaceTextColor: '#222222', headerLayout: 'left', buttonHover: 'shift',
    },
  },
  {
    id: 'sunset', label: 'Sunset',
    design: {
      wallpaper: { type: 'gradient', kind: 'radial', from: '#ffd194', via: '#ff8a65', to: '#7b2e5c', angle: 0 },
      buttonStyle: 'soft-shadow', buttonColor: '#fff4ea', buttonTextColor: '#7b2e5c', buttonShadowColor: '#7b2e5c55', buttonRadius: 22,
      titleFont: 'bricolage', bodyFont: 'dm-sans', titleColor: '#3a0f2a', textColor: '#4f1a3a', socialsColor: '#3a0f2a',
      surfaceColor: '#fff4eacc', surfaceTextColor: '#3a0f2a', headerLayout: 'classic',
    },
  },
  {
    id: 'cel', label: 'Cel shading',
    // Cartoon look: flat colors, two-tone buttons with a thick ink outline.
    design: {
      wallpaper: { type: 'gradient', kind: 'linear', from: '#7dd3fc', via: 'transparent', to: '#c4b5fd', angle: 180 },
      buttonStyle: 'cel', buttonColor: '#ffd43b', buttonTextColor: '#1a1a1a', buttonBorderColor: '#1a1a1a', buttonBorderWidth: 3,
      buttonShadowColor: '#1a1a1a', buttonRadius: 18, buttonHover: 'shift',
      titleFont: 'rubik', bodyFont: 'rubik', titleWeight: '800', titleColor: '#1a1a1a', textColor: '#23233a', socialsColor: '#1a1a1a',
      surfaceColor: '#ffffff', surfaceTextColor: '#1a1a1a', surfaceRadius: 18, headerLayout: 'classic',
      avatarBorderWidth: 4, avatarBorderColor: '#1a1a1a',
    },
  },
  {
    id: 'punk', label: 'Punk',
    // Black wall, ripped hot-pink flyers and marker titles.
    design: {
      wallpaper: { type: 'pattern', pattern: 'stripes', bg: '#0d0d0d', fg: '#181818', size: 26 },
      buttonStyle: 'punk', buttonColor: '#ff2d95', buttonTextColor: '#0d0d0d', buttonBorderColor: '#f9f871', buttonRadius: 0,
      buttonHover: 'none', buttonTransform: 'uppercase',
      titleFont: 'permanent-marker', bodyFont: 'space-mono', titleWeight: '400', titleSize: 30, titleColor: '#f9f871', textColor: '#e5e5e5',
      socialsColor: '#ff2d95', surfaceColor: '#1a1a1a', surfaceTextColor: '#f5f5f5', surfaceRadius: 0, headerLayout: 'classic',
      avatarShape: 'square', avatarBorderWidth: 3, avatarBorderColor: '#f9f871',
    },
  },
  {
    id: 'art-pop', label: 'Art pop',
    // Comic-book halftones, primary colors and bold outlines.
    design: {
      wallpaper: { type: 'pattern', pattern: 'dots', bg: '#ffde00', fg: '#ff3b7f', size: 16 },
      buttonStyle: 'pop', buttonColor: '#00b4ff', buttonTextColor: '#111111', buttonBorderColor: '#111111', buttonBorderWidth: 3,
      buttonShadowColor: '#ff2d6f', buttonRadius: 6, buttonHover: 'grow', buttonTransform: 'uppercase',
      titleFont: 'bangers', bodyFont: 'poppins', titleWeight: '400', titleSize: 38, titleColor: '#111111', textColor: '#111111',
      socialsColor: '#111111', surfaceColor: '#ffffff', surfaceTextColor: '#111111', surfaceRadius: 6, headerLayout: 'classic',
      avatarBorderWidth: 4, avatarBorderColor: '#111111',
    },
  },
  {
    id: 'dark', label: 'Dark',
    // Clean dark mode: deep grays, soft borders and a violet accent.
    design: {
      wallpaper: { type: 'gradient', kind: 'radial', from: '#1f1f26', via: 'transparent', to: '#09090b', angle: 0 },
      buttonStyle: 'fill', buttonColor: '#1c1c22', buttonTextColor: '#fafafa', buttonBorderColor: '#2f2f38', buttonBorderWidth: 1,
      buttonShadowColor: '#00000066', buttonRadius: 14, buttonHover: 'lift',
      titleFont: 'manrope', bodyFont: 'manrope', titleWeight: '800', titleColor: '#fafafa', textColor: '#a1a1aa', socialsColor: '#c4b5fd',
      surfaceColor: '#17171c', surfaceTextColor: '#e4e4e7', surfaceRadius: 16, headerLayout: 'classic',
      avatarBorderWidth: 2, avatarBorderColor: '#8b5cf6',
    },
  },
  {
    id: '3d', label: '3D',
    // Chunky buttons with depth that press down, on a soft pastel gradient.
    design: {
      wallpaper: { type: 'gradient', kind: 'linear', from: '#a5b4fc', via: '#f0abfc', to: '#fbcfe8', angle: 160 },
      buttonStyle: '3d', buttonColor: '#6366f1', buttonTextColor: '#ffffff', buttonBorderColor: '#4338ca', buttonShadowColor: '#4338ca55',
      buttonRadius: 18, buttonHover: 'none',
      titleFont: 'unbounded', bodyFont: 'rubik', titleWeight: '800', titleColor: '#1e1b4b', textColor: '#312e81', socialsColor: '#1e1b4b',
      surfaceColor: '#ffffffd9', surfaceTextColor: '#1e1b4b', surfaceRadius: 20, headerLayout: 'classic',
      avatarBorderWidth: 4, avatarBorderColor: '#ffffff',
    },
  },
  {
    id: 'ocean', label: 'Ocean',
    // Deep teal water with frosted glass buttons.
    design: {
      wallpaper: { type: 'gradient', kind: 'linear', from: '#0ea5b7', via: '#0b6b8f', to: '#0b2545', angle: 170 },
      buttonStyle: 'glass', buttonColor: '#ffffff', buttonTextColor: '#ffffff', buttonRadius: 14, buttonHover: 'lift',
      titleFont: 'outfit', bodyFont: 'dm-sans', titleWeight: '700', titleColor: '#ffffff', textColor: '#d4f3f7', socialsColor: '#ffffff',
      surfaceColor: '#ffffff21', surfaceTextColor: '#ffffff', surfaceRadius: 16, headerLayout: 'classic',
      avatarBorderWidth: 3, avatarBorderColor: '#7dd3e0',
    },
  },
  {
    id: 'forest', label: 'Forest',
    // Pine green with cream buttons and a bookish serif.
    design: {
      wallpaper: { type: 'grain', from: '#2f4a36', to: '#16261b', amount: 18 },
      buttonStyle: 'fill', buttonColor: '#f3ead3', buttonTextColor: '#1d3324', buttonRadius: 10, buttonBorderWidth: 0, buttonHover: 'lift',
      buttonShadowColor: '#00000040',
      titleFont: 'fraunces', bodyFont: 'lora', titleWeight: '600', titleColor: '#f3ead3', textColor: '#c9d6c4', socialsColor: '#e7c873',
      surfaceColor: '#24392a', surfaceTextColor: '#f3ead3', surfaceRadius: 12, headerLayout: 'classic',
      avatarBorderWidth: 3, avatarBorderColor: '#e7c873',
    },
  },
  {
    id: 'corporate', label: 'Corporate',
    // Calm and professional: slate background, navy buttons, left-aligned header.
    design: {
      wallpaper: { type: 'gradient', kind: 'linear', from: '#f8fafc', via: 'transparent', to: '#e2e8f0', angle: 180 },
      buttonStyle: 'fill', buttonColor: '#0f2a4a', buttonTextColor: '#ffffff', buttonBorderWidth: 0, buttonRadius: 10, buttonHover: 'lift',
      buttonShadowColor: '#0f2a4a33',
      titleFont: 'manrope', bodyFont: 'inter', titleWeight: '800', titleColor: '#0f172a', textColor: '#475569', socialsColor: '#0f2a4a',
      surfaceColor: '#ffffff', surfaceTextColor: '#0f172a', surfaceRadius: 12, headerLayout: 'left', avatarShape: 'rounded',
    },
  },
  {
    id: 'candy', label: 'Candy',
    // Pastel pink and mint, round sticker buttons.
    design: {
      wallpaper: { type: 'pattern', pattern: 'dots', bg: '#ffe4ef', fg: '#ffc2da', size: 22 },
      buttonStyle: 'sticker', buttonColor: '#ff7eb6', buttonTextColor: '#ffffff', buttonShadowColor: '#ff7eb666', buttonRadius: 40, buttonHover: 'grow',
      titleFont: 'pacifico', bodyFont: 'poppins', titleWeight: '400', titleSize: 34, titleColor: '#d6336c', textColor: '#7a2e52', socialsColor: '#d6336c',
      surfaceColor: '#ffffff', surfaceTextColor: '#5c2140', surfaceRadius: 22, headerLayout: 'classic',
      avatarBorderWidth: 4, avatarBorderColor: '#9ef0d0',
    },
  },
  {
    id: 'luxe', label: 'Luxe',
    // Black and gold, double-line buttons and an elegant serif.
    design: {
      wallpaper: { type: 'gradient', kind: 'radial', from: '#26211a', via: 'transparent', to: '#0b0a08', angle: 0 },
      buttonStyle: 'double', buttonColor: '#0b0a08', buttonTextColor: '#e9c77b', buttonBorderColor: '#c9a24d', buttonBorderWidth: 1, buttonRadius: 2,
      buttonHover: 'dim', buttonTransform: 'uppercase',
      titleFont: 'playfair', bodyFont: 'dm-sans', titleWeight: '600', titleColor: '#e9c77b', textColor: '#bfb5a3', socialsColor: '#c9a24d',
      surfaceColor: '#15130f', surfaceTextColor: '#efe6d2', surfaceRadius: 4, headerLayout: 'classic',
      avatarBorderWidth: 2, avatarBorderColor: '#c9a24d',
    },
  },
  {
    id: 'mono', label: 'Mono',
    // Editorial black and white: dashed buttons on a fine grid.
    design: {
      wallpaper: { type: 'pattern', pattern: 'grid', bg: '#ffffff', fg: '#efefef', size: 24 },
      buttonStyle: 'dashed', buttonColor: '#111111', buttonTextColor: '#ffffff', buttonBorderWidth: 2, buttonRadius: 0, buttonHover: 'shift',
      buttonAlign: 'left', buttonTransform: 'uppercase',
      titleFont: 'space-grotesk', bodyFont: 'jetbrains-mono', titleWeight: '700', titleColor: '#111111', textColor: '#444444', socialsColor: '#111111',
      surfaceColor: '#f6f6f6', surfaceTextColor: '#111111', surfaceRadius: 0, headerLayout: 'left', avatarShape: 'square',
    },
  },
  {
    id: 'citrus', label: 'Citrus',
    // Juicy orange to lime gradient with gradient buttons.
    design: {
      wallpaper: { type: 'gradient', kind: 'linear', from: '#fff3c4', via: '#ffd6a5', to: '#d9f99d', angle: 150 },
      buttonStyle: 'gradient', buttonColor: '#ff6b35', buttonBorderColor: '#f7b801', buttonTextColor: '#ffffff', buttonRadius: 16, buttonHover: 'grow',
      buttonShadowColor: '#ff6b3540',
      titleFont: 'bricolage', bodyFont: 'outfit', titleWeight: '800', titleColor: '#3d1f00', textColor: '#5c3a12', socialsColor: '#e85d04',
      surfaceColor: '#ffffffcc', surfaceTextColor: '#3d1f00', surfaceRadius: 18, headerLayout: 'classic',
      avatarBorderWidth: 4, avatarBorderColor: '#ffffff',
    },
  },
]);
