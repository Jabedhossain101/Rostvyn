"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, Coffee, Loader2, Lock } from "lucide-react";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid email or password.");
        setIsSubmitting(false);
        return;
      }

      const safeNext = nextPath.startsWith("/admin") ? nextPath : "/admin";
      router.push(safeNext);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-surface border border-stone-border p-8 sm:p-10 shadow-sm">
      <div className="flex items-center justify-center gap-2.5 mb-8">
        <Coffee className="h-5 w-5 text-terracotta" strokeWidth={1.75} />
        <span className="font-serif text-3xl font-semibold tracking-tight text-espresso">
          Rostvyn
        </span>
      </div>

      <div className="text-center mb-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-terracotta mb-2">
          Roastery Back-Office
        </p>
        <h1 className="font-serif text-3xl font-medium text-espresso">
          Admin Sign In
        </h1>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 border border-rust/30 bg-rust/5 px-4 py-3 text-sm text-rust"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="block text-xs uppercase tracking-[0.14em] text-roast mb-2"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@rostvyn.com"
            className="w-full border border-stone-border bg-alabaster px-4 py-3 text-sm text-espresso placeholder:text-muted/70 focus:border-terracotta focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs uppercase tracking-[0.14em] text-roast mb-2"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full border border-stone-border bg-alabaster px-4 py-3 text-sm text-espresso placeholder:text-muted/70 focus:border-terracotta focus:outline-none transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full inline-flex items-center justify-center gap-2 bg-espresso text-alabaster py-3.5 px-6 text-sm font-medium tracking-wide hover:bg-roast disabled:opacity-60 transition-colors cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying Credentials...
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              Sign In
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-stone-border text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-espresso transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Return to Storefront
        </Link>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-alabaster flex items-center justify-center px-6 py-12">
      <Suspense
        fallback={
          <div className="text-sm text-muted">Loading sign-in form...</div>
        }
      >
        <AdminLoginForm />
      </Suspense>
    </main>
  );
}
