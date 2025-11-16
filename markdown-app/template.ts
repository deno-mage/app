import type { NavigationData } from "./navigation.ts";

/**
 * Template data for rendering TSX layouts.
 */
export interface TemplateData {
  title: string;
  content: string;
  navigation: NavigationData;
  basePath: string;
  [key: string]: unknown;
}
