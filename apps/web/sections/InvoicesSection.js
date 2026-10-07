'use client';
// Invoices for your customers: create, edit, mark as sent / paid, and download as PDF.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Copy, CopyPlus, Download, ExternalLink, FileText, Loader2, Plus, Settings2, Trash2, Check, Link2 } from 'lucide-react';
import { invoiceSettingsFields, invoiceClientFields, invoiceTotals, invoiceMoney } from '@otrelink/core';
import { api, errorMessage } from '@/lib/client';
import { Panel, Button, Input, Textarea, IconButton, cx } from '@/components/ui';
import FieldList from '@/components/fields/FieldList';

export const OPEN_INVOICE_KEY = 'ol-open-invoice';
const STATUS = {
  draft: { label: 'Draft', cls: 'bg-soft text-muted' },
  sent: { label: 'Sent', cls: 'bg-sky-100 text-sky-800' },
  paid: { label: 'Paid', cls: 'bg-teal/15 text-teal' },
  void: { label: 'Void', cls: 'bg-danger/10 text-danger' },
};
const FILTERS = [['', 'All'], ['draft', 'Drafts'], ['sent', 'Sent'], ['paid', 'Paid'], ['void', 'Void']];
const fmtDate = (d) => (d ? new Date(`${d}T12:00:00Z`).toLocaleDateString([], { dateStyle: 'medium', timeZone: 'UTC' }) : '—');
const rid = () => Math.random().toString(36).slice(2, 10);

