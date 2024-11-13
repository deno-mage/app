import { MageContext } from "../mage-context.ts";
import { MageHandler } from "../mage-handler.ts";

export type ComposedHandler = (context: MageContext) => Promise<void>;

export const compose = (handlers: MageHandler[]): ComposedHandler => {
  return async function (context: MageContext): Promise<void> {
    let lastIndex = -1;

    async function dispatch(i: number): Promise<void> {
      if (i <= lastIndex) {
        throw new Error("next() called multiple times");
      }

      lastIndex = i;

      const handler: MageHandler | undefined = handlers[i];

      if (!handler) {
        return;
      }

      await handler(context, () => dispatch(i + 1));
    }

    await dispatch(0);
  };
};
