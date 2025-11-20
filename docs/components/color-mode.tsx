import { useEffect, useState } from "preact/hooks";

type Theme = "system" | "light" | "dark";

const themeOrder: Theme[] = ["system", "light", "dark"];
const themeIcons: Record<Theme, string> = {
  system: "💻",
  light: "☀️",
  dark: "🌙",
};
const themeLabels: Record<Theme, string> = {
  system: "Using system theme (click to use light mode)",
  light: "Using light theme (click to use dark mode)",
  dark: "Using dark theme (click to use system mode)",
};

function getSystemTheme(): "light" | "dark" {
  return globalThis.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  const actualTheme = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.setAttribute("data-theme", actualTheme);
}

/**
 * Theme cycling button that toggles between system, light, and dark modes.
 *
 * Updates both the DOM attribute and localStorage for persistence.
 * Cycles through modes: system → light → dark → system.
 */
export const ColorMode = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof globalThis.localStorage === "undefined") return "system";
    return (globalThis.localStorage.getItem("theme") as Theme) || "system";
  });

  useEffect(() => {
    // Apply theme on mount and when it changes
    applyTheme(theme);
    globalThis.localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    // Listen for system theme changes when in system mode
    const mediaQuery = globalThis.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const handleThemeChange = () => {
    const currentIndex = themeOrder.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    const nextTheme = themeOrder[nextIndex];
    setTheme(nextTheme);
  };

  return (
    <button
      className="contrast"
      type="button"
      onClick={handleThemeChange}
      aria-label={themeLabels[theme]}
    >
      <span aria-hidden="true">{themeIcons[theme]}</span>
    </button>
  );
};
