import type { SiteMetadata } from "./builder.ts";

/**
 * PWA manifest icon entry.
 */
interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
}

/**
 * PWA manifest structure.
 */
interface WebManifest {
  name: string;
  short_name?: string;
  description?: string;
  start_url: string;
  display: string;
  theme_color?: string;
  background_color?: string;
  icons?: ManifestIcon[];
}

/**
 * Generate manifest.webmanifest content.
 *
 * @param siteMetadata - Site metadata including name, description, icons
 * @param basePath - Base path for routes (e.g., "/docs")
 * @returns JSON string for manifest.webmanifest
 */
export function generateManifest(
  siteMetadata: SiteMetadata,
  basePath: string,
): string {
  // Normalize basePath (empty string if just "/", otherwise ensure leading slash)
  const normalizedBasePath = basePath === "/" ? "" : basePath;

  const manifest: WebManifest = {
    name: siteMetadata.siteName || "Documentation",
    short_name: siteMetadata.siteName || "Docs",
    description: siteMetadata.description,
    start_url: `${normalizedBasePath}/`,
    display: "standalone",
    theme_color: siteMetadata.themeColor || "#ffffff",
    background_color: siteMetadata.themeColor || "#ffffff",
  };

  // Add icons if provided
  const icons: ManifestIcon[] = [];

  if (siteMetadata.icon192Path) {
    icons.push({
      src: `${normalizedBasePath}/${siteMetadata.icon192Path}`,
      sizes: "192x192",
      type: "image/png",
    });
  }

  if (siteMetadata.icon512Path) {
    icons.push({
      src: `${normalizedBasePath}/${siteMetadata.icon512Path}`,
      sizes: "512x512",
      type: "image/png",
    });
  }

  if (siteMetadata.icon512MaskablePath) {
    icons.push({
      src: `${normalizedBasePath}/${siteMetadata.icon512MaskablePath}`,
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    });
  }

  if (icons.length > 0) {
    manifest.icons = icons;
  }

  return JSON.stringify(manifest, null, 2);
}
