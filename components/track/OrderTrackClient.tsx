"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Check,
  Loader2,
  MapPin,
  Package,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface TrackedOrder {
  orderRef: string;
  createdAt: string;
  fulfillmentStatus:
    | "PENDING"
    | "CONFIRMED"
    | "PROCESSING"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED";
  city: string;
  address: string;
  subtotal: number;
  discountAmount: number;
  promoCodeUsed: string | null;
  deliveryFee: number;
  totalAmount: number;
  payment: {
    method: string;
    status:
      | "PENDING_VERIFICATION"
      | "VERIFIED"
      | "PAID"
      | "REJECTED"
      | "REFUNDED";
    trxId: string | null;
    verifiedAt: string | null;
  } | null;
  items: {
    id: string;
    productNameSnapshot: string;
    variantSnapshot: string;
    skuSnapshot: string;
    unitPriceSnapshot: number;
    quantity: number;
  }[];
}

const TIMELINE_STEPS = [
  { key: "PENDING", label: "Pending", desc: "Order received" },
  { key: "CONFIRMED", label: "Confirmed", desc: "Verified & scheduled" },
  { key: "PROCESSING", label: "Processing", desc: "Roasting & packing" },
  { key: "SHIPPED", label: "Shipped", desc: "In transit" },
  { key: "DELIVERED", label: "Delivered", desc: "Arrived at door" },
] as const;

const PAYMENT_BADGE_MAP: Record<
  string,
  { label: string; className: string }
> = {
  PENDING_VERIFICATION: {
    label: "Pending Verification",
    className: "border-terracotta/40 bg-terracotta/10 text-terracotta",
  },
  VERIFIED: {
    label: "Verified",
    className: "border-emerald-700/30 bg-emerald-700/10 text-emerald-800",
  },
  PAID: {
    label: "Paid",
    className: "border-emerald-700/30 bg-emerald-700/10 text-emerald-800",
  },
  REJECTED: {
    label: "Rejected",
    className: "border-rust/40 bg-rust/10 text-rust",
  },
  REFUNDED: {
    label: "Refunded",
    className: "border-stone-border bg-linen text-roast",
  },
};

