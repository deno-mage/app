import { useEffect, useState } from "preact/hooks";
import { SunIcon } from "./icons/sun.tsx";
import { MoonIcon } from "./icons/moon.tsx";

export function ToggleTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Read initial theme from DOM
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="text-xl hover:cursor-pointer"
    >
      {theme === "light" ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}
