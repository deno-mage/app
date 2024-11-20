import type { MageContext } from "./context.ts";
import { HttpMethod } from "./http.ts";

interface MatchRoutenameResultMatch {
  match: true;
  params: { [key: string]: string };
}

interface MatchRoutenameResultNoMatch {
  match: false;
}

type MatchRoutenameResult =
  | MatchRoutenameResultMatch
  | MatchRoutenameResultNoMatch;

function matchRoutename(
  routename: string,
  pathname: string,
): MatchRoutenameResult {
  const routeParts = routename.split("/");
  const pathParts = pathname.split("/");

  const params: { [key: string]: string } = {};

  for (let i = 0; i < routeParts.length; i++) {
    if (routeParts[i] === "*") {
      return { match: true, params };
    }

    if (routeParts[i].startsWith(":")) {
      const paramName = routeParts[i].substring(1);
      params[paramName] = pathParts[i];
    } else if (routeParts[i] !== pathParts[i]) {
      return { match: false };
    }
  }

  // Check for wildcard at the end of the route
  if (
    routeParts.length < pathParts.length &&
    routeParts[routeParts.length - 1] === "*"
  ) {
    return { match: true, params };
  }

  // Ensure all parts are matched
  if (routeParts.length !== pathParts.length) {
    return { match: false };
  }

  return { match: true, params };
}

/**
 * Middleware function signature for Mage applications.
 */
export type MageMiddleware = (
  /**
   * The context for the current request.
   */
  context: MageContext,
  /**
   * The next middleware function in the chain. Don't call this if you want to
   * stop the chain and return a response.
   */
  next: () => Promise<void> | void,
) => Promise<void> | void;

/**
 * MiddlewareRegisterEntry is an entry in the MiddlewareRegister.
 */
interface RouterEntry {
  /**
   * The methods that this middleware should run for. If not provided, the
   * middleware will run for all methods.
   */
  methods?: string[];
  /**
   * The routename that this middleware should run for. If not provided, the
   * middleware will run for all routes.
   */
  routename?: string;
  /**
   * The middleware to run.
   */
  middleware: MageMiddleware[];
}

interface MatchResult {
  middleware: MageMiddleware[];
  matchedRoutename: boolean;
  matchedMethod: boolean;
  params: { [key: string]: string };
}

/**
 * MageRouter is a class for defining routes and middleware for a Mage
 * application.
 */
export class MageRouter {
  private _entries: RouterEntry[] = [];

  /**
   * Match middleware for a given request and extract parameters.
   *
   * @param url
   * @param method
   * @returns
   */
  public match(url: URL, method: string): MatchResult {
    let matchedRoutename = false;
    let matchedMethod = false;
    let params: { [key: string]: string } = {};

    const middleware = this._entries
      .filter((entry) => {
        if (entry.routename) {
          const result = matchRoutename(entry.routename, url.pathname);

          if (!result.match) {
            return false;
          }

          params = result.params;
          matchedRoutename = true;
        }

        if (entry.methods && !entry.methods.includes(method)) {
          return false;
        }

        if (entry.methods) {
          matchedMethod = true;
        }

        return true;
      })
      .flatMap((entry) => entry.middleware);

    return {
      middleware,
      matchedRoutename,
      matchedMethod,
      params,
    };
  }

  /**
   * Get available methods for a given pathname.
   *
   * @param pathname
   * @returns
   */
  public getAvailableMethods(url: URL): string[] {
    const methods = this._entries
      .filter((entry) => entry.routename === url.pathname)
      .flatMap((entry) => entry.methods ?? []);

    return methods;
  }

  /**
   * Adds middleware to the router that will be run for every request. If a
   * request is only handled by middleware registered via `use(...)` then the
   * request will be responded to with a 404 Not Found status code by default.
   *
   * @param middleware
   */
  public use(...middleware: MageMiddleware[]) {
    this._entries.push({
      middleware,
    });
  }

  /**
   * Adds middleware to the application that will be run for every request.
   * If a routename is provided, the middleware will only run for that route.
   *
   * @param routenameOrMiddleware
   * @param middleware
   */
  public all(
    routenameOrMiddleware: string | MageMiddleware,
    ...middleware: MageMiddleware[]
  ): void {
    this.pushEntry(
      routenameOrMiddleware,
      [
        HttpMethod.Get,
        HttpMethod.Post,
        HttpMethod.Put,
        HttpMethod.Delete,
        HttpMethod.Patch,
        HttpMethod.Options,
        HttpMethod.Head,
      ],
      ...middleware,
    );
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
    this.pushEntry(
      routenameOrMiddleware,
      [HttpMethod.Get, HttpMethod.Head],
      ...middleware,
    );
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
    this.pushEntry(routenameOrMiddleware, [HttpMethod.Post], ...middleware);
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
    this.pushEntry(routenameOrMiddleware, [HttpMethod.Put], ...middleware);
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
    this.pushEntry(routenameOrMiddleware, [HttpMethod.Delete], ...middleware);
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
    this.pushEntry(routenameOrMiddleware, [HttpMethod.Patch], ...middleware);
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
    this.pushEntry(routenameOrMiddleware, [HttpMethod.Options], ...middleware);
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
    this.pushEntry(routenameOrMiddleware, [HttpMethod.Head], ...middleware);
  }

  private pushEntry(
    routenameOrMiddleware: string | MageMiddleware,
    methods?: HttpMethod[],
    ...additionalMiddleware: MageMiddleware[]
  ) {
    const routename = typeof routenameOrMiddleware === "string"
      ? routenameOrMiddleware
      : undefined;

    const middleware = typeof routenameOrMiddleware === "string"
      ? additionalMiddleware
      : [routenameOrMiddleware, ...additionalMiddleware];

    this._entries.push({
      routename,
      middleware,
      methods,
    });
  }
}
