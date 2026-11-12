import process from "node:process";

import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

import { CODE_THEMES } from "./src/lib/code-themes";



/**
 * The site is built twice from the same commit: once for the root of ouss.es and once
 * for its place in the version archive, /v/0.5/. BASE_PATH picks which.
 */
const base = process.env.BASE_PATH ?? "/";

/**
 * The dev and preview servers answer an address without its trailing slash with a
 * bare 404 of their own, where GitHub Pages would show the site's. There, any address
 * goes, so a missing page gets the real 404 too. The build keeps the slashes.
 */
const building = process.argv.includes("build");

export default defineConfig({
  site: "https://ouss.es",
  base,
  trailingSlash: building ? "always" : "ignore",
  build: {
    format: "directory",
    assets: "_assets",
    // Every page's styles ride in its HTML: one round trip less before the first paint.
    inlineStylesheets: "always",
  },
  devToolbar: {
    enabled: false,
  },
  integrations: [
    // Every page but the 404s, which are not meant to be found.
    sitemap({ filter: page => !/\/404\/?$/.test(page) }),
  ],
  markdown: {
    shikiConfig: {
      // Catppuccin, adjusted to AA contrast; the page picks a mode with CSS.
      themes: CODE_THEMES,
      defaultColor: false,
      wrap: true,
    },
  },
});
