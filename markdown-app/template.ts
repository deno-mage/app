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
  /**
   * Generate asset URL with automatic cache-busting.
   *
   * Files in assets/ directory return hashed paths (e.g., "main.css" → "/__assets/main-a3f2b1c8.css").
   * Other files get basePath prepended (e.g., "gfm.css" → "/gfm.css").
   */
  asset: (path: string) => string;
  /** Additional custom properties can be passed to layouts for advanced use cases */
  [key: string]: unknown;
}
