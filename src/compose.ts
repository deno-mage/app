import { MageContext } from "./context.ts";
import { MageMiddleware } from "./router.ts";

/**
 * Compose middleware, running each in sequence.
 *
 * @param middleware
 * @returns
 */
export const compose = (middleware: MageMiddleware[]) => {
  return async function (context: MageContext): Promise<void> {
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

      await currentMiddleware(context, () => dispatch(i + 1));
    }

    await dispatch(0);
  };
};
