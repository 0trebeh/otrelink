'use client';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { IconButton } from './ui';

// Dashboard light / dark mode. Saved on this browser only (localStorage).
// The page you edit and its preview keep their own colors.
export const THEME_KEY = 'ol-dashboard-theme';
const CANVAS = { light: '#edeef1', dark: '#0f0f13' };

export function readTheme() {
  try { return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'; } catch { return 'light'; }
}

export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') root.dataset.theme = 'dark';
  else delete root.dataset.theme;
  // Browser bar color (mobile, installed app).
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', CANVAS[theme] || CANVAS.light));
}

/** Applies the saved theme while the dashboard is open (landing and docs stay light). */
export function DashboardTheme() {
  useEffect(() => {
    applyTheme(readTheme());
    const onStorage = (e) => { if (e.key === THEME_KEY) applyTheme(readTheme()); }; // other tabs
    window.addEventListener('storage', onStorage);
    return () => { window.removeEventListener('storage', onStorage); applyTheme('light'); };
  }, []);
  return null;
}

export default function ThemeToggle({ className }) {
  const [theme, setTheme] = useState('light');
  useEffect(() => setTheme(readTheme()), []);
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(THEME_KEY, next); } catch { /* private mode: still switch for now */ }
    applyTheme(next);
    setTheme(next);
  };
  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  return (
    <IconButton label={label} onClick={toggle} className={className} aria-pressed={theme === 'dark'}>
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </IconButton>
  );
}
