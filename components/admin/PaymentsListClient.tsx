"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PaymentStatusBadge } from "@/components/admin/AdminBadges";

export interface AdminPaymentRow {
  id: string;
  orderId: string;
  orderRef: string;
  customerName: string;
  method: string;
  status: string;
  amount: number;
  trxId: string | null;
  senderAccount: string | null;
  verifiedByName: string | null;
  createdAt: string;
}

export function PaymentsListClient({
  initialPayments,
  currencyCode,
}: {
  initialPayments: AdminPaymentRow[];
  currencyCode: string;
}) {
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") ?? "ALL"
  );
  const [search, setSearch] = useState("");

  const filtered = initialPayments.filter((p) => {
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    const matchesSearch =
      !search.trim() ||
      p.orderRef.toLowerCase().includes(search.toLowerCase()) ||
      (p.trxId ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.senderAccount ?? "").toLowerCase().includes(search.toLowerCase()) ||
      p.customerName.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-terracotta font-semibold">
          Financial Audit Ledger
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-medium text-espresso">
          Payments &amp; TrxID Verification
        </h1>
      </div>

      <div className="border border-stone-border bg-surface p-4 flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by TrxID, sender account, or orderRef..."
            className="w-full border border-stone-border bg-alabaster pl-9 pr-3 py-2 text-sm text-espresso focus:border-terracotta focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-stone-border bg-alabaster px-3.5 py-2 text-xs uppercase tracking-wider text-espresso"
        >
          <option value="ALL">All Payment Statuses</option>
          {[
            "PENDING_VERIFICATION",
            "VERIFIED",
            "PAID",
            "REJECTED",
            "REFUNDED",
          ].map((st) => (
            <option key={st} value={st}>
              {st.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="border border-stone-border bg-surface overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-border bg-linen/70 text-[11px] uppercase tracking-[0.14em] text-roast">
              <th className="py-3.5 px-5 font-semibold">Order Ref</th>
              <th className="py-3.5 px-5 font-semibold">Method / TrxID</th>
              <th className="py-3.5 px-5 font-semibold">Sender Account</th>
              <th className="py-3.5 px-5 font-semibold">Amount</th>
              <th className="py-3.5 px-5 font-semibold">Status</th>
              <th className="py-3.5 px-5 font-semibold text-right">Audit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-muted">
                  No payments match this filter.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="hover:bg-alabaster/70">
                  <td className="py-3.5 px-5">
                    <p className="font-mono text-xs font-semibold text-espresso">
                      {p.orderRef}
                    </p>
                    <p className="text-xs text-muted">{p.customerName}</p>
                  </td>
                  <td className="py-3.5 px-5">
                    <p className="text-xs font-semibold text-espresso">
                      {p.method}
                    </p>
                    {p.trxId ? (
                      <p className="font-mono text-xs text-terracotta mt-0.5">
                        {p.trxId}
                      </p>
                    ) : (
                      <p className="text-xs text-muted">No TrxID (COD)</p>
                    )}
                  </td>
                  <td className="py-3.5 px-5 text-xs text-roast">
                    {p.senderAccount || "—"}
                  </td>
                  <td className="py-3.5 px-5 font-semibold text-espresso">
                    {formatCurrency(p.amount, currencyCode)}
                  </td>
                  <td className="py-3.5 px-5">
                    <PaymentStatusBadge status={p.status} />
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <Link
                      href={`/admin/payments/${p.id}`}
                      className="text-xs uppercase tracking-wider text-terracotta hover:underline font-medium"
                    >
                      Review →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
