import type { MageContext as PrivateMageContext } from "./context.ts";
import type { MageRequest as PrivateMageRequest } from "./request.ts";

type PublicOf<T> = { [K in keyof T]: T[K] };

export { MageApp } from "./app.ts";
export type { MagePlugin } from "./app.ts";
export type { MageMiddleware } from "./router.ts";
export { MageError } from "./error.ts";
export type MageContext = PublicOf<PrivateMageContext>;
export type MageRequest = PublicOf<PrivateMageRequest>;
