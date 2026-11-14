import type { Lang } from "~/i18n/langs";

import { PROFILE } from "~/data/profile";
import { ui } from "~/i18n/ui";

import { localized, url } from "./url";



/*
 * What search engines read about a page beside its text (schema.org, as JSON-LD): who
 * the site is by, and what a post is. Every page names the same person, by one id.
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
 * The person the site is by.
 *
 * @param lang - The page's language
 * @returns The person
 */
export function person(lang: Lang): Schema {
  const t = ui(lang);

  return {
    "@type": "Person",
    "@id": `${PROFILE.site}/#person`,
    "name": t.name,
    // Written in Arabic letters, the name is given in Latin ones too.
    ...(t.name === ui("en").name ? {} : { alternateName: ui("en").name }),
    "jobTitle": t.job,
    "url": full(localized(lang)),
    "image": full(url("og.jpg")),
    "sameAs": [PROFILE.github.url, PROFILE.linkedin.url],
  };
}

/**
 * The home page: the site, and the person it is about.
 *
 * @param lang - The page's language
 * @returns The page's graph
 */
export function homeSchema(lang: Lang): Schema {
  const t = ui(lang);

  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", "@id": `${PROFILE.site}/#site`, "name": t.name, "url": full(localized(lang)), "inLanguage": lang, "author": { "@id": `${PROFILE.site}/#person` } },
      { "@type": "ProfilePage", "url": full(localized(lang)), "inLanguage": lang, "mainEntity": person(lang) },
    ],
  };
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
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.summary,
    "datePublished": post.date.toISOString(),
    "inLanguage": post.lang,
    "keywords": post.tags,
    "url": full(localized(lang, post.path)),
    "mainEntityOfPage": full(localized(lang, post.path)),
    "image": full(url("og.jpg")),
    "author": person(lang),
  };
}
