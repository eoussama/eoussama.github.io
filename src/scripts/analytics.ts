import { tryCatchSync } from "@eoussama/core";



/*
 * Google Analytics 4, after consent. Nothing loads until the visitor allows it; ads
 * signals stay off either way. Counted: page views, each with the version of the site
 * seen (site_version, as the archived versions send too), project opens, language and
 * theme changes, plus GA's own outbound links and scrolls (its enhanced measurement;
 * its file downloads are off, as cv_download counts the one file). And the little things a
 * visitor can find: the CV downloaded (cv_download), the email copied (email_copy) or
 * written to (email_write), a page printed (page_print) and the Lakama rain
 * (lakama_rain). Each says how it was reached, where there are several ways (method).
 * And the short links at to.ouss.es opened from the site (short_link, with its slug).
 *
 * A visit through a short link to this site arrives with UTM tags (the redirector adds
 * them), which GA reads as its source. Once the visitor has answered, they leave the
 * address bar, so an address copied from it doesn't count as that short link again.
 */

type Gtag = (...args: unknown[]) => void;

const banner = document.querySelector<HTMLElement>("#consent");
const id = banner?.dataset.ga ?? "";
const KEY = "consent";
const FOLD = 340;

let gtag: Gtag | null = null;
// Whether the visitor allowed counting, on this page: set as GA loads, cleared on a "no".
let allowed = false;

const stored = () => tryCatchSync(() => localStorage.getItem(KEY))[1];

/** Takes the UTM tags out of the page's address, keeping the rest of it. */
function untag() {
  const address = new URL(location.href);
  const tags = [...address.searchParams.keys()].filter(key => key.startsWith("utm_"));

  if (tags.length) {
    tags.forEach(key => address.searchParams.delete(key));
    history.replaceState(history.state, "", address);
  }
}

/**
 * Turns GA's own switch: off, it sends nothing at all, its enhanced measurement (scrolls,
 * outbound links) included, even once its script has loaded.
 *
 * @param on - Whether counting is allowed
 */
function counting(on: boolean) {
  allowed = on;
  (window as unknown as Record<string, boolean>)[`ga-disable-${id}`] = !on;
}

/** Loads Google's script and starts counting, or starts again after a "no". */
function load() {
  if (!id) {
    return;
  }

  counting(true);

  if (gtag) {
    gtag("consent", "update", { analytics_storage: "granted" });
    untag();

    return;
  }

  const w = window as unknown as { dataLayer: unknown[]; gtag: Gtag };

  w.dataLayer = w.dataLayer || [];
  // gtag.js reads the arguments object itself, so it must be pushed as is.
  w.gtag = function () {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer.push(arguments);
  };
  gtag = w.gtag;
  gtag("consent", "default", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  gtag("js", new Date());
  // The address as it is now, tags and all: GA reads its source from it once its
  // script has loaded, and by then the tags are gone from the address bar.
  gtag("config", id, { site_version: banner?.dataset.version ?? "", page_location: location.href });

  const script = document.createElement("script");

  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.append(script);
  untag();
}

/**
 * Counts an event, if the visitor allowed it.
 *
 * @param name - The event's name
 * @param params - What to record with it
 */
export function track(name: string, params: Record<string, string> = {}) {
  if (allowed) {
    gtag?.("event", name, params);
  }
}

/**
 * Records the visitor's answer and acts on it.
 *
 * @param answer - "granted" or "denied"
 */
function answer(answer: string) {
  tryCatchSync(() => localStorage.setItem(KEY, answer));
  fold();

  if (answer === "granted") {
    load();

    return;
  }

  stop();
}

/** Stops counting, as when consent is withdrawn, and removes what GA stored. */
function stop() {
  gtag?.("consent", "update", { analytics_storage: "denied" });
  counting(false);
  untag();
  document.cookie.split(";").map(c => c.split("=")[0]!.trim()).filter(name => name.startsWith("_ga")).forEach((name) => {
    document.cookie = `${name}=; Max-Age=0; path=/; domain=.${location.hostname}`;
    document.cookie = `${name}=; Max-Age=0; path=/`;
  });
}

/** Folds the note away, then hides it. */
function fold() {
  if (!banner || banner.hidden) {
    return;
  }

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    banner.hidden = true;
    room(false);

    return;
  }

  banner.classList.add("is-closing");
  window.setTimeout(() => {
    // Asked again while folding: it stays.
    if (banner.classList.contains("is-closing")) {
      banner.classList.remove("is-closing");
      banner.hidden = true;
      room(false);
    }
  }, FOLD);
}

/**
 * Makes room at the page's foot for the note while it shows, and keeps focus clear of
 * it; or takes both back.
 *
 * @param open - Whether the note shows
 */
function room(open: boolean) {
  const root = document.documentElement;

  if (open && banner) {
    root.style.setProperty("--consent-room", `${Math.ceil(banner.getBoundingClientRect().height) + 32}px`);
    document.addEventListener("focusin", clear);
  }
  else {
    root.style.removeProperty("--consent-room");
    document.removeEventListener("focusin", clear);
  }
}

