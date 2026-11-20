import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Flame,
  MapPin,
  PackageCheck,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getPublicSettings } from "@/lib/storefront";
import { formatCurrency } from "@/lib/utils";
import { CopyOrderRefButton } from "@/components/checkout/CopyOrderRefButton";

export const dynamic = "force-dynamic";

interface ConfirmationPageProps {
  params: Promise<{ ref: string }>;
}

export async function generateMetadata({
  params,
}: ConfirmationPageProps): Promise<Metadata> {
  const { ref } = await params;
  return {
    title: `Order Confirmed — ${decodeURIComponent(ref)}`,
    robots: { index: false, follow: false },
  };
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  COD: "Cash on Delivery (COD)",
  MANUAL_TRANSFER: "Manual Bank Transfer (IBAN / Wire / PayID)",
  MFS: "Mobile Financial Transfer",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING_VERIFICATION: "Pending Verification",
  VERIFIED: "Verified",
  PAID: "Paid",
  REJECTED: "Rejected",
  REFUNDED: "Refunded",
};

export default async function OrderConfirmationPage({
  params,
}: ConfirmationPageProps) {
  const { ref } = await params;
  const normalizedRef = decodeURIComponent(ref).trim().toUpperCase();

  const [order, settings] = await Promise.all([
    prisma.order.findUnique({
      where: { orderRef: normalizedRef },
      include: {
        items: true,
        payment: true,
      },
    }),
    getPublicSettings(),
  ]);

  if (!order) {
    notFound();
  }

  const isManualTransfer =
    order.payment?.method === "MANUAL_TRANSFER" ||
    order.payment?.method === "MFS";

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
      {/* Refined Confirmation Header */}
      <div className="border border-stone-border bg-surface p-8 sm:p-12 text-center mb-8">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-linen border border-stone-border text-terracotta mb-5">
          <CheckCircle2 className="h-6 w-6" strokeWidth={1.75} />
        </div>

        <p className="text-[11px] uppercase tracking-[0.24em] text-terracotta mb-2">
          Order Received • Thank You, {order.customerName}
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl font-medium text-espresso mb-4">
          Your Roast Is Queued
        </h1>
        <p className="text-sm text-muted max-w-xl mx-auto leading-relaxed mb-7">
          Save your unique Order Reference below. You can track payment
          verification and dispatch milestones anytime using this reference and
          your mobile number.
        </p>

        <div className="inline-flex flex-wrap items-center justify-center gap-3 border border-stone-border bg-linen px-5 py-3">
          <span className="text-xs uppercase tracking-[0.16em] text-muted">
            Order Reference
          </span>
          <span className="font-mono text-base sm:text-lg font-semibold text-espresso">
            {order.orderRef}
          </span>
          <CopyOrderRefButton orderRef={order.orderRef} />
        </div>
      </div>

      {/* Payment Verification Notice (for Manual Bank Transfers) */}
      {isManualTransfer && order.payment && (
        <div className="border border-terracotta/40 bg-linen p-6 sm:p-8 mb-8">
          <div className="flex items-start gap-3.5">
            <Building2 className="h-5 w-5 text-terracotta shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              <h2 className="font-serif text-2xl font-medium text-espresso">
                Bank Transfer Verification In Progress
              </h2>
              <p className="text-roast leading-relaxed">
                We have recorded your submitted Transaction Reference{" "}
                <span className="font-mono font-semibold text-espresso">
                  {order.payment.trxId || "—"}
                </span>{" "}
                from{" "}
                <strong className="text-espresso">
                  {order.payment.senderAccount || "your account"}
                </strong>
                . Our operations team will verify your transfer and update your
                order status to <strong>Confirmed</strong> shortly.
              </p>
              <p className="text-xs text-muted">
                Payment Status:{" "}
                <span className="font-semibold text-terracotta uppercase tracking-wider">
                  {PAYMENT_STATUS_LABELS[order.payment.status] ??
                    order.payment.status}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Next-Step Roast & Dispatch Estimate + Delivery Address */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="border border-stone-border bg-surface p-6 space-y-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-terracotta">
            <Flame className="h-4 w-4" />
            Roast &amp; Dispatch Estimate
          </div>
          <p className="text-sm text-roast leading-relaxed">
            Small-batch production runs every{" "}
            <strong className="text-espresso">
              {settings.storyData.roastDays}
            </strong>
            . Once confirmed, your coffee is roasted, rested, and dispatched via
            tracked courier (1–2 business days Metro, 3–5 business days
            National).
          </p>
          <p className="inline-flex items-center gap-1.5 text-xs text-muted">
            <Clock className="h-3.5 w-3.5" />
            Placed on{" "}
            {new Intl.DateTimeFormat("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(order.createdAt)}
          </p>
        </div>

        <div className="border border-stone-border bg-surface p-6 space-y-2 text-sm">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-terracotta mb-1">
            <MapPin className="h-4 w-4" />
            Delivery &amp; Payment Summary
          </div>
          <p className="font-medium text-espresso">{order.customerName}</p>
          <p className="text-roast">{order.address}</p>
          <p className="text-roast">{order.city}</p>
          <p className="text-xs text-muted pt-1">
            Phone: {order.customerPhone}
            {order.customerEmail ? ` • ${order.customerEmail}` : ""}
          </p>
          {order.payment && (
            <p className="text-xs text-muted">
              Method:{" "}
              <span className="text-espresso font-medium">
                {PAYMENT_METHOD_LABELS[order.payment.method] ??
                  order.payment.method}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Immutable Itemized Invoice */}
      <div className="border border-stone-border bg-surface p-6 sm:p-8 mb-10">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-roast mb-5">
          <PackageCheck className="h-4 w-4 text-terracotta" />
          Itemized Invoice Snapshot
        </div>

        <div className="divide-y divide-stone-border">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="py-4 flex items-start justify-between gap-4 text-sm"
            >
              <div>
                <p className="font-serif text-lg font-medium text-espresso">
                  {item.productNameSnapshot}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {item.variantSnapshot} • SKU {item.skuSnapshot}
                </p>
                <p className="text-xs text-roast mt-1">
                  {item.quantity} ×{" "}
                  {formatCurrency(
                    Number(item.unitPriceSnapshot),
                    settings.currencyCode
                  )}
                </p>
              </div>
              <p className="font-semibold text-espresso shrink-0">
                {formatCurrency(
                  Number(item.unitPriceSnapshot) * item.quantity,
                  settings.currencyCode
                )}
              </p>
            </div>
          ))}
        </div>

        <dl className="mt-6 pt-5 border-t border-stone-border space-y-2.5 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="text-espresso font-medium">
              {formatCurrency(Number(order.subtotal), settings.currencyCode)}
            </dd>
          </div>
          {Number(order.discountAmount) > 0 && (
            <div className="flex items-center justify-between text-terracotta">
              <dt>
                Promo Discount
                {order.promoCodeUsed ? ` (${order.promoCodeUsed})` : ""}
              </dt>
              <dd className="font-medium">
                -
                {formatCurrency(
                  Number(order.discountAmount),
                  settings.currencyCode
                )}
              </dd>
            </div>
          )}
          <div className="flex items-center justify-between">
            <dt className="text-muted">Delivery Fee</dt>
            <dd className="text-espresso font-medium">
              {Number(order.deliveryFee) === 0
                ? "FREE"
                : formatCurrency(
                    Number(order.deliveryFee),
                    settings.currencyCode
                  )}
            </dd>
          </div>
          <div className="pt-3 border-t border-stone-border flex items-center justify-between text-lg font-semibold text-espresso">
            <dt>Grand Total</dt>
            <dd>
              {formatCurrency(Number(order.totalAmount), settings.currencyCode)}
            </dd>
          </div>
        </dl>
      </div>

      {/* Action CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href={`/track?ref=${encodeURIComponent(order.orderRef)}`}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-espresso text-alabaster px-8 py-4 text-xs uppercase tracking-[0.18em] font-medium hover:bg-roast transition-colors"
        >
          Track This Order
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/shop"
          className="w-full sm:w-auto inline-flex items-center justify-center border border-stone-border bg-surface text-espresso px-8 py-4 text-xs uppercase tracking-[0.18em] hover:border-espresso transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
