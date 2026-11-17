import type { APIRoute } from "astro";

import { PROFILE } from "~/data/profile";



/** The repository, where vulnerabilities are reported privately. */
const REPO = "https://github.com/eoussama/eoussama.github.io";

/**
 * How to report a vulnerability (RFC 9116). It must say when it goes stale, and the
 * standard asks for less than a year ahead; written at each build, 364 days from that
 * day, it never does, as the site is rebuilt every week.
 *
 * @param context - The request
 * @returns The file
 */
export const GET: APIRoute = (context) => {
  const expires = new Date(Date.now() + 364 * 24 * 60 * 60 * 1000);

  const lines = [
    `Contact: mailto:${PROFILE.email}`,
    `Contact: ${REPO}/security/advisories/new`,
    `Expires: ${expires.toISOString()}`,
    "Preferred-Languages: en",
    `Canonical: ${new URL(".well-known/security.txt", context.site)}`,
    `Policy: ${REPO}/blob/master/SECURITY.md`,
  ];

  return new Response(`${lines.join("\n")}\n`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
