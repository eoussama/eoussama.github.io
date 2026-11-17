import type { APIContext } from "astro";

import type { Lang } from "~/i18n/langs";

import rss from "@astrojs/rss";

import { ui } from "~/i18n/ui";

import { getPosts, postPath } from "./posts";
import { localized } from "./url";



/**
 * The RSS feed of the posts, in one language.
 *
 * @param context - The request, for the site's address
 * @param lang - The feed's language
 * @returns The feed
 */
export async function feed(context: APIContext, lang: Lang): Promise<Response> {
  const t = ui(lang);
  const posts = await getPosts(lang);

  // The channel links to the feed's own language's home page, and to itself; Darija,
  // which has no two-letter code, is given as the Arabic of Morocco, as in hreflang.
  const home = new URL(localized(lang), context.site ?? "https://ouss.es").href;
  const self = new URL(localized(lang, "rss.xml"), home).href;

  return rss({
    title: t.feed,
    // The title has the name; the intro says who it is, in the feed's language.
    description: t.intro.trim(),
    site: home,
    xmlns: { atom: "http://www.w3.org/2005/Atom" },
    items: posts.map(post => ({
      title: post.entry.data.title,
      description: post.entry.data.summary,
      pubDate: post.entry.data.date,
      categories: post.entry.data.tags,
      // A post with no version in this language is the English one: its page and its id.
      link: localized(post.lang, postPath(post)),
    })),
    customData: [
      `<language>${lang === "ary" ? "ar-MA" : lang}</language>`,
      `<atom:link href="${self}" rel="self" type="application/rss+xml"/>`,
      ...(posts[0] ? [`<lastBuildDate>${posts[0].entry.data.date.toUTCString()}</lastBuildDate>`] : []),
    ].join(""),
  });
}
