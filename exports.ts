import { useErrorHandler } from "./src/middleware/error-handler.ts";
import { useNotFoundHandler } from "./src/middleware/not-found-handler.ts";
import { useOptions } from "./src/middleware/options.ts";
import { useSecurityHeaders } from "./src/middleware/security-headers.ts";

export { MageApp } from "./src/app.ts";
export { MageContext } from "./src/context.ts";
export type { MageMiddleware } from "./src/router.ts";
export { StatusCode, StatusText, HttpMethod } from "./src/http.ts";

export const middleware = {
  useErrorHandler,
  useNotFoundHandler,
  useOptions,
  useSecurityHeaders,
};
