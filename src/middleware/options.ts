import { MageContext } from "../context.ts";
import { MageMiddlewareFunction, Middleware } from "../middleware.ts";
import { StatusCode } from "../status-codes.ts";

export const handleOptionsRequests = (
  url: URL,
  middleware: Middleware[]
): MageMiddlewareFunction => {
  return (context: MageContext) => {
    context.headers.set(
      "Allow",
      middleware
        .filter((middleware) => middleware.path === url.pathname)
        .map((middleware) => middleware.method?.toUpperCase())
        .join(", ")
    );

    context.text(StatusCode.OK, "");
  };
};
