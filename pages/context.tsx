/**
 * Context system for sharing frontmatter across components.
 *
 * @module
 */

import { createContext } from "preact";
import { useContext } from "preact/hooks";
import type { ComponentChildren, VNode } from "preact";
import type { Frontmatter } from "./types.ts";

/**
 * Context for frontmatter data.
 *
 * Provides access to page frontmatter from any component
 * within the page tree.
 */
export const FrontmatterContext = createContext<Frontmatter | null>(null);

/**
 * Props for the FrontmatterProvider component.
 */
export interface FrontmatterProviderProps {
  /** Frontmatter data to provide */
  frontmatter: Frontmatter;
  /** Child components */
  children: ComponentChildren;
}

/**
 * Provides frontmatter data to child components.
 *
 * Wrap page content with this provider to make frontmatter
 * accessible via useFrontmatter() hook.
 *
 * @example
 * ```tsx
 * <FrontmatterProvider frontmatter={{ title: "My Page" }}>
 *   <MyLayout>
 *     <MyPage />
 *   </MyLayout>
 * </FrontmatterProvider>
 * ```
 */
export function FrontmatterProvider({
  frontmatter,
  children,
}: FrontmatterProviderProps): VNode {
  return (
    <FrontmatterContext.Provider value={frontmatter}>
      {children}
    </FrontmatterContext.Provider>
  );
}

/**
 * Hook to access frontmatter from any component.
 *
 * Must be used within a FrontmatterProvider.
 *
 * @returns The frontmatter object for the current page
 * @throws Error if used outside FrontmatterProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { title, description } = useFrontmatter();
 *   return <h1>{title}</h1>;
 * }
 * ```
 */
export function useFrontmatter<T extends Frontmatter = Frontmatter>(): T {
  const frontmatter = useContext(FrontmatterContext);

  if (frontmatter === null) {
    throw new Error(
      "useFrontmatter must be used within a FrontmatterProvider. " +
        "Ensure your page is wrapped with <FrontmatterProvider>.",
    );
  }

  return frontmatter as T;
}
