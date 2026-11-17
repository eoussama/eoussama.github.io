import type { List } from "./lists";

import { askConsent } from "./analytics";
import { copyEmail } from "./copy";
import { openKeys, setShortcuts, shortcutsOn } from "./keys";
import { loadItems } from "./lists";
import { closeNote, foldOnDismiss, openNote } from "./note";



/*
 * The command menu: ⌘K or Ctrl K (or the search button) opens it, typing filters it,
 * the arrow keys move through what is left and Enter runs it. It is a native modal
 * dialog, so focus stays inside and Escape closes it.
 *
 * Loaded the first time it is wanted (lazy.ts), which may be with the menu already
 * open and something typed: it takes over from there. The projects and posts come
 * from the lists' items, in files beside their pages (lists.ts), and join the menu as
 * they arrive.
 */

// Only ever loaded on a page that has it (lazy.ts).
const dialog = document.querySelector<HTMLDialogElement>("#palette")!;
const input = dialog.querySelector<HTMLInputElement>(".ck-q")!;
const list = dialog.querySelector<HTMLElement>(".ck-list")!;
const empty = dialog.querySelector<HTMLElement>(".ck-empty")!;
const groups = [...dialog.querySelectorAll<HTMLElement>(".ck-group")];
let items: HTMLElement[] = [];
let active: HTMLElement | null = null;
/** Whether this opening has been set up here: one the page made before this code was in has not. */
let prepared = false;
/**
 * Where each list is: still to come (until it is in, nothing matching is no answer yet),
 * in the menu, or not come, the last time it was asked for.
 */
const lists = new Map<List, "coming" | "in" | "failed">([["work", "coming"], ["writing", "coming"]]);
/** The lists asked for and not answered yet. */
const asking = new Set<List>();

const visible = () => items.filter(item => !item.hidden);

/*
 * Searched without accents, hamzas or case, so "francais" finds Français and
 * "انجليزية" finds الإنجليزية.
 */
const fold = (text: string) => text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
const keywords = new Map<HTMLElement, string>();

/**
 * Marks one item as the one Enter runs, and keeps it in view.
 *
 * @param item - The item, or null for none
 * @param scroll - Whether to scroll it into view
 */
function select(item: HTMLElement | null, scroll = false) {
  active?.setAttribute("aria-selected", "false");
  active = item;

  if (!item) {
    input.removeAttribute("aria-activedescendant");

    return;
  }

  item.setAttribute("aria-selected", "true");
  input.setAttribute("aria-activedescendant", item.id);

  if (scroll) {
    item.scrollIntoView({ block: "nearest" });
  }
}

/**
 * Shows only the items that match what is typed, and their group headings.
 *
 * @param keep - Whether the item selected stays so, where it still shows, and where it
 * is on screen: as items join the menu, rather than as the visitor types
 */
function filter(keep = false) {
  const query = fold(input.value.trim());
  const held = keep && active ? { item: active, top: active.offsetTop - list.scrollTop } : null;

  items.forEach((item) => {
    item.hidden = !!query && !keywords.get(item)!.includes(query);
  });
  groups.forEach((group) => {
    group.hidden = !group.querySelector(".ck-item:not([hidden])");
  });

  // Nothing to show: the projects and posts may be on their way still, or not have come.
  const states = [...lists.values()];
  const none = visible().length === 0;
  const word = states.includes("coming") ? dialog.dataset.wait : states.includes("failed") ? dialog.dataset.failed : dialog.dataset.none;
  // Put in as it was typed: a "$&" in the search is not a replacement pattern. Empty, the
  // line takes no room; it stays in place so that what it says is read out.
  const says = none ? (word ?? "").replace("%", () => input.value.trim()) : "";

  if (empty.textContent !== says) {
    empty.textContent = says;
  }

  if (held && !held.item.hidden) {
    select(held.item);
    list.scrollTop = held.item.offsetTop - held.top;

    return;
  }

  select(visible()[0] ?? null);
  list.scrollTop = 0;
}

/**
 * Makes an item one of the menu's: found by its words, selected under the pointer, run
 * when chosen.
 *
 * @param item - The item
 */
function adopt(item: HTMLElement) {
  keywords.set(item, fold(item.dataset.kw ?? ""));
  item.addEventListener("mousemove", () => {
    if (active !== item) {
      select(item);
    }
  });
  item.addEventListener("click", () => run(item));
}

