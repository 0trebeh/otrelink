'use client';
import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from './ui';

// Registers the service worker. Only in production builds: in `next dev`
// a service worker would cache hot-reload files and get in the way.
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((err) => console.warn('[otrelink] SW registration failed', err));
  }, []);
  return null;
}

// Captured globally so the button works even if it mounts after the event fired.
let deferredPrompt = null;
const listeners = new Set();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    listeners.forEach((fn) => fn(true));
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    listeners.forEach((fn) => fn(false));
  });
}

/** "Install app" button. Hidden when already installed or not installable. */
export function InstallButton({ className }) {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (standalone) return;
    setAvailable(Boolean(deferredPrompt));
    listeners.add(setAvailable);
    return () => listeners.delete(setAvailable);
  }, []);
  if (!available) return null;
  return (
    <Button
      size="sm"
      className={className}
      onClick={async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        await deferredPrompt.userChoice.catch(() => null);
        deferredPrompt = null;
        setAvailable(false);
      }}
    >
      <Download size={15} /> Install app
    </Button>
  );
}

/** Call on logout so cached user images are dropped. */
export function clearPwaCache() {
  navigator.serviceWorker?.controller?.postMessage('clear-runtime');
}
