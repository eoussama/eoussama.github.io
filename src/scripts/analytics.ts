import { tryCatchSync } from "@eoussama/core";



/*
 * Google Analytics 4, after consent. Nothing loads until the visitor allows it; ads
 * signals stay off either way. Counted: page views, each with the version of the site
 * seen (site_version, as the archived versions send too), project opens, language and
 * theme changes, plus GA's own outbound links and downloads.
 */

type Gtag = (...args: unknown[]) => void;

const banner = document.querySelector<HTMLElement>("#consent");
const id = banner?.dataset.ga ?? "";
const KEY = "consent";
const FOLD = 340;

let gtag: Gtag | null = null;

const stored = () => tryCatchSync(() => localStorage.getItem(KEY))[1];

/** Loads Google's script and starts counting. */
function load() {
  if (gtag || !id) {
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
  gtag("config", id, { site_version: banner?.dataset.version ?? "" });

  const script = document.createElement("script");

  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.append(script);
}

/**
 * Counts an event, if the visitor allowed it.
 *
 * @param name - The event's name
 * @param params - What to record with it
 */
export function track(name: string, params: Record<string, string> = {}) {
  gtag?.("event", name, params);
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

  // Withdrawn: stop counting and remove what was stored.
  gtag?.("consent", "update", { analytics_storage: "denied" });
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

    return;
  }

  banner.classList.add("is-closing");
  window.setTimeout(() => {
    // Asked again while folding: it stays.
    if (banner.classList.contains("is-closing")) {
      banner.classList.remove("is-closing");
      banner.hidden = true;
    }
  }, FOLD);
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
    else if (decided !== "denied") {
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

  // What is counted, besides page views.
  document.addEventListener("click", (event) => {
    const link = (event.target as Element).closest("a");
    const project = link && /\/projects\/([^/]+)\/$/.exec(new URL(link.href, location.href).pathname)?.[1];

    if (project) {
      track("select_content", { content_type: "project", item_id: project });
    }

    // Picking the language the page is already in changes nothing (site.ts).
    if (link?.dataset.langLink && link.dataset.langLink !== document.documentElement.dataset.lang) {
      track("language_change", { language: link.dataset.langLink });
    }
  }, true);

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
