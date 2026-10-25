# Blinkit MCP Reverse-Engineering Report

Status: static source review of the repository's `main` tree plus the integration branch. No authenticated live requests were made. Endpoint behavior is therefore classified as source-observed, not independently live-verified.

## Architecture map

- `src/index.ts`: process entry point; loads config and persisted session, optionally infers location from IP, builds HTTP/browser/session/rate-limit/spending-guard dependencies, and connects MCP over stdio.
- `src/server.ts`: registers tool definitions with `McpServer`; catches handler exceptions and emits error text. The registered tool set includes authentication, location, browsing, cart, checkout, payment, order tracking, and reorder operations.
- `src/core/http-client.ts`: shared HTTP transport and request/session behavior. `src/constants.ts` supplies endpoint constants. `src/core/rate-limiter.ts`, `retry-manager.ts`, `circuit-breaker.ts`, and `http-cache.ts` provide resilience mechanisms.
- `src/core/session-manager.ts`: persists local session state. Review file permissions and ensure session values are not logged or committed.
- `src/playwright/`: browser-driven fallback paths for authentication, search, location, cart, checkout, payment, and orders. Selectors are inherently fragile and should be treated as provider-specific implementation details.
- `src/services/`: domain services wrap HTTP and browser flows. `product-service.ts` tries HTTP first and falls back to Playwright.
- `src/tools/`: MCP tool schemas and handlers. `src/services/spending-guard.ts` provides a spending guard, but a spending limit is not equivalent to explicit confirmation for each purchase.
- `test/unit/` and `test/integration/`: unit tests and a focused HTTP retry integration test. Test fixtures exist under `test/mocks/`.

## Source-observed request surface

The repository's source references endpoint constants for search, product details, categories, category products, and other account/cart/order/payment operations. Exact paths should be captured from `src/constants.ts` and the relevant service files in this repository version. These are undocumented provider endpoints, not a public Blinkit API contract; do not assume stability or reuse them outside permitted accounts and flows.

The product search path in `src/services/product-service.ts` sends a POST to `ENDPOINTS.SEARCH` with query parameters `q` and `search_type=type_to_search`, then parses `response.snippets` and only accepts `product_card_snippet_type_2`. It supports two observed response shapes: nested `atc_action.add_to_cart.cart_item`, and a display-oriented data object with name/price/MRP/variant/inventory/image/brand fields. If HTTP parsing fails or no expected success payload is returned, it falls back to Playwright.

Product details POST to `ENDPOINTS.PRODUCT_DETAILS(productId)` and expect a `product` object. Categories use GET; category products use GET. Both can fall back to browser automation.

## Data normalization and reliability observations

- Prices are parsed from display text by stripping all non-numeric/non-dot characters. This is simple but can silently produce zero for unrecognized formats; tests should cover `₹`, commas, empty strings, and malformed values.
- Search's `total_results` is the number of returned/limited products, not necessarily the provider's actual total result count.
- In the fallback path, Playwright results are cast to `Product[]` instead of validated. Runtime validation is advisable before returning results to the agent.
- The HTTP product search shape is partly typed inline. Extracting response normalization into a pure function makes it testable without a live session.
- Inventory semantics vary by response shape. Missing inventory is currently treated as out of stock in search; missing `is_in_stock` is treated as in stock in some other paths. Preserve `unknown` when availability cannot be established in a provider-neutral layer rather than asserting stock.
- Product URLs are not part of the shared `Product` interface in the reviewed code. Add an optional URL only when the source supplies a real URL; do not synthesize undocumented product URLs.
- `getDetails` defaults missing `is_in_stock` to true. This should be considered a confidence issue, not proof of live availability.

## Security and privacy review checklist

1. Inspect `src/core/http-client.ts` and `src/constants.ts` for host allowlists, redirects, headers, request signing, cookies, and hard-coded endpoints.
2. Inspect `src/core/session-manager.ts`, `src/services/auth-service.ts`, and `src/playwright/auth-flow.ts` for secret persistence, file permissions, OTP handling, and accidental logs.
3. Inspect `src/playwright/payment-flow.ts`, `src/services/payment-service.ts`, `src/tools/orders/pay-now.ts`, and `quick-upi-checkout.ts` for transaction boundaries. Search and comparison must never invoke these flows.
4. Inspect all logger calls and screenshots for tokens, phone numbers, addresses, payment identifiers, and page content that could contain personal data.
5. Keep local session/config files out of Git. Use redacted synthetic fixtures in tests.
6. Never bypass authentication, anti-bot controls, access controls, rate limits, or geographical restrictions. Do not replay another user's session or capture payment credentials.

## Next engineering steps

1. Add a provider-neutral product contract and pure Blinkit normalizer with fixture tests.
2. Add a read-only `compare_store_products` or `search_store_products` tool that delegates only to configured provider adapters. Initially it should query Blinkit alone and label its provider coverage honestly.
3. Add explicit adapter capability flags. Keep cart mutations, checkout, and payment out of cross-store search.
4. Add deterministic tests for malformed responses, price parsing, missing inventory, duplicates, timeouts, and provider partial failures.
5. Run `npm ci`, `npm run typecheck`, `npm test`, `npm run lint`, and `npm run build` in a controlled local environment. The GitHub connector can commit files but cannot execute these project commands here, so no passing result should be claimed until CI reports it.

## Evidence labels

- Source-observed: directly visible in this repository's source.
- Test-observed: reproduced by a committed automated test.
- Live-verified: independently reproduced against the current service with authorization and sanitized traces.

This report contains source-observed findings only unless the repository's existing tests explicitly establish behavior. It is not a claim of complete live reverse engineering or official API documentation.
