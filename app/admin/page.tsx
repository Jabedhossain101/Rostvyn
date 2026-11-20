import { redirect } from "next/navigation";
import { Coffee, ShieldCheck } from "lucide-react";
import { getServerAdminSession } from "@/lib/auth-server";
import { SignOutButton } from "./_components/sign-out-button";

export default async function AdminDashboardPage() {
  const session = await getServerAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-alabaster text-espresso">
      <header className="border-b border-stone-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Coffee className="h-5 w-5 text-terracotta" strokeWidth={1.75} />
            <span className="font-serif text-2xl font-semibold tracking-tight">
              Rostvyn
            </span>
            <span className="ml-2 border-l border-stone-border pl-3 text-[11px] uppercase tracking-[0.18em] text-muted">
              Admin Operations
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-espresso">{session.name}</p>
              <p className="text-[11px] uppercase tracking-[0.14em] text-terracotta">
                {session.role.replace("_", " ")}
              </p>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="border border-stone-border bg-surface p-8">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-terracotta mb-3">
            <ShieldCheck className="h-4 w-4" />
            Authenticated Session Active
          </div>
          <h1 className="font-serif text-3xl font-medium text-espresso mb-3">
            Welcome, {session.name}
          </h1>
          <p className="text-sm text-muted max-w-2xl leading-relaxed">
            Admin authentication and route protection are live. Signed in as{" "}
            <span className="text-espresso font-medium">{session.email}</span> (
            {session.role}). Full operational modules (Orders, Payment
            Verification, Catalog, Inventory, Promo Codes, Reviews &amp; Store
            Settings) will be implemented in the upcoming Admin Back-Office
            phase.
          </p>
        </div>
      </main>
    </div>
  );
}
