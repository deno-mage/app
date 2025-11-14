import { MageContext } from "./context.ts";
import { compose } from "./compose.ts";
import { LinearRouter } from "../linear-router/linear-router.ts";
import type { MageMiddleware, MageRouter } from "./router.ts";
import { options } from "./options.ts";
import { notFound } from "./not-found.ts";
import { methodNotAllowed } from "./method-not-allowed.ts";
import { statusText } from "../status/mod.ts";
import type { Status } from "../status/mod.ts";
import { MageRequest } from "./request.ts";
import { MageError } from "./error.ts";

/**
 * Options for creating a MageApp
 */
export interface MageAppOptions {
  /** Custom router implementation (defaults to LinearRouter) */
  router?: MageRouter;
}

/**
 * MageApp is the main class for creating and running Mage applications.
 */
export class MageApp {
  private _router: MageRouter;

  constructor(options?: MageAppOptions) {
    this._router = options?.router ?? new LinearRouter();
  }

  /**
   * Register global middleware that runs for every request.
   */
  public use(...middleware: (MageMiddleware | MageMiddleware[])[]): void {
    this._router.use(...middleware);
  }

  /**
   * Register middleware for all HTTP methods.
   * Accepts optional route pattern to limit which paths the middleware runs for.
   */
  public all(
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void {
    this._router.all(routenameOrMiddleware, ...middleware);
  }

  /**
   * Register middleware for GET and HEAD requests.
   * Accepts optional route pattern to limit which paths the middleware runs for.
   */
  public get(
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void {
    this._router.get(routenameOrMiddleware, ...middleware);
  }

  /**
   * Register middleware for POST requests.
   * Accepts optional route pattern to limit which paths the middleware runs for.
   */
  public post(
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void {
    this._router.post(routenameOrMiddleware, ...middleware);
  }

  /**
   * Register middleware for PUT requests.
   * Accepts optional route pattern to limit which paths the middleware runs for.
   */
  public put(
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void {
    this._router.put(routenameOrMiddleware, ...middleware);
  }

  /**
   * Register middleware for DELETE requests.
   * Accepts optional route pattern to limit which paths the middleware runs for.
   */
  public delete(
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void {
    this._router.delete(routenameOrMiddleware, ...middleware);
  }

  /**
   * Register middleware for PATCH requests.
   * Accepts optional route pattern to limit which paths the middleware runs for.
   */
  public patch(
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void {
    this._router.patch(routenameOrMiddleware, ...middleware);
  }

  /**
   * Register middleware for OPTIONS requests.
   * Accepts optional route pattern to limit which paths the middleware runs for.
   */
  public options(
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void {
    this._router.options(routenameOrMiddleware, ...middleware);
  }

  /**
   * Register middleware for HEAD requests.
   * Accepts optional route pattern to limit which paths the middleware runs for.
   */
  public head(
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void {
    this._router.head(routenameOrMiddleware, ...middleware);
  }

  /** Handler function that processes incoming requests and returns responses */
  public handler: (req: Request) => Promise<Response> = this._handler.bind(
    this,
  );

  private async _handler(req: Request) {
    const url = new URL(req.url);

    try {
      const matchResult = this._router.match(url, req.method);

      const c: MageContext = new MageContext({
        req: new MageRequest(req, {
          params: matchResult.params,
          wildcard: matchResult.wildcard,
        }),
      });

      const getAllowedMethods = () => this._router.getAvailableMethods(url);

      const middleware = [
        options({
          getAllowedMethods,
        }),
        ...matchResult.middleware,
      ];

      if (!matchResult.matchedRoutename) {
        middleware.push(notFound());
      }

      if (!matchResult.matchedMethod) {
        middleware.push(
          methodNotAllowed({
            getAllowedMethods,
          }),
        );
      }

      await compose(middleware)(c);

      return c.res;
    } catch (error) {
      let status: Status = 500;
      if (error instanceof MageError) {
        status = error.status;
      }

      const c: MageContext = new MageContext({
        req: new MageRequest(req, {
          params: {},
        }),
      });

      c.text(
        statusText(status),
        status,
      );

      return c.res;
    }
  }
}
