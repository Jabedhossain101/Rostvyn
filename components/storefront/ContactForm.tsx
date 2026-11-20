"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";

export function ContactForm() {
  const [inquiryType, setInquiryType] = useState<"SUPPORT" | "WHOLESALE">(
    "SUPPORT"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setFeedback(null);

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          inquiryType,
          message,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setFeedback(data.error || "Please check your details and try again.");
        return;
      }

      setStatus("success");
      setFeedback(data.message);
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch {
      setStatus("error");
      setFeedback("Network error. Please try again.");
    }
  }

  return (
    <div className="border border-stone-border bg-surface p-7 sm:p-10">
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-terracotta mb-2">
          Direct Roastery Desk
        </p>
        <h2 className="font-serif text-3xl font-medium text-espresso">
          Send an Inquiry
        </h2>
      </div>

      {status === "success" ? (
        <div className="flex items-start gap-3 border border-terracotta/30 bg-linen p-5 text-sm text-espresso">
          <CheckCircle2 className="h-5 w-5 text-terracotta shrink-0 mt-0.5" />
          <div>
            <p className="font-medium mb-1">Inquiry Received</p>
            <p className="text-muted">{feedback}</p>
            <button
              type="button"
              onClick={() => setStatus("idle")}
              className="mt-4 text-xs uppercase tracking-[0.14em] text-terracotta hover:underline cursor-pointer"
            >
              Send Another Message
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Inquiry Type Tabs */}
          <div>
            <span className="block text-xs uppercase tracking-[0.14em] text-roast mb-2">
              Inquiry Type
            </span>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { value: "SUPPORT", label: "Customer Concierge" },
                  { value: "WHOLESALE", label: "Wholesale & Cafés" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setInquiryType(opt.value)}
                  className={`py-3 px-4 text-xs uppercase tracking-[0.14em] border transition-colors cursor-pointer ${
                    inquiryType === opt.value
                      ? "border-espresso bg-espresso text-alabaster"
                      : "border-stone-border bg-alabaster text-roast hover:border-espresso"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="contact-name"
                className="block text-xs uppercase tracking-[0.14em] text-roast mb-1.5"
              >
                Full Name *
              </label>
              <input
                id="contact-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Clara Jensen"
                className="w-full border border-stone-border bg-alabaster px-4 py-3 text-sm text-espresso focus:border-terracotta focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="contact-email"
                className="block text-xs uppercase tracking-[0.14em] text-roast mb-1.5"
              >
                Email Address *
              </label>
              <input
                id="contact-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="clara@studio.com"
                className="w-full border border-stone-border bg-alabaster px-4 py-3 text-sm text-espresso focus:border-terracotta focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="contact-phone"
              className="block text-xs uppercase tracking-[0.14em] text-roast mb-1.5"
            >
              Phone (Optional)
            </label>
            <input
              id="contact-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 234-5678"
              className="w-full border border-stone-border bg-alabaster px-4 py-3 text-sm text-espresso focus:border-terracotta focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="contact-message"
              className="block text-xs uppercase tracking-[0.14em] text-roast mb-1.5"
            >
              Message *
            </label>
            <textarea
              id="contact-message"
              rows={5}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                inquiryType === "WHOLESALE"
                  ? "Tell us about your café, office, or hospitality volume and preferred roast profiles..."
                  : "Include your Order Reference (RV-...) if inquiring about an existing order..."
              }
              className="w-full border border-stone-border bg-alabaster px-4 py-3 text-sm text-espresso focus:border-terracotta focus:outline-none"
            />
          </div>

          {status === "error" && feedback && (
            <p role="alert" className="text-xs text-rust">
              {feedback}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-espresso text-alabaster px-8 py-3.5 text-xs uppercase tracking-[0.18em] font-medium hover:bg-roast disabled:opacity-60 transition-colors cursor-pointer"
          >
            {status === "submitting" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send Inquiry
          </button>
        </form>
      )}
    </div>
  );
}
