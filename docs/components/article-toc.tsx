import { useEffect, useState } from "preact/hooks";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface ArticleTocProps {
  /**
   * ID of the article element to scan for headings.
   * @default "mage-article"
   */
  articleId?: string;
}

/**
 * Table of contents component for article pages.
 * Scans article headings, builds navigation list with smooth scrolling,
 * and highlights the currently visible section.
 */
export function ArticleToc({ articleId = "mage-article" }: ArticleTocProps) {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // Find the article element and extract headings
    const article = document.getElementById(articleId);
    if (!article) {
      console.warn(`Article with id "${articleId}" not found`);
      return;
    }

    // Get all headings (h1-h6)
    const headings = article.querySelectorAll("h1, h2, h3, h4, h5, h6");
    const items: TocItem[] = [];

    headings.forEach((heading) => {
      // Ensure heading has an id for linking
      if (!heading.id) {
        heading.id = heading.textContent
          ?.toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-") || "";
      }

      items.push({
        id: heading.id,
        text: heading.textContent || "",
        level: parseInt(heading.tagName.charAt(1)),
      });
    });

    setTocItems(items);

    // Set up Intersection Observer to track active section
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-110px 0px -66% 0px", // Trigger when heading is in top third of viewport
        threshold: 1.0,
      },
    );

    // Observe all headings
    headings.forEach((heading) => observer.observe(heading));

    return () => {
      headings.forEach((heading) => observer.unobserve(heading));
    };
  }, [articleId]);

  const handleClick = (e: MouseEvent, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      // Update URL hash without jumping
      history.pushState(null, "", `#${id}`);
    }
  };

  if (tocItems.length === 0) {
    return null;
  }

  return (
    <nav className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
      <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-400 mb-4">
        On This Page
      </h2>
      <ul className="space-y-2 text-sm">
        {tocItems.map((item) => (
          <li
            key={item.id}
            style={{ paddingLeft: `${(item.level - 1) * 0.75}rem` }}
          >
            <a
              href={`#${item.id}`}
              onClick={(e) => handleClick(e, item.id)}
              className={`block py-1 border-l-2 pl-3 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100 ${
                activeId === item.id
                  ? "border-zinc-900 dark:border-zinc-100 font-bold text-zinc-900 dark:text-zinc-100"
                  : "border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
