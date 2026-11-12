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
    const reach = scrollY + (Number.parseFloat(getComputedStyle(root).scrollPaddingTop) || 0) + 32;
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

    if (nav.matches(".mm:hover, .mm:has(:focus-visible)")) {
      reveal(at, true);
    }
  };

  /**
   * Finds where each heading sits on the page; they move as images, fonts and the
   * window change.
   */
  const measure = () => {
    tops = targets.map(target => (target ? target.getBoundingClientRect().top + scrollY : Number.POSITIVE_INFINITY));
    current = -2;
    update();
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
    });
  });

  let follow = 0;

  /**
   * Opening, keeps the section being read where it is while the rows spread out,
   * frame by frame, rather than scrolling the list to it once they have, which would
   * carry every name down and then pull it back up.
   */
  const anchor = () => {
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
