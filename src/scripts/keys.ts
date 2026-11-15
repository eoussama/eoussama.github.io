import { track } from "./analytics";
import { closeNote, foldOnDismiss, openNote } from "./note";



/*
 * Keyboard shortcuts, one key each: T switches between light and dark, P and W open
 * (or close) the projects and writing lists, S searches the list that is open, H goes
 * home, C starts an email and ? lists them all. They stay out of the way while typing, and while a dialog is open.
 * With a keyboard in another script, the keys in the same places do the same.
 *
 * They can be turned off from the command menu, and stay off on every page after: a
 * single key is easy to set off by accident, with speech input for one. ⌘K or Ctrl K
 * still opens the menu, where they can be turned back on.
 */

const keys = document.querySelector<HTMLDialogElement>("#keys");
const root = document.documentElement;
const KEY = "shortcuts";

/** What was chosen on this page, for where storage cannot hold it (private windows, blocked cookies). */
let chosenOff = false;

/**
 * Whether the single-key shortcuts are on: they are, unless turned off.
 *
 * @returns Whether they are on
 */
export function shortcutsOn(): boolean {
  try {
    return localStorage.getItem(KEY) !== "off";
  }
  catch {
    return !chosenOff;
  }
}

/**
 * Turns the single-key shortcuts on or off, for this visit and the next.
 *
 * @param on - Whether they are on
 */
export function setShortcuts(on: boolean) {
  chosenOff = !on;

  try {
    if (on) {
      localStorage.removeItem(KEY);
    }
    else {
      localStorage.setItem(KEY, "off");
    }
  }
  catch {}

  paint();
}

/**
 * Shows whether the shortcuts are on: on the page (the menu hides the keys it shows for
 * them while they are off), and in the shortcuts dialog, with its switch.
 */
function paint() {
  const on = shortcutsOn();
  const button = keys?.querySelector<HTMLButtonElement>("[data-keys-toggle]");
  const status = keys?.querySelector<HTMLElement>("[data-keys-status]");

  root.dataset.shortcuts = on ? "on" : "off";
  keys?.toggleAttribute("data-off", !on);

  if (button && status) {
    button.textContent = (on ? button.dataset.off : button.dataset.on) ?? "";
    status.textContent = (on ? button.dataset.isOn : button.dataset.isOff) ?? "";
  }
}

/** Where each shortcut's key sits, for keyboards that type other letters there. */
const BY_CODE: Record<string, string> = { KeyT: "t", KeyP: "p", KeyW: "w", KeyS: "s", KeyH: "h", KeyC: "c" };

/** Opens the list of shortcuts, in place of the command menu if that is open. */
export function openKeys() {
  if (!keys || (keys.open && !keys.classList.contains("is-closing"))) {
    return;
  }

  const palette = document.querySelector<HTMLDialogElement>("#palette");

  if (palette) {
    closeNote(palette, true);
  }

  openNote(keys);
  // The box itself takes focus: Escape and Tab work, with no ring around the close button.
  keys.querySelector<HTMLElement>(".kd-box")?.focus();
}

/**
 * Opens or closes a list in the drawer.
 *
 * @param list - "work", "writing", or "" to close it
 */
function drawer(list: string) {
  document.dispatchEvent(new CustomEvent("drawer:toggle", { detail: list }));
}

/**
 * Whether keys pressed there are typing.
 *
 * @param target - Where the key was pressed
 * @returns Whether it is a field
 */
function typing(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || target.matches("input, textarea, select"));
}

paint();
// Turned off or on in another tab.
addEventListener("storage", (event) => {
  if (event.key === KEY || event.key === null) {
    paint();
  }
});

if (keys) {
  keys.querySelector("[data-keys-toggle]")?.addEventListener("click", () => setShortcuts(!shortcutsOn()));
  keys.querySelector("[data-keys-close]")?.addEventListener("click", () => closeNote(keys));
  // Escape, or a click on the veil around the note, folds it away.
  foldOnDismiss(keys);
}

document.addEventListener("keydown", (event) => {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.isComposing || event.repeat || typing(event.target) || !shortcutsOn()) {
    return;
  }

  if (event.key === "?") {
    event.preventDefault();

    if (keys?.open && !keys.classList.contains("is-closing")) {
      closeNote(keys);
    }
    else {
      openKeys();
    }

    return;
  }

  // A note folding away is as good as closed.
  if (document.querySelector("dialog[open]:not(.is-closing)")) {
    return;
  }

  const key = /^[a-z]$/i.test(event.key) ? event.key.toLowerCase() : BY_CODE[event.code];

  if (key === "t") {
    const theme = root.dataset.mode === "dark" ? "light" : "dark";

    document.querySelector<HTMLButtonElement>(`.bar [data-theme-pick="${theme}"]`)?.click();
  }
  else if (key === "p" || key === "w") {
    drawer(key === "p" ? "work" : "writing");
  }
  else if (key === "s" && root.dataset.open) {
    // A list is open: its search takes focus, the cursor after what is already typed
    // (already there, the key just types).
    const search = document.querySelector<HTMLInputElement>(`#drawer [data-sheet="${root.dataset.open}"] .dr-q`);

    if (!search) {
      return;
    }

    search.focus();
    search.setSelectionRange(search.value.length, search.value.length);
  }
  else if (key === "h") {
    const home = document.querySelector<HTMLAnchorElement>(".bar .logo");

    if (!home) {
      return;
    }

    // Already home: put away the list, if one is open, and go back to the top.
    if (new URL(home.href).pathname === location.pathname) {
      if (root.dataset.open) {
        drawer("");
      }

      window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
    else {
      location.href = home.href;
    }
  }
  else if (key === "c" && keys?.dataset.mail) {
    track("email_write", { method: "key" });
    location.href = keys.dataset.mail;
  }
  else {
    return;
  }

  event.preventDefault();
});
