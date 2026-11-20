"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Loader2,
  Lock,
  ShoppingBag,
  Tag,
  Truck,
  X,
} from "lucide-react";
import type { PublicStoreSettings } from "@/lib/storefront";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/lib/utils";

interface CheckoutClientProps {
  settings: PublicStoreSettings;
}

interface AppliedPromo {
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  discountAmount: number;
}

export function CheckoutClient({ settings }: CheckoutClientProps) {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const storedPromoCode = useCartStore((s) => s.promoCode);
  const setStoredPromoCode = useCartStore((s) => s.setPromoCode);
  const clearCart = useCartStore((s) => s.clearCart);

  const [mounted, setMounted] = useState(false);

  // Customer & Shipping state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [city, setCity] = useState("");
  const [deliveryZone, setDeliveryZone] = useState<"METRO" | "NATIONAL">("METRO");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "MANUAL_TRANSFER">(
    "COD"
  );
  const [trxId, setTrxId] = useState("");
  const [senderAccount, setSenderAccount] = useState("");

  // Promo state
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const subtotal = mounted
    ? items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    : 0;

  // Hydrate & validate promo code carried over from /cart
  useEffect(() => {
    if (!mounted || !storedPromoCode || subtotal <= 0) return;

    let cancelled = false;
    async function revalidate() {
      try {
        const res = await fetch("/api/promos/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: storedPromoCode, subtotal }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data.valid) {
          setAppliedPromo(data);
        } else {
          setAppliedPromo(null);
          setStoredPromoCode(null);
        }
      } catch {
        // Ignore transient errors
      }
    }
    revalidate();
    return () => {
      cancelled = true;
    };
  }, [mounted, storedPromoCode, subtotal, setStoredPromoCode]);

  async function handleApplyPromo(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = promoInput.trim();
    if (!code) return;

    setPromoLoading(true);
    setPromoError(null);

    try {
      const res = await fetch("/api/promos/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setPromoError(data.error || "Invalid promo code.");
        return;
      }

      setAppliedPromo(data);
      setStoredPromoCode(data.code);
      setPromoInput("");
    } catch {
      setPromoError("Unable to validate promo code.");
    } finally {
      setPromoLoading(false);
    }
  }

  function handleRemovePromo() {
    setAppliedPromo(null);
    setStoredPromoCode(null);
    setPromoError(null);
  }

  const discountAmount = appliedPromo?.discountAmount ?? 0;
  const netAfterDiscount = Math.max(0, subtotal - discountAmount);
  const qualifiesFreeShipping =
    netAfterDiscount >= settings.freeShippingThreshold;
  const deliveryFee = qualifiesFreeShipping
    ? 0
    : deliveryZone === "METRO"
    ? settings.metroDeliveryFee
    : settings.nationalDeliveryFee;
  const grandTotal = netAfterDiscount + deliveryFee;

  async function handleCheckoutSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail,
          city,
          deliveryZone,
          address,
          notes,
          items: items.map((i) => ({
            variantId: i.variantId,
            quantity: i.quantity,
          })),
          promoCode: appliedPromo?.code ?? "",
          paymentMethod,
          trxId: paymentMethod === "MANUAL_TRANSFER" ? trxId : "",
          senderAccount:
            paymentMethod === "MANUAL_TRANSFER" ? senderAccount : "",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(
          data.error || "Unable to complete checkout. Please review your details."
        );
        setSubmitting(false);
        return;
      }

      clearCart();
      router.push(`/order-confirmation/${encodeURIComponent(data.orderRef)}`);
    } catch {
      setSubmitError("Network error while placing your order. Please try again.");
      setSubmitting(false);
    }
  }

  if (!mounted) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-sm text-muted">
        Preparing guest checkout...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="border border-stone-border bg-surface p-12">
          <ShoppingBag
            className="h-10 w-10 text-muted mx-auto mb-4"
            strokeWidth={1.5}
          />
          <h2 className="font-serif text-3xl font-medium text-espresso mb-3">
            Your Bag is Empty
          </h2>
          <p className="text-sm text-muted mb-8">
            Add at least one roast or brewing item to your bag before proceeding
            to checkout.
          </p>
          <Link
            href="/shop"
            className="inline-block bg-espresso text-alabaster px-8 py-3.5 text-xs uppercase tracking-[0.18em] hover:bg-roast transition-colors"
          >
            Shop Fresh Roasts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
      <div className="mb-8">
        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-muted hover:text-espresso transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Bag
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        {/* Left Column: Guest Shipping & Payment Form */}
        <form
          id="guest-checkout-form"
          onSubmit={handleCheckoutSubmit}
          className="lg:col-span-7 space-y-8"
        >
          {submitError && (
            <div
              role="alert"
              className="flex items-start gap-3 border border-rust/40 bg-rust/5 p-4 text-sm text-rust"
            >
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* 1. Contact & Shipping */}
          <section className="border border-stone-border bg-surface p-6 sm:p-8 space-y-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-terracotta mb-1">
                Step 1 of 2 • No Account Required
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-medium text-espresso">
                Contact &amp; Delivery Details
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="co-name"
                  className="block text-xs uppercase tracking-[0.14em] text-roast mb-1.5"
                >
                  Full Name *
                </label>
                <input
                  id="co-name"
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Elena Vance"
                  className="w-full border border-stone-border bg-alabaster px-4 py-3 text-sm text-espresso focus:border-terracotta focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="co-phone"
                  className="block text-xs uppercase tracking-[0.14em] text-roast mb-1.5"
                >
                  Mobile Number *
                </label>
                <input
                  id="co-phone"
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+1 415 555 0198"
                  className="w-full border border-stone-border bg-alabaster px-4 py-3 text-sm text-espresso focus:border-terracotta focus:outline-none"
                />
                <p className="text-[11px] text-muted mt-1">
                  Used alongside your Order Reference for privacy-safe tracking.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="co-email"
                  className="block text-xs uppercase tracking-[0.14em] text-roast mb-1.5"
                >
                  Email (Optional Receipt)
                </label>
                <input
                  id="co-email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="elena@example.com"
                  className="w-full border border-stone-border bg-alabaster px-4 py-3 text-sm text-espresso focus:border-terracotta focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="co-city"
                  className="block text-xs uppercase tracking-[0.14em] text-roast mb-1.5"
                >
                  City / Region *
                </label>
                <input
                  id="co-city"
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Portland, OR"
                  className="w-full border border-stone-border bg-alabaster px-4 py-3 text-sm text-espresso focus:border-terracotta focus:outline-none"
                />
              </div>
            </div>

            {/* Delivery Zone Selector */}
            <div>
              <span className="block text-xs uppercase tracking-[0.14em] text-roast mb-2">
                Delivery Zone *
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    value: "METRO" as const,
                    title: "Metro Express",
                    eta: "1–2 business days",
                    fee: settings.metroDeliveryFee,
                  },
                  {
                    value: "NATIONAL" as const,
                    title: "National / Regional",
                    eta: "3–5 business days",
                    fee: settings.nationalDeliveryFee,
                  },
                ].map((zone) => {
                  const selected = deliveryZone === zone.value;
                  return (
                    <button
                      key={zone.value}
                      type="button"
                      onClick={() => setDeliveryZone(zone.value)}
                      className={`p-4 text-left border transition-colors cursor-pointer ${
                        selected
                          ? "border-espresso bg-linen"
                          : "border-stone-border bg-alabaster hover:border-espresso/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-espresso">
                          {zone.title}
                        </span>
                        <span className="text-xs font-semibold text-terracotta">
                          {qualifiesFreeShipping
                            ? "FREE"
                            : formatCurrency(zone.fee, settings.currencyCode)}
                        </span>
                      </div>
                      <p className="text-xs text-muted mt-1">{zone.eta}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label
                htmlFor="co-address"
                className="block text-xs uppercase tracking-[0.14em] text-roast mb-1.5"
              >
                Full Street Address *
              </label>
              <textarea
                id="co-address"
                rows={3}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address, apartment/suite, postal code"
                className="w-full border border-stone-border bg-alabaster px-4 py-3 text-sm text-espresso focus:border-terracotta focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="co-notes"
                className="block text-xs uppercase tracking-[0.14em] text-roast mb-1.5"
              >
                Delivery Instructions (Optional)
              </label>
              <input
                id="co-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Gate code, concierge desk, or preferred drop-off note"
                className="w-full border border-stone-border bg-alabaster px-4 py-3 text-sm text-espresso focus:border-terracotta focus:outline-none"
              />
            </div>
          </section>

          {/* 2. Payment Method */}
          <section className="border border-stone-border bg-surface p-6 sm:p-8 space-y-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-terracotta mb-1">
                Step 2 of 2 • Verified Settlement
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-medium text-espresso">
                Payment Method
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("COD")}
                className={`p-4 text-left border transition-colors cursor-pointer ${
                  paymentMethod === "COD"
                    ? "border-espresso bg-linen"
                    : "border-stone-border bg-alabaster hover:border-espresso/50"
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-sm text-espresso">
                  <Truck className="h-4 w-4 text-terracotta" />
                  Cash on Delivery (COD)
                </div>
                <p className="text-xs text-muted mt-1.5">
                  Pay in cash or courier terminal upon delivery.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("MANUAL_TRANSFER")}
                className={`p-4 text-left border transition-colors cursor-pointer ${
                  paymentMethod === "MANUAL_TRANSFER"
                    ? "border-espresso bg-linen"
                    : "border-stone-border bg-alabaster hover:border-espresso/50"
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-sm text-espresso">
                  <Building2 className="h-4 w-4 text-terracotta" />
                  Manual Bank Transfer
                </div>
                <p className="text-xs text-muted mt-1.5">
                  IBAN / Wire / PayID with Transaction Reference (TrxID).
                </p>
              </button>
            </div>

            {paymentMethod === "MANUAL_TRANSFER" && (
              <div className="space-y-5 pt-2">
                {/* Merchant Receiving Accounts from StoreSettings */}
                <div className="border border-stone-border bg-linen p-5 space-y-4">
                  <p className="text-xs uppercase tracking-[0.16em] font-semibold text-espresso">
                    Roastery Receiving Account Details
                  </p>
                  {settings.paymentAccounts.length > 0 ? (
                    <div className="space-y-4">
                      {settings.paymentAccounts.map((acct, idx) => (
                        <div
                          key={acct.label + idx}
                          className="border-t first:border-t-0 border-stone-border pt-3 first:pt-0 text-xs space-y-1"
                        >
                          <p className="font-semibold text-espresso">
                            {acct.label}
                          </p>
                          <p className="text-roast">
                            {acct.bankName} — {acct.accountName}
                          </p>
                          <p className="font-mono text-espresso bg-surface inline-block px-2 py-1 border border-stone-border mt-1">
                            {acct.accountNumber}
                            {acct.routingOrSwift
                              ? ` (${acct.routingOrSwift})`
                              : ""}
                          </p>
                          {acct.instructions && (
                            <p className="text-muted pt-1">{acct.instructions}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted">
                      Transfer the exact order total and enter your bank receipt
                      reference below.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="co-trxid"
                      className="block text-xs uppercase tracking-[0.14em] text-roast mb-1.5"
                    >
                      Transaction Reference (TrxID) *
                    </label>
                    <input
                      id="co-trxid"
                      type="text"
                      required={paymentMethod === "MANUAL_TRANSFER"}
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                      placeholder="e.g. WIRE-99482710"
                      className="w-full border border-stone-border bg-alabaster px-4 py-3 text-sm text-espresso focus:border-terracotta focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="co-sender"
                      className="block text-xs uppercase tracking-[0.14em] text-roast mb-1.5"
                    >
                      Sender Account / Name *
                    </label>
                    <input
                      id="co-sender"
                      type="text"
                      required={paymentMethod === "MANUAL_TRANSFER"}
                      value={senderAccount}
                      onChange={(e) => setSenderAccount(e.target.value)}
                      placeholder="Account holder name or IBAN tail"
                      className="w-full border border-stone-border bg-alabaster px-4 py-3 text-sm text-espresso focus:border-terracotta focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2.5 bg-espresso text-alabaster py-4 px-8 text-xs uppercase tracking-[0.2em] font-semibold hover:bg-roast disabled:opacity-60 transition-colors cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Securing Stock &amp; Placing Order...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Place Order — {formatCurrency(grandTotal, settings.currencyCode)}
              </>
            )}
          </button>
        </form>

        {/* Right Column: Sticky Order Summary */}
        <aside className="lg:col-span-5 border border-stone-border bg-surface p-6 sm:p-8 space-y-6 lg:sticky lg:top-28">
          <h2 className="font-serif text-2xl font-medium text-espresso">
            Order Summary ({items.reduce((s, i) => s + i.quantity, 0)})
          </h2>

          {/* Itemized Cart */}
          <ul className="divide-y divide-stone-border max-h-72 overflow-y-auto pr-1">
            {items.map((item) => (
              <li key={item.variantId} className="py-3.5 flex gap-3.5">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-16 w-14 object-cover bg-linen border border-stone-border shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-base font-medium text-espresso leading-snug truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-muted mt-0.5">{item.variantName}</p>
                  <div className="flex items-center justify-between mt-1.5 text-xs">
                    <span className="text-roast">Qty: {item.quantity}</span>
                    <span className="font-semibold text-espresso">
                      {formatCurrency(
                        item.price * item.quantity,
                        settings.currencyCode
                      )}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Promo Code */}
          <div className="pt-4 border-t border-stone-border">
            {appliedPromo ? (
              <div className="flex items-center justify-between gap-2 border border-terracotta/40 bg-linen px-3.5 py-2.5 text-xs">
                <span className="inline-flex items-center gap-2 text-espresso">
                  <CheckCircle2 className="h-4 w-4 text-terracotta shrink-0" />
                  <strong>{appliedPromo.code}</strong> applied
                </span>
                <button
                  type="button"
                  onClick={handleRemovePromo}
                  aria-label="Remove promo code"
                  className="text-muted hover:text-rust cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="h-3.5 w-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Promo code (e.g. WELCOME10)"
                    aria-label="Promo code"
                    className="w-full border border-stone-border bg-alabaster pl-9 pr-3 py-2.5 text-xs uppercase tracking-wider text-espresso focus:border-terracotta focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={promoLoading || !promoInput.trim()}
                  className="bg-espresso text-alabaster px-4 py-2.5 text-xs uppercase tracking-[0.14em] hover:bg-roast disabled:opacity-50 cursor-pointer"
                >
                  {promoLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </button>
              </form>
            )}
            {promoError && (
              <p role="alert" className="mt-2 text-xs text-rust">
                {promoError}
              </p>
            )}
          </div>

          {/* Totals */}
          <dl className="pt-4 border-t border-stone-border space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-medium text-espresso">
                {formatCurrency(subtotal, settings.currencyCode)}
              </dd>
            </div>
            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-terracotta">
                <dt>Discount ({appliedPromo?.code})</dt>
                <dd className="font-medium">
                  -{formatCurrency(discountAmount, settings.currencyCode)}
                </dd>
              </div>
            )}
            <div className="flex items-center justify-between">
              <dt className="text-muted">
                Delivery ({deliveryZone === "METRO" ? "Metro" : "National"})
              </dt>
              <dd
                className={
                  qualifiesFreeShipping
                    ? "font-semibold text-terracotta"
                    : "font-medium text-espresso"
                }
              >
                {qualifiesFreeShipping
                  ? "FREE"
                  : formatCurrency(deliveryFee, settings.currencyCode)}
              </dd>
            </div>
            <div className="pt-3 border-t border-stone-border flex items-center justify-between text-lg font-semibold text-espresso">
              <dt>Grand Total</dt>
              <dd>{formatCurrency(grandTotal, settings.currencyCode)}</dd>
            </div>
          </dl>

          <p className="text-[11px] text-muted leading-relaxed">
            Final pricing, stock reservation, and promo eligibility are verified
            atomically on our servers at placement.
          </p>
        </aside>
      </div>
    </div>
  );
}
