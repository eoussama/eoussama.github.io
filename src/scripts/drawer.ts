/*
 * The list drawer. "All projects" and "All posts" open it over whatever page is
 * showing, and the address holds its whole state, so a link brings it back as it was:
 *
 *   ?list=projects&q=type&language=TypeScript&type=library
 *
 * Opening adds an entry to the history, so Back closes it; searching and filtering
 * update the address in place. The logo and the section name fly into its header.
 */

type List = "" | "work" | "writing";

const PARAM: Record<Exclude<List, "">, string> = { work: "projects", writing: "posts" };
const LIST_OF: Record<string, List> = { projects: "work", posts: "writing" };

const drawer = document.querySelector<HTMLElement>("#drawer");

if (drawer) {
  const root = document.documentElement;
  const page = document.querySelector<HTMLElement>(".page")!;
  const pageTitle = document.title;
  const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  let opener: HTMLElement | null = null;

  const current = () => (root.dataset.open ?? "") as List;
  const titleFor = (list: List) => list ? `${drawer.dataset[list === "work" ? "titleWork" : "titleWriting"]} · ${pageTitle}` : pageTitle;

  /* ---------- Each list's search and filters ---------- */

  type Sheet = {
    /** Every address parameter the list uses. */
    keys: string[];
    /** The address parameters for what is searched and picked. */
    params: () => [string, string][];
    /** Takes the search and the picks from the address. */
    restore: (search: URLSearchParams) => void;
    /** Closes the filter menu; says whether it was open. */
    closeMenu: () => boolean;
  };

  const sheets = new Map<List, Sheet>();

  /**
   * The address for a list with its search and filters, keeping anything else the
   * page's address had.
   *
   * @param list - The list to show, or "" for none
   * @returns The address
   */
  const addressFor = (list: List): string => {
    const next = new URLSearchParams(location.search);

    next.delete("list");
    sheets.forEach(sheet => sheet.keys.forEach(key => next.delete(key)));

    if (list) {
      next.set("list", PARAM[list]);
      sheets.get(list)?.params().forEach(([key, value]) => next.append(key, value));
    }

    const query = next.toString();

    return `${location.pathname}${query ? `?${query}` : ""}${location.hash}`;
  };

  /** Points the language links at the same page, with the drawer as it is, elsewhere. */
  const syncLanguageLinks = () => {
    document.querySelectorAll<HTMLAnchorElement>("a[data-lang-link]").forEach((link) => {
      link.dataset.base ??= link.getAttribute("href") ?? "";
      link.href = link.dataset.base + location.search;
    });
  };

  /** Writes the open list's search and filters into the address, in place. */
  const saveState = () => {
    const list = current();

    if (list) {
      history.replaceState(history.state, "", addressFor(list));
      syncLanguageLinks();
    }
  };

  drawer.querySelectorAll<HTMLElement>(".dr-sheet").forEach((element) => {
    const list = element.dataset.sheet as List;
    const input = element.querySelector<HTMLInputElement>(".dr-q")!;
    const button = element.querySelector<HTMLButtonElement>(".dr-fbtn");
    const badge = element.querySelector<HTMLElement>(".dr-badge");
    const menu = element.querySelector<HTMLElement>(".dr-fpop");
    const chips = element.querySelector<HTMLElement>(".dr-active")!;
    const clearAll = chips.querySelector<HTMLElement>("[data-clear]")!;
    const empty = element.querySelector<HTMLElement>(".dr-empty")!;
    const items = [...element.querySelectorAll<HTMLElement>(".dr-list > li")];
    const options = [...element.querySelectorAll<HTMLButtonElement>(".dr-fo")];
    const groups = [...element.querySelectorAll<HTMLElement>(".dr-fg")].map(group => group.dataset.group!);
    const picked = new Set<HTMLButtonElement>();

    const groupOf = (option: HTMLElement) => option.closest<HTMLElement>(".dr-fg")!;

    /** Shows the items that match the search and every group's picks, then redraws the chips. */
    const update = () => {
      const query = input.value.trim().toLowerCase();
      const wanted = new Map<string, Set<string>>();

      picked.forEach((option) => {
        const group = groupOf(option).dataset.group!;

        wanted.set(group, (wanted.get(group) ?? new Set()).add(option.dataset.value!));
      });

      let shown = 0;

      items.forEach((item) => {
        const facets = JSON.parse(item.dataset.facets ?? "{}") as Record<string, string>;
        const matches = (!query || (item.dataset.kw ?? "").includes(query))
          && [...wanted].every(([group, values]) => values.has(facets[group] ?? ""));

        item.hidden = !matches;
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
        chip.setAttribute("aria-label", `${drawer.dataset.remove ?? ""}${groupLabel}: ${option.dataset.label}`);
        key.className = "dr-on-k";
        key.textContent = groupLabel;
        chip.append(key, option.dataset.label ?? "");
        chip.insertAdjacentHTML("beforeend", "<svg width=\"10\" height=\"10\" viewBox=\"0 0 10 10\" aria-hidden=\"true\"><path d=\"M2 2l6 6M8 2L2 8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\"></path></svg>");
        chip.addEventListener("click", () => {
          picked.delete(option);
          update();
          saveState();
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
      empty.querySelector("span")!.textContent = shown > 0 ? "" : (query ? (drawer.dataset.noneQ ?? "").replace("%", input.value.trim()) : drawer.dataset.noneF ?? "");
    };

    const setMenu = (opened: boolean) => {
      menu?.setAttribute("data-open", String(opened));
      button?.setAttribute("aria-expanded", String(opened));
    };

    sheets.set(list, {
      keys: ["q", ...groups],
      params: () => {
        const params: [string, string][] = [];
        const query = input.value.trim();

        if (query) {
          params.push(["q", query]);
        }

        picked.forEach(option => params.push([groupOf(option).dataset.group!, option.dataset.value!]));

        return params;
      },
      restore: (search) => {
        input.value = search.get("q") ?? "";
        picked.clear();
        options.forEach((option) => {
          if (search.getAll(groupOf(option).dataset.group!).includes(option.dataset.value!)) {
            picked.add(option);
          }
        });
        update();
      },
      closeMenu: () => {
        const wasOpen = menu?.dataset.open === "true";

        setMenu(false);

        return wasOpen;
      },
    });

    input.addEventListener("input", () => {
      update();
      saveState();
    });

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
        saveState();
      });
    });

    element.querySelectorAll("[data-clear]").forEach((clear) => {
      clear.addEventListener("click", () => {
        picked.clear();
        input.value = "";
        update();
        saveState();
        input.focus();
      });
    });

    // A click anywhere outside the filter menu closes it.
    document.addEventListener("click", (event) => {
      if (menu?.dataset.open === "true" && !menu.contains(event.target as Node)) {
        setMenu(false);
      }
    });
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
   */
  const fly = (element: Element | null, from: DOMRect | undefined, uniform = true) => {
    if (!element || !from?.width || reducedMotion()) {
      return;
    }

    const to = element.getBoundingClientRect();

    if (!to.width || !to.height) {
      return;
    }

    const sx = from.width / to.width;
    const sy = from.height / to.height;

    element.animate(
      [
        { transformOrigin: "0 0", transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${uniform ? sy : sx}, ${sy})` },
        { transformOrigin: "0 0", transform: "none" },
      ],
      { duration: 150, easing: "cubic-bezier(.2,.8,.2,1)" },
    );
  };

  const pageLogo = () => document.querySelector(".bar .logo svg");
  const pageLabel = (list: List) => document.querySelector(list === "writing" ? "#writing" : "#work");
  const drawerLogo = () => drawer.querySelector(".dr-mark svg");
  const drawerTitle = (list: List) => drawer.querySelector(`.dr-title [data-show="${list}"]`);

  /**
   * Shows a list, switches to the other one, or closes the drawer. The address is
   * left to the caller.
   *
   * @param list - The list to show, or "" to close
   */
  const show = (list: List) => {
    const was = current();

    if (was === list) {
      return;
    }

    // Where things are before the change, for the flights.
    const from = was === ""
      ? { logo: pageLogo()?.getBoundingClientRect(), label: pageLabel(list)?.getBoundingClientRect() }
      : { logo: drawerLogo()?.getBoundingClientRect(), label: drawerTitle(was)?.getBoundingClientRect() };

    closeMenus();

    if (list) {
      drawer.dataset.list = list;
      root.dataset.open = list;
    }
    else {
      delete root.dataset.open;
    }

    drawer.inert = !list;
    page.inert = !!list;
    document.title = titleFor(list);

    if (list) {
      if (was === "") {
        fly(drawerLogo(), from.logo, false);
        fly(drawerTitle(list), from.label);
      }

      // The title takes focus, also when switching lists: the tab pressed is gone.
      drawer.querySelector<HTMLElement>(".dr-title")?.focus({ preventScroll: true });
    }
    else {
      fly(pageLogo(), from.logo, false);
      fly(pageLabel(was), from.label);
      (opener ?? document.querySelector<HTMLElement>(`.page [data-drawer="${was}"]`))?.focus({ preventScroll: true });
      opener = null;
    }
  };

  const open = (list: List, from: HTMLElement | null) => {
    if (current() === "") {
      opener = from;
      show(list);
      history.pushState({ drawer: true }, "", addressFor(list));
    }
    else {
      show(list);
      history.replaceState(history.state, "", addressFor(list));
    }

    syncLanguageLinks();
  };

  const close = () => {
    // Opened here: going back is closing. Arrived with it open: the page takes its place.
    if ((history.state as { drawer?: boolean } | null)?.drawer) {
      history.back();
    }
    else {
      show("");
      history.replaceState(history.state, "", addressFor(""));
      syncLanguageLinks();
    }
  };

  // Back and forward bring the drawer in line with the address.
  window.addEventListener("popstate", () => {
    const search = new URLSearchParams(location.search);
    const list = LIST_OF[search.get("list") ?? ""] ?? "";

    if (list) {
      sheets.get(list)?.restore(search);
    }

    show(list);
    syncLanguageLinks();
  });

  // Every "All projects" and "All posts" link opens the drawer in place. A click with
  // a modifier key still opens the link in a new tab.
  document.querySelectorAll<HTMLAnchorElement>("[data-drawer]").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
        return;
      }

      event.preventDefault();
      open(link.dataset.drawer as List, link.closest(".ck") ? null : link);
    });
  });

  document.querySelectorAll<HTMLElement>("[data-drawer-close]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      close();
    });
  });

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
  // search and filters from the address, without animating anything.
  const initial = current();

  if (initial) {
    sheets.get(initial)?.restore(new URLSearchParams(location.search));
    drawer.dataset.list = initial;
    drawer.inert = false;
    page.inert = true;
    document.title = titleFor(initial);
  }

  syncLanguageLinks();
}
