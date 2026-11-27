/*
 * The first load. Text rises out of its baseline sentence by sentence, in page order,
 * as each line comes into view (on a phone, the home page's first screenful only: the
 * rest is there when it is scrolled to). On the home page the name first reads "EOussama".
 * The signature draws itself and the copyright fades in under it; then Oussama slides
 * left and the E unfolds into Essamadi. Anything the visitor does settles the page at
 * once, and the page's own text is put back exactly as it was. On a page heavy with
 * markup, such as a post full of code, each block rises whole instead.
 *
 * It plays on a fresh load or a reload, not when moving between pages of the site,
 * and never with reduced motion: the page's head decides (data-rv="pre").
 *
 * It runs from the page's head, written into the page itself (Base.astro, lib/reveal.ts)
 * rather than with the page's other scripts: those wait until all of the page has been
 * read, and a long page would keep its first screenful waiting on the rest. Here the
 * text is taken in block by block as it arrives, and the first screenful rises as soon
 * as it is all there.
 */

/** A word's box, the next word's after a space, and the font they are set in. */
type Fit = { word: HTMLElement; next: HTMLElement; font: string };

type Unit = {
  block: Element;
  words: HTMLElement[];
  atoms: HTMLElement[];
  fadeOnly?: boolean;
  after?: boolean;
  /** Milliseconds between one atom and the next, for marks that come in a row (chips). */
  stagger?: number;
  /** For a mark inside a sentence, the words before it, so it waits for them. */
  wait?: Map<HTMLElement, number>;
  sig?: HTMLElement;
  sigEnd?: number;
  name?: Text;
  n?: { box: HTMLElement; o: HTMLElement; e: HTMLElement; ew: HTMLElement; rest: HTMLElement; oi: HTMLElement; ei: HTMLElement; ri: HTMLElement[] };
  seen?: boolean;
  played?: boolean;
};

const root = document.documentElement;
const EASE = "cubic-bezier(.2,.75,.15,1)";
const DUR = 720;
const STEP = 85;
const WSTEP = 16;
const HIDDEN = "translateY(108%)";
/**
 * How long after the first line the last line of the first screenful starts to rise:
 * a screen of lines a full step apart would keep the reader waiting for its last.
 */
