import Link from "next/link";
import { ArrowRight, Coffee } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-alabaster text-espresso flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="max-w-lg border border-stone-border bg-surface p-10 sm:p-14">
        <Coffee
          className="h-7 w-7 text-terracotta mx-auto mb-5"
          strokeWidth={1.75}
        />
        <p className="text-[11px] uppercase tracking-[0.26em] text-terracotta mb-2">
          404 • Harvest Not Found
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl font-medium text-espresso mb-4">
          This Page Has Sold Out
        </h1>
        <p className="text-sm text-muted leading-relaxed mb-8">
          The page or micro-lot you are looking for may have rotated out of
          season or moved. Explore our current fresh roasts below.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/shop"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-espresso text-alabaster px-6 py-3.5 text-xs uppercase tracking-[0.16em] font-medium hover:bg-roast transition-colors"
          >
            Shop Fresh Roasts
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
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
