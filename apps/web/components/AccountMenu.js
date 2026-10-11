'use client';
// The account button in the dashboard header: initials + name, and a menu with
// everything about the account (the header used to have a button for each).
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserRound, Sparkles, Gift, KeyRound, BookOpen, LogOut, ChevronDown, ReceiptText } from 'lucide-react';
import { api } from '@/lib/client';
import { ThemeMenuItem } from './ThemeToggle';
import { InstallButton, clearPwaCache } from './Pwa';

export const initials = (user) => {
  const src = (user.name || user.email || '?').replace(/@.*/, '').trim();
  const parts = src.split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] || '?') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
};

export function Avatar({ user, size = 32, className = '' }) {
  return (
    <span aria-hidden="true" style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={`inline-grid place-items-center shrink-0 rounded-full bg-accent text-white font-bold tracking-wide ${className}`}>
      {initials(user)}
    </span>
  );
}

export async function logout(router) {
  await api('/api/auth/logout', { method: 'POST' });
  clearPwaCache();
  router.push('/');
  router.refresh();
}

export default function AccountMenu({ user }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    const onDown = (e) => { if (!box.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onDown); };
  }, [open]);

  const item = 'w-full flex items-center gap-3 h-10 px-3 rounded-xl text-[14px] font-medium hover:bg-soft cursor-pointer text-left';
  const close = () => setOpen(false);
  return (
    <div ref={box} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="menu" aria-controls="account-menu"
        className="flex items-center gap-2 h-10 pl-1 pr-2 sm:pr-3 rounded-full hover:bg-panel border border-transparent hover:border-line cursor-pointer">
        <Avatar user={user} />
        <span className="hidden sm:block text-left leading-tight max-w-[12rem]">
          <span className="block text-[13px] font-semibold truncate">{user.name || user.email.split('@')[0]}</span>
          <span className="block text-[11px] text-muted">{user.plan.label}</span>
        </span>
        <ChevronDown size={15} className="text-muted" />
        <span className="sr-only">Account menu</span>
      </button>
      {open && (
        <nav id="account-menu" aria-label="Account" className="absolute right-0 top-12 z-40 w-[min(18rem,calc(100vw-1.5rem))] rounded-2xl bg-panel border border-line shadow-xl p-2">
          <div className="flex items-center gap-3 px-2 pt-1.5 pb-3 mb-1 border-b border-line/70">
            <Avatar user={user} size={38} />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{user.name || user.email.split('@')[0]}</p>
              <p className="text-xs text-muted truncate">{user.email}</p>
            </div>
          </div>
          <Link href="/dashboard/account" className={item} onClick={close}><UserRound size={17} /> Account</Link>
          <Link href="/dashboard/plan" className={item} onClick={close}>
            <Sparkles size={17} /> <span className="flex-1">Plan &amp; billing</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-soft">{user.plan.label}</span>
          </Link>
          {user.billing && <Link href="/dashboard/plan#billing" className={item} onClick={close}><ReceiptText size={17} /> Invoices</Link>}
          <Link href="/dashboard/referrals" className={item} onClick={close}><Gift size={17} /> Invite friends</Link>
          {user.plan.features.api && <Link href="/dashboard/api" className={item} onClick={close}><KeyRound size={17} /> API tokens</Link>}
          <div className="my-1 border-t border-line/70" />
          <ThemeMenuItem className={item} />
          <InstallButton className="!w-full !justify-start !h-10 !px-3 !rounded-xl !text-[14px] !font-medium !border-0 !bg-transparent hover:!bg-soft !gap-3" />
          <Link href="/docs" className={item} onClick={close}><BookOpen size={17} /> Docs</Link>
          <div className="my-1 border-t border-line/70" />
          <button type="button" className={item} onClick={() => { close(); logout(router); }}><LogOut size={17} /> Log out</button>
        </nav>
      )}
    </div>
  );
}
