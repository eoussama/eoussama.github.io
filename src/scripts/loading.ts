/*
 * A page on its way. On a slow connection the page a link opens can take a moment to
 * arrive, with nothing to say it is coming: so once a link to another page of the site
 * is followed, its chevron turns into a small spinning circle, the same size and colour,
 * until the page is left. A page put back from the back/forward cache gets its chevrons
 * back.
 *
 * Only a plain click that opens the page in place: not one handled on the page itself
 * (a list's drawer), one with a modifier key (a new tab or window), a file to download,
 * or a link to a place on the same page.
 *
 * The whole icon turns, not the circle inside it: Safari stops drawing a page the moment
 * a link is followed, and only an animation of an element's transform, which it hands to
 * the graphics card, goes on turning after that.
 */

/** A circle three-quarters drawn; it fits the chevron's box, and the icon turns it. */
const SPINNER = "<circle cx=\"5.5\" cy=\"5.5\" r=\"3.4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-dasharray=\"16 5.4\"></circle>";

/** The icons turned, with what they drew before. */
const turned = new Map<SVGElement, { link: HTMLAnchorElement; drawing: string }>();

/**
 * Whether a click on a link opens its page here, in place of this one.
 *
 * @param event - The click
 * @param link - The link clicked
 * @returns Whether this page is about to be left for the link's
 */
function leavesFor(event: MouseEvent, link: HTMLAnchorElement): boolean {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }

  if ((link.target && link.target !== "_self") || link.hasAttribute("download")) {
    return false;
  }

  const to = new URL(link.href, location.href);

  return to.origin === location.origin && (to.pathname !== location.pathname || to.search !== location.search);
}

// Listened to on the document, after the page's own handlers have had their say.
document.addEventListener("click", (event) => {
  const link = (event.target as Element | null)?.closest?.("a");
  const icon = link?.querySelector<SVGElement>(".lk-page");

  if (!link || !icon || turned.has(icon) || !leavesFor(event, link)) {
    return;
  }

  turned.set(icon, { link, drawing: icon.innerHTML });
  icon.innerHTML = SPINNER;
  icon.classList.add("lk-spin");
  link.dataset.loading = "";
});

addEventListener("pageshow", (event) => {
  if (!event.persisted) {
    return;
  }

  turned.forEach(({ link, drawing }, icon) => {
    icon.innerHTML = drawing;
    icon.classList.remove("lk-spin");
    delete link.dataset.loading;
  });
  turned.clear();
});

export {};
