import { tryCatchSync } from "@eoussama/core";



/*
 * The few things on every page that need a script: the theme switch, the header
 * menus, the greeting and the signature. Everything else is plain HTML and CSS.
 */

type Theme = "light" | "dark" | "auto";
type Hello = { text: string; lang: string; dir: string };

const root = document.documentElement;
const bar = document.querySelector<HTMLElement>(".bar");
let open: HTMLButtonElement | null = null;
const prefersDark = matchMedia("(prefers-color-scheme: dark)");
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Saves a value. Storage can throw (private windows, blocked cookies), and a failed
 * write only means the choice is not remembered.
 *
 * @param where - Local storage lasts, session storage ends with the visit
 * @param key - The name to save it under
 * @param value - The value to save
 */
function remember(where: "local" | "session", key: string, value: string) {
  tryCatchSync(() => (where === "local" ? localStorage : sessionStorage).setItem(key, value));
}

/* ---------- Theme ---------- */

/**
 * The colours a theme shows right now.
 *
 * @param theme - The theme picked
 * @returns "dark" or "light", following the system for "auto"
 */
function modeOf(theme: Theme) {
  if (theme !== "auto") {
    return theme;
  }

  return prefersDark.matches ? "dark" : "light";
}

/**
 * Puts a theme on the page and marks its button as pressed.
 *
 * @param theme - The theme to show
 */
function applyTheme(theme: Theme) {
  root.dataset.theme = theme;
  root.dataset.mode = modeOf(theme);

  document.querySelectorAll<HTMLButtonElement>("[data-theme-pick]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.themePick === theme));
  });

  const meta = document.querySelector<HTMLMetaElement>("meta[name=theme-color]");

  if (meta) {
    meta.content = getComputedStyle(root).getPropertyValue("--bg").trim();
  }
}

/**
 * Slides the soft pill from the old theme's button to the new one.
 *
 * @param from - Where the pill was, or null when it was not shown
 * @param button - The newly pressed button
 */
function movePill(from: DOMRect | null, button: HTMLElement) {
  const pill = button.querySelector<HTMLElement>(".th-pill");
  const to = pill?.getBoundingClientRect();

  if (!from?.width || !pill || !to?.width || reducedMotion()) {
    return;
  }

  pill.animate(
    [
      { transformOrigin: "0 0", transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})` },
      { transformOrigin: "0 0", transform: "none" },
    ],
    { duration: 340, easing: "cubic-bezier(.55,0,.15,1)" },
  );
}

/** Where the pointer was last seen. */
const pointer = { x: -1, y: -1 };

document.addEventListener("pointermove", (event) => {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
}, { capture: true, passive: true });

/**
 * Switches the theme. When the colours change, the new theme spreads in a circle
 * from the button pressed until it covers the page, with a faint ring on its edge.
 *
 * @param theme - The theme picked
 * @param button - The button pressed, where the circle starts
 */
function pickTheme(theme: Theme, button: HTMLElement) {
  const current = (root.dataset.theme as Theme) || "auto";

  if (current === theme) {
    return;
  }

  remember("local", "theme", theme);

  const before = document.querySelector(`[data-theme-pick="${current}"] .th-pill`)?.getBoundingClientRect() ?? null;
  const change = () => {
    applyTheme(theme);
    movePill(before, button);
  };

  if (modeOf(current) === modeOf(theme) || reducedMotion() || !document.startViewTransition) {
    change();

    return;
  }

  const box = button.getBoundingClientRect();
  const x = box.left + box.width / 2;
  const y = box.top + box.height / 2;
  const far = Math.ceil(Math.hypot(Math.max(x, root.clientWidth - x), Math.max(y, innerHeight - y))) + 2;
  const duration = Math.round(Math.min(1050, Math.max(620, far * 0.62)));
  const easing = "cubic-bezier(.55,0,.15,1)";

  // While the transition runs, its snapshot covers the page and the header loses its
  // hover. Keep it open if it was, so it doesn't fold up and open again.
  const keepOpen = !!bar?.matches(":hover, :has(:focus-visible)");

  if (keepOpen) {
    bar?.setAttribute("data-busy", "true");
  }

  root.classList.add("vt-theme");

  const transition = document.startViewTransition(change);

  transition.ready.then(() => {
    root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${far}px at ${x}px ${y}px)`] },
      { duration, easing, pseudoElement: "::view-transition-new(root)" },
    );

    const ring = document.createElement("i");

    ring.className = "th-ring";
    ring.setAttribute("aria-hidden", "true");
    Object.assign(ring.style, { width: `${far * 2}px`, height: `${far * 2}px`, left: `${x - far}px`, top: `${y - far}px` });
    document.body.append(ring);
    ring.animate([{ transform: "scale(0)" }, { transform: "scale(1)" }], { duration, easing, fill: "forwards" });

    const fade = ring.animate([{ opacity: 1 }, { opacity: 1, offset: 0.5 }, { opacity: 0 }], { duration, fill: "forwards" });

    fade.onfinish = () => ring.remove();
  }).catch(() => {});

  // A transition cut short (another switch, a navigation) only skips the animation.
  transition.updateCallbackDone.catch(() => {});
  transition.finished.catch(() => {}).finally(() => {
    root.classList.remove("vt-theme");

    if (!keepOpen || !bar) {
      return;
    }

    const release = () => bar.setAttribute("data-busy", String(!!open));
    const box = bar.getBoundingClientRect();
    const over = pointer.x >= box.left && pointer.x <= box.right && pointer.y >= box.top && pointer.y <= box.bottom;

    // The browser takes a moment to find the pointer over the header again once the
    // snapshot is gone: until the pointer next moves, the header stays open if it is
    // still there, rather than folding up and opening again.
    if (over) {
      document.addEventListener("pointermove", release, { once: true });
    }
    else {
      release();
    }
  });
}

