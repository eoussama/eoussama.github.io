## Description
Hello, I'm Oussama Essamadi, EOussama for short.

## Social links
* [Portfolio](https://ouss.es)
* [GitHub](https://github.com/EOussama)
* [LinkedIn](https://www.linkedin.com/in/eoussama)
* [Twitter/X](https://twitter.com/OussamaEssamadi)
* **Email**: [oussama.essamadi@gmail.com](mailto:oussama.essamadi@gmail.com)

## Versions
Every version of the site is still online. The current one lists them in its header's version menu; the older ones have a version switcher in the bottom-left corner.

* [v0.1 · 2018](https://ouss.es/v/0.1/): the original portfolio
* [v0.2 · 2021](https://ouss.es/v/0.2/): portfolio reset
* [v0.3 · 2023](https://ouss.es/v/0.3/): redesign
* [v0.4 · 2024](https://ouss.es/v/0.4/): minimal links page
* [v0.5 · 2026](https://ouss.es/): rewrite in Astro, in seven languages (current)

Versions are listed in [`archive/versions.json`](archive/versions.json) and built from their git tags by [`scripts/build-site.sh`](scripts/build-site.sh) on every push to `master`, every Monday (to refresh the projects' GitHub stats), and on demand from the Actions tab.

## Working on it
Needs Node 26 (see `.nvmrc`) and pnpm.

* `pnpm install`, then `pnpm dev` for the site at http://localhost:4321
* `pnpm lint` and `pnpm check` before committing
* `bash scripts/build-site.sh` builds the whole hosted site, every version included, into `_site/`
