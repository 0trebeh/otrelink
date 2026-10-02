'use client';
import { useRef, useState } from 'react';
import { ImagePlus, Trash2, Loader2 } from 'lucide-react';
import { uploadImage, errorMessage } from '@/lib/client';
import { Input, IconButton } from '../ui';

export default function ImageField({ value, onChange, field, id }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const onFile = async (file) => {
    if (!file) return;
    setBusy(true); setErr('');
    try {
      const { url } = await uploadImage(file, field.maxSize || 1600);
      onChange(url);
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative size-16 shrink-0 rounded-2xl border border-dashed border-line bg-soft grid place-items-center overflow-hidden text-muted hover:border-accent hover:text-accent cursor-pointer"
          aria-label="Upload image"
        >
          {busy ? <Loader2 className="animate-spin" size={20} /> : value ? <img src={value} alt="" className="absolute inset-0 size-full object-cover" /> : <ImagePlus size={20} />}
        </button>
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex gap-1.5">
            <div className="flex-1 min-w-0"><Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Upload or paste an image URL" /></div>
            {value && <IconButton label="Remove image" onClick={() => onChange('')} className="mt-1 shrink-0"><Trash2 size={16} /></IconButton>}
          </div>
          {err && <p className="text-xs text-danger">{err}</p>}
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
    </div>
  );
}
