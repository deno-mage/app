import { MageContext } from "./context.ts";
import { compose } from "./compose.ts";
import { MageRouter } from "./router.ts";
import type { MageMiddleware } from "./router.ts";
import { StatusCode, StatusText } from "./http.ts";
import { useOptions } from "./use-options.ts";
import { useNotFound } from "./use-not-found.ts";
import { useMethodNotAllowed } from "./use-method-not-allowed.ts";

/**
 * MageApp is the main class for creating and running Mage applications.
 */
export class MageApp {
  private _router = new MageRouter();
  private _buildId = crypto.randomUUID();

  /**
   * The unique identifier for the build
   */
  public get buildId(): string {
    return this._buildId;
  }

  /**
   * Adds middleware to the application that will be run for every request.
   *
   * @param middleware
   */
  public use(...middleware: MageMiddleware[]): void {
    this._router.use(...middleware);
  }

  /**
   * Adds middleware to the application that will be run for every method.
   * If a routename is provided, the middleware will only run for that route.
   *
   * @param routenameOrMiddleware
   * @param middleware
   */
  public all(
    routenameOrMiddleware: string | MageMiddleware,
    ...middleware: MageMiddleware[]
  ): void {
    this._router.all(routenameOrMiddleware, ...middleware);
  }

  /**
   * Adds middleware to the application that will be run for GET requests.
   * If a routename is provided, the middleware will only run for that route.
   *
   * @param routenameOrMiddleware
   * @param middleware
   */
  public get(
    routenameOrMiddleware: string | MageMiddleware,
    ...middleware: MageMiddleware[]
  ): void {
    this._router.get(routenameOrMiddleware, ...middleware);
  }

  /**
   * Adds middleware to the application that will be run for POST requests.
   * If a routename is provided, the middleware will only run for that route.
   *
   * @param routenameOrMiddleware
   * @param middleware
   */
  public post(
    routenameOrMiddleware: string | MageMiddleware,
    ...middleware: MageMiddleware[]
  ): void {
    this._router.post(routenameOrMiddleware, ...middleware);
  }

  /**
   * Adds middleware to the application that will be run for PUT requests.
   * If a routename is provided, the middleware will only run for that route.
   *
   * @param routenameOrMiddleware
   * @param middleware
   */
  public put(
    routenameOrMiddleware: string | MageMiddleware,
    ...middleware: MageMiddleware[]
  ): void {
    this._router.put(routenameOrMiddleware, ...middleware);
  }

  /**
   * Adds middleware to the application that will be run for DELETE requests.
   * If a routename is provided, the middleware will only run for that route.
   *
   * @param routenameOrMiddleware
   * @param middleware
   */
  public delete(
    routenameOrMiddleware: string | MageMiddleware,
    ...middleware: MageMiddleware[]
  ): void {
    this._router.delete(routenameOrMiddleware, ...middleware);
  }

  /**
   * Adds middleware to the application that will be run for PATCH requests.
   * If a routename is provided, the middleware will only run for that route.
   *
   * @param routenameOrMiddleware
   * @param middleware
   */
  public patch(
    routenameOrMiddleware: string | MageMiddleware,
    ...middleware: MageMiddleware[]
  ): void {
    this._router.patch(routenameOrMiddleware, ...middleware);
  }

  /**
   * Adds middleware to the application that will be run for OPTIONS requests.
   * If a routename is provided, the middleware will only run for that route.
   *
   * @param routenameOrMiddleware
   * @param middleware
   */
  public options(
    routenameOrMiddleware: string | MageMiddleware,
    ...middleware: MageMiddleware[]
  ): void {
    this._router.options(routenameOrMiddleware, ...middleware);
  }

  /**
   * Adds middleware to the application that will be run for HEAD requests.
   * If a routename is provided, the middleware will only run for that route.
   *
   * @param routenameOrMiddleware
   * @param middleware
   */
  public head(
    routenameOrMiddleware: string | MageMiddleware,
    ...middleware: MageMiddleware[]
  ): void {
    this._router.head(routenameOrMiddleware, ...middleware);
  }

  /**
   * Build the handler to pass to Deno.serve().
   *
   * @param options
   * @returns
   */
  public build(): Deno.ServeHandler {
    return async (request: Request) => {
      const url = new URL(request.url);
      const matchResult = this._router.match(url, request.method);

      const context: MageContext = new MageContext({
        buildId: this.buildId,
        request,
        params: matchResult.params,
        wildcard: matchResult.wildcard,
      });

      const getAllowedMethods = () => this._router.getAvailableMethods(url);

      const middleware = [
        useOptions({
          getAllowedMethods,
        }),
        ...matchResult.middleware,
      ];

      if (!matchResult.matchedRoutename) {
        middleware.push(useNotFound());
      }

      if (!matchResult.matchedMethod) {
        middleware.push(
          useMethodNotAllowed({
            getAllowedMethods,
          }),
        );
      }

      try {
        await compose(middleware)(context);
      } catch (error) {
        console.error(error);
        context.text(
          StatusCode.InternalServerError,
          StatusText.InternalServerError,
        );
      }

      return context.response;
    };
  }
}
