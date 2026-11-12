/*
 * The button back to the top of the page. It shows once a screen's height of the page
 * has scrolled away, and goes again near the top. The ring around it fills as the page
 * is read. Clicked from the keyboard, focus
 * lands on the logo, the first thing on the page, rather than on nothing.
 */

const button = document.querySelector<HTMLButtonElement>(".to-top");

if (button) {
  let shown = false;

  /**
   * Shows or hides the button for where the page is scrolled to.
   */
  const update = () => {
    const show = scrollY > innerHeight;
    const end = document.documentElement.scrollHeight - innerHeight;

    button.style.setProperty("--read", String(end > 0 ? Math.min(scrollY / end, 1) : 0));

    if (show === shown) {
      return;
    }

    shown = show;
    button.hidden = false;
    button.dataset.shown = String(show);
    button.tabIndex = show ? 0 : -1;
    button.setAttribute("aria-hidden", String(!show));
  };

  button.addEventListener("click", () => {
    const keyboard = button.matches(":focus-visible");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });

    if (keyboard) {
      document.querySelector<HTMLElement>(".bar .logo")?.focus({ preventScroll: true });
    }
    else {
      button.blur();
    }
  });

  addEventListener("scroll", update, { passive: true });
  addEventListener("resize", update, { passive: true });
  update();
}
