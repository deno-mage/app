import type { MageContext } from "./context.ts";
import type { MageMiddleware } from "./router.ts";

/**
 * Compose middleware, running each in sequence.
 *
 * @param middleware The middleware to compose
 * @returns MageMiddleware
 */
export const compose = (middleware: MageMiddleware[]) => {
  return async function (c: MageContext): Promise<void> {
    let lastIndex = -1;

    async function dispatch(i: number): Promise<void> {
      if (i <= lastIndex) {
        throw new Error("next() called multiple times");
      }

      lastIndex = i;

      const currentMiddleware: MageMiddleware | undefined = middleware[i];

      if (!currentMiddleware) {
        return;
      }

      await currentMiddleware(c, () => dispatch(i + 1));
    }

    await dispatch(0);
  };
};
