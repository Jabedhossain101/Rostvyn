"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

export function NewsletterBand({ source = "homepage_footer" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Please enter a valid email address.");
        return;
      }

      setStatus("success");
      setMessage(data.message);
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Unable to connect right now. Please try again.");
    }
  }

  return (
    <section className="bg-linen border-t border-stone-border">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
        <p className="text-[11px] uppercase tracking-[0.24em] text-terracotta mb-3">
          The First-Order Club
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl font-medium text-espresso mb-4">
          10% Off Your First Micro-Lot Release
        </h2>
        <p className="text-sm sm:text-base text-muted max-w-xl mx-auto leading-relaxed mb-8">
          Join our roast dispatch list for early access to limited single-origin
          harvests, brewing recipes, and code{" "}
          <span className="font-semibold text-espresso">WELCOME10</span>.
        </p>

        {status === "success" ? (
          <div className="inline-flex items-center gap-2.5 border border-terracotta/30 bg-surface px-6 py-4 text-sm text-espresso">
            <CheckCircle2 className="h-5 w-5 text-terracotta shrink-0" />
            <span>{message}</span>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mx-auto max-w-md flex flex-col sm:flex-row gap-3"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="flex-1 border border-stone-border bg-surface px-4 py-3.5 text-sm text-espresso placeholder:text-muted focus:border-terracotta focus:outline-none"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="inline-flex items-center justify-center gap-2 bg-espresso text-alabaster px-6 py-3.5 text-xs uppercase tracking-[0.16em] font-medium hover:bg-roast disabled:opacity-60 transition-colors cursor-pointer"
            >
              {status === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Join Club
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>
        )}

        {status === "error" && message && (
          <p role="alert" className="mt-3 text-xs text-rust">
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
