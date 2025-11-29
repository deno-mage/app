/**
 * Page and layout composition.
 *
 * @module
 */

import type { ComponentChildren, VNode } from "preact";
import { FrontmatterProvider } from "./context.tsx";
import type { LoadedLayout } from "./layout-loader.ts";
import type { Frontmatter, LayoutComponent } from "./types.ts";

/**
 * Composes a page with its layouts into a single component tree.
 *
 * The composition wraps layouts from outermost (root, depth 0) to
 * innermost (closest to page). The page content is the innermost child.
 *
 * The entire tree is wrapped in a FrontmatterProvider so any component
 * can access the page's frontmatter via useFrontmatter().
 *
 * @param page The page content (VNode or ComponentChildren)
 * @param layouts Loaded layouts ordered by depth (root first)
 * @param frontmatter Page frontmatter to provide via context
 * @returns Composed component tree ready for rendering
 *
 * @example Composition order
 * ```
 * // For page at docs/api/request.tsx with layouts at "", "docs", "docs/api":
 *
 * <FrontmatterProvider frontmatter={frontmatter}>
 *   <RootLayout>           // depth 0
 *     <DocsLayout>         // depth 1
 *       <ApiLayout>        // depth 2
 *         <RequestPage />  // the page
 *       </ApiLayout>
 *     </DocsLayout>
 *   </RootLayout>
 * </FrontmatterProvider>
 * ```
 *
 * @example Usage
 * ```typescript
 * const page = await loadTsxPage(pagePath);
 * const layouts = await loadLayouts(layoutInfos);
 * const PageComponent = page.component;
 *
 * const tree = composePage(
 *   <PageComponent />,
 *   layouts,
 *   page.frontmatter
 * );
 * ```
 */
export function composePage(
  page: ComponentChildren,
  layouts: LoadedLayout[],
  frontmatter: Frontmatter,
): VNode {
  // Start with the page as the innermost content
  let composed: ComponentChildren = page;

  // Wrap layouts from innermost to outermost
  // layouts are ordered root-first, so we iterate in reverse
  for (let i = layouts.length - 1; i >= 0; i--) {
    const Layout = layouts[i].component;
    composed = <Layout>{composed}</Layout>;
  }

  // Wrap everything in FrontmatterProvider
  return (
    <FrontmatterProvider frontmatter={frontmatter}>
      {composed}
    </FrontmatterProvider>
  );
}

/**
 * Composes a page with a single layout component.
 *
 * Simpler version for when you have a single layout component
 * rather than an array of LoadedLayout objects.
 *
 * @param page The page content
 * @param Layout The layout component (or null for no layout)
 * @param frontmatter Page frontmatter to provide via context
 * @returns Composed component tree
 */
export function composeWithLayout(
  page: ComponentChildren,
  Layout: LayoutComponent | null,
  frontmatter: Frontmatter,
): VNode {
  const content = Layout ? <Layout>{page}</Layout> : <>{page}</>;

  return (
    <FrontmatterProvider frontmatter={frontmatter}>
      {content}
    </FrontmatterProvider>
  );
}
