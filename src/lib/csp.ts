import type { AstroIntegration } from "astro";

import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";



/*
 * The site's Content Security Policy: what its pages may run and load. GitHub Pages sends
 * no headers of the site's own, so the policy rides in each page instead, as a <meta>
 * at the top of its head, after the charset (which has to be in the first bytes) and
 * before anything it governs. It is written once the pages are built, the same for all
 * of them, as the site is plain pages: a visitor moving through it keeps one policy.
 *
 * The scripts a page carries itself run only by their hash, and each of the site's is
 * hashed here, as built. That keeps them few: a script whose text changed from page to
 * page would need a hash for every page, so each takes its page's values from data-*
 * attributes instead (Base.astro), and a build with more than MAX_SCRIPTS of them
 * fails rather than let the policy grow without anyone deciding it should. The page's
 * own <style> is hashed too; its style="" attributes (the code's colours, the
 * entrance's timings) are allowed as they are.
 *
 * The build has parts of pages too, beside the pages: files with no <html> of their own,
 * which a page's scripts fetch and put in it (the lists' items and filters,
 * components/ListPart.astro). What a page takes in is governed by its own policy; the
 * part, opened by itself, runs nothing, so it carries none, and must not need one: a
 * part that holds a script, a style or anything else that runs or loads fails the build,
 * and so does one without a noindex, which keeps it out of search, as a page that lost
 * its <html> would be.
 *
 * Not in `astro dev`, whose pages are put together in other ways; `astro preview` shows
 * the policy as the site has it.
 */

/** How many different scripts the site may carry inline, before the build fails (11 today). */
const MAX_SCRIPTS = 16;

/** And different <style> elements, as its styles are inlined (astro.config.ts). */
const MAX_STYLES = 4;

/**
 * What a <script> runs as, by its type, for a policy: every script type a browser
 * executes, the old ones included, and the two that are not code but are governed like
 * it (an import map and speculation rules need their hash too).
 */
const RUN = new Set([
  "",
  "module",
  "speculationrules",
  "importmap",
  "text/javascript application/javascript text/ecmascript application/ecmascript",
  "application/x-javascript text/x-javascript application/x-ecmascript text/x-ecmascript text/jscript text/livescript",
  "text/javascript1.0 text/javascript1.1 text/javascript1.2 text/javascript1.3 text/javascript1.4 text/javascript1.5",
].flatMap(types => types.split(" ")));

/** Types that are data, never run, and so need no hash. Any other type fails the build. */
const DATA = new Set(["application/ld+json", "application/json"]);

/** Attributes that take an address, where a javascript: one would run. */
const URLS = new Set(["href", "src", "action", "formaction", "xlink:href", "poster", "data"]);

/** Elements whose contents are text, not markup, to the browser's reader. */
const TEXT = new Set(["script", "style", "textarea", "title", "xmp", "iframe", "noembed", "noframes"]);

/** Elements that run, load or style something: none of them may be in a part of a page, which has no policy. */
const LOADS = new Set(["script", "style", "link", "base", "iframe", "frame", "object", "embed", "form"]);

/** A space between a tag's parts, as HTML counts them. */
const SPACE = /[\t\n\f\r ]/;

/**
 * Google Analytics, without its ads features, as Google's guide to its tags and CSP
 * lists it. Only in a build with a measurement ID, and loaded only after consent
 * (scripts/analytics.ts).
 */
const GA = {
  script: ["https://www.googletagmanager.com"],
  img: ["https://www.googletagmanager.com", "https://*.google-analytics.com"],
  // *.analytics.google.com is where GA4 sends from the regions; *.google.com would be far wider.
  connect: ["https://www.googletagmanager.com", "https://*.google-analytics.com", "https://*.analytics.google.com"],
};

/**
 * A text's hash, as a policy names it. The browser hashes what it parsed, in which line
 * breaks are always \n.
 *
 * @param text - A script's or a style's text
 * @returns Its source expression
 */
function hash(text: string): string {
  return `'sha256-${createHash("sha256").update(text.replace(/\r\n?/g, "\n"), "utf8").digest("base64")}'`;
}

/** A start or end tag, as the browser reads it. */
interface Tag {
  name: string;
  closing: boolean;
  /** In order, the first of a repeated name being the one that counts. */
  attrs: [name: string, value: string][];
  start: number;
  end: number;
  /** What a script or a style holds. */
  text: string;
}

