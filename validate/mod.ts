/**
 * Validator module for Mage applications.
 *
 * Provides a factory-based API to create validators with type-safe data access.
 * Supports JSON, form data, search params, and route params.
 *
 * @module
 */

export type {
  InferOutput,
  ValidatedData,
  ValidateOptions,
  ValidationConfig,
  ValidationError,
  ValidationSource,
  Validator,
} from "./types.ts";

export { validator } from "./validator.ts";
export { extractSourceData } from "./extractors.ts";
