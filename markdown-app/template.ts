/**
 * Simple {{key}} and {{key.nested}} template replacement engine.
 *
 * Replaces {{key}} and {{key.nested}} patterns in template strings with values from the data object.
 * Supports dot notation for nested object access.
 */

/**
 * Template data for rendering layouts.
 */
export interface TemplateData {
  title: string;
  content: string;
  navigation: NavigationData;
  basePath: string;
  [key: string]: unknown;
}

/**
 * Navigation data grouped by nav-group.
 */
export interface NavigationData {
  [group: string]: string;
}

/**
 * Get a nested value from an object using dot notation.
 */
function getNestedValue(obj: unknown, path: string): string {
  const parts = path.split(".");
  let value: unknown = obj;

  for (const part of parts) {
    if (value === null || value === undefined) {
      return "";
    }
    if (typeof value === "object" && part in value) {
      value = (value as Record<string, unknown>)[part];
    } else {
      return "";
    }
  }

  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

/**
 * Render a template string by replacing {{key}} and {{key.nested}} patterns with values from data.
 */
export function renderTemplate(
  template: string,
  data: TemplateData,
): string {
  return template.replace(/\{\{([\w.]+)\}\}/g, (_match, key) => {
    return getNestedValue(data, key);
  });
}
