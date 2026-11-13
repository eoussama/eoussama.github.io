import type { CollectionEntry } from "astro:content";

import type { RepoStats } from "./github-api";

import type { Lang } from "~/i18n/langs";

import { getCollection } from "astro:content";

import { repoStats } from "./github";



type Entry = CollectionEntry<"projects">;
type Localized = Entry["data"]["blurb"];

/** One of a project's repositories, with what GitHub knows about it. */
export type Source = { url: string; stats: RepoStats | null };

export type Project = Omit<Entry["data"], "repo" | "started" | "active"> & {
  id: string;
  /** Its main repository. */
  repo: string | null;
  /** Every repository, the main one first. */
  repos: Source[];
  /** The organization shown before the name, unless the project is named after it. */
  owner: string | null;
  access: "open" | "private";
  /** The repository's GitHub details, when it has a public one. */
  stats: RepoStats | null;
  /**
   * When the work began: the day of the main repository's first commit, or the day the
   * project gives when its repository is private. Unknown for a contribution, whose
   * repository began before the work did.
   */
  started: string | null;
  /** When it was last worked on: the day of the latest tag, by version, found the same way. */
  active: string | null;
};

let all: Promise<Project[]> | null = null;

/**
 * Frameworks that GitHub counts as languages because of their file types. On this site
 * they are tools ("Built with"), never languages, so they are left out of the language
 * GitHub reports for a repository.
 */
const FRAMEWORKS = new Set(["Vue", "Svelte", "Astro", "MDX"]);

/**
 * A language GitHub reports, unless it is really a framework.
 *
 * @param language - The language GitHub reports, if any
 * @returns The language, or null
 */
function programming(language: string | null | undefined): string | null {
  return language && !FRAMEWORKS.has(language) ? language : null;
}

/**
 * Every project, in the order the home page and the lists show them, with what
 * GitHub knows about its repository. The language and year come from GitHub when the
 * project's file leaves them out.
 *
 * @returns The projects, sorted
 */
export function getProjects(): Promise<Project[]> {
  all ??= (async () => {
    const entries = await getCollection("projects", ({ data }) => import.meta.env.DEV || !data.draft);
    const projects = await Promise.all(entries.map(async ({ id, data }) => {
      const repos = await Promise.all([data.repo ?? []].flat().map(async url => ({ url, stats: await repoStats(url) })));
      const stats = repos[0]?.stats ?? null;
      // A contribution's repository is someone else's: the year it was created says nothing about the work.
      const created = data.kind !== "contribution" && stats?.created ? Number(stats.created.slice(0, 4)) : null;

      return {
        ...data,
        id,
        repo: repos[0]?.url ?? null,
        repos,
        owner: data.org && slug(data.org) !== slug(data.name) ? data.org : null,
        access: data.access ?? (data.repo ? "open" : "private"),
        language: data.language ?? data.languages[0] ?? programming(stats?.language),
        languages: data.languages.length ? data.languages : [data.language ?? programming(stats?.language)].filter((l): l is string => !!l),
        year: data.year ?? created,
        stats,
        started: data.kind === "contribution" ? null : data.started?.toISOString() ?? stats?.started ?? null,
        active: data.kind === "contribution" ? null : data.active?.toISOString() ?? (stats?.tag?.date || null),
      } satisfies Project;
    }));

    return projects.sort((a, b) => a.order - b.order);
  })();

  return all;
}

/**
 * A name as a comparable key: lowercase, words joined by hyphens.
 *
 * @param text - The name
 * @returns The key
 */
function slug(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, "-");
}

/**
 * A project's name with its organization, as plain text ("nakamaorg/circus").
 *
 * @param project - The project
 * @returns The name
 */
export function fullName(project: Project): string {
  return project.owner ? `${project.owner}/${project.name}` : project.name;
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
