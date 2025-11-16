import type { NavigationData } from "./navigation.ts";

/**
 * Props for rendering TSX layouts.
 */
export interface LayoutProps {
  /** Page title for <title> tag and heading */
  title: string;
  /** Rendered HTML content from markdown (pre-rendered GFM string) */
  articleHtml: string;
  /** Page description for meta tags */
  description?: string;
  /** Navigation data organized by groups and sections */
  navigation: NavigationData;
  /** Base path for URL generation (empty string for root, "/docs" for subpath) */
  basePath: string;
  /** Additional custom properties can be passed to layouts for advanced use cases */
  [key: string]: unknown;
}
