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
 * The same page in a given language. English lives at the root; every other
 * language under /p/<code>/, which keeps clear of the project sites at /<repo>/.
 *
 * @param lang - The language
 * @param path - The page's path without a language prefix
 * @returns The page's address in that language
 */
export function localized(lang: Lang, path = ""): string {
  return lang === DEFAULT_LANG ? url(path) : url(`p/${lang}/${path}`);
}
