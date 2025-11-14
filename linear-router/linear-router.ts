import { MageError } from "../app/error.ts";
import type { MageMiddleware, MageRouter, MatchResult } from "../app/router.ts";

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

/**
 * Normalizes a pathname by removing empty segments caused by consecutive slashes.
 * This prevents path confusion and matches common web server behavior.
 *
 * Examples:
 * - "/users//123" → "/users/123"
 * - "//users/123" → "/users/123"
 * - "/users///123" → "/users/123"
 * - "/users/123/" → "/users/123" (trailing slash removed)
 *
 * @param pathname The pathname to normalize
 * @returns The normalized pathname
 */
function normalizePath(pathname: string): string {
  return pathname
    .split("/")
    .filter((part) => part !== "") // Remove empty segments
    .join("/")
    .replace(/^/, "/"); // Ensure leading slash
}

function matchRoutename(
  routename: string,
  pathname: string,
): MatchRoutenameResult {
  // Normalize the pathname to remove consecutive slashes and trailing slashes
  const normalizedPathname = normalizePath(pathname);

  const routeParts = routename.split("/");
  const pathParts = normalizedPathname.split("/");

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
 * RouterEntry is an entry in the router's middleware registry.
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

/**
 * LinearRouter uses linear search (O(n)) to match routes.
 * Simple, proven implementation suitable for most applications.
 *
 * Best for:
 * - Serverless functions with frequent cold starts
 * - Small to medium applications (< 100 routes)
 * - Scenarios where startup time is critical
 */
export class LinearRouter implements MageRouter {
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
   * @param url The URL to check for available methods
   * @returns Array of unique HTTP methods available for this path
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

    // Deduplicate methods for defensive programming
    return [...new Set(methods)];
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

    // Validate routename format (check typeof to catch empty strings)
    if (typeof routenameOrMiddleware === "string") {
      this.validateRoutenameFormat(routenameOrMiddleware);
    }

    // Validate for duplicate route patterns that would cause param conflicts
    if (routename && methods) {
      this.validateNoDuplicateRoute(routename, methods);
    }

    this._entries.push({
      routename,
      middleware: middleware.flat(),
      methods,
    });
  }

  /**
   * Validates the format of a routename to prevent common mistakes and runtime errors.
   *
   * Checks:
   * - Route must start with "/"
   * - No consecutive slashes (e.g., "/users//posts")
   * - No empty segments
   * - Wildcard "*" only appears at the end
   * - No duplicate parameter names
   * - Parameter names must not be empty (e.g., "/users/:")
   *
   * @param routename The route pattern to validate
   * @throws MageError if the routename is invalid
   */
  private validateRoutenameFormat(routename: string) {
    // Must not be empty
    if (routename.length === 0) {
      throw new MageError(
        'Route pattern cannot be empty. Use "/" for root route.',
        500,
      );
    }

    // Must start with /
    if (!routename.startsWith("/")) {
      throw new MageError(
        `Route pattern must start with "/". Got: "${routename}"`,
        500,
      );
    }

    // Root route "/" is valid, no further validation needed
    if (routename === "/") {
      return;
    }

    // Check for consecutive slashes
    if (routename.includes("//")) {
      throw new MageError(
        `Route pattern cannot contain consecutive slashes. Got: "${routename}"`,
        500,
      );
    }

    const parts = routename.split("/");
    const paramNames = new Set<string>();
    let foundWildcard = false;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      // Skip empty first segment (from leading /)
      if (i === 0 && part === "") {
        continue;
      }

      // Empty segment (shouldn't happen if no consecutive slashes, but check anyway)
      if (part === "") {
        throw new MageError(
          `Route pattern contains empty segment. Got: "${routename}"`,
          500,
        );
      }

      // Check for wildcard
      if (part === "*") {
        foundWildcard = true;
        // Wildcard must be at the end
        if (i !== parts.length - 1) {
          throw new MageError(
            `Wildcard "*" must be the last segment in route pattern. Got: "${routename}"`,
            500,
          );
        }
        continue;
      }

      // Can't have segments after wildcard (already checked above, but be defensive)
      if (foundWildcard) {
        throw new MageError(
          `No segments allowed after wildcard "*". Got: "${routename}"`,
          500,
        );
      }

      // Check parameter names
      if (part.startsWith(":")) {
        const paramName = part.substring(1);

        // Empty param name
        if (paramName === "") {
          throw new MageError(
            `Parameter name cannot be empty. Got: "${part}" in route "${routename}"`,
            500,
          );
        }

        // Duplicate param name
        if (paramNames.has(paramName)) {
          throw new MageError(
            `Duplicate parameter name ":${paramName}" in route pattern "${routename}"`,
            500,
          );
        }

        paramNames.add(paramName);
      }
    }
  }

  /**
   * Normalizes a route pattern by replacing all param names with a placeholder.
   * This allows detection of functionally identical routes with different param names.
   *
   * Examples:
   * - "/users/:id" → "/users/:param"
   * - "/users/:userId" → "/users/:param"
   * - "/posts/:postId/comments/:commentId" → "/posts/:param/comments/:param"
   * - "/files/*" → "/files/*"
   *
   * @param routename The route pattern to normalize
   * @returns The normalized pattern
   */
  private normalizeRoutePattern(routename: string): string {
    return routename
      .split("/")
      .map((part) => {
        if (part.startsWith(":")) {
          return ":param";
        }
        return part;
      })
      .join("/");
  }

  /**
   * Validates that a route pattern hasn't already been registered with overlapping methods.
   * This prevents param conflicts where multiple routes with the same pattern but different
   * param names would cause only the last match's params to be available.
   *
   * @param routename The route pattern to validate
   * @param methods The HTTP methods for this route
   * @throws MageError if a duplicate route is found
   */
  private validateNoDuplicateRoute(routename: string, methods: string[]) {
    const normalizedPattern = this.normalizeRoutePattern(routename);

    for (const entry of this._entries) {
      // Skip entries without routenames (global middleware)
      if (!entry.routename || !entry.methods) {
        continue;
      }

      // Check if routename patterns are functionally identical
      const entryNormalizedPattern = this.normalizeRoutePattern(
        entry.routename,
      );
      if (entryNormalizedPattern === normalizedPattern) {
        // Check if any methods overlap
        const overlappingMethods = entry.methods.filter((method) =>
          methods.includes(method)
        );

        if (overlappingMethods.length > 0) {
          throw new MageError(
            `Duplicate route detected: "${routename}" conflicts with existing route "${entry.routename}" for method(s) ${
              overlappingMethods.join(", ")
            }. Each route pattern can only be registered once per HTTP method.`,
            500,
          );
        }
      }
    }
  }
}
