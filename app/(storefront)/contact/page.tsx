import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone, Building2 } from "lucide-react";
import { getPublicSettings } from "@/lib/storefront";
import { ContactForm } from "@/components/storefront/ContactForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact & Wholesale",
  description:
    "Reach Rostvyn customer concierge for order support or inquire about specialty coffee wholesale partnerships for cafés, studios, and hospitality.",
};

export default async function ContactPage() {
  const settings = await getPublicSettings();

  return (
    <>
      <section className="bg-linen border-b border-stone-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <p className="text-[11px] uppercase tracking-[0.24em] text-terracotta mb-3">
            Concierge &amp; Partnerships
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-medium text-espresso mb-4">
            Contact &amp; Wholesale
          </h1>
          <p className="text-sm sm:text-base text-muted max-w-2xl leading-relaxed">
            Whether you need help dialing in a single-origin pour-over, checking
            a bank transfer verification, or partnering with Rostvyn for your
            café or workplace, we&apos;re here.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Roastery Info */}
          <div className="lg:col-span-5 space-y-8">
            <div className="border border-stone-border bg-surface p-8 space-y-6">
              <h2 className="font-serif text-2xl font-medium text-espresso">
                Roastery Details
              </h2>

              <div className="space-y-4 text-sm text-roast">
                {settings.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-terracotta shrink-0 mt-1" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-muted">
                        Roastery HQ
                      </p>
                      <p className="mt-0.5">{settings.address}</p>
                    </div>
                  </div>
                )}

                {settings.contactEmail && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-terracotta shrink-0 mt-1" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-muted">
                        Email
                      </p>
                      <a
                        href={`mailto:${settings.contactEmail}`}
                        className="mt-0.5 block hover:text-terracotta transition-colors"
                      >
                        {settings.contactEmail}
                      </a>
                    </div>
                  </div>
                )}

                {settings.contactPhone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-terracotta shrink-0 mt-1" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-muted">
                        Telephone
                      </p>
                      <p className="mt-0.5">{settings.contactPhone}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-terracotta shrink-0 mt-1" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-muted">
                      Roasting &amp; Support Hours
                    </p>
                    <p className="mt-0.5">
                      Monday – Friday, 8:30 AM – 5:30 PM
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      Production Roast Days: {settings.storyData.roastDays}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-stone-border bg-linen p-8">
              <Building2 className="h-5 w-5 text-terracotta mb-3" />
              <h3 className="font-serif text-2xl font-medium text-espresso mb-2">
                Wholesale Program
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                We supply specialty cafés, boutique hotels, and design studios
                with custom espresso calibration, 1kg–5kg standing orders, and
                seasonal single-origin rotations. Select{" "}
                <strong className="text-espresso">Wholesale &amp; Cafés</strong>{" "}
                on the form to request a sample box.
              </p>
            </div>
          </div>

          {/* Validated Inquiry Form */}
          <div className="lg:col-span-7">
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
