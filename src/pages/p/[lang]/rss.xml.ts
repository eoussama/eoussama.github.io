import type { APIRoute, GetStaticPaths } from "astro";

import type { Lang } from "~/i18n/langs";

import { DEFAULT_LANG, LANGS } from "~/i18n/langs";
import { feed } from "~/lib/feed";



/**
 * A feed for every language but English.
 *
 * @returns One feed per language
 */
export const getStaticPaths = (() => LANGS.filter(l => l.code !== DEFAULT_LANG).map(l => ({ params: { lang: l.code } }))) satisfies GetStaticPaths;

/**
 * The feed in the page's language.
 *
 * @param context - The request
 * @returns The feed
 */
export const GET: APIRoute = context => feed(context, context.params.lang as Lang);
