/*
 * A page's description for search engines and shared links: whole sentences, as many as
 * fit in the length search results show (about 160 characters). Widths are counted as
 * results draw them: a Japanese character is as wide as two Latin ones.
 */

const MAX = 160;
/** Shorter than this, a description says too little to stand on whole sentences alone. */
const MIN = 50;
/** Whole sentences that fill less of the length than this give way to whole words. */
const FILL = 90;

/** A sentence's end: a full stop, then a space or the end; or a Japanese or Arabic stop. */
const END = /(?<=[.!?…]["'”’»)]*)\s+|(?<=[。！？؟])/u;

/** Characters drawn two Latin characters wide: Japanese, Korean, Chinese, and full-width marks. */
const WIDE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}。、・ー「」！？（）：；，．]/u;

/** Words that cannot end a description, in the languages the site is written in. */
const DANGLING = new RegExp(`[\\s,;:–—(·-]+(?:${[
  "the a an in of and or to for with on at by from as that which is are its their this can will but so when who",
  "le la les de des du et à en un une",
  "el los las y del con por para",
  "il lo gli e di da per che",
  "في من على إلى مع ديال ف و",
].join(" ").split(" ").join("|")})$`, "iu");

/** Where a clause ends, for a cut to fall on. */
const CLAUSE = /[,;:،؛]/u;

/**
 * How wide a text is drawn, a Japanese character counting for two.
 *
 * @param text - The text
 * @returns Its width, in Latin characters
 */
function width(text: string): number {
  let sum = 0;

  for (const char of text) {
    sum += WIDE.test(char) ? 2 : 1;
  }

  return sum;
}

/**
 * Text cut to whole words, at a clause where one falls near the end, and never on a
 * word that needs the next: "the memes they upload, the" gives "the memes they upload".
 *
 * @param text - The text
 * @returns The cut text, with an ellipsis
 */
function cutWords(text: string): string {
  const room = text.slice(0, MAX);
  const space = room.lastIndexOf(" ");
  let cut = space > MAX / 2 ? room.slice(0, space) : room.slice(0, MAX - 1);
  const clause = [...cut].findLastIndex(char => CLAUSE.test(char));

  if (clause >= MAX * 0.7) {
    cut = cut.slice(0, clause);
  }

  // One word at a time, while the rest still says enough.
  for (let next = cut.replace(DANGLING, ""); next !== cut && width(next) >= MIN; next = cut.replace(DANGLING, "")) {
    cut = next;
  }

  return `${cut.replace(/[\s,;:،؛–—(·-]+$/u, "")}…`;
}

/**
 * Japanese text cut at a comma, or where the length ends, with an ellipsis.
 *
 * @param text - The text
 * @returns The cut text
 */
function cutPhrases(text: string): string {
  let room = "";

  for (const char of text) {
    if (width(room + char) > MAX - 2) {
      break;
    }

    room += char;
  }

  const comma = room.lastIndexOf("、");

  return `${(comma >= 0 && width(room.slice(0, comma)) >= MIN ? room.slice(0, comma) : room)}…`;
}

/**
 * Text cut to whole sentences that fit a description, or, when those would fill too
 * little of it, to whole words (to a phrase, in Japanese) with an ellipsis.
 *
 * @param text - The text, one or more sentences
 * @returns The description
 */
export function describe(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();

  if (width(clean) <= MAX) {
    return clean;
  }

  let out = "";

  for (const sentence of clean.split(END)) {
    const joined = out ? `${out}${/[。！？؟]$/u.test(out) ? "" : " "}${sentence}` : sentence;

    if (width(joined) > MAX) {
      break;
    }

    out = joined;
  }

  // Japanese has no spaces to cut at: whole sentences, or else phrases.
  if (/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(clean)) {
    return width(out) >= MIN ? out : cutPhrases(clean);
  }

  // Whole sentences that say too little (a long one comes next) give way to whole
  // words, up to the length, and an ellipsis.
  return width(out) >= FILL ? out : cutWords(clean);
}
