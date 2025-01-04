import type { MageContext } from "../context.ts";

type ContentSecurityPolicyOptions = Record<string, string | string[]>;

/**
 * Apply a Content-Security-Policy header based on the provided options.
 *
 * @returns string
 */
export const contentSecurityPolicy = (
  context: MageContext,
  options: ContentSecurityPolicyOptions,
): void => {
  const header = Object.entries(options)
    .map(([key, value]) => {
      const values = Array.isArray(value) ? value : [value];
      return `${key} ${values.join(" ")}`;
    })
    .join(";");

  context.response.headers.set("Content-Security-Policy", header);
};
