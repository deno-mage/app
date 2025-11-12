import type { MageContext } from "./context.ts";
import { MageError } from "./error.ts";

/**
 * Validates and decodes a route parameter value to prevent path traversal attacks.
 *
 * @param value The raw parameter value from the URL
 * @param paramName The parameter name for error messages
 * @returns The decoded and validated parameter value
 * @throws MageError if the parameter contains path traversal sequences
 */
function validateAndDecodeParam(value: string, paramName: string): string {
  // URL decode the parameter
  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    throw new MageError(
      `Invalid URL encoding in route parameter: ${paramName}`,
      400,
    );
  }

  // Check for path traversal sequences
  const dangerousPatterns = [
    "../", // Basic path traversal
    "..\\", // Windows path traversal
    "%2e%2e/", // URL encoded ../
    "%2e%2e\\", // URL encoded ..\
    "..%2f", // Partially encoded ../
    "..%5c", // Partially encoded ..\
  ];

  const lowerDecoded = decoded.toLowerCase();
  for (const pattern of dangerousPatterns) {
    if (lowerDecoded.includes(pattern)) {
      throw new MageError(
        `Path traversal attempt detected in route parameter: ${paramName}`,
        400,
      );
    }
  }

  return decoded;
}

interface MatchRoutenameResultMatch {
  match: true;
  params: { [key: string]: string };
  wildcard?: string;
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
    const routePart = routeParts[i];

    // Wildcard matches everything from this point
    if (routePart === "*") {
      const wildcard = pathParts.slice(i).join("/");
      return { match: true, params, wildcard };
    }

    // Path is too short for non-wildcard route
    if (i >= pathParts.length) {
      return { match: false };
    }

    if (routePart.startsWith(":")) {
      const paramName = routePart.substring(1);
      params[paramName] = validateAndDecodeParam(pathParts[i], paramName);
    } else if (routePart !== pathParts[i]) {
      return { match: false };
    }
  }

  // Ensure all path parts are matched
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
  wildcard?: string;
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
    let wildcard: string | undefined;

    const middleware = this._entries
      .filter((entry) => {
        if (entry.routename) {
          const result = matchRoutename(entry.routename, url.pathname);

          if (!result.match) {
            return false;
          }

          params = result.params;
          wildcard = result.wildcard;
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
      wildcard,
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
      .filter((entry) => {
        if (!entry.routename) {
          return false;
        }

        const result = matchRoutename(entry.routename, url.pathname);
        return result.match;
      })
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
  public use(...middleware: (MageMiddleware | MageMiddleware[])[]) {
    this._entries.push({
      middleware: middleware.flat(),
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
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void {
    this.pushEntry(
      routenameOrMiddleware,
      [
        "GET",
        "HEAD",
        "POST",
        "PUT",
        "DELETE",
        "PATCH",
        "OPTIONS",
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
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void {
    this.pushEntry(
      routenameOrMiddleware,
      ["GET", "HEAD"],
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
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void {
    this.pushEntry(routenameOrMiddleware, ["POST"], ...middleware);
  }

  /**
   * Adds middleware to the application that will be run for PUT requests.
   * If a routename is provided, the middleware will only run for that route.
   *
   * @param routenameOrMiddleware
   * @param middleware
   */
  public put(
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void {
    this.pushEntry(routenameOrMiddleware, ["PUT"], ...middleware);
  }

  /**
   * Adds middleware to the application that will be run for DELETE requests.
   * If a routename is provided, the middleware will only run for that route.
   *
   * @param routenameOrMiddleware
   * @param middleware
   */
  public delete(
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void {
    this.pushEntry(routenameOrMiddleware, ["DELETE"], ...middleware);
  }

  /**
   * Adds middleware to the application that will be run for PATCH requests.
   * If a routename is provided, the middleware will only run for that route.
   *
   * @param routenameOrMiddleware
   * @param middleware
   */
  public patch(
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void {
    this.pushEntry(routenameOrMiddleware, ["PATCH"], ...middleware);
  }

  /**
   * Adds middleware to the application that will be run for OPTIONS requests.
   * If a routename is provided, the middleware will only run for that route.
   *
   * @param routenameOrMiddleware
   * @param middleware
   */
  public options(
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void {
    this.pushEntry(routenameOrMiddleware, ["OPTIONS"], ...middleware);
  }

  /**
   * Adds middleware to the application that will be run for HEAD requests.
   * If a routename is provided, the middleware will only run for that route.
   *
   * @param routenameOrMiddleware
   * @param middleware
   */
  public head(
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void {
    this.pushEntry(routenameOrMiddleware, ["HEAD"], ...middleware);
  }

  private pushEntry(
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    methods?: string[],
    ...additionalMiddleware: (MageMiddleware | MageMiddleware[])[]
  ) {
    const routename = typeof routenameOrMiddleware === "string"
      ? routenameOrMiddleware
      : undefined;

    const middleware = typeof routenameOrMiddleware === "string"
      ? additionalMiddleware
      : [routenameOrMiddleware, ...additionalMiddleware];

    this._entries.push({
      routename,
      middleware: middleware.flat(),
      methods,
    });
  }
}
