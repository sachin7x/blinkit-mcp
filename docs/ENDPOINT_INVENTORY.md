# Blinkit Endpoint Inventory (Source-Observed)

This inventory is extracted from `src/constants.ts` and the service modules in this repository. These are undocumented consumer-service endpoints, not a public API contract. The list records what the source currently targets; it does not claim live availability or authorization outside the user's own permitted session.

Base host in source: `https://blinkit.com`. Search base constant: `https://blinkit.in` (not used by the listed `ENDPOINTS` entries in the reviewed constants file).

| Capability | Method observed in caller | Source path template | Source |
|---|---|---|---|
| Product search | POST | `/v1/layout/search?q={query}&search_type=type_to_search` | `src/services/product-service.ts` |
| Product details | POST | `/v1/layout/product/{productId}` | `src/constants.ts`, `product-service.ts` |
| Categories | GET | `/v2/categories` | `src/constants.ts`, `product-service.ts` |
| Category products | GET | `/v6/category/products/{categoryId}` | `src/constants.ts`, `product-service.ts` |
| Read cart | Defined as endpoint, browser path used in reviewed service | `/v2/cart` | `src/constants.ts`; `CartService` uses Playwright flow |
| Add to cart | Defined as endpoint, browser path used in reviewed service | `/v1/cart/add` | `src/constants.ts`; `CartService` uses Playwright flow |
| Update cart | Defined as endpoint, browser path used in reviewed service | `/v1/cart/update` | `src/constants.ts`; `CartService` uses Playwright flow |
| Clear cart | Defined as endpoint, browser path used in reviewed service | `/v1/cart/clear` | `src/constants.ts`; `CartService` uses Playwright flow |
| Orders | Defined as endpoint, browser path used in reviewed service | `/v2/orders` | `src/constants.ts`; `OrderService` uses Playwright flow |
| Track order | Defined as endpoint, browser path used in reviewed service | `/v2/order/{orderId}/track` | `src/constants.ts`; `OrderService` uses Playwright flow |

## Shared HTTP behavior

- Default headers in `src/constants.ts` include `app_client: consumer_web`, JSON content type and accept headers, and a browser-like user agent.
- `BlinkitHttpClient` caches GET requests and POST requests whose URL contains `/layout/search` for the configured cache TTL.
- The client applies a rate limiter, retry manager, circuit breaker, and 15-second abort timeout.
- The reviewed client does not show an explicit host allowlist or redirect policy. Before expanding this client to additional stores, add strict HTTPS host allowlisting and prevent arbitrary URL input from reaching it.
- The reviewed `fetch` request path has no explicit authorization/cookie argument in the `request` method. Browser-based flows may instead rely on Playwright storage state. Confirm actual authentication behavior only through authorized, sanitized testing.

## Response shape observed in source

Search sends `q` and `search_type=type_to_search` and expects `is_success === true` and `response.snippets`. It filters `widget_type === product_card_snippet_type_2`. Product fields may be nested under `atc_action.add_to_cart.cart_item` or exposed as display-oriented `data` fields (`product_id`, `identity.id`, `name.text`, `display_name.text`, `normal_price.text`, `mrp.text`, `variant.text`, `image.url`, `inventory`, `product_state`, `brand_name.text`).

Details expects a top-level `product` object with `name`, `price`, `mrp`, `unit`, `brand`, `description`, `is_in_stock`, `image_url`, `images`, and `nutrition`.

## Transaction and account surface

The server also registers browser-driven auth, OTP, location, cart, checkout, payment, and reorder tools. Their UI workflows are not fully described by the HTTP endpoint constants. Treat these as higher-risk operations. Do not trigger them during endpoint discovery. For tests, use fixtures and mocks; for live diagnostics, use only the user's own session, redacted traces, and explicit authorization.

## Verification state

- Endpoint templates: source-observed.
- HTTP verbs: source-observed for the specific service calls above; cart/order verbs are not claimed because the reviewed service uses browser flows.
- Live status, response schema freshness, authentication requirements, rate limits, and legal permission: not independently verified.
