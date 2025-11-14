import { MageError, type MageMiddleware } from "../app/mod.ts";
import type { StandardSchemaV1 } from "@standard-schema/spec";

type ValidationSource = "json" | "form" | "params" | "search-params";

interface ValidateOptions {
  /** Report validation errors in response body (otherwise just 400) */
  reportErrors?: boolean;
}

/**
 * Validate request data against a Standard Schema.
 * Returns 400 Bad Request on validation failure.
 *
 * Sources: "json" | "form" | "params" | "search-params"
 *
 * @throws MageError if validation source is invalid or validation fails
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
