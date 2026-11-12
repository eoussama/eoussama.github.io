import { askConsent } from "./analytics";
import { copyEmail } from "./copy";
import { openKeys } from "./keys";
import { lakamaRain } from "./lakama";
import { closeNote, foldOnDismiss, openNote } from "./note";



/*
 * The command menu: ⌘K or Ctrl K (or the search button) opens it, typing filters it,
 * the arrow keys move through what is left and Enter runs it. It is a native modal
 * dialog, so focus stays inside and Escape closes it.
 */

const dialog = document.querySelector<HTMLDialogElement>("#palette");

if (dialog) {
  const input = dialog.querySelector<HTMLInputElement>(".ck-q")!;
  const list = dialog.querySelector<HTMLElement>(".ck-list")!;
  const empty = dialog.querySelector<HTMLElement>(".ck-empty")!;
  const items = [...dialog.querySelectorAll<HTMLElement>(".ck-item")];
  const groups = [...dialog.querySelectorAll<HTMLElement>(".ck-group")];
  let active: HTMLElement | null = null;

  const visible = () => items.filter(item => !item.hidden);

  /*
   * Searched without accents, hamzas or case, so "francais" finds Français and
   * "انجليزية" finds الإنجليزية.
   */
  const fold = (text: string) => text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
  const keywords = new Map(items.map(item => [item, fold(item.dataset.kw ?? "")]));

  /**
   * Marks one item as the one Enter runs, and keeps it in view.
   *
   * @param item - The item, or null for none
   * @param scroll - Whether to scroll it into view
   */
  const select = (item: HTMLElement | null, scroll = false) => {
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
  };

  /** Shows only the items that match what is typed, and their group headings. */
  const filter = () => {
    const query = fold(input.value.trim());

    items.forEach((item) => {
      item.hidden = !!query && !keywords.get(item)!.includes(query);
    });
    groups.forEach((group) => {
      group.hidden = !group.querySelector(".ck-item:not([hidden])");
    });

    const none = visible().length === 0;

    empty.hidden = !none;
    empty.textContent = none ? (dialog.dataset.none ?? "").replace("%", input.value.trim()) : "";
    select(visible()[0] ?? null);
    list.scrollTop = 0;
  };

  /** Shows which theme is the current one, next to it in the list. */
  const markTheme = () => {
    dialog.querySelectorAll<HTMLElement>("[data-theme-hint]").forEach((hint) => {
      hint.textContent = hint.dataset.themeHint === document.documentElement.dataset.theme ? (dialog.dataset.current ?? "") : "";
    });
  };

  const open = () => {
    if (dialog.open && !dialog.classList.contains("is-closing")) {
      return;
    }

    const keys = document.querySelector<HTMLDialogElement>("#keys");

    if (keys) {
      closeNote(keys, true);
    }

    input.value = "";
    markTheme();
    filter();
    openNote(dialog);
    input.focus();
  };

  const close = (instant = false) => closeNote(dialog, instant);

  /**
   * Does what an item says: follows its link, or runs its action.
   *
   * @param item - The item chosen
   * @returns Once the action has run
   */
  const run = async (item: HTMLElement) => {
    const action = item.dataset.action;
    // Leaving for another page: the note goes at once, out of the way of the page's
    // own transition. Otherwise it folds away first, then the action runs.
    const leaving = item instanceof HTMLAnchorElement && !item.dataset.drawer && item.target !== "_blank";

    if (!action) {
      close(leaving);

      return;
    }

    await close();

    if (action === "theme") {
      document.querySelector<HTMLButtonElement>(`.bar [data-theme-pick="${item.dataset.value}"]`)?.click();
    }
    else if (action === "copy") {
      copyEmail();
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
  };

  let typed = "";

  input.addEventListener("input", () => {
    const word = input.value.trim().toLowerCase();

    // A secret, only answered when the whole word is typed.
    if (word === "lakama" && typed !== "lakama") {
      lakamaRain();
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

  items.forEach((item) => {
    item.addEventListener("mousemove", () => {
      if (active !== item) {
        select(item);
      }
    });
    item.addEventListener("click", () => run(item));
  });

  // Escape, or a click on the veil around the note, folds it away.
  foldOnDismiss(dialog);

  dialog.querySelector("[data-palette-close]")?.addEventListener("click", () => close());

  document.querySelectorAll("[data-palette-open]").forEach((button) => {
    button.addEventListener("click", open);
  });

  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();

      if (dialog.open && !dialog.classList.contains("is-closing")) {
        close();
      }
      else {
        open();
      }
    }
  });
}
