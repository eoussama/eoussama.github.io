import process from "node:process";

import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

import { canonicalLang } from "./src/lib/canonical";
import { CODE_THEMES } from "./src/lib/code-themes";
import proseLinks from "./src/lib/prose-links";



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

const site = "https://ouss.es";

/** The languages with pages under /p/<code>/; English's are at /p/ and the root. */
const PREFIXED = new Set(["ar", "ary", "fr", "es", "it", "ja"]);

/**
 * Whether a page belongs in the sitemap: not a 404, which is not meant to be found, nor
 * a page that names another as its original (src/lib/canonical.ts).
 *
 * @param page - The page's full address
 * @returns True to list it
 */
function listed(page: string): boolean {
  if (/\/404\/?$/.test(page)) {
    return false;
  }

  const parts = new URL(page).pathname.replace(/^\/(?:p\/)?/, "").split("/");
  const lang = PREFIXED.has(parts[0]!) ? parts.shift()! : "en";

  return canonicalLang(parts.join("/"), lang) === lang;
}

/**
 * Fontsource lists a WOFF copy beside each WOFF2 font, for browsers that no longer
 * exist. Japanese has 120 slices a weight: the copies double its stylesheets, which
 * hold up the page, and add hundreds of files to the site that nothing downloads.
 */
const woff2Only = {
  name: "woff2-only",
  enforce: "pre" as const,
  transform(code: string, id: string) {
    return /@fontsource\/.+\.css/.test(id) ? code.replace(/,\s*url\([^)]+\.woff\)\s*format\(["']woff["']\)/g, "") : undefined;
  },
};

export default defineConfig({
  site,
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
    // Every page meant to be found: not the 404s, nor the English-only pages in other languages.
    sitemap({ filter: listed }),
    // Links out of a post get the site's arrow and new tab; its headings link to themselves.
    proseLinks(site),
  ],
  vite: {
    plugins: [woff2Only],
  },
  markdown: {
    shikiConfig: {
      // Catppuccin, adjusted to AA contrast; the page picks a mode with CSS.
      themes: CODE_THEMES,
      // Shiki has no Pawn grammar; Pawn is close enough to C to read right as C.
      langAlias: { pawn: "c" },
      defaultColor: false,
      wrap: true,
      // The code wraps and never scrolls, so a block is no place to stop with the Tab key.
      transformers: [{
        pre(node) {
          delete node.properties.tabindex;
        },
      }],
    },
  },
});
