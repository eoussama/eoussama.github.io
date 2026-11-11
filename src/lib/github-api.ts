import { retry, withTimeout } from "@eoussama/core";



/*
 * Reads a public repository's details from the GitHub API. Shared by the site's build
 * and by tools/github-snapshot.ts, so it only uses what Node itself provides.
 */

export type RepoStats = {
  stars: number;
  forks: number;
  language: string | null;
  created: string;
  pushed: string;
  description: string | null;
  homepage: string | null;
  archived: boolean;
};

export type Snapshot = {
  fetchedAt: string;
  repos: Record<string, RepoStats>;
};

/**
 * A repository's "owner/name", from its address.
 *
 * @param url - The repository's GitHub address
 * @returns Its "owner/name", in lower case
 */
export function repoSlug(url: string): string {
  return new URL(url).pathname.replace(/^\/+|\/+$/g, "").toLowerCase();
}

/**
 * Fetches one repository's details, trying a few times and giving up after a while.
 *
 * @param slug - The repository's "owner/name"
 * @param token - A GitHub token, to lift the API's rate limit (optional)
 * @returns The repository's details
 * @throws When GitHub can't be reached or doesn't know the repository
 */
export async function fetchRepo(slug: string, token?: string): Promise<RepoStats> {
  const headers: Record<string, string> = { "Accept": "application/vnd.github+json", "User-Agent": "portfolio-build" };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return retry(async () => {
    const response = await withTimeout(fetch(`https://api.github.com/repos/${slug}`, { headers }), 8000);

    if (!response.ok) {
      throw new Error(`GitHub answered ${response.status} for ${slug}`);
    }

    const repo = await response.json() as Record<string, unknown>;

    return {
      stars: Number(repo.stargazers_count ?? 0),
      forks: Number(repo.forks_count ?? 0),
      language: (repo.language as string | null) ?? null,
      created: String(repo.created_at ?? ""),
      pushed: String(repo.pushed_at ?? ""),
      description: (repo.description as string | null) ?? null,
      homepage: (repo.homepage as string | null) || null,
      archived: Boolean(repo.archived),
    };
  }, { retries: 2, delay: 600 });
}
