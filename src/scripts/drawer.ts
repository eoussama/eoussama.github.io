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
    const status = element.querySelector<HTMLElement>("[data-dr-status]");
    const items = [...element.querySelectorAll<HTMLElement>(".dr-list > li")];
    // Searched without accents, hamzas or case, as the command menu is (palette.ts).
    const fold = (text: string) => text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
    const keywords = new Map(items.map(item => [item, fold(item.dataset.kw ?? "")]));
    const facetsOf = new Map(items.map(item => [item, JSON.parse(item.dataset.facets ?? "{}") as Record<string, string | string[]>]));
    const options = [...element.querySelectorAll<HTMLButtonElement>(".dr-fo")];
    const groups = [...element.querySelectorAll<HTMLElement>(".dr-fg")].map(group => group.dataset.group!);
    const picked = new Set<HTMLButtonElement>();

    const groupOf = (option: HTMLElement) => option.closest<HTMLElement>(".dr-fg")!;

    /** Shows the items that match the search and every group's picks, then redraws the chips. */
    const update = () => {
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
      const none = shown > 0 ? "" : (query ? (drawer.dataset.noneQ ?? "").replace("%", input.value.trim()) : drawer.dataset.noneF ?? "");

      empty.querySelector("span")!.textContent = none;

      if (status && status.textContent !== none) {
        status.textContent = none;
      }
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
   * @param fromSize - The font size of the text it starts as, when that differs from
   * its box's height: the word then grows or shrinks to exactly that size
   * @param over - Whether it flies in from outside the drawer, whose scrolling box
   * would cut it off: a copy above everything makes the trip instead, to where the
   * element rests once the drawer has slid in
   * @param fromColor - The colour of the text it starts as, for a copy
   * @returns The flight, or null when nothing moves
   */
  const fly = (element: Element | null, from: DOMRect | undefined, uniform = true, fromSize = 0, over = false, fromColor = ""): Animation | null => {
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
  };

  const pageLogo = () => document.querySelector(".bar .logo svg");
  // A section's name on the page: its link, not its heading, which runs the list's height.
  const pageLabel = (list: List) => document.querySelector(list === "writing" ? "#writing > a" : "#work > a");
  const drawerLogo = () => drawer.querySelector(".dr-mark svg");
  const drawerTitle = (list: List) => drawer.querySelector(`.dr-title [data-show="${list}"]`);
  const drawerTab = (list: List) => drawer.querySelector(`.dr-tabs [data-show="${list}"]`);
  const fontSize = (element: Element | null) => element ? Number.parseFloat(getComputedStyle(element).fontSize) : 0;

  /**
   * Shows a list, switches to the other one, or closes the drawer. The address is
   * left to the caller.
   *
   * @param list - The list to show, or "" to close
   */
  let swapping = 0;

  const show = (list: List) => {
    const was = current();

    if (was === list) {
      return;
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
    page.inert = !!list;
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

      // The search takes focus, also when switching lists, so typing filters at once. On
      // a touch screen that would raise the keyboard over the list: the title takes it.
      const search = drawer.querySelector<HTMLInputElement>(`[data-sheet="${list}"] .dr-q`);
      const touch = matchMedia("(hover: none) and (pointer: coarse)").matches;

      (touch ? drawer.querySelector<HTMLElement>(".dr-title") : search)?.focus({ preventScroll: true });
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

      // A chip (a project's language or tool) opens the list filtered by it.
      if (link.dataset.filter !== undefined) {
        sheets.get(link.dataset.drawer as List)?.restore(new URL(link.href).searchParams);
      }

      open(link.dataset.drawer as List, link.closest(".ck") ? null : link);
    });
  });

  // Once the list is scrolled, it fades out under the search and filters at the top;
  // while more of it waits below, it fades out at the bottom too.
  const scroller = drawer.querySelector<HTMLElement>(".dr-scroll");
  const markScroll = () => {
    const top = scroller?.scrollTop ?? 0;
    const below = scroller ? scroller.scrollHeight - scroller.clientHeight - top : 0;

    drawer.toggleAttribute("data-scrolled", top > 4);
    drawer.toggleAttribute("data-more", below > 4);
  };

  scroller?.addEventListener("scroll", markScroll, { passive: true });

  // The list's length changes as it is searched, filtered or switched.
  if (scroller) {
    const resized = new ResizeObserver(markScroll);

    resized.observe(scroller);
    [...scroller.children].forEach(child => resized.observe(child));
  }

  markScroll();

  // The P and W shortcuts: a list opens, or closes when it is the one showing.
  document.addEventListener("drawer:toggle", (event) => {
    const list = (event as CustomEvent<string>).detail as List;

    if (!list || list === current()) {
      if (current()) {
        close();
      }
    }
    else {
      open(list, null);
    }
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
