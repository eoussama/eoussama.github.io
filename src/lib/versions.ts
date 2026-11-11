import manifest from "../../archive/versions.json";
import pkg from "../../package.json";

import { url } from "./url";



type Entry = { version: string; ref: string; year: number; title: string; current?: boolean; build?: string };

/** This version's "x.y", from package.json. */
export const CURRENT = pkg.version.split(".").slice(0, 2).join(".");

export type Version = { name: string; title: string; year: number; href: string; current: boolean };

/**
 * Every version of the site, newest first, from the archive manifest the version
 * switcher of the older versions reads too. The current one links to this build.
 *
 * @returns The versions, with their names, titles, years and addresses
 */
export function versions(): Version[] {
  const entries = manifest as Entry[];
  const own = entries.find(v => v.version === CURRENT);
  const list: Version[] = entries
    .filter(v => v.version !== CURRENT)
    .map(v => ({ name: `v${v.version}`, title: v.title, year: v.year, href: `/v/${v.version}/`, current: false }));

  list.push({ name: `v${CURRENT}`, title: own?.title ?? "Rewrite in Astro", year: own?.year ?? 2026, href: url(), current: true });

  const key = (v: Version) => v.name.slice(1).split(".").map(Number);

  return list.sort((a, b) => {
    const [a1 = 0, a2 = 0] = key(a);
    const [b1 = 0, b2 = 0] = key(b);

    return b1 - a1 || b2 - a2;
  });
}
