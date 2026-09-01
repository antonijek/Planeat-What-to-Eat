export type IAPProductId = "monthly" | "yearly" | "lifetime";

export interface IAPProduct {
  id: IAPProductId;
  /** Store product ID — must match App Store Connect / Play Console exactly. */
  sku: string;
  title: string;
  description: string;
  /** Localized price string, e.g. "4.99 €". */
  price: string;
  /** Raw price in euros (for sorting/fallback display). */
  priceAmount: number;
}

/**
 * Internal id -> store product ID.
 * Same product ID is used on both App Store Connect and Google Play Console
 * (premium_monthly / premium_yearly / premium_lifetime).
 */
export const PRODUCT_SKUS: Record<IAPProductId, string> = {
  monthly: "premium_monthly",
  yearly: "premium_yearly",
  lifetime: "premium_lifetime",
};

/** Shown before the real store products load, and as a fallback in Expo Go (no native IAP module). */
export const MOCK_PRODUCTS: IAPProduct[] = [
  {
    id: "monthly",
    sku: PRODUCT_SKUS.monthly,
    title: "Planeat Premium — Monthly",
    description: "Unlock all premium features. Cancel anytime.",
    price: "4.99 €",
    priceAmount: 4.99,
  },
  {
    id: "yearly",
    sku: PRODUCT_SKUS.yearly,
    title: "Planeat Premium — Yearly",
    description: "Best value. Cancel anytime.",
    price: "39 €",
    priceAmount: 39,
  },
  {
    id: "lifetime",
    sku: PRODUCT_SKUS.lifetime,
    title: "Planeat Premium — Lifetime",
    description: "One-time payment, yours forever.",
    price: "69 €",
    priceAmount: 69,
  },
];
