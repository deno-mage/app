import { handleErrors } from "./src/middleware/handle-errors.ts";
import { handleUnhandledRequests } from "./src/middleware/handle-unhandled-requests.ts";
import { setSecurityHeaders } from "./src/middleware/security-headers.ts";

export { MageApp } from "./src/app.ts";
export type { RunOptions } from "./src/app.ts";
export { MageContext } from "./src/context.ts";
export type {
  MageMiddlewareFunction,
  MageNextMiddlewareFunction,
} from "./src/middleware.ts";
export { StatusCode } from "./src/status-codes.ts";

export const middleware = {
  handleErrors,
  handleUnhandledRequests,
  setSecurityHeaders,
};
