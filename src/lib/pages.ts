import type { CollectionEntry } from "astro:content";

import type { Lang } from "~/i18n/langs";

import { getCollection } from "astro:content";



/** The site's own pages beyond the lists, in the order the home page names them. */
export const PAGES = ["now", "cv"] as const;

export type PageId = (typeof PAGES)[number];

/** A section of a page: a row, its heading in the margin. */
export type Section = { id: string; heading: string; html: string };

/**
 * A page in a language, or in English where it has not been written in that one yet.
 *
 * @param id - The page
 * @param lang - The language wanted
 * @returns The entry, and the language it is in
 */
export async function getPage(id: PageId, lang: Lang): Promise<{ entry: CollectionEntry<"pages">; lang: Lang }> {
  const entries = await getCollection("pages", entry => entry.id.startsWith(`${id}/`));
  const own = entries.find(entry => entry.id === `${id}/${lang}`);
  const entry = own ?? entries.find(entry => entry.id === `${id}/en`);

  if (!entry) {
    throw new Error(`No English text for the page "${id}".`);
  }

  return { entry, lang: own ? lang : "en" };
}

/**
 * Cuts a page's rendered text into its sections, one at each "##" heading. The
 * heading's words become the margin heading, its address the row's.
 *
 * @param html - The page's text, rendered
 * @returns Its sections, in order
 */
export function sections(html: string): Section[] {
  return html.split(/(?=<h2[\s>])/).flatMap((part) => {
    const match = /^<h2\s[^>]*?\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/.exec(part);

    if (!match) {
      return [];
    }

    const heading = match[2]!.replace(/<[^>]+>/g, "").replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, "&").trim();

    return [{ id: match[1]!, heading, html: part.slice(match[0].length).trim() }];
  });
}
