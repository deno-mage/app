import type { MageContext } from "../app/context.ts";
import type { ValidationSource } from "./types.ts";
import { MageError } from "../app/error.ts";

/**
 * Coalesce multi-value form/search params into arrays.
 *
 * Single values remain strings, multiple values become string arrays.
 * This handles cases where a form field or query param appears multiple times.
 *
 * Algorithm: State machine with three states to minimize allocations:
 * - undefined → string (first occurrence, no array created)
 * - string → [string, string] (second occurrence, create array)
 * - array → array.push(string) (third+ occurrence, append to existing array)
 *
 * This avoids creating arrays until absolutely necessary (2nd occurrence).
 *
 * @example
 * ```ts
 * // Input: [["name", "John"], ["tags", "a"], ["tags", "b"]]
 * // Output: { name: "John", tags: ["a", "b"] }
 * ```
 */
const coalesceMultiValues = (
  entries: Iterable<[string, string]>,
): Record<string, string | string[]> => {
  const values = new Map<string, string | string[]>();

  for (const [key, value] of entries) {
    const existing = values.get(key);
    if (existing === undefined) {
      // First occurrence - store as string
      values.set(key, value);
    } else if (Array.isArray(existing)) {
      // Third+ occurrence - append to array
      existing.push(value);
    } else {
      // Second occurrence - convert to array
      values.set(key, [existing, value]);
    }
  }

  return Object.fromEntries(values);
};

/**
 * Extract data from request based on validation source.
 *
 * Sources:
 * - `json`: Request body as JSON
 * - `form`: Form data (filters out File objects, keeps only strings)
 * - `search`: URL search/query parameters
 * - `params`: Route/path parameters
 *
 * @param c - Mage context
 * @param source - The source to extract data from
 * @returns The extracted data
 * @throws Error if data extraction fails (e.g., invalid JSON)
 * @throws MageError if source is invalid
 */
export const extractSourceData = async (
  c: MageContext,
  source: ValidationSource,
): Promise<unknown> => {
  switch (source) {
    case "json": {
      return await c.req.json();
    }

    case "form": {
      const formData = await c.req.formData();
      // Filter out File objects, only keep string values
      const stringEntries: Array<[string, string]> = [];
      formData.forEach((value, key) => {
        if (typeof value === "string") {
          stringEntries.push([key, value]);
        }
      });
      return coalesceMultiValues(stringEntries);
    }

    case "params": {
      return c.req.params;
    }

    case "search": {
      return coalesceMultiValues(c.req.url.searchParams.entries());
    }

    default: {
      throw new MageError(
        `[Validator] Invalid source: ${source}`,
      );
    }
  }
};
