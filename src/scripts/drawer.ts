import type { List as Name } from "./lists";
import type { Sheet } from "./sheet";

import { syncLanguageLinks } from "./languages";
import { loadList } from "./lists";
import { makeSheet } from "./sheet";



/*
 * The list drawer. "All projects" and "All posts" open it over whatever page is
 * showing, and the address holds its whole state, so a link brings it back as it was:
 *
 *   ?list=projects&q=type&language=TypeScript&type=library
 *
 * Opening adds an entry to the history, so Back closes it; searching and filtering
 * update the address in place. The logo and the section name fly into its header.
 *
 * Loaded the first time it is wanted, by the links and keys that open it (lazy.ts).
 * Each list, and its filters, come from files beside its page (lists.ts): until they
 * are here, its sheet has its search and a quiet word in place of the list, and
 * whatever the address asks of the filters waits for them.
 */

type List = "" | Name;

const PARAM: Record<Name, string> = { work: "projects", writing: "posts" };
const LIST_OF: Record<string, List> = { projects: "work", posts: "writing" };

// Only ever loaded on a page that has it (lazy.ts).
const drawer = document.querySelector<HTMLElement>("#drawer")!;
const root = document.documentElement;

/**
 * Puts the page out of reach while a list is open, and what stands beside it too
 * (the skip link, the section map, the way back up, the consent banner), so that
 * the keyboard stays in the drawer. The drawer, its scrim and the dialogs are left be.
 *
 * @param away - Whether a list is open
 */
function behind(away: boolean) {
  for (const el of document.body.children) {
    if (el instanceof HTMLElement && el !== drawer && !el.matches("dialog, script, style, .dr-scrim, .ground, .sky")) {
      el.inert = away;
    }
  }
}
const pageTitle = document.title;
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
let opener: HTMLElement | null = null;

const current = () => (root.dataset.open ?? "") as List;

// What a screen reader is told as the open list changes: that it is on its way, how
// many it holds once here, how many a search or the filters leave. One line for both
// lists, outside their sheets, which are marked busy while their list is on its way.
const status = drawer.querySelector<HTMLElement>("[data-dr-status]");
let saying = 0;

/**
 * Says something through the status line, now or after a moment: while a search is
 * typed, only once the typing pauses, so each letter isn't read out.
 *
 * @param text - What to say
 * @param after - How long to wait, in milliseconds; anything said meanwhile replaces it
 */
function say(text: string, after = 0) {
  window.clearTimeout(saying);

  const put = () => {
    if (status && status.textContent !== text) {
      status.textContent = text;
    }
  };

  if (after) {
    saying = window.setTimeout(put, after);
  }
  else {
    put();
  }
}

/**
 * Puts focus in a list just opened: on its search, so typing filters at once. On a
 * touch screen that would raise the keyboard over the list: the title takes it.
 *
 * @param list - The list
 */
function focusList(list: List) {
  const search = drawer.querySelector<HTMLInputElement>(`[data-sheet="${list}"] .dr-q`);
  const touch = matchMedia("(hover: none) and (pointer: coarse)").matches;

  (touch ? drawer.querySelector<HTMLElement>(".dr-title") : search)?.focus({ preventScroll: true });
}

/**
 * The window's title with a list open: the list's name before the page's, unless the
 * page is the list's own, whose title names it already.
 *
 * @param list - The list open, or "" for none
 * @returns The title
 */
function titleFor(list: List) {
  const name = list ? drawer.dataset[list === "work" ? "titleWork" : "titleWriting"] : "";

  return !name || pageTitle.startsWith(`${name} · `) ? pageTitle : `${name} · ${pageTitle}`;
}

/* ---------- Each list's search and filters ---------- */

const sheets = new Map<List, Sheet>();

/**
 * The address for a list with its search and filters, keeping anything else the
 * page's address had.
 *
 * @param list - The list to show, or "" for none
 * @returns The address
 */
function addressFor(list: List): string {
  const next = new URLSearchParams(location.search);

  next.delete("list");
  sheets.forEach(sheet => sheet.keys.forEach(key => next.delete(key)));

  if (list) {
    next.set("list", PARAM[list]);
    sheets.get(list)?.params().forEach(([key, value]) => next.append(key, value));
  }

  const query = next.toString();

  return `${location.pathname}${query ? `?${query}` : ""}${location.hash}`;
}

