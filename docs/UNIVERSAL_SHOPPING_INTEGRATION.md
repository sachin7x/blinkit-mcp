# Universal Shopping Integration: Blinkit First

## Goal

Evolve this repository into the first provider for a cross-store shopping MCP, while preserving the existing Blinkit MCP behavior. Blinkit remains the first and only implemented provider in this phase.

## Current verified baseline

- This repository is a TypeScript MCP server using stdio transport.
- Existing functionality includes product search/details, categories, location, cart, orders, and payment-related tools.
- The README describes a hybrid HTTP + Playwright approach and notes that Blinkit has no public consumer API.
- The current codebase already has service, tool, core, and Playwright layers. Do not duplicate those layers or replace them with a second server.

## Phase 1: Blinkit provider boundary

1. Keep all Blinkit-specific HTTP, browser, authentication, location, and session behavior inside the existing Blinkit modules.
2. Define a provider-neutral product representation for future comparison: provider, provider product ID, title, brand, quantity/size, price in INR, availability status, product URL when available, and observation timestamp.
3. Add a provider capability contract for searchProducts and getProductDetails first. Mark cart, checkout, payment, and order capabilities as separate, opt-in operations.
4. Add a normalization layer that maps existing Blinkit service responses into the neutral representation. Preserve raw provider data only for debugging, and never log session cookies, authorization headers, OTPs, payment identifiers, or full delivery addresses.
5. Add fixture-based tests for normalization, missing fields, price parsing, unavailable inventory, and provider errors. Tests must not make real purchases or send OTPs.
6. Add a single cross-store search tool only after the provider-neutral contract and Blinkit normalization are tested. With only Blinkit connected, the result should explicitly report that only one provider was queried.

## Phase 2: cross-store search

- Add one adapter per store behind the same provider contract.
- Prefer official APIs, partner APIs, or explicitly authorized integrations. Treat undocumented endpoints and browser automation as unstable and isolate them per adapter.
- Each provider returns its own timestamped price and availability. Do not claim exact equivalence between differently sized products without unit normalization.
- Use bounded concurrency, per-provider rate limits, timeouts, retries with backoff, and circuit breakers.
- A failed provider must not invalidate successful results from other providers.

## Safety and transaction rules

- Search and product details are read-only and may run without checkout permissions.
- Cart mutation is a separate capability.
- Checkout and payment must never be triggered as a side effect of search, comparison, or coupon discovery.
- Before any purchase, show items, quantities, delivery fees, handling/convenience fees, discounts, final total, selected address, and payment method; require explicit user confirmation.
- Never store card details, UPI PINs, OTPs, or payment credentials.
- Coupon results must include source, eligibility conditions, minimum spend, expiry when known, and verification status. Label unverified coupon claims as unverified.
- Do not attempt to bypass authentication, access controls, bot protections, or geographic restrictions.

## Definition of done for Phase 1

- Existing Blinkit MCP tool names and behavior remain compatible.
- Provider-neutral product and capability types are documented and unit-tested.
- Blinkit search and detail responses can be normalized without network calls in tests.
- No checkout or payment action is exposed by the cross-store search tool.
- CI typecheck, lint, and test suite pass before merge.
- No claims of live integration success until verified in CI or a controlled local test.

## Planned later providers

Candidate providers: Zepto, Swiggy Instamart, Amazon India, Flipkart, and other stores with a supported or authorized integration path. These are candidates only, not implemented or verified by this change.
