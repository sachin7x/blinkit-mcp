import { describe, expect, test } from "vitest";
import { normalizeBlinkitProduct, parseBlinkitPrice } from "../../src/providers/blinkit-normalizer.ts";
import type { Product } from "../../src/types.ts";

const product: Product = {
  id: "582653",
  name: "USB-C charger",
  price: 369,
  mrp: 1299,
  unit: "30 W",
  in_stock: true,
  image_url: "https://example.test/charger.jpg",
  brand: "Nu Republic",
};

describe("normalizeBlinkitProduct", () => {
  test("maps a Blinkit product to the provider-neutral contract", () => {
    expect(normalizeBlinkitProduct(product, "2026-10-25T12:00:00.000Z")).toEqual({
      provider: "blinkit",
      providerProductId: "582653",
      title: "USB-C charger",
      price: 369,
      mrp: 1299,
      currency: "INR",
      unit: "30 W",
      brand: "Nu Republic",
      availability: "in_stock",
      imageUrl: "https://example.test/charger.jpg",
      productUrl: null,
      observedAt: "2026-10-25T12:00:00.000Z",
    });
  });

  test("does not invent a product URL", () => {
    expect(normalizeBlinkitProduct(product).productUrl).toBeNull();
  });

  test("normalizes missing optional text fields to null", () => {
    const minimal: Product = {
      id: "p1",
      name: "Item",
      price: 20,
      mrp: 20,
      unit: "",
      in_stock: false,
      image_url: "",
    };
    const result = normalizeBlinkitProduct(minimal, "2026-10-25T12:00:00.000Z");
    expect(result.unit).toBeNull();
    expect(result.brand).toBeNull();
    expect(result.imageUrl).toBeNull();
    expect(result.availability).toBe("out_of_stock");
  });
});

describe("parseBlinkitPrice", () => {
  test("parses rupee prices with grouping commas", () => {
    expect(parseBlinkitPrice("₹1,299")).toBe(1299);
    expect(parseBlinkitPrice("369.50")).toBe(369.5);
  });

  test("rejects empty, malformed, negative, and non-finite values", () => {
    expect(parseBlinkitPrice("")).toBeNull();
    expect(parseBlinkitPrice("₹--")).toBeNull();
    expect(parseBlinkitPrice("-5")).toBeNull();
    expect(parseBlinkitPrice(Number.NaN)).toBeNull();
    expect(parseBlinkitPrice(undefined)).toBeNull();
  });
});
