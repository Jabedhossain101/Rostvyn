const FULFILLMENT_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-900 border-amber-300",
  CONFIRMED: "bg-sky-100 text-sky-900 border-sky-300",
  PROCESSING: "bg-indigo-100 text-indigo-900 border-indigo-300",
  SHIPPED: "bg-violet-100 text-violet-900 border-violet-300",
  DELIVERED: "bg-emerald-100 text-emerald-900 border-emerald-300",
  CANCELLED: "bg-rose-100 text-rose-900 border-rose-300",
};

const PAYMENT_STYLES: Record<string, string> = {
  PENDING_VERIFICATION: "bg-amber-100 text-amber-900 border-amber-300",
  VERIFIED: "bg-emerald-100 text-emerald-900 border-emerald-300",
  PAID: "bg-emerald-100 text-emerald-900 border-emerald-300",
  REJECTED: "bg-rose-100 text-rose-900 border-rose-300",
  REFUNDED: "bg-stone-200 text-stone-800 border-stone-300",
};

export function FulfillmentBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
        FULFILLMENT_STYLES[status] ?? "bg-linen text-espresso border-stone-border"
      }`}
    >
      {status}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
        PAYMENT_STYLES[status] ?? "bg-linen text-espresso border-stone-border"
      }`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
