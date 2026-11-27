import { makeSheet } from "./sheet";



/*
 * A list's own page searched and filtered as the drawer's list is (sheet.ts), its list
 * the one already on the page. What is searched and picked is kept in the address, so
 * a list narrowed down can be linked to, and comes back with it:
 *
 *   /p/projects/?q=type&language=TypeScript
 *
 * The drawer takes the same parameters while it is open (?list=posts&q=...): the page
 * leaves the address be meanwhile, and takes nothing from one that opens the drawer.
 */

const element = document.querySelector<HTMLElement>(".lp-sheet");
const list = element?.querySelector<HTMLUListElement>(":scope > .dr-list");
const template = element?.querySelector<HTMLTemplateElement>("template[data-dr-filters]");

if (element && list && template) {
  const root = document.documentElement;
  const status = element.querySelector<HTMLElement>("[data-lp-status]");
  let saying = 0;
  let ready = false;

  const say = (text: string, after = 0) => {
    window.clearTimeout(saying);

    const put = () => {
      if (status && status.textContent !== text) {
        status.textContent = text;
      }
    };

    if (after) {
      saying = window.setTimeout(put, after);
    }
    else {
      put();
    }
  };

  const sheet = makeSheet(element, {
    words: element.dataset,
    say,
    save: () => {
      if (root.dataset.open) {
        return;
      }

      const next = new URLSearchParams(location.search);

      sheet.keys.forEach(key => next.delete(key));
      sheet.params().forEach(([key, value]) => next.append(key, value));

      const query = next.toString();

      history.replaceState(history.state, "", `${location.pathname}${query ? `?${query}` : ""}${location.hash}`);
    },
    // Said once the page is in: not, as it comes, how many the whole list holds.
    showing: () => ready,
  });
  const address = new URLSearchParams(location.search);

  if (!address.has("list")) {
    sheet.restore(address);
  }

  sheet.fill({ items: list, filters: template.content });
  ready = true;

  // Escape closes the filter menu; with it closed, it leaves the search or the filters,
  // keeping what was typed (a search field would clear itself first). Not while the
  // drawer or a dialog is open over the page: Escape closes those.
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || root.dataset.open || document.querySelector("dialog[open]")) {
      return;
    }

    const active = document.activeElement;

    if (sheet.closeMenu()) {
      event.preventDefault();
    }
    else if (active instanceof HTMLElement && element.contains(active) && active.closest(".dr-tools")) {
      event.preventDefault();
      active.blur();
    }
  });
}
