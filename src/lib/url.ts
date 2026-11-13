import type { Lang } from "~/i18n/langs";

import { DEFAULT_LANG } from "~/i18n/langs";



/** The base the site is built for: "/" at the root, "/v/0.5/" in the archive. */
const BASE = import.meta.env.BASE_URL.endsWith("/") ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;

/**
 * A path inside this site, under its base. `path` has no leading slash and ends with
 * one ("" is the home page), so links match the site's trailing-slash URLs.
 *
 * @param path - The path inside the site
 * @returns The path under the site's base
 */
export function url(path = ""): string {
  return BASE + path.replace(/^\/+/, "");
}

/**
 * The same page in a given language. Everything but the English home page lives
 * under /p/, which keeps clear of the project sites at /<repo>/: English pages at
 * /p/<path>, every other language at /p/<code>/<path>. The English 404 is the one
 * exception, at /404.html.
 *
 * @param lang - The language
 * @param path - The page's path without a language prefix, "" for the home page
 * @returns The page's address in that language
 */
export function localized(lang: Lang, path = ""): string {
  if (lang !== DEFAULT_LANG) {
    return url(`p/${lang}/${path}`);
  }

  // The English 404 is the root 404.html GitHub Pages serves for any missing page.
  if (path === "404/") {
    return url("404.html");
  }

  return path ? url(`p/${path}`) : url();
}
