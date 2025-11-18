const cacheBuster = Date.now();

const { Head } = (await import(
  `../components/head.tsx?t=${cacheBuster}`
)) as typeof import("../components/head.tsx");

const { ColorMode } = (await import(
  `../components/color-mode.tsx?t=${cacheBuster}`
)) as typeof import("../components/color-mode.tsx");

export { ColorMode, Head };
