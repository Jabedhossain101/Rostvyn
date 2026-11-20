"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Coffee, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Rostvyn Error Boundary]", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-alabaster text-espresso flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="max-w-lg border border-stone-border bg-surface p-10 sm:p-14">
        <Coffee
          className="h-7 w-7 text-rust mx-auto mb-5"
          strokeWidth={1.75}
        />
        <p className="text-[11px] uppercase tracking-[0.26em] text-rust mb-2">
          Unexpected Roastery Interruption
        </p>
        <h1 className="font-serif text-4xl font-medium text-espresso mb-4">
          Something Went Wrong
        </h1>
        <p className="text-sm text-muted leading-relaxed mb-8">
          We encountered a temporary issue while preparing this page. Please try
          again or return to the storefront.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-espresso text-alabaster px-6 py-3.5 text-xs uppercase tracking-[0.16em] font-medium hover:bg-roast transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Try Again
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center border border-stone-border bg-alabaster text-espresso px-6 py-3.5 text-xs uppercase tracking-[0.16em] hover:border-espresso transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    </main>
  );
}
