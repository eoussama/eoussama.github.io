import type { List } from "./lists";

import type { Lang } from "~/i18n/langs";

import { PROFILE } from "~/data/profile";
import { ui } from "~/i18n/ui";

import { canonicalLang } from "./canonical";
import { LIST_PATHS } from "./lists";
import { localized, url } from "./url";



/*
 * What search engines read about a page beside its text (schema.org, as JSON-LD): who
 * the site is by, and what a post or a project is. Every page names the same person,
 * by one id.
 */

/** A schema.org node. */
export type Schema = Record<string, unknown>;

/**
 * An address on the site, in full.
 *
 * @param path - The address inside the site
 * @returns It, with the site's origin
 */
function full(path: string): string {
  return new URL(path, PROFILE.site).href;
}

/**
 * A page's address in full, as search engines should list it: its own, or the English
 * page's where its main text is English only (canonical.ts).
 *
 * @param lang - The page's language
 * @param path - Its path inside the site, before the language prefix
 * @returns The address
 */
function canonical(lang: Lang, path: string): string {
  return full(localized(canonicalLang(path, lang) as Lang, path));
}

/** The person's id: every page that names them points to it. */
const PERSON = `${PROFILE.site}/#person`;

/**
 * The person the site is by, described the same on every page so that their id never
 * carries two answers: the name in Latin letters, with the Arabic one as another name.
 * A page's own language is in the page's node.
 *
 * @returns The person
 */
export function person(): Schema {
  return {
    "@type": "Person",
    "@id": PERSON,
    "name": ui("en").name,
    "alternateName": [...new Set([ui("ar").name, ui("ary").name])],
    "jobTitle": ui("en").job,
    "url": full("/"),
    "image": full(url("og.jpg")),
    // Profiles elsewhere, at their own addresses: the site links to them through short
    // links, which search engines are told not to list.
    "sameAs": [PROFILE.github, PROFILE.linkedin, PROFILE.behance, PROFILE.dribbble, PROFILE.figma],
  };
}

/**
 * A page's nodes as one document, with the person they name.
 *
 * @param nodes - The page's nodes
 * @returns The page's graph
 */
function graph(...nodes: Schema[]): Schema {
  return { "@context": "https://schema.org", "@graph": [...nodes, person()] };
}

/**
 * The trail to a page: the home page, the list it is in (a project's, a post's), then
 * the page. A page that shows English text names the English trail, the one its
 * original has; every list has a page in every language, so it is always there.
 *
 * @param lang - The page's language
 * @param page - The page's details
 * @param page.path - Its path inside the site, before the language prefix
 * @param page.name - What it is called
 * @param list - The list it is in, if any
 * @returns The trail
 */
export function breadcrumbSchema(lang: Lang, page: { path: string; name: string }, list?: List): Schema {
  const own = canonicalLang(page.path, lang) as Lang;
  const steps = [
    { name: ui(own).home, item: full(localized(own)) },
    ...(list ? [{ name: list === "work" ? ui(own).work : ui(own).writing, item: full(localized(own, LIST_PATHS[list])) }] : []),
    { name: page.name, item: canonical(lang, page.path) },
  ];

  return {
    "@type": "BreadcrumbList",
    "itemListElement": steps.map((step, i) => ({ "@type": "ListItem", "position": i + 1, ...step })),
  };
}

/**
 * A list's page: every project or every post, each named by the address search engines
 * list it at.
 *
 * @param lang - The page's language
 * @param page - The page's details
 * @param page.path - Its path inside the site, before the language prefix
 * @param page.name - What it is called: "Works", "Writings"
 * @param page.description - What it holds, in a sentence
 * @param page.items - What it lists, in order
 * @returns The page
 */
export function listSchema(lang: Lang, page: { path: string; name: string; description: string; items: { name: string; path: string }[] }): Schema {
  return graph({
    "@type": "CollectionPage",
    "name": page.name,
    "description": page.description,
    "url": canonical(lang, page.path),
    "inLanguage": lang,
    "author": { "@id": PERSON },
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": page.items.length,
      "itemListElement": page.items.map((item, i) => ({ "@type": "ListItem", "position": i + 1, "name": item.name, "url": canonical(lang, item.path) })),
    },
  }, breadcrumbSchema(lang, { path: page.path, name: page.name }));
}

