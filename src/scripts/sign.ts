/*
 * The signature signs itself again: a double click, or a long press on a touch
 * screen, and it is written once more, stroke by stroke, in the order and at the pace
 * it first was, fresh ink and all (Signature.astro).
 *
 * The pen runs dry. Each signing takes some of its ink, so the next comes out a little
 * paler as it goes, and after a few the pen gives out partway through and leaves the
 * rest unwritten. Left alone for a few seconds, it is filled again: the next signing
 * is dark from the start, opening on a blot that soaks into the paper.
 *
 * Signed again once it has run quite dry, even after a rest, the pen is filled one last
 * time and writes it in full, and a pane of glass slams down over it, with a sign taped
 * on: no more ink.
 * It stays for the visit; signing again only knocks on it.
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
  /** Whether the glass is down. */
  let sealed = false;

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

  /**
   * How the sign tilts at rest, so its swings settle back there.
   *
   * @param tag - The sign
   * @returns Its tilt, in degrees
   */
  const tilt = (tag: Element) => Number.parseFloat(getComputedStyle(tag).rotate) || 0;

  /**
   * Brings a pane of glass down over the signature: it falls, lands with a little
   * bounce that jolts the signature under it, and a glint runs across it. A staple
   * punches through each side into the paper, and a sign taped to its corner swings
   * into place.
   */
  const slam = () => {
    sealed = true;

    const glass = document.createElement("div");
    const tag = document.createElement("p");
    const staples = [document.createElement("span"), document.createElement("span")];

    glass.className = "sig-glass";
    tag.className = "sig-sign";
    tag.setAttribute("role", "status");
    tag.textContent = sig.dataset.noInk ?? "";
    staples.forEach(staple => staple.className = "sig-staple");
    glass.append(...staples, tag);
    sig.append(glass);

    // It lands seven tenths of the way through its fall.
    const fall = 460;
    const lands = fall * 0.7;
    const rest = tilt(tag);
    const jolt = (el: Element | null, delay: number, px = 3) => el?.animate(
      [{ transform: "none" }, { transform: `translate(${-px}px, 1px)` }, { transform: `translate(${px}px, -1px)` }, { transform: `translate(${-px / 2}px, 0)` }, { transform: "none" }],
      { duration: 280, delay, easing: "ease-out", composite: "add" },
    );

    // Close to the eye at first and hardly there, it comes down faster and faster,
    // shows in full only just before it lands, squashes a little on impact and settles.
    glass.animate(
      [
        { transform: "translateY(-34px) scale(1.3)", easing: "cubic-bezier(.55,0,1,.55)" },
        { transform: "none", offset: 0.7, easing: "cubic-bezier(0,0,.3,1)" },
        { transform: "scale(.985)", offset: 0.78, easing: "cubic-bezier(.3,0,.5,1)" },
        { transform: "translateY(-2px)", offset: 0.9, easing: "cubic-bezier(.5,0,1,.5)" },
        { transform: "none" },
      ],
      { duration: fall, fill: "backwards" },
    );
    glass.animate([{ opacity: 0 }, { opacity: 0.12, offset: 0.75 }, { opacity: 1 }], { duration: lands, easing: "cubic-bezier(.7,0,1,.7)", fill: "backwards" });
    jolt(sig.querySelector("svg"), lands);
    window.setTimeout(() => glass.classList.add("is-set"), lands);
    tag.animate(
      [{ opacity: 0, rotate: `${rest - 22}deg`, scale: "0.9" }, { opacity: 1, rotate: `${rest + 6}deg`, scale: "1", offset: 0.55 }, { rotate: `${rest - 4}deg`, offset: 0.8 }, { rotate: `${rest}deg` }],
      { duration: 720, delay: lands + 60, easing: "ease-out", fill: "backwards" },
    );

    // Then the staples, one side after the other, each a jolt as it goes in.
    staples.forEach((staple, i) => {
      const at = lands + 420 + i * 220;

      staple.animate(
        [{ opacity: 0, scale: "1.5", translate: "0 -6px" }, { opacity: 1, scale: "0.92", translate: "0 0", offset: 0.6 }, { scale: "1" }],
        { duration: 160, delay: at, easing: "cubic-bezier(.6,0,1,.6)", fill: "backwards" },
      );
      jolt(glass, at + 100, 1.5);
    });
  };

  /** A knock on the glass: pinned down, it only shudders, and the sign swings on its tape. */
  const knock = () => {
    const glass = sig.querySelector<HTMLElement>(".sig-glass");
    const tag = glass?.querySelector(".sig-sign");

    glass?.animate([{ transform: "none" }, { transform: "translateX(-1px)" }, { transform: "translateX(1px)" }, { transform: "none" }], { duration: 160, easing: "ease-out" });

    if (tag) {
      const rest = tilt(tag);

      tag.animate([{ rotate: `${rest}deg` }, { rotate: `${rest - 8}deg` }, { rotate: `${rest + 5}deg` }, { rotate: `${rest - 2}deg` }, { rotate: `${rest}deg` }], { duration: 640, easing: "ease-out" });
    }
  };

  /** Writes it again, from the first stroke, with whatever ink the pen has. */
  const sign = () => {
    if (signing || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    if (sealed) {
      knock();

      return;
    }

    const now = performance.now();
    const dry = used >= 3;
    // Signed again once it has run quite dry, rested or not, the pen is filled one
    // final time, and then the glass. A rest only fills a pen that is running low.
    const last = used >= INK.length;

    if (last || now - rested >= REST) {
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

    // The last filling drops no blot: the glass is what lands there.
    if (filled && !last) {
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

      if (last) {
        slam();
      }
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
