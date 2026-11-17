/*
 * The language links (the header's menu, the command menu's) lead to the same page in
 * another language, and keep the address's state with them: the list drawer as it is,
 * or, on a missing page, the address that was asked for.
 *
 * Its own module, which the list drawer imports too: so that the drawer's code, loaded
 * later (lazy.ts), shares it with the page's rather than pulling the rest of site.ts.
 */

/**
 * Points the language links at the same page, with the list drawer as it is, elsewhere.
 * A missing page passes on the address asked for, so the one in another language shows
 * it too: only a path of this site, as a link could put anything there. Called as the
 * page opens, and again whenever the drawer changes the address (drawer.ts).
 */
export function syncLanguageLinks() {
  const missing = !!document.querySelector(".nf-hole");
  const asked = new URLSearchParams(location.search).get("from") ?? location.pathname;
  // Or a short link it didn't know, as the root 404 marks it (NotFound.astro).
  const from = /^(?:to\.ouss\.es)?\/(?![/\\])\S{0,200}$/.test(asked) ? asked : "";

  document.querySelectorAll<HTMLAnchorElement>("a[data-lang-link]").forEach((link) => {
    link.dataset.base ??= link.getAttribute("href") ?? "";

    const next = new URL(link.dataset.base, location.href);

    next.search = location.search;
    // A short link's UTM tags belong to the page it led to (analytics.ts): carried on,
    // GA would count the next page as a new visit through it.
    [...next.searchParams.keys()].filter(key => key.startsWith("utm_")).forEach(key => next.searchParams.delete(key));

    if (missing && from) {
      next.searchParams.set("from", from);
    }
    else if (missing) {
      next.searchParams.delete("from");
    }

    link.href = `${next.pathname}${next.search}`;
  });
}

syncLanguageLinks();
