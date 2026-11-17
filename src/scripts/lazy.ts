import type { List } from "./lists";

import { syncLanguageLinks } from "./languages";
import { listFailed, listPage, loadItems, loadList } from "./lists";
import { closeNote, openNote } from "./note";



/*
 * What most visits never use, loaded the first time it is wanted: the list drawer, the
 * command menu and the signature's pen. Here are only the links, keys and buttons that
 * open them, which every page needs from the start. Each part's code, and the lists
 * the drawer and the menu show, are fetched as soon as a visitor heads for one (the
 * pointer over its link or button, focus on it, the first key of a shortcut), so that
 * they are usually there by the time it opens.
 */

const root = document.documentElement;

/**
 * Loads a module once, and again after a failure (offline, say).
 *
 * @param load - What imports it
 * @returns What loads it, or hands it over once loaded
 */
function once<T>(load: () => Promise<T>): () => Promise<T> {
  let module: Promise<T> | null = null;

  return () => {
    module ??= load().catch((error: unknown) => {
      module = null;
      throw error;
    });

    return module;
  };
}

/* ---------- The list drawer ---------- */

const drawer = once(() => import("./drawer"));
let drawerIn = false;
/** The opening under way before the drawer's code is in, if any: Escape can take it back. */
let opening: object | null = null;

const sheet = document.querySelector<HTMLElement>("#drawer");

if (sheet) {
  /**
   * Gets a list ready to open: the drawer's code, and the list itself with its filters,
   * put in place. They are all asked for together.
   *
   * @param list - The list
   * @returns The drawer's code, once it is here
   */
  const ready = (list?: List) => {
    if (list) {
      loadList(list).catch(() => {});
    }

    const loaded = drawer();

    loaded.then((module) => {
      drawerIn = true;

      if (list) {
        module.prepare(list);
      }
    }, () => {});

    return loaded;
  };

  /**
   * Opens a list, or switches or closes it, through the drawer's code. The first time,
   * before that code is here, the sheet starts sliding in at once, as it does for an
   * address with ?list= (Base.astro): the code then opens it in the same frame, and the
   * slide goes on as if it had all along. If the code can't be had, the list is put
   * away, and the fallback runs.
   *
   * @param list - The list asked for, or "" to close
   * @param act - What the drawer does, once its code is here
   * @param fallback - What happens instead without it
   */
  const go = (list: List | "", act: (module: typeof import("./drawer")) => void, fallback: () => void) => {
    const early = !drawerIn && !!list && !root.dataset.open;
    const mine = {};

    if (early) {
      root.dataset.open = list;
      sheet.dataset.list = list;
      opening = mine;
    }

    // Whether this opening still stands: Escape may have taken it back meanwhile.
    const settle = () => {
      if (!early) {
        return true;
      }

      if (opening !== mine) {
        return false;
      }

      opening = null;
      delete root.dataset.open;

      return true;
    };

    ready(list || undefined).then((module) => {
      if (settle()) {
        act(module);
      }
    }, () => {
      if (settle()) {
        fallback();
      }
    });
  };

  // Escape, while the sheet slides in ahead of its code, takes the opening back, as it
  // would close the drawer once open. Not while the command menu is open: it closes that.
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && opening && !document.querySelector(".ck[open]")) {
      event.preventDefault();
      opening = null;
      delete root.dataset.open;
    }
  });

  // A list's link opens it in place, unless it could not be fetched: then it leads to
  // the list's page. A click with a modifier key still opens that page in a new tab.
  document.addEventListener("click", (event) => {
    const target = event.target as Element;
    const link = target.closest<HTMLAnchorElement>("a[data-drawer]");

    if (target.closest("[data-drawer-close]")) {
      event.preventDefault();
      ready().then(module => module.close(), () => {});

      return;
    }

    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0 || listFailed(link.dataset.drawer as List)) {
      return;
    }

    event.preventDefault();
    go(link.dataset.drawer as List, module => module.follow(link), () => location.assign(link.href));
  });

  // The P and W shortcuts (keys.ts), and H closing the list on the home page.
  document.addEventListener("drawer:toggle", (event) => {
    const list = (event as CustomEvent<string>).detail as List | "";

    if (list && listFailed(list) && !root.dataset.open) {
      location.assign(listPage(list));

      return;
    }

    go(list, module => module.toggle(list), () => list && location.assign(listPage(list)));
  });

  // Back or Forward to an address with a list, before the drawer was ever needed here.
  // Once it is in, it follows the address itself.
  addEventListener("popstate", () => {
    if (!drawerIn && new URLSearchParams(location.search).has("list")) {
      ready().then(module => module.sync(), () => {});
    }
  });

  // A page opened with ?list=…: its head already showed the drawer, put the page out of
  // reach, and asked for the list (Base.astro). Without the drawer's code nothing could
  // close it again: it is put away, and the address left without the list.
  if (root.dataset.open) {
    ready(root.dataset.open as List).catch(() => {
      const address = new URLSearchParams(location.search);
      const keys = [...sheet.querySelectorAll<HTMLElement>(".dr-sheet")].flatMap(part => (part.dataset.keys ?? "").split(" "));

      ["list", "q", ...keys].forEach(key => address.delete(key));
      delete root.dataset.open;
      sheet.inert = true;
      document.querySelectorAll<HTMLElement>(".page").forEach(page => page.inert = false);

      const query = address.toString();

      history.replaceState(history.state, "", `${location.pathname}${query ? `?${query}` : ""}${location.hash}`);
      syncLanguageLinks();
    });
  }

  /**
   * A visitor heading for a list: its link pointed at, touched or reached with the
   * keyboard.
   *
   * @param event - Where they are headed
   */
  const toward = (event: Event) => {
    const link = (event.target as Element).closest?.<HTMLElement>("[data-drawer]");

    // A list that didn't come is not asked for again on the way past: its link leads to
    // its page now.
    if (link && !listFailed(link.dataset.drawer as List)) {
      ready(link.dataset.drawer as List).catch(() => {});
    }
  };

  // The P and W keys need nothing ahead: pressed, they open the list (above).
  document.addEventListener("pointerover", toward, { passive: true });
  document.addEventListener("focusin", toward);
}