/**
 * An item for a project or post, made from its entry in the list: its name, kind or
 * date, and the words the list finds it by.
 *
 * @param entry - The list's entry
 * @param group - The group's name, which it is found by too
 * @param id - Its id, unique in the page
 * @returns The item
 */
function itemFor(entry: Element, group: string, id: string): HTMLAnchorElement {
  const link = entry.querySelector<HTMLAnchorElement>(".dr-name")!;
  const hint = entry.querySelector(".dr-kind")?.textContent ?? "";
  const item = document.createElement("a");
  const icon = document.createElement("i");
  const label = document.createElement("span");
  const words = document.createElement("span");
  const kind = document.createElement("span");

  item.className = "ck-item";
  item.id = id;
  item.href = link.getAttribute("href") ?? "";
  item.tabIndex = -1;
  item.setAttribute("role", "option");
  item.setAttribute("aria-selected", "false");
  item.dataset.kw = `${group} ${hint} ${(entry as HTMLElement).dataset.kw ?? ""} ${(entry as HTMLElement).dataset.ckKw ?? ""}`.toLowerCase();
  icon.className = `ck-ic ${entry.querySelector(".dot.z-cross") ? "z-cross" : "z-star"}`;
  label.className = "ck-l";
  // A project's name as the list sets it (with its organization); a post's title as
  // its words, in the direction they are written in.
  const name = link.querySelector(".hl");
  const title = name?.firstElementChild?.matches("span") ? name.firstElementChild : null;

  if (link.lang) {
    words.lang = link.lang;
  }

  if (title?.getAttribute("dir")) {
    words.dir = title.getAttribute("dir")!;
  }

  words.append(...[...(title ?? name)?.childNodes ?? []].map(node => node.cloneNode(true)));
  kind.className = "ck-hint";
  kind.textContent = hint;
  label.append(words);
  item.append(icon, label, kind);

  return item;
}

/**
 * Puts a list's projects or posts in their group, once, keeping what is typed, what is
 * selected and where focus is.
 *
 * @param name - The list
 * @param entries - Its items, as the list has them
 */
function addList(name: List, entries: HTMLUListElement) {
  const group = dialog.querySelector<HTMLElement>(`[data-ck-list="${name}"]`);

  lists.set(name, "in");

  if (group && !group.querySelector(".ck-item")) {
    const label = group.querySelector(".ck-h")?.textContent ?? "";

    [...entries.children].forEach((entry, i) => {
      const item = itemFor(entry, label, `ck-${name}-${i}`);

      group.append(item);
      adopt(item);
    });
    items = [...dialog.querySelectorAll<HTMLElement>(".ck-item")];
  }

  filter(true);
}

/**
 * Asks for the projects and posts not in the menu yet, unless they are on their way
 * already: as it opens, so one that didn't come is asked for again (and may be in
 * already, fetched by the list drawer meanwhile).
 */
function fetchLists() {
  (["work", "writing"] as const).forEach((name) => {
    if (lists.get(name) === "in" || asking.has(name)) {
      return;
    }

    asking.add(name);
    lists.set(name, "coming");
    loadItems(name).then((entries) => {
      asking.delete(name);
      addList(name, entries);
    }, () => {
      // Not there: the menu stops waiting for it, and says so when nothing matches.
      asking.delete(name);
      lists.set(name, "failed");
      filter(true);
    });
  });
}

/** Shows which theme is the current one, with a check mark beside it in the list. */
function markTheme() {
  dialog.querySelectorAll<HTMLElement>("[data-theme-check]").forEach((check) => {
    check.toggleAttribute("data-on", check.dataset.themeCheck === document.documentElement.dataset.theme);
  });
}

/** Words the shortcuts' switch for what choosing it does now: turn them off, or on. */
function markShortcuts() {
  dialog.querySelectorAll<HTMLElement>("[data-action='shortcuts']").forEach((item) => {
    const label = item.querySelector(".ck-l > span");

    if (label) {
      label.textContent = (shortcutsOn() ? item.dataset.off : item.dataset.on) ?? "";
    }
  });
}

// The hint in the search, shortened where the whole of it would be cut off: Chrome
// gives a field in focus no "…", and this one is in focus whenever the menu is open.
// Its name, read to screen readers, stays whole.
const hint = input.placeholder;
const ruler = document.createElement("canvas").getContext("2d");

