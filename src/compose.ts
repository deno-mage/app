import { MageContext } from "./context.ts";
import { MageMiddleware } from "./router.ts";

export const compose = (middleware: MageMiddleware[]) => {
  return async function (context: MageContext): Promise<void> {
    let lastIndex = -1;

    async function dispatch(i: number): Promise<void> {
      // prevent calling next() multiple times in a single middleware
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
