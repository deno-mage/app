import { MageContext } from "./context.ts";
import { MageHandler } from "./handler.ts";

export type ComposedHandler = (context: MageContext) => Promise<void>;

export const compose = (handlers: MageHandler[]): ComposedHandler => {
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

      const handler: MageHandler | undefined = handlers[i];

      if (!handler) {
        return;
      }

      let nextPromise: Promise<void> | undefined;

      // capture the next handler execution so we can
      // await it without consumers needing to
      const dispatchNext = () => {
        nextPromise = dispatch(i + 1);
      };

      await handler(context, dispatchNext);

      // if the handler didn't call next(), we need to manually
      if (!nextPromise) {
        dispatchNext();
      }

      await nextPromise;
    }

    await dispatch(0);
  };
};
