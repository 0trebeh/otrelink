'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, KeyRound, Plus, Copy, Check, Trash2, Loader2, Lock, Mail, ShieldCheck, Eye, PenLine } from 'lucide-react';
import { api, errorMessage } from '@/lib/client';
import ThemeToggle from './ThemeToggle';
import { Button, Input, Select, Logo, Modal, cx } from './ui';

const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString([], { dateStyle: 'medium' }) : '');
const ago = (iso) => {
  if (!iso) return 'Never used';
  const s = Math.round((Date.now() - Date.parse(iso)) / 1000);
  if (s < 90) return 'Used just now';
  if (s < 5400) return `Used ${Math.round(s / 60)} min ago`;
  if (s < 129600) return `Used ${Math.round(s / 3600)} h ago`;
  return `Used ${fmt(iso)}`;
};

function CopyButton({ text, label = 'Copy' }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1600); } catch { /* the text stays selectable */ }
  };
  return <Button size="sm" onClick={copy}>{done ? <Check size={14} /> : <Copy size={14} />} {done ? 'Copied' : label}</Button>;
}

export default function ApiTokensPage({ user, origin, routes, expiryDays, rateLimit, max }) {
  const allowed = Boolean(user.plan.features.api);
  const [tokens, setTokens] = useState(null);
  const [err, setErr] = useState('');
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(null); // { token, info } — shown once
  const [busy, setBusy] = useState('');

  const load = () => api('/api/tokens').then((r) => setTokens(r.tokens)).catch((e) => { setErr(errorMessage(e)); setTokens([]); });
  useEffect(() => { load(); }, []);

  const revoke = async (t) => {
    if (!window.confirm(`Revoke “${t.name}”? Apps using it stop working right away.`)) return;
    setBusy(t.id); setErr('');
    try { await api(`/api/tokens/${t.id}`, { method: 'DELETE' }); await load(); } catch (e) { setErr(errorMessage(e)); }
    setBusy('');
  };

  const mcpUrl = `${origin}/api/mcp`;
  const mcpHeader = `Authorization: Bearer ${created?.token || 'otl_YOUR_TOKEN'}`;
  const example = `curl ${origin}/api/pages \\\n  -H "Authorization: Bearer ${created?.token || 'otl_YOUR_TOKEN'}"`;
  const mcpConfig = JSON.stringify({
    mcpServers: {
      otrelink: {
        command: 'node',
        args: ['C:\\path\\to\\Otrelink\\packages\\mcp\\src\\index.js'],
        env: { OTRELINK_URL: origin, OTRELINK_TOKEN: created?.token || 'otl_YOUR_TOKEN' },
      },
    },
  }, null, 2);

  return (
    <div className="min-h-screen">
      <header className="flex items-center gap-3 h-16 px-4 sm:px-8">
        <Link href="/dashboard" className="inline-grid place-items-center size-9 rounded-full hover:bg-panel" aria-label="Back to my pages"><ArrowLeft size={19} /></Link>
        <Logo />
        <ThemeToggle className="ml-auto" />
      </header>
      <main className="max-w-3xl mx-auto px-4 sm:px-8 pb-16">
        <div className="flex flex-wrap items-end justify-between gap-4 mt-4">
          <div>
            <h1 className="font-display text-4xl font-extrabold tracking-tight">API tokens</h1>
            <p className="text-muted mt-1 max-w-[56ch]">Let your own scripts, automations or an AI assistant (MCP) create and edit your pages, as you.</p>
          </div>
          {allowed && tokens && (
            <Button variant="primary" onClick={() => setCreating(true)} disabled={tokens.length >= max}><Plus size={17} /> New token</Button>
          )}
        </div>

        {err && <p className="mt-5 rounded-2xl bg-danger/10 text-danger px-4 py-3 text-sm" role="alert">{err}</p>}

        {!allowed && (
          <section className="mt-8 rounded-3xl bg-panel border border-line/70 p-6 flex gap-4 items-start">
            <span className="inline-grid place-items-center size-11 rounded-2xl bg-accent-soft text-accent-ink shrink-0"><Lock size={20} /></span>
            <div className="flex-1">
              <h2 className="font-display text-lg font-bold">Available on the Business plan</h2>
              <p className="text-sm text-muted mt-1">API tokens let tools act on your pages without your password. Contact us to move to Business{user.plan.id === 'business' ? ' or to turn API access on for your account' : ''}.</p>
              <Link href="/dashboard/plan" className="mt-4 inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-semibold bg-ink text-white hover:bg-black"><Mail size={16} /> See plans</Link>
            </div>
          </section>
        )}

        {created && (
          <section className="mt-8 rounded-3xl border-2 border-teal/60 bg-teal/5 p-5" aria-live="polite">
            <p className="font-semibold flex items-center gap-2"><ShieldCheck size={18} className="text-teal" /> Copy your new token now</p>
            <p className="text-sm text-muted mt-1">For your security it won&apos;t be shown again. Store it like a password.</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <code className="flex-1 min-w-0 break-all rounded-xl bg-panel border border-line px-3 py-2.5 text-[13px] font-mono select-all">{created.token}</code>
              <CopyButton text={created.token} />
            </div>
            <Button size="sm" variant="ghost" className="mt-3" onClick={() => setCreated(null)}>I saved it</Button>
          </section>
        )}

        {(allowed || tokens?.length > 0) && (
          <section className="mt-8 rounded-3xl bg-panel border border-line/70">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="font-display text-lg font-bold tracking-tight flex items-center gap-2"><KeyRound size={18} /> Your tokens</h2>
              {tokens && <span className="text-xs text-muted">{tokens.length} of {max}</span>}
            </div>
            {!tokens ? (
              <p className="px-5 pb-5 text-sm text-muted inline-flex items-center gap-2"><Loader2 size={15} className="animate-spin" /> Loading…</p>
            ) : tokens.length === 0 ? (
              <p className="px-5 pb-6 text-sm text-muted">No tokens yet. Create one to connect an app.</p>
            ) : (
              <ul className="divide-y divide-line/70 border-t border-line/70">
                {tokens.map((t) => (
                  <li key={t.id} className="px-5 py-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="flex-1 min-w-[12rem]">
                      <p className="font-semibold flex flex-wrap items-center gap-2">
                        {t.name}
                        <span className={cx('text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full inline-flex items-center gap-1', t.scope === 'write' ? 'bg-accent-soft text-accent-ink' : 'bg-soft text-muted')}>
                          {t.scope === 'write' ? <PenLine size={11} /> : <Eye size={11} />} {t.scope === 'write' ? 'Read & write' : 'Read only'}
                        </span>
                        {t.expired && <span className="text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-danger/10 text-danger">Expired</span>}
                      </p>
                      <p className="text-xs text-muted mt-1 font-mono">{t.hint}</p>
                      <p className="text-xs text-muted mt-0.5">
                        Created {fmt(t.createdAt)} · {ago(t.lastUsedAt)} · {t.expiresAt ? `${t.expired ? 'Expired' : 'Expires'} ${fmt(t.expiresAt)}` : 'Never expires'}
                      </p>
                    </div>
                    <Button size="sm" variant="danger" onClick={() => revoke(t)} disabled={busy === t.id}>
                      {busy === t.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Revoke
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {allowed && (
          <section className="mt-8 rounded-3xl bg-panel border border-line/70 p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold tracking-tight">How to use it</h2>
            <p className="text-sm text-muted mt-1">Send the token in the <code className="font-mono text-ink">Authorization</code> header. It acts as you, with your plan&apos;s limits.</p>
            <div className="mt-3 relative">
              <pre className="rounded-2xl code-surface text-[12.5px] font-mono p-4 pt-12 sm:pt-4 sm:pr-28 overflow-x-auto"><code>{example}</code></pre>
              <div className="absolute top-2 right-2"><CopyButton text={example} label="Copy" /></div>
            </div>
            <h3 className="font-semibold mt-5 text-sm">Connect an AI assistant (MCP)</h3>
            <p className="text-sm text-muted mt-1">Claude Desktop, Claude Code or Cursor can build and edit your pages for you with the Otrelink MCP server (<code className="font-mono text-ink">packages/mcp</code>). Add this to your assistant&apos;s MCP settings (in Claude Desktop: Settings → Developer → Edit Config) and restart it. See <a href="/docs#mcp" className="underline">the docs</a>.</p>
            <div className="mt-3 relative">
              <pre className="rounded-2xl code-surface text-[12.5px] font-mono p-4 pt-12 sm:pt-4 sm:pr-28 overflow-x-auto"><code>{mcpConfig}</code></pre>
              <div className="absolute top-2 right-2"><CopyButton text={mcpConfig} label="Copy" /></div>
            </div>
            <h3 className="font-semibold mt-5 text-sm">From claude.ai or your phone (remote MCP)</h3>
            <p className="text-sm text-muted mt-1">Nothing to install: in claude.ai go to <i>Customize → Connectors → Add custom connector</i>, paste this URL, choose <i>No sign in</i> and add the request header below. It then works in the Claude apps on any device.</p>
            <div className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-2">
              {[['URL', mcpUrl], ['Request header', mcpHeader]].map(([label, value]) => (
                <div key={label} className="min-w-0 flex flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-1 rounded-2xl code-surface px-4 py-2.5">
                  <span className="text-[11px] uppercase tracking-wide opacity-70 w-full sm:w-28 shrink-0">{label}</span>
                  <code className="font-mono text-[12.5px] flex-1 min-w-0 truncate">{value}</code>
                  <CopyButton text={value} label="Copy" />
                </div>
              ))}
            </div>
            <h3 className="font-semibold mt-5 text-sm">What a token can do</h3>
            <ul className="mt-2 grid gap-1 text-[13px] font-mono">
              {routes.map((r) => <li key={r} className="rounded-lg bg-soft px-3 py-1.5">{r}</li>)}
            </ul>
            <ul className="mt-4 text-sm text-muted list-disc pl-5 grid gap-1">
              <li><b className="text-ink">Read only</b> tokens can only use GET (through the MCP, only the tools that read).</li>
              <li>Up to {rateLimit} requests per minute per token.</li>
              <li>Tokens can read your orders but can&apos;t change them, and can&apos;t touch your account, password, billing or other tokens.</li>
              <li>If a token leaks, revoke it here: it stops working immediately.</li>
            </ul>
          </section>
        )}
      </main>
      <NewTokenModal open={creating} onClose={() => setCreating(false)} expiryDays={expiryDays}
        onCreated={(r) => { setCreating(false); setCreated(r); load(); }} />
    </div>
  );
}

function NewTokenModal({ open, onClose, onCreated, expiryDays }) {
  const [name, setName] = useState('');
  const [scope, setScope] = useState('write');
  const [days, setDays] = useState(90);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => { if (open) { setName(''); setScope('write'); setDays(90); setErr(''); } }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const r = await api('/api/tokens', { method: 'POST', body: { name: name.trim() || 'API token', scope, expiresInDays: days } });
      onCreated(r);
    } catch (e2) { setErr(errorMessage(e2)); }
    setBusy(false);
  };

  return (
    <Modal open={open} onClose={onClose} title="New API token">
      <form onSubmit={submit} className="grid gap-4">
        <label className="grid gap-1.5 text-sm font-medium">
          Name
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Claude MCP, Zapier" maxLength={60} autoFocus />
        </label>
        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium mb-1.5">Access</legend>
          {[['write', 'Read & write', 'Create, edit, publish and delete your pages.'], ['read', 'Read only', 'See your pages and their analytics.']].map(([v, l, d]) => (
            <label key={v} className={cx('flex gap-3 items-start rounded-2xl border p-3 cursor-pointer', scope === v ? 'border-accent bg-accent-soft/40' : 'border-line')}>
              <input type="radio" name="scope" value={v} checked={scope === v} onChange={() => setScope(v)} className="mt-1" />
              <span><span className="font-semibold text-sm block">{l}</span><span className="text-xs text-muted">{d}</span></span>
            </label>
          ))}
        </fieldset>
        <label className="grid gap-1.5 text-sm font-medium">
          Expires
          <Select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {expiryDays.map((d) => <option key={d} value={d}>{d ? `In ${d} days` : 'Never'}</option>)}
          </Select>
        </label>
        {err && <p className="rounded-xl bg-danger/10 text-danger px-3 py-2 text-sm" role="alert">{err}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={busy}>{busy && <Loader2 size={15} className="animate-spin" />} Create token</Button>
        </div>
      </form>
    </Modal>
  );
}