/** Writes the open list's search and filters into the address, in place. */
function saveState() {
  const list = current();

  if (list) {
    history.replaceState(history.state, "", addressFor(list));
    syncLanguageLinks();
  }
}

/**
 * Fetches a list, if it isn't already on its way, and puts it in its sheet once it is
 * here: as soon as a visitor heads for it, so that it is there as the drawer opens.
 *
 * @param list - The list
 */
export function prepare(list: Name) {
  const sheet = sheets.get(list);

  loadList(list).then(parts => sheet?.fill(parts), () => sheet?.fail());
}

drawer.querySelectorAll<HTMLElement>(".dr-sheet").forEach((element) => {
  const list = element.dataset.sheet as Name;

  sheets.set(list, makeSheet(element, {
    words: drawer.dataset,
    say,
    save: saveState,
    showing: () => current() === list,
    retry: () => prepare(list),
  }));
});

const closeMenus = () => [...sheets.values()].map(sheet => sheet.closeMenu()).includes(true);

/* ---------- Opening and closing ---------- */

/**
 * Moves an element from where something else was to where it is now, over the
 * same time and curve as the drawer's slide, so the two travel together.
 *
 * @param element - The element to move
 * @param from - Where it starts
 * @param uniform - Whether to scale it evenly, for text
 * @param fromSize - The font size of the text it starts as, when that differs from
 * its box's height: the word then grows or shrinks to exactly that size
 * @param over - Whether it flies in from outside the drawer, whose scrolling box
 * would cut it off: a copy above everything makes the trip instead, to where the
 * element rests once the drawer has slid in
 * @param fromColor - The colour of the text it starts as, for a copy
 * @returns The flight, or null when nothing moves
 */
function fly(element: Element | null, from: DOMRect | undefined, uniform = true, fromSize = 0, over = false, fromColor = ""): Animation | null {
  if (!element || !from?.width || reducedMotion()) {
    return null;
  }

  let to = element.getBoundingClientRect();

  if (!to.width || !to.height) {
    return null;
  }

  let mover = element;

  if (over) {
    // The drawer is only starting to slide in: where it will be is where it is,
    // less the slide still to come.
    const slide = new DOMMatrix(getComputedStyle(drawer).transform);
    const style = getComputedStyle(element);
    const copy = element.cloneNode(true) as HTMLElement;

    to = new DOMRect(to.left - slide.m41, to.top - slide.m42, to.width, to.height);
    copy.removeAttribute("id");
    copy.setAttribute("aria-hidden", "true");
    Object.assign(copy.style, {
      position: "fixed",
      left: `${to.left}px`,
      top: `${to.top}px`,
      width: `${to.width}px`,
      height: `${to.height}px`,
      margin: "0",
      zIndex: "80",
      pointerEvents: "none",
      font: style.font,
      color: style.color,
      letterSpacing: style.letterSpacing,
      whiteSpace: "nowrap",
      direction: style.direction,
    });
    document.body.append(copy);
    // Not hidden: the copy's masks are still the original's, which must keep drawing.
    (element as HTMLElement).style.opacity = "0";
    mover = copy;
  }

  const size = fromSize && Number.parseFloat(getComputedStyle(element).fontSize);
  const sy = size ? fromSize / size : from.height / to.height;
  const sx = size || uniform ? sy : from.width / to.width;
  // Text scaled by its font size lines up on the middle of its line, and on the
  // side it starts from.
  const dy = size ? from.top + from.height / 2 - to.top - to.height * sy / 2 : from.top - to.top;
  const dx = size && root.dir === "rtl" ? from.right - to.left - to.width * sx : from.left - to.left;

  // Text flying in from the page starts in the page's colour, muted for a label.
  const tint = over && fromColor ? [{ color: fromColor }, { color: getComputedStyle(element).color }] : [{}, {}];
  const flight = mover.animate(
    [
      { transformOrigin: "0 0", transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, ...tint[0] },
      { transformOrigin: "0 0", transform: "none", ...tint[1] },
    ],
    { duration: 340, easing: "cubic-bezier(.2,0,0,1)" },
  );

  if (mover !== element) {
    const land = () => {
      (element as HTMLElement).style.removeProperty("opacity");
      mover.remove();
    };

    flight.finished.then(land, land);
  }

  return flight;
}

