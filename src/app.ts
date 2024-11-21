import { MageContext } from "./context.ts";
import { compose } from "./compose.ts";
import { getAvailablePort } from "./ports.ts";
import { MageRouter } from "./router.ts";
import type { MageMiddleware } from "./router.ts";
import { StatusCode, StatusText } from "./http.ts";
import { useOptions } from "./middleware/options.ts";
import { useNotFound } from "./middleware/not-found.ts";
import { useMethodNotAllowed } from "./middleware/method-not-allowed.ts";

/**
 * Options for running a Mage application
 */
interface RunOptions {
  /**
   * The port to run the application on. If this port is not available, the
   * application will attempt to run on the next available port until one is
   * found.
   */
  port: number;
  /**
   * A callback that is called when the application starts listening for
   * incoming requests.
   *
   * @param localAddr
   */
  onListen?: (localAddr: Deno.NetAddr) => void;
}

/**
 * MageApp is the main class for creating and running Mage applications.
 */
export class MageApp {
  private _router = new MageRouter();

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
   * Run the Mage application and start listening for incoming requests.
   *
   * @param options
   * @returns
   */
  public run(options: RunOptions): Deno.HttpServer<Deno.NetAddr> {
    const serveOptions: Deno.ServeTcpOptions = {
      port: getAvailablePort(options.port),
      onListen: options.onListen,
    };

    return Deno.serve(serveOptions, async (req) => {
      const url = new URL(req.url);
      const matchResult = this._router.match(url, req.method);

      const context: MageContext = new MageContext(
        req,
        url,
        matchResult.params,
        matchResult.wildcard,
      );

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
    });
  }
}
