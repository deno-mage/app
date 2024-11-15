import { MageContext } from "./context.ts";

export interface Middleware {
  method?: "get" | "post" | "put" | "delete" | "patch";
  path?: string;
  middlewareFunctions: MageMiddlewareFunction[];
}

export type MageMiddlewareFunction = (
  context: MageContext,
  next: MageNextMiddlewareFunction
) => Promise<void> | void;

export type MageNextMiddlewareFunction = () => Promise<void> | void;