/**
 * The home page: the site, and the person it is about.
 *
 * @param lang - The page's language
 * @returns The page's graph
 */
export function homeSchema(lang: Lang): Schema {
  const t = ui(lang);
  const home = full(localized(lang));

  // One site in seven languages, each home page its own nodes, in its own words.
  return graph(
    { "@type": "WebSite", "@id": `${home}#site`, "name": t.name, "url": home, "inLanguage": lang, "author": { "@id": PERSON } },
    { "@type": "ProfilePage", "@id": `${home}#page`, "name": `${t.name} · ${t.job}`, "description": t.intro.trim(), "url": home, "inLanguage": lang, "isPartOf": { "@id": `${home}#site` }, "mainEntity": { "@id": PERSON } },
  );
}

/**
 * A post: what it is called and says, when it came out, and who wrote it.
 *
 * @param lang - The page's language
 * @param post - The post's details
 * @param post.path - Its path inside the site, before the language prefix
 * @param post.title - Its title
 * @param post.summary - Its first sentence
 * @param post.date - When it was published
 * @param post.lang - The language it is written in
 * @param post.tags - What it is about
 * @returns The post
 */
export function postSchema(lang: Lang, post: { path: string; title: string; summary: string; date: Date; lang: Lang; tags: string[] }): Schema {
  return graph({
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.summary,
    "datePublished": post.date.toISOString(),
    "dateModified": post.date.toISOString(),
    "inLanguage": post.lang,
    "keywords": post.tags,
    "url": canonical(lang, post.path),
    "mainEntityOfPage": canonical(lang, post.path),
    "image": full(url("og.jpg")),
    "author": { "@id": PERSON },
    "publisher": { "@id": PERSON },
  }, breadcrumbSchema(lang, { path: post.path, name: post.title }, "writing"));
}

/**
 * A project: what it is, where its code is, and who made it.
 *
 * @param lang - The page's language
 * @param project - The project's details
 * @param project.path - Its path inside the site, before the language prefix
 * @param project.name - Its name
 * @param project.description - What it is, in a sentence
 * @param project.repo - Its main repository, when its code is public
 * @param project.languages - The languages its code is written in
 * @param project.tags - What it is about
 * @param project.contribution - Whether the work went into someone else's project
 * @returns The project
 */
export function projectSchema(lang: Lang, project: { path: string; name: string; description: string; repo: string | null; languages: string[]; tags: string[]; contribution: boolean }): Schema {
  return graph({
    "@type": project.repo ? "SoftwareSourceCode" : "CreativeWork",
    "name": project.name,
    "description": project.description,
    "url": canonical(lang, project.path),
    "mainEntityOfPage": canonical(lang, project.path),
    "keywords": project.tags,
    ...(project.repo ? { codeRepository: project.repo, programmingLanguage: project.languages } : {}),
    // Someone else's project, worked on: a contributor to it, not its creator.
    [project.contribution ? "contributor" : "creator"]: { "@id": PERSON },
  }, breadcrumbSchema(lang, { path: project.path, name: project.name }, "work"));
}

/**
 * One of the site's own pages (the CV, the now page): a page about the person.
 *
 * @param lang - The page's language
 * @param page - The page's details
 * @param page.path - Its path inside the site, before the language prefix
 * @param page.title - Its title
 * @param page.label - What it is called in a trail: "CV", "Now"
 * @param page.description - What it holds, in a sentence
 * @param page.updated - When it was last brought up to date, if it says
 * @returns The page
 */
export function pageSchema(lang: Lang, page: { path: string; title: string; label: string; description: string; updated?: Date }): Schema {
  return graph({
    "@type": "ProfilePage",
    "name": page.title,
    "description": page.description,
    "url": canonical(lang, page.path),
    // The language the page's text is in: English where it has no version in the page's own.
    "inLanguage": canonicalLang(page.path, lang),
    ...(page.updated ? { dateModified: page.updated.toISOString() } : {}),
    "mainEntity": { "@id": PERSON },
  }, breadcrumbSchema(lang, { path: page.path, name: page.label }));
}
