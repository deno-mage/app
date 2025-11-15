import type { Frontmatter } from "./parser.ts";

/**
 * Sitemap URL entry.
 */
interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
}

/**
 * Generate sitemap.xml content from pages.
 *
 * @param pages - Array of page frontmatter
 * @param siteUrl - Base site URL (e.g., "https://example.com")
 * @param basePath - Base path for routes (e.g., "/docs")
 * @returns XML string for sitemap.xml
 */
export function generateSitemap(
  pages: Frontmatter[],
  siteUrl: string,
  basePath: string,
): string {
  // Normalize siteUrl (remove trailing slash)
  const normalizedSiteUrl = siteUrl.replace(/\/$/, "");

  // Normalize basePath (empty string if just "/")
  const normalizedBasePath = basePath === "/" ? "" : basePath;

  // Build sitemap URLs
  const urls: SitemapUrl[] = pages.map((page) => {
    const slug = page.slug === "/" || page.slug === "index" || page.slug === ""
      ? ""
      : `/${page.slug}`;

    const url: SitemapUrl = {
      loc: `${normalizedSiteUrl}${normalizedBasePath}${slug}`,
    };

    // Add optional fields if present
    if (page.lastmod) {
      // Handle both string and Date types (YAML parser may convert dates)
      const lastmodValue = page.lastmod as unknown;
      url.lastmod = lastmodValue instanceof Date
        ? lastmodValue.toISOString().split("T")[0]
        : String(page.lastmod);
    }
    if (page.changefreq) {
      url.changefreq = page.changefreq;
    }
    if (page.priority !== undefined) {
      url.priority = page.priority;
    }

    return url;
  });

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => renderSitemapUrl(url)).join("\n")}
</urlset>`;

  return xml;
}

/**
 * Render a single sitemap URL entry.
 */
function renderSitemapUrl(url: SitemapUrl): string {
  let xml = `  <url>\n    <loc>${escapeXml(url.loc)}</loc>`;

  if (url.lastmod) {
    xml += `\n    <lastmod>${escapeXml(url.lastmod)}</lastmod>`;
  }
  if (url.changefreq) {
    xml += `\n    <changefreq>${escapeXml(url.changefreq)}</changefreq>`;
  }
  if (url.priority !== undefined) {
    xml += `\n    <priority>${url.priority.toFixed(1)}</priority>`;
  }

  xml += `\n  </url>`;
  return xml;
}

/**
 * Escape XML special characters.
 */
function escapeXml(str: string | number): string {
  const strValue = String(str);
  return strValue
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
