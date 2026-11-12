import lakama from "~/assets/lakama.png?url";



/*
 * A secret: typing "lakama" in the command menu fires a confetti of Lakama L Hunt
 * icons from the bottom corners. Nothing hints at it. The canvas is a popover, so it
 * enters the top layer above the open command menu.
 */

type Bit = { x: number; y: number; vx: number; vy: number; s: number; rot: number; spin: number; flip: number; fs: number; sway: number; t0: number };

let running = false;

/** Fires the confetti, unless it is already falling. */
export function lakamaRain() {
  if (running) {
    return;
  }

  running = true;

  const canvas = document.createElement("canvas");
  const image = new Image();
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  canvas.className = "lk-sky";
  canvas.setAttribute("aria-hidden", "true");
  canvas.popover = "manual";
  document.body.append(canvas);
  canvas.showPopover();

  const done = () => {
    canvas.remove();
    running = false;
  };

  image.onerror = done;
  image.onload = () => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    const W = innerWidth;
    const H = innerHeight;
    const g = canvas.getContext("2d")!;
    const sizes = [0.7, 0.85, 1, 1, 1.2, 1.45];
    const n = Math.round(Math.max(34, Math.min(84, W / 17)));
    const bits: Bit[] = [];

    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);

    if (reduce) {
      // Still: a handful of icons that appear, rest a moment and fade.
      for (let i = 0; i < 14; i++) {
        bits.push({ x: (0.08 + 0.84 * Math.random()) * W, y: (0.1 + 0.7 * Math.random()) * H, vx: 0, vy: 0, s: sizes[i % 6]!, rot: (Math.random() - 0.5) * 0.6, spin: 0, flip: 0, fs: 0, sway: 0, t0: 0 });
      }
    }
    else {
      // Two cannons in the bottom corners, then a second, smaller salvo.
      for (let i = 0; i < n; i++) {
        const left = i % 2 === 0;
        const late = i >= n * 0.62;
        const angle = (left ? -1.05 : -2.09) + (Math.random() - 0.5) * 0.75;
        const speed = H * (1.9 + Math.random() * 1.75) * (late ? 0.82 : 1);

        bits.push({
          x: left ? -20 : W + 20,
          y: H + 20,
          vx: Math.cos(angle) * speed * (W < 600 ? 0.55 : 1),
          vy: Math.sin(angle) * speed,
          s: sizes[i % 6]!,
          rot: Math.random() * 6.283,
          spin: (Math.random() - 0.5) * 9,
          flip: Math.random() * 6.283,
          fs: 2.5 + Math.random() * 5,
          sway: Math.random() * 6.283,
          t0: (late ? 0.28 : 0) + Math.random() * 0.12,
        });
      }
    }

    const start = performance.now();
    let last = start;
    const iw = image.naturalWidth || 47;
    const ih = image.naturalHeight || 49;

    const frame = (now: number) => {
      const t = (now - start) / 1000;
      const dt = Math.min(0.04, (now - last) / 1000);

      last = now;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      g.imageSmoothingEnabled = false;

      if (reduce) {
        const alpha = Math.min(1, t / 0.25) * Math.max(0, Math.min(1, (1.7 - t) / 0.35));

        for (const bit of bits) {
          g.save();
          g.globalAlpha = alpha;
          g.translate(bit.x, bit.y);
          g.rotate(bit.rot);
          g.drawImage(image, -iw * bit.s / 2, -ih * bit.s / 2, iw * bit.s, ih * bit.s);
          g.restore();
        }

        if (t < 1.7) {
          requestAnimationFrame(frame);
        }
        else {
          done();
        }

        return;
      }

      let alive = 0;

      for (const bit of bits) {
        if (t < bit.t0) {
          alive++;
          continue;
        }

        // Light things in the air: strong drag, a slow tumble, a sway on the way down.
        bit.vy += 1150 * dt;
        bit.vx -= bit.vx * 2.1 * dt;
        bit.vy -= bit.vy * 2.1 * dt;
        bit.sway += dt * 3.1;

        if (bit.vy > 0) {
          bit.vx += Math.sin(bit.sway) * 260 * dt;
        }

        bit.x += bit.vx * dt;
        bit.y += bit.vy * dt;
        bit.rot += bit.spin * dt;
        bit.spin -= bit.spin * 0.6 * dt;
        bit.flip += bit.fs * dt;

        if (bit.y > H + 70 && bit.vy > 0) {
          continue;
        }

        alive++;

        const c = Math.cos(bit.flip);

        g.save();
        g.translate(bit.x, bit.y);
        g.rotate(bit.rot);
        g.scale(bit.s * (c < 0 ? -1 : 1) * (0.22 + 0.78 * Math.abs(c)), bit.s);
        g.globalAlpha = Math.min(1, (t - bit.t0) / 0.08);
        g.drawImage(image, -iw / 2, -ih / 2, iw, ih);
        g.restore();
      }

      if (alive && t < 9) {
        requestAnimationFrame(frame);
      }
      else {
        done();
      }
    };

    requestAnimationFrame(frame);
  };
  image.src = lakama;
}
