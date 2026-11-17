## Description
Hello, I'm Oussama Essamadi, EOussama for short.

## Social links
* [Portfolio](https://ouss.es/)
* [GitHub](https://to.ouss.es/github)
* [LinkedIn](https://to.ouss.es/in)
* [Twitter/X](https://to.ouss.es/x)
* **Email**: [hi@ouss.es](https://to.ouss.es/mail)

## Versions
Every version of the site is still online. The current one lists them in its header's version menu; the older ones have a version switcher in the bottom-left corner.

* [v0.1 · 2018](https://ouss.es/v/0.1/): the original portfolio
* [v0.2 · 2021](https://ouss.es/v/0.2/): portfolio reset
* [v0.3 · 2023](https://ouss.es/v/0.3/): redesign
* [v0.4 · 2024](https://ouss.es/v/0.4/): minimal links page
* [v0.5 · 2026](https://ouss.es/): rewrite in Astro, in seven languages (current)

Versions are listed in [`archive/versions.json`](archive/versions.json) and built from their git refs (a tag each, except v0.2, which is the commit before its tag, and the current version, which is the checked-out tree) by [`scripts/build-site.sh`](scripts/build-site.sh) on every push to `master`, every Monday (to refresh the projects' GitHub stats and the short links), and on demand from the Actions tab.

## Working on it
Needs Node 26 (see `.nvmrc`) and pnpm.

* `pnpm install`, then `pnpm dev` for the site at http://localhost:4321
* `pnpm check` before committing: it audits the dependencies, lints, checks the types and builds
* `bash scripts/build-site.sh` builds the whole hosted site, every version included, into `_site/`

Builds read from the network:

* The site's links to other places go through short links at [to.ouss.es](https://to.ouss.es/), which every build reads from the [redirector](https://github.com/eoussama/redirector)'s `src/links.json`. A build that can't read them fails, rather than link through outdated ones; `pnpm dev` links to the full addresses instead, and warns.
* The projects' stars, languages and dates come from the GitHub API too, falling back to the saved snapshot (`src/data/github.json`, refreshed with `pnpm snapshot`) when it can't be reached. `GITHUB_OFFLINE=1` uses the snapshot without asking (and `pnpm dev` always does); it doesn't apply to the short links.
* `GITHUB_TOKEN` lifts the GitHub API's limit of 60 requests an hour, which the projects' stats use up quickly. Without it, the short links are read from GitHub's raw file host instead, which may be up to five minutes behind.
* `PUBLIC_GA_ID` (see `.env.example`) turns on Google Analytics, behind a consent banner.

## License
Apache License 2.0, see [LICENSE](LICENSE). Copyright 2018-2026 Oussama Essamadi.
