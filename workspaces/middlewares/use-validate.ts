import { StatusCode, StatusText } from "@mage/app";
import type { MageMiddleware } from "@mage/app";
import type { StandardSchemaV1 } from "@standard-schema/spec";

type ValidationSource = "json" | "form" | "params" | "search-params";

interface UseValidateOptions {
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
export const useValidate = (
  source: ValidationSource,
  schema: StandardSchemaV1,
  options?: UseValidateOptions,
): MageMiddleware => {
  return async (context, next) => {
    let data: unknown;

    switch (source) {
      case "json": {
        data = await context.request.json();
        break;
      }
      case "form": {
        const values = new Map<string, string | string[]>();
        const formData = await context.request.formData();
        formData.forEach((value, key) => {
          if (typeof value === "string") {
            if (values.has(key)) {
              values.set(key, [values.get(key) as string, value]);
            } else {
              values.set(key, value);
            }
          }
        });
        data = Object.fromEntries(values);
        break;
      }
      case "params": {
        data = context.params;
        break;
      }
      case "search-params": {
        data = Object.fromEntries(context.request.url.searchParams);
        break;
      }
      default: {
        console.error("[useValidate] Invalid source:", source);
        context.text(
          StatusCode.InternalServerError,
          StatusText.InternalServerError,
        );
        return;
      }
    }

    const result = await schema["~standard"].validate(data);

    if (!result.issues) {
      context.setValidationResult(source, schema, result.value);
      await next();
      return;
    }

    if (options?.reportErrors) {
      context.json(StatusCode.BadRequest, result.issues);
      return;
    }

    context.text(StatusCode.BadRequest, StatusText.BadRequest);
  };
};
