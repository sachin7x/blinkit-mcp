import { z } from "zod";
import type { AppContext } from "../../types.ts";
import { ProductService } from "../../services/product-service.ts";
import { normalizeBlinkitProduct } from "../../providers/blinkit-normalizer.ts";

/** Read-only cross-store search entry point. Blinkit is the only configured provider in phase 1. */
export const searchStoreProductsTool = {
  name: "search_store_products",
  description:
    "Search configured shopping providers for products and return normalized, timestamped results for price comparison. Phase 1 queries Blinkit only. This tool is read-only and never changes a cart or starts checkout/payment.",
  inputSchema: {
    query: z.string().min(1, "Search query cannot be empty").max(200),
    limit: z.number().int().min(1).max(20).default(10),
  },
  handler: async (input: { query: string; limit: number }, ctx: AppContext) => {
    const observedAt = new Date().toISOString();
    const service = new ProductService(ctx);
    const results = await service.search(input.query, input.limit);
    const products = results.products.map((product) => normalizeBlinkitProduct(product, observedAt));

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              query: input.query,
              providers_queried: ["blinkit"],
              provider_count: 1,
              coverage_note: "Phase 1 implementation: Blinkit only. Other stores are not queried yet.",
              observed_at: observedAt,
              total_results: products.length,
              products,
            },
            null,
            2
          ),
        },
      ],
    };
  },
};
