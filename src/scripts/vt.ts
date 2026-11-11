/*
 * Pages that open in place. Moving between pages is a view transition across
 * documents: a project's bullet grows into its page's star and its name into the
 * title, and back again. A project page names its star and title in its stylesheet;
 * a list names the bullet and name of the link followed only as the page is left,
 * because the same project is listed twice on the home page and two elements can't
 * share a name. Coming back, the list names them as it is shown: that part runs
 * inline at the end of the page (Base.astro), since it has to be in place before
 * the page's first paint.
 */

type Activation = { entry?: { url: string } | null; from?: { url: string } | null };
type SwapEvent = Event & { viewTransition: ViewTransition | null; activation: Activation | null };

/**
 * The project a page address is about, if it is a project page.
 *
 * @param url - A page address
 * @returns The project's id, or null
 */
function projectOf(url: string | undefined | null): string | null {
  if (!url) {
    return null;
  }

  return /\/projects\/([^/]+)\/$/.exec(new URL(url).pathname)?.[1] ?? null;
}

/**
 * Gives a list item's bullet and name the transition names its project's page uses.
 *
 * @param link - The link to the project
 * @param id - The project's id
 * @returns A function that takes the names back
 */
function carry(link: HTMLAnchorElement, id: string): () => void {
  const item = link.closest(".ck-item, li") ?? link;
  const dot = link.matches(".next") ? link.querySelector<HTMLElement>(".dot") : item.querySelector<HTMLElement>(".dot, .ck-ic");
  const label = link.matches(".next") ? link.querySelector<HTMLElement>("span") : item.matches(".ck-item") ? item.querySelector<HTMLElement>(".ck-l > span") : link;

  if (dot) {
    dot.style.viewTransitionName = `vt-dot-${id}`;
  }

  if (label) {
    label.style.viewTransitionName = `vt-name-${id}`;
  }

  return () => {
    dot?.style.removeProperty("view-transition-name");
    label?.style.removeProperty("view-transition-name");
  };
}

/**
 * The link to a project that is showing on the page: in the open drawer, or else on
 * the home page.
 *
 * @param id - The project's id
 * @returns The link, or null
 */
function visibleLink(id: string): HTMLAnchorElement | null {
  const links = [...document.querySelectorAll<HTMLAnchorElement>(`a[href$="/projects/${id}/"]`)];
  const shown = (link: HTMLAnchorElement) => !link.closest("[inert], .crumb, .ck") && link.getClientRects().length > 0;

  return links.find(link => shown(link) && link.closest(".dr")) ?? links.find(shown) ?? null;
}

let clicked: HTMLAnchorElement | null = null;

document.addEventListener("click", (event) => {
  clicked = (event.target as Element).closest("a");
}, true);

// Leaving for a project: the link followed carries its bullet and name along.
window.addEventListener("pageswap", (event) => {
  const { viewTransition, activation } = event as SwapEvent;
  const to = activation?.entry?.url;
  const id = projectOf(to);

  if (!viewTransition || !id || projectOf(location.href) === id) {
    return;
  }

  const link = clicked && to && new URL(clicked.href).pathname === new URL(to).pathname ? clicked : visibleLink(id);

  if (link) {
    viewTransition.finished.finally(carry(link, id));
  }
});
