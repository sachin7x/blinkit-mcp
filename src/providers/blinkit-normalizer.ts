import type { Product } from "../types.ts";
import type { ProductAvailability, StoreProduct } from "./types.ts";

function finiteNonNegative(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? value : null;
  if (typeof value !== "string") return null;
  const normalized = value.replace(/[₹,\s]/g, "").trim();
  if (!normalized || !/^\d+(?:\.\d+)?$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function availabilityFromProduct(product: Product): ProductAvailability {
  return product.in_stock ? "in_stock" : "out_of_stock";
}

export function normalizeBlinkitProduct(
  product: Product,
  observedAt = new Date().toISOString()
): StoreProduct {
  const price = finiteNonNegative(product.price);
  const mrp = finiteNonNegative(product.mrp);

  return {
    provider: "blinkit",
    providerProductId: String(product.id ?? ""),
    title: String(product.name ?? "Unknown product").trim() || "Unknown product",
    price,
    mrp,
    currency: "INR",
    unit: product.unit?.trim() || null,
    brand: product.brand?.trim() || null,
    availability: availabilityFromProduct(product),
    imageUrl: product.image_url?.trim() || null,
    // The current Product shape does not include a verified product URL.
    productUrl: null,
    observedAt,
  };
}

/** Parse display prices without turning malformed values into a false ₹0 price. */
export function parseBlinkitPrice(value: unknown): number | null {
  return finiteNonNegative(value);
}
