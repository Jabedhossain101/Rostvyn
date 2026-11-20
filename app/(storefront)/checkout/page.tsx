import type { Metadata } from "next";
import { getPublicSettings } from "@/lib/storefront";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Guest Checkout",
  description:
    "Complete your Rostvyn specialty coffee order with Cash on Delivery or Manual Bank Transfer.",
};

export default async function CheckoutPage() {
  const settings = await getPublicSettings();

  return (
    <>
      <section className="bg-linen border-b border-stone-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
          <p className="text-[11px] uppercase tracking-[0.24em] text-terracotta mb-2">
            Streamlined Guest Checkout
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-medium text-espresso">
            Complete Your Order
          </h1>
        </div>
      </section>

      <CheckoutClient settings={settings} />
    </>
  );
}
