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
  /** When its first commit was made, on its default branch. */
  started?: string | null;
  /** Its latest tag, by version, and when the commit it marks was made. */
  tag?: { name: string; date: string } | null;
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
 * Orders tags by version, newest first: "v1.10.0" after "v1.9.2", and a pre-release
 * ("v2.0.0-beta.1") before the release it leads to. Names that are not versions fall
 * back to their order as text.
 *
 * @param a - One tag's name
 * @param b - The other's
 * @returns Negative when a is newer
 */
export function byVersion(a: string, b: string): number {
  const parse = (name: string) => {
    const match = /(\d+(?:\.\d+)*)(?:-([\w.-]+))?/.exec(name);

    return { core: match?.[1]?.split(".").map(Number) ?? [], pre: match?.[2] ?? null };
  };
  const x = parse(a);
  const y = parse(b);

  for (let i = 0; i < Math.max(x.core.length, y.core.length); i++) {
    const difference = (y.core[i] ?? 0) - (x.core[i] ?? 0);

    if (difference) {
      return difference;
    }
  }

  if (x.pre !== y.pre) {
    if (!x.pre) {
      return -1;
    }

    if (!y.pre) {
      return 1;
    }
  }

  return b.localeCompare(a, "en", { numeric: true });
}

/**
 * Fetches one repository's details, trying a few times and giving up after a while:
 * what GitHub says of it, when its first commit was made, and its latest tag.
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

  const get = (path: string) => retry(async () => {
    const response = await withTimeout(fetch(`https://api.github.com/repos/${slug}${path}`, { headers }), 8000);

    // An empty repository has no commits to list: GitHub answers 409.
    if (!response.ok && response.status !== 409) {
      throw new Error(`GitHub answered ${response.status} for ${slug}${path}`);
    }

    return response;
  }, { retries: 2, delay: 600 });

  const json = async (path: string) => {
    const response = await get(path);

    return response.ok ? response.json() as Promise<unknown> : null;
  };

  // The date of the first commit: the last page of the history, one commit a page.
  const started = async (): Promise<string | null> => {
    const response = await get("/commits?per_page=1");

    if (!response.ok) {
      return null;
    }

    const last = /[?&]page=(\d+)>; rel="last"/.exec(response.headers.get("link") ?? "")?.[1];
    const page = (last ? await json(`/commits?per_page=1&page=${last}`) : await response.json()) as { commit?: { author?: { date?: string } } }[] | null;

    return page?.[0]?.commit?.author?.date ?? null;
  };

  // The latest tag by version, and the date of the commit it marks.
  const tag = async (): Promise<RepoStats["tag"]> => {
    const tags = (await json("/tags?per_page=100") ?? []) as { name: string; commit: { sha: string } }[];
    const latest = tags.map(t => t.name).sort(byVersion)[0];
    const sha = tags.find(t => t.name === latest)?.commit.sha;

    if (!latest || !sha) {
      return null;
    }

    const commit = await json(`/commits/${sha}`) as { commit?: { committer?: { date?: string } } } | null;

    return { name: latest, date: commit?.commit?.committer?.date ?? "" };
  };

  const [repo, first, latest] = await Promise.all([json("") as Promise<Record<string, unknown>>, started(), tag()]);

  return {
    stars: Number(repo.stargazers_count ?? 0),
    forks: Number(repo.forks_count ?? 0),
    language: (repo.language as string | null) ?? null,
    created: String(repo.created_at ?? ""),
    pushed: String(repo.pushed_at ?? ""),
    description: (repo.description as string | null) ?? null,
    homepage: (repo.homepage as string | null) || null,
    archived: Boolean(repo.archived),
    started: first,
    tag: latest,
  };
}
