import { useErrorHandler } from "./src/middleware/error-handler.ts";
import { useNotFoundHandler } from "./src/middleware/not-found-handler.ts";
import { useSecurityHeaders } from "./src/middleware/security-headers.ts";

export { MageApp } from "./src/app.ts";
export type { RunOptions } from "./src/app.ts";
export { MageContext } from "./src/context.ts";
export type {
  MageMiddlewareFunction,
  MageNextMiddlewareFunction,
} from "./src/middleware.ts";
export { StatusCode } from "./src/status-codes.ts";

export const middleware = {
  useErrorHandler,
  useNotFoundHandler,
  useSecurityHeaders,
};
