import type { CollectionEntry } from "astro:content";

import type { RepoStats } from "./github-api";

import type { Lang } from "~/i18n/langs";

import { getCollection } from "astro:content";

import { repoStats } from "./github";



type Entry = CollectionEntry<"projects">;
type Localized = Entry["data"]["blurb"];

export type Project = Entry["data"] & {
  id: string;
  access: "open" | "private";
  /** The repository's GitHub details, when it has a public one. */
  stats: RepoStats | null;
};

let all: Promise<Project[]> | null = null;

/**
 * Every project, in the order the home page and the lists show them, with what
 * GitHub knows about its repository. The language and year come from GitHub when the
 * project's file leaves them out.
 *
 * @returns The projects, sorted
 */
export function getProjects(): Promise<Project[]> {
  all ??= (async () => {
    const entries = await getCollection("projects");
    const projects = await Promise.all(entries.map(async ({ id, data }) => {
      const stats = data.repo ? await repoStats(data.repo) : null;

      return {
        ...data,
        id,
        access: data.access ?? (data.repo ? "open" : "private"),
        language: data.language ?? stats?.language ?? null,
        year: data.year ?? (stats?.created ? Number(stats.created.slice(0, 4)) : null),
        stats,
      } satisfies Project;
    }));

    return projects.sort((a, b) => a.order - b.order);
  })();

  return all;
}

/**
 * A piece of project text in a language, falling back to English.
 *
 * @param text - The text in each language it was written in
 * @param lang - The page's language
 * @returns The text to show, or "" when there is none
 */
export function pick(text: Localized | null | undefined, lang: Lang): string {
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
