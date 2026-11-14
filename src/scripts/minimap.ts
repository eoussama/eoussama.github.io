/*
 * A post's map (Minimap.astro): which section is being read, and the jumps to the
 * others.
 *
 * The section being read is the last whose heading has scrolled up to just under the
 * header. At the very end of the page, the last heading in sight takes over, as a
 * short last section may never reach that high.
 */

const nav = document.querySelector<HTMLElement>("[data-minimap]");

if (nav) {
  const root = document.documentElement;
  const list = nav.querySelector<HTMLElement>(".mm-list")!;
  const items = [...nav.querySelectorAll<HTMLLIElement>(".mm-item")];
  const links = items.map(item => item.querySelector<HTMLAnchorElement>("a")!);
  const targets = links.map(link => document.getElementById(decodeURIComponent(link.hash.slice(1))));
  let tops: number[] = [];
  /** How far under the top of the window a heading lands (the header's room), measured with the headings. */
  let under = 0;
  let current = -2;

  /**
   * Keeps an entry in sight within the list, when the list is too long to show whole.
   *
   * @param index - The entry
   * @param smooth - Whether to glide there
   */
  const reveal = (index: number, smooth: boolean) => {
    const item = items[index];

    if (!item || list.scrollHeight <= list.clientHeight) {
      return;
    }

    const top = item.offsetTop - (list.clientHeight - item.offsetHeight) / 2;

    list.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });
  };

  /**
   * Marks the section being read, those before it and those after.
   */
  const update = () => {
    const reach = scrollY + under + 32;
    let at = -1;

    tops.forEach((top, i) => {
      if (top <= reach) {
        at = i;
      }
    });

    if (scrollY + innerHeight >= root.scrollHeight - 2) {
      tops.forEach((top, i) => {
        if (top < scrollY + innerHeight) {
          at = Math.max(at, i);
        }
      });
    }

    if (at === current) {
      return;
    }

    current = at;
    items.forEach((item, i) => {
      item.dataset.state = i < at ? "read" : i === at ? "now" : "ahead";
    });
    links.forEach((link, i) => {
      if (i === at) {
        link.setAttribute("aria-current", "location");
      }
      else {
        link.removeAttribute("aria-current");
      }
    });

    // At the page's edge, open, the list follows the reading; the card is left where
    // the reader has scrolled it.
    if (!nav.dataset.sheet && nav.matches(".mm:hover, .mm:has(:focus-visible)")) {
      reveal(at, true);
    }
  };

  /**
   * Finds where each heading sits on the page; they move as images, fonts and the
   * window change.
   */
  const measure = () => {
    tops = targets.map(target => (target ? target.getBoundingClientRect().top + scrollY : Number.POSITIVE_INFINITY));
    under = Number.parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
    current = -2;
    update();
  };

  /*
   * Where the window is too narrow for the map at the page's edge, it waits behind a
   * button in the corner and opens as a card above it.
   */
  const button = document.querySelector<HTMLButtonElement>(".mm-btn");
  const narrow = matchMedia("(max-width: 1100px)");

  /**
   * Opens the card, the section being read in sight; from the keyboard, focus goes to
   * that section's row.
   *
   * @param keyboard - Whether it was opened from the keyboard
   */
  const open = (keyboard: boolean) => {
    nav.dataset.sheet = "open";
    button?.setAttribute("aria-expanded", "true");
    reveal(current, false);

    if (keyboard) {
      (links[current] ?? links[0])?.focus();
    }
  };

  /**
   * Closes the card, if it is open.
   *
   * @param back - Whether focus goes back to the button
   */
  const shut = (back: boolean) => {
    if (nav.dataset.sheet !== "open") {
      return;
    }

    nav.dataset.sheet = "closed";
    button?.setAttribute("aria-expanded", "false");

    if (back) {
      button?.focus();
    }
  };

  links.forEach((link, i) => {
    link.addEventListener("click", (event) => {
      const target = targets[i];

      if (!target) {
        return;
      }

      event.preventDefault();

      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

      target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      history.replaceState(history.state, "", link.hash);

      // From the keyboard, focus follows to the heading, so reading goes on from there.
      if (event.detail === 0) {
        target.querySelector<HTMLElement>("a")?.focus({ preventScroll: true });
      }

      shut(false);
    });
  });

  /**
   * Sets the map out for the window's width: at the page's edge, or behind the button.
   */
  const fit = () => {
    if (narrow.matches) {
      nav.dataset.sheet ??= "closed";
    }
    else {
      shut(false);
      delete nav.dataset.sheet;
    }
  };

  if (button) {
    button.addEventListener("click", (event) => {
      if (nav.dataset.sheet === "open") {
        shut(false);
      }
      else {
        open(event.detail === 0);
      }
    });

    // A tap anywhere else closes it, as does Escape.
    document.addEventListener("pointerdown", (event) => {
      const at = event.target as Node;

      if (!nav.contains(at) && !button.contains(at)) {
        shut(false);
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.dataset.sheet === "open") {
        shut(nav.contains(document.activeElement) || document.activeElement === button);
      }
    });

    narrow.addEventListener("change", fit);
    fit();
  }

  let follow = 0;

  /**
   * Opening, keeps the section being read where it is while the rows spread out,
   * frame by frame, rather than scrolling the list to it once they have, which would
   * carry every name down and then pull it back up. Only at the page's edge: the card
   * opens at its full size, and a finger landing in it to scroll would otherwise be
   * pulled back, frame after frame, to the section being read.
   */
  const anchor = () => {
    if (nav.dataset.sheet) {
      return;
    }

    const until = performance.now() + 900;

    cancelAnimationFrame(follow);

    const step = () => {
      reveal(current, false);

      if (performance.now() < until && nav.matches(".mm:hover, .mm:has(:focus-visible)")) {
        follow = requestAnimationFrame(step);
      }
    };

    follow = requestAnimationFrame(step);
  };

  nav.addEventListener("pointerenter", anchor);
  nav.addEventListener("focusin", anchor);

  /**
   * Fades the list out at an end with more of it past there.
   */
  const edges = () => {
    const below = list.scrollHeight - list.clientHeight - list.scrollTop;

    list.toggleAttribute("data-scrolled", list.scrollTop > 4);
    list.toggleAttribute("data-more", below > 4);
  };

  list.addEventListener("scroll", edges, { passive: true });
  new ResizeObserver(edges).observe(list);

  addEventListener("scroll", update, { passive: true });
  new ResizeObserver(measure).observe(document.body);
  measure();

  /**
   * The dashes come in once the page has loaded, and on a first visit only once the
   * page's own words have started to rise (see reveal.ts).
   */
  const arrive = () => {
    const start = () => requestAnimationFrame(() => nav.classList.add("is-in"));

    if (root.dataset.rv !== "pre") {
      start();

      return;
    }

    const watch = new MutationObserver(() => {
      if (root.dataset.rv !== "pre") {
        watch.disconnect();
        start();
      }
    });

    watch.observe(root, { attributes: true, attributeFilter: ["data-rv"] });
  };

  if (document.readyState === "complete") {
    arrive();
  }
  else {
    addEventListener("load", arrive, { once: true });
  }
}
