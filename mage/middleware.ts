import { MageContext } from "./mage-context.ts";
import { MageHandler, MageNextHandler } from "./mage-handler.ts";
import { StatusCode } from "./utils/status-codes.ts";

export const setSecureHeaders = (): MageHandler => (context: MageContext) => {
  context.headers.set("X-Content-Type-Options", "nosniff");
  context.headers.set("X-Frame-Options", "DENY");
  context.headers.set("X-XSS-Protection", "1; mode=block");
  context.headers.set("Referrer-Policy", "same-origin");
  context.headers.set("Feature-Policy", "none");
};

export const minifyJson = (): MageHandler => (context: MageContext) => {
  context.minifyJson = true;
};

export const handleUnhandled =
  () => async (context: MageContext, next: MageNextHandler) => {
    await next();

    if (!context.response) {
      context.text(StatusCode.OK, "Not Found");
    }
  };

export const handleErrors =
  (): MageHandler => async (context: MageContext, next: MageNextHandler) => {
    try {
      await next();
    } catch (error) {
      console.error(error);
      context.text(StatusCode.InternalServerError, "Internal Server Error");
    }
  };
