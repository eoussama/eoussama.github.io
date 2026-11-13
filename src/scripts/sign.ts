/*
 * The signature signs itself again: a double click, or a long press on a touch
 * screen, and it is written once more, stroke by stroke, in the order and at the pace
 * it first was, fresh ink and all (Signature.astro). Played over whatever the page has
 * left it as, then let go, so the drawn signature is back as it was.
 */

const sig = document.querySelector<HTMLElement>(".sig");
/** How long a finger rests on it before it signs again, in milliseconds. */
const HOLD = 550;

if (sig && "animate" in Element.prototype) {
  const seconds = (value: string) => Number.parseFloat(value) || 0;
  // Each stroke's pace as it was written, read before the first-load reveal shifts or
  // hurries it (reveal.ts), with its wait counted from the first stroke.
  const timing = (el: SVGElement) => ({ el, delay: seconds(el.style.animationDelay), duration: seconds(el.style.animationDuration), easing: el.style.animationTimingFunction || "linear" });
  const strokes = [...sig.querySelectorAll<SVGPathElement>("mask path")].map(timing);
  const sheen = [...sig.querySelectorAll<SVGElement>(".sig-wet")].map(timing);
  const start = Math.min(...strokes.map(stroke => stroke.delay));
  let playing: Animation[] = [];

  /** Writes it again, from the first stroke. */
  const sign = () => {
    if (playing.length || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    playing = [
      ...strokes.map(({ el, delay, duration, easing }) => el.animate(
        [{ strokeDashoffset: 1.5 }, { strokeDashoffset: 1, offset: 0.0001 }, { strokeDashoffset: 0 }],
        { duration: duration * 1000, delay: (delay - start) * 1000, easing, fill: "both" },
      )),
      ...sheen.map(({ el, delay, duration }) => el.animate(
        [{ opacity: 0.55 }, { opacity: 0.4, offset: 0.45 }, { opacity: 0 }],
        { duration: duration * 1000 || 1100, delay: (delay - start) * 1000, easing: "cubic-bezier(.3,0,.7,1)", fill: "both" },
      )),
    ];

    Promise.all(playing.map(animation => animation.finished)).then(() => {
      playing.forEach(animation => animation.cancel());
      playing = [];
    }, () => {});
  };

  sig.addEventListener("dblclick", sign);

  // A long press, for a finger: held still on it for a moment.
  let hold = 0;
  let from: [number, number] | null = null;

  sig.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse") {
      return;
    }

    from = [event.clientX, event.clientY];
    hold = window.setTimeout(sign, HOLD);
  });
  sig.addEventListener("pointermove", (event) => {
    if (from && Math.hypot(event.clientX - from[0], event.clientY - from[1]) > 10) {
      clearTimeout(hold);
    }
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach(type => sig.addEventListener(type, () => clearTimeout(hold)));
}

export {};
