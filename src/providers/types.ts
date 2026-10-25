/** Provider-neutral product contract for cross-store search. */
export type ProductAvailability = "in_stock" | "out_of_stock" | "unknown";

export interface StoreProduct {
  provider: string;
  providerProductId: string;
  title: string;
  price: number | null;
  mrp: number | null;
  currency: "INR";
  unit: string | null;
  brand: string | null;
  availability: ProductAvailability;
  imageUrl: string | null;
  productUrl: string | null;
  observedAt: string;
}

export interface ProductSearchResult {
  provider: string;
  query: string;
  products: StoreProduct[];
  observedAt: string;
  status: "success" | "partial" | "error";
  warning?: string;
}

/**
 * Minimal read-only contract for store adapters. Implementations must not mutate
 * carts or trigger checkout/payment as a side effect of search or detail lookup.
 */
export interface ReadOnlyStoreProvider {
  readonly id: string;
  searchProducts(query: string, limit?: number): Promise<StoreProduct[]>;
  getProductDetails(productId: string): Promise<StoreProduct>;
}
