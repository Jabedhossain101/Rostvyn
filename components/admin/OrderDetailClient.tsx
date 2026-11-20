"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Loader2, Save, ShieldCheck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  FulfillmentBadge,
  PaymentStatusBadge,
} from "@/components/admin/AdminBadges";

export interface AdminOrderDetail {
  id: string;
  orderRef: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  city: string;
  address: string;
  notes: string | null;
  internalNotes: string | null;
  subtotal: number;
  discountAmount: number;
  promoCodeUsed: string | null;
  deliveryFee: number;
  totalAmount: number;
  fulfillmentStatus: string;
  stockRestored: boolean;
  createdAt: string;
  items: {
    id: string;
    productNameSnapshot: string;
    variantSnapshot: string;
    skuSnapshot: string;
    unitPriceSnapshot: number;
    quantity: number;
  }[];
  payment: {
    id: string;
    method: string;
    status: string;
    amount: number;
    trxId: string | null;
    senderAccount: string | null;
    auditNote: string | null;
    verifiedAt: string | null;
    verifiedByName: string | null;
  } | null;
}

const STATUS_OPTIONS = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export function OrderDetailClient({
  order: initialOrder,
  currencyCode,
}: {
  order: AdminOrderDetail;
  currencyCode: string;
}) {
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);
  const [selectedStatus, setSelectedStatus] = useState(
    initialOrder.fulfillmentStatus
  );
  const [internalNotes, setInternalNotes] = useState(
    initialOrder.internalNotes ?? ""
  );
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function commitUpdate(nextStatus: string) {
    setSaving(true);
    setError(null);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fulfillmentStatus: nextStatus,
          internalNotes: internalNotes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update order.");
        return;
      }

      setOrder((prev) => ({
        ...prev,
        fulfillmentStatus: data.fulfillmentStatus,
        stockRestored: data.stockRestored,
        internalNotes: data.internalNotes,
      }));
      setCancelConfirmOpen(false);
      setFeedback(
        data.stockRestoredNow
          ? "Order cancelled and reserved stock has been atomically restored to inventory."
          : "Order updated successfully."
      );
      router.refresh();
    } catch {
      setError("Network error while updating order.");
    } finally {
      setSaving(false);
    }
  }

  function handleSaveClick() {
    if (
      selectedStatus === "CANCELLED" &&
      order.fulfillmentStatus !== "CANCELLED"
    ) {
      setCancelConfirmOpen(true);
      return;
    }
    commitUpdate(selectedStatus);
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-muted hover:text-espresso mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Orders
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-terracotta font-semibold">
              Order Inspection
            </p>
            <h1 className="font-mono text-2xl sm:text-3xl font-semibold text-espresso mt-0.5">
              {order.orderRef}
            </h1>
          </div>
          <div className="flex items-center gap-2.5">
            <FulfillmentBadge status={order.fulfillmentStatus} />
            {order.payment && <PaymentStatusBadge status={order.payment.status} />}
          </div>
        </div>
      </div>

      {feedback && (
        <div className="border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
          {feedback}
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="border border-rust/40 bg-rust/5 p-4 text-sm text-rust"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Items & Pricing */}
        <div className="lg:col-span-7 space-y-6">
          <section className="border border-stone-border bg-surface p-6">
            <h2 className="font-serif text-2xl font-medium text-espresso mb-4">
              Frozen Order Items ({order.items.length})
            </h2>
            <div className="divide-y divide-stone-border">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="py-3.5 flex items-start justify-between gap-4 text-sm"
                >
                  <div>
                    <p className="font-medium text-espresso">
                      {item.productNameSnapshot}
                    </p>
                    <p className="text-xs text-muted">
                      {item.variantSnapshot} • SKU {item.skuSnapshot}
                    </p>
                    <p className="text-xs text-roast mt-0.5">
                      {item.quantity} ×{" "}
                      {formatCurrency(item.unitPriceSnapshot, currencyCode)}
                    </p>
                  </div>
                  <p className="font-semibold text-espresso">
                    {formatCurrency(
                      item.unitPriceSnapshot * item.quantity,
                      currencyCode
                    )}
                  </p>
                </div>
              ))}
            </div>

            <dl className="mt-5 pt-4 border-t border-stone-border space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd>{formatCurrency(order.subtotal, currencyCode)}</dd>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-terracotta">
                  <dt>
                    Promo Discount
                    {order.promoCodeUsed ? ` (${order.promoCodeUsed})` : ""}
                  </dt>
                  <dd>-{formatCurrency(order.discountAmount, currencyCode)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted">Delivery Fee</dt>
                <dd>
                  {order.deliveryFee === 0
                    ? "FREE"
                    : formatCurrency(order.deliveryFee, currencyCode)}
                </dd>
              </div>
              <div className="pt-2 border-t border-stone-border flex justify-between text-base font-semibold text-espresso">
                <dt>Grand Total</dt>
                <dd>{formatCurrency(order.totalAmount, currencyCode)}</dd>
              </div>
            </dl>
          </section>

          {/* Customer & Shipping */}
          <section className="border border-stone-border bg-surface p-6 space-y-2 text-sm">
            <h2 className="font-serif text-2xl font-medium text-espresso mb-3">
              Customer &amp; Shipping
            </h2>
            <p className="font-medium text-espresso">{order.customerName}</p>
            <p className="text-roast">
              {order.customerPhone}
              {order.customerEmail ? ` • ${order.customerEmail}` : ""}
            </p>
            <p className="text-muted">
              {order.address}, {order.city}
            </p>
            {order.notes && (
              <div className="mt-3 bg-linen border border-stone-border p-3 text-xs text-roast">
                <strong>Customer Note:</strong> {order.notes}
              </div>
            )}
          </section>
        </div>

        {/* Right: Fulfillment Controls & Payment Audit */}
        <div className="lg:col-span-5 space-y-6">
          <section className="border border-stone-border bg-surface p-6 space-y-4">
            <h2 className="font-serif text-2xl font-medium text-espresso">
              Fulfillment &amp; Internal Notes
            </h2>

            <div>
              <label className="block text-xs uppercase tracking-wider text-roast mb-1.5">
                Fulfillment Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm text-espresso"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              {order.stockRestored && (
                <p className="text-xs text-emerald-800 mt-1.5">
                  Stock restoration already executed for this cancelled order.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-roast mb-1.5">
                Internal Operations Notes
              </label>
              <textarea
                rows={4}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Courier tracking number, roast batch note, or customer call log..."
                className="w-full border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm text-espresso"
              />
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={handleSaveClick}
              className="w-full inline-flex items-center justify-center gap-2 bg-espresso text-alabaster py-3 px-5 text-xs uppercase tracking-[0.16em] hover:bg-roast disabled:opacity-60 cursor-pointer"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Order Update
            </button>
          </section>

          {/* Payment Audit Trail Card */}
          {order.payment && (
            <section className="border border-stone-border bg-surface p-6 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl font-medium text-espresso flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-terracotta" />
                  Payment Audit
                </h2>
                <Link
                  href={`/admin/payments/${order.payment.id}`}
                  className="text-xs uppercase tracking-wider text-terracotta hover:underline"
                >
                  Open Audit →
                </Link>
              </div>
              <dl className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-muted">Method</dt>
                  <dd className="font-medium text-espresso">
                    {order.payment.method}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Status</dt>
                  <dd>
                    <PaymentStatusBadge status={order.payment.status} />
                  </dd>
                </div>
                {order.payment.trxId && (
                  <div className="flex justify-between">
                    <dt className="text-muted">TrxID</dt>
                    <dd className="font-mono font-semibold text-espresso">
                      {order.payment.trxId}
                    </dd>
                  </div>
                )}
                {order.payment.senderAccount && (
                  <div className="flex justify-between">
                    <dt className="text-muted">Sender Account</dt>
                    <dd className="text-espresso">
                      {order.payment.senderAccount}
                    </dd>
                  </div>
                )}
                {order.payment.verifiedByName && (
                  <div className="flex justify-between pt-2 border-t border-stone-border">
                    <dt className="text-muted">Reviewed By</dt>
                    <dd className="text-espresso">
                      {order.payment.verifiedByName}
                    </dd>
                  </div>
                )}
              </dl>
            </section>
          )}
        </div>
      </div>

      {/* Cancellation Confirmation Dialog */}
      {cancelConfirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="fixed inset-0 bg-espresso/50"
            onClick={() => setCancelConfirmOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md bg-surface border border-stone-border p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-rust shrink-0 mt-0.5" />
              <div>
                <h2 className="font-serif text-2xl font-medium text-espresso">
                  Cancel Order {order.orderRef}?
                </h2>
                <p className="text-sm text-roast mt-2 leading-relaxed">
                  Transitioning this order to <strong>CANCELLED</strong> will
                  atomically restore all line-item quantities back into live
                  variant stock and record a compensating inventory audit entry
                  (executed once).
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelConfirmOpen(false)}
                className="border border-stone-border px-4 py-2 text-xs uppercase tracking-wider text-roast cursor-pointer"
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => commitUpdate("CANCELLED")}
                className="bg-rust text-alabaster px-5 py-2 text-xs uppercase tracking-wider font-medium hover:bg-rust/90 cursor-pointer"
              >
                {saving ? "Cancelling..." : "Confirm Cancel & Restore Stock"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
