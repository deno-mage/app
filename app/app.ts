import { MageContext } from "./context.ts";
import { compose } from "./compose.ts";
import { MageRouter } from "./router.ts";
import type { MageMiddleware } from "./router.ts";
import { options } from "./options.ts";
import { notFound } from "./not-found.ts";
import { methodNotAllowed } from "./method-not-allowed.ts";
import { statusText } from "../status/mod.ts";
import type { Status } from "../status/mod.ts";
import { MageRequest } from "./mage-request.ts";
import { MageError } from "./mage-error.ts";

/**
 * A plugin for Mage apps.
 */
export interface MagePlugin {
  /**
   * Name of the plugin
   */
  name: string;
  /**
   * Triggered when app.build() is called
   *
   * @returns Promise<void>
   */
  onBuild?: (app: MageApp) => Promise<void> | void;
  /**
   * Triggered when app.develop() is called
   *
   * @returns Promise<void>
   */
  onDevelop?: (app: MageApp) => Promise<void> | void;
}

/**
 * MageApp is the main class for creating and running Mage applications.
 */
export class MageApp {
  private _router = new MageRouter();
  private _buildId = crypto.randomUUID();
  private _plugins: MagePlugin[] = [];

  /**
   * The unique identifier for the build
   */
  public get buildId(): string {
    return this._buildId;
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
   * Register a mage plygin
   *
   * @param plugin The plugin to register
   */
  public plugin(plugin: MagePlugin): void {
    this._plugins.push(plugin);
  }

  /**
   * Build the application. This may not be necessary for all
   * applications if static assets are not required or produced by
   * plugins.
   */
  public async build(): Promise<void> {
    for (const plugin of this._plugins) {
      await plugin.onBuild?.(this);
    }
  }

  /**
   * Start the development server. This is used to run the application
   * locally during development including triggering any development
   * plugins.
   */
  public async develop() {
    for (const plugin of this._plugins) {
      await plugin.onDevelop?.(this);
    }
  }

  /**
   * Handle a request and return a response.
   *
   * @param req The request to handle
   * @returns Response
   */
  private async _handler(req: Request) {
    const url = new URL(req.url);
    const matchResult = this._router.match(url, req.method);

    const c: MageContext = new MageContext({
      buildId: this.buildId,
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

    try {
      await compose(middleware)(c);
    } catch (error) {
      console.error(error);

      let status: Status = 500;
      if (error instanceof MageError) {
        status = error.status;
      }

      c.text(
        statusText(status),
        status,
      );
    }

    return c.res;
  }
}
