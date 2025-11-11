/**
 * CSRF protection middleware for Mage.
 *
 * Protects against Cross-Site Request Forgery attacks using modern Fetch Metadata
 * headers and Origin validation. Provides stateless CSRF protection without requiring
 * token generation or server-side storage.
 *
 * ## Strategy
 *
 * Uses two independent validation mechanisms:
 * - **Sec-Fetch-Site header** (modern browser standard, cannot be forged)
 * - **Origin header** (fallback for older browsers)
 *
 * @module
 */

export { csrf } from "./middleware.ts";
export type { CsrfOptions } from "./middleware.ts";
