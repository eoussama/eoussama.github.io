import { copyEmail } from "./copy";



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
    const query = input.value.trim().toLowerCase();

    items.forEach((item) => {
      item.hidden = !!query && !(item.dataset.kw ?? "").includes(query);
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
    if (dialog.open) {
      return;
    }

    input.value = "";
    markTheme();
    filter();
    dialog.showModal();
    input.focus();
  };

  const close = () => dialog.close();

  /**
   * Does what an item says: follows its link, or runs its action.
   *
   * @param item - The item chosen
   */
  const run = (item: HTMLElement) => {
    const action = item.dataset.action;

    close();

    if (!action) {
      return;
    }

    if (action === "theme") {
      document.querySelector<HTMLButtonElement>(`.bar [data-theme-pick="${item.dataset.value}"]`)?.click();
    }
    else if (action === "copy") {
      copyEmail();
    }
    else if (action === "hello") {
      document.querySelector<HTMLButtonElement>("[data-hellos]")?.click();
    }
  };

  input.addEventListener("input", filter);

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

  // A click on the shaded page around the box closes it.
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      close();
    }
  });

  dialog.querySelector("[data-palette-close]")?.addEventListener("click", close);

  document.querySelectorAll("[data-palette-open]").forEach((button) => {
    button.addEventListener("click", open);
  });

  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();

      if (dialog.open) {
        close();
      }
      else {
        open();
      }
    }
  });
}
