import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes safely without conflicts.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export type SupportedCurrency = "USD" | "EUR" | "GBP" | "AUD";

const CURRENCY_LOCALES: Record<SupportedCurrency, string> = {
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  AUD: "en-AU",
};

/**
 * Formats a numeric or Prisma Decimal-like value into a localized currency string.
 */
export function formatCurrency(
  amount: number | string | { toNumber?: () => number },
  currencyCode: string = "USD"
): string {
  const numericAmount =
    typeof amount === "object" && amount !== null && typeof amount.toNumber === "function"
      ? amount.toNumber()
      : Number(amount);

  const safeAmount = Number.isFinite(numericAmount) ? numericAmount : 0;
  const normalizedCode = currencyCode.toUpperCase() as SupportedCurrency;
  const locale = CURRENCY_LOCALES[normalizedCode] ?? "en-US";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: normalizedCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeAmount);
  } catch {
    return `$${safeAmount.toFixed(2)}`;
  }
}

const ORDER_REF_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/**
 * Generates a human-friendly, unique order reference in the format RV-YYMMDD-XXXX.
 */
export function generateOrderRef(date: Date = new Date()): string {
  const yy = String(date.getUTCFullYear()).slice(-2);
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");

  const randomBytes = new Uint8Array(4);
  crypto.getRandomValues(randomBytes);

  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += ORDER_REF_ALPHABET[randomBytes[i] % ORDER_REF_ALPHABET.length];
  }

  return `RV-${yy}${mm}${dd}-${suffix}`;
}
