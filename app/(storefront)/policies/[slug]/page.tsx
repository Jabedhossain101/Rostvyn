import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicSettings, type PolicyTexts } from "@/lib/storefront";

export const dynamic = "force-dynamic";

type PolicySlug = keyof PolicyTexts;

const POLICY_META: Record<
  PolicySlug,
  { title: string; eyebrow: string; fallback: string }
> = {
  privacy: {
    title: "Privacy Policy",
    eyebrow: "Data Protection & Privacy",
    fallback:
      "Rostvyn collects only the personal details required to roast, dispatch, and support your order. We never sell customer data to third parties.",
  },
  terms: {
    title: "Terms of Service",
    eyebrow: "Storefront Agreement",
    fallback:
      "All orders are subject to availability and verification. Manual bank transfer orders are confirmed once our team verifies the submitted Transaction Reference (TrxID).",
  },
  returns: {
    title: "Returns & Freshness Guarantee",
    eyebrow: "Quality Promise",
    fallback:
      "Because coffee is roasted to order, opened bags cannot be returned. Damaged or unsatisfactory deliveries are replaced promptly when reported within 14 days.",
  },
  shipping: {
    title: "Shipping & Roast Schedule",
    eyebrow: "Dispatch & Delivery",
    fallback:
      "Small-batch orders are roasted every Tuesday and Friday and dispatched via tracked metro or national courier.",
  },
};

function isValidPolicySlug(slug: string): slug is PolicySlug {
  return slug in POLICY_META;
}

interface PolicyPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PolicyPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!isValidPolicySlug(slug)) {
    return { title: "Policy Not Found" };
  }
  return {
    title: POLICY_META[slug].title,
    description: `${POLICY_META[slug].title} for Rostvyn Specialty Coffee & Artisan Roastery.`,
  };
}

export default async function PolicyPage({ params }: PolicyPageProps) {
  const { slug } = await params;
  if (!isValidPolicySlug(slug)) {
    notFound();
  }

  const settings = await getPublicSettings();
  const meta = POLICY_META[slug];
  const policyBody = settings.policyTexts[slug] || meta.fallback;
  const paragraphs = policyBody
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <>
      <section className="bg-linen border-b border-stone-border">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <p className="text-[11px] uppercase tracking-[0.24em] text-terracotta mb-3">
            {meta.eyebrow}
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-medium text-espresso">
            {meta.title}
          </h1>
        </div>
      </section>

      <section className="py-14 lg:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="border border-stone-border bg-surface p-8 sm:p-12 space-y-6 text-sm sm:text-base text-roast leading-relaxed">
            {paragraphs.map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}

            <div className="pt-6 border-t border-stone-border text-xs text-muted space-y-1">
              <p className="font-medium text-espresso">{settings.storeName} Roastery</p>
              {settings.address && <p>{settings.address}</p>}
              {settings.contactEmail && (
                <p>
                  Questions? Email{" "}
                  <a
                    href={`mailto:${settings.contactEmail}`}
                    className="text-terracotta hover:underline"
                  >
                    {settings.contactEmail}
                  </a>
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 text-xs uppercase tracking-[0.14em] text-muted">
            {(["shipping", "returns", "privacy", "terms"] as PolicySlug[]).map(
              (key) => (
                <Link
                  key={key}
                  href={`/policies/${key}`}
                  className={
                    key === slug
                      ? "text-espresso font-semibold underline underline-offset-4"
                      : "hover:text-terracotta transition-colors"
                  }
                >
                  {POLICY_META[key].title}
                </Link>
              )
            )}
          </div>
        </div>
      </section>
    </>
  );
}
