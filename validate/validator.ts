import type { MageContext } from "../app/context.ts";
import type {
  ValidateOptions,
  ValidationConfig,
  ValidationError,
  ValidationSource,
} from "./types.ts";
import { extractSourceData } from "./extractors.ts";
import { MageError } from "../app/error.ts";

// Types for error categorization
type ProgrammerError = Error & { status: 500 };
type ValidationFailure = Error;

/**
 * Perform validation and extend context with validated data.
 *
 * This is used internally by ValidatedRouteBuilder.
 * Returns true if validation passed, false otherwise.
 *
 * @param c - Mage context
 * @param config - Validation configuration mapping sources to schemas
 * @param options - Validation options (reportErrors, onError)
 * @returns True if validation passed, false if failed and response was set
 * @throws MageError if validation fails and no custom error handling
 */
export async function performValidation(
  c: MageContext,
  config: ValidationConfig,
  options?: ValidateOptions,
): Promise<boolean> {
  // Empty config = no-op
  if (Object.keys(config).length === 0) {
    Object.defineProperty(c, "valid", {
      value: {},
      writable: false,
      enumerable: true,
      configurable: false,
    });
    return true;
  }

  const validated: Record<string, unknown> = {};
  const errors: ValidationError[] = [];

  // Validate each source (accumulate errors)
  for (const [source, schema] of Object.entries(config)) {
    const sourceKey = source as ValidationSource;

    try {
      const data = await extractSourceData(c, sourceKey);
      const result = await schema["~standard"].validate(data);

      if (result.issues) {
        errors.push({ source: sourceKey, issues: result.issues });
      } else {
        validated[sourceKey] = result.value;
      }
    } catch (error) {
      // Re-throw programmer errors (e.g., invalid source)
      if (error instanceof MageError && error.status === 500) {
        throw error;
      }
      // Treat other errors as validation failures
      errors.push({
        source: sourceKey,
        issues: [{
          message: error instanceof Error ? error.message : "Extraction failed",
        }],
      });
    }
  }

  // Handle validation failures
  if (errors.length > 0) {
    if (options?.onError) {
      const response = options.onError(errors);
      if (response) {
        c.res.setExternal(response);
        return false;
      }
    }

    if (options?.reportErrors) {
      c.json({ errors }, 400);
      return false;
    }

    const sources = errors.map((e) => e.source).join(", ");
    throw new MageError(
      `[Validation] Validation failed for: ${sources}`,
      400,
    );
  }

  // Success - extend context
  Object.defineProperty(c, "valid", {
    value: validated,
    writable: false,
    enumerable: true,
    configurable: false,
  });

  return true;
}
