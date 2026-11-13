---
title: A business card in your terminal
date: 2025-07-20T16:17:43Z
summary: How a one-file npm package became my business card, and why the name it holds matters more than the code.
note: Try it in any terminal with npx ouss.
tags: [npm, Node.js]
---

Type this into any terminal with Node installed:

```bash
npx ouss
```

npm asks if it may install `ouss`, and once you say yes, your browser opens on this site. That's the whole program. It's my business card for the place developers already live; the command line.

## The card

The package is a single file with one import and one call:

```js
#!/usr/bin/env node
import open from "open";

open("https://ouss.es/");
```

The `bin` field in `package.json` turns it into a command named `ouss`, and `npx` runs a command straight from the registry without installing anything for good. The rest of `package.json` is the actual card:

```json
{
  "name": "ouss",
  "description": "Hi, I'm EOussama.",
  "author": "eoussama",
  "funding": "https://github.com/sponsors/eoussama",
  "keywords": ["ouss", "ouss.es", "eoussama"],
  "bin": { "ouss": "./src/index.js" }
}
```

Run `npm view ouss` and npm prints it back: the greeting, who wrote it, where it lives and how to support it. The package's page on npmjs.com shows the same thing to anyone who searches for it.

## The trick

The clever part isn't the code; it's the name. Unscoped package names on npm form one flat, global namespace, handed out first come, first served. There is exactly one `ouss` in it, and it's mine.

That makes the name work like a domain, except it's free and needs no renewal. It also comes with a fingerprint of sorts:

- **It's dated.** The registry recorded when `ouss@0.0.0` was published, on 20 July 2025, and that timestamp stays with the package.
- **It's tied to an account.** The package lists its maintainer, and only that account can publish under the name.
- **It can't be quietly rewritten.** npm never lets a version number be published twice, so `0.0.0` will always be exactly what it was.

A short, memorable handle that every Node developer can reach with one command, backed by a public record of who holds it and since when. All for the price of a `package.json`.

One thing worth keeping in mind: npm frowns on names claimed only to sit on them. A card that does something, even something this small, is a real package with a real purpose.

## Why only npm

GitHub's registry only takes scoped names, so there the package could only ever be `@eoussama/ouss`. And installing from it, even a public package, takes a GitHub token and a line of registry setup first. Nobody is going to do that to read a business card. A card has to work for a stranger in one command, and only the bare, global `ouss` on npm does.

---

_The package's source is on [GitHub](https://github.com/eoussama/ouss), and the package itself on [npm](https://www.npmjs.com/package/ouss)._
