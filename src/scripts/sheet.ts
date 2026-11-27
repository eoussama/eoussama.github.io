import type { Parts } from "./lists";



/*
 * A list's search and filters: a field that narrows the list as it is typed, a menu of
 * filters with a badge for how many are picked, and a chip for each pick that takes it
 * off. The list drawer has one for each list (drawer.ts), and so does each list's own
 * page (list-page.ts), where the list is already in place.
 *
 * Each is made from a sheet's element: its search (.dr-q in .dr-search), its chips
 * (.dr-active, with a way to clear them all), and what it says when nothing is left
 * (.dr-empty). The list and its filters come later, through fill().
 */

export type Sheet = {
  /** Every address parameter the list uses. */
  keys: string[];
  /** The address parameters for what is searched and picked. */
  params: () => [string, string][];
  /** Takes the search and the picks from the address. */
  restore: (search: URLSearchParams) => void;
  /** Closes the filter menu; says whether it was open. */
  closeMenu: () => boolean;
  /** Puts the list and its filters in, once they are here. */
  fill: (parts: Parts) => void;
  /** Says the list didn't come, with a way to ask again. */
  fail: () => void;
  /** Says, as the list opens, that it is still on its way, or that it didn't come. */
  opened: () => void;
};

export type Host = {
  /**
   * The words it puts together: noneQ and noneF (nothing left, by a search or by the
   * filters), shownOf ("{shown} of {all}"), remove and keySep (a chip's label).
   */
  words: DOMStringMap;
  /** Says something to screen readers, now or after a moment. */
  say: (text: string, after?: number) => void;
  /** Writes what is searched and picked into the address. */
  save: () => void;
  /** Whether the list is in sight, so that what changes is said. */
  showing: () => boolean;
  /** Asks for the list again, after it didn't come. */
  retry?: () => void;
};

// Searched without accents, hamzas or case, as the command menu is (palette.ts).
const fold = (text: string) => text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();

/**
 * Makes a sheet's search and filters work.
 *
 * @param element - The sheet
 * @param host - What it needs from the page around it
 * @returns The sheet
 */
