/*
 * The list drawer. "All projects" and "All posts" open it in place, over the home
 * page, and the address changes to /p/projects/ or /p/blog/ so it can be shared and
 * the back button closes it. The logo and the section name fly into its header.
 * Each list has a search field and a filter menu; the filters picked show as chips.
 */

type List = "" | "work" | "writing";

const drawer = document.querySelector<HTMLElement>("#drawer");

if (drawer) {
  const root = document.documentElement;
  const page = document.querySelector<HTMLElement>(".page")!;
  const urls: Record<string, string> = { "": drawer.dataset.urlHome!, "work": drawer.dataset.urlWork!, "writing": drawer.dataset.urlWriting! };
  const titles: Record<string, string> = { "": drawer.dataset.titleHome!, "work": drawer.dataset.titleWork!, "writing": drawer.dataset.titleWriting! };
  const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  let opener: HTMLElement | null = null;

  const current = () => (root.dataset.open ?? "") as List;

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
   * Points the language links at the same view in each language.
   *
   * @param list - The list now showing, or "" for the home page
   */
  const syncLanguageLinks = (list: List) => {
    const key = list === "" ? "hrefHome" : list === "work" ? "hrefWork" : "hrefWriting";

    document.querySelectorAll<HTMLAnchorElement>("[data-href-home]").forEach((link) => {
      link.href = link.dataset[key] ?? link.href;
    });
  };

  /**
   * Opens a list, switches to the other one, or closes the drawer.
   *
   * @param list - The list to show, or "" to close
   * @param history - How to record it: a new entry, replace this one, or leave it
   */
  const show = (list: List, history: "push" | "replace" | "none") => {
    const was = current();

    if (was === list) {
      return;
    }

    // Where things are before the change, for the flights.
    const from = was === ""
      ? { logo: pageLogo()?.getBoundingClientRect(), label: pageLabel(list)?.getBoundingClientRect() }
      : { logo: drawerLogo()?.getBoundingClientRect(), label: drawerTitle(was)?.getBoundingClientRect() };

    closeFilters();

    if (list) {
      drawer.dataset.list = list;
      root.dataset.open = list;
    }
    else {
      delete root.dataset.open;
    }

    drawer.inert = !list;
    page.inert = !!list;
    document.title = titles[list] ?? document.title;
    syncLanguageLinks(list);

    if (history === "push") {
      window.history.pushState({ drawer: list, fromHome: was === "" }, "", urls[list]);
    }
    else if (history === "replace") {
      window.history.replaceState({ drawer: list, fromHome: (window.history.state as { fromHome?: boolean } | null)?.fromHome ?? false }, "", urls[list]);
    }

    if (list) {
      if (was === "") {
        fly(drawerLogo(), from.logo, false);
        fly(drawerTitle(list), from.label);
      }

      // The title takes focus, also when switching lists: the tab pressed is gone.
      drawer.querySelector<HTMLElement>(".dr-title")?.focus({ preventScroll: true });
    }
    else if (!list) {
      fly(pageLogo(), from.logo, false);
      fly(pageLabel(was), from.label);
      (opener ?? pageLabel(was)?.closest(".row")?.querySelector<HTMLElement>("[data-drawer]"))?.focus({ preventScroll: true });
      opener = null;
    }
  };

  const open = (list: List, from: HTMLElement | null) => {
    if (current() === "") {
      opener = from;
    }

    show(list, current() === "" ? "push" : "replace");
  };

  const close = () => {
    const state = window.history.state as { fromHome?: boolean } | null;

    // Opened from the home page: going back is closing. Arrived on the list itself:
    // the home page takes its place.
    if (state?.fromHome) {
      window.history.back();
    }
    else {
      show("", "replace");
    }
  };

  window.addEventListener("popstate", () => {
    const path = location.pathname;
    const list: List = path === new URL(urls.work!, location.href).pathname ? "work" : path === new URL(urls.writing!, location.href).pathname ? "writing" : "";

    show(list, "none");
  });

  // Every "All projects" and "All posts" link opens the drawer in place. A click
  // with a modifier key still opens the list's own page in a new tab.
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

  /* ---------- Search and filters, for each list ---------- */

  const closers: (() => boolean)[] = [];

  /** Closes an open filter menu. */
  function closeFilters() {
    closers.forEach(closeOne => closeOne());
  }

  drawer.querySelectorAll<HTMLElement>(".dr-sheet").forEach((sheet) => {
    const input = sheet.querySelector<HTMLInputElement>(".dr-q")!;
    const button = sheet.querySelector<HTMLButtonElement>(".dr-fbtn");
    const badge = sheet.querySelector<HTMLElement>(".dr-badge");
    const menu = sheet.querySelector<HTMLElement>(".dr-fpop");
    const chips = sheet.querySelector<HTMLElement>(".dr-active")!;
    const clearAll = chips.querySelector<HTMLElement>("[data-clear]")!;
    const empty = sheet.querySelector<HTMLElement>(".dr-empty")!;
    const items = [...sheet.querySelectorAll<HTMLElement>(".dr-list > li")];
    const options = [...sheet.querySelectorAll<HTMLButtonElement>(".dr-fo")];
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

    closers.push(() => {
      const wasOpen = menu?.dataset.open === "true";

      setMenu(false);

      return wasOpen;
    });

    input.addEventListener("input", update);

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
      });
    });

    sheet.querySelectorAll("[data-clear]").forEach((clear) => {
      clear.addEventListener("click", () => {
        picked.clear();
        input.value = "";
        update();
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

  // Escape closes the filter menu first, then the drawer.
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !current() || document.querySelector(".ck[open]")) {
      return;
    }

    event.preventDefault();

    if (!closers.map(closeOne => closeOne()).includes(true)) {
      close();
    }
  });
}
