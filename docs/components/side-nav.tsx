import { useEffect, useState } from "preact/hooks";
import { CloseIcon } from "./icons/close.tsx";
import { MenuIcon } from "./icons/menu.tsx";

const normalizePath = (path: string) => path.replace(/\/+$/, "") || "/";

interface NavItem {
  label: string;
  href: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

type NavEntry = NavItem | NavGroup;

interface SideNavProps {
  items: NavEntry[];
}

function isNavGroup(entry: NavEntry): entry is NavGroup {
  return "title" in entry && "items" in entry;
}

/**
 * Documentation navigation sidebar with expand/collapse support.
 * Supports flat items and grouped items with section headers.
 * Defaults to collapsed on small screens, expanded on large screens.
 */
export function SideNav({ items }: SideNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState("");

  useEffect(() => {
    // Set current pathname
    setCurrentPath(globalThis.location.pathname);

    // Check if screen is large on initial load
    const mediaQuery = globalThis.matchMedia("(min-width: 1024px)");
    setIsOpen(mediaQuery.matches);

    // Listen for viewport changes
    const handleChange = (e: MediaQueryListEvent) => {
      setIsOpen(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    // Scroll to active link in sidebar
    if (currentPath) {
      const aside = document.querySelector("aside");
      const activeLink = document.querySelector(
        `aside nav a[href="${currentPath}"]`,
      ) as HTMLElement;

      if (aside && activeLink) {
        const asideRect = aside.getBoundingClientRect();
        const linkRect = activeLink.getBoundingClientRect();

        const isVisible = linkRect.top >= asideRect.top &&
          linkRect.bottom <= asideRect.bottom;

        if (!isVisible) {
          const relativeTop = linkRect.top - asideRect.top;
          const scrollTop = aside.scrollTop +
            relativeTop -
            asideRect.height / 2 +
            linkRect.height / 2;

          aside.scrollTo({ top: scrollTop, behavior: "smooth" });
        }
      }
    }
  }, [currentPath]);

  useEffect(() => {
    // Listen for escape key to close nav
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    globalThis.addEventListener("keydown", handleKeyDown);
    return () => {
      globalThis.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const toggleNav = () => {
    setIsOpen(!isOpen);
  };

  const isActive = (href: string) => {
    return normalizePath(currentPath) === normalizePath(href);
  };

  return (
    <div className="relative">
      {/* Toggle button - slides with nav */}
      <button
        type="button"
        onClick={toggleNav}
        aria-label={isOpen ? "Close navigation" : "Open navigation"}
        className="fixed top-[110px] z-30 right-4 cursor-pointer lg:hidden bg-zinc-100 dark:bg-zinc-300 text-zinc-900 dark:text-zinc-900 p-2 rounded shadow-lg hover:bg-zinc-300 dark:hover:bg-zinc-200 transition-all duration-300"
      >
        {isOpen ? <CloseIcon /> : <MenuIcon />}
      </button>

      {/* Navigation sidebar */}
      <aside
        className={`fixed lg:sticky top-[94px] bottom-0 z-30 w-64 flex-shrink-0 h-[calc(100vh-94px)] bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-300 dark:border-zinc-700 overflow-y-auto transition-all duration-300 ${
          isOpen ? "block" : "hidden lg:block"
        }`}
      >
        <nav className="p-4">
          <ul className="space-y-1">
            {items.map((entry, index) => {
              if (isNavGroup(entry)) {
                return (
                  <li key={index} className="mt-6 first:mt-0">
                    <div className="text-xs font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-400 mb-2 px-3">
                      {entry.title}
                    </div>
                    <ul className="space-y-1">
                      {entry.items.map((item, itemIndex) => {
                        const active = isActive(item.href);
                        return (
                          <li key={itemIndex}>
                            <a
                              href={item.href}
                              className={`block px-3 py-2 rounded text-sm ${
                                active
                                  ? "bg-zinc-900 dark:bg-zinc-300 text-zinc-100 dark:text-zinc-900 font-bold"
                                  : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                              }`}
                            >
                              {item.label}
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              } else {
                const active = isActive(entry.href);
                return (
                  <li key={index}>
                    <a
                      href={entry.href}
                      className={`block px-3 py-2 rounded text-sm transition-colors ${
                        active
                          ? "bg-zinc-900 dark:bg-zinc-300 text-zinc-100 dark:text-zinc-900 font-bold"
                          : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                      }`}
                    >
                      {entry.label}
                    </a>
                  </li>
                );
              }
            })}
          </ul>
        </nav>
      </aside>

      {/* Overlay for mobile when open */}
      {isOpen && (
        <div
          className="fixed top-[94px] lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={toggleNav}
        />
      )}
    </div>
  );
}
