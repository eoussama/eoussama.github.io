import type { APIRoute } from "astro";

import { feed } from "~/lib/feed";



/**
 * The English feed.
 *
 * @param context - The request
 * @returns The feed
 */
export const GET: APIRoute = context => feed(context, "en");
