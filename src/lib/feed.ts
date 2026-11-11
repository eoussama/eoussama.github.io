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

  return rss({
    title: t.feed,
    description: `${t.name}.${t.intro}`,
    site: context.site ?? "https://ouss.es",
    items: posts.map(post => ({
      title: post.entry.data.title,
      description: post.entry.data.summary,
      pubDate: post.entry.data.date,
      categories: post.entry.data.tags,
      link: localized(lang, postPath(post)),
    })),
    customData: `<language>${lang}</language>`,
  });
}
