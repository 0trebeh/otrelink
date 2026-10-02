'use client';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export const cx = (...c) => c.filter(Boolean).join(' ');

export function Button({ variant = 'secondary', size = 'md', className, ...props }) {
  const v = {
    primary: 'bg-accent text-white hover:bg-accent-ink disabled:opacity-50',
    secondary: 'bg-panel text-ink border border-line hover:border-ink/30 disabled:opacity-50',
    ghost: 'text-ink hover:bg-soft disabled:opacity-40',
    danger: 'bg-panel text-danger border border-danger/30 hover:bg-danger hover:text-white',
    dark: 'bg-ink text-white hover:bg-black disabled:opacity-50',
  }[variant];
  const s = { sm: 'h-8 px-3 text-[13px] gap-1.5', md: 'h-10 px-4 text-sm gap-2', lg: 'h-12 px-6 text-[15px] gap-2' }[size];
  return <button type="button" className={cx('inline-flex items-center justify-center rounded-full font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed', v, s, className)} {...props} />;
}

export function IconButton({ label, className, ...props }) {
  return <button type="button" aria-label={label} title={label} className={cx('inline-grid place-items-center size-8 rounded-full text-muted hover:text-ink hover:bg-soft transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default', className)} {...props} />;
}

export function Input({ className, ...props }) {
  return <input className={cx('w-full h-10 rounded-xl border border-line bg-panel px-3 text-sm placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-3 focus:ring-accent/15', className)} {...props} />;
}

export function Textarea({ className, ...props }) {
  return <textarea className={cx('w-full min-h-24 rounded-xl border border-line bg-panel px-3 py-2.5 text-sm placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-3 focus:ring-accent/15 resize-y', className)} {...props} />;
}

export function Select({ className, children, ...props }) {
  return (
    <select className={cx('w-full h-10 rounded-xl border border-line bg-panel px-3 text-sm focus:border-accent focus:outline-none focus:ring-3 focus:ring-accent/15 cursor-pointer', className)} {...props}>
      {children}
    </select>
  );
}

export function Toggle({ checked, onChange, label, size = 'md' }) {
  const s = size === 'sm' ? 'w-9 h-5' : 'w-11 h-6';
  const k = size === 'sm' ? 'size-4 data-[on=true]:translate-x-4' : 'size-5 data-[on=true]:translate-x-5';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={Boolean(checked)}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx('relative shrink-0 rounded-full transition-colors cursor-pointer', s, checked ? 'bg-teal' : 'bg-line')}
    >
      <span data-on={Boolean(checked)} className={cx('absolute top-0.5 left-0.5 rounded-full bg-white shadow transition-transform', k)} />
    </button>
  );
}

export function Panel({ title, description, actions, children, className }) {
  return (
    <section className={cx('rounded-3xl bg-panel border border-line/70 p-5 sm:p-6', className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-4 mb-4">
          <div>
            {title && <h2 className="font-display text-lg font-bold tracking-tight">{title}</h2>}
            {description && <p className="text-sm text-muted mt-0.5">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

export function Modal({ open, onClose, title, children, wide }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 backdrop-blur-[2px] p-0 sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className={cx('bg-panel w-full rounded-t-3xl sm:rounded-3xl max-h-[88vh] flex flex-col outline-none', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}>
        <header className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="font-display text-xl font-bold tracking-tight">{title}</h2>
          <IconButton label="Close" onClick={onClose}><X size={18} /></IconButton>
        </header>
        <div className="overflow-y-auto px-6 pb-6">{children}</div>
      </div>
    </div>
  );
}

/** Inline SVG from the core icon set (trusted, ships with the code). */
export function CoreIcon({ svg, className }) {
  return <span className={cx('inline-grid place-items-center', className)} dangerouslySetInnerHTML={{ __html: svg }} />;
}

export function Logo({ className }) {
  return (
    <span className={cx('font-display font-extrabold tracking-tight text-xl inline-flex items-center gap-1.5', className)}>
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="7" fill="#7a2cf0" />
        <path d="M8.5 12.5a3 3 0 0 0 4.4.3l1.8-1.8a3 3 0 0 0-4.2-4.2l-.6.6M15.5 11.5a3 3 0 0 0-4.4-.3l-1.8 1.8a3 3 0 0 0 4.2 4.2l.6-.6" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      otrelink
    </span>
  );
}
