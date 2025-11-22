/**
 * Validation module for Mage applications.
 *
 * Provides a builder-based API to validate request sources with full
 * type inference. Supports JSON, form data, search params, and route params.
 *
 * @example
 * ```ts
 * import { z } from "zod";
 *
 * app.post("/users/:id")
 *   .validate({
 *     params: z.object({ id: z.string().uuid() }),
 *     json: z.object({ name: z.string(), email: z.string().email() }),
 *   })
 *   .handle((c) => {
 *     const { id } = c.valid.params;  // Auto-typed!
 *     const { name, email } = c.valid.json;
 *     // ...
 *   });
 * ```
 *
 * @module
 */

export type {
  InferOutput,
  ValidatedContext,
  ValidatedData,
  ValidateOptions,
  ValidationConfig,
  ValidationError,
  ValidationSource,
} from "./types.ts";

export { performValidation } from "./validator.ts";
export { extractSourceData } from "./extractors.ts";
