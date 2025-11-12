import { MageError, type MageMiddleware } from "../app/mod.ts";
import type { StandardSchemaV1 } from "@standard-schema/spec";

type ValidationSource = "json" | "form" | "params" | "search-params";

interface ValidateOptions {
  /**
   * If true then the validation errors will be reported in the
   * response body. If false then a 400 Bad Request status code
   * will be returned without any error details.
   */
  reportErrors?: boolean;
}

/**
 * Validates the request based on a Standard Schema. If the request
 * does not match the schema then a 400 Bad Request status code is
 * returned.
 *
 * The source parameter is used to determine where the request data
 * should be validated from. The source can be one of the following:
 *
 * - "json" - The request body as JSON
 * - "form" - The requests form data
 * - "params" - The route parameters
 * - "search-params" - The URL search parameters
 *
 * @param source - The source of the request data to validate
 * @param schema - The schema to validate the request against
 * @param options - Additional options for the validation
 * @returns MageMiddleware
 */
export const validate = (
  source: ValidationSource,
  schema: StandardSchemaV1,
  options?: ValidateOptions,
): MageMiddleware => {
  return async (c, next) => {
    let data: unknown;

    switch (source) {
      case "json": {
        data = await c.req.json();
        break;
      }
      case "form": {
        const values = new Map<string, string | string[]>();
        const formData = await c.req.formData();
        formData.forEach((value, key) => {
          if (typeof value === "string") {
            const existing = values.get(key);
            if (existing === undefined) {
              values.set(key, value);
            } else if (Array.isArray(existing)) {
              existing.push(value);
            } else {
              values.set(key, [existing, value]);
            }
          }
        });
        data = Object.fromEntries(values);
        break;
      }
      case "params": {
        data = c.req.params;
        break;
      }
      case "search-params": {
        const values = new Map<string, string | string[]>();
        c.req.url.searchParams.forEach((value, key) => {
          const existing = values.get(key);
          if (existing === undefined) {
            values.set(key, value);
          } else if (Array.isArray(existing)) {
            existing.push(value);
          } else {
            values.set(key, [existing, value]);
          }
        });
        data = Object.fromEntries(values);
        break;
      }
      default: {
        throw new MageError(`[Validate middleware] Invalid source: ${source}`);
      }
    }

    const result = await schema["~standard"].validate(data);

    if (!result.issues) {
      c.req.setValidationResult(source, result.value);
      await next();
      return;
    }

    if (options?.reportErrors) {
      c.json(result.issues, 400);
      return;
    }

    throw new MageError(
      "[Validate middleware] Validation failed",
      400,
    );
  };
};
