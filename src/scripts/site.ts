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

/*
 * ---------- Greeting: "Hi!" in the next language while the page is idle ----------
 *
 * It moves on by itself only once the visitor has left the page alone for a moment
 * (no pointer, scroll, touch or key), every few seconds after that. It holds while the
 * intro is under the cursor, while something else has their attention (a menu, a
 * list, the page out of sight), and with reduced motion. Selecting it moves on at once,
 * and the next change waits its full turn after that.
 */

const hello = document.querySelector<HTMLButtonElement>("[data-hellos]");

/** On the days of Eid, the greeting each language gives then. */
const EID: Record<string, string> = {
  en: "Eid Mubarak!",
  fr: "Aïd Moubarak !",
  es: "¡Eid Mubarak!",
  it: "Eid Mubarak!",
  ja: "イード・ムバラク！",
  ar: "عيد مبارك!",
  ary: "عواشر مبروكة!",
};

/** The greeting each language gives in the morning, the afternoon and the evening. */
const DAY: Record<string, [string, string, string]> = {
  en: ["Good morning!", "Good afternoon!", "Good evening!"],
  fr: ["Bonjour !", "Bonjour !", "Bonsoir !"],
  es: ["¡Buenos días!", "¡Buenas tardes!", "¡Buenas noches!"],
  it: ["Buongiorno!", "Buongiorno!", "Buonasera!"],
  ja: ["おはよう！", "こんにちは！", "こんばんは！"],
  ar: ["صباح الخير!", "مساء الخير!", "مساء الخير!"],
  ary: ["صباح الخير!", "مسا الخير!", "مسا الخير!"],
};

/**
 * Whether today is Eid: the first three days of Shawwal (al-Fitr) or the four from
 * the tenth of Dhu al-Hijjah (al-Adha), by the browser's Umm al-Qura calendar. A
 * browser without it never says so.
 *
 * @returns Whether it is
 */
function isEid(): boolean {
  const [error, parts] = tryCatchSync(() => new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { month: "numeric", day: "numeric" }).formatToParts(new Date()));

  if (error || !parts) {
    return false;
  }

  const month = Number(parts.find(part => part.type === "month")?.value);
  const day = Number(parts.find(part => part.type === "day")?.value);

  return (month === 10 && day <= 3) || (month === 12 && day >= 10 && day <= 13);
}

/**
 * The greeting the page opens on, in its own language: Eid's on the days of Eid,
 * otherwise the one for the visitor's time of day (morning from five, afternoon from
 * noon, evening from six).
 *
 * @param lang - The page's language
 * @returns The greeting, or nothing for a language without one
 */
function opening(lang: string): string | undefined {
  if (isEid()) {
    return EID[lang];
  }

  const hour = new Date().getHours();

  return DAY[lang]?.[hour >= 5 && hour < 12 ? 0 : hour >= 12 && hour < 18 ? 1 : 2];
}

/** How long the page must be left alone before the greeting moves on. */
const IDLE = 8000;
/** How long each greeting stays at least. */
const EVERY = 5000;

