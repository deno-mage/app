/**
 * This module is the entry point for the Mage Server framework. It
 * exports all the core functionality of the framework as well as the
 * middleware.
 *
 * @module
 */

// core
export { MageApp } from "./src/app.ts";
export { MageContext } from "./src/context.ts";
export type { MageMiddleware } from "./src/router.ts";
export { HttpMethod, StatusCode, StatusText } from "./src/http.ts";
export type { CookieOptions } from "./src/cookies.ts";

//middleware
export { useCors } from "./src/middleware/cors.ts";
export { useMethodNotAllowed } from "./src/middleware/method-not-allowed.ts";
export { useNotFound } from "./src/middleware/not-found.ts";
export { useOptions } from "./src/middleware/options.ts";
export { useSecurityHeaders } from "./src/middleware/security-headers.ts";
export { useServeFiles } from "./src/middleware/serve-files.ts";