/**
 * Keeps what the keyboard moves to in sight: whatever lands under the note, where the
 * page stands behind it, is scrolled up clear of it. Measured once the browser has
 * scrolled it into the window itself.
 *
 * @param event - The focus moving
 */
function clear(event: FocusEvent) {
  const target = event.target;

  // Behind an open list or dialog, the note is out of sight (global.css).
  if (!banner || banner.hidden || banner.inert || !(target instanceof Element) || banner.contains(target) || target.closest("dialog")) {
    return;
  }

  requestAnimationFrame(() => {
    const note = banner.getBoundingClientRect();
    const box = target.getBoundingClientRect();

    if (box.bottom > note.top && box.top < note.bottom && box.right > note.left && box.left < note.right) {
      window.scrollBy({ top: box.bottom - note.top + 16, behavior: "instant" });
    }
  });
}

/**
 * Unfolds the note.
 *
 * @param focus - Whether to move focus to it, as when asked from the command menu
 */
function show(focus = false) {
  if (!banner) {
    return;
  }

  banner.classList.remove("is-closing");
  banner.hidden = false;
  room(true);

  if (focus) {
    banner.querySelector<HTMLButtonElement>("[data-consent]")?.focus();
  }
}

/**
 * Waits until the page has finished loading and playing its entrance, so the question
 * never cuts in on either.
 *
 * @returns Once the page has settled
 */
async function settled(): Promise<void> {
  const root = document.documentElement;
  const loaded = document.readyState === "complete"
    ? Promise.resolve()
    : new Promise<void>(resolve => window.addEventListener("load", () => resolve(), { once: true }));
  const playing = () => root.dataset.rv === "pre" || root.dataset.rv === "run";
  const entrance = new Promise<void>((resolve) => {
    if (!playing()) {
      resolve();

      return;
    }

    const observer = new MutationObserver(() => {
      if (!playing()) {
        observer.disconnect();
        resolve();
      }
    });

    observer.observe(root, { attributeFilter: ["data-rv"] });
    // An entrance waiting on lines further down the page asks no longer than this.
    window.setTimeout(() => {
      observer.disconnect();
      resolve();
    }, 9000);
  });

  await Promise.all([loaded, entrance]);
  await new Promise(resolve => window.setTimeout(resolve, 900));
}

/** Asks again, from the command menu. */
export function askConsent() {
  show(true);
}

if (banner && id) {
  banner.querySelectorAll<HTMLButtonElement>("[data-consent]").forEach((button) => {
    button.addEventListener("click", () => answer(button.dataset.consent ?? "denied"));
  });

  // A page prerendered ahead of a click counts, and asks, only once it is shown.
  const start = () => {
    const decided = stored();

    if (decided === "granted") {
      load();
    }
    else if (decided === "denied") {
      untag();
    }
    else {
      settled().then(() => {
        // Answered meanwhile, from the command menu.
        if (!stored()) {
          show();
        }
      });
    }
  };

  if ((document as Document & { prerendering?: boolean }).prerendering) {
    document.addEventListener("prerenderingchange", start, { once: true });
  }
  else {
    start();
  }

  // A page put back from the browser's back/forward cache, after the question was
  // answered on another page: it no longer asks, and counts only if that was allowed,
  // GA's script there included.
  addEventListener("pageshow", (event) => {
    const decided = stored();

    if (!event.persisted || !decided) {
      return;
    }

    banner.hidden = true;
    room(false);

    if (decided === "granted") {
      load();
    }
    else {
      stop();
    }
  });

  // What is counted, besides page views.
  document.addEventListener("click", (event) => {
    const link = (event.target as Element).closest("a");
    const project = link && /\/projects\/([^/]+)\/$/.exec(new URL(link.href, location.href).pathname)?.[1];

    if (project) {
      track("select_content", { content_type: "project", item_id: project });
    }

    // From the home page, the CV page or the command menu (its items are links too).
    if (link?.hasAttribute("download") && link.pathname.endsWith("/resume.pdf")) {
      track("cv_download", { method: link.closest(".ck") ? "menu" : "link" });
    }

    // A link to write an email (data-email), which opens it through its short link.
    if (link?.hasAttribute("data-email")) {
      track("email_write", { method: "link" });
    }
    // Any other short link: a profile, a project's code or its live site.
    else if (link?.hostname === "to.ouss.es") {
      track("short_link", { slug: link.pathname.replace(/^\/|\/$/g, ""), method: link.closest(".ck") ? "menu" : "link" });
    }

    // Picking the language the page is already in changes nothing (site.ts).
    if (link?.dataset.langLink && link.dataset.langLink !== document.documentElement.dataset.lang) {
      track("language_change", { language: link.dataset.langLink });
    }
  }, true);

  addEventListener("beforeprint", () => track("page_print"));

  // Only a theme that changed: the system turning dark sets "auto" over "auto".
  let theme = document.documentElement.dataset.theme ?? "";

  new MutationObserver(() => {
    const now = document.documentElement.dataset.theme ?? "";

    if (now !== theme) {
      theme = now;
      track("theme_change", { theme });
    }
  }).observe(document.documentElement, { attributeFilter: ["data-theme"] });
}
