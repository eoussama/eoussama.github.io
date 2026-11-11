import type { CollectionEntry } from "astro:content";

import type { Lang } from "~/i18n/langs";

import { getCollection } from "astro:content";

import { DEFAULT_LANG } from "~/i18n/langs";



export type Post = {
  slug: string;
  /** The language the post is written in: the page's, or English when it has no version in it. */
  lang: Lang;
  entry: CollectionEntry<"posts">;
  minutes: number;
};

/** Japanese characters, counted one by one rather than as words. */
const JAPANESE = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/gu;

/**
 * About how long a post takes to read: 200 words a minute, or 400 characters for
 * Japanese.
 *
 * @param body - The post's Markdown
 * @returns Minutes, at least one
 */
function readingTime(body = ""): number {
  const cjk = body.match(JAPANESE)?.length ?? 0;
  const words = body.replace(JAPANESE, " ").split(/\s+/).filter(Boolean).length;

  return Math.max(1, Math.round(words / 200 + cjk / 400));
}

/**
 * Every post, newest first, each in the page's language when it was written in it
 * and in English otherwise. Drafts only show in development.
 *
 * @param lang - The page's language
 * @returns The posts
 */
export async function getPosts(lang: Lang): Promise<Post[]> {
  const entries = await getCollection("posts", ({ data }) => import.meta.env.DEV || !data.draft);
  const slugs = [...new Set(entries.map(entry => entry.id.split("/")[0]!))];

  return slugs
    .map((slug) => {
      const entry = entries.find(e => e.id === `${slug}/${lang}`) ?? entries.find(e => e.id === `${slug}/${DEFAULT_LANG}`);

      if (!entry) {
        return null;
      }

      return { slug, lang: entry.id.split("/")[1] as Lang, entry, minutes: readingTime(entry.body) };
    })
    .filter(post => post !== null)
    .sort((a, b) => b.entry.data.date.getTime() - a.entry.data.date.getTime());
}

/**
 * A post's path inside the site, before the language prefix.
 *
 * @param post - The post
 * @returns Its path, such as "blog/hello/"
 */
export function postPath(post: Post): string {
  return `blog/${post.slug}/`;
}
