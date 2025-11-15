/**
 * Simple {{key}} template replacement engine.
 *
 * Replaces {{key}} patterns in template strings with values from the data object.
 */

/**
 * Template data for rendering layouts.
 */
export interface TemplateData {
  title: string;
  content: string;
  navigation: string;
  basePath: string;
  [key: string]: string;
}

/**
 * Render a template string by replacing {{key}} patterns with values from data.
 */
export function renderTemplate(
  template: string,
  data: TemplateData,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    const value = data[key];
    if (value === undefined) {
      // Return empty string for undefined values (graceful degradation)
      return "";
    }
    return value;
  });
}
