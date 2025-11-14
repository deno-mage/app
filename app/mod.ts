/**
 * Core Mage application module.
 *
 * Exports the main MageApp class, context types, middleware types,
 * default router, and error handling for building web applications.
 *
 * @module
 */

import type { MageContext as PrivateMageContext } from "./context.ts";
import type { MageRequest as PrivateMageRequest } from "./request.ts";
import type { PublicOf } from "../type-utils/utils.ts";

export { MageApp } from "./app.ts";
export type { MageAppOptions } from "./app.ts";
export type { MageMiddleware, MageRouter, MatchResult } from "./router.ts";
export { LinearRouter } from "../linear-router/mod.ts";
export { MageError } from "./error.ts";

/**
 * Context object that is passed to each middleware. It persists throughout the
 * request/response cycle and is used to interact with the request and response.
 */
export type MageContext = PublicOf<PrivateMageContext>;

/**
 * Wrapper around the Request object that provides memoized access to the body.
 *
 * This is useful because the body of a request can only be read once. If you
 * read the body of a request, and then try to read it again, you will get an
 * error. This class memoizes the body of the request so that you can read it
 * multiple times by middleware.
 */
export type MageRequest = PublicOf<PrivateMageRequest>;