/**
 * The tags of a page, read as a browser reads them, not as a pattern guesses: comments
 * (`<!-->` is one), the text elements that hide what looks like a tag (a <textarea>,
 * a <script>), and attributes however they are spaced or quoted (`<img/onerror=x>`,
 * `<a href="x"onclick=y>`), a quoted value never taken for an attribute.
 *
 * @param html - A page
 * @param file - Its name, for errors
 * @returns Its tags, in order
 */
function tokenize(html: string, file: string): Tag[] {
  const tags: Tag[] = [];
  const letter = /[a-z]/i;
  let at = 0;

  for (let start = html.indexOf("<", at); start >= 0; start = html.indexOf("<", at)) {
    const next = html[start + 1] ?? "";

    if (html.startsWith("<!--", start)) {
      // "<!-->" and "<!--->" are whole comments; any other ends at "-->" or "--!>".
      const from = start + 4;
      const close = /--!?>/g;

      close.lastIndex = from;

      const found = close.exec(html);

      at = html[from] === ">" ? from + 1 : html.startsWith("->", from) ? from + 2 : found ? found.index + found[0].length : html.length;

      continue;
    }

    // A declaration, an instruction, or an end tag without a name: all comments.
    if (next === "!" || next === "?" || (next === "/" && !letter.test(html[start + 2] ?? ""))) {
      const end = html.indexOf(">", start + 2);

      at = end < 0 ? html.length : end + 1;

      continue;
    }

    const closing = next === "/";
    const from = start + (closing ? 2 : 1);

    if (!letter.test(html[from] ?? "")) {
      at = start + 1;

      continue;
    }

    let i = from;

    while (i < html.length && !SPACE.test(html[i]!) && html[i] !== "/" && html[i] !== ">") {
      i++;
    }

    const tag: Tag = { name: html.slice(from, i).toLowerCase(), closing, attrs: [], start, end: 0, text: "" };

    for (let done = false; !done;) {
      while (i < html.length && (SPACE.test(html[i]!) || html[i] === "/")) {
        i++;
      }

      if (i >= html.length) {
        throw new Error(`${file} has a tag that never ends: ${html.slice(start, start + 80)}`);
      }

      if (html[i] === ">") {
        i++;
        done = true;
        continue;
      }

      // The first character is part of the name, even an "=".
      const nameFrom = i++;

      while (i < html.length && !SPACE.test(html[i]!) && html[i] !== "/" && html[i] !== ">" && html[i] !== "=") {
        i++;
      }

      const name = html.slice(nameFrom, i).toLowerCase();
      let j = i;
      let value = "";

      while (j < html.length && SPACE.test(html[j]!)) {
        j++;
      }

      if (html[j] === "=") {
        j++;

        while (j < html.length && SPACE.test(html[j]!)) {
          j++;
        }

        const quote = html[j];

        if (quote === "\"" || quote === "'") {
          const end = html.indexOf(quote, j + 1);

          if (end < 0) {
            throw new Error(`${file} has a quote that never ends: ${html.slice(start, start + 80)}`);
          }

          value = html.slice(j + 1, end);
          i = end + 1;
        }
        else {
          let end = j;

          while (end < html.length && !SPACE.test(html[end]!) && html[end] !== ">") {
            end++;
          }

          value = html.slice(j, end);
          i = end;
        }
      }

      tag.attrs.push([name, value]);
    }

    tag.end = i;
    at = i;

    // What follows is text, up to the element's end, whatever it looks like.
    if (!closing && TEXT.has(tag.name)) {
      const end = new RegExp(`</${tag.name}(?=[${SPACE.source.slice(1, -1)}/>])`, "gi");

      end.lastIndex = i;

      const found = end.exec(html);

      tag.text = html.slice(i, found ? found.index : html.length);
      at = found ? found.index : html.length;
    }
    else if (!closing && tag.name === "plaintext") {
      at = html.length;
    }

    tags.push(tag);
  }

  return tags;
}

/**
 * A tag's attribute, as the browser takes it: the first of that name.
 *
 * @param tag - The tag
 * @param name - The attribute's name
 * @returns Its value, "" when it has none, or null when it isn't there
 */
function attr(tag: Tag, name: string): string | null {
  return tag.attrs.find(([key]) => key === name)?.[1] ?? null;
}

