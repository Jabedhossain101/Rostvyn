"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyOrderRefButton({ orderRef }: { orderRef: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(orderRef);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard API fallback not needed in modern browsers
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 border border-stone-border bg-alabaster px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-espresso hover:border-espresso transition-colors cursor-pointer"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-terracotta" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          Copy Ref
        </>
      )}
    </button>
  );
}