export default function InvoicesSection({ ed }) {
  const { page } = ed;
  const [list, setList] = useState(null);
  const [filter, setFilter] = useState('');
  const [openId, setOpenId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    try { setList((await api(`/api/invoices?pageId=${page.id}${filter ? `&status=${filter}` : ''}`)).invoices); setErr(''); } catch (e) { setErr(errorMessage(e)); }
  }, [page.id, filter]);
  useEffect(() => { load(); }, [load]);
  // Opened from an order ("Invoice" button in Orders).
  useEffect(() => {
    try { const id = sessionStorage.getItem(OPEN_INVOICE_KEY); if (id) { sessionStorage.removeItem(OPEN_INVOICE_KEY); setOpenId(id); } } catch { /* private mode */ }
  }, []);

  const create = async (invoice) => {
    setBusy(true);
    try {
      const r = await api('/api/invoices', { method: 'POST', body: { pageId: page.id, ...(invoice ? { invoice } : {}) } });
      setOpenId(r.invoice.id);
      load();
    } catch (e) { setErr(errorMessage(e)); } finally { setBusy(false); }
  };

  if (openId) return <InvoiceEditor id={openId} page={page} onClose={() => { setOpenId(null); load(); }} onDuplicate={(inv) => create(inv)} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted mt-1">Make invoices for your customers and download them as PDF.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setShowSettings((v) => !v)} aria-expanded={showSettings}><Settings2 size={15} /> Business details</Button>
          <Button variant="primary" size="sm" onClick={() => create()} disabled={busy}>{busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} New invoice</Button>
        </div>
      </div>
      {showSettings && <InvoiceSettings page={page} onClose={() => setShowSettings(false)} />}
      {err && <p className="text-sm text-danger" role="alert">{err}</p>}
      <div className="inline-flex flex-wrap p-1 rounded-full bg-soft" role="tablist">
        {FILTERS.map(([id, label]) => (
          <button key={id || 'all'} type="button" role="tab" aria-selected={filter === id} onClick={() => setFilter(id)}
            className={cx('h-8 px-4 rounded-full text-sm font-semibold cursor-pointer', filter === id ? 'bg-panel shadow-sm' : 'text-muted')}>{label}</button>
        ))}
      </div>
      {!list ? <p className="text-sm text-muted">Loading…</p> : !list.length ? (
        <div className="rounded-3xl border border-dashed border-line p-10 text-center">
          <FileText className="mx-auto text-muted" />
          <p className="font-display text-lg font-bold mt-3">{filter ? 'No invoices here' : 'No invoices yet'}</p>
          <p className="text-sm text-muted mt-1">Create one, or make it from a pickup order (Orders → Invoice). Fill your <b>Business details</b> first: they go at the top of every invoice.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-line/80 bg-panel overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted border-b border-line/70">
              <tr><th className="px-4 py-3 font-semibold">Number</th><th className="px-4 py-3 font-semibold">Client</th><th className="px-4 py-3 font-semibold hidden sm:table-cell">Date</th><th className="px-4 py-3 font-semibold text-right">Total</th><th className="px-4 py-3 font-semibold">Status</th><th className="w-10" /></tr>
            </thead>
            <tbody>
              {list.map((inv) => (
                <tr key={inv.id} className="border-b border-line/60 last:border-0 hover:bg-soft/60 cursor-pointer" onClick={() => setOpenId(inv.id)}>
                  <td className="px-4 py-3 font-semibold tabular-nums">{inv.code}</td>
                  <td className="px-4 py-3 max-w-[180px] truncate">{inv.client?.name || <span className="text-muted">No client</span>}</td>
                  <td className="px-4 py-3 hidden sm:table-cell text-muted">{fmtDate(inv.issueDate)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold">{invoiceMoney(inv.total, inv.money)}</td>
                  <td className="px-4 py-3"><span className={cx('text-xs font-semibold px-2 py-1 rounded-full', STATUS[inv.status]?.cls)}>{STATUS[inv.status]?.label}</span></td>
                  <td className="px-2"><a href={`/api/invoices/${inv.id}/pdf?download=1`} onClick={(e) => e.stopPropagation()} className="inline-grid place-items-center size-8 rounded-full text-muted hover:text-ink hover:bg-soft" aria-label={`Download ${inv.code} as PDF`} title="Download PDF"><Download size={15} /></a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function InvoiceSettings({ page, onClose }) {
  const [values, setValues] = useState(null);
  const [defaults, setDefaults] = useState({});
  const [state, setState] = useState('');
  useEffect(() => { api(`/api/pages/${page.id}/invoicing`).then((r) => { setValues(r.invoicing); setDefaults(r.defaults); }).catch(() => setValues({})); }, [page.id]);
  const fields = useMemo(() => invoiceSettingsFields.map((f) => (f.key === 'businessName' ? { ...f, placeholder: defaults.businessName, help: 'Defaults to your page title.' } : f)), [defaults]);
  const save = async () => {
    setState('saving');
    try { setValues((await api(`/api/pages/${page.id}/invoicing`, { method: 'PUT', body: values })).invoicing); setState('saved'); setTimeout(() => setState(''), 1500); } catch (e) { setState(errorMessage(e)); }
  };
  return (
    <Panel title="Business details" description="Printed at the top of your invoices. New invoices also take the currency, tax and notes from here.">
      {!values ? <p className="text-sm text-muted">Loading…</p> : (
        <>
          <FieldList fields={fields} values={values} onChange={(k, v) => setValues((s) => ({ ...s, [k]: v }))} />
          <div className="flex items-center gap-2 mt-4">
            <Button variant="primary" size="sm" onClick={save} disabled={state === 'saving'}>{state === 'saving' ? <Loader2 size={15} className="animate-spin" /> : state === 'saved' ? <Check size={15} /> : null} Save details</Button>
            <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
            {state && !['saving', 'saved'].includes(state) && <span className="text-sm text-danger">{state}</span>}
          </div>
        </>
      )}
    </Panel>
  );
}

function InvoiceEditor({ id, page, onClose, onDuplicate }) {
  const [inv, setInv] = useState(null);
  const [link, setLink] = useState('');
  const [saved, setSaved] = useState('');
  const [state, setState] = useState('');
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(inv);
  const dirty = inv && json !== saved;

  useEffect(() => {
    api(`/api/invoices/${id}`).then((r) => { setInv(r.invoice); setSaved(JSON.stringify(r.invoice)); setLink(r.link); }).catch((e) => setState(errorMessage(e)));
  }, [id]);

  const set = (patch) => setInv((v) => ({ ...v, ...patch }));
  const setItem = (i, patch) => set({ items: inv.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) });
  const totals = useMemo(() => (inv ? invoiceTotals(inv) : null), [inv]);
  const money = (n) => invoiceMoney(n, inv?.money);

  const save = async () => {
    setState('saving');
    try {
      const r = await api(`/api/invoices/${id}`, { method: 'PUT', body: inv });
      setInv(r.invoice); setSaved(JSON.stringify(r.invoice)); setState('');
      return true;
    } catch (e) { setState(errorMessage(e)); return false; }
  };
  // The PDF is made from the saved invoice: save first.
  const openPdf = async (download) => {
    if (dirty && !(await save())) return;
    window.open(`/api/invoices/${id}/pdf${download ? '?download=1' : ''}`, download ? '_self' : '_blank');
  };
  const remove = async () => {
    if (!window.confirm(`Delete invoice ${inv.code}? This can't be undone.`)) return;
    try { await api(`/api/invoices/${id}`, { method: 'DELETE' }); onClose(); } catch (e) { setState(errorMessage(e)); }
  };
  const copyLink = async () => {
    if (dirty && !(await save())) return;
    await navigator.clipboard.writeText(link).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };
  const leave = () => { if (!dirty || window.confirm('Leave without saving your changes?')) onClose(); };

  if (!inv) return <div className="space-y-4"><Button size="sm" variant="ghost" onClick={onClose}><ArrowLeft size={15} /> Invoices</Button><p className="text-sm text-muted">{state || 'Loading…'}</p></div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button size="sm" variant="ghost" onClick={leave}><ArrowLeft size={15} /> Invoices</Button>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => openPdf(false)}><ExternalLink size={15} /> View PDF</Button>
          <Button size="sm" onClick={() => openPdf(true)}><Download size={15} /> Download</Button>
          <Button variant="primary" size="sm" onClick={save} disabled={!dirty || state === 'saving'}>{state === 'saving' && <Loader2 size={15} className="animate-spin" />} {dirty ? 'Save' : 'Saved'}</Button>
        </div>
      </div>
      {state && state !== 'saving' && <p className="text-sm text-danger" role="alert">{state}</p>}

      <Panel title={<span className="flex items-center gap-3">{inv.code} <span className={cx('text-xs font-semibold px-2 py-1 rounded-full', STATUS[inv.status]?.cls)}>{STATUS[inv.status]?.label}</span></span>}>
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="block"><span className="block text-[13px] font-semibold mb-1.5">Status</span>
            <select value={inv.status} onChange={(e) => set({ status: e.target.value })} className="w-full h-10 rounded-xl border border-line bg-panel px-3 text-sm">
              {Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
            </select></label>
          <label className="block"><span className="block text-[13px] font-semibold mb-1.5">Date</span><Input type="date" value={inv.issueDate} onChange={(e) => set({ issueDate: e.target.value })} /></label>
          <label className="block"><span className="block text-[13px] font-semibold mb-1.5">Due date</span><Input type="date" value={inv.dueDate} onChange={(e) => set({ dueDate: e.target.value })} /></label>
        </div>
        <div className="mt-4 rounded-2xl bg-soft p-3 flex flex-wrap items-center gap-2 text-sm">
          <Link2 size={15} className="text-muted" />
          {inv.status === 'draft'
            ? <span className="text-muted">Change the status to <b>Sent</b> to get a link your client can open to download the PDF.</span>
            : <><span className="text-muted flex-1 min-w-0">Link for your client (PDF, no account needed)</span><Button size="sm" onClick={copyLink}>{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy link'}</Button></>}
        </div>
      </Panel>

      <Panel title="Client">
        <FieldList fields={invoiceClientFields} values={inv.client || {}} onChange={(k, v) => set({ client: { ...inv.client, [k]: v } })} compact />
      </Panel>

      <Panel title="Items">
        <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_80px_110px_100px_32px] gap-2 text-xs font-semibold text-muted px-1 mb-1">
          <span>Description</span><span className="text-right">Qty</span><span className="text-right">Unit price</span><span className="text-right">Amount</span><span />
        </div>
        <div className="space-y-2">
          {inv.items.map((it, i) => (
            <div key={it.id || i} className="grid grid-cols-[minmax(0,1fr)_32px] sm:grid-cols-[minmax(0,1fr)_80px_110px_100px_32px] gap-2 items-start rounded-2xl sm:rounded-none border sm:border-0 border-line p-2 sm:p-0">
              <Textarea value={it.description} onChange={(e) => setItem(i, { description: e.target.value })} placeholder="What you sold or did" aria-label="Description" className="min-h-10 h-10 py-2 resize-y col-span-1" rows={1} />
              <IconButton label="Remove item" onClick={() => set({ items: inv.items.filter((_, j) => j !== i) })} className="sm:order-last mt-1"><Trash2 size={15} /></IconButton>
              <div className="col-span-2 sm:col-span-1 grid grid-cols-3 sm:contents gap-2">
                <Input type="number" min={0} step="any" value={it.qty} onChange={(e) => setItem(i, { qty: e.target.value === '' ? '' : Number(e.target.value) })} aria-label="Quantity" className="text-right" />
                <Input type="number" step="0.01" value={it.price} onChange={(e) => setItem(i, { price: e.target.value === '' ? '' : Number(e.target.value) })} aria-label="Unit price" className="text-right" />
                <p className="h-10 grid items-center text-right text-sm font-semibold tabular-nums">{money(Math.round(Number(it.qty || 0) * Number(it.price || 0) * 100) / 100)}</p>
              </div>
            </div>
          ))}
        </div>
        <Button size="sm" className="mt-3" onClick={() => set({ items: [...inv.items, { id: rid(), description: '', qty: 1, price: 0 }] })}><Plus size={15} /> Add item</Button>

        <div className="mt-5 grid sm:grid-cols-2 gap-5">
          <div className="grid grid-cols-2 gap-3 content-start">
            <label className="block"><span className="block text-[13px] font-semibold mb-1.5">Discount (%)</span><Input type="number" min={0} max={100} step="0.01" value={inv.discount} onChange={(e) => set({ discount: Number(e.target.value) || 0 })} /></label>
            <label className="block"><span className="block text-[13px] font-semibold mb-1.5">{inv.taxLabel || 'Tax'} (%)</span><Input type="number" min={0} max={100} step="0.01" value={inv.taxRate} onChange={(e) => set({ taxRate: Number(e.target.value) || 0 })} /></label>
            <label className="block"><span className="block text-[13px] font-semibold mb-1.5">Tax name</span><Input value={inv.taxLabel} maxLength={20} onChange={(e) => set({ taxLabel: e.target.value })} /></label>
            <label className="block"><span className="block text-[13px] font-semibold mb-1.5">Currency</span><Input value={inv.money?.currency || ''} maxLength={6} onChange={(e) => set({ money: { ...inv.money, currency: e.target.value } })} /></label>
          </div>
          <dl className="rounded-2xl bg-soft p-4 text-sm grid grid-cols-[1fr_auto] gap-y-1.5 content-start">
            <dt className="text-muted">Subtotal</dt><dd className="text-right tabular-nums">{money(totals.subtotal)}</dd>
            {totals.discount > 0 && <><dt className="text-muted">Discount</dt><dd className="text-right tabular-nums">-{money(totals.discount)}</dd></>}
            {Number(inv.taxRate) > 0 && <><dt className="text-muted">{inv.taxLabel || 'Tax'}</dt><dd className="text-right tabular-nums">{money(totals.tax)}</dd></>}
            <dt className="font-bold text-base pt-2 border-t border-line">Total</dt><dd className="font-bold text-base text-right tabular-nums pt-2 border-t border-line">{money(totals.total)}</dd>
          </dl>
        </div>
      </Panel>

      <Panel title="Notes">
        <Textarea value={inv.notes} maxLength={2000} onChange={(e) => set({ notes: e.target.value })} placeholder="Payment instructions, thanks, terms…" />
        <label className="block mt-3"><span className="block text-[13px] font-semibold mb-1.5">Footer (optional)</span><Input value={inv.footer} maxLength={200} onChange={(e) => set({ footer: e.target.value })} placeholder="Defaults to the footer in Business details" /></label>
      </Panel>

      <div className="flex flex-wrap justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => onDuplicate({ ...inv, status: 'draft' })}><CopyPlus size={15} /> Duplicate</Button>
        <Button size="sm" variant="danger" onClick={remove}><Trash2 size={15} /> Delete</Button>
      </div>
    </div>
  );
}
