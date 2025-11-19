/**
 * Theme cycling button that toggles between system, light, and dark modes.
 *
 * Uses an inline script to handle clicks since this is a static site.
 * Updates both the DOM attribute and localStorage for persistence.
 * Cycles through modes: system → light → dark → system.
 */
export const ColorMode = () => {
  const handleThemeChange = () => {};

  return (
    <>
      <button
        className="contrast"
        id="theme-cycle"
        type="button"
        onClick={handleThemeChange}
        aria-label="Cycle color mode"
      >
        <span id="theme-icon" aria-hidden="true">
          💻
        </span>
      </button>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const button = document.getElementById('theme-cycle');
              const icon = document.getElementById('theme-icon');
              const themeOrder = ['system', 'light', 'dark'];
              const themeIcons = {
                system: '💻',
                light: '☀️',
                dark: '🌙'
              };
              const themeLabels = {
                system: 'Using system theme (click to use light mode)',
                light: 'Using light theme (click to use dark mode)',
                dark: 'Using dark theme (click to use system mode)'
              };

              function getSystemTheme() {
                return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
              }

              function applyTheme(theme) {
                const actualTheme = theme === 'system' ? getSystemTheme() : theme;
                document.documentElement.setAttribute('data-theme', actualTheme);
              }

              function updateButton(theme) {
                icon.textContent = themeIcons[theme];
                button.setAttribute('aria-label', themeLabels[theme]);
              }

              function cycleTheme() {
                const currentTheme = localStorage.getItem('theme') || 'system';
                const currentIndex = themeOrder.indexOf(currentTheme);
                const nextIndex = (currentIndex + 1) % themeOrder.length;
                const nextTheme = themeOrder[nextIndex];

                localStorage.setItem('theme', nextTheme);
                applyTheme(nextTheme);
                updateButton(nextTheme);
              }

              // Initialize theme
              const savedTheme = localStorage.getItem('theme') || 'system';
              applyTheme(savedTheme);
              updateButton(savedTheme);

              // Listen for system theme changes when in system mode
              window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                const currentTheme = localStorage.getItem('theme') || 'system';
                if (currentTheme === 'system') {
                  applyTheme('system');
                }
              });

              // Handle button clicks
              button.addEventListener('click', cycleTheme);
            })();
          `,
        }}
      />
    </>
  );
};
