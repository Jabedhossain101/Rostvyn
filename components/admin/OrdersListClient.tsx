"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  FulfillmentBadge,
  PaymentStatusBadge,
} from "@/components/admin/AdminBadges";

export interface AdminOrderRow {
  id: string;
  orderRef: string;
  customerName: string;
  customerPhone: string;
  city: string;
  totalAmount: number;
  fulfillmentStatus: string;
  paymentMethod: string | null;
  paymentStatus: string | null;
  itemCount: number;
  createdAt: string;
}

export function OrdersListClient({
  initialOrders,
  currencyCode,
}: {
  initialOrders: AdminOrderRow[];
  currencyCode: string;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = initialOrders.filter((o) => {
    const matchesSearch =
      !search.trim() ||
      o.orderRef.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.customerPhone.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || o.fulfillmentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-terracotta font-semibold">
          Sales &amp; Fulfillment
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-medium text-espresso">
          Orders ({initialOrders.length})
        </h1>
      </div>

      <div className="border border-stone-border bg-surface p-4 flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by orderRef, customer name, or phone..."
            className="w-full border border-stone-border bg-alabaster pl-9 pr-3 py-2 text-sm text-espresso focus:border-terracotta focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-stone-border bg-alabaster px-3.5 py-2 text-xs uppercase tracking-wider text-espresso"
        >
          <option value="ALL">All Statuses</option>
          {[
            "PENDING",
            "CONFIRMED",
            "PROCESSING",
            "SHIPPED",
            "DELIVERED",
            "CANCELLED",
          ].map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>

      <div className="border border-stone-border bg-surface overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-border bg-linen/70 text-[11px] uppercase tracking-[0.14em] text-roast">
              <th className="py-3.5 px-5 font-semibold">Order Ref</th>
              <th className="py-3.5 px-5 font-semibold">Customer</th>
              <th className="py-3.5 px-5 font-semibold">Items / Total</th>
              <th className="py-3.5 px-5 font-semibold">Fulfillment</th>
              <th className="py-3.5 px-5 font-semibold">Payment</th>
              <th className="py-3.5 px-5 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-muted">
                  No orders match your filter.
                </td>
              </tr>
            ) : (
              filtered.map((o) => (
                <tr key={o.id} className="hover:bg-alabaster/70">
                  <td className="py-3.5 px-5">
                    <p className="font-mono text-xs font-semibold text-espresso">
                      {o.orderRef}
                    </p>
                    <p className="text-[11px] text-muted">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="py-3.5 px-5">
                    <p className="font-medium text-espresso">{o.customerName}</p>
                    <p className="text-xs text-muted">
                      {o.customerPhone} • {o.city}
                    </p>
                  </td>
                  <td className="py-3.5 px-5">
                    <p className="font-semibold text-espresso">
                      {formatCurrency(o.totalAmount, currencyCode)}
                    </p>
                    <p className="text-xs text-muted">
                      {o.itemCount} {o.itemCount === 1 ? "line" : "lines"}
                    </p>
                  </td>
                  <td className="py-3.5 px-5">
                    <FulfillmentBadge status={o.fulfillmentStatus} />
                  </td>
                  <td className="py-3.5 px-5">
                    {o.paymentStatus ? (
                      <div className="space-y-1">
                        <PaymentStatusBadge status={o.paymentStatus} />
                        <p className="text-[11px] text-muted">{o.paymentMethod}</p>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="text-xs uppercase tracking-wider text-terracotta hover:underline font-medium"
                    >
                      Inspect →
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
