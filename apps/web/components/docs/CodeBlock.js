'use client';
import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

/** Code sample with a copy button. */
export default function CodeBlock({ code, label = 'CSS', wrap = false }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative rounded-2xl code-surface overflow-hidden min-w-0 max-w-full">
      <div className="flex items-center justify-between px-4 h-9 border-b border-white/10 text-xs text-white/50">
        <span>{label}</span>
        <button
          type="button"
          onClick={async () => { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1400); }}
          className="inline-flex items-center gap-1.5 hover:text-white cursor-pointer"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className={`p-4 text-[13px] leading-relaxed font-mono overflow-x-auto ${wrap ? 'whitespace-pre-wrap' : ''}`}><code>{code}</code></pre>
    </div>
  );
}
