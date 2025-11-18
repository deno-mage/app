import { MageError } from "../app/error.ts";
import type { MageMiddleware, MageRouter, MatchResult } from "../app/router.ts";

/**
 * Validates and decodes a route parameter value to prevent path traversal attacks.
 *
 * Security algorithm:
 * 1. Decode URL-encoded parameter
 * 2. Check for path traversal patterns (../, ..\, encoded variants)
 * 3. Use case-insensitive matching to catch evasion attempts
 *
 * @throws MageError if parameter contains path traversal sequences or invalid encoding
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

  // Check for path traversal sequences (case-insensitive to prevent evasion)
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
 * "/users//123" → "/users/123"
 * "//users/123" → "/users/123"
 * "/users/123/" → "/users/123"
 */
function normalizePath(pathname: string): string {
  return pathname
    .split("/")
    .filter((part) => part !== "") // Remove empty segments
    .join("/")
    .replace(/^/, "/"); // Ensure leading slash
}

/**
 * Match a route pattern against a pathname.
 *
 * Algorithm:
 * 1. Normalize pathname (remove consecutive/trailing slashes)
 * 2. Split both route and path into segments
 * 3. Match segment by segment:
 *    - Wildcard (*) matches all remaining segments
 *    - Parameters (:name) extract and validate the segment
 *    - Static segments must match exactly
 * 4. Verify full path is consumed (no extra segments)
 */
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

  // Ensure all path parts are matched (prevents /users from matching /users/123)
  if (routeParts.length !== pathParts.length) {
    return { match: false };
  }

  return { match: true, params };
}

/**
 * RouterEntry is an entry in the router's middleware registry.
 */
interface RouterEntry {
  /** HTTP methods this middleware runs for (undefined = all methods) */
  methods?: string[];
  /** Route pattern this middleware runs for (undefined = all routes) */
  routename?: string;
  /** Middleware functions to execute */
  middleware: MageMiddleware[];
}

/**
 * Calculate route specificity score for sorting.
 * Higher scores = more specific = higher priority.
 *
 * Scoring:
 * - Static segment: 3 points (most specific)
 * - Parameter segment: 2 points (medium specific)
 * - Wildcard segment: 1 point (least specific)
 */
function calculateRouteSpecificity(routename: string): number {
  const segments = routename.split("/").filter((s) => s !== "");
  let score = 0;

  for (const segment of segments) {
    if (segment === "*") {
      score += 1; // Wildcard: lowest priority
    } else if (segment.startsWith(":")) {
      score += 2; // Parameter: medium priority
    } else {
      score += 3; // Static: highest priority
    }
  }

  return score;
}

/**
 * LinearRouter uses linear search (O(n)) to match routes.
 * Simple, proven implementation suitable for most applications.
 *
 * Routes are automatically sorted by specificity when matching:
 * 1. Static routes (exact matches) - highest priority
 * 2. Parameterized routes (:param) - medium priority
 * 3. Wildcard routes (*) - lowest priority
 *
 * Best for:
 * - Small to medium applications (< 100 routes)
 * - Applications where simplicity matters
 */
export class LinearRouter implements MageRouter {
  private _entries: RouterEntry[] = [];

