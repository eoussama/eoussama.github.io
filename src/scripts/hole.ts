import fragment from "./hole.frag?raw";



/*
 * The 404 page's black hole. The hole and its torn rim are drawn by a shader on their
 * own canvas; dust, scraps of paper and the letters of the missing address swirl in
 * on a second canvas over the page; and the page's own letters and the header lean
 * toward it. The cursor stirs its light; a click tears a few scraps off and sends a
 * ripple through the page. It opens as a pinprick that strains, then tears wide with a
 * gulp. With reduced motion everything holds still, already open.
 */

type GL = { gl: WebGLRenderingContext; u: Record<string, WebGLUniformLocation | null>; canvas: HTMLCanvasElement };
type Part = { kind: "dust" | "flake" | "glyph"; ch?: string; temp?: boolean; r: number; a: number; rot: number; spin: number; flip: number; fs: number; born: number; k: number; sz: number; dx: number; dy: number; vx: number; vy: number; pts?: [number, number][] };
type Stir = { r: number; a: number; z: number; zt: number; w: number };
type Wave = { t: number; s: number; rad: number; amp: number };
type Leaner = { el: HTMLElement; bar: boolean; unit: boolean; on: boolean; x: number; y: number; ph: number; off: [number, number] };

const root = document.documentElement;

/** When the paper first gives, in seconds from the start. */
const PRICK = 0.12;
/** When the pinprick tears wide open. */
const TEAR = 0.6;
/** How long tearing open takes. */
const WIDE = 1;
/** How big the pinprick gets before it tears, as a share of the hole. */
const PIN = 0.07;

/**
 * How far open the hole is, a while after the page shows: nothing, then a pinprick
 * that grows and trembles, then a tear that opens past its size and settles back.
 *
 * @param t - Seconds since the start
 * @returns Its size as a share of the full hole, and how much of everything around
 * it (scraps in flight, the lean of the page) has come in
 */
function opening(t: number): { grow: number; appear: number } {
  if (t < PRICK) {
    return { grow: 0, appear: 0 };
  }

  if (t < TEAR) {
    const k = (t - PRICK) / (TEAR - PRICK);
    const s = 1 - (1 - k) ** 2;

    return { grow: PIN * s * (1 + 0.18 * Math.sin(k * 46) * s), appear: 0 };
  }

  const k = Math.min(1, (t - TEAR) / WIDE);
  const back = 1 + 2.5 * (k - 1) ** 3 + 1.5 * (k - 1) ** 2;
  const a = Math.min(1, k * 1.4);

  return { grow: PIN + (1 - PIN) * back, appear: a * a * (3 - 2 * a) };
}

/**
 * Sets up the shader that draws the hole.
 *
 * @param canvas - Its canvas
 * @returns The program and its inputs, or null where WebGL is unavailable
 */
function holeGL(canvas: HTMLCanvasElement | null): GL | null {
  const gl = canvas?.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false });

  if (!canvas || !gl) {
    return null;
  }

  const make = (type: number, source: string) => {
    const shader = gl.createShader(type)!;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
  };
  const vs = make(gl.VERTEX_SHADER, "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}");
  const fs = make(gl.FRAGMENT_SHADER, fragment);

  if (!vs || !fs) {
    return null;
  }

  const program = gl.createProgram()!;

  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    return null;
  }

  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

  const loc = gl.getAttribLocation(program, "p");

  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const u: GL["u"] = {};

  ["uRes", "uC", "uM", "uCd", "uR", "uT", "uFlow", "uLife", "uPull", "uPulse", "uDark", "uProx", "uDpr", "uBg", "uAcc"].forEach((name) => {
    u[name] = gl.getUniformLocation(program, name);
  });
  u.uStir = gl.getUniformLocation(program, "uStir[0]");
  u.uWave = gl.getUniformLocation(program, "uWave[0]");

  return { gl, u, canvas };
}

/**
 * Text cut into letters, each in its own span the hole can pull on.
 *
 * @param el - Where to put them
 * @param text - The text
 */
function letters(el: HTMLElement, text: string) {
  el.replaceChildren(...Array.from(text).map((c) => {
    const span = document.createElement("span");

    span.className = "nf-ch";
    span.textContent = c;

    return span;
  }));
}

