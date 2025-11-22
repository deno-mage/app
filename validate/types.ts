import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { MageContext } from "../app/context.ts";
import type { MageMiddleware } from "../app/router.ts";

/**
 * Validation sources for request data.
 */
export type ValidationSource = "json" | "form" | "search" | "params";

/**
 * Extract the output type from a Standard Schema.
 */
export type InferOutput<T extends StandardSchemaV1> = T extends
  StandardSchemaV1<infer _In, infer Out> ? Out : never;

/**
 * Validation configuration object mapping sources to schemas.
 */
export type ValidationConfig = {
  [K in ValidationSource]?: StandardSchemaV1;
};

/**
 * Build validated data type from config.
 *
 * Only includes sources that were actually validated.
 * Properties are readonly to prevent reassignment.
 */
export type ValidatedData<TConfig extends ValidationConfig> = {
  readonly [K in keyof TConfig]: TConfig[K] extends StandardSchemaV1
    ? InferOutput<TConfig[K]>
    : never;
};

/**
 * Validation error for a single source.
 */
export interface ValidationError {
  /** The source that failed validation */
  source: ValidationSource;
  /** Validation issues from the schema validator */
  issues: readonly unknown[];
}

/**
 * Options for validation.
 */
export interface ValidateOptions {
  /**
   * Report detailed validation errors in response (default: false).
   *
   * When true, returns a JSON response with all validation errors.
   * When false, throws a generic MageError with status 400.
   */
  reportErrors?: boolean;

  /**
   * Custom error handler - receives all accumulated errors.
   *
   * If this returns a Response, that response is sent to the client.
   * If this returns void, the default error handling is used.
   *
   * @param errors - All validation errors from all sources
   * @returns Response to send, or void to use default handling
   */
  onError?: (errors: ValidationError[]) => Response | void;
}

/**
 * Validator instance with validation middleware and typed data getter.
 */
export interface Validator<TConfig extends ValidationConfig> {
  /**
   * Validation middleware function.
   * Can be passed directly to route registration.
   */
  readonly validate: MageMiddleware;

  /**
   * Get validated data from context (fully typed).
   *
   * @param c - Mage context
   * @returns Validated data with inferred types
   * @throws MageError if validation data not found in context
   */
  valid(c: MageContext): ValidatedData<TConfig>;
}
