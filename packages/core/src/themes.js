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
]);
