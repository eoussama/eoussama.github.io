/*
 * Pages that open in place. Moving between pages is a view transition across
 * documents: a project's bullet grows into its page's star, a post's stretches into
 * the rule under its title, and the name becomes the title; and back again. Project
 * and post pages name their star (or rule) and title in their stylesheet;
 * a list names the bullet and name of the link followed only as the page is left,
 * because the same project is listed twice on the home page and two elements can't
 * share a name. Coming back, the list names them as it is shown: that part runs
 * inline at the end of the page (Base.astro), since it has to be in place before
 * the page's first paint.
 */

type Activation = { entry?: { url: string } | null; from?: { url: string } | null };
type SwapEvent = Event & { viewTransition: ViewTransition | null; activation: Activation | null };

/**
 * The project or post a page address is about, as "projects-<id>" or "blog-<slug>".
 *
 * @param url - A page address
 * @returns Its key, or null when it is neither
 */
function itemOf(url: string | undefined | null): string | null {
  if (!url) {
    return null;
  }

  const match = /\/(projects|blog)\/([^/]+)\/$/.exec(new URL(url).pathname);

  return match ? `${match[1]}-${match[2]}` : null;
}

/**
 * Gives a list item's name the transition name its page's title uses.
 *
 * @param link - The link to the project or post
 * @param key - Its key, from itemOf()
 * @returns A function that takes the names back
 */
function carry(link: HTMLAnchorElement, key: string): () => void {
  const item = link.closest(".ck-item, li") ?? link;
  const label = link.matches(".next") ? link.querySelector<HTMLElement>("span") : item.matches(".ck-item") ? item.querySelector<HTMLElement>(".ck-l > span") : link;

  if (label) {
    label.style.viewTransitionName = `vt-name-${key}`;
    label.classList.add("vt-carry");
  }

  return () => {
    label?.classList.remove("vt-carry");
    label?.style.removeProperty("view-transition-name");
  };
}

/**
 * The link to a project or post that is showing on the page: in the open drawer, or
 * else on the home page.
 *
 * @param key - Its key, from itemOf()
 * @returns The link, or null
 */
function visibleLink(key: string): HTMLAnchorElement | null {
  const [section, ...rest] = key.split("-");
  const links = [...document.querySelectorAll<HTMLAnchorElement>(`a[href$="/${section}/${rest.join("-")}/"]`)];
  const shown = (link: HTMLAnchorElement) => !link.closest("[inert], .crumb, .ck") && link.getClientRects().length > 0;

  return links.find(link => shown(link) && link.closest(".dr")) ?? links.find(shown) ?? null;
}

let clicked: HTMLAnchorElement | null = null;

document.addEventListener("click", (event) => {
  clicked = (event.target as Element).closest("a");
}, true);

// Leaving for a project or post: the link followed carries its bullet and name along.
window.addEventListener("pageswap", (event) => {
  const { viewTransition, activation } = event as SwapEvent;
  const to = activation?.entry?.url;
  const key = itemOf(to);

  if (!viewTransition || !key || itemOf(location.href) === key) {
    return;
  }

  const link = clicked && to && new URL(clicked.href).pathname === new URL(to).pathname ? clicked : visibleLink(key);

  if (link) {
    viewTransition.finished.finally(carry(link, key));
  }
});

/*
 * Changing language: the same page in another language. Each section on screen is
 * named, so each blurs out of one language and into the other, top to bottom
 * (global.css), rather than the whole page flipping at once. The new page names
 * them too, in Base.astro, before its first paint.
 */

/** A language's part of an address: /p/<code>/ for all but English. */
const LANG_PART = /\/p\/(ar|ary|fr|es|it|ja)\//;

/**
 * The page an address shows and the language it shows it in.
 *
 * @param url - The address
 * @returns Its page, without the language, and its language
 */
function pageOf(url: string): { page: string; lang: string } {
  const path = new URL(url, location.href).pathname;

  return { page: path.replace(LANG_PART, "/p/").replace(/\/p\/$/, "/"), lang: LANG_PART.exec(path)?.[1] ?? "en" };
}

window.addEventListener("pageswap", (event) => {
  const { viewTransition, activation } = event as SwapEvent;
  const to = activation?.entry?.url;

  if (!viewTransition || !to) {
    return;
  }

  const here = pageOf(location.href);
  const there = pageOf(to);

  if (here.page !== there.page || here.lang === there.lang) {
    return;
  }

  const root = document.documentElement;
  const shown = (el: Element) => {
    const box = el.getBoundingClientRect();

    return box.bottom > 0 && box.top < innerHeight;
  };
  const parts: [HTMLElement, string][] = [];

  document.querySelectorAll<HTMLElement>("main .row").forEach((row, i) => {
    if (shown(row)) {
      parts.push([row, `lang-r${i}`]);
    }
  });

  root.classList.add("vt-lang");
  parts.forEach(([el, name]) => el.style.setProperty("view-transition-name", name, "important"));
  viewTransition.finished.finally(() => {
    root.classList.remove("vt-lang");
    parts.forEach(([el]) => el.style.removeProperty("view-transition-name"));
  });
});