const pageLogo = () => document.querySelector(".bar .logo svg");
// A section's name on the page: its link, not its heading, which runs the list's height.
const pageLabel = (list: List) => document.querySelector(list === "writing" ? "#writing > a" : "#work > a");
const drawerLogo = () => drawer.querySelector(".dr-mark svg");
const drawerTitle = (list: List) => drawer.querySelector(`.dr-title [data-show="${list}"]`);
const drawerTab = (list: List) => drawer.querySelector(`.dr-tabs [data-show="${list}"]`);
const fontSize = (element: Element | null) => element ? Number.parseFloat(getComputedStyle(element).fontSize) : 0;

let swapping = 0;

/**
 * Shows a list, switches to the other one, or closes the drawer. The address is
 * left to the caller.
 *
 * @param list - The list to show, or "" to close
 */
function show(list: List) {
  const was = current();

  if (was === list) {
    return;
  }

  if (list) {
    prepare(list);
    sheets.get(list)?.opened();
  }

  // Where things are before the change, for the flights.
  const from = was === ""
    ? { logo: pageLogo()?.getBoundingClientRect(), label: pageLabel(list)?.getBoundingClientRect() }
    : { logo: drawerLogo()?.getBoundingClientRect(), label: drawerTitle(was)?.getBoundingClientRect() };
  const swap = was === "" ? null : { title: drawerTitle(was), tab: drawerTab(was) };
  const swapFrom = swap && {
    title: swap.title?.getBoundingClientRect(),
    titleSize: fontSize(swap.title),
    tab: swap.tab?.getBoundingClientRect(),
    tabSize: fontSize(swap.tab),
  };

  closeMenus();

  // Switching lists, the section names on the page behind fade rather than blink.
  // Opening or closing, the name on the page flies instead: it shows or hides at once.
  window.clearTimeout(swapping);

  if (list && was) {
    root.dataset.swap = "";
    swapping = window.setTimeout(() => delete root.dataset.swap, 600);
  }
  else {
    delete root.dataset.swap;
  }

  if (list) {
    drawer.dataset.list = list;
    root.dataset.open = list;
  }
  else {
    delete root.dataset.open;
  }

  drawer.inert = !list;
  behind(!!list);
  document.title = titleFor(list);

  if (list) {
    // Unless the list is scrolled down, out of sight of its header.
    if (was === "" && !drawer.querySelector(".dr-scroll")?.scrollTop) {
      fly(drawerLogo(), from.logo, false, 0, true);
      const label = pageLabel(list);

      fly(drawerTitle(list), from.label, true, fontSize(label), true, label ? getComputedStyle(label).color : "");
    }
    else if (swapFrom) {
      // Switching lists, the two names trade places: the tab pressed grows into the
      // title, and the old title shrinks into the tab.
      fly(drawerTitle(list), swapFrom.tab, true, swapFrom.tabSize);
      fly(drawerTab(list), swapFrom.title, true, swapFrom.titleSize);
    }

    // Focus goes into the list, also when switching lists. Picked from the command menu,
    // still folding away: until it closes, nothing outside it takes focus, and closing
    // hands focus back to what had it before.
    const menu = document.querySelector<HTMLDialogElement>("dialog.ck[open]");

    if (menu) {
      menu.addEventListener("close", () => {
        if (current() === list) {
          focusList(list);
        }
      }, { once: true });
    }
    else {
      focusList(list);
    }
  }
  else {
    const flights = [fly(pageLogo(), from.logo, false), fly(pageLabel(was), from.label, true, fontSize(drawerTitle(was)))];
    // What flies back to the page is no longer in the drawer sliding away.
    const left = [drawerLogo(), drawerTitle(was)] as (HTMLElement | null)[];

    if (flights.some(Boolean)) {
      left.forEach(element => element?.style.setProperty("opacity", "0"));
      Promise.allSettled(flights.map(flight => flight?.finished)).then(() => left.forEach(element => element?.style.removeProperty("opacity")));
    }
    (opener ?? document.querySelector<HTMLElement>(`.page [data-drawer="${was}"]`))?.focus({ preventScroll: true });
    opener = null;
  }
}

