import { MageContext } from "./mage-context.ts";

export type MageHandler = (
  context: MageContext,
  next: MageNextHandler
) => Promise<void> | void;

export type MageNextHandler = () => Promise<void> | void;
