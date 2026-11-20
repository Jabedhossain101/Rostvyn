"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes,
  Coffee,
  CreditCard,
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  MessageSquareQuote,
  Package,
  Settings,
  ShoppingBag,
  Tag,
  X,
} from "lucide-react";

interface AdminSidebarShellProps {
  admin: {
    name: string;
    email: string;
    role: "SUPER_ADMIN" | "STAFF";
  };
  children: React.ReactNode;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  exact?: boolean;
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Executive Dashboard", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/categories", label: "Categories", icon: FolderTree },
      { href: "/admin/inventory", label: "Inventory", icon: Boxes },
    ],
  },
  {
    label: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
      { href: "/admin/payments", label: "Payments", icon: CreditCard },
    ],
  },
  {
    label: "Growth & Care",
    items: [
      { href: "/admin/promotions", label: "Promotions", icon: Tag },
      { href: "/admin/reviews", label: "Reviews & Inquiries", icon: MessageSquareQuote },
    ],
  },
  {
    label: "Store",
    items: [{ href: "/admin/settings", label: "Settings", icon: Settings }],
  },
];

export function AdminSidebarShell({ admin, children }: AdminSidebarShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Never wrap the login screen in the admin sidebar chrome
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-espresso text-alabaster">
      <div className="overflow-y-auto px-4 py-6">
        {/* Brand */}
        <div className="flex items-center justify-between px-2 pb-6 border-b border-alabaster/10">
          <Link href="/admin" className="flex items-center gap-2.5">
            <Coffee className="h-5 w-5 text-terracotta" strokeWidth={1.75} />
            <div>
              <span className="font-serif text-xl font-semibold tracking-tight text-alabaster block leading-none">
                Rostvyn
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-alabaster/55">
                Back-Office
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
            className="lg:hidden p-1 text-alabaster/70 hover:text-alabaster cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Groups */}
        <nav aria-label="Admin navigation" className="mt-6 space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 text-[10px] uppercase tracking-[0.2em] text-alabaster/45 font-semibold mb-2">
                {group.label}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href, item.exact);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                          active
                            ? "bg-terracotta text-alabaster font-medium"
                            : "text-alabaster/75 hover:bg-roast hover:text-alabaster"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Profile & Utilities */}
      <div className="border-t border-alabaster/10 p-4 space-y-3 bg-roast/50">
        <div className="px-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-alabaster truncate">
              {admin.name}
            </p>
            <span className="shrink-0 bg-terracotta/25 border border-terracotta/50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-alabaster">
              {admin.role === "SUPER_ADMIN" ? "Super Admin" : "Staff"}
            </span>
          </div>
          <p className="text-xs text-alabaster/55 truncate mt-0.5">
            {admin.email}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 border border-alabaster/20 px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-alabaster/85 hover:bg-alabaster/10 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Storefront
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center justify-center gap-1.5 border border-alabaster/20 px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-alabaster/85 hover:bg-rust/80 hover:border-rust transition-colors cursor-pointer disabled:opacity-50"
          >
            {loggingOut ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <LogOut className="h-3.5 w-3.5" />
            )}
            Logout
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-linen/70 text-espresso flex">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-espresso/50 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 w-72 max-w-[85vw] h-full">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile Topbar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-stone-border bg-surface px-4 py-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open admin menu"
            className="p-2 -ml-2 text-espresso hover:text-terracotta cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-serif text-xl font-semibold text-espresso">
            Rostvyn Admin
          </span>
          <Link
            href="/"
            className="text-xs uppercase tracking-wider text-terracotta"
          >
            Store
          </Link>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
