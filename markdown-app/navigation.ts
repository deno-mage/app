import type { Frontmatter } from "./parser.ts";

/**
 * Navigation item representing a single page.
 */
export interface NavItem {
  title: string;
  slug: string;
  order: number;
  section?: string;
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
 * Navigation groups mapping group names to HTML strings.
 */
export interface NavigationGroups {
  [group: string]: string;
}

/**
 * Generate grouped navigation HTML from page frontmatter.
 *
 * Returns object with navigation groups, each containing HTML for that group.
 * Groups by nav-group, then by sections within each group.
 * Marks current page with data-current="true".
 */
export function generateNavigation(
  pages: Frontmatter[],
  currentSlug: string,
  basePath: string,
): NavigationGroups {
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

  // Generate HTML for each group
  const navigationGroups: NavigationGroups = {};
  for (const [groupName, groupItems] of groups) {
    const sections = groupBySection(groupItems);
    navigationGroups[groupName] = renderNavigationHtml(
      sections,
      currentSlug,
      basePath,
    );
  }

  return navigationGroups;
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
 * Group navigation items by section.
 *
 * Sections sorted by lowest item order, items sorted by order (alphabetically for ties).
 */
function groupBySection(items: NavItem[]): NavSection[] {
  const sectionMap = new Map<string, NavItem[]>();

  // Group items by section (undefined becomes "")
  for (const item of items) {
    const sectionKey = item.section ?? "";
    if (!sectionMap.has(sectionKey)) {
      sectionMap.set(sectionKey, []);
    }
    sectionMap.get(sectionKey)!.push(item);
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

/**
 * Render navigation sections and items as semantic HTML.
 *
 * Marks current page with aria-current="page" for accessibility and CSS styling.
 */
function renderNavigationHtml(
  sections: NavSection[],
  currentSlug: string,
  basePath: string,
): string {
  if (sections.length === 0) {
    return "<nav></nav>";
  }

  const sectionsHtml = sections.map((section) => {
    const itemsHtml = section.items
      .map((item) => {
        const href = `${basePath}/${item.slug}`.replace(/\/+/g, "/");
        const isCurrent = item.slug === currentSlug;
        const currentAttr = isCurrent ? ' aria-current="page"' : "";

        return `      <li><a href="${href}"${currentAttr}>${item.title}</a></li>`;
      })
      .join("\n");

    // If section has a title, wrap in <section> with <h3>
    if (section.title) {
      return `  <section>
    <h3>${section.title}</h3>
    <ul>
${itemsHtml}
    </ul>
  </section>`;
    }

    // No section title, just render items
    return `  <ul>
${itemsHtml}
  </ul>`;
  }).join("\n");

  return `<nav>
${sectionsHtml}
</nav>`;
}
