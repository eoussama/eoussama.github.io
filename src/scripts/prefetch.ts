/*
 * Pages fetched ahead of the click, where the browser cannot prerender them.
 *
 * Chrome and Edge take the speculation rules in the page's head (Base.astro) and
 * prerender a page as a link is pointed at, so it opens at once. Safari and Firefox do
 * not: there, a click waited for the network, and for a page on GitHub Pages that wait
 * is the server's own, a quarter of a second or more, however small the page. So when
 * speculation rules are out of reach, a page is fetched into the browser's cache as soon
 * as the visitor shows interest in its link, as Chrome's "moderate" rules would: the
 * pointer resting on it, or a finger or button pressing it. The click then finds it
 * there. Not the keyboard reaching it: tabbing across a page would fetch every page it
 * links to, and the speculation rules do not either.
 *
 * It follows the same rules as the speculation rules: pages of the site only, not the
 * lists (they open over the page), new tabs, files, or other versions. And nothing is
 * fetched ahead for a visitor who asked to save data, or on a 2G connection, where a
 * page fetched and never opened costs more than a quicker page saves.
 */

/** How long the pointer rests on a link before its page is fetched, in milliseconds. */
const DWELL = 80;
const BASE = import.meta.env.BASE_URL;

/** The Network Information API, where the browser has it (not in TypeScript's DOM types). */
const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
const thrifty = !!connection?.saveData || /2g/.test(connection?.effectiveType ?? "");

if (!HTMLScriptElement.supports?.("speculationrules") && !thrifty) {
  const asked = new Set<string>();
  const links = document.createElement("link").relList;
  let timer = 0;

  /**
   * The page a link opens, if it is worth fetching ahead.
   *
   * @param target - Where the visitor showed interest
   * @returns The page's address, or null
   */
  const pageOf = (target: EventTarget | null): string | null => {
    const link = target instanceof Element ? target.closest("a") : null;

    if (!link || link.matches("[data-drawer], [target=_blank], [download]") || link.origin !== location.origin) {
      return null;
    }

    const { pathname, search } = link;

    if (!pathname.startsWith(BASE) || /\.(?:pdf|xml|txt|svg|jpg)$/.test(pathname) || (BASE === "/" && pathname.startsWith("/v/"))) {
      return null;
    }

    // The page already open, or an address with a query (a list over the page).
    return pathname === location.pathname || search ? null : pathname;
  };

  /**
   * Fetches a page into the cache, once.
   *
   * @param address - The page's address
   */
  const fetchAhead = (address: string) => {
    if (asked.has(address)) {
      return;
    }

    asked.add(address);

    if (links.supports("prefetch")) {
      const link = document.createElement("link");

      link.rel = "prefetch";
      link.href = address;
      document.head.append(link);
    }
    else {
      // Low priority: what is on the page now comes first.
      fetch(address, { priority: "low" } as RequestInit).catch(() => {});
    }
  };

  document.addEventListener("pointerover", (event) => {
    const address = pageOf(event.target);

    clearTimeout(timer);

    // A finger is handled as it touches, below: it has no resting.
    if (address && event.pointerType === "mouse") {
      timer = window.setTimeout(fetchAhead, DWELL, address);
    }
  }, { passive: true });

  document.addEventListener("pointerout", () => clearTimeout(timer), { passive: true });

  document.addEventListener("pointerdown", (event) => {
    const address = pageOf(event.target);

    if (address) {
      fetchAhead(address);
    }
  }, { passive: true });
}

export {};