const FIRST = 320;
/** Punctuation that closes what comes before it, and brackets that open what follows. */
const CLOSING = /^[、。，．！？）」』】・,.!?:;)،؛؟]+$/u;
const OPENING = /^[（「『【(]+$/u;

/**
 * A word in a little window, sitting below it until it rises.
 *
 * @param text - The word
 * @returns The window, with the word inside
 */
function wordEl(text: string): HTMLElement {
  const window_ = document.createElement("span");
  const inner = document.createElement("span");

  window_.className = "rv-w";
  inner.className = "rv-i";
  inner.textContent = text;
  window_.append(inner);

  return window_;
}

/**
 * Moves one of the page's own nodes, keeping its focus: where the browser can move it
 * whole (moveBefore) nothing is lost; elsewhere a link focused meanwhile gets it back.
 *
 * @param parent - Where it goes
 * @param node - The node
 * @param before - What it goes before, or null for the end
 */
function move(parent: ParentNode, node: Node, before: Node | null) {
  if (typeof parent.moveBefore === "function") {
    parent.moveBefore(node, before);

    return;
  }

  const focused = document.activeElement;

  parent.insertBefore(node, before);

  if (focused instanceof HTMLElement && focused !== document.activeElement) {
    focused.focus({ preventScroll: true });
  }
}

/**
 * Boxed apart, the words would be read one box at a time, Japanese with a pause
 * between its pieces ("記 事 全 4 件"): the boxes are kept from screen readers, and
 * the text is read whole from a hidden copy beside them, inside the same link or
 * button. The copy is drawn by the stylesheet (global.css), so the page's own text,
 * as its scripts read it, stays what it was.
 *
 * @param text - The text
 * @param boxes - Its boxes
 * @returns The two, together in place of the text
 */
function boxed(text: string, boxes: HTMLElement): HTMLElement {
  const span = document.createElement("span");
  const copy = document.createElement("span");

  span.className = "rv-t";
  copy.className = "rv-a";
  copy.dataset.t = text.replace(/\s+/g, " ");
  boxes.setAttribute("aria-hidden", "true");
  span.append(copy, boxes);

  return span;
}

// Japanese is cut into its words where the browser can tell them apart; the means to,
// only once there is Japanese to cut, as it takes a moment to set up.
let segmenter: Intl.Segmenter | null | undefined;

/**
 * The last of the page read so far. Everything before it has arrived whole; what holds
 * it is still open. A script just reached may not have run yet, and may still change
 * what comes before it (the greeting, the way back), so that waits on it too.
 *
 * @returns The node
 */
function frontier(): Node {
  let node: Node = root;

  while (node.lastChild) {
    node = node.lastChild;
  }

  const script = (node instanceof Element ? node : node.parentElement)?.closest("script");

  return script ? (script.previousElementSibling ?? script.parentNode ?? script) : node;
}

/**
 * Sets up the reveal on this page.
 *
 * @returns What takes in the text read since it last ran, and starts the reveal once
 * the first screenful is all there
 */
function reveal(): () => void {
  const done = () => root.setAttribute("data-rv", "done");

  if (!Element.prototype.animate) {
    done();

    return () => {};
  }

  const units: Unit[] = [];
  const texts: { orig: Text; span: HTMLElement }[] = [];
  // Links held together with the punctuation after them (see joins).
  const groups: HTMLElement[] = [];
  const anims = new Set<Animation>();
  const timers: number[] = [];
  let cursor = 0;
  let finished = false;

  const now = () => performance.now();
  const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, Math.max(0, ms)));
  const play = (el: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) => {
    const animation = el.animate(keyframes, { fill: "both", easing: EASE, duration: DUR, ...options });

    anims.add(animation);
    animation.finished.then(() => anims.delete(animation), () => anims.delete(animation));

    return animation;
  };
  const rtl = root.dir === "rtl";

  // 1. The visible text, block by block. Our own boxes are left out, as the text is
  // taken in a little at a time.
  const skip = (el: Element | null) => !el || !!el.closest("svg, script, style, noscript, .sr, .note, .small, .sig, .bar .tools, .slot, .ck, .dr, .kbd, .chip, pre, code.no-rv, .rv-t");
  const BLOCK = "h1, h2, h3, p, li, dt, dd, figcaption, blockquote, .crumb, .nf-path";
  const filter = { acceptNode: (node: Node) => (node.nodeValue?.trim() && !skip(node.parentElement)) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT };

  // Only a page's first words rise, in page order: a long post has thousands of words
  // further down, each its own animated box, enough to stall the page; read there, it
  // is simply text. The budget is in words rather than screens, so a page of a thousand
  // words or so (the CV, a project's story) rises whole on any screen, a phone's too.
  // It runs out at the end of a block, never part way through one.
  const BUDGET = 1200;
  const piece = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]|[^\s\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]+/gu;
  let counted = 0;
  // The first text left as it is, once the budget has run out.
  let stop: Text | null = null;
  // Whether something is drawn at all, asked of its style alone where the browser can:
  // its boxes would have the whole page laid out first, only for the words boxed next
  // to lay it out again.
  const shown = (el: Element) => typeof el.checkVisibility === "function" ? el.checkVisibility() : el.getClientRects().length > 0;

  // Whether something comes before the text left as it is, and so rises with the rest.
  const near = (el: Element) => !stop || !!(el.compareDocumentPosition(stop) & Node.DOCUMENT_POSITION_FOLLOWING);
  // Whether something comes wholly before a node.
  const ahead = (el: Element, node: Node) => !el.contains(node) && !!(el.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING);

  const cjk = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;
  const arabic = /[\p{Script=Arabic}\p{Script=Hebrew}]/u;
  // A page heavy with markup (a post full of highlighted code) has too many pieces for
  // each word to rise in a box of its own without the frames stuttering on a phone:
  // there each block rises whole instead, as a block of code does. The name keeps its
  // trick. The page says so itself (Base.astro), as its end is yet to come.
  const whole = root.hasAttribute("data-heavy");

  // As the page arrives: the page's column, once it is there; the first text not yet
  // taken in, or the last taken, where the next look picks up; the code, rows of chips
  // and signature already counted in.
  let col: HTMLElement | null = null;
  let from: Node | null = null;
  let fromTaken = false;
  const taken = new Set<Element>();
  let started = false;
  // When the column was first found. Should its first screenful be slow to arrive, the
  // reveal starts with what is there before the stylesheet shows the column anyway
  // (global.css, after 1.5 s), so nothing it has boxed is left held below its baseline.
  let found = 0;
  const WAIT = 1200;
  // The whole page has been read and taken in.
  let all = false;
  let io: IntersectionObserver | null = null;
  // Each block's units, found at once: a long post has thousands of blocks.
  const byBlock = new Map<Element, Unit[]>();
  // A word boxed on its own is set on its own, without the kerning between it and the
  // space after it, or the space and the next word (", " and " A" in the site's serif
  // take half a pixel and more): a line of boxes would run a little longer than its
  // text, and wrap a word sooner. Each box makes up the difference in its margin. The
  // kerning is the font's, between a letter and a space: measured once for each pair a
  // page has, on letters set out on their own for a moment, out of the page's way,
  // before anything is boxed (Safari measures text in the page only to whole pixels).
  // The widths of letters and spaces in each font, alone and in pairs.
  const sizes = new Map<string, Map<string, number>>();
  // The boxes fitted so far, to be fitted again should a font come in meanwhile.
  const fitted: Fit[] = [];

  /**
   * The font a text is set in, as a key and as the styles to set it in again.
   *
   * @param el - What holds the text
   * @returns The key
   */
  const fontOf = (el: Element) => {
    const style = getComputedStyle(el);

    return [style.fontStyle, style.fontWeight, style.fontStretch, style.fontSize, style.fontFamily, style.fontVariationSettings, style.fontFeatureSettings, style.fontKerning].join("\n");
  };

  /**
   * Measures what is not yet known: each letter alone, after a space and before one, and
   * a space, in its font.
   *
   * @param wanted - The letters wanted in each font
   */
  function measure(wanted: Map<string, Set<string>>) {
    const sheet = document.createElement("div");
    const cells: [Map<string, number>, string, HTMLElement][] = [];

    wanted.forEach((letters, font) => {
      const known = sizes.get(font) ?? new Map<string, number>();
      const line = document.createElement("div");
      const [fontStyle, fontWeight, fontStretch, fontSize, fontFamily, fontVariationSettings, fontFeatureSettings, fontKerning] = font.split("\n");

      Object.assign(line.style, { fontStyle, fontWeight, fontStretch, fontSize, fontFamily, fontVariationSettings, fontFeatureSettings, fontKerning });
      sizes.set(font, known);
      [" ", ...[...letters].flatMap(letter => [letter, `${letter} `, ` ${letter}`])].forEach((text) => {
        if (!known.has(text)) {
          const cell = document.createElement("span");

          cell.textContent = text;
          line.append(cell, "\n");
          cells.push([known, text, cell]);
        }
      });
      sheet.append(line);
    });

    if (!cells.length) {
      return;
    }

    sheet.className = "rv-p";
    document.body.append(sheet);

    const widths = cells.map(([, , cell]) => cell.getBoundingClientRect().width);

    sheet.remove();
    cells.forEach(([known, text], k) => known.set(text, widths[k]!));
  }

  /**
   * The margin that brings a box and the space after it to the width they take in the
   * text.
   *
   * @param fit - The box
   * @returns The margin, in pixels
   */
  const shift = (fit: Fit) => {
    const { word, next, font } = fit;
    const known = sizes.get(font);
    const a = Array.from(word.textContent).at(-1)!;
    const b = Array.from(next.textContent)[0]!;
    const width = (text: string) => known?.get(text) ?? Number.NaN;
    const space = width(" ");
    const margin = width(`${a} `) - width(a) - space + width(` ${b}`) - width(b) - space;

    return Number.isNaN(margin) || Math.abs(margin) < 0.01 ? "" : `${margin.toFixed(2)}px`;
  };

  // Measured while a font is still on its way, the letters are measured again once it
  // is in (it swaps in), a little later, out of the way, and every box fitted anew.
  let refitting = false;

  const refit = () => {
    refitting = false;

    if (finished) {
      return;
    }

    const wanted = new Map<string, Set<string>>();
    const live = fitted.filter(f => f.word.isConnected);

    sizes.clear();
    live.forEach(({ word, next, font }) => {
      const letters = wanted.get(font) ?? new Set<string>();

      letters.add(Array.from(word.textContent).at(-1)!);
      letters.add(Array.from(next.textContent)[0]!);
      wanted.set(font, letters);
    });
    measure(wanted);
    live.forEach((f) => {
      f.word.style.marginInlineEnd = shift(f);
    });
  };

  // Called after letters are measured.
  const recheck = () => {
    if (document.fonts?.status === "loading" && !refitting) {
      refitting = true;
      document.fonts.ready.then(() => later(refit, 100), () => {});
    }
  };

  /**
   * "Oussama Essamadi" is first written "EOussama": the E of Essamadi stands in front
   * and the rest of the word is still folded away.
   *
   * @param unit - The line holding the name
   */
  function setUpName(unit: Unit) {
    const node = unit.name!;
    const box = document.createElement("span");
    const ew = wordEl("E");
    const o = document.createElement("span");
    const e = document.createElement("span");
    const rest = document.createElement("span");

    box.className = "rv-t rv-name";
    ew.classList.add("rv-ew");
    o.className = "rv-o";
    o.append(wordEl("Oussama"));
    e.className = "rv-e";
    rest.className = "rv-rest";
    Array.from("ssamadi").forEach(letter => rest.append(wordEl(letter)));
    e.append(rest);
    box.append(ew, o, document.createTextNode(" "), e);

    // Its letters, each in a box, would be read as "E Oussama s s a m a d i": the name
    // is read whole until they are gone.
    const span = boxed(node.nodeValue!, box);

    node.parentNode!.replaceChild(span, node);
    texts.push({ orig: node, span });

    if (from === node) {
      from = span;
    }

    const ri = [...rest.querySelectorAll<HTMLElement>(".rv-i")];

    unit.n = { box, o, e, ew, rest, oi: o.querySelector(".rv-i")!, ei: ew.querySelector(".rv-i")!, ri };
    unit.words.push(unit.n.ei, unit.n.oi);
    ri.forEach((letter) => {
      letter.style.transform = HIDDEN;
    });
  }

  /**
   * The E steps down through its baseline, Oussama slides left into its place, and
   * the E comes back up after it, unfolding into Essamadi letter by letter.
   *
   * @param unit - The line holding the name
   * @param delay - How long to wait first, in milliseconds
   */
  function nameTrick(unit: Unit, delay: number) {
    const N = unit.n;

    if (!N) {
      return;
    }

    const run = () => {
      if (finished) {
        return;
      }

      // Measured as it moves, so late font changes can't throw it off.
      const o0 = N.o.getBoundingClientRect().left;
      const e0 = N.ew.getBoundingClientRect().left;

      N.e.insertBefore(N.ew, N.rest);

      const dO = o0 - N.o.getBoundingClientRect().left;
      const dE = e0 - N.ew.getBoundingClientRect().left;
      const at = `translateX(${dE}px)`;

      play(N.ei, [{ transform: "none" }, { transform: HIDDEN }], { duration: 340, easing: "cubic-bezier(.5,0,.75,0)", fill: "forwards" });
      play(N.ew, [{ transform: at }, { transform: at, offset: 0.5 }, { transform: "none", offset: 0.5 }, { transform: "none" }], { duration: 700, easing: "linear" });
      play(N.o, [{ transform: `translateX(${dO}px)` }, { transform: "none" }], { delay: 120, duration: 760, easing: "cubic-bezier(.65,0,.25,1)" });
      play(N.ei, [{ transform: HIDDEN }, { transform: "none" }], { delay: 700, duration: 620, fill: "forwards" });
      N.ri.forEach((letter, k) => {
        play(letter, [{ transform: HIDDEN }, { transform: "none" }], { delay: 790 + k * 45, duration: 620 });
        letter.style.transform = "";
      });
    };

    // Hold the finish until the trick has played.
    play(N.box, [{ opacity: 1 }, { opacity: 1 }], { delay: Math.max(0, delay), duration: 1800, easing: "linear", fill: "none" });
    timers.push(window.setTimeout(run, Math.max(0, delay)));
  }

  /**
   * Takes in what the page has read since the last look: the blocks that have arrived
   * whole, up to the first that is still coming, in page order. Their text is boxed
   * and held below its baseline at once, while the column is still hidden or the block
   * still out of view.
   *
   * @param last - The last of the page read so far, or null once it has all been read
   * @param fold - Whether to stop at the first block below the first screenful: before
   * the reveal starts, only what it shows first is boxed, so it shows sooner, and the
   * rest follows a frame later
   * @returns The first text left for later, if any
   */
  const takeIn = (last: Node | null, fold: boolean): Text | null => {
    const page = col!;
    const ready = (el: Element) => !last || ahead(el, last);
    const name = page.querySelector(".site-name");
    const risesWhole = (block: Element): block is HTMLElement => whole && block instanceof HTMLElement && !(name && block.contains(name));
    const blocks = new Map<Element, Text[]>();
    let waiting: Text | null = null;
    let measured: Element | null = null;

    if (!stop) {
      const walker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT, filter);
      let node: Node | null;

      // Text left for later can be replaced before it is taken in (the way back's, by
      // its script): the walk starts over from the top, past what is boxed already.
      if (from && !from.isConnected) {
        from = null;
      }

      if (from) {
        walker.currentNode = from;
        node = fromTaken ? walker.nextNode() : from;
      }
      else {
        node = walker.nextNode();
      }

      for (; node; node = walker.nextNode()) {
        const text = node as Text;
        const el = text.parentElement!;
        const block = el.closest(BLOCK) ?? el;

        // A block still arriving waits, and so does all that comes after it; so does one
        // below the first screenful, while that is all that is wanted. Measured before
        // anything is boxed, the page is laid out once.
        let below = false;

        if (fold && block !== measured) {
          measured = block;
          below = block.getBoundingClientRect().top >= innerHeight;
        }

        if (!ready(block) || below) {
          waiting = text;
          break;
        }

        if (!shown(el)) {
          from = text;
          fromTaken = true;
          continue;
        }

        if (counted >= BUDGET && !blocks.has(block)) {
          stop = text;
          break;
        }

        blocks.set(block, [...(blocks.get(block) ?? []), text]);
        counted += text.nodeValue?.match(piece)?.length ?? 0;
        from = text;
        fromTaken = true;
      }

      if (waiting) {
        from = waiting;
        fromTaken = false;
      }
    }

    // Code, chips, the signature and the copyright that have arrived, and that come
    // before any text left for later.
    const fresh = (selector: string) => [...page.querySelectorAll<HTMLElement>(selector)].filter(el => !taken.has(el) && ready(el) && (!waiting || ahead(el, waiting)));

    // Everything to be measured is measured before any text is boxed: measured after a
    // change, the page is laid out again, block after block. A link's own icon is one of
    // a block's marks where it shows without a hover (touch screens); hidden until
    // hovered, it is left alone, or it would flash.
    const marksOf = new Map<Element, HTMLElement[]>();
    // Punctuation right after a link (or a name, a bit of code) is a box of its own in the
    // text that follows, and a box can start a line where the text itself never would:
    // "、" alone at the start of one. The two are held on one line while they rise, for a
    // link that sits on one line already, so they stay where the text will have them.
    const joins = new Set<Text>();
    // Text that wraps as usual, where a run of Latin words on a right-to-left page can
    // wrap between them too (see below).
    const wraps = new Set<Text>();
    // Japanese is cut where its lines can break, and the browser breaks them between
    // phrases (Chrome) or almost anywhere (Safari): it is cut into its words, keeping the
    // punctuation that closes one and the bracket that opens the next; also wherever a
    // line of it starts now; but never so that a line's first piece would fit at the end
    // of the line before, where the text itself did not. Here, where it is cut.
    const cuts = new Map<Text, Set<number>>();
    // The letters on either side of each space in each font, and each text's font, for
    // the boxes' margins (see shift).
    const wanted = new Map<string, Set<string>>();
    const fonts = new Map<Text, string>();

    const cutUp = (node: Text) => {
      segmenter ??= typeof Intl.Segmenter === "function" ? new Intl.Segmenter("ja", { granularity: "word" }) : null;

      const data = node.data;
      const at = new Set<number>();
      const parts = segmenter ? Array.from(segmenter.segment(data), part => part.segment) : Array.from(data);
      const range = document.createRange();
      let k = 0;

      parts.forEach((part, i) => {
        if (k && !CLOSING.test(part) && !OPENING.test(parts[i - 1]!)) {
          at.add(k);
        }

        k += part.length;
      });

      // Where its lines end: the content edge of the box its lines are in.
      let el = node.parentElement!;

      while (el.parentElement && /^(?:inline|contents)$/.test(getComputedStyle(el).display)) {
        el = el.parentElement;
      }

      const style = getComputedStyle(el);
      const edge = el.getBoundingClientRect().right - Number.parseFloat(style.paddingRight) - Number.parseFloat(style.borderRightWidth);
      let line: DOMRect | undefined;
      let room = 0;

      // From what comes before it on its line, if it starts one.
      range.setStart(el, 0);
      range.setEnd(node, 0);

      let prev = [...range.getClientRects()].findLast(rect => rect.width > 0);

      for (k = 0; k < data.length; k += data.codePointAt(k)! > 0xFFFF ? 2 : 1) {
        if (/\s/.test(data.charAt(k))) {
          continue;
        }

        range.setStart(node, k);
        range.setEnd(node, k + (data.codePointAt(k)! > 0xFFFF ? 2 : 1));

        const rect = range.getClientRects()[0];

        if (!rect) {
          continue;
        }

        if (prev && rect.top > prev.top + 1) {
          at.add(k);
          line = rect;
          room = edge - prev.right;
        }
        else if (line && at.has(k)) {
          if (rect.left - line.left <= room) {
            at.delete(k);
          }
          else {
            line = undefined;
          }
        }

        prev = rect;
      }

      return at;
    };

    blocks.forEach((list, block) => {
      if (!risesWhole(block)) {
        marksOf.set(block, [...block.querySelectorAll<HTMLElement>(".dot, .arrow, .nf-dot, code, .lk-ic, .copy-ic")]
          .filter(atom => !atom.matches(".lk-ic, .copy-ic") || getComputedStyle(atom).opacity !== "0"));
        list.forEach((node) => {
          const el = node.previousSibling;

          if (rtl && /[A-Z0-9]\S*\s+\S*[A-Z0-9]/i.test(node.nodeValue!) && getComputedStyle(node.parentElement!).whiteSpace === "normal") {
            wraps.add(node);
          }

          // The home intro's words are boxed on their own already, and rise whole.
          if (!rtl && cjk.test(node.data) && !node.parentElement!.closest(".iw")) {
            cuts.set(node, cutUp(node));
          }
          else if (/\S\s+\S/.test(node.data)) {
            const font = fontOf(node.parentElement!);
            const letters = wanted.get(font) ?? new Set<string>();
            const words = node.data.trim().split(/\s+/);

            words.forEach((word, k) => {
              if (k) {
                letters.add(Array.from(word)[0]!);
              }

              if (k < words.length - 1) {
                letters.add(Array.from(word).at(-1)!);
              }
            });
            wanted.set(font, letters);
            fonts.set(node, font);
          }

          if (el instanceof HTMLElement && CLOSING.test(node.nodeValue!.charAt(0)) && el.textContent.trim() && getComputedStyle(node.parentElement!).whiteSpace === "normal") {
            const style = getComputedStyle(el);
            const pad = getComputedStyle(block);
            const room = block.clientWidth - Number.parseFloat(pad.paddingLeft) - Number.parseFloat(pad.paddingRight);
            const rects = el.getClientRects();

            // Room to spare for the punctuation too, or the two would run out of the line.
            if (style.display.startsWith("inline") && rects.length === 1 && rects[0]!.width + 2 * Number.parseFloat(style.fontSize) <= room) {
              joins.add(node);
            }
          }
        });
      }
    });

    // Before the reveal starts, the page has just been laid out to be measured, and
    // setting out a few letters costs little: the first screenful's are measured now.
    // Later, letters not yet measured would have the page laid out again in the middle
    // of being taken in: the boxes they end are fitted a little later, out of view below
    // the first screenful.
    const unknown = [...wanted].some(([font, letters]) => [...letters].some(letter => !sizes.get(font)?.has(`${letter} `)));
    const fits: Fit[] = [];

    if (!started) {
      measure(wanted);
      recheck();
    }
    else if (unknown) {
      later(() => {
        measure(wanted);
        recheck();
        fits.forEach((fit) => {
          fit.word.style.marginInlineEnd = shift(fit);
        });
      }, 250);
    }

    const chipRows = fresh(".chips").map(row => ({ row, chips: [...row.querySelectorAll<HTMLElement>(".chip")].filter(shown) }));
    const added: Unit[] = [];

    blocks.forEach((list, block) => {
      if (risesWhole(block)) {
        added.push({ block, words: [], atoms: [block] });

        return;
      }

      const own: Unit[] = [{ block, words: [], atoms: [] }];
      const last = () => own[own.length - 1]!;

      list.forEach((node) => {
        if (name?.contains(node) && !rtl && node.nodeValue?.trim() === "Oussama Essamadi") {
          last().name = node;

          return;
        }

        const boxes = document.createElement("span");
        const span = boxed(node.nodeValue ?? "", boxes);

        node.parentNode!.replaceChild(span, node);
        texts.push({ orig: node, span });

        // The next look picks up after the text's box, the text itself gone from the page.
        if (from === node) {
          from = span;
        }

        let parts = (node.nodeValue ?? "").split(/(\s+)/);

        const cut = cuts.get(node);

        // The box before, and whether a space has come since (see shift).
        const font = fonts.get(node);
        let prior: HTMLElement | null = null;
        let spaced = false;

        const box = (into: HTMLElement, piece: string) => {
          const word = wordEl(piece);

          if (prior && spaced && font) {
            const fit = { word: prior, next: word, font };

            prior.style.marginInlineEnd = shift(fit);
            fitted.push(fit);
            fits.push(fit);
          }

          prior = word;
          spaced = false;

          into.append(word);
          last().words.push(word.firstChild as HTMLElement);

          // A full stop ends the sentence: the next words wait for their own step.
          if (/[.!?。！？؟…]["'”’»)]*$/.test(piece)) {
            own.push({ block, words: [], atoms: [] });
          }
        };

        // On right-to-left pages a run of Latin words is kept together, or bidi order
        // flips it (each box on its own goes the page's way).
        if (rtl) {
          const merged: string[] = [];

          parts.forEach((part) => {
            const k = merged.length;
            const prev = merged[k - 2] ?? "";

            if (k >= 2 && /^\s+$/.test(merged[k - 1]!) && part && !/^\s+$/.test(part) && !arabic.test(part) && !arabic.test(prev) && /[A-Z0-9]/i.test(part) && /[A-Z0-9]/i.test(prev) && !/[.!?]$/.test(prev)) {
              merged[k - 2] = prev + merged.pop()! + part;

              return;
            }

            merged.push(part);
          });
          parts = merged;
        }

        // A word in the pieces its lines can break between: Japanese as cut above; a word
        // joined by a hyphen in two, as a line can break after the hyphen.
        const hyphen = (k: number) => /[-\u2010]/.test(node.data.charAt(k - 1)) && /\p{L}/u.test(node.data.charAt(k)) && /[\p{L}\p{N}]/u.test(node.data.charAt(k - 2));
        const split = (into: HTMLElement, start: number, end: number) => {
          let piece = start;

          for (let k = start + 1; k < end; k++) {
            if (cut ? cut.has(k) : hyphen(k)) {
              box(into, node.data.slice(piece, k));
              piece = k;
            }
          }

          box(into, node.data.slice(piece, end));
        };
        let at = 0;

        parts.forEach((part) => {
          const start = at;

          at += part.length;

          if (!part) {
            return;
          }

          if (/^\s+$/.test(part)) {
            boxes.append(document.createTextNode(part));
            spaced = true;

            return;
          }

          // A run of them is read left to right in a stretch of its own, its words boxed
          // apart, so it wraps between them as the text does rather than as one piece.
          // What opens or closes it (a bracket, a comma) goes the page's way, as in the
          // text, held to it on its line.
          if (/\s/.test(part) && wraps.has(node)) {
            const first = part.search(/[\p{L}\p{N}]/u);
            let end = part.length;

            while (end > first && !/[\p{L}\p{N}]/u.test(part.charAt(end - 1))) {
              end--;
            }

            const [open, words, close] = [part.slice(0, first), part.slice(first, end), part.slice(end)];
            const run = document.createElement("span");
            const group = document.createElement("span");
            let k = start + first;

            run.dir = "ltr";
            group.className = "rv-g";

            if (open) {
              box(group, open);
            }

            group.append(run);
            words.split(/(\s+)/).forEach((bit) => {
              if (/^\s+$/.test(bit)) {
                run.append(bit);
                spaced = true;
              }
              else if (bit) {
                split(run, k, k + bit.length);
              }

              k += bit.length;
            });

            if (close) {
              box(group, close);
            }

            boxes.append(open || close ? group : run);

            return;
          }

          split(boxes, start, at);
        });

        // The link and the punctuation's box in a group that never breaks; the rest of
        // the text after it wraps as before. The punctuation stays hidden from screen
        // readers there too: its text's copy reads it.
        if (joins.has(node)) {
          const group = document.createElement("span");
          const el = span.previousSibling!;
          const mark = boxes.firstChild as HTMLElement;

          group.className = "rv-g";
          span.before(group);
          move(group, el, null);
          mark.setAttribute("aria-hidden", "true");
          group.append(mark);
          groups.push(group);
        }
      });

      // Bullets, arrows and other marks arrive with the sentence they sit in: a bullet,
      // before every word, with the first; a link's arrow (or icon) with the words it ends.
      const before = (word: HTMLElement, atom: HTMLElement) => !!(word.compareDocumentPosition(atom) & Node.DOCUMENT_POSITION_FOLLOWING);

      marksOf.get(block)!.forEach((atom) => {
        const unit = own.findLast(u => u.words[0] && before(u.words[0], atom)) ?? own[0]!;
        const words = unit.words.filter(word => before(word, atom)).length;

        unit.atoms.push(atom);

        if (words > 1) {
          (unit.wait ??= new Map()).set(atom, words - 1);
        }
      });
      own.filter(u => u.words.length || u.atoms.length || u.name).forEach(u => added.push(u));
    });

    units.push(...added);

    // The header tools fade in with the first line; the signature and the copyright come last.
    const tools = document.querySelector<HTMLElement>(".bar .tools");

    if (tools && !taken.has(tools) && ready(tools)) {
      taken.add(tools);

      const unit: Unit = { block: tools, words: [], atoms: [tools], fadeOnly: true };

      units.unshift(unit);
      added.push(unit);
    }

    // Each in its place in the page's order.
    const insert = (unit: Unit) => {
      const at = units.findIndex(u => unit.block.compareDocumentPosition(u.block) & Node.DOCUMENT_POSITION_FOLLOWING);

      units.splice(at < 0 ? units.length : at, 0, unit);
      added.push(unit);
      taken.add(unit.block);
    };

    // A block of code arrives whole, in its place in the page's order: word by word, a
    // long post's code would be thousands of pieces.
    fresh("pre").filter(near).forEach(pre => insert({ block: pre, words: [], atoms: [pre] }));

    // A list page's search and filters arrive whole too, after its lead and before the
    // list they narrow, rather than stand there while the words around them rise.
    fresh(".lp-sheet > .dr-tools").forEach(tools => insert({ block: tools, words: [], atoms: [tools] }));

    // A row of chips arrives chip by chip, each whole, in its place in the page's order;
    // those folded away are left out, or the ones after them would wait on them.
    chipRows.forEach(({ row, chips }) => insert({ block: row, words: [], atoms: chips, stagger: 25 }));

    fresh(".sig").forEach((sig) => {
      const unit: Unit = { block: sig, sig, words: [], atoms: [] };

      taken.add(sig);
      units.push(unit);
      added.push(unit);
    });
    fresh(".small").forEach((small) => {
      const unit: Unit = { block: small, words: [], atoms: [small], fadeOnly: true, after: true };

      taken.add(small);
      units.push(unit);
      added.push(unit);
    });

    added.forEach((unit) => {
      // Marks drawn by the stylesheet are no elements to hide: a list item's bullet or
      // number, a dot between items, the back link's chevron. They wait with their
      // block, held back by a class (global.css), and come in with its first words,
      // rather than stand alone where the words have yet to rise.
      unit.block.classList.add("rv-mk");

      // The name's words first, so they are held down with the rest, not drawn plain
      // ("EOussama") for a frame or two before they rise.
      if (unit.name) {
        setUpName(unit);
      }

      unit.words.forEach((word) => {
        word.style.transform = HIDDEN;
      });
      unit.atoms.forEach((atom) => {
        // At once: a link's icon fades its opacity, and would linger on the first frames.
        atom.style.transition = "none";
        atom.style.opacity = "0";
      });

      byBlock.set(unit.block, [...(byBlock.get(unit.block) ?? []), unit]);
    });

    // Once the reveal is under way, what arrives is watched for as it comes into view.
    new Set(added.map(u => u.block)).forEach(block => io?.observe(block));

    return waiting;
  };

  // 2. Playing a line: words ride up one after another, marks fade in.
  let nameAt = 0;
  let lastEnd = 0;

  const run = (unit: Unit, t0: number) => {
    unit.played = true;

    const delay = t0 - now();

    if (unit.block.classList.contains("rv-mk")) {
      later(() => unit.block.classList.remove("rv-mk"), delay);
    }

    unit.words.forEach((word, j) => {
      play(word, [{ transform: HIDDEN }, { transform: "none" }], { delay: delay + Math.min(j * WSTEP, 220) });
      word.style.transform = "";
    });

    unit.atoms.forEach((atom, k) => {
      const at = delay + k * (unit.stagger ?? 0) + Math.min((unit.wait?.get(atom) ?? 0) * WSTEP, 220);

      atom.style.opacity = "";
      atom.style.transition = "";

      if (unit.fadeOnly) {
        play(atom, [{ opacity: 0 }, { opacity: 1 }], { delay: at, duration: 600, easing: "linear", fill: "backwards" });
      }
      else {
        play(atom, [{ opacity: 0 }, { opacity: 1 }], { delay: at, duration: DUR * 0.8, fill: "backwards" });
        play(atom, [{ translate: "0 6px" }, { translate: "0 0" }], { delay: at, duration: DUR, fill: "backwards" });
      }
    });

    if (unit.sig) {
      const paths = [...unit.sig.querySelectorAll<SVGPathElement>("mask path")];
      let end = 0;

      paths.forEach((path) => {
        path.style.animationDelay = `${(Number.parseFloat(path.style.animationDelay) || 0) + delay / 1000}s`;
        end = Math.max(end, (Number.parseFloat(path.style.animationDelay) || 0) + (Number.parseFloat(path.style.animationDuration) || 0));
      });
      // The wet sheen follows the nib, so it starts as late as the ink does.
      unit.sig.querySelectorAll<SVGElement>(".sig-wet").forEach((path) => {
        path.style.animationDelay = `${(Number.parseFloat(path.style.animationDelay) || 0) + delay / 1000}s`;
      });
      unit.sig.classList.add("is-drawing");
      unit.sigEnd = now() + end * 1000;
    }

    lastEnd = Math.max(lastEnd, t0 + DUR + Math.min(unit.words.length * WSTEP, 220) + unit.atoms.length * (unit.stagger ?? 0));
  };

  // 3. Lines are released in page order, a step apart, as they come into view. Those
  // of the first screenful come closer together the more of them there are, the gaps
  // narrowing down the screen, so that the last of them starts within FIRST.
  let nameDone = false;
  let opened = false;
  // Lines were passed over by a jump to the end (see atEnd).
  let jumped = false;

  const pump = () => {
    const t = now();
    const waiting = (u: Unit) => !u.played && u.seen;
    const lines = units.filter(u => waiting(u) && !u.sig && !u.after);
    const n = lines.filter(u => !u.fadeOnly).length;
    // So do those in view after a jump to the end, at once and in half the time: the
    // reader is already there.
    const first = (!opened || jumped) && n > 1;
    const last = jumped ? FIRST / 2 : FIRST;
    const at = (i: number) => first ? Math.min(i * STEP, last * (i / (n - 1)) ** 0.7) : i * STEP;
    let i = 0;

    cursor = jumped ? t : Math.max(cursor, t);
    jumped = false;
    opened ||= n > 0;

    const from = cursor;

    lines.forEach((unit) => {
      run(unit, from + at(i));

      if (!unit.fadeOnly) {
        i++;
      }
    });

    if (n) {
      cursor = from + at(n - 1) + STEP;
    }

    // Once everything in view has arrived, the signature draws itself.
    for (const unit of units) {
      if (!waiting(unit) || !unit.sig) {
        continue;
      }

      if (units.slice(0, units.indexOf(unit)).some(u => !u.played && u.seen && !u.sig && !u.after)) {
        continue;
      }

      const at = Math.max(cursor, lastEnd - 200);

      run(unit, at);
      cursor = at + STEP;
    }

    // Then the name trick, after the signature's last stroke, or once the lines have
    // arrived when the signature is out of view.
    const named = units.find(u => u.name && u.played);
    const signed = units.find(u => u.sig && u.played)?.sigEnd;

    if (named && !nameDone) {
      nameDone = true;
      nameAt = signed ? signed + 200 : Math.max(lastEnd, cursor) + 250;
      nameTrick(named, nameAt - now());
    }

    for (const unit of units) {
      if (!waiting(unit) || !unit.after) {
        continue;
      }

      const sig = units.find(u => u.sig && unit.block.parentElement?.contains(u.sig));

      if (sig && !sig.played) {
        continue;
      }

      run(unit, sig?.sigEnd ? Math.max(cursor, sig.sigEnd - 300) : cursor);
    }

    // Done once the whole page is in, and has all played.
    if (all && units.every(u => u.played)) {
      const sigLeft = Math.max(0, ...units.map(u => u.sigEnd ? u.sigEnd + 700 - now() : 0));

      Promise.all([...anims].map(a => a.finished.catch(() => {}))).then(() => later(() => finish(true), Math.max(0, sigLeft - (now() - t)) + 60));
    }
  };

  // The page's last lines can sit in the strip along the bottom that does not count as
  // in view, even with the page scrolled to its end (the copyright, on a phone): there,
  // whatever shows at all has come into view. Jumped to (the end key, the scrollbar),
  // what was passed over above is simply there, so what shows rises at once rather
  // than wait its turn behind all of it.
  const atEnd = () => {
    if (innerHeight + scrollY < root.scrollHeight - 2) {
      return false;
    }

    let any = false;
    const fresh = units.filter(u => !u.seen && !u.played);
    // Measured first, then changed, so the page is laid out once.
    const boxes = fresh.map(u => u.block.getBoundingClientRect());

    fresh.forEach((unit, k) => {
      if (boxes[k]!.bottom <= 0) {
        still(unit);
        unit.seen = true;
        unit.played = true;
        any = true;
        jumped = true;
      }
      else if (boxes[k]!.top < innerHeight) {
        unit.seen = true;
        any = true;
      }
    });

    return any;
  };
  // The strip along the bottom is for lines on their way in, as the page scrolls. Until
  // it has, what shows is the first screenful, all of it: on a screen a little shorter
  // than the page, its last line sits in the strip, and would wait there, blank, for a
  // scroll that nothing asks for.
  let moved = false;
  // As wide as the page's phone layout (global.css).
  const narrow = matchMedia("(max-width: 700px)");
  const onScreen = () => {
    if (moved) {
      return false;
    }

    let any = false;
    const fresh = units.filter(u => !u.seen && !u.played);
    // Measured first, then changed, so the page is laid out once.
    const boxes = fresh.map(u => u.block.getBoundingClientRect());

    fresh.forEach((unit, k) => {
      if (boxes[k]!.top < innerHeight && boxes[k]!.bottom > 0) {
        unit.seen = true;
        any = true;
      }
    });

    return any;
  };
  const scrolled = () => {
    moved = true;

    if (atEnd()) {
      pump();
    }
  };

  // Anything the visitor does settles the page at once, so nothing is left half-written.
  const settle = () => finish(false);

  /** Shows the column, and lets lines rise as they come into view. */
  const start = () => {
    started = true;
    root.setAttribute("data-rv", "run");

    const watch = new IntersectionObserver((entries) => {
      // Both, not either: each marks its own lines.
      const shown = onScreen();
      let any = atEnd() || shown;
      // On a phone the home page runs past its first screenful, and its own words rise
      // on that one only: what lies below is simply there when it is scrolled to.
      const quiet = narrow.matches && document.querySelector(".home") !== null;

      entries.forEach((entry) => {
        if (!entry.isIntersecting && quiet && entry.boundingClientRect.top >= innerHeight) {
          (byBlock.get(entry.target) ?? []).forEach((unit) => {
            if (!unit.played) {
              still(unit);
              unit.seen = true;
              unit.played = true;
              any = true;
            }
          });
          watch.unobserve(entry.target);

          return;
        }

        if (!entry.isIntersecting) {
          return;
        }

        (byBlock.get(entry.target) ?? []).forEach((unit) => {
          if (!unit.seen) {
            unit.seen = true;
            any = true;
          }
        });
        watch.unobserve(entry.target);
      });

      if (any) {
        pump();
      }
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0 });

    io = watch;
    new Set(units.map(u => u.block)).forEach(block => watch.observe(block));
    addEventListener("scroll", scrolled, { passive: true });
    addEventListener("pointerdown", settle, true);
    addEventListener("keydown", settle, true);
    // Printed before the page was read down, the lines not yet risen would print blank.
    addEventListener("beforeprint", settle);
  };

  /**
   * Shows a line as it ends up, at once: its words up, its marks in, the signature
   * written, the name in full.
   *
   * @param unit - The line
   */
  function still(unit: Unit) {
    const N = unit.n;

    unit.block.classList.remove("rv-mk");
    unit.words.forEach((word) => {
      word.style.transform = "";
    });
    unit.atoms.forEach((atom) => {
      atom.style.opacity = "";
      atom.style.transition = "";
    });

    if (N) {
      N.ri.forEach((letter) => {
        letter.style.transform = "";
      });

      // Not yet unfolded, its E goes ahead of the rest of Essamadi.
      if (N.ew.parentNode !== N.e) {
        N.e.insertBefore(N.ew, N.rest);
        nameDone = true;
      }
    }

    if (unit.sig && !unit.played) {
      unit.sig.querySelectorAll<SVGPathElement>("mask path").forEach((path) => {
        path.style.animationDelay = "0s";
        path.style.animationDuration = ".01s";
      });
      // Written all at once, there is no fresh ink to shine.
      unit.sig.querySelectorAll<SVGElement>(".sig-wet").forEach((path) => {
        path.style.animation = "none";
      });
      unit.sig.classList.add("is-drawing");
    }
  }

  /**
   * The block the window opens on: the first to start inside it, or the one running
   * through its top edge.
   *
   * @returns The block and where its top is, if any
   */
  const opening = (): { block: Element; top: number } | null => {
    let through: { block: Element; top: number } | null = null;

    for (const block of document.querySelectorAll(`main :is(${BLOCK})`)) {
      const box = block.getBoundingClientRect();

      if (box.bottom <= 0 || !box.height) {
        continue;
      }

      if (box.top >= 0) {
        return box.top < innerHeight ? { block, top: box.top } : through;
      }

      through ??= { block, top: box.top };
    }

    return through;
  };

  /**
   * Puts the page's own text back exactly as it was, and draws what was left.
   *
   * @param natural - Whether the reveal ran its course; when the visitor cut it short,
   * the words jump into place at once but the text goes back only after their click
   * has gone through, since a click whose target vanishes is never delivered.
   */
  function finish(natural: boolean) {
    if (finished) {
      return;
    }

    finished = true;
    io?.disconnect();
    timers.forEach(clearTimeout);
    anims.forEach(animation => animation.cancel());
    units.forEach(still);
    removeEventListener("pointerdown", settle, true);
    removeEventListener("keydown", settle, true);
    removeEventListener("beforeprint", settle);
    removeEventListener("scroll", scrolled);
    done();

    let restored = false;
    const restore = () => {
      if (!restored) {
        restored = true;

        // A line of boxes may not break quite where its text does, and what follows
        // would jump as it goes back: the block the window opens on stays where it was,
        // in the same frame. At the top of the page, the page stays at its top.
        const anchor = scrollY > 0 ? opening() : null;

        texts.forEach(({ orig, span }) => span.parentNode?.replaceChild(orig, span));
        groups.forEach((group) => {
          move(group.parentNode!, group.firstChild!, group);
          group.remove();
        });

        const moved = anchor ? anchor.block.getBoundingClientRect().top - anchor.top : 0;

        if (Math.abs(moved) >= 0.5) {
          scrollBy({ top: moved, behavior: "instant" });
        }
      }
    };

    if (natural) {
      restore();
    }
    else {
      addEventListener("click", () => setTimeout(restore), { once: true });
      setTimeout(restore, 800);
    }
  }

  // Each look: what has arrived is taken in; the column shows once the first
  // screenful is all there (the first text still coming lies below it), or the page
  // has all been read. Settled by the visitor meanwhile, the rest stays as it is.
  const look = () => {
    if (finished || all) {
      return;
    }

    const read = document.readyState !== "loading";

    col ??= document.querySelector<HTMLElement>(".col");

    if (!col) {
      if (read) {
        all = true;
        done();
      }

      return;
    }

    found ||= now();

    const waiting = takeIn(read ? null : frontier(), !started);
    const block = waiting?.parentElement;

    if (!started && (read || stop || now() - found > WAIT || (block && (block.closest(BLOCK) ?? block).getBoundingClientRect().top >= innerHeight))) {
      start();
    }

    // All of the page read, and taken in up to the end of the first screenful: the rest
    // a frame later, once that shows.
    if (read && waiting) {
      requestAnimationFrame(look);
    }
    else if (read) {
      all = true;
      pump();
    }
  };

  return look;
}

if (root.dataset.rv === "pre") {
  const look = reveal();

  // Before each frame while the page is being read, and once more when it has been.
  const frame = () => {
    look();

    if (document.readyState === "loading") {
      requestAnimationFrame(frame);
    }
  };

  requestAnimationFrame(frame);
  document.addEventListener("readystatechange", look);
}

export {};