/** HTML's named characters that matter to an address; others cannot spell a scheme. */
const NAMED: Record<string, string> = { colon: ":", tab: "\t", newline: "\n", amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: "\u00A0", lpar: "(", rpar: ")" };

/**
 * An address as the browser reads it, to see where it goes: its character references
 * decoded ("&#106;avascript&colon;"), then the spaces and control characters it ignores
 * ("java&#9;script:") taken out.
 *
 * @param value - An attribute's value, as written
 * @returns The address, to compare
 */
function address(value: string): string {
  return value
    .replace(/&(?:#(\d+)|#x([\da-f]+)|([a-z][a-z\d]*));?/gi, (whole, dec?: string, hex?: string, name?: string) => {
      if (name) {
        return NAMED[name.toLowerCase()] ?? whole;
      }

      const code = dec ? Number(dec) : Number.parseInt(hex!, 16);

      return code <= 0x10FFFF ? String.fromCodePoint(code) : "\uFFFD";
    })
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0020\u007F]/g, "");
}

/**
 * Whether an address stays on the site's own origin.
 *
 * @param value - A script's src
 * @returns Whether it does
 */
function sameOrigin(value: string): boolean {
  const base = "https://site.invalid/";

  try {
    return new URL(address(value), base).origin === new URL(base).origin;
  }
  catch {
    return false;
  }
}

/**
 * Checks a part of a page, which carries no policy: that nothing in it runs or loads,
 * and that it keeps out of search.
 *
 * @param file - Its name, for errors
 * @param html - It
 * @param tags - Its tags
 */
function checkPart(file: string, html: string, tags: Tag[]) {
  const loads = tags.find(tag => !tag.closing && (LOADS.has(tag.name) || (tag.name === "meta" && attr(tag, "http-equiv") !== null)));

  if (loads) {
    throw new Error(`${file} is a part of a page (it has no <html>), which carries no security policy, so nothing in it may run or load: ${html.slice(loads.start, loads.end).slice(0, 200)}`);
  }

  const noindex = tags.some(tag => !tag.closing && tag.name === "meta" && (attr(tag, "name") ?? "").trim().toLowerCase() === "robots" && /\bnoindex\b/i.test(attr(tag, "content") ?? ""));

  if (!noindex) {
    throw new Error(`${file} has no <html>, as only a part of a page has, but no <meta name="robots" content="noindex">, which every part has: a page that lost its <html>?`);
  }
}

/**
 * The policy, for the scripts and styles the pages carry.
 *
 * @param scripts - Their scripts' hashes
 * @param styles - Their styles' hashes
 * @param analytics - Whether the site counts visits (with consent)
 * @returns The policy
 */
function policy(scripts: string[], styles: string[], analytics: boolean): string {
  const ga = (hosts: string[]) => (analytics ? hosts : []);

  return [
    "default-src 'self'",
    ["script-src 'self'", ...scripts, ...ga(GA.script)].join(" "),
    // Browsers that tell elements from attributes take the two lines after this one.
    "style-src 'self' 'unsafe-inline'",
    ["style-src-elem 'self'", ...styles].join(" "),
    "style-src-attr 'unsafe-inline'",
    // The CSS draws with SVGs written into it, and the Lakama rain's picture is one too.
    ["img-src 'self' data:", ...ga(GA.img)].join(" "),
    "font-src 'self'",
    ["connect-src 'self'", ...ga(GA.connect)].join(" "),
    "object-src 'none'",
    "frame-src 'none'",
    "worker-src 'none'",
    "base-uri 'none'",
    // Not upgrade-insecure-requests: the site asks for nothing over plain http, and
    // Safari would upgrade a preview's own files on http://localhost too, which then fail.
    "form-action 'none'",
  ].join("; ");
}

/**
 * Writes the policy into every page of the build.
 *
 * @returns The integration
 */
