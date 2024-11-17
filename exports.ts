import { useCors } from "./src/middleware/cors.ts";
import { useMethodNotAllowed } from "./src/middleware/method-not-allowed.ts";
import { useNotFound } from "./src/middleware/not-found.ts";
import { useOptions } from "./src/middleware/options.ts";
import { useSecurityHeaders } from "./src/middleware/security-headers.ts";

export { MageApp } from "./src/app.ts";
export { MageContext } from "./src/context.ts";
export type { MageMiddleware } from "./src/router.ts";
export { HttpMethod, StatusCode, StatusText } from "./src/http.ts";

export const middleware = {
  useCors,
  useSecurityHeaders,
  useMethodNotAllowed,
  useNotFound,
  useOptions,
};
