# Security Policy

## Supported Versions

Only the current version of the site, at [ouss.es](https://ouss.es), receives security fixes. The older versions in the archive at `ouss.es/v/` are kept as they were.

Some older project apps are also served from ouss.es itself, such as `ouss.es/playback-sync/`, `ouss.es/publi-pro-max/` and `ouss.es/firemitt/`. They share the site's origin, so a flaw in one of them can reach the site: they are in scope, and reported the same way.

The current site ships a Content Security Policy in each page (a `<meta>`, as GitHub Pages sends no custom headers), written at build time by [`src/lib/csp.ts`](src/lib/csp.ts): scripts run only from the site itself or by the hash of each inline script, and Google Analytics's hosts are allowed only in a build that has it. A way around that policy is a vulnerability too. The archived versions and the project apps above have no such policy.

## Reporting a Vulnerability

Please **do not** report security vulnerabilities through public issues, discussions, or pull requests.

Instead, report them privately through GitHub:

1. Go to the [Security Advisories](https://github.com/eoussama/eoussama.github.io/security/advisories/new) page of this repository.

2. Fill out the form with as much detail as possible, including a clear description of the vulnerability, its potential impact, and any steps to reproduce it.

If you cannot use GitHub's private reporting, email hi@ouss.es instead.

You can expect an initial response within a few days. Please give us reasonable time to address the issue before disclosing it publicly.