export function OrderTrackClient({ currencyCode }: { currencyCode: string }) {
  const searchParams = useSearchParams();
  const [ref, setRef] = useState(searchParams.get("ref") ?? "");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  async function handleLookup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOrder(null);
    setLoading(true);

    try {
      const params = new URLSearchParams({
        ref: ref.trim(),
        phone: phone.trim(),
      });
      const res = await fetch(`/api/orders/track?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(
          data.error ||
            "No order found matching that reference and phone number."
        );
        return;
      }

      setOrder(data.order);
    } catch {
      setError("Network error while looking up your order. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const currentStepIndex = order
    ? TIMELINE_STEPS.findIndex((s) => s.key === order.fulfillmentStatus)
    : -1;

  const paymentBadge = order?.payment
    ? PAYMENT_BADGE_MAP[order.payment.status] ?? {
        label: order.payment.status,
        className: "border-stone-border bg-linen text-roast",
      }
    : null;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-10">
      {/* Privacy-Safe Lookup Form */}
      <div className="border border-stone-border bg-surface p-6 sm:p-8">
        <div className="mb-6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-terracotta mb-1.5">
            Privacy-Safe Verification
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl font-medium text-espresso">
            Locate Your Roast
          </h2>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Enter both your Order Reference (e.g.{" "}
            <span className="font-mono text-espresso">RV-261121-XXXX</span>) and
            the mobile number used at checkout.
          </p>
        </div>

        <form
          onSubmit={handleLookup}
          className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end"
        >
          <div className="md:col-span-5">
            <label
              htmlFor="track-ref"
              className="block text-xs uppercase tracking-[0.14em] text-roast mb-1.5"
            >
              Order Reference *
            </label>
            <input
              id="track-ref"
              type="text"
              required
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="RV-261121-XXXX"
              className="w-full border border-stone-border bg-alabaster px-4 py-3 text-sm font-mono uppercase text-espresso focus:border-terracotta focus:outline-none"
            />
          </div>

          <div className="md:col-span-4">
            <label
              htmlFor="track-phone"
              className="block text-xs uppercase tracking-[0.14em] text-roast mb-1.5"
            >
              Phone Number *
            </label>
            <input
              id="track-phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 415 555 0198"
              className="w-full border border-stone-border bg-alabaster px-4 py-3 text-sm text-espresso focus:border-terracotta focus:outline-none"
            />
          </div>

          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-espresso text-alabaster py-3 px-5 text-xs uppercase tracking-[0.16em] font-medium hover:bg-roast disabled:opacity-60 transition-colors cursor-pointer"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Track Order
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-2.5 border border-rust/40 bg-rust/5 px-4 py-3 text-sm text-rust"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Matched Order Result */}
      {order && (
        <div className="space-y-6">
          {/* Header & Payment Verification Badge */}
          <div className="border border-stone-border bg-surface p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-border">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted">
                  Order Reference
                </p>
                <h3 className="font-mono text-2xl font-semibold text-espresso mt-0.5">
                  {order.orderRef}
                </h3>
                <p className="text-xs text-muted mt-1">
                  Placed on{" "}
                  {new Intl.DateTimeFormat("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(order.createdAt))}
                </p>
              </div>

              {paymentBadge && (
                <div className="flex flex-col sm:items-end gap-1.5">
                  <span className="text-[11px] uppercase tracking-[0.16em] text-muted">
                    Payment Verification
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs uppercase tracking-[0.14em] font-semibold ${paymentBadge.className}`}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {paymentBadge.label}
                  </span>
                  {order.payment?.trxId && (
                    <span className="text-[11px] font-mono text-muted">
                      TrxID: {order.payment.trxId}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 5-Step Fulfillment Timeline or Cancelled Banner */}
            <div className="pt-8">
              {order.fulfillmentStatus === "CANCELLED" ? (
                <div className="flex items-start gap-3 border border-rust/40 bg-rust/5 p-5 text-rust">
                  <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm uppercase tracking-wider">
                      Order Cancelled
                    </p>
                    <p className="text-xs mt-1 text-roast">
                      This order has been cancelled. If you believe this was in
                      error, please contact our roastery concierge with your
                      order reference.
                    </p>
                  </div>
                </div>
              ) : (
                <ol
                  aria-label="Fulfillment progress"
                  className="grid grid-cols-1 sm:grid-cols-5 gap-4"
                >
                  {TIMELINE_STEPS.map((step, idx) => {
                    const completed = idx <= currentStepIndex;
                    const active = idx === currentStepIndex;
                    return (
                      <li
                        key={step.key}
                        className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2"
                      >
                        <div className="flex items-center sm:w-full gap-2">
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 border ${
                              completed
                                ? "bg-espresso border-espresso text-alabaster"
                                : "bg-alabaster border-stone-border text-muted"
                            } ${active ? "ring-4 ring-terracotta/25" : ""}`}
                          >
                            {completed ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              idx + 1
                            )}
                          </div>
                          {idx < TIMELINE_STEPS.length - 1 && (
                            <div
                              className={`hidden sm:block h-0.5 flex-1 ${
                                idx < currentStepIndex
                                  ? "bg-espresso"
                                  : "bg-stone-border"
                              }`}
                            />
                          )}
                        </div>
                        <div>
                          <p
                            className={`text-xs uppercase tracking-[0.14em] font-semibold ${
                              completed ? "text-espresso" : "text-muted"
                            }`}
                          >
                            {step.label}
                          </p>
                          <p className="text-[11px] text-muted">{step.desc}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>

          {/* Delivery & Itemized Snapshot */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5 border border-stone-border bg-surface p-6 space-y-3 text-sm">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-terracotta">
                <MapPin className="h-4 w-4" />
                Delivery Destination
              </div>
              <p className="text-espresso font-medium">{order.city}</p>
              <p className="text-muted leading-relaxed">{order.address}</p>
            </div>

            <div className="md:col-span-7 border border-stone-border bg-surface p-6">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-terracotta mb-4">
                <Package className="h-4 w-4" />
                Order Items
              </div>

              <div className="divide-y divide-stone-border">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="py-3 flex items-start justify-between gap-4 text-sm"
                  >
                    <div>
                      <p className="font-serif text-base font-medium text-espresso">
                        {item.productNameSnapshot}
                      </p>
                      <p className="text-xs text-muted">
                        {item.variantSnapshot} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium text-espresso">
                      {formatCurrency(
                        item.unitPriceSnapshot * item.quantity,
                        currencyCode
                      )}
                    </p>
                  </div>
                ))}
              </div>

              <dl className="mt-4 pt-4 border-t border-stone-border space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-muted">Subtotal</dt>
                  <dd className="text-espresso">
                    {formatCurrency(order.subtotal, currencyCode)}
                  </dd>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-terracotta">
                    <dt>
                      Discount
                      {order.promoCodeUsed ? ` (${order.promoCodeUsed})` : ""}
                    </dt>
                    <dd>-{formatCurrency(order.discountAmount, currencyCode)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted">Delivery Fee</dt>
                  <dd className="text-espresso">
                    {order.deliveryFee === 0
                      ? "FREE"
                      : formatCurrency(order.deliveryFee, currencyCode)}
                  </dd>
                </div>
                <div className="pt-2 border-t border-stone-border flex justify-between text-sm font-semibold text-espresso">
                  <dt>Total</dt>
                  <dd>{formatCurrency(order.totalAmount, currencyCode)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
