import { Suspense } from "react";
import type { Metadata } from "next";
import { getPublicSettings } from "@/lib/storefront";
import { OrderTrackClient } from "@/components/track/OrderTrackClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Track Your Order",
  description:
    "Check live payment verification and roasting/dispatch progress using your Rostvyn Order Reference and phone number.",
};

export default async function TrackOrderPage() {
  const settings = await getPublicSettings();

  return (
    <>
      <section className="bg-linen border-b border-stone-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-14 sm:py-18">
          <p className="text-[11px] uppercase tracking-[0.24em] text-terracotta mb-2.5">
            Live Roastery Fulfillment
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-medium text-espresso mb-3">
            Track Your Order
          </h1>
          <p className="text-sm sm:text-base text-muted leading-relaxed">
            Follow your coffee from payment verification and small-batch
            roasting to doorstep delivery.
          </p>
        </div>
      </section>

      <Suspense
        fallback={
          <div className="mx-auto max-w-4xl px-4 py-16 text-sm text-muted">
            Loading order tracker...
          </div>
        }
      >
        <OrderTrackClient currencyCode={settings.currencyCode} />
      </Suspense>
    </>
  );
}
