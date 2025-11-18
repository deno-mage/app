/**
 * Theme toggle button for switching between light and dark modes.
 *
 * Uses an inline script to handle clicks since this is a static site.
 * Updates both the DOM attribute and localStorage for persistence.
 */
export const ColorMode = () => {
  const toggleColorMode = () => {};

  return (
    <>
      <button
        id="theme-toggle"
        type="button"
        onClick={toggleColorMode}
        aria-label="Toggle Color Mode"
      >
        Toggle Color Mode
      </button>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.getElementById('theme-toggle').addEventListener('click', () => {
              const currentMode = document.documentElement.getAttribute("data-theme");
              const newMode = currentMode === "dark" ? "light" : "dark";
              document.documentElement.setAttribute("data-theme", newMode);
              localStorage.setItem("theme", newMode);
            });
          `,
        }}
      />
    </>
  );
};