  /**
   * Match middleware for a given request and extract parameters.
   */
  public match(url: URL, method: string): MatchResult {
    let matchedRoutename = false;
    let matchedMethod = false;
    let params: { [key: string]: string } = {};
    let wildcard: string | undefined;

    // Collect all matching entries (globals + route matches)
    const matchedEntries: Array<{
      entry: RouterEntry;
      entryParams: { [key: string]: string };
      entryWildcard: string | undefined;
      specificity: number;
      isGlobal: boolean;
    }> = [];

    for (const entry of this._entries) {
      if (entry.routename) {
        // Route-specific middleware
        const result = matchRoutename(entry.routename, url.pathname);

        if (!result.match) {
          continue; // Skip non-matching routes
        }

        matchedRoutename = true;

        // Check method matching
        if (entry.methods && !entry.methods.includes(method)) {
          continue; // Skip method mismatches
        }

        if (entry.methods) {
          matchedMethod = true;
        }

        const specificity = calculateRouteSpecificity(entry.routename);
        matchedEntries.push({
          entry,
          entryParams: result.params,
          entryWildcard: result.wildcard,
          specificity,
          isGlobal: false,
        });
      } else {
        // Global middleware (always matches)
        // Check method matching
        if (entry.methods && !entry.methods.includes(method)) {
          continue; // Skip method mismatches
        }

        if (entry.methods) {
          matchedMethod = true;
        }

        matchedEntries.push({
          entry,
          entryParams: {},
          entryWildcard: undefined,
          specificity: 0,
          isGlobal: true,
        });
      }
    }

    // Separate globals from route matches
    const globals = matchedEntries.filter((item) => item.isGlobal);
    const routeMatches = matchedEntries.filter((item) => !item.isGlobal);

    // Sort route matches by specificity (most specific first)
    routeMatches.sort((a, b) => b.specificity - a.specificity);

    // Use params/wildcard from the most specific route match
    if (routeMatches.length > 0) {
      const mostSpecific = routeMatches[0];
      params = mostSpecific.entryParams;
      wildcard = mostSpecific.entryWildcard;
    }

    // Extract middleware: globals in registration order, then all route matches by specificity
    const middleware = [
      ...globals.flatMap((item) => item.entry.middleware),
      ...routeMatches.flatMap((item) => item.entry.middleware),
    ];

    return {
      middleware,
      matchedRoutename,
      matchedMethod,
      params,
      wildcard,
    };
  }

  /**
   * Get available HTTP methods registered for a pathname.
   * Used for generating 405 Method Not Allowed responses with Allow header.
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
   * Register global middleware that runs for every request.
   *
   * If a request is only handled by global middleware (no route-specific
   * middleware matched), the default behavior is to respond with 404 Not Found.
   */
  public use(...middleware: (MageMiddleware | MageMiddleware[])[]) {
    this._entries.push({
      middleware: middleware.flat(),
    });
  }

  /**
   * Register middleware for all HTTP methods.
   * Accepts optional route pattern to limit which paths the middleware runs for.
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
   * Register middleware for GET and HEAD requests.
   * Accepts optional route pattern to limit which paths the middleware runs for.
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
   * Register middleware for POST requests.
   * Accepts optional route pattern to limit which paths the middleware runs for.
   */
  public post(
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void {
    this.pushEntry(routenameOrMiddleware, ["POST"], ...middleware);
  }

  /**
   * Register middleware for PUT requests.
   * Accepts optional route pattern to limit which paths the middleware runs for.
   */
  public put(
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void {
    this.pushEntry(routenameOrMiddleware, ["PUT"], ...middleware);
  }

  /**
   * Register middleware for DELETE requests.
   * Accepts optional route pattern to limit which paths the middleware runs for.
   */
  public delete(
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void {
    this.pushEntry(routenameOrMiddleware, ["DELETE"], ...middleware);
  }

  /**
   * Register middleware for PATCH requests.
   * Accepts optional route pattern to limit which paths the middleware runs for.
   */
  public patch(
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void {
    this.pushEntry(routenameOrMiddleware, ["PATCH"], ...middleware);
  }

  /**
   * Register middleware for OPTIONS requests.
   * Accepts optional route pattern to limit which paths the middleware runs for.
   */
  public options(
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void {
    this.pushEntry(routenameOrMiddleware, ["OPTIONS"], ...middleware);
  }

  /**
   * Register middleware for HEAD requests.
   * Accepts optional route pattern to limit which paths the middleware runs for.
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
   * Validates route pattern format at registration time to prevent runtime errors.
   *
   * Enforces:
   * - Must start with "/"
   * - No consecutive slashes ("/users//posts")
   * - Wildcard "*" only at end
   * - Unique, non-empty parameter names
   *
   * @throws MageError if the route pattern is invalid
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
   * Normalizes route pattern by replacing param names with placeholders.
   * Enables detection of functionally identical routes with different param names.
   *
   * "/users/:id" → "/users/:param"
   * "/users/:userId" → "/users/:param" (functionally identical to above)
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
   * Validates no duplicate route patterns exist for the same HTTP method.
   * Prevents param conflicts where "/users/:id" and "/users/:userId" would both match,
   * causing only the last match's params to be available.
   *
   * @throws MageError if duplicate route detected
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