/* ---------- The command menu ---------- */

const dialog = document.querySelector<HTMLDialogElement>("#palette");

if (dialog) {
  const menu = once(() => import("./palette"));
  const input = dialog.querySelector<HTMLInputElement>(".ck-q");
  let menuIn = false;

  /**
   * Gets the menu ready: its code, and the projects and posts it lists (their items
   * only: the filters are the drawer's).
   *
   * @returns The menu's code, once it is here
   */
  const ready = async () => {
    (["work", "writing"] as const).filter(list => !listFailed(list, "items")).forEach(list => loadItems(list).catch(() => {}));

    const module = await menu();

    menuIn = true;

    return module;
  };

  /**
   * Opens the menu, or closes it. The first time, before its code is in, it opens at
   * once with what the page holds: its pages, languages, themes and the rest, ready to
   * type in. Its code takes over as it arrives.
   */
  const toggle = () => {
    if (menuIn) {
      ready().then(module => module.toggle(), () => {});

      return;
    }

    if (dialog.open && !dialog.classList.contains("is-closing")) {
      closeNote(dialog);

      return;
    }

    const keys = document.querySelector<HTMLDialogElement>("#keys");

    if (keys) {
      closeNote(keys, true);
    }

    if (input && !dialog.open) {
      input.value = "";
    }

    // What had focus, for a list opened from the menu to hand it back to, as the menu's
    // code marks it from then on (palette.ts).
    if (!dialog.open) {
      const from = document.activeElement;

      document.querySelector("[data-menu-from]")?.removeAttribute("data-menu-from");

      if (from instanceof HTMLElement && from !== document.body) {
        from.dataset.menuFrom = "";
      }
    }

    openNote(dialog);
    input?.focus();
    // Closed again meanwhile, it stays closed.
    ready().then(module => dialog.open && module.open(), () => {});
  };

  document.addEventListener("click", (event) => {
    if ((event.target as Element).closest("[data-palette-open]")) {
      toggle();
    }
  });

  document.addEventListener("keydown", (event) => {
    // K by its letter, or by where it sits on a keyboard that types another there
    // (Arabic's ن), as the single-key shortcuts do (keys.ts).
    const k = /^[a-z]$/i.test(event.key) ? event.key.toLowerCase() === "k" : event.code === "KeyK";

    // ⌘ or Ctrl, held down: K may well come next.
    if (event.key === "Meta" || event.key === "Control") {
      menu().catch(() => {});
    }

    if ((event.metaKey || event.ctrlKey) && k) {
      event.preventDefault();
      toggle();
    }
  });

  const toward = (event: Event) => {
    if ((event.target as Element).closest?.("[data-palette-open]")) {
      ready().catch(() => {});
    }
  };

  document.addEventListener("pointerover", toward, { passive: true });
  document.addEventListener("focusin", toward);
}

/* ---------- The signature, signed again ---------- */

const sig = document.querySelector<HTMLElement>(".sig");
/** How long a finger rests on it before it signs again, in milliseconds. */
const HOLD = 550;

if (sig && "animate" in Element.prototype) {
  const pen = once(() => import("./sign"));
  const sign = () => {
    pen().then(module => module.sign(sig), () => {});
  };

  sig.addEventListener("pointerover", () => pen().catch(() => {}), { passive: true });
  sig.addEventListener("dblclick", sign);

  // A long press, for a finger: held still on it for a moment.
  let hold = 0;
  let at: [number, number] | null = null;

  sig.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse") {
      return;
    }

    at = [event.clientX, event.clientY];
    hold = window.setTimeout(sign, HOLD);
  });
  sig.addEventListener("pointermove", (event) => {
    if (at && Math.hypot(event.clientX - at[0], event.clientY - at[1]) > 10) {
      clearTimeout(hold);
    }
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach(type => sig.addEventListener(type, () => clearTimeout(hold)));
}
