"use client";

import { useState } from "react";
import { Check, Download, Star, X } from "lucide-react";

export interface AdminReviewRow {
  id: string;
  productName: string;
  authorName: string;
  rating: number;
  comment: string;
  status: string;
  isFeatured: boolean;
  createdAt: string;
}

export interface AdminInquiryRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  inquiryType: string;
  message: string;
  status: string;
  createdAt: string;
}

export interface AdminSubscriberRow {
  id: string;
  email: string;
  source: string;
  subscribedAt: string;
}

export function ReviewsHubClient({
  initialReviews,
  initialInquiries,
  initialSubscribers,
}: {
  initialReviews: AdminReviewRow[];
  initialInquiries: AdminInquiryRow[];
  initialSubscribers: AdminSubscriberRow[];
}) {
  const [tab, setTab] = useState<"reviews" | "inquiries" | "newsletter">(
    "reviews"
  );
  const [reviews, setReviews] = useState(initialReviews);
  const [inquiries, setInquiries] = useState(initialInquiries);

  async function moderateReview(
    id: string,
    patch: { status?: "APPROVED" | "REJECTED"; isFeatured?: boolean }
  ) {
    const res = await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    if (res.ok) {
      const updated = await res.json();
      setReviews((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: updated.status, isFeatured: updated.isFeatured }
            : r
        )
      );
    }
  }

  async function updateInquiryStatus(
    id: string,
    status: "NEW" | "REPLIED" | "ARCHIVED"
  ) {
    const res = await fetch("/api/admin/inquiries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setInquiries((prev) =>
        prev.map((inq) => (inq.id === id ? { ...inq, status } : inq))
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-terracotta font-semibold">
            Community &amp; Concierge
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-espresso">
            Reviews, Inquiries &amp; Newsletter
          </h1>
        </div>
      </div>

      {/* 3-Tab Switcher */}
      <div className="flex flex-wrap gap-2 border-b border-stone-border pb-4">
        {[
          { key: "reviews", label: `Product Reviews (${reviews.length})` },
          {
            key: "inquiries",
            label: `Support & Wholesale (${inquiries.length})`,
          },
          {
            key: "newsletter",
            label: `Newsletter Subscribers (${initialSubscribers.length})`,
          },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() =>
              setTab(t.key as "reviews" | "inquiries" | "newsletter")
            }
            className={`px-4 py-2 text-xs uppercase tracking-wider border cursor-pointer ${
              tab === t.key
                ? "border-espresso bg-espresso text-alabaster"
                : "border-stone-border bg-surface text-roast hover:border-espresso"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Product Reviews */}
      {tab === "reviews" && (
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="border border-stone-border bg-surface p-10 text-center text-muted text-sm">
              No product reviews submitted yet.
            </div>
          ) : (
            reviews.map((r) => (
              <article
                key={r.id}
                className="border border-stone-border bg-surface p-5 flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-semibold text-sm text-espresso">
                      {r.authorName}
                    </span>
                    <span className="text-xs text-muted">on {r.productName}</span>
                    <span className="inline-flex items-center gap-0.5 text-xs text-terracotta font-semibold">
                      <Star className="h-3.5 w-3.5 fill-terracotta" />
                      {r.rating}/5
                    </span>
                    <span
                      className={`border px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold ${
                        r.status === "APPROVED"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                          : r.status === "REJECTED"
                          ? "border-rose-300 bg-rose-50 text-rose-800"
                          : "border-amber-300 bg-amber-50 text-amber-800"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <p className="text-sm text-roast leading-relaxed">
                    {r.comment}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => moderateReview(r.id, { status: "APPROVED" })}
                    className="inline-flex items-center gap-1 border border-emerald-300 bg-emerald-50 text-emerald-900 px-3 py-1.5 text-xs uppercase tracking-wider hover:bg-emerald-100 cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => moderateReview(r.id, { status: "REJECTED" })}
                    className="inline-flex items-center gap-1 border border-rose-300 bg-rose-50 text-rose-900 px-3 py-1.5 text-xs uppercase tracking-wider hover:bg-rose-100 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      moderateReview(r.id, { isFeatured: !r.isFeatured })
                    }
                    className={`inline-flex items-center gap-1 border px-3 py-1.5 text-xs uppercase tracking-wider cursor-pointer ${
                      r.isFeatured
                        ? "border-terracotta bg-terracotta text-alabaster"
                        : "border-stone-border bg-alabaster text-roast hover:border-espresso"
                    }`}
                  >
                    <Star className="h-3.5 w-3.5" />
                    {r.isFeatured ? "Featured" : "Feature"}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Support & Wholesale Inquiries */}
      {tab === "inquiries" && (
        <div className="space-y-4">
          {inquiries.length === 0 ? (
            <div className="border border-stone-border bg-surface p-10 text-center text-muted text-sm">
              No inquiries received yet.
            </div>
          ) : (
            inquiries.map((inq) => (
              <article
                key={inq.id}
                className="border border-stone-border bg-surface p-5 flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="bg-linen border border-stone-border px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold text-terracotta">
                      {inq.inquiryType}
                    </span>
                    <span className="font-semibold text-sm text-espresso">
                      {inq.name}
                    </span>
                    <span className="text-xs text-muted">
                      {inq.email}
                      {inq.phone ? ` • ${inq.phone}` : ""}
                    </span>
                  </div>
                  <p className="text-sm text-roast leading-relaxed">
                    {inq.message}
                  </p>
                </div>

                <select
                  value={inq.status}
                  onChange={(e) =>
                    updateInquiryStatus(
                      inq.id,
                      e.target.value as "NEW" | "REPLIED" | "ARCHIVED"
                    )
                  }
                  className="border border-stone-border bg-alabaster px-3 py-2 text-xs uppercase tracking-wider text-espresso shrink-0 self-start"
                >
                  <option value="NEW">NEW</option>
                  <option value="REPLIED">REPLIED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </article>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Newsletter Subscribers */}
      {tab === "newsletter" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <a
              href="/api/admin/newsletter?format=csv"
              className="inline-flex items-center gap-2 bg-espresso text-alabaster px-4 py-2.5 text-xs uppercase tracking-[0.14em] hover:bg-roast"
            >
              <Download className="h-3.5 w-3.5" />
              Download CSV
            </a>
          </div>

          <div className="border border-stone-border bg-surface overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-stone-border bg-linen/70 text-[11px] uppercase tracking-[0.14em] text-roast">
                  <th className="py-3.5 px-5 font-semibold">Email</th>
                  <th className="py-3.5 px-5 font-semibold">Source</th>
                  <th className="py-3.5 px-5 font-semibold">Subscribed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-border">
                {initialSubscribers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-10 text-center text-muted">
                      No newsletter subscribers yet.
                    </td>
                  </tr>
                ) : (
                  initialSubscribers.map((s) => (
                    <tr key={s.id} className="hover:bg-alabaster/70">
                      <td className="py-3.5 px-5 font-medium text-espresso">
                        {s.email}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-muted">
                        {s.source}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-muted">
                        {new Date(s.subscribedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
