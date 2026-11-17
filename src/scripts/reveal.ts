/*
 * The first load. Text rises out of its baseline sentence by sentence, in page order,
 * as each line comes into view. On the home page the name first reads "EOussama".
 * The signature draws itself and the copyright fades in under it; then Oussama slides
 * left and the E unfolds into Essamadi. Anything the visitor does settles the page at
 * once, and the page's own text is put back exactly as it was. On a page heavy with
 * markup, such as a post full of code, each block rises whole instead.
 *
 * It plays on a fresh load or a reload, not when moving between pages of the site,
 * and never with reduced motion: the page's head decides (data-rv="pre").
 */

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
 * Japanese cut into characters, each keeping the punctuation that closes it and the
 * bracket that opens it: each piece is a box of its own, and a full stop in a box of
 * its own could start a line.
 *
 * @param text - The text
 * @returns Its pieces
 */
function characters(text: string): string[] {
  return Array.from(text).reduce<string[]>((pieces, char) => {
    const k = pieces.length - 1;

    if (k >= 0 && (CLOSING.test(char) || OPENING.test(pieces[k]!))) {
      pieces[k] += char;
    }
    else {
      pieces.push(char);
    }

    return pieces;
  }, []);
}

/** Plays the reveal on this page. */
function reveal() {
  const col = document.querySelector<HTMLElement>(".col");
  const done = () => root.setAttribute("data-rv", "done");

  if (!col || !Element.prototype.animate) {
    done();

    return;
  }

  const units: Unit[] = [];
  const texts: { orig: Text; span: HTMLElement }[] = [];
  const anims = new Set<Animation>();
  const timers: number[] = [];
  // The heading named in full while its letters are boxed apart (see setUpName).
  let labelled: HTMLElement | null = null;
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

  // 1. The visible text, block by block.
  const skip = (el: Element | null) => !el || !!el.closest("svg, script, style, noscript, .sr, .note, .small, .sig, .bar .tools, .slot, .ck, .dr, .kbd, .chip, pre, code.no-rv");
  const BLOCK = "h1, h2, h3, p, li, dt, dd, figcaption, blockquote, .crumb, .nf-path";
  const blocks = new Map<Element, Text[]>();
  const walker = document.createTreeWalker(col, NodeFilter.SHOW_TEXT, { acceptNode: node => (node.nodeValue?.trim() && !skip(node.parentElement)) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
  const nodes: Text[] = [];

  while (walker.nextNode()) {
    nodes.push(walker.currentNode as Text);
  }

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

  for (const node of nodes) {
    const el = node.parentElement!;

    if (!shown(el)) {
      continue;
    }

    const block = el.closest(BLOCK) ?? el;

    if (counted >= BUDGET && !blocks.has(block)) {
      stop = node;
      break;
    }

    blocks.set(block, [...(blocks.get(block) ?? []), node]);
    counted += node.nodeValue?.match(piece)?.length ?? 0;
  }

  // Whether something comes before the text left as it is, and so rises with the rest.
  const near = (el: Element) => !stop || !!(el.compareDocumentPosition(stop) & Node.DOCUMENT_POSITION_FOLLOWING);

  const cjk = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;
  const arabic = /[\p{Script=Arabic}\p{Script=Hebrew}]/u;
  const name = col.querySelector(".site-name");
  // A page heavy with markup (a post full of highlighted code) has too many pieces for
  // each word to rise in a box of its own without the frames stuttering on a phone:
  // there each block rises whole instead, as a block of code does. The name keeps its
  // trick.
  const whole = col.getElementsByTagName("*").length > 1000;
  const risesWhole = (block: Element): block is HTMLElement => whole && block instanceof HTMLElement && !(name && block.contains(name));

  // Everything to be measured is measured before any text is boxed: measured after a
  // change, the page is laid out again, block after block. A link's own icon is one of
  // a block's marks where it shows without a hover (touch screens); hidden until
  // hovered, it is left alone, or it would flash.
  const marksOf = new Map<Element, HTMLElement[]>();

  blocks.forEach((_, block) => {
    if (!risesWhole(block)) {
      marksOf.set(block, [...block.querySelectorAll<HTMLElement>(".dot, .arrow, .nf-dot, code, .lk-ic, .copy-ic")]
        .filter(atom => !atom.matches(".lk-ic, .copy-ic") || getComputedStyle(atom).opacity !== "0"));
    }
  });

  const chipRows = [...col.querySelectorAll<HTMLElement>(".chips")].map(row => ({ row, chips: [...row.querySelectorAll<HTMLElement>(".chip")].filter(shown) }));

  blocks.forEach((list, block) => {
    if (risesWhole(block)) {
      units.push({ block, words: [], atoms: [block] });

      return;
    }

    const own: Unit[] = [{ block, words: [], atoms: [] }];
    const last = () => own[own.length - 1]!;

    list.forEach((node) => {
      if (name?.contains(node) && !rtl && node.nodeValue?.trim() === "Oussama Essamadi") {
        last().name = node;

        return;
      }

      const span = document.createElement("span");
      let parts = (node.nodeValue ?? "").split(/(\s+)/);

      span.className = "rv-t";

      // On right-to-left pages a run of Latin words stays one piece, or bidi order flips it.
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

      parts.forEach((part) => {
        if (!part) {
          return;
        }

        if (/^\s+$/.test(part)) {
          span.append(document.createTextNode(part));

          return;
        }

        // Japanese rises character by character, except a word already boxed on its
        // own (the home intro's), which rises whole so its box keeps its width.
        const pieces = !rtl && cjk.test(part) && !node.parentElement?.closest(".iw") ? characters(part) : [part];

        pieces.forEach((piece) => {
          const word = wordEl(piece);

          span.append(word);
          last().words.push(word.firstChild as HTMLElement);

          // A full stop ends the sentence: the next words wait for their own step.
          if (/[.!?。！？؟…]["'”’»)]*$/.test(piece)) {
            own.push({ block, words: [], atoms: [] });
          }
        });
      });

      node.parentNode!.replaceChild(span, node);
      texts.push({ orig: node, span });
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
    own.filter(u => u.words.length || u.atoms.length || u.name).forEach(u => units.push(u));
  });

  // The header tools fade in with the first line; the signature and the copyright come last.
  const tools = document.querySelector<HTMLElement>(".bar .tools");

  if (tools) {
    units.unshift({ block: tools, words: [], atoms: [tools], fadeOnly: true });
  }

  // A block of code arrives whole, in its place in the page's order: word by word, a
  // long post's code would be thousands of pieces.
  [...col.querySelectorAll<HTMLElement>("pre")].filter(near).forEach((pre) => {
    const at = units.findIndex(u => pre.compareDocumentPosition(u.block) & Node.DOCUMENT_POSITION_FOLLOWING);

    units.splice(at < 0 ? units.length : at, 0, { block: pre, words: [], atoms: [pre] });
  });

  // A row of chips arrives chip by chip, each whole, in its place in the page's order;
  // those folded away are left out, or the ones after them would wait on them.
  chipRows.forEach(({ row, chips }) => {
    const at = units.findIndex(u => row.compareDocumentPosition(u.block) & Node.DOCUMENT_POSITION_FOLLOWING);
    const unit: Unit = { block: row, words: [], atoms: chips, stagger: 25 };

    units.splice(at < 0 ? units.length : at, 0, unit);
  });

  col.querySelectorAll<HTMLElement>(".sig").forEach(sig => units.push({ block: sig, sig, words: [], atoms: [] }));
  col.querySelectorAll<HTMLElement>(".small").forEach(small => units.push({ block: small, words: [], atoms: [small], fadeOnly: true, after: true }));


  units.forEach((unit) => {
    // Marks drawn by the stylesheet are no elements to hide: a list item's bullet or
    // number, a dot between items, the back link's chevron. They wait with their
    // block, held back by a class (global.css), and come in with its first words,
    // rather than stand alone where the words have yet to rise.
    unit.block.classList.add("rv-mk");

    unit.words.forEach((word) => {
      word.style.transform = HIDDEN;
    });
    unit.atoms.forEach((atom) => {
      // At once: a link's icon fades its opacity, and would linger on the first frames.
      atom.style.transition = "none";
      atom.style.opacity = "0";
    });

    if (unit.name) {
      setUpName(unit);
    }
  });

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

    // Its letters, each in a box, would be read as "E Oussama s s a m a d i": the
    // heading carries the name whole until they are gone.
    const heading = node.parentElement?.closest("h1");

    if (heading && !heading.hasAttribute("aria-label")) {
      heading.setAttribute("aria-label", node.nodeValue!.trim());
      labelled = heading;
    }

    node.parentNode!.replaceChild(box, node);
    texts.push({ orig: node, span: box });

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

  root.setAttribute("data-rv", "run");

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

  const pump = () => {
    const t = now();
    const waiting = (u: Unit) => !u.played && u.seen;
    const lines = units.filter(u => waiting(u) && !u.sig && !u.after);
    const n = lines.filter(u => !u.fadeOnly).length;
    const first = !opened && n > 1;
    const at = (i: number) => first ? Math.min(i * STEP, FIRST * (i / (n - 1)) ** 0.7) : i * STEP;
    let i = 0;

    cursor = Math.max(cursor, t);
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

    if (units.every(u => u.played)) {
      const sigLeft = Math.max(0, ...units.map(u => u.sigEnd ? u.sigEnd + 700 - now() : 0));

      Promise.all([...anims].map(a => a.finished.catch(() => {}))).then(() => later(() => finish(true), Math.max(0, sigLeft - (now() - t)) + 60));
    }
  };

  // Each block's units, found at once: a long post has thousands of blocks.
  const byBlock = new Map<Element, Unit[]>();

  units.forEach(unit => byBlock.set(unit.block, [...(byBlock.get(unit.block) ?? []), unit]));

  // The page's last lines can sit in the strip along the bottom that does not count as
  // in view, even with the page scrolled to its end (the copyright, on a phone): there,
  // whatever shows at all has come into view.
  const atEnd = () => {
    if (innerHeight + scrollY < root.scrollHeight - 2) {
      return false;
    }

    let any = false;

    units.forEach((unit) => {
      if (!unit.seen && unit.block.getBoundingClientRect().top < innerHeight) {
        unit.seen = true;
        any = true;
      }
    });

    return any;
  };
  const scrolled = () => {
    if (atEnd()) {
      pump();
    }
  };

  const io = new IntersectionObserver((entries) => {
    let any = atEnd();

    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      (byBlock.get(entry.target) ?? []).forEach((unit) => {
        if (!unit.seen) {
          unit.seen = true;
          any = true;
        }
      });
      io.unobserve(entry.target);
    });

    if (any) {
      pump();
    }
  }, { rootMargin: "0px 0px -6% 0px", threshold: 0 });

  new Set(units.map(u => u.block)).forEach(block => io.observe(block));
  addEventListener("scroll", scrolled, { passive: true });

  // Anything the visitor does settles the page at once, so nothing is left half-written.
  const settle = () => finish(false);

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
    io.disconnect();
    timers.forEach(clearTimeout);
    anims.forEach(animation => animation.cancel());
    units.forEach((unit) => {
      unit.block.classList.remove("rv-mk");
      unit.words.forEach((word) => {
        word.style.transform = "";
      });
      unit.n?.ri.forEach((letter) => {
        letter.style.transform = "";
      });
      unit.atoms.forEach((atom) => {
        atom.style.opacity = "";
        atom.style.transition = "";
      });

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
    });
    removeEventListener("pointerdown", settle, true);
    removeEventListener("keydown", settle, true);
    removeEventListener("beforeprint", settle);
    removeEventListener("scroll", scrolled);
    done();

    let restored = false;
    const restore = () => {
      if (!restored) {
        restored = true;
        texts.forEach(({ orig, span }) => span.parentNode?.replaceChild(orig, span));
        labelled?.removeAttribute("aria-label");
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

  addEventListener("pointerdown", settle, true);
  addEventListener("keydown", settle, true);
  // Printed before the page was read down, the lines not yet risen would print blank.
  addEventListener("beforeprint", settle);
}

if (root.dataset.rv === "pre") {
  let started = false;
  const start = () => {
    if (!started) {
      started = true;
      reveal();
    }
  };

  // Waits for the fonts only if they are about to arrive: the text is set in a stand-in
  // sized like them until they do (fonts.css), so it does not shift when they come, and
  // a slow connection sees the page now rather than half a second later.
  document.fonts.ready.then(start, start);
  setTimeout(start, 120);
}

export {};
