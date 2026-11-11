import type { CollectionEntry } from "astro:content";

import type { Lang } from "~/i18n/langs";

import { getCollection } from "astro:content";



export type Project = CollectionEntry<"projects">;

type Localized = Project["data"]["desc"];

/**
 * Every project, in the order the home page and the lists show them.
 *
 * @returns The projects, sorted
 */
export async function getProjects(): Promise<Project[]> {
  const all = await getCollection("projects");

  return all.sort((a, b) => a.data.order - b.data.order);
}

/**
 * A piece of project text in a language, falling back to English.
 *
 * @param text - The text in each language it was written in
 * @param lang - The page's language
 * @returns The text to show, or "" when there is none
 */
export function pick(text: Localized | null, lang: Lang): string {
  if (!text) {
    return "";
  }

  return text[lang] ?? text.en;
}

/**
 * A project's path inside the site, before the language prefix.
 *
 * @param project - The project
 * @returns Its path, such as "projects/dx/"
 */
export function projectPath(project: Project): string {
  return `projects/${project.id}/`;
}
