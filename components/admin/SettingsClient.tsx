"use client";

import { useState, type FormEvent } from "react";
import { KeyRound, Loader2, Lock, Plus, Save, Trash2, UserPlus } from "lucide-react";
import type { PaymentAccountInfo, PublicStoreSettings } from "@/lib/storefront";

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "STAFF";
  isActive: boolean;
  lastLoginAt: string | null;
}

export function SettingsClient({
  initialSettings,
  initialStaff,
  currentAdminRole,
  currentAdminId,
}: {
  initialSettings: PublicStoreSettings;
  initialStaff: AdminUserRow[];
  currentAdminRole: "SUPER_ADMIN" | "STAFF";
  currentAdminId: string;
}) {
  const isSuperAdmin = currentAdminRole === "SUPER_ADMIN";
  const [tab, setTab] = useState<
    "profile" | "shipping" | "homepage" | "governance"
  >("profile");

  // Store Profile & Policies
  const [storeName, setStoreName] = useState(initialSettings.storeName);
  const [contactEmail, setContactEmail] = useState(
    initialSettings.contactEmail ?? ""
  );
  const [contactPhone, setContactPhone] = useState(
    initialSettings.contactPhone ?? ""
  );
  const [address, setAddress] = useState(initialSettings.address ?? "");
  const [policyShipping, setPolicyShipping] = useState(
    initialSettings.policyTexts.shipping ?? ""
  );
  const [policyReturns, setPolicyReturns] = useState(
    initialSettings.policyTexts.returns ?? ""
  );
  const [policyPrivacy, setPolicyPrivacy] = useState(
    initialSettings.policyTexts.privacy ?? ""
  );
  const [policyTerms, setPolicyTerms] = useState(
    initialSettings.policyTexts.terms ?? ""
  );

  // Shipping & Payments (SUPER_ADMIN only)
  const [currencyCode, setCurrencyCode] = useState(initialSettings.currencyCode);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(
    String(initialSettings.freeShippingThreshold)
  );
  const [metroDeliveryFee, setMetroDeliveryFee] = useState(
    String(initialSettings.metroDeliveryFee)
  );
  const [nationalDeliveryFee, setNationalDeliveryFee] = useState(
    String(initialSettings.nationalDeliveryFee)
  );
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccountInfo[]>(
    initialSettings.paymentAccounts
  );

  // Homepage Content
  const [announcementText, setAnnouncementText] = useState(
    initialSettings.announcementText ?? ""
  );
  const [heroEyebrow, setHeroEyebrow] = useState(
    initialSettings.heroData.eyebrow
  );
  const [heroHeadline, setHeroHeadline] = useState(
    initialSettings.heroData.headline
  );
  const [heroSubheadline, setHeroSubheadline] = useState(
    initialSettings.heroData.subheadline
  );
  const [heroCtaLabel, setHeroCtaLabel] = useState(
    initialSettings.heroData.ctaLabel
  );
  const [heroCtaHref, setHeroCtaHref] = useState(
    initialSettings.heroData.ctaHref
  );
  const [heroImageUrl, setHeroImageUrl] = useState(
    initialSettings.heroData.imageUrl
  );
  const [storyTitle, setStoryTitle] = useState(initialSettings.storyData.title);
  const [storyBody, setStoryBody] = useState(initialSettings.storyData.body);
  const [storyRoastDays, setStoryRoastDays] = useState(
    initialSettings.storyData.roastDays
  );

  // Access Governance (SUPER_ADMIN only)
  const [staff, setStaff] = useState(initialStaff);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffPassword, setNewStaffPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveSettings(payload: Record<string, unknown>, okMessage: string) {
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save settings.");
        return;
      }
      setFeedback(okMessage);
    } catch {
      setError("Network error while saving settings.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRotatePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rotateOwnPassword",
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Password update failed.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setFeedback("Your password has been updated.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateStaff(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newStaffName,
          email: newStaffEmail,
          password: newStaffPassword,
          role: "STAFF",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create staff account.");
        return;
      }
      setStaff((prev) => [
        ...prev,
        { ...data.user, lastLoginAt: null },
      ]);
      setNewStaffName("");
      setNewStaffEmail("");
      setNewStaffPassword("");
      setFeedback(`Staff account created for ${data.user.email}.`);
    } finally {
      setSaving(false);
    }
  }

  async function toggleStaffActive(user: AdminUserRow) {
    setError(null);
    const res = await fetch("/api/admin/staff", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "toggleActive",
        id: user.id,
        isActive: !user.isActive,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to update account.");
      return;
    }
    setStaff((prev) =>
      prev.map((u) =>
        u.id === user.id ? { ...u, isActive: !user.isActive } : u
      )
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-terracotta font-semibold">
          Configuration &amp; Governance
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-medium text-espresso">
          Store Settings
        </h1>
      </div>

      {/* 4 Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-stone-border pb-4">
        {[
          { key: "profile", label: "Store Profile" },
          { key: "shipping", label: "Shipping & Payments" },
          { key: "homepage", label: "Homepage Content" },
          { key: "governance", label: "Access Governance" },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => {
              setTab(t.key as "profile" | "shipping" | "homepage" | "governance");
              setFeedback(null);
              setError(null);
            }}
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

      {/* TAB 1: Store Profile & Policies */}
      {tab === "profile" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveSettings(
              {
                storeName,
                contactEmail,
                contactPhone,
                address,
                policyTexts: {
                  shipping: policyShipping,
                  returns: policyReturns,
                  privacy: policyPrivacy,
                  terms: policyTerms,
                },
              },
              "Store profile and policy texts saved."
            );
          }}
          className="border border-stone-border bg-surface p-6 space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-roast mb-1">
                Store Name
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-roast mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-roast mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-roast mb-1">
              Roastery Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-stone-border">
            {[
              { label: "Shipping Policy", val: policyShipping, set: setPolicyShipping },
              { label: "Returns Policy", val: policyReturns, set: setPolicyReturns },
              { label: "Privacy Policy", val: policyPrivacy, set: setPolicyPrivacy },
              { label: "Terms of Service", val: policyTerms, set: setPolicyTerms },
            ].map((field) => (
              <div key={field.label}>
                <label className="block text-xs uppercase tracking-wider text-roast mb-1">
                  {field.label}
                </label>
                <textarea
                  rows={4}
                  value={field.val}
                  onChange={(e) => field.set(e.target.value)}
                  className="w-full border border-stone-border bg-alabaster px-3 py-2 text-xs"
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-espresso text-alabaster px-6 py-3 text-xs uppercase tracking-[0.16em] hover:bg-roast disabled:opacity-60 cursor-pointer"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Store Profile
          </button>
        </form>
      )}

      {/* TAB 2: Shipping & Payments (SUPER_ADMIN ONLY) */}
      {tab === "shipping" && (
        <div className="border border-stone-border bg-surface p-6 space-y-6">
          {!isSuperAdmin ? (
            <div className="flex items-start gap-3 bg-linen border border-stone-border p-5 text-sm text-roast">
              <Lock className="h-5 w-5 text-terracotta shrink-0 mt-0.5" />
              <p>
                <strong>Super Admin Restricted:</strong> Financial settings,
                delivery fees, currency, and merchant bank receiving accounts
                can only be modified by a Super Admin.
              </p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveSettings(
                  {
                    currencyCode,
                    freeShippingThreshold: Number(freeShippingThreshold),
                    metroDeliveryFee: Number(metroDeliveryFee),
                    nationalDeliveryFee: Number(nationalDeliveryFee),
                    paymentAccounts,
                  },
                  "Financial settings and payment receiving accounts updated."
                );
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-roast mb-1">
                    Currency
                  </label>
                  <select
                    value={currencyCode}
                    onChange={(e) => setCurrencyCode(e.target.value)}
                    className="w-full border border-stone-border bg-alabaster px-3 py-2.5 text-sm"
                  >
                    {["USD", "EUR", "GBP", "AUD"].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-roast mb-1">
                    Free Shipping Threshold
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={freeShippingThreshold}
                    onChange={(e) => setFreeShippingThreshold(e.target.value)}
                    className="w-full border border-stone-border bg-alabaster px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-roast mb-1">
                    Metro Fee
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={metroDeliveryFee}
                    onChange={(e) => setMetroDeliveryFee(e.target.value)}
                    className="w-full border border-stone-border bg-alabaster px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-roast mb-1">
                    National Fee
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={nationalDeliveryFee}
                    onChange={(e) => setNationalDeliveryFee(e.target.value)}
                    className="w-full border border-stone-border bg-alabaster px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              {/* Merchant Payment Accounts */}
              <div className="pt-4 border-t border-stone-border space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-2xl font-medium text-espresso">
                    Merchant Bank / Transfer Accounts
                  </h2>
                  <button
                    type="button"
                    onClick={() =>
                      setPaymentAccounts((prev) => [
                        ...prev,
                        {
                          label: "New Bank Transfer Account",
                          bankName: "",
                          accountName: "Rostvyn Roastery",
                          accountNumber: "",
                          routingOrSwift: "",
                          instructions: "",
                        },
                      ])
                    }
                    className="inline-flex items-center gap-1.5 border border-stone-border px-3 py-1.5 text-xs uppercase tracking-wider cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Account
                  </button>
                </div>

                {paymentAccounts.map((acct, idx) => (
                  <div
                    key={idx}
                    className="border border-stone-border bg-alabaster p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-terracotta">
                        Account #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setPaymentAccounts((prev) =>
                            prev.filter((_, i) => i !== idx)
                          )
                        }
                        className="text-muted hover:text-rust cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        placeholder="Label (e.g. SEPA / Wire)"
                        value={acct.label}
                        onChange={(e) =>
                          setPaymentAccounts((prev) =>
                            prev.map((a, i) =>
                              i === idx ? { ...a, label: e.target.value } : a
                            )
                          )
                        }
                        className="border border-stone-border bg-surface px-3 py-2 text-xs"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Bank Name"
                        value={acct.bankName}
                        onChange={(e) =>
                          setPaymentAccounts((prev) =>
                            prev.map((a, i) =>
                              i === idx ? { ...a, bankName: e.target.value } : a
                            )
                          )
                        }
                        className="border border-stone-border bg-surface px-3 py-2 text-xs"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Account Holder Name"
                        value={acct.accountName}
                        onChange={(e) =>
                          setPaymentAccounts((prev) =>
                            prev.map((a, i) =>
                              i === idx
                                ? { ...a, accountName: e.target.value }
                                : a
                            )
                          )
                        }
                        className="border border-stone-border bg-surface px-3 py-2 text-xs"
                      />
                      <input
                        type="text"
                        required
                        placeholder="IBAN / Account / PayID"
                        value={acct.accountNumber}
                        onChange={(e) =>
                          setPaymentAccounts((prev) =>
                            prev.map((a, i) =>
                              i === idx
                                ? { ...a, accountNumber: e.target.value }
                                : a
                            )
                          )
                        }
                        className="border border-stone-border bg-surface px-3 py-2 text-xs font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-espresso text-alabaster px-6 py-3 text-xs uppercase tracking-[0.16em] hover:bg-roast disabled:opacity-60 cursor-pointer"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Financial Settings
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB 3: Homepage Content */}
      {tab === "homepage" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveSettings(
              {
                announcementText,
                heroData: {
                  eyebrow: heroEyebrow,
                  headline: heroHeadline,
                  subheadline: heroSubheadline,
                  ctaLabel: heroCtaLabel,
                  ctaHref: heroCtaHref,
                  imageUrl: heroImageUrl,
                },
                storyData: {
                  title: storyTitle,
                  body: storyBody,
                  roastDays: storyRoastDays,
                },
              },
              "Homepage editorial content saved."
            );
          }}
          className="border border-stone-border bg-surface p-6 space-y-5"
        >
          <div>
            <label className="block text-xs uppercase tracking-wider text-roast mb-1">
              Announcement Bar Text
            </label>
            <input
              type="text"
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              className="w-full border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm"
            />
          </div>

          <div className="pt-3 border-t border-stone-border space-y-3">
            <h2 className="font-serif text-2xl font-medium text-espresso">
              Editorial Hero Banner
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={heroEyebrow}
                onChange={(e) => setHeroEyebrow(e.target.value)}
                placeholder="Eyebrow"
                className="border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm"
              />
              <input
                type="url"
                value={heroImageUrl}
                onChange={(e) => setHeroImageUrl(e.target.value)}
                placeholder="Hero Image URL"
                className="border border-stone-border bg-alabaster px-3.5 py-2.5 text-xs font-mono"
              />
            </div>
            <input
              type="text"
              value={heroHeadline}
              onChange={(e) => setHeroHeadline(e.target.value)}
              placeholder="Hero Headline"
              className="w-full border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm"
            />
            <textarea
              rows={2}
              value={heroSubheadline}
              onChange={(e) => setHeroSubheadline(e.target.value)}
              placeholder="Hero Subheadline"
              className="w-full border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={heroCtaLabel}
                onChange={(e) => setHeroCtaLabel(e.target.value)}
                placeholder="CTA Label"
                className="border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm"
              />
              <input
                type="text"
                value={heroCtaHref}
                onChange={(e) => setHeroCtaHref(e.target.value)}
                placeholder="CTA Path (/shop)"
                className="border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm font-mono"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-stone-border space-y-3">
            <h2 className="font-serif text-2xl font-medium text-espresso">
              Origin &amp; Craft Story Block
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={storyTitle}
                onChange={(e) => setStoryTitle(e.target.value)}
                placeholder="Story Title"
                className="border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm"
              />
              <input
                type="text"
                value={storyRoastDays}
                onChange={(e) => setStoryRoastDays(e.target.value)}
                placeholder="Roast Days (Tuesday & Friday)"
                className="border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm"
              />
            </div>
            <textarea
              rows={3}
              value={storyBody}
              onChange={(e) => setStoryBody(e.target.value)}
              className="w-full border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-espresso text-alabaster px-6 py-3 text-xs uppercase tracking-[0.16em] hover:bg-roast disabled:opacity-60 cursor-pointer"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Homepage Content
          </button>
        </form>
      )}

      {/* TAB 4: Access Governance (SUPER_ADMIN ONLY) */}
      {tab === "governance" && (
        <div className="space-y-6">
          {!isSuperAdmin ? (
            <div className="border border-stone-border bg-surface p-6 flex items-start gap-3 text-sm text-roast">
              <Lock className="h-5 w-5 text-terracotta shrink-0 mt-0.5" />
              <p>
                <strong>Super Admin Restricted:</strong> Admin user management
                and password governance are restricted to Super Admins.
              </p>
            </div>
          ) : (
            <>
              {/* Rotate Own Password */}
              <form
                onSubmit={handleRotatePassword}
                className="border border-stone-border bg-surface p-6 space-y-4"
              >
                <h2 className="font-serif text-2xl font-medium text-espresso flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-terracotta" />
                  Rotate Super Admin Password
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current Password"
                    className="border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm"
                  />
                  <input
                    type="password"
                    required
                    minLength={10}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password (min 10 chars)"
                    className="border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-espresso text-alabaster px-5 py-2.5 text-xs uppercase tracking-[0.16em] hover:bg-roast cursor-pointer"
                >
                  Update Password
                </button>
              </form>

              {/* Staff Accounts */}
              <div className="border border-stone-border bg-surface p-6 space-y-5">
                <h2 className="font-serif text-2xl font-medium text-espresso flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-terracotta" />
                  Operations Staff Accounts
                </h2>

                <div className="divide-y divide-stone-border border border-stone-border">
                  {staff.map((u) => (
                    <div
                      key={u.id}
                      className="p-4 flex flex-wrap items-center justify-between gap-3 text-sm"
                    >
                      <div>
                        <p className="font-medium text-espresso">
                          {u.name}{" "}
                          <span className="text-[10px] uppercase tracking-wider bg-linen border border-stone-border px-2 py-0.5 ml-1">
                            {u.role}
                          </span>
                        </p>
                        <p className="text-xs text-muted">{u.email}</p>
                      </div>
                      <button
                        type="button"
                        disabled={u.id === currentAdminId}
                        onClick={() => toggleStaffActive(u)}
                        className={`px-3 py-1.5 text-xs uppercase tracking-wider border cursor-pointer disabled:opacity-40 ${
                          u.isActive
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                            : "border-stone-border bg-linen text-muted"
                        }`}
                      >
                        {u.isActive ? "Active" : "Deactivated"}
                      </button>
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={handleCreateStaff}
                  className="pt-4 border-t border-stone-border space-y-3"
                >
                  <p className="text-xs uppercase tracking-wider font-semibold text-roast">
                    Add New Staff Member
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm"
                    />
                    <input
                      type="email"
                      required
                      placeholder="staff2@rostvyn.com"
                      value={newStaffEmail}
                      onChange={(e) => setNewStaffEmail(e.target.value)}
                      className="border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm"
                    />
                    <input
                      type="password"
                      required
                      minLength={10}
                      placeholder="Temp Password (10+ chars)"
                      value={newStaffPassword}
                      onChange={(e) => setNewStaffPassword(e.target.value)}
                      className="border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-espresso text-alabaster px-5 py-2.5 text-xs uppercase tracking-[0.16em] hover:bg-roast cursor-pointer"
                  >
                    Create Staff Account
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
