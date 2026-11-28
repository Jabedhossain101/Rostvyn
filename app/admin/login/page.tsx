"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Coffee,
  KeyRound,
  Loader2,
  Lock,
  UserPlus,
} from "lucide-react";

const DEMO_EMAIL = "admin@rostvyn.com";
const DEMO_PASSWORD = "RostvynAdmin@2026";

function AdminAuthPortal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/admin";

  const [mode, setMode] = useState<"signin" | "register">("signin");

  // Sign-In state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Registration state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<"SUPER_ADMIN" | "STAFF">("SUPER_ADMIN");

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const safeNext = nextPath.startsWith("/admin") ? nextPath : "/admin";

  async function performLogin(loginEmail: string, loginPassword: string) {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid email or password.");
        setIsSubmitting(false);
        return;
      }

      router.push(safeNext);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  }

  async function handleSignInSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await performLogin(email, password);
  }

  async function handleOneClickDemo() {
    setMode("signin");
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    await performLogin(DEMO_EMAIL, DEMO_PASSWORD);
  }

  async function handleRegisterSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          role: regRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to create demo account.");
        setIsSubmitting(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Main Auth Card */}
      <div className="bg-surface border border-stone-border p-8 sm:p-10 shadow-sm">
        <div className="flex items-center justify-center gap-2.5 mb-7">
          <Coffee className="h-5 w-5 text-terracotta" strokeWidth={1.75} />
          <span className="font-serif text-3xl font-semibold tracking-tight text-espresso">
            Rostvyn
          </span>
        </div>

        <div className="text-center mb-6">
          <p className="text-[11px] uppercase tracking-[0.22em] text-terracotta mb-2">
            Roastery Back-Office
          </p>
          <h1 className="font-serif text-3xl font-medium text-espresso">
            {mode === "signin" ? "Admin Sign In" : "Create Demo Account"}
          </h1>
        </div>

        {/* Mode Toggle Tabs */}
        <div
          role="tablist"
          aria-label="Admin authentication mode"
          className="grid grid-cols-2 border border-stone-border bg-alabaster p-1 mb-6"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signin"}
            onClick={() => {
              setMode("signin");
              setError(null);
            }}
            className={`py-2 text-xs uppercase tracking-[0.14em] transition-colors cursor-pointer ${
              mode === "signin"
                ? "bg-espresso text-alabaster font-medium"
                : "text-roast hover:text-espresso"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "register"}
            onClick={() => {
              setMode("register");
              setError(null);
            }}
            className={`py-2 text-xs uppercase tracking-[0.14em] transition-colors cursor-pointer ${
              mode === "register"
                ? "bg-espresso text-alabaster font-medium"
                : "text-roast hover:text-espresso"
            }`}
          >
            Create Demo Account
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 border border-rust/30 bg-rust/5 px-4 py-3 text-sm text-rust"
          >
            {error}
          </div>
        )}

        {mode === "signin" ? (
          <form onSubmit={handleSignInSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs uppercase tracking-[0.14em] text-roast mb-1.5"
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
                className="block text-xs uppercase tracking-[0.14em] text-roast mb-1.5"
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
              className="w-full inline-flex items-center justify-center gap-2 bg-espresso text-alabaster py-3.5 px-6 text-xs uppercase tracking-[0.18em] font-medium hover:bg-roast disabled:opacity-60 transition-colors cursor-pointer"
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
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="reg-name"
                className="block text-xs uppercase tracking-[0.14em] text-roast mb-1.5"
              >
                Full Name
              </label>
              <input
                id="reg-name"
                type="text"
                required
                minLength={2}
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Alex Mercer"
                className="w-full border border-stone-border bg-alabaster px-4 py-3 text-sm text-espresso placeholder:text-muted/70 focus:border-terracotta focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="reg-email"
                className="block text-xs uppercase tracking-[0.14em] text-roast mb-1.5"
              >
                Email Address
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="reviewer@company.com"
                className="w-full border border-stone-border bg-alabaster px-4 py-3 text-sm text-espresso placeholder:text-muted/70 focus:border-terracotta focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="reg-password"
                className="block text-xs uppercase tracking-[0.14em] text-roast mb-1.5"
              >
                Password (min 8 chars)
              </label>
              <input
                id="reg-password"
                type="password"
                required
                minLength={8}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Create a secure password"
                className="w-full border border-stone-border bg-alabaster px-4 py-3 text-sm text-espresso placeholder:text-muted/70 focus:border-terracotta focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="reg-role"
                className="block text-xs uppercase tracking-[0.14em] text-roast mb-1.5"
              >
                Demo Access Role
              </label>
              <select
                id="reg-role"
                value={regRole}
                onChange={(e) =>
                  setRegRole(e.target.value as "SUPER_ADMIN" | "STAFF")
                }
                className="w-full border border-stone-border bg-alabaster px-4 py-3 text-sm text-espresso focus:border-terracotta focus:outline-none"
              >
                <option value="SUPER_ADMIN">
                  Super Admin (Full 9-Module Access)
                </option>
                <option value="STAFF">
                  Operations Staff (Orders, Inventory &amp; Payments)
                </option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 bg-espresso text-alabaster py-3.5 px-6 text-xs uppercase tracking-[0.18em] font-medium hover:bg-roast disabled:opacity-60 transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create Demo Account &amp; Enter
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-7 pt-5 border-t border-stone-border text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-espresso transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Return to Storefront
          </Link>
        </div>
      </div>

      {/* Client Demo Quick Access Card */}
      <div className="border border-terracotta/40 bg-linen p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-serif text-xl font-medium text-espresso">
            Client Demo Quick Access
          </h2>
          <span className="bg-surface border border-stone-border px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold text-terracotta">
            Super Admin
          </span>
        </div>

        <p className="text-xs text-roast leading-relaxed">
          Reviewing Rostvyn? Use the pre-seeded Super Admin account below for
          instant access to all 9 operational modules.
        </p>

        <div className="border border-stone-border bg-surface p-3.5 text-xs space-y-1.5 font-mono">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted font-sans">Email:</span>
            <span className="text-espresso font-semibold">{DEMO_EMAIL}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted font-sans">Password:</span>
            <span className="text-espresso font-semibold">{DEMO_PASSWORD}</span>
          </div>
        </div>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleOneClickDemo}
          className="w-full inline-flex items-center justify-center gap-2 bg-terracotta text-alabaster py-3 px-5 text-xs uppercase tracking-[0.16em] font-semibold hover:bg-rust disabled:opacity-60 transition-colors cursor-pointer"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <KeyRound className="h-4 w-4" />
          )}
          One-Click Demo Login
        </button>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-alabaster flex items-center justify-center px-4 sm:px-6 py-12">
      <Suspense
        fallback={
          <div className="text-sm text-muted">Loading admin portal...</div>
        }
      >
        <AdminAuthPortal />
      </Suspense>
    </main>
  );
}
