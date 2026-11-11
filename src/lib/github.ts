import type { RepoStats, Snapshot } from "./github-api";

import process from "node:process";

import { tryCatch } from "@eoussama/core";

import saved from "~/data/github.json";

import { fetchRepo, repoSlug } from "./github-api";



const snapshot = saved as Snapshot;
const cache = new Map<string, Promise<RepoStats | null>>();

/**
 * A repository's GitHub details. Builds fetch them live, once per repository; when
 * GitHub can't be reached, and in development, they come from the saved snapshot, so
 * an outage or a rate limit never breaks a build.
 *
 * @param url - The repository's GitHub address
 * @returns Its details, or null when neither GitHub nor the snapshot has them
 */
export function repoStats(url: string): Promise<RepoStats | null> {
  const slug = repoSlug(url);
  let stats = cache.get(slug);

  if (!stats) {
    stats = (async () => {
      const fallback = snapshot.repos[slug] ?? null;

      if (import.meta.env.DEV || process.env.GITHUB_OFFLINE) {
        return fallback;
      }

      const [error, live] = await tryCatch(() => fetchRepo(slug, process.env.GITHUB_TOKEN));

      if (error) {
        console.warn(`[github] ${error.message}; using the saved snapshot.`);

        return fallback;
      }

      return live;
    })();

    cache.set(slug, stats);
  }

  return stats;
}
