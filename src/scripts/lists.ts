/*
 * The two lists, every project and every post, are pages of their own (ListPage.astro).
 * The list drawer and the command menu take them from small files beside those pages
 * (ListPart.astro), rather than every page carrying both, or the pages themselves, which
 * are mostly their styles: each list's items, which both show, and its filters, which
 * only the drawer does. A part is fetched the first time a visitor shows they are about
 * to want it (scripts/lazy.ts), once a page, and what it holds is kept. The browser's
 * cache keeps the file itself for the pages after.
 */

export type List = "work" | "writing";

export type Part = "items" | "filters";

/** What the drawer puts in a list's sheet. */
export type Parts = {
  /** The list, its items marked with what the search and the filters read. */
  items: HTMLUListElement;
  /** The drawer's filter button and menu, from a template: empty for a list with nothing to filter. */
  filters: DocumentFragment;
};

const drawer = document.querySelector<HTMLElement>("#drawer");
const asked = { items: new Map<List, Promise<HTMLUListElement>>(), filters: new Map<List, Promise<DocumentFragment>>() };
/** The parts that could not be fetched, as "work items". */
const failed = new Set<string>();

/**
 * A list's page, in the page's language.
 *
 * @param list - The list
 * @returns Its address
 */
export function listPage(list: List): string {
  return drawer?.dataset[list === "work" ? "srcWork" : "srcWriting"] ?? "";
}

/**
 * Whether a list, or one part of it, could not be fetched, the last time it was asked
 * for: its links then lead to its page.
 *
 * @param list - The list
 * @param part - The part, or none for any of them
 * @returns True when it failed
 */
export function listFailed(list: List, part?: Part): boolean {
  return (part ? [part] : ["items", "filters"]).some(name => failed.has(`${list} ${name}`));
}

/**
 * Asks for a part of a list: or takes the answer to the page's own ask, for a page
 * opened with ?list=…, whose head asked for its list's parts with its first bytes
 * (Base.astro). That one is taken once; asked again, after a failure, the part is
 * fetched anew.
 *
 * @param list - The list
 * @param part - The part
 * @returns The answer
 */
function request(list: List, part: Part): Promise<Response> {
  const early = (window as Window & { listAsked?: { list: List } & Partial<Record<Part, Promise<Response>>> }).listAsked;
  const response = early?.list === list ? early[part] : undefined;

  if (early && response) {
    delete early[part];

    return response;
  }

  return fetch(`${drawer?.dataset[list === "work" ? "partsWork" : "partsWriting"] ?? ""}${part}/`);
}

/**
 * Fetches a part of a list and finds in it what the drawer and the menu need.
 *
 * @param list - The list
 * @param part - The part
 * @param selector - What to find in it
 * @returns What was found, still in the fetched file
 */
async function fetchPart<T extends Element>(list: List, part: Part, selector: string): Promise<T> {
  const response = await request(list, part);

  if (!response.ok) {
    throw new Error(`The list's ${part} answered ${response.status}.`);
  }

  const found = new DOMParser().parseFromString(await response.text(), "text/html").querySelector<T>(selector);

  if (!found) {
    throw new Error(`The list's ${part} are not in their file.`);
  }

  return found;
}

/**
 * A part of a list, fetched once and kept. One that failed is asked for again the next
 * time, and counts as failed until it comes.
 *
 * @param list - The list
 * @param part - The part
 * @param kept - Where that part is kept, for each list
 * @param get - What fetches it
 * @returns It, once it is here
 */
function keep<T>(list: List, part: Part, kept: Map<List, Promise<T>>, get: () => Promise<T>): Promise<T> {
  let got = kept.get(list);

  if (!got) {
    got = get();
    kept.set(list, got);
    got.then(() => failed.delete(`${list} ${part}`), () => {
      kept.delete(list);
      failed.add(`${list} ${part}`);
    });
  }

  return got;
}

/**
 * A list's items, for the command menu, which needs nothing else of it.
 *
 * @param list - The list
 * @returns Them, once they are here
 */
export function loadItems(list: List): Promise<HTMLUListElement> {
  return keep(list, "items", asked.items, async () => document.importNode(await fetchPart<HTMLUListElement>(list, "items", `[data-dr-list="${list}"]`), true));
}

/**
 * A list's items and filters, for the drawer, asked for together.
 *
 * @param list - The list
 * @returns Its parts, once both are here
 */
export async function loadList(list: List): Promise<Parts> {
  const filters = keep(list, "filters", asked.filters, async () => document.importNode((await fetchPart<HTMLTemplateElement>(list, "filters", `template[data-dr-filters="${list}"]`)).content, true));
  const [items, menu] = await Promise.all([loadItems(list), filters]);

  return { items, filters: menu };
}
