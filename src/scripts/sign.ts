/*
 * The signature signs itself again: a double click, or a long press on a touch
 * screen, and it is written once more, stroke by stroke, in the order and at the pace
 * it first was, fresh ink and all (Signature.astro).
 *
 * The pen runs dry. Each signing takes some of its ink, so the next comes out a little
 * paler as it goes, and after a few the pen gives out partway through and leaves the
 * rest unwritten. Left alone for a few seconds, it is filled again: the next signing
 * is dark from the start, opening on a blot that soaks into the paper.
 */

const sig = document.querySelector<HTMLElement>(".sig");
/** How long a finger rests on it before it signs again, in milliseconds. */
const HOLD = 550;
/** How long the pen must rest to be filled again, in milliseconds. */
const REST = 4000;
/** How dark the ink is at the start of each signing since the pen was filled. */
const INK = [1, 1, 0.82, 0.6, 0.42, 0.3];
/** How much of the signature each signing gets through before the pen gives out. */
const REACH = [1, 1, 1, 0.7, 0.35, 0.12];

if (sig && "animate" in Element.prototype) {
  const seconds = (value: string) => Number.parseFloat(value) || 0;
  // Each stroke's pace as it was written, read before the first-load reveal shifts or
  // hurries it (reveal.ts), with its wait counted from the first stroke.
  const timing = (el: SVGElement) => ({ el, delay: seconds(el.style.animationDelay), duration: seconds(el.style.animationDuration), easing: el.style.animationTimingFunction || "linear" });
  const strokes = [...sig.querySelectorAll<SVGPathElement>("mask path")].map(timing);
  const sheen = [...sig.querySelectorAll<SVGElement>(".sig-wet")].map(timing);
  const start = Math.min(...strokes.map(stroke => stroke.delay));
  const end = Math.max(...strokes.map(stroke => stroke.delay + stroke.duration)) - start;
  /** What the ink is painted in, so it can pale. */
  const paint = sig.querySelector<SVGGElement>(".sig-ink > g");
  /** Where the ink goes through the paper's grain, so a blot takes it too. */
  const grain = paint?.querySelector<SVGGElement>("g[filter]") ?? paint;

  /** What the last signing left: kept until the next, so a dry one stays as it was. */
  let left: Animation[] = [];
  let signing = false;
  /** Signings since the pen was last filled. */
  let used = 0;
  let rested = 0;

  /**
   * Drops a blot where the pen first touches: it spreads a little past the stroke,
   * then soaks in and is gone.
   */
  const blot = () => {
    const first = strokes[0]?.el as SVGPathElement | undefined;

    if (!first || !grain) {
      return;
    }

    const at = first.getPointAtLength(0);
    const drop = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    const width = Number.parseFloat(first.getAttribute("stroke-width") ?? "12");

    drop.setAttribute("cx", String(at.x));
    drop.setAttribute("cy", String(at.y));
    drop.setAttribute("rx", String(width * 1.25));
    drop.setAttribute("ry", String(width * 1.05));
    drop.style.transformBox = "fill-box";
    drop.style.transformOrigin = "center";
    grain.append(drop);
    drop.animate(
      [
        { opacity: 0, transform: "scale(.2)" },
        { opacity: 1, transform: "scale(1)", offset: 0.08 },
        { opacity: 1, transform: "scale(1.12)", offset: 0.3 },
        { opacity: 0, transform: "scale(1.2)" },
      ],
      { duration: 2600, easing: "cubic-bezier(.3,0,.5,1)" },
    ).finished.then(() => drop.remove(), () => drop.remove());
  };

  /** Writes it again, from the first stroke, with whatever ink the pen has. */
  const sign = () => {
    if (signing || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const now = performance.now();
    const dry = used >= 3;

    if (now - rested >= REST) {
      used = 0;
    }

    const filled = dry && used === 0;
    const turn = Math.min(used, INK.length - 1);
    const from = INK[turn]!;
    const to = INK[Math.min(turn + 1, INK.length - 1)]!;
    const reach = REACH[turn]! * end;

    left.forEach(animation => animation.cancel());
    signing = true;
    used += 1;

    if (filled) {
      blot();
    }

    // A stroke the pen does not reach stays unwritten.
    const written = ({ delay }: { delay: number }) => delay - start < reach;
    const pen = strokes.map(({ el, delay, duration, easing }) => written({ delay })
      ? el.animate(
          [{ strokeDashoffset: 1.5 }, { strokeDashoffset: 1, offset: 0.0001 }, { strokeDashoffset: 0 }],
          { duration: duration * 1000, delay: (delay - start) * 1000, easing, fill: "both" },
        )
      : el.animate([{ strokeDashoffset: 1.5 }, { strokeDashoffset: 1.5 }], { duration: 1, fill: "forwards" }));
    const gloss = sheen.filter(written).map(({ el, delay, duration }) => el.animate(
      [{ opacity: 0.55 }, { opacity: 0.4, offset: 0.45 }, { opacity: 0 }],
      { duration: duration * 1000 || 1100, delay: (delay - start) * 1000, easing: "cubic-bezier(.3,0,.7,1)", fill: "both" },
    ));
    const pale = from < 1 || to < 1
      ? paint?.animate([{ opacity: from }, { opacity: to }], { duration: Math.max(reach, 0.1) * 1000, easing: "linear", fill: "forwards" })
      : undefined;
    const mine = [...pen, ...gloss, ...(pale ? [pale] : [])];

    left = mine;

    // Signed once the pen lifts, while the last of the ink is still drying: it can be
    // signed again from there.
    Promise.all(pen.map(animation => animation.finished)).then(() => {
      signing = false;
      rested = performance.now();
    }, () => {});

    // Written in full and in full ink, it is let go once dry: the drawn signature is
    // back as the page left it.
    Promise.all(mine.map(animation => animation.finished)).then(() => {
      if (left === mine && !pale && reach >= end) {
        mine.forEach(animation => animation.cancel());
        left = [];
      }
    }, () => {});
  };

  sig.addEventListener("dblclick", sign);

  // A long press, for a finger: held still on it for a moment.
  let hold = 0;
  let at: [number, number] | null = null;

  sig.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse") {
      return;
    }

    at = [event.clientX, event.clientY];
    hold = window.setTimeout(sign, HOLD);
  });
  sig.addEventListener("pointermove", (event) => {
    if (at && Math.hypot(event.clientX - at[0], event.clientY - at[1]) > 10) {
      clearTimeout(hold);
    }
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach(type => sig.addEventListener(type, () => clearTimeout(hold)));
}

export {};
