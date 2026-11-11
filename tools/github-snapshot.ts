/*
 * Refreshes src/data/github.json, the saved copy of every project repository's GitHub
 * details. Builds fetch live data and fall back to this copy when GitHub is out of
 * reach, so it only needs refreshing now and then: `pnpm snapshot`.
 */

import type { Snapshot } from "../src/lib/github-api.ts";

import { readdir, readFile, writeFile } from "node:fs/promises";
import process from "node:process";

import { tryCatch } from "@eoussama/core";

import { fetchRepo, repoSlug } from "../src/lib/github-api.ts";



/**
 * Reads every project's repository, fetches its details and saves them.
 *
 * @returns Once the snapshot is saved, or left alone after a failure
 */
async function main() {
  const projects = new URL("../src/content/projects/", import.meta.url);
  const target = new URL("../src/data/github.json", import.meta.url);

  const files = (await readdir(projects)).filter(file => file.endsWith(".yaml"));
  const slugs: string[] = [];

  for (const file of files) {
    const text = await readFile(new URL(file, projects), "utf8");
    const repo = /^repo:\s*(\S+)/m.exec(text)?.[1];

    if (repo) {
      slugs.push(repoSlug(repo));
    }
  }

  const snapshot: Snapshot = { fetchedAt: new Date().toISOString(), repos: {} };
  let failed = 0;

  for (const slug of slugs.sort()) {
    const [error, stats] = await tryCatch(() => fetchRepo(slug, process.env.GITHUB_TOKEN));

    if (error) {
      failed++;
      console.error(`✗ ${slug}: ${error.message}`);
    }
    else {
      snapshot.repos[slug] = stats;
      console.log(`✓ ${slug} ★${stats.stars}`);
    }
  }

  if (failed) {
    console.error(`${failed} repositories failed; the snapshot was left as it was.`);
    process.exitCode = 1;

    return;
  }

  await writeFile(target, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`Saved ${slugs.length} repositories to src/data/github.json`);
}

main();