export default function csp(): AstroIntegration {
  return {
    name: "csp",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const files = (await readdir(root, { recursive: true })).filter(file => file.endsWith(".html"));
        const read = await Promise.all(files.map(async (file) => {
          const html = await readFile(join(root, file), "utf8");
          const tags = tokenize(html, file);

          return { file, html, tags, part: !tags.some(tag => !tag.closing && tag.name === "html") };
        }));
        const pages = read.filter(page => !page.part);
        const scripts = new Map<string, string>();
        const styles = new Map<string, string>();
        let analytics = false;

        for (const { file, html, tags, part } of read) {
          if (part) {
            checkPart(file, html, tags);
          }

          for (const tag of tags) {
            if (tag.closing) {
              continue;
            }

            // A handler or a javascript: link written into the page would not run: neither
            // has a hash to be allowed by.
            for (const [name, value] of tag.attrs) {
              if (/^on[a-z]/.test(name) || (URLS.has(name) && /^javascript:/i.test(address(value)))) {
                throw new Error(`${file} runs script from an attribute, which the security policy blocks: ${html.slice(tag.start, tag.end).slice(0, 200)}`);
              }
            }

            if (/^G-[A-Z0-9]+$/.test(attr(tag, "data-ga") ?? "")) {
              analytics = true;
            }

            if (tag.name === "style") {
              styles.set(hash(tag.text), styles.get(hash(tag.text)) ?? file);
            }

            if (tag.name !== "script") {
              continue;
            }

            const src = attr(tag, "src");

            if (src !== null) {
              // Only the site's own scripts load; the policy would block any other, quietly.
              if (!sameOrigin(src)) {
                throw new Error(`${file} loads a script from somewhere else, which the security policy blocks: ${src.slice(0, 200)}`);
              }

              continue;
            }

            // As the browser picks a script's type: its type, else its language, else JavaScript.
            const language = attr(tag, "language");
            const type = (attr(tag, "type") ?? (language ? `text/${language}` : "")).trim().toLowerCase();
            const essence = type.split(";")[0]!.trim();

            if (DATA.has(essence)) {
              continue;
            }

            if (!RUN.has(essence)) {
              throw new Error(`${file} has a script of type "${type}", which is neither one a browser runs nor a known data block (DATA in src/lib/csp.ts), so the security policy cannot say whether it runs: ${html.slice(tag.start, tag.end).slice(0, 200)}`);
            }

            // Past "<!--" and "<script", the browser reads on beyond this script's end tag.
            if (/<!--[\s\S]*<script/i.test(tag.text)) {
              throw new Error(`${file} has a script with "<!--" and "<script" in it, which the browser reads past its end tag: ${tag.text.slice(0, 200)}`);
            }

            scripts.set(hash(tag.text), scripts.get(hash(tag.text)) ?? file);
          }
        }

        const list = (found: Map<string, string>) => [...found].map(([source, file]) => `  ${source} (first in ${file})`).join("\n");

        if (scripts.size > MAX_SCRIPTS) {
          throw new Error(`The pages carry ${scripts.size} different inline scripts, more than the ${MAX_SCRIPTS} the security policy allows (MAX_SCRIPTS in src/lib/csp.ts). Usually one script's text changes from page to page: it should take its values from data-* attributes instead (see Base.astro). Raise the limit only for a script that really is new:\n${list(scripts)}`);
        }

        if (styles.size > MAX_STYLES) {
          throw new Error(`The pages carry ${styles.size} different <style> elements, more than the ${MAX_STYLES} the security policy allows (MAX_STYLES in src/lib/csp.ts). Usually one style's text changes from page to page, or the CSS is no longer inlined (astro.config.ts):\n${list(styles)}`);
        }

        const meta = `<meta http-equiv="Content-Security-Policy" content="${policy([...scripts.keys()], [...styles.keys()], analytics)}">`;

        await Promise.all(pages.map(({ file, html, tags }) => {
          const at = tags.find(tag => !tag.closing && tag.name === "meta" && attr(tag, "charset") !== null) ?? tags.find(tag => !tag.closing && tag.name === "head");

          if (!at) {
            throw new Error(`${file} has no <head> for the security policy.`);
          }

          // Only a real <meta>: the words in a <code> block are not a policy.
          const present = tags.some(tag => !tag.closing && tag.name === "meta" && (attr(tag, "http-equiv") ?? "").trim().toLowerCase() === "content-security-policy");

          if (present || tags.some(tag => !tag.closing && tag.start < at.end && ["script", "link", "style"].includes(tag.name))) {
            throw new Error(`${file} loads something, or has a policy, ahead of where the security policy goes.`);
          }

          return writeFile(join(root, file), html.slice(0, at.end) + meta + html.slice(at.end));
        }));

        logger.info(`Security policy written into ${pages.length} pages: ${scripts.size} inline scripts, ${styles.size} styles${analytics ? ", Google Analytics" : ""}. ${read.length - pages.length} parts of pages need none.`);
      },
    },
  };
}
