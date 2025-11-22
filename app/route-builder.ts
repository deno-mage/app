import type { MageContext } from "./context.ts";
import type { MageMiddleware, MageRouter } from "./router.ts";
import type {
  ValidatedContext,
  ValidateOptions,
  ValidationConfig,
} from "../validate/types.ts";
import { performValidation } from "../validate/validator.ts";

/**
 * Builder for non-validated routes.
 * Returned by app.get(), app.post(), etc. when called without middleware.
 */
export class RouteBuilder {
  constructor(
    private router: MageRouter,
    private method: string,
    private path: string,
  ) {}

  /**
   * Add validation to this route.
   * Returns a ValidatedRouteBuilder with typed context.
   *
   * @param config - Validation configuration mapping sources to schemas
   * @param options - Validation options (reportErrors, onError)
   * @returns ValidatedRouteBuilder with typed context
   *
   * @example
   * ```ts
   * app.post("/users/:id")
   *   .validate({
   *     params: z.object({ id: z.string().uuid() }),
   *     json: z.object({ name: z.string() }),
   *   })
   *   .handle((c) => {
   *     c.valid.params  // Auto-typed!
   *     c.valid.json    // Auto-typed!
   *   })
   * ```
   */
  validate<TConfig extends ValidationConfig>(
    config: TConfig,
    options?: ValidateOptions,
  ): ValidatedRouteBuilder<TConfig> {
    return new ValidatedRouteBuilder(
      this.router,
      this.method,
      this.path,
      config,
      options,
    );
  }

  /**
   * Register handler and middleware for this route (no validation).
   *
   * @param middleware - Middleware functions and handler (last argument must be handler)
   *
   * @example
   * ```ts
   * app.post("/webhook")
   *   .handle(verifySignature, (c) => {
   *     // Handler code
   *   })
   * ```
   */
  handle(
    ...middleware: [
      ...MageMiddleware[],
      (c: MageContext) => void | Promise<void>,
    ]
  ): void {
    // Extract handler (last element)
    const handler = middleware[middleware.length - 1] as MageMiddleware;
    const otherMiddleware = middleware.slice(0, -1) as MageMiddleware[];

    // Register route with router
    const routeMethod = this.method.toLowerCase() as
      | "get"
      | "post"
      | "put"
      | "delete"
      | "patch"
      | "options"
      | "head";

    this.router[routeMethod](this.path, ...otherMiddleware, handler);
  }
}

/**
 * Builder for validated routes.
 * Handler receives ValidatedContext<TConfig> with typed c.valid property.
 */
export class ValidatedRouteBuilder<TConfig extends ValidationConfig> {
  constructor(
    private router: MageRouter,
    private method: string,
    private path: string,
    private config: TConfig,
    private options?: ValidateOptions,
  ) {}

  /**
   * Register handler and middleware for this validated route.
   * Handler receives ValidatedContext with typed c.valid property.
   *
   * @param middleware - Middleware functions and handler (last argument must be handler)
   *
   * @example
   * ```ts
   * app.post("/users/:id")
   *   .validate({ params: idSchema, json: bodySchema })
   *   .handle(auth, logging, (c) => {
   *     c.valid.params  // Auto-typed!
   *     c.valid.json    // Auto-typed!
   *   })
   * ```
   */
  handle(
    ...middleware: [
      ...MageMiddleware[],
      (c: ValidatedContext<TConfig>) => void | Promise<void>,
    ]
  ): void {
    // Extract handler (last element)
    const handler = middleware[middleware.length - 1] as (
      c: ValidatedContext<TConfig>,
    ) => void | Promise<void>;
    const otherMiddleware = middleware.slice(0, -1) as MageMiddleware[];

    // Create validation middleware
    const validationMiddleware: MageMiddleware = async (c, next) => {
      const passed = await performValidation(c, this.config, this.options);
      if (passed) {
        await next();
      }
    };

    // Register route with validation middleware + user middleware + handler
    const routeMethod = this.method.toLowerCase() as
      | "get"
      | "post"
      | "put"
      | "delete"
      | "patch"
      | "options"
      | "head";

    this.router[routeMethod](
      this.path,
      validationMiddleware,
      ...otherMiddleware,
      handler as unknown as MageMiddleware, // Cast to MageMiddleware for router
    );
  }
}