/** Starts the hole. */
function start() {
  const hole = document.querySelector<HTMLElement>(".nf-hole");
  const sky = document.querySelector<HTMLCanvasElement>(".nf-sky");

  if (!hole || !sky) {
    return;
  }

  // The address asked for: this page's own, or the one passed on from the root 404.
  const asked = new URLSearchParams(location.search).get("from") ?? location.pathname;
  const urlEl = document.querySelector<HTMLElement>(".nf-url");

  if (urlEl) {
    letters(urlEl, `${location.host}${asked}`);
  }

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const GLX = holeGL(hole.querySelector("canvas"));
  const H = { last: performance.now(), open: 0, torn: false, T: 0, flow: 0, life: 0, pull: 1, prox: 0, pulse: 0, pv: 0, calm: 0, m: [0, 0], cd: [1, 0], mx: null as number | null, my: null as number | null, stir: [] as Stir[], waves: [] as Wave[], q: Math.min(2, devicePixelRatio || 1), slow: 0, n: 0, stirT: 0, sl: null as number[] | null, scan: 0, chars: null as Leaner[] | null, map: null as Map<HTMLElement, Leaner> | null, bar: null as HTMLElement | null };
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;

    return (seed - 1) / 2147483646;
  };

  // Colours come from the theme.
  const probe = document.createElement("canvas");

  probe.width = probe.height = 1;

  const pg = probe.getContext("2d", { willReadFrequently: true })!;
  const cache: Record<string, number[]> = {};
  const rgb = (value: string) => {
    if (!cache[value]) {
      pg.clearRect(0, 0, 1, 1);
      pg.fillStyle = "#000";
      pg.fillStyle = value;
      pg.fillRect(0, 0, 1, 1);

      const d = pg.getImageData(0, 0, 1, 1).data;

      cache[value] = [d[0]! / 255, d[1]! / 255, d[2]! / 255];
    }

    return cache[value];
  };

  // Dust, scraps of paper and the letters of the missing address, all falling in.
  const word = asked.split("/").filter(Boolean).pop()?.slice(0, 20) ?? "an-old-page";
  const parts: Part[] = [];
  const chip = () => {
    const n = 4 + Math.floor(rnd() * 3);
    const size = 2.4 + rnd() * 3.2;
    const pts: [number, number][] = [];

    for (let j = 0; j < n; j++) {
      const a = j / n * 6.283 + (rnd() - 0.5) * 0.7;
      const rr = size * (0.6 + rnd() * 0.6);

      pts.push([Math.cos(a) * rr, Math.sin(a) * rr * 0.8]);
    }

    return pts;
  };
  const spawn = (p: Part, fresh: boolean) => {
    p.r = fresh ? 0.5 + rnd() * 2.05 : 2.3 + rnd() * 0.3;
    p.a = rnd() * 6.283;
    p.rot = rnd() * 6.283;
    p.spin = (rnd() - 0.5) * 2.6;
    p.flip = rnd() * 6.283;
    p.fs = 1.2 + rnd() * 2.4;
    p.born = fresh ? 1 : 0;
    p.k = 0.7 + rnd() * 0.6;
    p.sz = 0.7 + rnd() * 0.7;
    p.dx = 0;
    p.dy = 0;
    p.vx = 0;
    p.vy = 0;

    if (p.kind === "flake") {
      p.pts = chip();
    }

    return p;
  };
  const blank = (kind: Part["kind"], extra: Partial<Part> = {}): Part => ({ kind, r: 0, a: 0, rot: 0, spin: 0, flip: 0, fs: 0, born: 0, k: 1, sz: 1, dx: 0, dy: 0, vx: 0, vy: 0, ...extra });

  for (let i = 0; i < 84; i++) {
    parts.push(spawn(blank("dust"), true));
  }

  for (let i = 0; i < 22; i++) {
    parts.push(spawn(blank("flake"), true));
  }

  for (const c of `${word}/`) {
    parts.push(spawn(blank("glyph", { ch: c }), true));
  }

  const geo = () => {
    const rr = sky.getBoundingClientRect();
    const pr = hole.getBoundingClientRect();

    return { ox: rr.left, oy: rr.top, W: rr.width, Hh: rr.height, pw: pr.width, phh: pr.height, cx: pr.left - rr.left + pr.width / 2, cy: pr.top - rr.top + pr.height / 2, half: Math.min(pr.width, pr.height) / 2 };
  };

  document.addEventListener("pointermove", (e) => {
    H.mx = e.clientX;
    H.my = e.clientY;
  });

  const leave = () => {
    H.mx = null;
    H.my = null;
  };

  document.documentElement.addEventListener("pointerleave", leave);
  document.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch") {
      leave();
    }
  });

  // A click tears a few scraps off where it lands, and the hole gulps.
  document.addEventListener("pointerdown", (e) => {
    if (reduce) {
      return;
    }

    const G = geo();
    const R = G.half * 0.62;
    const dx = (e.clientX - G.ox - G.cx) / R;
    const dy = (e.clientY - G.oy - G.cy) / R / 0.94;
    const extra = parts.filter(p => p.temp).length;

    for (let i = 0; i < 9 && extra + i < 54; i++) {
      const p = spawn(blank(i < 7 ? "flake" : "dust", { temp: true }), true);
      const va = rnd() * 6.283;
      const vv = 70 + rnd() * 170;

      p.r = Math.max(0.3, Math.hypot(dx, dy));
      p.a = Math.atan2(dy, dx);
      p.vx = Math.cos(va) * vv;
      p.vy = Math.sin(va) * vv;
      p.born = 0.4;
      parts.push(p);
    }

    H.pv += 6;
    // One strong ring and a softer echo behind it.
    H.waves.push({ t: 0, s: 1, rad: 0, amp: 0 }, { t: -0.24, s: 0.3, rad: 0, amp: 0 });

    while (H.waves.length > 6) {
      H.waves.shift();
    }
  });

  const frame = (now: number) => {
    const raw = (now - H.last) / 1000;

    H.last = now;

    const dt = reduce ? 0 : Math.min(0.05, Math.max(0, raw));
    const G = geo();
    const { W, Hh, cx, cy } = G;
    const R = G.half * 0.62;
    const ease = (rate: number) => 1 - Math.exp(-dt * rate);

    // Opening, on the clock rather than by frames, so slow first frames while the page
    // loads do not drag it out. The tear gulps once, a ripple through the page.
    H.open = reduce ? TEAR + WIDE : H.open + Math.min(0.25, Math.max(0, raw));

    const { grow, appear } = opening(H.open);
    const hr = R * grow;

    if (!H.torn && H.open >= TEAR) {
      H.torn = true;

      if (!reduce) {
        H.pv += 9;
        H.waves.push({ t: 0.05, s: 1.1, rad: 0, amp: 0 }, { t: -0.2, s: 0.35, rad: 0, amp: 0 });
      }
    }

    // The pointer: how near it is, where it is, whether it is over the hole.
    let prox = 0;
    let inside = false;
    let cu: number[] | null = null;
    let tx = 0;
    let ty = 0;

    if (H.mx !== null && H.my !== null && !reduce) {
      const dx = (H.mx - G.ox - cx) / R;
      const dy = (H.my - G.oy - cy) / R;
      const d = Math.hypot(dx, dy);
      const x = Math.min(1, Math.max(0, (d - 0.9) / 3.6));

      cu = [dx, dy];
      prox = 1 - x * x * (3 - 2 * x);
      inside = d < 0.95;

      const c = Math.min(1, d / 5) / (d || 1);

      tx = dx * c;
      ty = dy * c;

      if (d > 0.05) {
        H.cd[0]! += (dx / d - H.cd[0]!) * ease(6);
        H.cd[1]! += (dy / d - H.cd[1]!) * ease(6);
      }
    }

    H.m[0]! += (tx - H.m[0]!) * ease(5);
    H.m[1]! += (ty - H.m[1]!) * ease(5);
    H.prox += (prox - H.prox) * ease(3.2);
    H.pv += (-70 * H.pulse - 9 * H.pv) * dt;
    H.pulse += H.pv * dt;

    const pulse = Math.max(-0.3, Math.min(1.2, H.pulse));
    const pull = 1 + 0.8 * H.prox + 0.35 * Math.max(0, pulse);

    H.pull = pull;

    const rate = 0.75 + 0.35 * pull;

    H.T += dt;
    H.flow += dt * rate;
    H.life += dt * (0.6 + 0.4 * pull);

    const T = H.T + 40;

    // The cursor stirs the disc: it leaves light that the lanes carry off.
    if (inside && cu) {
      H.stirT += dt;

      const moved = H.sl ? Math.hypot(cu[0]! - H.sl[0]!, cu[1]! - H.sl[1]!) : 1;

      if (moved > 0.05 || H.stirT > 0.14) {
        H.stirT = 0;
        H.sl = [cu[0]!, cu[1]!];

        const qx = cu[0]! - H.m[0]! * 0.09;
        const qy = (cu[1]! - H.m[1]! * 0.09) / 0.94;

        H.stir.push({ r: Math.hypot(qx, qy), a: Math.atan2(qy, qx), z: 0, zt: moved > 0.05 ? 1 : 0.5, w: 0 });

        if (H.stir.length > 8) {
          H.stir.shift();
        }
      }
    }
    else {
      H.sl = null;
    }

    for (const s of H.stir) {
      s.a += (0.30 + 0.26 / (s.r + 0.22)) * dt * rate;
      s.r = Math.max(0.24, s.r - 0.05 * dt);
      s.zt *= Math.exp(-dt * 1.2);
      s.z += (s.zt - s.z) * ease(14);
      s.w += dt;
    }

    H.stir = H.stir.filter(s => s.zt > 0.02);

    const cs = getComputedStyle(root);
    const bg = cs.getPropertyValue("--bg").trim() || "#faf7f2";
    const ink = cs.getPropertyValue("--ink").trim() || "#1e2230";
    const acc = cs.getPropertyValue("--acc").trim() || "#b5a9f0";
    const dark = root.dataset.mode === "dark";
    const dpr = Math.min(2, devicePixelRatio || 1);

    // 1. The hole itself, on its own canvas.
    if (GLX) {
      const { gl, u } = GLX;
      const q = Math.min(H.q, dpr);
      const gw = Math.max(2, Math.round(G.pw * q));
      const gh = Math.max(2, Math.round(G.phh * q));

      if (GLX.canvas.width !== gw || GLX.canvas.height !== gh) {
        GLX.canvas.width = gw;
        GLX.canvas.height = gh;
      }

      gl.viewport(0, 0, gw, gh);

      const B = rgb(bg)!;
      const A = rgb(acc)!;
      const st = new Float32Array(32);

      H.stir.forEach((s, i) => st.set([s.r, s.a, s.z, s.w], i * 4));

      const cl = Math.hypot(H.cd[0]!, H.cd[1]!) || 1;

      gl.uniform2f(u.uRes!, gw, gh);
      gl.uniform2f(u.uC!, gw / 2, gh / 2);
      gl.uniform2f(u.uM!, H.m[0]!, H.m[1]!);
      gl.uniform2f(u.uCd!, H.cd[0]! / cl, H.cd[1]! / cl);
      gl.uniform1f(u.uR!, Math.max(0.75, hr * q));
      gl.uniform1f(u.uT!, T);
      gl.uniform1f(u.uFlow!, H.flow + 40);
      gl.uniform1f(u.uLife!, H.life + 40);
      gl.uniform1f(u.uPull!, pull);
      gl.uniform1f(u.uPulse!, pulse);
      gl.uniform1f(u.uDark!, dark ? 1 : 0);
      gl.uniform1f(u.uProx!, H.prox);
      gl.uniform1f(u.uDpr!, q);
      gl.uniform3f(u.uBg!, B[0]!, B[1]!, B[2]!);
      gl.uniform3f(u.uAcc!, A[0]!, A[1]!, A[2]!);
      gl.uniform4fv(u.uStir!, st);

      const wv = new Float32Array(12);

      H.waves.slice(-6).forEach((w, i) => wv.set([(w.rad || 0) / R, w.amp || 0], i * 2));
      gl.uniform2fv(u.uWave!, wv);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // On slower machines the hole is drawn a little coarser, to stay smooth.
      if (!reduce && ++H.n > 20) {
        H.slow = Math.max(0, H.slow + (raw > 0.03 ? 1 : -0.25));

        if (H.slow > 24 && H.q > 1) {
          H.q = Math.max(1, H.q - 0.5);
          H.slow = 0;
          H.n = 0;
        }
      }
    }

    // 2. Everything that flies across the page.
    if (sky.width !== Math.round(W * dpr) || sky.height !== Math.round(Hh * dpr)) {
      sky.width = Math.round(W * dpr);
      sky.height = Math.round(Hh * dpr);
    }

    const g = sky.getContext("2d")!;

    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, Hh);

    if (!GLX && hr > 0.5) {
      // Without WebGL, a plain dark disc stands in for the hole.
      const v = g.createRadialGradient(cx, cy, 0, cx, cy, hr);

      v.addColorStop(0, "#000");
      v.addColorStop(0.7, "#05060b");
      v.addColorStop(1, "#151829");
      g.fillStyle = v;
      g.beginPath();
      g.arc(cx, cy, hr, 0, 6.2832);
      g.fill();
      g.lineWidth = 2;
      g.strokeStyle = bg;
      g.stroke();
    }

    // The gulp sends a ring out through the page.
    const far = Math.max(R * 6, Math.hypot(Math.max(cx, W - cx), Math.max(cy, Hh - cy)) * 1.05);
    const WT = 2.3;

    H.waves = H.waves.filter(w => (w.t += dt) < WT);

    for (const w of H.waves) {
      if (w.t <= 0) {
        w.amp = 0;
        w.rad = R;
        continue;
      }

      const k = w.t / WT;

      w.rad = R + (far - R) * (1 - (1 - k) ** 2.1);
      w.amp = w.s * (1 - k) ** 0.75 * Math.min(1, w.t / 0.08);

      // The paper heaves: a lit crest on the outside, a shadowed trough behind it.
      const band = 46 + 40 * k;
      const a = w.amp;

      g.save();
      g.translate(cx, cy);
      g.scale(1, 0.94);

      const gr = g.createRadialGradient(0, 0, Math.max(0, w.rad - band * 1.6), 0, 0, w.rad + band * 0.7);
      const sh = dark ? "0,0,0" : "30,34,48";
      const hl = dark ? "190,182,255" : "255,255,255";

      gr.addColorStop(0, `rgba(${sh},0)`);
      gr.addColorStop(0.42, `rgba(${sh},${(a * (dark ? 0.13 : 0.035)).toFixed(3)})`);
      gr.addColorStop(0.66, `rgba(${sh},0)`);
      gr.addColorStop(0.8, `rgba(${hl},${(a * (dark ? 0.04 : 0.19)).toFixed(3)})`);
      gr.addColorStop(1, `rgba(${hl},0)`);
      g.fillStyle = gr;
      g.beginPath();
      g.arc(0, 0, w.rad + band * 0.7, 0, 6.2832);
      g.arc(0, 0, Math.max(0, w.rad - band * 1.6), 0, 6.2832, true);
      g.fill();
      // And a bright line of lavender rides the crest.
      g.strokeStyle = acc;
      g.beginPath();
      g.arc(0, 0, w.rad + band * 0.12, 0, 6.2832);
      g.globalAlpha = 0.045 * a;
      g.lineWidth = 9;
      g.stroke();
      g.globalAlpha = 0.26 * a;
      g.lineWidth = 1.1;
      g.stroke();
      g.restore();
      g.globalAlpha = 1;
    }

    g.lineCap = "round";

    const mc = H.mx !== null && H.my !== null && !reduce ? [H.mx - G.ox, H.my - G.oy] : null;
    const trace = (pts: [number, number][]) => {
      g.beginPath();
      pts.forEach(([x, y], j) => (j ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.closePath();
    };

    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]!;
      const om = (0.22 + 0.5 / (p.r * p.r + 0.16)) * pull * p.k;
      const vr = -(0.05 + 0.06 / (p.r + 0.25)) * pull * p.k * (p.temp ? 1 + 1.2 * Math.max(0, p.r - 1) : 1);

      p.a += om * dt;
      p.r += vr * dt;
      p.rot += p.spin * dt * (1 + 0.6 / (p.r + 0.3));
      p.flip += p.fs * dt;
      p.born = Math.min(1, p.born + dt * 1.5);

      if (p.r < 0.25) {
        if (p.temp) {
          parts.splice(i, 1);
          continue;
        }

        spawn(p, false);
      }

      const ca = Math.cos(p.a);
      const sa = Math.sin(p.a);
      let x = cx + ca * p.r * R;
      let y = cy + sa * p.r * R * 0.94;

      // The stream parts around the cursor and closes again behind it.
      if (mc) {
        const ex = x + p.dx - mc[0]!;
        const ey = y + p.dy - mc[1]!;
        const ed = Math.hypot(ex, ey) || 1;

        if (ed < 72) {
          const fo = 1 - ed / 72;

          p.vx += ex / ed * fo * fo * 1500 * dt;
          p.vy += ey / ed * fo * fo * 1500 * dt;
        }
      }

      for (const w of H.waves) {
        if (w.amp <= 0) {
          continue;
        }

        const ex = x - cx;
        const ey = (y - cy) / 0.94;
        const ed = Math.hypot(ex, ey) || 1;
        const z = (ed - w.rad) / 40;
        const push = Math.exp(-z * z) * w.amp * 550 * dt;

        p.vx += ex / ed * push;
        p.vy += ey / ed * push;
      }

      p.vx += (-p.dx * 14 - p.vx * 5) * dt;
      p.vy += (-p.dy * 14 - p.vy * 5) * dt;
      p.dx += p.vx * dt;
      p.dy += p.vy * dt;
      x += p.dx;
      y += p.dy;

      const within = p.r < 0.97;
      const fade = Math.max(0, Math.min(1, (p.r - 0.25) / 0.22)) * p.born * (p.temp ? 1 : Math.max(0, Math.min(1, (2.62 - p.r) / 0.3))) * appear;

      if (fade <= 0.004) {
        continue;
      }

      const sc = Math.max(0.25, Math.min(1, p.r / 1.05));

      if (p.kind === "dust") {
        const speed = om * p.r * R;
        const vx = -sa * speed + ca * vr * R;
        const vy = (ca * speed + sa * vr * R) * 0.94;
        const vl = Math.hypot(vx, vy) || 1;
        const len = Math.max(1.5, Math.min(20, vl * 0.07)) * p.sz;

        g.globalAlpha = fade * (within ? 0.8 : 0.42);
        g.strokeStyle = within ? acc : ink;
        g.lineWidth = within ? 1 : 0.8;
        g.beginPath();
        g.moveTo(x - vx / vl * len, y - vy / vl * len);
        g.lineTo(x, y);
        g.stroke();
      }
      else if (p.kind === "flake" && p.pts) {
        const c = Math.cos(p.flip);
        const lift = Math.max(0, Math.min(1, (2.3 - p.r) / 1.1));

        g.save();
        g.translate(x, y);

        if (!within && lift > 0) {
          g.save();
          g.translate(2 * lift, 3 * lift);
          g.rotate(p.rot);
          g.scale(sc, sc * (0.18 + 0.82 * Math.abs(c)));
          trace(p.pts);
          g.globalAlpha = fade * 0.14 * lift;
          g.fillStyle = "#000";
          g.fill();
          g.restore();
        }

        g.rotate(p.rot);
        g.scale(sc, sc * (0.18 + 0.82 * Math.abs(c)));
        trace(p.pts);
        g.globalAlpha = fade;
        g.fillStyle = bg;
        g.fill();
        g.globalAlpha = fade * (c < 0 ? 0.2 : 0.04 + 0.12 * (1 - Math.abs(c)));
        g.fillStyle = dark ? "#000" : ink;
        g.fill();

        if (within) {
          g.globalAlpha = fade * 0.35;
          g.fillStyle = acc;
          g.fill();
        }

        g.globalAlpha = fade * 0.55;
        g.lineWidth = 0.7 / sc;
        g.strokeStyle = ink;
        g.stroke();
        g.restore();
      }
      else if (p.ch) {
        g.save();
        g.translate(x, y);
        g.rotate(p.rot * 0.6);
        g.scale(sc, sc);
        g.globalAlpha = fade * (within ? 1 : 0.85);
        g.font = "italic 500 20px \"Newsreader Variable\", Georgia, serif";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillStyle = within ? acc : ink;
        g.fillText(p.ch, 0, 0);
        g.restore();
      }
    }

    g.globalAlpha = 1;

    if (reduce) {
      setTimeout(requestAnimationFrame, 700, frame);

      return;
    }

    // 3. The page's own letters, and the header, lean toward the hole: strongly
    // nearby, less with distance.
    if (!H.chars || now - H.scan > 600) {
      H.scan = now;

      const old = H.map;
      const els = [...document.querySelectorAll<HTMLElement>(".page .nf-ch, .bar .logo, .bar .crumb, .bar .pill-btn, .bar .theme")];

      H.chars = els.map((el, i) => {
        const prev = old?.get(el);
        const off = prev ? prev.off : [0, 0] as [number, number];
        const r = el.getBoundingClientRect();

        return { el, bar: !!el.closest(".bar"), unit: !el.classList.contains("nf-ch"), on: prev?.on ?? false, x: r.left + r.width / 2 - off[0], y: r.top + r.height / 2 - off[1], ph: (i * 1.618) % 6.283, off };
      });
      H.map = new Map(H.chars.map(c => [c.el, c]));
      old?.forEach((c, el) => {
        if (!H.map!.has(el) && c.on) {
          el.style.transform = "";
        }
      });
      H.bar = document.querySelector(".bar");
    }

    // The header steadies itself while it is being used.
    const using = !!H.bar && (H.bar.matches(":hover, :focus-within") || H.bar.dataset.busy === "true");

    H.calm += ((using ? 1 : 0) - H.calm) * ease(7);

    const hx = G.ox + cx;
    const hy = G.oy + cy;
    const reach = Math.max(420, G.half * 2.7);

    for (const c of H.chars) {
      const dx = hx - c.x;
      const dy = hy - c.y;
      const d = Math.hypot(dx, dy) || 1;
      let f = Math.max(0, 1 - (d - R) / (reach - R));
      let wave = 0;
      let swell = 0;

      f = f * f * f * appear;

      for (const w of H.waves) {
        if (w.amp <= 0) {
          continue;
        }

        const z = (d - w.rad) / 58;
        const e = Math.exp(-z * z) * w.amp;

        wave += e;
        swell += -2.2 * z * e;
      }

      if (c.bar) {
        const still = 1 - 0.85 * H.calm;

        f *= still;
        wave *= still;
        swell *= still;
      }

      if (f < 0.002 && wave < 0.01) {
        if (c.on) {
          c.el.style.transform = "";
          c.on = false;
          c.off = [0, 0];
        }

        continue;
      }

      const k = Math.min(2.2, f * pull);
      // Slow swells travel inward through the text, so the pull reads as a current.
      const w1 = Math.sin(d * 0.03 + T * 4.2 + c.ph * 0.06);
      const w2 = Math.sin(d * 0.012 + T * 1.7 + c.ph * 0.1);
      const tug = k * (5 + 2.8 * w1 + 1.2 * w2) + swell * 3.4;
      const ux = dx / d;
      const uy = dy / d;
      const ox = ux * tug - uy * k * 1.1 * w2;
      const oy = uy * tug + ux * k * 1.1 * w2;
      const sq = (c.unit ? 0.5 : 1) * Math.min(0.45, k * (0.11 + 0.06 * w1));
      const ang = Math.atan2(uy, ux) * 57.2958;
      const lift = 1 + wave * 0.028;
      const tilt = swell * 1.2 * (c.unit ? 0.5 : 1);

      c.off = [ox, oy];
      c.on = true;
      c.el.style.transform = `translate(${ox.toFixed(2)}px,${(oy - wave * 0.9).toFixed(2)}px) rotate(${ang.toFixed(1)}deg) scale(${((1 + sq) * lift).toFixed(3)},${((1 - sq * 0.35) * lift).toFixed(3)}) rotate(${(-ang + k * 3.2 * w2 + tilt).toFixed(1)}deg)`;
    }

    requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
}

start();
