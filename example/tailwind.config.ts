import type { Config } from "tailwindcss";

export default {
  content: ["./**/*.{html,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Geist Mono", monospace', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
