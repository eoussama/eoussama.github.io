import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";



/*
 * Which language's page search engines are pointed at. Most pages are written in every
 * language, and each is its own. Some show their main text in English everywhere: a
 * post, where it has no file of its own in the page's language, and a project whose
 * lead (`long`) or story is written in English only. In another language such a page
 * is the English one with translated surroundings, so it names the English page as
 * the original, and is left out of the sitemap and the language alternates. So is one
 * of the site's own pages (the CV) where it has no file in the page's language.
 *
 * It reads the content folder itself, so that the sitemap's filter, in the site's
 * config, can ask it too. Plain codes, not the Lang type, for the same reason.
 */

const CONTENT = join(process.cwd(), "src", "content");
const cache = new Map<string, boolean>();

/**
 * Whether a file of the content folder exists, asked once.
 *
 * @param parts - Its path inside src/content
 * @returns True when it exists
 */
function has(...parts: string[]): boolean {
  const file = join(CONTENT, ...parts);
  let known = cache.get(file);

  if (known === undefined) {
    known = existsSync(file);
    cache.set(file, known);
  }

  return known;
}

/**
 * Whether a project's lead is written in a language: the `long` of its YAML file has
 * that language, or it has no `long` at all (the lead is then the translated blurb).
 *
 * @param id - The project
 * @param lang - The language
 * @returns True when the lead reads in that language
 */
function leadIn(id: string, lang: string): boolean {
  const file = join(CONTENT, "projects", `${id}.yaml`);

  if (!has("projects", `${id}.yaml`)) {
    return true;
  }

  const long = /^long:\n((?:[ \t].*\n?)*)/m.exec(readFileSync(file, "utf8"))?.[1];

  return long === undefined || new RegExp(`^[ \\t]+${lang}:`, "m").test(long);
}

/**
 * The language whose page is the original of a page.
 *
 * @param path - The page's path inside the site, without the language ("blog/x/")
 * @param lang - The page's language
 * @returns The page's own language, or "en" when its main text is only in English
 */
export function canonicalLang(path: string, lang: string): string {
  if (lang === "en") {
    return lang;
  }

  const post = /^blog\/([^/]+)\/$/.exec(path)?.[1];

  if (post) {
    return has("posts", post, `${lang}.md`) ? lang : "en";
  }

  const project = /^projects\/([^/]+)\/$/.exec(path)?.[1];

  if (project) {
    const story = has("stories", project, "en.md") && !has("stories", project, `${lang}.md`);

    return story || !leadIn(project, lang) ? "en" : lang;
  }

  // The site's own pages (the CV, the now page) fall back to English as posts do.
  const page = /^([^/]+)\/$/.exec(path)?.[1];

  if (page && has("pages", page, "en.md")) {
    return has("pages", page, `${lang}.md`) ? lang : "en";
  }

  return lang;
}
