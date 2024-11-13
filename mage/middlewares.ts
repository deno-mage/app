import { MageContext } from "./mage-context.ts";
import { MageHandler, MageNextHandler } from "./mage-handler.ts";

export const setSecureHeaders =
  (): MageHandler => (context: MageContext, next: MageNextHandler) => {
    context.headers.set("X-Content-Type-Options", "nosniff");
    context.headers.set("X-Frame-Options", "DENY");
    context.headers.set("X-XSS-Protection", "1; mode=block");
    context.headers.set("Referrer-Policy", "same-origin");
    context.headers.set("Feature-Policy", "none");

    return next();
  };

export const minifyJson =
  (): MageHandler => (context: MageContext, next: MageNextHandler) => {
    context.minifyJson = true;

    return next();
  };

export const handleError = () => {};

export const handleErrors =
  (): MageHandler => async (context: MageContext, next: MageNextHandler) => {
    try {
      await next();
    } catch (error) {
      console.error(error);
      context.error(500, "Internal Server Error");
    }
  };
