/**
 * Whether a link is short enough to be held on one line with the punctuation after it
 * (Glue.astro, prose-links.ts): its visible text, with Chinese and Japanese characters
 * counting twice as they are twice as wide, is at most this many characters, which fits
 * the narrowest phone's line with room to spare.
 */
const WIDTH = 22;

/**
 * Whether a link's HTML or text reads short.
 *
 * @param html - The link, as HTML or plain text
 * @returns True when it fits on a line with its punctuation
 */
export function short(html: string): boolean {
  // What only screen readers hear takes no room on the line.
  const seen = html.replace(/<span class="sr[^"]*">[^<]*<\/span>/g, "").replace(/<[^>]*>/g, "").trim();
  const wide = seen.match(/[\u3000-\u9FFF\uFF00-\uFFEF]/gu)?.length ?? 0;

  return [...seen].length + wide <= WIDTH;
}
