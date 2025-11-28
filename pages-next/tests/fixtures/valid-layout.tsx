/**
 * Valid layout component.
 */

import type { LayoutProps } from "../../types.ts";

export default function ValidLayout({ children }: LayoutProps) {
  return (
    <div class="layout">
      <header>
        <nav>Navigation</nav>
      </header>
      <main>{children}</main>
      <footer>Footer</footer>
    </div>
  );
}
