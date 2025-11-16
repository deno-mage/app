/**
 * Generate robots.txt content.
 *
 * @param siteUrl - Base site URL (e.g., "https://example.com")
 * @param basePath - Base path for routes (e.g., "/docs")
 * @returns Content for robots.txt
 */
export function generateRobotsTxt(
  siteUrl: string,
  basePath: string,
): string {
  // Normalize siteUrl (remove trailing slash)
  const normalizedSiteUrl = siteUrl.replace(/\/$/, "");

  // Normalize basePath (empty string if just "/")
  const normalizedBasePath = basePath === "/" ? "" : basePath;

  const sitemapUrl = `${normalizedSiteUrl}${normalizedBasePath}/sitemap.xml`;

  return `# Allow all crawlers
User-agent: *
Allow: /

# Sitemap location
Sitemap: ${sitemapUrl}
`;
}
