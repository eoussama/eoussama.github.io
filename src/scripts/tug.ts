/*
 * With a list, the command menu or the shortcuts open, the cursor over the veil around
 * them is a cross: a click there closes them. As it moves there, what is open leans a
 * little toward it, as if about to be taken away; back over it, it settles. Only with a
 * mouse, and never with reduced motion.
 */

const root = document.documentElement;
/** How far it leans at most, in pixels. */
const REACH = 10;

let leaning: HTMLElement | null = null;

/** Lets whatever was leaning settle back. */
function settle() {
  leaning?.style.removeProperty("translate");
  leaning = null;
}

/**
 * Leans an element toward a point: further the further away it is, up to REACH.
 *
 * @param element - What leans
 * @param x - The cursor's position across
 * @param y - The cursor's position down
 * @param sideways - Whether it may only lean sideways, as the drawer at the screen's edge
 */
function lean(element: HTMLElement, x: number, y: number, sideways: boolean) {
  if (leaning && leaning !== element) {
    settle();
  }

  const box = element.getBoundingClientRect();
  const dx = x - (box.left + box.width / 2);
  const dy = sideways ? 0 : y - (box.top + box.height / 2);
  const distance = Math.hypot(dx, dy) || 1;
  const pull = REACH * Math.min(1, distance / 640);

  element.style.translate = `${((dx / distance) * pull).toFixed(1)}px ${((dy / distance) * pull).toFixed(1)}px`;
  leaning = element;
}

if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") {
      return;
    }

    const target = event.target as Element;
    const note = document.querySelector<HTMLDialogElement>("dialog.ck[open]:not(.is-closing)");

    if (note) {
      if (target === note) {
        lean(note.querySelector<HTMLElement>(".ck-note")!, event.clientX, event.clientY, false);
      }
      else {
        settle();
      }

      return;
    }

    if (root.dataset.open && target.matches(".dr-scrim")) {
      lean(document.querySelector<HTMLElement>(".dr")!, event.clientX, event.clientY, true);
    }
    else {
      settle();
    }
  }, { passive: true });

  document.documentElement.addEventListener("pointerleave", settle);

  // Closing anything lets it settle too.
  new MutationObserver(settle).observe(root, { attributeFilter: ["data-open"] });
  document.addEventListener("close", settle, true);
}

export {};
