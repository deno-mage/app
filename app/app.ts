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
  /**
   * Custom router implementation. Defaults to LinearRouter.
   *
   * Use LinearRouter for:
   * - Serverless functions with frequent cold starts
   * - Small to medium applications (< 100 routes)
   *
   * Future: RadixRouter for long-running servers with many routes
   */
  router?: MageRouter;
}

/**
 * MageApp is the main class for creating and running Mage applications.
 */
export class MageApp {
  private _router: MageRouter;

  /**
   * Create a new MageApp.
   *
   * @param options Optional configuration including custom router
   */
  constructor(options?: MageAppOptions) {
    this._router = options?.router ?? new LinearRouter();
  }

  /**
   * Adds middleware to the application that will be run for every request.
   *
   * @param middleware The middleware to add
   */
  public use(...middleware: (MageMiddleware | MageMiddleware[])[]): void {
    this._router.use(...middleware);
  }

  /**
   * Adds middleware to the application that will be run for every method.
   * If a routename is provided, the middleware will only run for that route.
   *
   * @param routenameOrMiddleware The route name or middleware
   * @param middleware Additional middleware
   */
  public all(
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void {
    this._router.all(routenameOrMiddleware, ...middleware);
  }

  /**
   * Adds middleware to the application that will be run for GET requests.
   * If a routename is provided, the middleware will only run for that route.
   *
   * @param routenameOrMiddleware The route name or middleware
   * @param middleware Additional middleware
   */
  public get(
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void {
    this._router.get(routenameOrMiddleware, ...middleware);
  }

  /**
   * Adds middleware to the application that will be run for POST requests.
   * If a routename is provided, the middleware will only run for that route.
   *
   * @param routenameOrMiddleware The route name or middleware
   * @param middleware Additional middleware
   */
  public post(
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void {
    this._router.post(routenameOrMiddleware, ...middleware);
  }

  /**
   * Adds middleware to the application that will be run for PUT requests.
   * If a routename is provided, the middleware will only run for that route.
   *
   * @param routenameOrMiddleware The route name or middleware
   * @param middleware Additional middleware
   */
  public put(
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void {
    this._router.put(routenameOrMiddleware, ...middleware);
  }

  /**
   * Adds middleware to the application that will be run for DELETE requests.
   * If a routename is provided, the middleware will only run for that route.
   *
   * @param routenameOrMiddleware The route name or middleware
   * @param middleware Additional middleware
   */
  public delete(
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void {
    this._router.delete(routenameOrMiddleware, ...middleware);
  }

  /**
   * Adds middleware to the application that will be run for PATCH requests.
   * If a routename is provided, the middleware will only run for that route.
   *
   * @param routenameOrMiddleware The route name or middleware
   * @param middleware Additional middleware
   */
  public patch(
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void {
    this._router.patch(routenameOrMiddleware, ...middleware);
  }

  /**
   * Adds middleware to the application that will be run for OPTIONS requests.
   * If a routename is provided, the middleware will only run for that route.
   *
   * @param routenameOrMiddleware The route name or middleware
   * @param middleware Additional middleware
   */
  public options(
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void {
    this._router.options(routenameOrMiddleware, ...middleware);
  }

  /**
   * Adds middleware to the application that will be run for HEAD requests.
   * If a routename is provided, the middleware will only run for that route.
   *
   * @param routenameOrMiddleware The route name or middleware
   * @param middleware Additional middleware
   */
  public head(
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void {
    this._router.head(routenameOrMiddleware, ...middleware);
  }

  /**
   * Handle a request and return a response.
   *
   * @param req The request to handle
   * @returns Response
   */
  public handler: (req: Request) => Promise<Response> = this._handler.bind(
    this,
  );

  /**
   * Handle a request and return a response.
   *
   * @param req The request to handle
   * @returns Response
   */
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
