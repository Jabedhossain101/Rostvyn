import Link from "next/link";
import type { Metadata } from "next";
import { getPublicSettings } from "@/lib/storefront";
import { formatCurrency } from "@/lib/utils";
import {
  FaqAccordion,
  type FaqCategory,
} from "@/components/storefront/FaqAccordion";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Help & FAQs",
  description:
    "Answers to common questions about Rostvyn roast freshness, grind selection, shipping timelines, payment verification, and returns.",
};

export default async function FaqPage() {
  const settings = await getPublicSettings();
  const freeThreshold = formatCurrency(
    settings.freeShippingThreshold,
    settings.currencyCode
  );
  const metroFee = formatCurrency(
    settings.metroDeliveryFee,
    settings.currencyCode
  );
  const nationalFee = formatCurrency(
    settings.nationalDeliveryFee,
    settings.currencyCode
  );

  const faqCategories: FaqCategory[] = [
    {
      id: "freshness",
      title: "Roast Freshness & Grind Selection",
      items: [
        {
          question: "When is my coffee roasted?",
          answer: `All Rostvyn orders are roasted in small batches every ${settings.storyData.roastDays}. Orders placed before 12:00 PM on a roast day are roasted and dispatched the same evening, stamped with the exact roast date.`,
        },
        {
          question: "Should I choose Whole Bean or Pre-Ground?",
          answer:
            "If you own a burr grinder, Whole Bean retains peak aromatics longest. If you prefer convenience, we grind to order right before sealing for Filter/Pour-Over or Espresso.",
        },
        {
          question: "How long should I rest my coffee before brewing?",
          answer:
            "Filter roasts taste bright from day 3–5 post-roast and peak through week 4. Espresso blends benefit from 7–10 days of resting for smooth, stable extraction.",
        },
      ],
    },
    {
      id: "shipping",
      title: "Shipping Zones & Timelines",
      items: [
        {
          question: "What are your delivery rates and free shipping threshold?",
          answer: `Metro delivery is ${metroFee} (1–2 business days) and National/Regional delivery is ${nationalFee} (3–5 business days). Orders over ${freeThreshold} automatically receive complimentary tracked shipping.`,
        },
        {
          question: "Do you ship internationally across the EU, US, and Australia?",
          answer:
            "Yes. Our store supports multi-currency configuration (USD, EUR, GBP, AUD) and regional tracked courier dispatch.",
        },
      ],
    },
    {
      id: "payment",
      title: "Payment Methods & TrxID Verification",
      items: [
        {
          question: "Which payment methods does Rostvyn accept?",
          answer:
            "We accept Cash on Delivery (COD) for eligible zones as well as Manual Bank Transfer (IBAN/SEPA Wire and Australia PayID) verified via Transaction Reference (TrxID).",
        },
        {
          question: "How does Manual Bank Transfer verification work?",
          answer:
            "At checkout, select Manual Bank Transfer, transfer the exact order total to our roastery account using your Order Reference (RV-...) in the memo, and enter your TrxID. Our operations team verifies transfers promptly and advances your order to Confirmed.",
        },
      ],
    },
    {
      id: "order-tracking",
      title: "Order Tracking & Returns",
      items: [
        {
          question: "How can I track my order status?",
          answer:
            "Every guest order receives a unique Order Reference (RV-YYMMDD-XXXX). You can check live payment verification and fulfillment milestones using your Order Reference and phone number (our dedicated Order Tracker launches in Phase 3, or contact concierge@rostvyn.com anytime).",
        },
        {
          question: "What is your return and replacement policy?",
          answer:
            settings.policyTexts.returns ||
            "If your roast arrives damaged or below our sensory standards, contact our concierge within 14 days for a prompt replacement or refund.",
        },
      ],
    },
  ];

  return (
    <>
      <section className="bg-linen border-b border-stone-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <p className="text-[11px] uppercase tracking-[0.24em] text-terracotta mb-3">
            Concierge Support
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-medium text-espresso mb-4">
            Help &amp; Frequently Asked Questions
          </h1>
          <p className="text-sm sm:text-base text-muted leading-relaxed">
            Everything you need to know about our roast schedule, grind options,
            verified bank transfers, and delivery timelines.
          </p>
        </div>
      </section>

      <section className="py-14 lg:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <FaqAccordion categories={faqCategories} />

          <div className="mt-16 border border-stone-border bg-linen p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h2 className="font-serif text-2xl font-medium text-espresso">
                Still have a question?
              </h2>
              <p className="text-sm text-muted mt-1">
                Our roastery concierge responds within 24 hours.
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-block bg-espresso text-alabaster px-6 py-3 text-xs uppercase tracking-[0.16em] hover:bg-roast transition-colors text-center shrink-0"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
