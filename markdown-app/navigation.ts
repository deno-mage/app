import type { Frontmatter } from "./parser.ts";

/**
 * Navigation item representing a single page.
 */
export interface NavItem {
  title: string;
  slug: string;
  href: string;
  order: number;
  section?: string;
  isCurrent: boolean;
}

/**
 * Navigation section containing multiple items.
 */
export interface NavSection {
  title: string;
  order: number;
  items: NavItem[];
}

/**
 * Navigation groups mapping group names to structured data.
 */
export interface NavigationData {
  [group: string]: NavSection[];
}

/**
 * Generate grouped navigation data from page frontmatter.
 *
 * Returns object with navigation groups, each containing structured sections and items.
 * Groups by nav-group, then by sections within each group.
 * Each item includes isCurrent flag and computed href.
 */
export function generateNavigation(
  pages: Frontmatter[],
  currentSlug: string,
  basePath: string,
): NavigationData {
  // Filter pages that have nav-item field
  const navPages = pages.filter((page) => page["nav-item"]);

  // Build nav items with group information
  const navItems = navPages.map((page) => {
    const [section, item] = parseNavField(page["nav-item"]!);
    return {
      title: item || page.title,
      slug: page.slug,
      order: page["nav-order"] ?? 999,
      section,
      group: page["nav-group"] ?? "default",
    };
  });

  // Group by nav-group first
  const groups = new Map<string, typeof navItems>();
  for (const item of navItems) {
    if (!groups.has(item.group)) {
      groups.set(item.group, []);
    }
    groups.get(item.group)!.push(item);
  }

  // Generate structured data for each group
  const navigationData: NavigationData = {};
  for (const [groupName, groupItems] of groups) {
    navigationData[groupName] = groupBySection(
      groupItems,
      currentSlug,
      basePath,
    );
  }

  return navigationData;
}

/**
 * Parse nav field into section and item.
 *
 * "Middleware/CORS" => ["Middleware", "CORS"]
 * "Introduction" => [undefined, "Introduction"]
 */
function parseNavField(nav: string): [string | undefined, string] {
  const parts = nav.split("/");
  if (parts.length === 2) {
    return [parts[0].trim(), parts[1].trim()];
  }
  return [undefined, parts[0].trim()];
}

/**
 * Group navigation items by section and compute hrefs.
 *
 * Sections sorted by lowest item order, items sorted by order (alphabetically for ties).
 */
function groupBySection(
  items: Array<{
    title: string;
    slug: string;
    order: number;
    section?: string;
  }>,
  currentSlug: string,
  basePath: string,
): NavSection[] {
  const sectionMap = new Map<string, NavItem[]>();

  // Group items by section (undefined becomes "")
  for (const item of items) {
    const sectionKey = item.section ?? "";
    if (!sectionMap.has(sectionKey)) {
      sectionMap.set(sectionKey, []);
    }

    // Create NavItem with computed href and isCurrent
    const href = `${basePath}/${item.slug}`.replace(/\/+/g, "/");
    const navItem: NavItem = {
      title: item.title,
      slug: item.slug,
      href,
      order: item.order,
      section: item.section,
      isCurrent: item.slug === currentSlug,
    };

    sectionMap.get(sectionKey)!.push(navItem);
  }

  // Convert to sections and sort
  const sections: NavSection[] = [];
  for (const [sectionTitle, sectionItems] of sectionMap) {
    // Sort items within section
    const sortedItems = sectionItems.sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      return a.title.localeCompare(b.title);
    });

    // Section order is the lowest order of its items
    const sectionOrder = Math.min(...sortedItems.map((i) => i.order));

    sections.push({
      title: sectionTitle,
      order: sectionOrder,
      items: sortedItems,
    });
  }

  // Sort sections by order
  return sections.sort((a, b) => a.order - b.order);
}