function fitHint() {
  const style = getComputedStyle(input, "::placeholder");

  if (!ruler || !input.clientWidth) {
    return;
  }

  ruler.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  input.placeholder = ruler.measureText(hint).width <= input.clientWidth ? hint : input.dataset.short ?? hint;
}

addEventListener("resize", () => {
  if (dialog.open) {
    fitHint();
  }
});

const showing = () => dialog.open && !dialog.classList.contains("is-closing");

/**
 * Marks what has focus as the menu opens: a list opened from the menu hands focus back
 * there as it closes (drawer.ts), the page behind being out of reach while it is open.
 * The menu's first opening, before this code is in, is marked the same way (lazy.ts).
 */
function markOpener() {
  const from = document.activeElement;

  document.querySelector("[data-menu-from]")?.removeAttribute("data-menu-from");

  if (from instanceof HTMLElement && from !== document.body) {
    from.dataset.menuFrom = "";
  }
}

/**
 * Opens the menu, or sets up the one the page opened before this code was in: what was
 * typed there stays.
 */
export function open() {
  fetchLists();

  if (showing() && prepared) {
    return;
  }

  // Opened before this code was in, focus is in the menu already, and what had it is marked.
  if (!dialog.contains(document.activeElement)) {
    markOpener();
  }

  markShortcuts();

  const keys = document.querySelector<HTMLDialogElement>("#keys");

  if (keys) {
    closeNote(keys, true);
  }

  if (!showing()) {
    input.value = "";
  }

  prepared = true;
  markTheme();
  filter();
  openNote(dialog);
  fitHint();

  // Moved on meanwhile, to its close button say, focus is left where it went.
  if (!dialog.contains(document.activeElement)) {
    input.focus();
  }
}

const close = (instant = false) => closeNote(dialog, instant);

/** ⌘K or Ctrl K: opens the menu, or closes it. */
export function toggle() {
  if (showing()) {
    close();
  }
  else {
    open();
  }
}

/**
 * Does what an item says: follows its link, or runs its action.
 *
 * @param item - The item chosen
 * @returns Once the action has run
 */
async function run(item: HTMLElement) {
  const action = item.dataset.action;
  // Leaving for another page: the note goes at once, out of the way of the page's
  // own transition. Otherwise it folds away first, then the action runs.
  // The page's own language goes nowhere (site.ts): the note folds away as usual.
  const here = item.dataset.langLink === document.documentElement.dataset.lang;
  const leaving = item instanceof HTMLAnchorElement && !item.dataset.drawer && item.target !== "_blank" && !here;

  if (!action) {
    close(leaving);

    return;
  }

  await close();

  if (action === "theme") {
    document.querySelector<HTMLButtonElement>(`.bar [data-theme-pick="${item.dataset.value}"]`)?.click();
  }
  else if (action === "copy") {
    copyEmail("menu");
  }
  else if (action === "hello") {
    document.querySelector<HTMLButtonElement>("[data-hellos]")?.click();
  }
  else if (action === "consent") {
    askConsent();
  }
  else if (action === "keys") {
    openKeys();
  }
  else if (action === "shortcuts") {
    setShortcuts(!shortcutsOn());
  }
}

let typed = "";

input.addEventListener("input", () => {
  const word = input.value.trim().toLowerCase();

  // A secret, only answered when the whole word is typed; its pictures are fetched as
  // the word starts to take shape, so they are there by its last letter.
  if (word === "lakama" && typed !== "lakama") {
    import("./lakama").then(({ lakamaRain }) => lakamaRain(), () => {});
  }
  else if (word.length >= 3 && "lakama".startsWith(word)) {
    import("./lakama").catch(() => {});
  }

  typed = word;
  filter();
});

input.addEventListener("keydown", (event) => {
  const shown = visible();
  const at = active ? shown.indexOf(active) : -1;

  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();

    if (shown.length) {
      const step = event.key === "ArrowDown" ? 1 : -1;

      select(shown[(at + step + shown.length) % shown.length] ?? null, true);
    }
  }
  else if (event.key === "Enter" && active) {
    event.preventDefault();
    active.click();
  }
});

items = [...dialog.querySelectorAll<HTMLElement>(".ck-item")];
items.forEach(adopt);

// Escape, or a click on the veil around the note, folds it away.
foldOnDismiss(dialog);

// The next opening is set up afresh.
dialog.addEventListener("close", () => {
  prepared = false;
});

dialog.querySelector("[data-palette-close]")?.addEventListener("click", () => close());