export function makeSheet(element: HTMLElement, host: Host): Sheet {
  const input = element.querySelector<HTMLInputElement>(".dr-q")!;
  const search = element.querySelector<HTMLElement>(".dr-search")!;
  const chips = element.querySelector<HTMLElement>(".dr-active")!;
  const clearAll = chips.querySelector<HTMLElement>("[data-clear]")!;
  const empty = element.querySelector<HTMLElement>(".dr-empty")!;
  const wait = element.querySelector<HTMLElement>("[data-dr-wait]");
  const waitWords = wait?.querySelector("span");
  const waitText = waitWords?.textContent ?? "";
  const retry = wait?.querySelector<HTMLButtonElement>("[data-dr-retry]");
  const { words, say } = host;
  // The parameters its filters can take, known before the filters are here.
  const groups = (element.dataset.keys ?? "").split(" ").filter(Boolean);

  // All of these come with the list.
  let filled = false;
  let items: HTMLElement[] = [];
  let keywords = new Map<HTMLElement, string>();
  let facetsOf = new Map<HTMLElement, Record<string, string | string[]>>();
  let options: HTMLButtonElement[] = [];
  let button: HTMLButtonElement | null = null;
  let badge: HTMLElement | null = null;
  let menu: HTMLElement | null = null;
  /** How many the list holds, in words ("39 projects"), as its page says it. */
  let count = "";
  const picked = new Set<HTMLButtonElement>();
  /** The picks the address asked for while there was nothing yet to pick. */
  let asked: [string, string][] = [];

  const groupOf = (option: HTMLElement) => option.closest<HTMLElement>(".dr-fg")!;

  /**
   * Shows the items that match the search and every group's picks, then redraws the
   * chips, and says how many are left.
   *
   * @param tell - When to say it: now, once the typing pauses, or not at all (a list
   * put in while another is open)
   */
  const update = (tell: "now" | "later" | "no" = "now") => {
    if (!filled) {
      return;
    }

    const query = fold(input.value.trim());
    const wanted = new Map<string, Set<string>>();

    picked.forEach((option) => {
      const group = groupOf(option).dataset.group!;

      wanted.set(group, (wanted.get(group) ?? new Set()).add(option.dataset.value!));
    });

    let shown = 0;

    items.forEach((item) => {
      // A facet holds one value (a year) or several (tags); an item matches a group when any of its values is picked.
      const facets = facetsOf.get(item)!;
      const matches = (!query || keywords.get(item)!.includes(query))
        && [...wanted].every(([group, values]) => [facets[group] ?? ""].flat().some(value => values.has(value)));

      item.hidden = !matches;

      // The entrance staggers what shows, in order, however far down the full list it sits.
      if (matches) {
        item.style.setProperty("--i", String(shown));
      }

      shown += matches ? 1 : 0;
    });

    options.forEach(option => option.setAttribute("aria-pressed", String(picked.has(option))));

    chips.querySelectorAll(".dr-on").forEach(chip => chip.remove());
    picked.forEach((option) => {
      const groupLabel = groupOf(option).dataset.groupLabel ?? "";
      const chip = document.createElement("button");
      const key = document.createElement("span");

      chip.type = "button";
      chip.className = "dr-on";
      chip.setAttribute("aria-label", `${words.remove ?? ""}${groupLabel}${words.keySep ?? ": "}${option.dataset.label}`);
      key.className = "dr-on-k";
      key.textContent = groupLabel;
      chip.append(key, option.dataset.label ?? "");
      chip.insertAdjacentHTML("beforeend", "<svg width=\"10\" height=\"10\" viewBox=\"0 0 10 10\" aria-hidden=\"true\"><path d=\"M2 2l6 6M8 2L2 8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\"></path></svg>");
      chip.addEventListener("click", () => {
        // The chips are drawn anew, this one gone: focus on it moves to the next one,
        // or to clearing them all, or to the search.
        const at = chip.contains(document.activeElement) ? [...chips.querySelectorAll(".dr-on")].indexOf(chip) : -1;

        picked.delete(option);
        update();
        host.save();

        if (at >= 0) {
          const next = chips.querySelectorAll<HTMLElement>(".dr-on")[at] ?? (clearAll.hidden ? input : clearAll);

          next.focus();
        }
      });
      clearAll.before(chip);
    });

    chips.hidden = picked.size === 0;
    clearAll.hidden = picked.size < 2;

    if (badge && button) {
      badge.hidden = picked.size === 0;
      badge.textContent = String(picked.size);
      button.setAttribute("aria-label", picked.size ? `${button.dataset.label} (${picked.size})` : button.dataset.label ?? "");
    }

    empty.hidden = shown > 0;
    // Put in as it was typed: a "$&" in the search is not a replacement pattern.
    const none = shown > 0 ? "" : (query ? (words.noneQ ?? "").replace("%", () => input.value.trim()) : words.noneF ?? "");

    empty.querySelector("span")!.textContent = none;

    // How many are left, out of how many ("22 of 39"); the whole list, by its count.
    const told = shown === 0
      ? none
      : query || picked.size ? (words.shownOf ?? "").replace("{shown}", String(shown)).replace("{all}", String(items.length)) : count;

    if (tell !== "no") {
      say(told, tell === "later" ? 500 : 0);
    }
  };

  const setMenu = (opened: boolean) => {
    menu?.setAttribute("data-open", String(opened));
    button?.setAttribute("aria-expanded", String(opened));
  };

  /** Picks the options the address asked for. */
  const pickAsked = () => {
    picked.clear();
    options.forEach((option) => {
      if (asked.some(([group, value]) => group === groupOf(option).dataset.group && value === option.dataset.value)) {
        picked.add(option);
      }
    });
  };

  const sheet: Sheet = {
    keys: ["q", ...groups],
    params: () => {
      const params: [string, string][] = [];
      const query = input.value.trim();

      if (query) {
        params.push(["q", query]);
      }

      // Until the filters are here, what the address asked of them stays in it.
      if (!filled) {
        return [...params, ...asked];
      }

      picked.forEach(option => params.push([groupOf(option).dataset.group!, option.dataset.value!]));

      return params;
    },
    restore: (address) => {
      input.value = address.get("q") ?? "";
      asked = groups.flatMap(group => address.getAll(group).map((value): [string, string] => [group, value]));
      pickAsked();
      update();
    },
    closeMenu: () => {
      const wasOpen = menu?.dataset.open === "true";
      // Focus in the menu would be lost with it: it goes back to the menu's button.
      const inside = !!menu?.contains(document.activeElement);

      setMenu(false);

      if (inside) {
        button?.focus();
      }

      return wasOpen;
    },
    fill: (parts) => {
      if (filled) {
        return;
      }

      // A list already on the page is used where it is. One fetched is copied: what was
      // fetched stays as it came, for the command menu to read too.
      const inPlace = parts.items.isConnected;
      const ul = inPlace ? parts.items : parts.items.cloneNode(true) as HTMLUListElement;
      const filters = parts.filters.cloneNode(true) as DocumentFragment;
      // Focus on the way to ask again would go with it: it moves to the search.
      const refocus = !!wait?.contains(document.activeElement);

      filled = true;
      button = filters.querySelector<HTMLButtonElement>(".dr-fbtn");
      badge = button?.querySelector<HTMLElement>(".dr-badge") ?? null;
      menu = filters.querySelector<HTMLElement>(".dr-fpop");
      items = [...ul.querySelectorAll<HTMLElement>(":scope > li")];
      keywords = new Map(items.map(item => [item, fold(item.dataset.kw ?? "")]));
      facetsOf = new Map(items.map(item => [item, JSON.parse(item.dataset.facets ?? "{}") as Record<string, string | string[]>]));
      options = [...filters.querySelectorAll<HTMLButtonElement>(".dr-fo")];
      count = ul.dataset.count ?? "";

      if (button) {
        search.append(button);
      }

      if (menu) {
        chips.before(menu);
      }

      if (!inPlace) {
        (wait ?? empty).after(ul);
      }

      wait?.remove();
      element.removeAttribute("aria-busy");

      button?.addEventListener("click", (event) => {
        event.stopPropagation();
        setMenu(menu?.dataset.open !== "true");
      });

      options.forEach((option) => {
        option.addEventListener("click", () => {
          if (picked.has(option)) {
            picked.delete(option);
          }
          else {
            picked.add(option);
          }

          update();
          host.save();
        });
      });

      pickAsked();
      asked = [];
      // Here while it is in sight: how many it holds, or how many of them the address left.
      update(host.showing() ? "now" : "no");

      if (refocus) {
        input.focus({ preventScroll: true });
      }
    },
    fail: () => {
      if (filled || !waitWords || !retry) {
        return;
      }

      waitWords.textContent = wait?.dataset.failed ?? "";
      retry.hidden = false;
      wait?.setAttribute("data-failed-now", "");
      element.removeAttribute("aria-busy");

      if (host.showing()) {
        say(waitWords.textContent);
      }
    },
    opened: () => {
      // A moment after the sheet comes in reach, for it to be read: what was said in it
      // while out of reach isn't. A list here already says nothing.
      if (!filled && waitWords) {
        say(waitWords.textContent ?? "", 150);
      }
    },
  };

  retry?.addEventListener("click", () => {
    // The button goes while the list is asked for again: focus waits in the search.
    input.focus();
    waitWords!.textContent = waitText;
    retry.hidden = true;
    wait?.removeAttribute("data-failed-now");
    element.setAttribute("aria-busy", "true");
    say(waitText);
    host.retry?.();
  });

  input.addEventListener("input", () => {
    update("later");
    host.save();
  });

  element.querySelectorAll("[data-clear]").forEach((clear) => {
    clear.addEventListener("click", () => {
      picked.clear();
      asked = [];
      input.value = "";
      update();
      host.save();
      input.focus();
    });
  });

  // A click anywhere outside the filter menu closes it.
  document.addEventListener("click", (event) => {
    if (menu?.dataset.open === "true" && !menu.contains(event.target as Node)) {
      setMenu(false);
    }
  });

  return sheet;
}
