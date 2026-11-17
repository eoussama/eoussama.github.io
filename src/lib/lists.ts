import type { Lang } from "~/i18n/langs";

import { langInfo } from "~/i18n/langs";
import { ui } from "~/i18n/ui";

import { formatDate } from "./dates";
import { getPosts, postPath } from "./posts";
import { getProjects, pick, projectPath } from "./projects";
import { localized } from "./url";



/*
 * The two lists: every project ("Works") and every post ("Writings"). Each is a page of
 * its own (ListPage.astro), and has its parts in files beside it (ListPart.astro), which
 * is where the list drawer and the command menu take them from, the first time they
 * are needed (scripts/lists.ts): no other page carries them.
 */

export type List = "work" | "writing";

/** Each list's page, inside the site, before the language prefix. */
export const LIST_PATHS: Record<List, string> = { work: "projects/", writing: "blog/" };

/**
 * A list's parts, each a file of its own at <list's page>parts/<part>/: its items, which
 * the drawer and the command menu both show, and the drawer's filters, which the menu
 * does without.
 */
export const PARTS = ["items", "filters"] as const;

export type Part = (typeof PARTS)[number];

/**
 * Where a list's parts are, inside the site, before the language prefix.
 *
 * @param list - The list
 * @returns The folder that holds them
 */
export function partsPath(list: List): string {
  return `${LIST_PATHS[list]}parts/`;
}

/** What each list can be filtered by, in the order its filters show: the address's parameters for them. */
export const FACETS: Record<List, string[]> = {
  work: ["language", "year", "type", "access", "org", "tool", "tag"],
  writing: ["topic", "year"],
};

/** A facet takes one value per item (its year) or several (its languages, tools and tags). */
export type Item = {
  name: string;
  owner?: string | null;
  /** Its page's path inside the site, before the language prefix. */
  path: string;
  href: string;
  kind: string;
  blurb: string;
  icon: "z-star" | "z-cross";
  facets: Record<string, string | string[]>;
  lang?: Lang;
  dir?: "ltr" | "rtl";
  /** The words the drawer's search finds it by, lowercased. */
  keywords: string;
  /** More words the command menu finds it by, beside those: its kind as written, every tag. */
  more: string;
};

export type Group = { key: string; label: string; options: { value: string; label: string; count: number }[] };

export type Sheet = { list: List; items: Item[]; groups: Group[] };

/**
 * The filter groups for a list, each with the values its items take and how many
 * items take each. Groups with nothing to choose from are left out.
 *
 * Years run newest first; languages, tools and tags, which an item can have several
 * of, run most used first.
 *
 * @param items - The list's items
 * @param keys - The facets to filter by, with their labels
 * @param labels - Display labels for some facets' values
 * @returns The groups, in the order given
 */
function groupsOf(items: Item[], keys: [string, string][], labels: Record<string, Record<string, string>> = {}): Group[] {
  return keys.map(([key, label]) => {
    const counts = new Map<string, number>();

    items.forEach((item) => {
      [item.facets[key] ?? []].flat().filter(Boolean).forEach((value) => {
        counts.set(value, (counts.get(value) ?? 0) + 1);
      });
    });

    const options = [...counts].map(([value, count]) => ({ value, label: labels[key]?.[value] ?? value, count }));

    if (key === "year") {
      options.sort((a, b) => Number(b.value) - Number(a.value));
    }

    if (key === "language" || key === "tool" || key === "tag") {
      options.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    }

    return { key, label, options };
  }).filter(group => group.options.length > 1);
}

/**
 * The words an item is found by: its name, sentence and kind, and every facet value
 * with its label.
 *
 * @param item - The item, without its words yet
 * @param tagNames - The tags' names in the page's language
 * @returns The words, lowercased
 */
function keywords(item: Omit<Item, "keywords" | "more">, tagNames: Record<string, string>): string {
  const values = Object.values(item.facets).flat();
  const named = item.facets.tag ? [item.facets.tag].flat().map(tag => tagNames[tag] ?? "") : [];

  return [item.name, item.blurb, item.kind, ...values, ...named].join(" ").toLowerCase();
}

/**
 * A list in a language: its items, in the order the drawer shows them, and its filters.
 *
 * @param list - The list
 * @param lang - The page's language
 * @returns The list
 */
export async function getList(list: List, lang: Lang): Promise<Sheet> {
  const t = ui(lang);

  if (list === "work") {
    const items = (await getProjects()).map((p) => {
      const item = {
        name: p.name,
        owner: p.owner,
        path: projectPath(p),
        href: localized(lang, projectPath(p)),
        kind: t.kinds[p.kind],
        blurb: pick(p.blurb, lang),
        icon: "z-star" as const,
        facets: { language: p.languages, year: p.year ? String(p.year) : "", type: p.type, access: p.access, org: p.org ?? "", tool: p.tools, tag: p.tags },
      };

      return { ...item, keywords: keywords(item, t.tagNames), more: p.kind };
    });
    const labels: Record<string, string> = { language: t.gLanguage, year: t.gYear, type: t.gKind, access: t.gAccess, org: t.gOrg, tool: t.built, tag: t.gTags };

    return { list, items, groups: groupsOf(items, FACETS.work.map(key => [key, labels[key]!]), { type: t.types, access: t.access, tag: t.tagNames }) };
  }

  const items = (await getPosts(lang)).map((post) => {
    const item = {
      name: post.entry.data.title,
      path: postPath(post),
      href: localized(lang, postPath(post)),
      kind: formatDate(post.entry.data.date, lang),
      blurb: post.entry.data.summary,
      icon: "z-cross" as const,
      facets: { topic: post.entry.data.tags[0] ?? "", year: String(post.entry.data.date.getUTCFullYear()) },
      lang: post.lang === lang ? undefined : post.lang,
      dir: post.lang === lang ? undefined : langInfo(post.lang).dir,
    };

    return { ...item, keywords: keywords(item, t.tagNames), more: post.entry.data.tags.join(" ").toLowerCase() };
  });
  const labels: Record<string, string> = { topic: t.gTopic, year: t.gYear };

  return { list, items, groups: groupsOf(items, FACETS.writing.map(key => [key, labels[key]!])) };
}
