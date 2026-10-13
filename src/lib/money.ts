export const MAX_XOF_AMOUNT = 2_147_483_647;

export type PaymentStatus = "PAID" | "PENDING" | "OVERDUE";
export type MoneyLocale = "en" | "fr";

/** Parse only whole, positive XOF values that fit the Prisma/PostgreSQL Int field. */
export function parseXofAmount(value: unknown): number | null {
  let amount: number;

  if (typeof value === "number") {
    amount = value;
  } else if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    amount = Number(value.trim());
  } else {
    return null;
  }

  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > MAX_XOF_AMOUNT) {
    return null;
  }

  return amount;
}

export function isPaymentStatus(value: unknown): value is PaymentStatus {
  return value === "PAID" || value === "PENDING" || value === "OVERDUE";
}

export function isPaymentMonth(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-(0[1-9]|1[0-2])$/.test(value) &&
    Number(value.slice(0, 4)) > 0
  );
}

export function formatXof(amount: number, locale: MoneyLocale = "fr"): string {
  const formatted = new Intl.NumberFormat(locale === "fr" ? "fr" : "en", {
    maximumFractionDigits: 0,
  }).format(amount);

  return `${formatted} FCFA`;
}
