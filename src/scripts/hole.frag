precision highp float;
uniform vec2 uRes, uC, uM, uCd;
uniform float uR, uT, uFlow, uLife, uPull, uPulse, uDark, uProx, uDpr;
uniform vec3 uBg, uAcc;
uniform vec4 uStir[8];
uniform vec2 uWave[6];

float hash(vec3 p) { p = fract(p * .1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float vn(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * f * (f * (f * 6. - 15.) + 10.);
  float a = hash(i), b = hash(i + vec3(1., 0., 0.)), c = hash(i + vec3(0., 1., 0.)), d = hash(i + vec3(1., 1., 0.));
  float e = hash(i + vec3(0., 0., 1.)), g = hash(i + vec3(1., 0., 1.)), h = hash(i + vec3(0., 1., 1.)), k = hash(i + vec3(1., 1., 1.));
  return mix(mix(mix(a, b, f.x), mix(c, d, f.x), f.y), mix(mix(e, g, f.x), mix(h, k, f.x), f.y), f.z);
}
float fbm(vec3 p) { float s = 0., a = .5; for (int i = 0; i < 3; i++) { s += a * vn(p); p = p * 2.07 + vec3(17.1, 3.7, 9.2); a *= .5; } return s / .875; }
// noise that wraps cleanly around the hole
float cn(float a, float k, float z) { return vn(vec3(cos(a) * k + 31.7, sin(a) * k + 47.3, z)); }
float cf(float a, float k, float z) { return fbm(vec3(cos(a) * k + 31.7, sin(a) * k + 47.3, z)); }
float bell(float x) { return exp(-x * x); }
vec4 over(vec4 top, vec4 bot) { return top + bot * (1. - top.a); }
vec4 shade(float a) { a = clamp(a, 0., 1.); return vec4(0., 0., 0., a); }
vec4 chalk(float a) { a = clamp(a, 0., 1.); return vec4(a); }
vec4 tint(vec3 c, float a) { a = clamp(a, 0., 1.); return vec4(c * a, a); }

float streak(float a, float r, float z) {
  return fbm(vec3(cos(a) * 1.9, sin(a) * 1.9, r * 7.5 + z)) * .68 + vn(vec3(cos(a) * 5.5 + 9., sin(a) * 5.5, r * 24. + z)) * .32;
}

// what is behind the page
vec3 behind(vec2 p) {
  float ml = length(uM);
  vec2 md = ml > .0001 ? uM / ml : vec2(1., 0.);
  vec2 q = p - uM * .09;
  q += md * dot(q, md) * .12 * ml;
  q.y /= .94;
  float r = length(q), a = atan(q.y, q.x);
  float hr = .225 * (1. + .2 * uPulse);
  vec3 c = vec3(.011, .012, .028);
  // far stars shift more than the disc when the eye moves
  vec2 gs = (p - uM * .17) * uR / (uDpr * 17.);
  vec2 id = floor(gs), gf = fract(gs) - .5;
  float hs = hash(vec3(id, 3.));
  vec2 so = vec2(hash(vec3(id, 5.)), hash(vec3(id, 7.))) - .5;
  float st = smoothstep(.1, 0., length(gf - so * .7)) * step(.8, hs) * (.35 + .65 * (.5 + .5 * sin(uT * (.8 + hs * 2.) + hs * 50.)));
  c += vec3(.75, .78, 1.) * st * .5;
  // the disc: inner lanes turn faster; two phases cross-fade so the shear never winds up
  float om = .30 + .26 / (r + .22), om0 = .45, Tc = 10.;
  float c1 = uFlow / Tc, t1 = fract(c1), c2 = c1 + .5, t2 = fract(c2);
  float base = a + 2. * log(r + .08) - uFlow * om0;
  float w1 = 1. - abs(2. * t1 - 1.), w2 = 1. - w1;
  float n = streak(base - (om - om0) * (t1 - .5) * Tc, r, floor(c1) * 7.31) * w1 + streak(base - (om - om0) * (t2 - .5) * Tc, r, floor(c2) * 7.31 + 3.17) * w2;
  n = .5 + (n - .5) / sqrt(w1 * w1 + w2 * w2);
  float dens = smoothstep(.40, .78, n);
  float env = smoothstep(hr, hr + .12, r) * smoothstep(1.4, .55, r);
  float rr = r / .42;
  float fall = .3 + .8 / (1. + rr * rr);
  float dop = 1. + .4 * cos(a - 2.3);
  float br = env * (.12 + .88 * dens) * fall * dop * (1. + .8 * uPulse + .3 * (uPull - 1.));
  vec3 hot = mix(uAcc, vec3(1.), .6);
  c += mix(uAcc * .6, hot, dens * smoothstep(.8, .3, r)) * br * .95;
  // light stirred in by the cursor, smeared along the lanes
  float g = 0.;
  for (int i = 0; i < 8; i++) {
    vec4 s = uStir[i];
    float dr = (r - s.x) / (.035 + .04 * s.w);
    float da = atan(sin(a - s.y), cos(a - s.y)) * max(r, .2) / (.07 + .25 * s.w);
    g += s.z * exp(-dr * dr - da * da);
  }
  c += mix(uAcc, hot, .5) * min(g, 1.4) * .5 * smoothstep(hr, hr + .06, r);
  // horizon and its thin ring of light
  c *= smoothstep(hr - .006, hr + .006, r);
  c += hot * bell((r - hr - .008) / .012) * (.85 + .3 * dens) * (1. + .6 * uPulse) + uAcc * bell((r - hr) / .075) * .25 * smoothstep(hr - .01, hr + .01, r);
  return min(c, vec3(1.));
}

// one flap of torn paper, in its own frame: hinged on a straight crease, hanging into the hole.
// it peels, flutters, stretches, necks at the crease, tears off and falls in; then the next one peels.
const float NF = 9.;
float flap(float i, vec2 p, out float u, out float sw, out float lit, out float gone, out float root) {
  float h1 = hash(vec3(i, 1., 7.)), h2 = hash(vec3(i, 2., 7.)), h3 = hash(vec3(i, 3., 7.)), h4 = hash(vec3(i, 4., 7.)), h5 = hash(vec3(i, 5., 7.));
  float ca = (i + .5 + (h1 - .5) * .45) * 6.28318 / NF;
  vec2 d = vec2(cos(ca), sin(ca)), n = vec2(-d.y, d.x);
  float hw = .13 + .12 * h2, Lm = .24 + .26 * h3;
  float tau = fract(uLife / (9. + 9. * h4) + h5);
  float grow = smoothstep(0., .2, tau);
  float neck = smoothstep(.74, .84, tau);
  float tf = clamp((tau - .84) / .16, 0., 1.);
  float fr = (1. + (cf(ca, .9, 2.) - .5) * .2) * sqrt(1. - hw * hw) - .02;
  sw = sin(uT * (2.2 + 1.5 * h1) + h2 * 20.) * .7 + sin(uT * (3.9 + h3) + h4 * 20.) * .3;
  float sl = sin(uT * (1.3 + h3) + h1 * 30.);
  sw = clamp(sw + uPulse * 1.2, -1.4, 1.8);
  float L = Lm * grow * (1. + .14 * neck + .1 * (uPull - 1.) - .5 * uPulse + .25 * uProx * max(0., dot(d, uCd))) * (.84 + .16 * sw);
  float g = tf * tf * (.66 - Lm * .35);
  float sc = 1. - .55 * tf;
  float y = (fr - dot(p, d) - g) / sc, x = dot(p, n) / sc;
  float yy = max(y, 0.);
  u = clamp(y / max(L, .001), 0., 1.);
  x -= (.3 + .5 * tf) * yy + (.5 * sl + 1.5 * uPulse * (h1 - .5)) * yy * yy / Lm + .018 * sin(u * 8. - uT * 7. + h5 * 30.) * smoothstep(.1, .5, u);
  // the sheet between the crease and the level page
  root = mix(-1., min(hw - abs(dot(p, n)), min(-(fr - dot(p, d)), fr - dot(p, d) + .14)), (1. - step(.001, tf)) * step(.02, grow));
  float wd = hw * (1. - .7 * u) * mix(1., smoothstep(0., .3, u), neck);
  wd += (vn(vec3(x * 13., y * 13., i * 3.)) - .5) * .022 + (vn(vec3(x * 44., y * 44., i * 5.)) - .5) * .012;
  float Lr = L * (1. + (vn(vec3(x * 18., i, 2.)) - .5) * .32);
  lit = -dot(d, vec2(-.55, -.835));
  gone = tf;
  return min(wd - abs(x), min(y + .002, Lr - y)) * sc;
}

void main() {
  vec2 fc = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 p = (fc - uC) / uR;
  float r = length(p);
  if (r > 1.62) { gl_FragColor = vec4(0.); return; }
  float a = atan(p.y, p.x);
  float px = 1. / uR;
  vec2 dir = vec2(cos(a), sin(a));
  // a ripple from a click passes through the sheet: its crest shoves the paper outward, the trough behind draws it back in
  float crest = 0., swell = 0.;
  for (int i = 0; i < 6; i++) { float z = (r - uWave[i].x) / .34; float e0 = exp(-z * z) * uWave[i].y; crest += e0; swell += -2.2 * z * e0; }
  float rim = bell((r - 1.) / .38);
  float rs = r - (crest * .11 - swell * .06) * (.35 + .65 * rim) - uPulse * .035 * sin(a * 6. - uT * 15.) * rim;
  vec2 ps = dir * rs;
  float side = max(0., dot(dir, uCd));
  // where the sheet starts to dip
  float fold = 1. + (cf(a, .9, 2.) - .5) * .2;
  float s = fold - rs;
  // the level page around the tear sags toward it and a little light leaks out; the lip carries on from there
  float d = max(-s, 0.);
  float ao = pow(smoothstep(.5, 0., d), 2.2);
  vec4 page = shade(ao * mix(.09, .36, uDark));
  page = over(tint(uAcc, ao * mix(.05, .15, uDark) * (1. + .8 * uPulse)), page);
  if (s < 0.) {
    // stretch marks run out from the tear. The sheet is being dragged in, so they crawl with it, come and go,
    // lengthen when the pull grows, and tension runs down each one toward the hole in slow pulses
    float aw = a + (vn(vec3(dir * (rs + uFlow * .035) * 3., 5.)) - .5) * .11;
    float tens = .85 + .3 * (uPull - 1.) + .3 * uProx * side + .35 * max(uPulse, 0.);
    float cl = (.1 + .5 * cn(aw, 3., 21.)) * smoothstep(.42, .6, cn(aw, 5., 31. + uT * .1)) * tens;
    float k1 = cn(aw, 13., 3.), k2 = cn(aw + .011, 13., 3.);
    float r1 = pow(1. - abs(2. * k1 - 1.), 10.), r2 = pow(1. - abs(2. * k2 - 1.), 10.);
    float run = .8 + .34 * sin(d * 13. + uFlow * 2.6 + cn(a, 2., 4.) * 6.283);
    float wl = clamp((r1 - r2) * 2.4, -1., 1.) * smoothstep(cl, 0., d) * run * (1. + .5 * uPulse + .7 * crest);
    page = over(shade(max(0., -wl) * mix(.11, .3, uDark)), page);
    page = over(chalk(max(0., wl) * mix(.6, .07, uDark)), page);
  }
  page *= smoothstep(1.6, 1.3, r);
  if (s < -.34) { gl_FragColor = page; return; }
  // the torn rim: a ragged lip, long tongues dragged round by the flow, and a few rips running outward
  // the torn rim: a short ragged lip all the way round, with a few rips running outward
  float jl = cn(a, 7., 2.) - .5, jm = cn(a, 17., 7. + s * 14.) - .5, jh = cn(a, 40., 4. + s * 10.) - .5;
  float lipLen = .045 + .045 * (jl + .7 * jm + .4 * jh);
  // the lip bends back as the ripple leaves, then quivers as it settles
  lipLen = lipLen * (1. - .9 * uPulse) + .04 * uPulse * sin(a * 11. - uT * 24.);
  float rg = 1. - abs(2. * cn(a, 2.6, 13.) - 1.);
  lipLen -= pow(rg, 9.) * smoothstep(.45, .7, cn(a, 1.2, 17.)) * .13;
  float eL = lipLen - s + (cn(a, 95., 1. + s * 20.) - .5) * 3. * px;
  // the nearest flaps
  float ci = floor(fract(a / 6.28318) * NF);
  float eF = -1., eR = -1., fu = 0., fsw = 0., flit = 0., fgone = 0.;
  for (int k = -1; k <= 1; k++) {
    float u1, s1, l1, g1, r1;
    float e1 = flap(mod(ci + float(k) + NF, NF), ps, u1, s1, l1, g1, r1);
    eR = max(eR, r1);
    if (e1 > eF) { eF = e1; fu = u1; fsw = s1; flit = l1; fgone = g1; }
  }
  eL = max(eL, eR);
  eF = min(eF, s + .01 + step(.001, fgone));
  float pL = smoothstep(-px, px, eL);
  float pF = smoothstep(-px, px, eF) * (1. - smoothstep(.35, .75, fgone));
  float paper = max(pL, pF);
  float e = max(eL, eF);
  float hair = pow(cn(a, 150., 8.), 12.) * 11. * px;
  float fib = smoothstep(-px, px, eL + hair);
  // lip: it dips a little
  vec4 o = page;
  if (s > 0.) {
    float ul = clamp(s / max(lipLen, .03), 0., 1.);
    float lit = -dot(dir, vec2(-.55, -.835));
    o = over(shade(ul * max(0., .12 - .1 * lit) * mix(1., 1.4, uDark)), o);
    o = over(chalk(ul * max(0., lit) * mix(.35, .06, uDark)), o);
  }
  // flap: in shadow, creased at its hinge, brighter as it swings up, banded by the ripple running to its tip
  if (pF > 0.) {
    float um = smoothstep(.1, .5, fu);
    float band2 = sin(fu * 9. - uT * 7. + ci);
    float dk = .2 + .4 * fu - .1 * fsw - .1 * flit + .1 * band2 * um + .08 * fgone;
    vec4 f = over(tint(vec3(.05, .05, .11), dk * mix(.9, .8, uDark)), page);
    f = over(shade(bell(fu * 30.) * .16), f);
    f = over(chalk(max(0., band2) * um * (.6 + .4 * fsw) * mix(.2, .07, uDark)), f);
    f = over(tint(uAcc, (fu * fu * .42 + .1 + .25 * fgone) * mix(.5, .62, uDark) * (1. + .6 * uPulse)), f);
    o = mix(o, f, pF);
  }
  // the pale core of the sheet shows along every torn edge
  float band = (1. - smoothstep(0., 3.5 * px, e)) * step(0., e);
  o = over(tint(mix(vec3(1.), uAcc, .45 * uDark), band * mix(.62, .5, uDark) * (1. - .6 * fgone)), o);
  vec4 col = o * paper;
  if (paper < 1.) {
    vec3 v = behind(p);
    float lip = smoothstep(0., .13, -e);
    v *= lip * lip;
    col += vec4(v, 1.) * (1. - paper);
  }
  float ha = clamp(fib - paper, 0., 1.) * .5;
  col = over(tint(mix(uBg, vec3(1.), mix(.6, .3, uDark)), ha), col);
  gl_FragColor = col;
}
