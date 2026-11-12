import type { AstroIntegration } from "astro";



/**
 * Links in a post that leave the site read as the site's own do (see Ext.astro): they
 * open in a new tab, end in the arrow that nudges out on hover, keep their last word
 * on one line with it, and tell screen readers they open a new tab. Posts are written
 * in English, so the hint is too.
 *
 * Astro renders Markdown with Sätteri, whose plugins visit the tree's elements by tag;
 * this one is added to it as an integration, so it needs no package of its own.
 */

type Text = { type: "text"; value: string };
type Element = { type: "element"; tagName: string; properties: Record<string, unknown>; children: Node[] };
type Node = Text | Element | { type: string };

const HINT = " (opens in a new tab)";

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
    const cut = Math.max(value.search(/\S+\s*$/), 0);

    out.pop();

    if (cut > 0) {
      out.push({ type: "text", value: value.slice(0, cut) });
    }

    end = h("span", { className: ["ext-tail"] }, [{ type: "text", value: value.slice(cut).trimEnd() }, arrow()]);
  }

  return [...out, end, h("span", { className: ["sr"] }, [{ type: "text", value: HINT }])];
}

/**
 * The integration that adds the plugin to Astro's Markdown processor.
 *
 * @param site - The site's own address, such as https://ouss.es
 * @returns The integration
 */
export default function externalLinks(site: string): AstroIntegration {
  const plugin = {
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
    name: "external-links",
    hooks: {
      "astro:config:setup": ({ config }) => {
        const processor = config.markdown.processor as { name: string; options: { hastPlugins: unknown[] } } | undefined;

        if (processor?.name !== "satteri") {
          throw new Error("external-links: Markdown is no longer rendered by Sätteri; port the plugin.");
        }

        processor.options.hastPlugins.push(plugin);
      },
    },
  };
}
