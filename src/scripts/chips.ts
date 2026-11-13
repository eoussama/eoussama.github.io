/*
 * A project's stack, folded to its first few chips and "+N" (ProjectPage.astro).
 *
 * On a desktop it arrives whole, so the page shows what the project is built with,
 * then folds a couple of seconds after its chips have come in. Someone pointing at the
 * row, or in it from the keyboard, keeps it open until they leave. On a phone, a small
 * window or a touch screen it starts folded.
 *
 * Pointed at or tabbed into, the row opens: the rest of the chips fade in as the list
 * grows to take them, so what follows the row glides down rather than jumping. Left,
 * it closes the same way back, a moment later, so passing over it does not make it
 * flap. A tap on "+N" opens it for good, as a touch screen has no hover; a finger is
 * never taken for a pointer, or the row would open under it as it lands and the tap
 * meant for "+N" would land on the chip that slid into its place.
 */

const EASE = "cubic-bezier(.2,0,0,1)";
/** How long the whole stack stays out once it has arrived, in milliseconds. */
const SHOW = 4000;

document.querySelectorAll<HTMLElement>(".chips[data-fold]").forEach((list) => {
  const row = list.closest<HTMLElement>(".row");
  const more = list.querySelector<HTMLButtonElement>("[data-chips-more]");

  if (!row) {
    return;
  }

  let glide: Animation | null = null;
  let wait = 0;
  let fold = 0;
  let pinned = false;

  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isOpen = () => list.hasAttribute("data-open") && !list.hasAttribute("data-closing");

  /**
   * Grows or shrinks the list from one height to another, clipping what does not fit
   * yet, or no longer does.
   *
   * @param from - Its height now, in pixels
   * @param to - Its height once settled, in pixels
   * @param done - What to do once it has
   */
  const resize = (from: number, to: number, done?: () => void) => {
    if (reduce() || Math.abs(from - to) < 1) {
      done?.();

      return;
    }

    list.style.overflow = "clip";
    list.style.overflowClipMargin = "6px";
    glide = list.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: 320, easing: EASE });
    glide.finished.then(() => {
      glide = null;
      list.style.overflow = "";
      list.style.overflowClipMargin = "";
      done?.();
    }, () => {});
  };

  /** Lays out the whole stack. */
  const open = () => {
    clearTimeout(wait);
    clearTimeout(fold);

    if (isOpen()) {
      return;
    }

    // Measured as it stands, even halfway through closing.
    const from = list.getBoundingClientRect().height;

    glide?.cancel();
    list.removeAttribute("data-closing");
    list.removeAttribute("data-shut");
    list.setAttribute("data-open", "");
    resize(from, list.getBoundingClientRect().height);
  };

  /** Folds it back to its first few and "+N". */
  const close = () => {
    if (!isOpen() || pinned) {
      return;
    }

    const from = list.getBoundingClientRect().height;

    glide?.cancel();

    // Its folded height, found before the chips start to go.
    list.removeAttribute("data-open");

    const to = list.getBoundingClientRect().height;

    // The rest fade where they are, then the row folds back to its first few and "+N",
    // which fades in while the list is still closing: the glide holds its height, so
    // the swap inside it moves nothing.
    list.setAttribute("data-open", "");
    list.setAttribute("data-closing", "");
    clearTimeout(fold);
    fold = window.setTimeout(() => {
      list.removeAttribute("data-open");
      list.removeAttribute("data-closing");
      list.setAttribute("data-shut", "");
    }, reduce() ? 0 : 120);
    resize(from, to);
  };

  const later = () => {
    clearTimeout(wait);
    wait = window.setTimeout(() => {
      if (!row.matches(":hover, :has(:focus-visible)")) {
        close();
      }
    }, 60);
  };

  row.addEventListener("pointerenter", (event) => {
    if (event.pointerType !== "touch") {
      open();
    }
  });
  row.addEventListener("pointerleave", (event) => {
    if (event.pointerType !== "touch") {
      later();
    }
  });
  row.addEventListener("focusin", () => {
    if (row.matches(":has(:focus-visible)")) {
      open();
    }
  });
  row.addEventListener("focusout", later);

  more?.addEventListener("click", () => {
    pinned = true;
    open();
  });

  /**
   * Once the row is in sight and its chips have come in (the first-load reveal brings
   * them one by one), waits a moment, then folds it.
   */
  const settle = () => {
    const root = document.documentElement;
    const busy = root.dataset.rv === "pre" || list.getAnimations({ subtree: true }).some(animation => animation.playState === "running");

    if (busy) {
      requestAnimationFrame(settle);

      return;
    }

    wait = window.setTimeout(() => {
      if (row.matches(":hover, :has(:focus-visible)")) {
        list.setAttribute("data-open", "");
      }
      else {
        close();
      }
    }, SHOW);
  };

  // A phone, a small window or a touch screen has it folded from the start (the
  // stylesheet already shows it so); only a desktop shows it whole, then folds it.
  if (list.getAttribute("data-open") === "first" && !matchMedia("(hover: hover) and (min-width: 701px)").matches) {
    list.removeAttribute("data-open");
  }

  if (list.getAttribute("data-open") === "first") {
    const seen = new IntersectionObserver((entries) => {
      if (entries.some(entry => entry.isIntersecting)) {
        seen.disconnect();
        settle();
      }
    });

    seen.observe(list);
  }
});
