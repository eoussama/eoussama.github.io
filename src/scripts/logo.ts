/*
 * The eclipse logo settles in again, the way it does on a first visit, when it is held
 * for a moment (a mouse button or a finger, kept still), or double clicked on the
 * home page, where it leads nowhere new. Held, it does not follow its link after.
 */

const logo = document.querySelector<HTMLAnchorElement>(".bar .logo");
const root = document.documentElement;
/** How long it must be held. */
const HOLD = 550;

if (logo) {
  let held = false;

  /** Plays the logo settling in, unless it is already. */
  const play = () => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || logo.getAnimations({ subtree: true }).some(animation => animation.playState === "running")) {
      return;
    }

    root.classList.add("is-seen");
    delete logo.dataset.play;
    void logo.offsetWidth;
    logo.dataset.play = "";
  };

  logo.addEventListener("animationend", (event) => {
    if ((event.target as Element).matches(".lg-wedge")) {
      delete logo.dataset.play;
    }
  });

  // Here already, the link would only open the same page again.
  const home = () => new URL(logo.href).pathname === location.pathname;

  logo.addEventListener("click", (event) => {
    if (held || home()) {
      event.preventDefault();
    }

    if (!held && home()) {
      scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }

    held = false;
  });
  logo.addEventListener("dblclick", () => {
    if (home()) {
      play();
    }
  });

  let hold = 0;
  let from: [number, number] | null = null;

  logo.addEventListener("pointerdown", (event) => {
    if (event.button) {
      return;
    }

    held = false;
    from = [event.clientX, event.clientY];
    hold = window.setTimeout(() => {
      held = true;
      play();
    }, HOLD);
  });
  logo.addEventListener("pointermove", (event) => {
    if (from && Math.hypot(event.clientX - from[0], event.clientY - from[1]) > 10) {
      clearTimeout(hold);
    }
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach(type => logo.addEventListener(type, () => clearTimeout(hold)));
  // A long press on a link would open the phone's menu for it, or start dragging it.
  logo.addEventListener("contextmenu", (event) => {
    if (held) {
      event.preventDefault();
    }
  });
  logo.addEventListener("dragstart", event => event.preventDefault());
}

export {};
