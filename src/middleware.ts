import { MageContext } from "./context.ts";
import { handleErrors } from "./middleware/handle-errors.ts";
import { handleUnhandledRequests } from "./middleware/handle-unhandled-requests.ts";
import { setSecurityHeaders } from "./middleware/security-headers.ts";

export type MageMiddlewareFunction = (
  context: MageContext,
  next: MageNextMiddlewareFunction
) => Promise<void> | void;

export type MageNextMiddlewareFunction = () => Promise<void> | void;

export const middleware = {
  handleErrors,
  handleUnhandledRequests,
  setSecurityHeaders,
};
