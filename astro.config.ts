import process from "node:process";

import { defineConfig } from "astro/config";



/**
 * The site is built twice from the same commit: once for the root of ouss.es and once
 * for its place in the version archive, /v/0.5/. BASE_PATH picks which.
 */
const base = process.env.BASE_PATH ?? "/";

export default defineConfig({
  site: "https://ouss.es",
  base,
  trailingSlash: "always",
  build: {
    format: "directory",
    assets: "_assets",
  },
  devToolbar: {
    enabled: false,
  },
  markdown: {
    shikiConfig: {
      // Soft, lavender-leaning themes for each mode; the page picks one with CSS.
      themes: { light: "rose-pine-dawn", dark: "rose-pine-moon" },
      defaultColor: false,
      wrap: true,
    },
  },
});
