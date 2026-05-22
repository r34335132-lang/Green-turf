/** Límites pensados para Supabase Free (500 MB DB, 1 GB storage, egress limitado) */
export const APP_LIMITS = {
  maxProductsInCatalog: 50,
  maxProductsOnHome: 8,
  maxCategories: 25,
  maxCartItems: 5,
  maxCartAreaPerItem: 500,
  maxQuotesPerSubmit: 3,
  maxVisualizationsPerDay: 5,
  maxImageUploadBytes: 2 * 1024 * 1024,
  maxDescriptionLength: 500,
  maxProductNameLength: 80,
  maxFeaturesCount: 8,
  maxFeatureLength: 60,
} as const;

export function getProductPrice(product: {
  pricePerM2?: number;
  price_per_m2?: number;
  price?: number;
}): number {
  const raw = product.pricePerM2 ?? product.price_per_m2 ?? product.price;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function formatMoney(value: number): string {
  return (Number.isFinite(value) ? value : 0).toFixed(2);
}
