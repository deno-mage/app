import { useCors } from "./src/middleware/cors.ts";
import { useErrors } from "./src/middleware/errors.ts";
import { useNotFound } from "./src/middleware/not-found.ts";
import { useOptions } from "./src/middleware/options.ts";
import { useSecurityHeaders } from "./src/middleware/security-headers.ts";

export { MageApp } from "./src/app.ts";
export { MageContext } from "./src/context.ts";
export type { MageMiddleware } from "./src/router.ts";
export { StatusCode, StatusText, HttpMethod } from "./src/http.ts";

export const middleware = {
  useCors,
  useErrors,
  useNotFound,
  useOptions,
  useSecurityHeaders,
};

export const recommendedMiddleware = () => {
  return [useSecurityHeaders, useErrors(), useOptions(), useNotFound()];
};