document.querySelectorAll<HTMLButtonElement>("[data-theme-pick]").forEach((button) => {
  button.addEventListener("click", () => pickTheme(button.dataset.themePick as Theme, button));
});

prefersDark.addEventListener("change", () => {
  if (root.dataset.theme === "auto") {
    applyTheme("auto");
  }
});

applyTheme((root.dataset.theme as Theme) || "auto");

/* ---------- Header menus ---------- */


/**
 * Opens one header menu and closes the other. While a menu is open the header keeps
 * its full controls showing.
 *
 * @param button - The button of the menu to open, or null to close them
 */
function setMenu(button: HTMLButtonElement | null) {
  if (open && open !== button) {
    open.setAttribute("aria-expanded", "false");
    document.getElementById(open.dataset.menu ?? "")?.setAttribute("data-open", "false");
  }

  open = button;

  if (button) {
    button.setAttribute("aria-expanded", "true");
    document.getElementById(button.dataset.menu ?? "")?.setAttribute("data-open", "true");
  }

  bar?.setAttribute("data-busy", String(!!button));
}

document.querySelectorAll<HTMLButtonElement>("[data-menu]").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    setMenu(open === button ? null : button);
  });

  // Keyboard focus leaving the button and its menu closes it.
  button.parentElement?.addEventListener("focusout", (event) => {
    const next = event.relatedTarget as Node | null;

    if (open === button && next && !button.parentElement?.contains(next)) {
      setMenu(null);
    }
  });
});

document.addEventListener("click", (event) => {
  if (open && !(event.target as Element).closest(".menu")) {
    setMenu(null);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && open) {
    const button = open;

    setMenu(null);
    button.focus();
  }
});

// Picking a language remembers it, so the next visit opens in it.
document.querySelectorAll<HTMLAnchorElement>("[data-lang-link]").forEach((link) => {
  link.addEventListener("click", () => remember("local", "lang", link.dataset.langLink ?? "en"));
});

/* ---------- Greeting: "Hi!" in the next language each time it is selected ---------- */

const hello = document.querySelector<HTMLButtonElement>("[data-hellos]");

if (hello) {
  const hellos = JSON.parse(hello.dataset.hellos ?? "[]") as Hello[];
  const hint = hello.dataset.hint ?? "";
  let index = 0;

  hello.addEventListener("click", () => {
    index = (index + 1) % hellos.length;

    const next = hellos[index];

    if (!next) {
      return;
    }

    hello.textContent = next.text;
    hello.lang = next.lang;
    hello.dir = next.dir;
    hello.setAttribute("aria-label", `${next.text} ${hint}`);
    hello.dataset.g = index % 2 ? "a" : "b";
  });
}
