'use client';
import { useRef, useState } from 'react';
import { FileUp, FileText, Trash2, Loader2, ExternalLink } from 'lucide-react';
import { uploadFile, errorMessage } from '@/lib/client';
import { Button, Input, IconButton } from '../ui';

const fmtSize = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

/** Upload a document (PDF…) or paste its URL. Field props: accept, help. */
export default function FileField({ value, onChange, field, id }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState(null);

  const onFile = async (file) => {
    if (!file) return;
    if (field.accept && !field.accept.split(',').some((a) => file.type === a.trim())) {
      setErr('That file type is not supported here.');
      return;
    }
    setBusy(true); setErr('');
    try {
      const res = await uploadFile(file);
      setInfo({ name: res.name || file.name, size: res.size || file.size });
      onChange(res.url);
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = '';
    }
  };

  return (
    <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}>
      {value ? (
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-soft/60 p-3">
          <span className="size-10 rounded-xl bg-panel border border-line grid place-items-center text-accent shrink-0"><FileText size={19} /></span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{info?.name || decodeURIComponent(value.split('/').pop().split('?')[0]) || 'File'}</p>
            <p className="text-xs text-muted">{info ? `${fmtSize(info.size)} · uploaded` : 'Attached'}</p>
          </div>
          <a href={value} target="_blank" rel="noreferrer" className="inline-grid place-items-center size-8 rounded-full text-muted hover:text-ink hover:bg-panel" aria-label="Open file"><ExternalLink size={16} /></a>
          <IconButton label="Replace file" onClick={() => ref.current?.click()}>{busy ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />}</IconButton>
          <IconButton label="Remove file" onClick={() => { onChange(''); setInfo(null); }}><Trash2 size={16} /></IconButton>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-line p-4 text-center">
          <Button size="sm" onClick={() => ref.current?.click()} disabled={busy}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <FileUp size={15} />} {busy ? 'Uploading…' : 'Upload file'}
          </Button>
          <p className="text-xs text-muted mt-2">or drop it here, or paste a link:</p>
          <Input id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder="https://…/file.pdf" className="mt-2" />
        </div>
      )}
      {err && <p className="text-xs text-danger mt-1.5">{err}</p>}
      <input ref={ref} type="file" accept={field.accept || '*/*'} hidden onChange={(e) => onFile(e.target.files?.[0])} />
    </div>
  );
}
