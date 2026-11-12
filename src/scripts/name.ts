/*
 * Now and then, the name on the home page folds back into "EOussama": the letters of
 * Essamadi sink one by one, its E drops, Oussama steps aside and the E comes back up
 * in front. A few minutes later it unfolds again, as it did when the page first
 * showed. Only while the name is in sight, the tab is showing and no list is open;
 * never with reduced motion. Screen readers always hear the full name.
 */

const root = document.documentElement;
const siteName = document.querySelector<HTMLElement>(".col .site-name");
const FULL = "Oussama Essamadi";
const EASE = "cubic-bezier(.2,.75,.15,1)";
const HIDDEN = "translateY(108%)";

type Parts = { box: HTMLElement; o: HTMLElement; e: HTMLElement; ew: HTMLElement; ei: HTMLElement; rest: HTMLElement[] };

/**
 * A little window a word or letter rises into, as in the first-load reveal.
 *
 * @param text - The word or letter
 * @returns The window, with the text inside
 */
function windowFor(text: string): HTMLElement {
  const outer = document.createElement("span");
  const inner = document.createElement("span");

  outer.className = "rv-w";
  inner.className = "rv-i";
  inner.textContent = text;
  outer.append(inner);

  return outer;
}

/**
 * How long to wait before the next change: a few minutes, never quite the same.
 *
 * @returns Milliseconds
 */
function pause(): number {
  return (150 + Math.random() * 90) * 1000;
}

/** Runs the folding and unfolding on the home page's name. */
function loop() {
  if (!siteName || siteName.textContent?.trim() !== FULL || root.dir === "rtl") {
    return;
  }

  // The plain name, once the first-load reveal has handed it back.
  const plain = () => siteName.childNodes.length === 1 && siteName.firstChild instanceof Text ? siteName.firstChild : null;
  let text: Text | null = null;
  let parts: Parts | null = null;
  let folded = false;
  let busy = false;
  let inView = true;

  const label = document.createElement("span");

  label.className = "sr";
  label.textContent = FULL;

  /**
   * Swaps the plain name for its moving parts, laid out in full.
   *
   * @returns The parts
   */
  const build = (): Parts => {
    const box = document.createElement("span");
    const o = document.createElement("span");
    const e = document.createElement("span");
    const ew = windowFor("E");
    const letters = Array.from("ssamadi").map(windowFor);

    box.className = "rv-t rv-name";
    box.setAttribute("aria-hidden", "true");
    ew.classList.add("rv-ew");
    o.className = "rv-o";
    o.append(windowFor("Oussama"));
    e.className = "rv-e";
    e.append(ew, ...letters);
    box.append(o, document.createTextNode(" "), e);
    siteName.replaceChildren(label, box);

    return { box, o, e, ew, ei: ew.firstChild as HTMLElement, rest: letters.map(l => l.firstChild as HTMLElement) };
  };

  const animate = (el: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) =>
    el.animate(keyframes, { fill: "both", easing: EASE, duration: 620, ...options }).finished;

  /**
   * "Oussama Essamadi" folds into "EOussama".
   *
   * @returns Once it has played
   */
  const fold = async () => {
    text = plain()!;

    const P = build();

    parts = P;

    // Essamadi sinks from its last letter back, then its E.
    const sinking = P.rest.map((letter, k) => animate(letter, [{ transform: "none" }, { transform: HIDDEN }], { delay: (P.rest.length - 1 - k) * 45, duration: 420, easing: "cubic-bezier(.5,0,.75,0)" }));

    sinking.push(animate(P.ei, [{ transform: "none" }, { transform: HIDDEN }], { delay: 330, duration: 340, easing: "cubic-bezier(.5,0,.75,0)" }));
    await Promise.all(sinking);

    // The E moves to the front; Oussama steps aside for it, and it rises there.
    const before = P.o.getBoundingClientRect().left;

    P.box.insertBefore(P.ew, P.o);

    const shift = before - P.o.getBoundingClientRect().left;

    await Promise.all([
      animate(P.o, [{ transform: `translateX(${shift}px)` }, { transform: "none" }], { duration: 760, easing: "cubic-bezier(.65,0,.25,1)" }),
      animate(P.ei, [{ transform: HIDDEN }, { transform: "none" }], { delay: 420 }),
    ]);
  };

  /**
   * "EOussama" unfolds into "Oussama Essamadi", as on the first load.
   *
   * @returns Once it has played
   */
  const unfold = async () => {
    const P = parts!;
    const before = P.o.getBoundingClientRect().left;
    const eBefore = P.ew.getBoundingClientRect().left;

    P.e.insertBefore(P.ew, P.e.firstChild);

    const dO = before - P.o.getBoundingClientRect().left;
    const at = `translateX(${eBefore - P.ew.getBoundingClientRect().left}px)`;

    await Promise.all([
      animate(P.ei, [{ transform: "none" }, { transform: HIDDEN }], { duration: 340, easing: "cubic-bezier(.5,0,.75,0)" }),
      animate(P.ew, [{ transform: at }, { transform: at, offset: 0.5 }, { transform: "none", offset: 0.5 }, { transform: "none" }], { duration: 700, easing: "linear", fill: "none" }),
      animate(P.o, [{ transform: `translateX(${dO}px)` }, { transform: "none" }], { delay: 120, duration: 760, easing: "cubic-bezier(.65,0,.25,1)", fill: "none" }),
      animate(P.ei, [{ transform: HIDDEN }, { transform: "none" }], { delay: 700 }),
      ...P.rest.map((letter, k) => animate(letter, [{ transform: HIDDEN }, { transform: "none" }], { delay: 790 + k * 45 })),
    ]);

    // Back to the plain text, exactly as the page has it.
    siteName.replaceChildren(text!);
    parts = null;
  };

  const ready = () => inView && document.visibilityState === "visible" && !root.dataset.open && !busy && (folded || !!plain());

  /**
   * Plays the next change once the name can be seen, then waits for the one after.
   *
   * @returns Once it has played, or been put off
   */
  const step = async () => {
    if (!ready()) {
      window.setTimeout(step, 4000);

      return;
    }

    busy = true;

    try {
      await (folded ? unfold() : fold());
      folded = !folded;
    }
    catch {
      // A change cut short (the page was left): put the name back as it was.
      if (text) {
        siteName.replaceChildren(text);
      }

      parts = null;
      folded = false;
    }

    busy = false;
    window.setTimeout(step, pause());
  };

  new IntersectionObserver(([entry]) => {
    inView = !!entry?.isIntersecting;
  }).observe(siteName);

  window.setTimeout(step, pause());
}

// The first change comes minutes after the page shows, long after its first-load
// reveal; a step simply waits while the reveal still holds the name.
if (siteName && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  loop();
}

export {};