function open(list: List, from: HTMLElement | null) {
  if (current() === "") {
    // Opened by a key, or from the command menu, focus goes back where it was: on
    // nothing in particular, the page itself, rather than to a link of the page's.
    opener = from ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    show(list);
    history.pushState({ drawer: true }, "", addressFor(list));
  }
  else {
    show(list);
    history.replaceState(history.state, "", addressFor(list));
  }

  syncLanguageLinks();
}

/** Closes the drawer. */
export function close() {
  // Opened here: going back is closing. Arrived with it open: the page takes its place.
  if ((history.state as { drawer?: boolean } | null)?.drawer) {
    history.back();
  }
  else {
    show("");
    history.replaceState(history.state, "", addressFor(""));
    syncLanguageLinks();
  }
}

/** Brings the drawer in line with the address, as Back and Forward change it. */
export function sync() {
  const search = new URLSearchParams(location.search);
  const asked = search.get("list") ?? "";
  // Only the two lists: not whatever else an object answers to, like ?list=toString.
  const list = Object.hasOwn(LIST_OF, asked) ? LIST_OF[asked]! : "";

  if (list) {
    sheets.get(list)?.restore(search);
  }

  show(list);
  syncLanguageLinks();
}

window.addEventListener("popstate", sync);

/**
 * Follows a link to a list ("All projects", a tab, a chip of a project's stack): opens
 * the list here, a chip's filtered by it.
 *
 * @param link - The link
 */
export function follow(link: HTMLAnchorElement) {
  const list = link.dataset.drawer as Name;

  if (link.dataset.filter !== undefined) {
    sheets.get(list)?.restore(new URL(link.href).searchParams);
  }

  // From the command menu, closing the list hands focus back to what had it before the
  // menu opened, which the menu marks (palette.ts, lazy.ts).
  open(list, link.closest(".ck") ? document.querySelector<HTMLElement>("[data-menu-from]") : link);
}

/**
 * The P and W shortcuts: a list opens, or closes when it is the one showing.
 *
 * @param list - The list, or "" to close whichever is open
 */
export function toggle(list: List) {
  if (!list || list === current()) {
    if (current()) {
      close();
    }
  }
  else {
    open(list, null);
  }
}

// Once the list is scrolled, it fades out under the search and filters at the top;
// while more of it waits below, it fades out at the bottom too.
const scroller = drawer.querySelector<HTMLElement>(".dr-scroll");

function markScroll() {
  const top = scroller?.scrollTop ?? 0;
  const below = scroller ? scroller.scrollHeight - scroller.clientHeight - top : 0;

  drawer.toggleAttribute("data-scrolled", top > 4);
  drawer.toggleAttribute("data-more", below > 4);
}

scroller?.addEventListener("scroll", markScroll, { passive: true });

// The list's length changes as it is searched, filtered, switched or put in.
if (scroller) {
  const resized = new ResizeObserver(markScroll);

  resized.observe(scroller);
  [...scroller.children].forEach(child => resized.observe(child));
}

markScroll();

// Escape closes the filter menu first, then the drawer.
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !current() || document.querySelector(".ck[open]")) {
    return;
  }

  event.preventDefault();

  if (!closeMenus()) {
    close();
  }
});

// A page opened with ?list=…: its head already showed the drawer; fill in its
// search and filters from the address, without animating anything. Focus goes into
// it, as it does when the drawer opens on the page: not for the sheet that slides in
// ahead of this code (lazy.ts), which is opened anew in a moment.
const initial = current();

if (initial) {
  const address = new URLSearchParams(location.search);

  sheets.get(initial)?.restore(address);
  drawer.dataset.list = initial;
  drawer.inert = false;
  behind(true);
  document.title = titleFor(initial);
  prepare(initial);

  if (address.has("list")) {
    sheets.get(initial)?.opened();
    focusList(initial);
  }
}
