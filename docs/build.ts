import { pages } from "../pages-next/mod.ts";

const { build } = pages({
  siteMetadata: {
    baseUrl: "https://mage.dev",
    title: "Mage",
    description: "Simple, fast web framework for Deno",
  },
});

await build({ rootDir: "./docs" });
