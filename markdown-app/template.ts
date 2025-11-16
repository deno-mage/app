import type { NavigationData } from "./navigation.ts";

/**
 * Template data for rendering TSX layouts.
 */
export interface TemplateData {
  /** Page title for <title> tag and heading */
  title: string;
  /** Rendered HTML content from markdown */
  content: string;
  /** Navigation data organized by groups and sections */
  navigation: NavigationData;
  /** Base path for URL generation (empty string for root, "/docs" for subpath) */
  basePath: string;
  /** Additional custom properties can be passed to templates for advanced use cases */
  [key: string]: unknown;
}
