import { MageContext } from "./context.ts";
import { MageMiddleware } from "./router.ts";

export const compose = (middleware: MageMiddleware[]) => {
  return async function (context: MageContext): Promise<void> {
    let lastIndex = -1;

    async function dispatch(i: number): Promise<void> {
      // flush any promises in the context created by the previous handler
      await context.flush();

      // prevent calling next() multiple times in a single handler
      if (i <= lastIndex) {
        throw new Error("next() called multiple times");
      }

      lastIndex = i;

      const currentMiddleware: MageMiddleware | undefined = middleware[i];

      if (!currentMiddleware) {
        return;
      }

      // capture the next handler execution so we can
      // await it without consumers needing to
      let nextPromise: Promise<void> | undefined;
      const dispatchNext = () => {
        nextPromise = dispatch(i + 1);
      };

      await currentMiddleware(context, dispatchNext);

      // if the handler didn't call next(), we need to manually
      if (!nextPromise) {
        dispatchNext();
      }

      await nextPromise;
    }

    await dispatch(0);
  };
};