if (hello) {
  const hellos = JSON.parse(hello.dataset.hellos ?? "[]") as Hello[];
  const special = hellos[0] && opening(hellos[0].lang);
  const hint = hello.dataset.hint ?? "";

  const intro = hello.closest<HTMLElement>(".row") ?? hello;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const para = hello.parentElement!;
  let index = 0;
  let hovered = false;
  let active = performance.now();
  let changed = performance.now();

  /** The intro's words, each in its own box (see Home.astro). */
  const words = [...para.querySelectorAll<HTMLElement>(".iw")];

  /**
   * The opening greetings are longer than a word: one too wide to drop beside the text
   * (a share of the line on a wide screen, the whole of it on a phone) is set a size
   * down to fit, on one line.
   */
  const fit = () => {
    if (!special) {
      return;
    }

    hello.style.removeProperty("--drop");
    delete hello.dataset.fit;

    const room = para.clientWidth * (matchMedia("(min-width: 701px)").matches ? 0.62 : 1);

    hello.style.whiteSpace = "nowrap";

    const width = hello.getBoundingClientRect().width;
    const size = Number.parseFloat(getComputedStyle(hello).fontSize);

    hello.style.whiteSpace = "";

    if (width > room) {
      hello.style.setProperty("--drop", `${(size * room / width).toFixed(1)}px`);
      hello.dataset.fit = "";
    }
  };

  // The page opens on the day's greeting, before its words rise. It shows only once:
  // moving on starts the round of plain hellos at the page's own, which never brings it
  // back.
  if (special) {
    index = -1;
    hello.textContent = special;
    hello.setAttribute("aria-label", `${special} ${hint}`);
    fit();
    document.fonts.ready.then(fit, () => {});
    addEventListener("resize", fit, { passive: true });
  }

  /**
   * Notes where the intro's words are before the greeting changes, and returns what
   * slides them from there to where they land: along their line if they stay on it,
   * fading in with a little drift if they wrap to another.
   *
   * @returns What plays the slide, once the greeting has changed
   */
  const settle = (): (() => void) => {
    if (reduce || root.dataset.rv === "pre" || !Element.prototype.animate) {
      return () => {};
    }

    const before = words.map(box => box.getBoundingClientRect());

    return () => {
      words.forEach((box, i) => {
        const from = before[i]!;
        const to = box.getBoundingClientRect();
        const dx = from.left - to.left;
        const dy = from.top - to.top;

        box.getAnimations().forEach(animation => animation.cancel());

        if (Math.abs(dy) > 2) {
          // Once the words around have mostly made way, so none crosses another.
          box.animate([{ opacity: 0, transform: `translateX(${Math.sign(dx) * 10}px)` }, { opacity: 1, transform: "none" }], { duration: 340, delay: 300, easing: "cubic-bezier(.2,.75,.15,1)", fill: "backwards" });
        }
        else if (Math.abs(dx) > 0.5) {
          box.animate([{ transform: `translateX(${dx}px)` }, { transform: "none" }], { duration: 480, easing: "cubic-bezier(.55,0,.15,1)" });
        }
      });
    };
  };

  /** Shows the greeting in the next language. */
  const next = () => {
    index = (index + 1) % hellos.length;

    const greeting = hellos[index];

    if (!greeting) {
      return;
    }

    const glide = settle();

    hello.textContent = greeting.text;
    hello.lang = greeting.lang;
    hello.dir = greeting.dir;
    hello.setAttribute("aria-label", `${greeting.text} ${hint}`);
    fit();
    hello.dataset.g = index % 2 ? "a" : "b";
    glide();
  };

  // The intro is still coming in: its words rising, the name unfolding.
  const entering = () => root.dataset.rv === "pre"
    || intro.getAnimations({ subtree: true }).some(animation => animation.playState === "running" && !(animation.effect as KeyframeEffect | null)?.target?.matches?.(".iw"));

  const busy = () => hovered
    || document.hidden
    || entering()
    || !!root.dataset.open
    || !!document.querySelector("dialog[open], .menu[data-open='true']")
    || !!intro.querySelector(":focus-visible");

  /**
   * Moves on if the page has been left alone long enough and the greeting has had its
   * turn.
   */
  const tick = () => {
    const now = performance.now();

    if (now - active >= IDLE && now - changed >= EVERY && !busy()) {
      next();
      changed = now;
    }
  };

  const touch = () => {
    active = performance.now();
  };

  ["pointermove", "pointerdown", "wheel", "scroll", "keydown", "touchstart"].forEach((type) => {
    window.addEventListener(type, touch, { passive: true, capture: true });
  });

  hello.addEventListener("click", () => {
    next();
    changed = performance.now();
  });
  intro.addEventListener("pointerenter", () => {
    hovered = true;
  });
  intro.addEventListener("pointerleave", () => {
    hovered = false;
  });

  if (!reduce) {
    window.setInterval(tick, 250);
  }
}

// Printed, the page is a letter (Base.astro): the browser's header, which prints the
// page's title, reads the site's address instead.
let titled = document.title;

addEventListener("beforeprint", () => {
  titled = document.title;
  document.title = "ouss.es";
});
addEventListener("afterprint", () => {
  document.title = titled;
});
