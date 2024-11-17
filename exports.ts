import { useCors } from "./src/middleware/cors.ts";
import { useErrors } from "./src/middleware/errors.ts";
import { useNotFound } from "./src/middleware/not-found.ts";
import { useAllow } from "./src/middleware/allow.ts";
import { useSecurityHeaders } from "./src/middleware/security-headers.ts";

export { MageApp } from "./src/app.ts";
export { MageContext } from "./src/context.ts";
export type { MageMiddleware } from "./src/router.ts";
export { HttpMethod, StatusCode, StatusText } from "./src/http.ts";

export const middleware = {
  useCors,
  useErrors,
  useNotFound,
  useAllow,
  useSecurityHeaders,
};

export const recommendedMiddleware = () => {
  return [useSecurityHeaders(), useErrors(), useAllow(), useNotFound()];
};
