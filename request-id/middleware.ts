import type { MageMiddleware } from "../app/mod.ts";

/**
 * Options for the requestId middleware.
 */
export interface RequestIdOptions {
  /** Custom function to generate request IDs @default crypto.randomUUID */
  generator?: () => string;
  /** Header name for request ID @default "X-Request-ID" */
  headerName?: string;
}

/**
 * Add unique request ID to each request for tracing and audit logging.
 *
 * Reuses client-provided IDs or generates new ones. The ID is stored in context
 * and added to response headers for correlation.
 *
 * Security: Enables request tracing, audit trails, and incident investigation.
 */
export const requestId = (options?: RequestIdOptions): MageMiddleware => {
  const generator = options?.generator ?? (() => crypto.randomUUID());
  const headerName = options?.headerName ?? "X-Request-ID";

  return (c, next) => {
    // Use existing request ID from header, or generate new one
    const id = c.req.header(headerName) ?? generator();

    // Store in context for handlers/middleware to access
    c.set("requestId", id);

    // Add to response headers for client correlation
    c.header(headerName, id);

    return next();
  };
};
