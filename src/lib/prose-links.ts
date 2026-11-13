import type { AstroIntegration } from "astro";

import { keepFrom } from "./tail";



/**
 * Links in posts, made to read as the site's own:
 *
 * - A link that leaves the site does what Ext.astro's do: it opens in a new tab, ends
 *   in the arrow that nudges out on hover, keeps its last word on one line with it,
 *   and tells screen readers it opens a new tab.
 * - A heading is a link to itself, as the margin headings are, showing a "#" on hover.
 *
 * Posts are written in English, so the words for screen readers are too.
 *
 * Astro renders Markdown with Sätteri, whose plugins visit the tree's elements by tag;
 * these are added to it as an integration, so they need no package of their own.
 */

type Text = { type: "text"; value: string };
type Element = { type: "element"; tagName: string; properties: Record<string, unknown>; children: Node[] };
type Node = Text | Element | { type: string };

const HINT = " (opens in a new tab)";
const ANCHOR = ", link to this section";

/**
 * Builds an element.
 *
 * @param tagName - Its tag
 * @param properties - Its attributes
 * @param children - What it holds
 * @returns The element
 */
function h(tagName: string, properties: Record<string, unknown>, children: Node[] = []): Element {
  return { type: "element", tagName, properties, children };
}

/**
 * The arrow, drawn as Ext.astro draws it.
 *
 * @returns The arrow's svg
 */
function arrow(): Element {
  return h("svg", { className: ["arrow"], width: 11, height: 11, viewBox: "0 0 11 11", ariaHidden: "true" }, [
    h("path", { d: "M2.5 8.5l6-6M3.5 2.5h5v5", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" }),
  ]);
}

/**
 * Whether an address leaves the site.
 *
 * @param href - The address
 * @param site - The site's own address
 * @returns True for an http(s) address on another host
 */
function leaves(href: unknown, site: string): boolean {
  if (typeof href !== "string" || !/^https?:\/\//i.test(href)) {
    return false;
  }

  return new URL(href).origin !== new URL(site).origin;
}

/**
 * A link's children with the arrow added, the last word of the text kept beside it,
 * and the hint for screen readers.
 *
 * @param children - The link's children
 * @returns The new children
 */
function decorated(children: readonly Node[]): Node[] {
  const out = [...children];
  const last = out.at(-1);
  let end: Node = arrow();

  if (last?.type === "text") {
    const { value } = last as Text;
    const word = Math.max(value.search(/\S+\s*$/), 0);
    const cut = word + keepFrom(value.slice(word).trimEnd());

    out.pop();

    if (cut > 0) {
      out.push({ type: "text", value: value.slice(0, cut) });
    }

    end = h("span", { className: ["ext-tail"] }, [{ type: "text", value: value.slice(cut).trimEnd() }, arrow()]);
  }

  return [...out, end, h("span", { className: ["sr"] }, [{ type: "text", value: HINT }])];
}

/**
 * A node's text, as a reader sees it.
 *
 * @param node - The node
 * @returns Its text
 */
function text(node: Node): string {
  if (node.type === "text") {
    return (node as Text).value;
  }

  return "children" in node ? (node as Element).children.map(text).join("") : "";
}

/**
 * Whether a node holds a link, which a heading's own link cannot wrap.
 *
 * @param node - The node
 * @returns True when a link is inside
 */
function hasLink(node: Node): boolean {
  return node.type === "element" && ((node as Element).tagName === "a" || (node as Element).children.some(hasLink));
}

/**
 * Turns a heading's words into its address, as GitHub does and as Astro would have:
 * lowercased, punctuation dropped, spaces turned to hyphens, and a number added when
 * the same words came before.
 *
 * @param words - The heading's text
 * @param taken - The addresses already given in this document
 * @returns The address
 */
function slug(words: string, taken: Map<string, number>): string {
  const base = words.toLowerCase().replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, "").replace(/ /g, "-");
  let id = base;
  let n = taken.get(base) ?? 0;

  while (taken.has(id)) {
    n += 1;
    id = `${base}-${n}`;
  }

  taken.set(base, n);
  taken.set(id, 0);

  return id;
}

/**
 * Makes each heading a link to itself. The addresses are given here, before Astro's
 * own step would give them, so the link and the heading agree; Astro keeps an address
 * that is already there.
 *
 * @returns A fresh plugin for one document
 */
function headingLinks() {
  const taken = new Map<string, number>();

  return {
    name: "heading-links",
    element: {
      filter: ["h2", "h3", "h4", "h5", "h6"],
      visit(node: Readonly<Element>): Element | void {
        const words = text(node).trim();

        if (!words || node.children.some(hasLink)) {
          return;
        }

        const id = typeof node.properties?.id === "string" ? node.properties.id : slug(words, taken);

        return {
          ...node,
          properties: { ...node.properties, id },
          children: [h("a", { className: ["anchor"], href: `#${id}`, ariaLabel: words + ANCHOR }, [...node.children])],
        };
      },
    },
  };
}

/**
 * Lets the keyboard reach a table: on a narrow screen a wide one scrolls sideways
 * within its box, and a box that scrolls has to take focus to be scrolled without a
 * pointer, as the code blocks already do.
 */
const scrollableTables = {
  name: "scrollable-tables",
  element: {
    filter: ["table"],
    visit(node: Readonly<Element>): Element {
      return { ...node, properties: { ...node.properties, tabIndex: 0 } };
    },
  },
};

/**
 * The integration that adds the plugins to Astro's Markdown processor.
 *
 * @param site - The site's own address, such as https://ouss.es
 * @returns The integration
 */
export default function proseLinks(site: string): AstroIntegration {
  const external = {
    name: "external-links",
    element: {
      filter: ["a"],
      visit(node: Readonly<Element>): Element | void {
        if (!leaves(node.properties?.href, site)) {
          return;
        }

        const classes = [node.properties.className ?? []].flat() as string[];

        return {
          ...node,
          properties: { ...node.properties, className: [...classes, "ext"], target: "_blank", rel: ["noopener", "noreferrer"] },
          children: decorated(node.children),
        };
      },
    },
  };

  return {
    name: "prose-links",
    hooks: {
      "astro:config:setup": ({ config }) => {
        const processor = config.markdown.processor as { name: string; options: { hastPlugins: unknown[] } } | undefined;

        if (processor?.name !== "satteri") {
          throw new Error("prose-links: Markdown is no longer rendered by Sätteri; port the plugin.");
        }

        processor.options.hastPlugins.push(external, headingLinks, scrollableTables);
      },
    },
  };
}
