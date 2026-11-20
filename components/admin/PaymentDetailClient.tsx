"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2, ShieldAlert, XCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PaymentStatusBadge } from "@/components/admin/AdminBadges";

export interface AdminPaymentDetail {
  id: string;
  orderId: string;
  orderRef: string;
  customerName: string;
  customerPhone: string;
  method: string;
  status: string;
  amount: number;
  trxId: string | null;
  senderAccount: string | null;
  auditNote: string | null;
  verifiedAt: string | null;
  verifiedByName: string | null;
  createdAt: string;
}

export function PaymentDetailClient({
  payment: initialPayment,
  currencyCode,
}: {
  payment: AdminPaymentDetail;
  currencyCode: string;
}) {
  const router = useRouter();
  const [payment, setPayment] = useState(initialPayment);
  const [auditNote, setAuditNote] = useState(initialPayment.auditNote ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function submitDecision(status: "VERIFIED" | "PAID" | "REJECTED") {
    setSaving(true);
    setError(null);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/payments/${payment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, auditNote }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to record payment decision.");
        return;
      }

      setPayment((prev) => ({
        ...prev,
        status: data.status,
        auditNote: data.auditNote,
        verifiedAt: data.verifiedAt,
        verifiedByName: data.verifiedBy?.name ?? prev.verifiedByName,
      }));
      setFeedback(`Payment status updated to ${data.status}.`);
      router.refresh();
    } catch {
      setError("Network error while updating payment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link
          href="/admin/payments"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-muted hover:text-espresso mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Payment Ledger
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-terracotta font-semibold">
              Payment Audit Detail
            </p>
            <h1 className="font-mono text-2xl sm:text-3xl font-semibold text-espresso mt-0.5">
              {payment.orderRef}
            </h1>
          </div>
          <PaymentStatusBadge status={payment.status} />
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Submission Details */}
        <section className="border border-stone-border bg-surface p-6 space-y-3 text-sm">
          <h2 className="font-serif text-2xl font-medium text-espresso mb-2">
            Submitted Payment Evidence
          </h2>
          <dl className="space-y-2.5 text-xs">
            <div className="flex justify-between">
              <dt className="text-muted">Order</dt>
              <dd>
                <Link
                  href={`/admin/orders/${payment.orderId}`}
                  className="font-mono font-semibold text-terracotta hover:underline"
                >
                  {payment.orderRef}
                </Link>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Customer</dt>
              <dd className="text-espresso font-medium">
                {payment.customerName} ({payment.customerPhone})
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Amount Due</dt>
              <dd className="text-base font-semibold text-espresso">
                {formatCurrency(payment.amount, currencyCode)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Method</dt>
              <dd className="font-medium text-espresso">{payment.method}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Transaction Ref (TrxID)</dt>
              <dd className="font-mono font-semibold text-terracotta">
                {payment.trxId || "N/A"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Sender Account</dt>
              <dd className="text-espresso">{payment.senderAccount || "N/A"}</dd>
            </div>
          </dl>

          {payment.verifiedByName && (
            <div className="pt-4 mt-4 border-t border-stone-border text-xs text-muted space-y-1">
              <p>
                Last audited by{" "}
                <strong className="text-espresso">
                  {payment.verifiedByName}
                </strong>
              </p>
              {payment.verifiedAt && (
                <p className="font-mono">
                  {new Date(payment.verifiedAt).toISOString()}
                </p>
              )}
            </div>
          )}
        </section>

        {/* Audit Actions */}
        <section className="border border-stone-border bg-surface p-6 space-y-4">
          <h2 className="font-serif text-2xl font-medium text-espresso">
            Audit Decision
          </h2>
          <div>
            <label className="block text-xs uppercase tracking-wider text-roast mb-1.5">
              Audit Note (Required for Rejection)
            </label>
            <textarea
              rows={4}
              value={auditNote}
              onChange={(e) => setAuditNote(e.target.value)}
              placeholder="Matched bank statement entry #... or reason for rejection..."
              className="w-full border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm text-espresso"
            />
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => submitDecision("VERIFIED")}
              className="w-full inline-flex items-center justify-center gap-2 bg-emerald-800 text-alabaster py-3 px-4 text-xs uppercase tracking-[0.16em] font-medium hover:bg-emerald-900 disabled:opacity-60 cursor-pointer"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Approve &amp; Verify Transfer
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => submitDecision("PAID")}
              className="w-full inline-flex items-center justify-center gap-2 bg-espresso text-alabaster py-3 px-4 text-xs uppercase tracking-[0.16em] font-medium hover:bg-roast disabled:opacity-60 cursor-pointer"
            >
              <ShieldAlert className="h-4 w-4" />
              Mark COD / Payment Settled (PAID)
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => submitDecision("REJECTED")}
              className="w-full inline-flex items-center justify-center gap-2 border border-rust text-rust py-3 px-4 text-xs uppercase tracking-[0.16em] font-medium hover:bg-rust hover:text-alabaster disabled:opacity-60 cursor-pointer"
            >
              <XCircle className="h-4 w-4" />
              Reject Payment
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
