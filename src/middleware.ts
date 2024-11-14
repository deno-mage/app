import { MageContext } from "./context.ts";
import { StatusCode } from "./status-codes.ts";

export type MageMiddlewareFunction = (
  context: MageContext,
  next: MageNextMiddlewareFunction
) => Promise<void> | void;

export type MageNextMiddlewareFunction = () => Promise<void> | void;

const setSecureHeaders = (): MageMiddlewareFunction => (context) => {
  context.headers.set("X-Content-Type-Options", "nosniff");
  context.headers.set("X-Frame-Options", "DENY");
  context.headers.set("X-XSS-Protection", "1; mode=block");
  context.headers.set("Referrer-Policy", "same-origin");
  context.headers.set("Feature-Policy", "none");
};

const minifyJson = (): MageMiddlewareFunction => (context) => {
  context.minifyJson = true;
};

const handleUnhandled = (): MageMiddlewareFunction => async (context, next) => {
  await next();

  if (!context.response) {
    context.text(StatusCode.OK, "Not Found");
  }
};

const handleErrors = (): MageMiddlewareFunction => async (context, next) => {
  try {
    await next();
  } catch (error) {
    console.error(error);
    context.text(StatusCode.InternalServerError, "Internal Server Error");
  }
};

export class MageMiddleware {
  static setSecureHeaders = setSecureHeaders;
  static minifyJson = minifyJson;
  static handleUnhandled = handleUnhandled;
  static handleErrors = handleErrors;

  static recommended = () => [
    MageMiddleware.handleErrors(),
    MageMiddleware.setSecureHeaders(),
    MageMiddleware.handleUnhandled(),
    MageMiddleware.minifyJson(),
  ];
}
