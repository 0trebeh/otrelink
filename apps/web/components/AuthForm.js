'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { api, errorMessage } from '@/lib/client';
import { Button, Input, Logo } from './ui';

export default function AuthForm({ mode, pageUrl }) {
  const router = useRouter();
  const isRegister = mode === 'register';
  const [form, setForm] = useState({ email: '', password: '', name: '', slug: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [slugState, setSlugState] = useState(null);
  const up = (k) => (e) => setForm((f) => ({ ...f, [k]: k === 'slug' ? e.target.value.toLowerCase().replace(/\s/g, '') : e.target.value }));

  useEffect(() => {
    if (!isRegister || form.slug.length < 3) return setSlugState(null);
    const t = setTimeout(() => api(`/api/slug-check?slug=${encodeURIComponent(form.slug)}`).then((r) => setSlugState(r.available ? 'ok' : r.reason)).catch(() => {}), 350);
    return () => clearTimeout(t);
  }, [form.slug, isRegister]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const r = await api(`/api/auth/${mode}`, { method: 'POST', body: form });
      router.push(r.pageId ? `/dashboard/${r.pageId}` : '/dashboard');
      router.refresh();
    } catch (e2) {
      setErr(errorMessage(e2));
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen grid place-items-center p-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-block mb-8"><Logo /></Link>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">{isRegister ? 'Claim your link' : 'Welcome back'}</h1>
        <p className="text-muted mt-1 mb-6">{isRegister ? 'Free, and ready in under a minute.' : 'Log in to edit your pages.'}</p>
        <form onSubmit={submit} className="space-y-3">
          {isRegister && (
            <div>
              <div className="flex items-center rounded-xl border border-line focus-within:border-accent bg-panel overflow-hidden">
                <span className="pl-3 text-sm text-muted whitespace-nowrap">{pageUrl.replace(/^https?:\/\//, '')}/</span>
                <input required aria-label="Username" placeholder="yourname" value={form.slug} onChange={up('slug')} className="flex-1 h-11 px-1 text-sm outline-none bg-transparent min-w-0" autoFocus />
              </div>
              {slugState && slugState !== 'ok' && <p className="text-xs text-danger mt-1">{slugState === 'taken' ? 'That username is taken.' : '3–30 letters, numbers, dots, dashes or underscores.'}</p>}
              {slugState === 'ok' && <p className="text-xs text-teal mt-1">Available</p>}
            </div>
          )}
          {isRegister && <Input aria-label="Display name" placeholder="Display name" value={form.name} onChange={up('name')} className="h-11" />}
          <Input required type="email" aria-label="Email" placeholder="Email" autoComplete="email" value={form.email} onChange={up('email')} className="h-11" autoFocus={!isRegister} />
          <Input required type="password" aria-label="Password" placeholder={isRegister ? 'Password (8+ characters)' : 'Password'} minLength={isRegister ? 8 : undefined} autoComplete={isRegister ? 'new-password' : 'current-password'} value={form.password} onChange={up('password')} className="h-11" />
          {err && <p className="text-sm text-danger" role="alert">{err}</p>}
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>
            {busy && <Loader2 size={17} className="animate-spin" />} {isRegister ? 'Create account' : 'Log in'}
          </Button>
        </form>
        <p className="text-sm text-muted mt-6 text-center">
          {isRegister ? 'Already have an account? ' : 'New to Otrelink? '}
          <Link href={isRegister ? '/login' : '/register'} className="font-semibold text-accent-ink underline underline-offset-2">{isRegister ? 'Log in' : 'Create an account'}</Link>
        </p>
      </div>
    </main>
  );
}
