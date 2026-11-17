import process from "node:process";

import { retry, tryCatch, withTimeout } from "@eoussama/core";



/*
 * The short links at to.ouss.es. Each build reads them from the redirector repository
 * (src/links.json), so the site never links through one that has changed or gone: a
 * build that can't read them fails. The site keeps the full addresses, which it reads
 * GitHub's details from; it links to, and shows, their short links. Its own pages
 * have short links too, but stay linked as they are.
 */

/**
 * Where links.json is read: through the API with a token (the deploy has one), which
 * is never behind; without one, from GitHub's raw file host, which caches it for up to
 * five minutes but, unlike the API's 60 requests an hour, can't be used up by the
 * projects' stats.
 */
const API = "https://api.github.com/repos/eoussama/redirector/contents/src/links.json?ref=main";
const RAW = "https://raw.githubusercontent.com/eoussama/redirector/main/src/links.json";
const HOST = "https://to.ouss.es/";
const SITE = "https://ouss.es";

/** The fields of a link in links.json; any other key is a child or a group. */
const FIELDS = new Set(["url", "mailto", "subject", "body", "cc", "bcc", "permanent", "expires"]);

export type ShortLinks = {
  /** The address to link to: its short link, or the address itself when it has none. */
  href: (address: string) => string;
  /** How an address reads on the page: its short link, else itself, without "https://", "www." or a closing slash. */
  text: (address: string) => string;
};

let loaded: Promise<ShortLinks> | null = null;

/**
 * An address as a key to compare by: the host in lower case, no closing slash.
 *
 * @param address - A web address, or a "mailto:" one
 * @returns Its key
 */
function key(address: string): string {
  if (address.startsWith("mailto:")) {
    return address.toLowerCase();
  }

  const url = new URL(address);

  return `${url.origin}${url.pathname.replace(/\/+$/, "")}${url.search}${url.hash}`;
}

/**
 * Whether an address is one of the site's own pages: its home page (with any list or
 * section), a page under /p/, or an archived version under /v/.
 *
 * @param address - The address
 * @returns True for a page of the site
 */
function own(address: string): boolean {
  if (!address.startsWith("http")) {
    return false;
  }

  const url = new URL(address);

  return url.origin === SITE && (url.pathname === "/" || url.pathname.startsWith("/p/") || url.pathname.startsWith("/v/"));
}

/**
 * Whether a link has expired, as the redirector reads `expires`: a day lasts until its
 * end, in UTC.
 *
 * @param expires - The link's `expires`, if it has one
 * @param now - The time of the build
 * @returns True once it no longer works
 */
function expired(expires: unknown, now: number): boolean {
  if (typeof expires !== "string") {
    return false;
  }

  const end = /^\d{4}-\d{2}-\d{2}$/.test(expires) ? Date.parse(`${expires}T23:59:59.999Z`) : Date.parse(expires);

  return end < now;
}

/**
 * Every working short link in a links.json tree, by the address it sends to. Where two
 * send to the same address, the first one in the file is kept.
 *
 * @param node - A branch of the tree
 * @param path - The short path so far
 * @param out - The links found, by address
 * @param now - The time of the build
 * @returns The links found
 */
function collect(node: Record<string, unknown>, path: string[], out: Map<string, string>, now: number): Map<string, string> {
  for (const [name, value] of Object.entries(node)) {
    if (FIELDS.has(name) || name.startsWith("$") || !value || typeof value !== "object") {
      continue;
    }

    const link = value as Record<string, unknown>;
    const here = name.startsWith("(") ? path : [...path, name];
    const target = typeof link.url === "string" ? link.url : typeof link.mailto === "string" ? `mailto:${link.mailto}` : null;

    if (target && !name.startsWith("(") && !own(target) && !expired(link.expires, now)) {
      const id = key(target);

      if (!out.has(id)) {
        out.set(id, `${HOST}${here.join("/")}`);
      }
    }

    collect(link, here, out, now);
  }

  return out;
}

/**
 * Fetches links.json from the redirector repository, trying a few times.
 *
 * @returns Its tree
 * @throws When GitHub can't be reached or the file isn't a tree of links
 */
async function fetchLinks(): Promise<Record<string, unknown>> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = { "Accept": "application/vnd.github.raw+json", "User-Agent": "portfolio-build" };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const tree = await retry(async () => {
    const response = await withTimeout(fetch(token ? API : RAW, { headers }), 8000);

    if (!response.ok) {
      throw new Error(`GitHub answered ${response.status} for the redirector's links.json`);
    }

    return response.json() as Promise<unknown>;
  }, { retries: 2, delay: 600 });

  if (!tree || typeof tree !== "object" || Array.isArray(tree)) {
    throw new Error("The redirector's links.json is not a tree of links");
  }

  return tree as Record<string, unknown>;
}

/**
 * The short links, read once per build. A build fails when they can't be read; while
 * writing (pnpm dev), the site links to the full addresses instead, and says so.
 *
 * @returns How to link to, and show, an address
 */
export function getShortLinks(): Promise<ShortLinks> {
  loaded ??= (async () => {
    const [error, tree] = await tryCatch(fetchLinks);

    if (error && !import.meta.env.DEV) {
      throw new Error(`[short-links] ${error.message}. The build stops rather than link through outdated short links.`);
    }

    if (error) {
      console.warn(`[short-links] ${error.message}; linking to the full addresses.`);
    }

    const links = tree ? collect(tree, [], new Map(), Date.now()) : new Map<string, string>();
    const href = (address: string) => links.get(key(address)) ?? address;

    return {
      href,
      text: address => href(address).replace(/^[a-z]+:(?:\/\/)?(?:www\.)?/i, "").replace(/\/$/, ""),
    };
  })();

  return loaded;
}
