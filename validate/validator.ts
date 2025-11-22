import type { MageContext } from "../app/context.ts";
import type {
  ValidatedData,
  ValidateOptions,
  ValidationConfig,
  ValidationError,
  ValidationSource,
  Validator,
} from "./types.ts";
import { extractSourceData } from "./extractors.ts";
import { MageError } from "../app/error.ts";

/**
 * Create a validation middleware with type-safe data accessor.
 *
 * @param config - Validation configuration mapping sources to schemas
 * @param options - Validation options (reportErrors, onError)
 * @returns Validator instance with validate middleware and valid() getter
 */
export function validator<TConfig extends ValidationConfig>(
  config: TConfig,
  options?: ValidateOptions,
): Validator<TConfig> {
  // Use unique UUID-based key to avoid collisions in context storage
  const storageKey = `__mage_validator_${crypto.randomUUID()}__`;

  // Validation middleware function
  const validate = async (c: MageContext, next: () => Promise<void> | void) => {
    // Empty config = no-op (early exit for performance)
    if (!config.json && !config.form && !config.params && !config.search) {
      c.set(storageKey, {});
      await next();
      return;
    }

    const validated: Record<string, unknown> = {};
    let errors: ValidationError[] | undefined;

    // Validate each source (accumulate errors)
    for (const [source, schema] of Object.entries(config)) {
      const sourceKey = source as ValidationSource;

      try {
        const data = await extractSourceData(c, sourceKey);
        const result = await schema["~standard"].validate(data);

        if (result.issues) {
          if (!errors) errors = [];
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
        if (!errors) errors = [];
        errors.push({
          source: sourceKey,
          issues: [{
            message: error instanceof Error
              ? error.message
              : "Extraction failed",
          }],
        });
      }
    }

    // Handle validation failures
    if (errors) {
      if (options?.onError) {
        const response = options.onError(errors);
        if (response) {
          c.res.setExternal(response);
          return;
        }
      }

      if (options?.reportErrors) {
        c.json({ errors }, 400);
        return;
      }

      const sources = errors.map((e) => e.source).join(", ");
      throw new MageError(
        `[Validator] Validation failed for: ${sources}`,
        400,
      );
    }

    // Success - store in context
    c.set(storageKey, validated);
    await next();
  };

  // Typed data getter function
  const valid = (c: MageContext): ValidatedData<TConfig> => {
    const result = c.get(storageKey);

    if (result === undefined) {
      throw new MageError(
        "[Validator] No validation data found - did you forget to add the validator middleware?",
      );
    }

    return result as ValidatedData<TConfig>;
  };

  return {
    validate,
    valid,
  };
}
