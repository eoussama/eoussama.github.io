import { closeNote, foldOnDismiss, openNote } from "./note";



/*
 * Keyboard shortcuts, one key each: T switches between light and dark, P and W open
 * (or close) the projects and writing lists, H goes home, C starts an email and ?
 * lists them all. They stay out of the way while typing, and while a dialog is open.
 * With a keyboard in another script, the keys in the same places do the same.
 */

const keys = document.querySelector<HTMLDialogElement>("#keys");
const root = document.documentElement;

/** Where each shortcut's key sits, for keyboards that type other letters there. */
const BY_CODE: Record<string, string> = { KeyT: "t", KeyP: "p", KeyW: "w", KeyH: "h", KeyC: "c" };

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

if (keys) {
  keys.querySelector("[data-keys-close]")?.addEventListener("click", () => closeNote(keys));
  // Escape, or a click on the veil around the note, folds it away.
  foldOnDismiss(keys);
}

document.addEventListener("keydown", (event) => {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.isComposing || event.repeat || typing(event.target)) {
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
    location.href = keys.dataset.mail;
  }
  else {
    return;
  }

  event.preventDefault();
});
