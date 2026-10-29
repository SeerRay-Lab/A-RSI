/* Task forge: small illustrative templates written to the paper's generation contract
   (I, q, a) = G_tau(z): one sampled configuration renders the image, writes the
   question, and computes the answer. The learner only sees (I, q). */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const COL = { geo: '#2a78d6', chart: '#eb6834', table: '#1baf7a', count: '#6250d6' };

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  const shuffle = (r, arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const ord = n => ['first', 'second', 'third', 'fourth'][n - 1];

  /* ---------------- templates ---------------- */
  const T = {};

  // Chart family: single-series bar chart (cf. the paper's chart example, a = v_A - v_B).
  T.chart = function (seed) {
    const r = rng(seed);
    const vocab = ['Apples', 'Pears', 'Plums', 'Figs', 'Kiwis', 'Limes', 'Dates'];
    const n = int(r, 4, 6);
    const cats = shuffle(r, vocab).slice(0, n);
    const vals = cats.map(() => int(r, 6, 24));
    const kind = pick(r, ['diff', 'diff', 'rank', 'sum']);
    const z = { template: 'bar_single_series', n_categories: n, categories: cats, values: vals, question: kind };
    let q, a, eqn, checks = [];
    if (kind === 'diff') {
      let i = int(r, 0, n - 1), j = int(r, 0, n - 1);
      if (i === j) j = (j + 1) % n;
      if (vals[i] < vals[j]) [i, j] = [j, i];
      z.ask = [cats[i], cats[j]];
      q = 'How much larger is the value of ' + cats[i] + ' than the value of ' + cats[j] + '?';
      a = vals[i] - vals[j];
      eqn = 'a = v[' + cats[i] + '] − v[' + cats[j] + '] = ' + vals[i] + ' − ' + vals[j] + ' = ' + a;
      checks.push(['Positive, nonzero difference', a > 0]);
    } else if (kind === 'sum') {
      const [i, j] = shuffle(r, [...Array(n).keys()]).slice(0, 2);
      z.ask = [cats[i], cats[j]];
      q = 'What is the combined value of ' + cats[i] + ' and ' + cats[j] + '?';
      a = vals[i] + vals[j];
      eqn = 'a = ' + vals[i] + ' + ' + vals[j] + ' = ' + a;
      checks.push(['Answer within admissible range', a <= 48]);
    } else {
      const k = int(r, 2, 3);
      z.rank = k;
      const sorted = vals.map((v, i) => [v, i]).sort((x, y) => y[0] - x[0]);
      const target = sorted[k - 1][0];
      const ties = vals.filter(v => v === target).length;
      const above = sorted[k - 2][0] === target || (sorted[k] && sorted[k][0] === target);
      q = 'Which category has the ' + ord(k) + ' highest value?';
      a = cats[sorted[k - 1][1]];
      eqn = 'a = argsort(v, desc)[' + (k - 1) + '] = ' + a + (ties > 1 ? '  (tie: ' + ties + ' bars at ' + target + ')' : '');
      checks.push(['Ranks 1–' + k + ' are distinct (no tie at or above rank ' + k + ')', new Set(sorted.slice(0, k).map(x => x[0])).size === k && ties === 1 && !above]);
    }
    checks.unshift(['Values are admissible integers in [6, 24]', vals.every(v => v >= 6 && v <= 24)]);
    checks.push(['Every bar label fits under its bar', cats.every(c => c.length <= 6)]);
    return { fam: 'chart', gen: 'ca', z, q, a, eqn, checks, svg: barSVG(cats, vals) };
  };

  function barSVG(cats, vals) {
    const W = 420, H = 280, L = 40, B = 240, top = 24, n = cats.length;
    const max = 26, bw = (W - L - 16) / n;
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="bar chart"><rect width="' + W + '" height="' + H + '" fill="#fff"/>';
    for (let t = 0; t <= 25; t += 5) {
      const y = B - (t / max) * (B - top);
      s += '<line x1="' + L + '" x2="' + (W - 10) + '" y1="' + y + '" y2="' + y + '" stroke="#eceae5"/><text x="' + (L - 6) + '" y="' + (y + 4) + '" font-size="11" text-anchor="end" fill="#52514e">' + t + '</text>';
    }
    cats.forEach((c, i) => {
      const x = L + i * bw + bw * 0.18, w = bw * 0.64, h = (vals[i] / max) * (B - top);
      s += '<rect x="' + x.toFixed(1) + '" y="' + (B - h).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="4" fill="#eb6834"/>';
      s += '<text x="' + (x + w / 2).toFixed(1) + '" y="' + (B - h - 6).toFixed(1) + '" font-size="12" font-weight="700" text-anchor="middle" fill="#121317">' + vals[i] + '</text>';
      s += '<text x="' + (x + w / 2).toFixed(1) + '" y="' + (B + 18) + '" font-size="12" text-anchor="middle" fill="#121317">' + esc(c) + '</text>';
    });
    s += '<line x1="' + L + '" x2="' + (W - 10) + '" y1="' + B + '" y2="' + B + '" stroke="#52514e"/></svg>';
    return s;
  }

  // Table family.
  T.table = function (seed) {
    const r = rng(seed);
    const rowsAll = ['North', 'South', 'East', 'West', 'Central'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr'];
    const nr = int(r, 3, 4), nc = int(r, 3, 4);
    const rows = shuffle(r, rowsAll).slice(0, nr).sort();
    const cols = months.slice(0, nc);
    const M = rows.map(() => cols.map(() => int(r, 10, 60)));
    const kind = pick(r, ['total', 'max', 'diff']);
    const z = { template: 'store_sales_table', rows, cols, cells: M, question: kind };
    let q, a, eqn, checks = [['Cells are admissible integers in [10, 60]', M.flat().every(v => v >= 10 && v <= 60)]];
    if (kind === 'total') {
      const i = int(r, 0, nr - 1);
      z.ask = rows[i];
      q = 'What were the total sales of the ' + rows[i] + ' store over ' + cols[0] + '–' + cols[nc - 1] + '?';
      a = M[i].reduce((x, y) => x + y, 0);
      eqn = 'a = ' + M[i].join(' + ') + ' = ' + a;
      checks.push(['Requires reading ' + nc + ' cells', nc >= 3]);
    } else if (kind === 'max') {
      const j = int(r, 0, nc - 1);
      z.ask = cols[j];
      const colv = M.map(rw => rw[j]);
      const mx = Math.max(...colv);
      q = 'Which store had the highest sales in ' + cols[j] + '?';
      a = rows[colv.indexOf(mx)];
      eqn = 'a = argmax(column ' + cols[j] + ') = ' + a + ' (' + mx + ')';
      checks.push(['Target is unique (single maximum)', colv.filter(v => v === mx).length === 1]);
    } else {
      const j = int(r, 1, nc - 1), i = int(r, 0, nr - 1);
      z.ask = [rows[i], cols[j - 1], cols[j]];
      const dlt = M[i][j] - M[i][j - 1], dir = dlt >= 0 ? 'increase' : 'decrease';
      q = 'By how much did sales of the ' + rows[i] + ' store ' + dir + ' from ' + cols[j - 1] + ' to ' + cols[j] + '?';
      a = Math.abs(dlt);
      eqn = 'a = |' + M[i][j] + ' − ' + M[i][j - 1] + '| = ' + a + ' (' + dir + ')';
      checks.push(['Change is nonzero', a !== 0]);
    }
    checks.push(['Header and row labels are distinct', new Set(rows).size === nr]);
    return { fam: 'table', gen: 'tab', z, q, a, eqn, checks, svg: tableSVG(rows, cols, M) };
  };

  function tableSVG(rows, cols, M) {
    const cw = 78, rh = 38, W = cw * (cols.length + 1) + 2, H = rh * (rows.length + 1) + 2;
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="table"><rect width="' + W + '" height="' + H + '" fill="#fff"/>';
    s += '<rect x="1" y="1" width="' + (W - 2) + '" height="' + rh + '" fill="#eef8f3"/>';
    ['Store'].concat(cols).forEach((c, j) => { s += '<text x="' + (1 + j * cw + cw / 2) + '" y="' + (1 + rh / 2 + 5) + '" font-size="13" font-weight="700" text-anchor="middle" fill="#121317">' + c + '</text>'; });
    rows.forEach((rw, i) => {
      const y = 1 + (i + 1) * rh;
      s += '<text x="' + (1 + cw / 2) + '" y="' + (y + rh / 2 + 5) + '" font-size="13" font-weight="600" text-anchor="middle" fill="#121317">' + rw + '</text>';
      M[i].forEach((v, j) => { s += '<text x="' + (1 + (j + 1) * cw + cw / 2) + '" y="' + (y + rh / 2 + 5) + '" font-size="13" text-anchor="middle" fill="#121317">' + v + '</text>'; });
    });
    for (let i = 0; i <= rows.length + 1; i++) s += '<line x1="1" x2="' + (W - 1) + '" y1="' + (1 + i * rh) + '" y2="' + (1 + i * rh) + '" stroke="#c9ced5"/>';
    for (let j = 0; j <= cols.length + 1; j++) s += '<line y1="1" y2="' + (H - 1) + '" x1="' + (1 + j * cw) + '" x2="' + (1 + j * cw) + '" stroke="#c9ced5"/>';
    return s + '</svg>';
  }

  // Counting family: a scene of shapes; the question needs both colour and shape.
  T.count = function (seed) {
    const r = rng(seed);
    const shapes = ['circle', 'square', 'triangle'], colors = { red: '#d03b3b', blue: '#2a78d6', green: '#1d8a4e' };
    const N = int(r, 9, 15);
    const items = [];
    let tries = 0;
    while (items.length < N && tries < 4000) {
      tries++;
      const x = int(r, 30, 390), y = int(r, 30, 250);
      if (items.every(o => Math.hypot(o.x - x, o.y - y) >= 44)) items.push({ x, y, shape: pick(r, shapes), color: pick(r, Object.keys(colors)) });
    }
    const ts = pick(r, shapes), tc = pick(r, Object.keys(colors));
    const a = items.filter(o => o.shape === ts && o.color === tc).length;
    const sameShape = items.filter(o => o.shape === ts && o.color !== tc).length;
    const sameColor = items.filter(o => o.color === tc && o.shape !== ts).length;
    const z = { template: 'shape_scene', n_objects: items.length, target: { color: tc, shape: ts }, objects: items.map(o => [o.color, o.shape, o.x, o.y]) };
    const checks = [
      ['All objects placed without overlap', items.length === N],
      ['Count is in [1, 6]', a >= 1 && a <= 6],
      ['Distractor shares the shape (' + sameShape + ')', sameShape >= 1],
      ['Distractor shares the colour (' + sameColor + ')', sameColor >= 1]
    ];
    const q = 'How many ' + tc + ' ' + ts + 's are there in the image?';
    const eqn = 'a = |{o : colour = ' + tc + ', shape = ' + ts + '}| = ' + a;
    let s = '<svg viewBox="0 0 420 280" role="img" aria-label="shape scene"><rect width="420" height="280" fill="#fafaf8"/>';
    items.forEach(o => {
      const c = colors[o.color];
      if (o.shape === 'circle') s += '<circle cx="' + o.x + '" cy="' + o.y + '" r="15" fill="' + c + '"/>';
      else if (o.shape === 'square') s += '<rect x="' + (o.x - 14) + '" y="' + (o.y - 14) + '" width="28" height="28" rx="3" fill="' + c + '"/>';
      else s += '<polygon points="' + o.x + ',' + (o.y - 17) + ' ' + (o.x + 16) + ',' + (o.y + 12) + ' ' + (o.x - 16) + ',' + (o.y + 12) + '" fill="' + c + '"/>';
    });
    return { fam: 'count', gen: 'sc', z, q, a, eqn, checks, svg: s + '</svg>' };
  };

  // Geometry family: a two-hop exterior-angle task (each hop uses the previous result).
  T.geo = function (seed) {
    const r = rng(seed);
    if (r() < 0.5) {
      const A = int(r, 3, 9) * 5 + 20, B = int(r, 3, 9) * 5 + 15;
      const C = 180 - A - B;
      const z = { template: 'exterior_angle_2hop', angle_A: A, angle_B: B, hops: 2 };
      const fig = triSVG(A, B);
      const checks = [['Angles admissible (each ≥ 25°, sum < 160°)', A >= 25 && B >= 25 && A + B < 160], ['Third angle ≥ 20° so the figure is not degenerate', C >= 20], ['Figure drawn from the same angles fits the canvas', fig.ok]];
      const a = 180 - C;
      return { fam: 'geo', gen: 'mv', z, q: 'In triangle ABC, ∠A = ' + A + '° and ∠B = ' + B + '°. Side BC is extended to D. Find ∠ACD in degrees.', a, eqn: 'hop 1: ∠ACB = 180 − ' + A + ' − ' + B + ' = ' + C + ';  hop 2: ∠ACD = 180 − ' + C + ' = ' + a, checks, svg: fig.svg };
    }
    const triples = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]];
    const [p, qq, h] = pick(r, triples), k = int(r, 1, 3);
    const a1 = p * k, b1 = qq * k, c1 = h * k;
    const z = { template: 'right_triangle_hypotenuse', leg_a: a1, leg_b: b1, scale: k };
    const checks = [['Legs admissible (≤ 48)', a1 <= 48 && b1 <= 48], ['Integer answer (Pythagorean triple)', Number.isInteger(Math.hypot(a1, b1))], ['Right-angle mark drawn at C', true]];
    return { fam: 'geo', gen: 'ga', z, q: 'The right triangle has legs AC = ' + a1 + ' and BC = ' + b1 + '. What is the length of AB?', a: c1, eqn: 'a = √(' + a1 + '² + ' + b1 + '²) = √' + (a1 * a1 + b1 * b1) + ' = ' + c1, checks, svg: rightSVG(a1, b1) };
  };

  // Exterior-angle figure, scaled so the whole triangle and the extension CD fit the canvas.
  function triSVG(A, B) {
    const rad = d => d * Math.PI / 180;
    const C = 180 - A - B;
    const k = Math.sin(rad(C)) / Math.sin(rad(A));          // |AB| / |BC|
    const ux = k * Math.cos(rad(B)), uy = k * Math.sin(rad(B));
    const base = Math.min(240, 180 / uy, 280 / Math.max(ux, 1));
    const Bx = 60, By = 230, Cx = Bx + base, Cy = By, Ax = Bx + ux * base, Ay = By - uy * base;
    const Dx = Math.max(Cx, Ax) + 50;
    const unit = (x, y) => { const n = Math.hypot(x, y); return [x / n, y / n]; };
    const inside = (P, Q, R, d) => { const u = unit(Q[0] - P[0], Q[1] - P[1]), v = unit(R[0] - P[0], R[1] - P[1]), b = unit(u[0] + v[0], u[1] + v[1]); return [P[0] + d * b[0], P[1] + d * b[1]]; };
    const LA = inside([Ax, Ay], [Bx, By], [Cx, Cy], 34), LB = inside([Bx, By], [Ax, Ay], [Cx, Cy], 34);
    const phi = rad(180 - C), LE = [Cx + 44 * Math.cos(phi / 2), Cy - 44 * Math.sin(phi / 2)];
    const pts = [[Ax, Ay - 10], [Bx - 18, By], [Cx, Cy + 22], [Dx, Cy + 22], LA, LB, LE];
    const ok = pts.every(p => p[0] >= 4 && p[0] <= 416 && p[1] >= 14 && p[1] <= 276);
    const f = v => v.toFixed(1);
    let s = '<svg viewBox="0 0 420 280" role="img" aria-label="triangle ABC with BC extended to D"><rect width="420" height="280" fill="#fff"/>';
    s += '<line x1="' + f(Cx) + '" y1="' + Cy + '" x2="' + f(Dx) + '" y2="' + Cy + '" stroke="#121317" stroke-width="2"/>';
    s += '<polygon points="' + f(Ax) + ',' + f(Ay) + ' ' + Bx + ',' + By + ' ' + f(Cx) + ',' + Cy + '" fill="rgba(42,120,214,.08)" stroke="#121317" stroke-width="2" stroke-linejoin="round"/>';
    s += '<text x="' + f(Ax) + '" y="' + f(Ay - 10) + '" font-size="15" font-weight="700" text-anchor="middle">A</text>';
    s += '<text x="' + (Bx - 18) + '" y="' + (By + 6) + '" font-size="15" font-weight="700">B</text>';
    s += '<text x="' + f(Cx) + '" y="' + (Cy + 22) + '" font-size="15" font-weight="700" text-anchor="middle">C</text>';
    s += '<text x="' + f(Dx) + '" y="' + (Cy + 22) + '" font-size="15" font-weight="700" text-anchor="middle">D</text>';
    s += '<text x="' + f(LA[0]) + '" y="' + f(LA[1] + 4) + '" font-size="12" fill="#2a78d6" font-weight="700" text-anchor="middle">' + A + '°</text>';
    s += '<text x="' + f(LB[0]) + '" y="' + f(LB[1] + 4) + '" font-size="12" fill="#2a78d6" font-weight="700" text-anchor="middle">' + B + '°</text>';
    s += '<path d="M ' + f(Cx + 24) + ' ' + Cy + ' A 24 24 0 0 0 ' + f(Cx + 24 * Math.cos(phi)) + ' ' + f(Cy - 24 * Math.sin(phi)) + '" fill="none" stroke="#eb6834" stroke-width="2"/>';
    s += '<text x="' + f(LE[0]) + '" y="' + f(LE[1] + 5) + '" font-size="14" fill="#eb6834" font-weight="800" text-anchor="middle">?</text>';
    return { svg: s + '</svg>', ok };
  }
  function rightSVG(a1, b1) {
    const sc = Math.min(240 / b1, 200 / a1), Cx = 90, Cy = 240;
    const Ax = Cx, Ay = Cy - a1 * sc, Bx = Cx + b1 * sc, By = Cy;
    let s = '<svg viewBox="0 0 420 280" role="img" aria-label="right triangle"><rect width="420" height="280" fill="#fff"/>';
    s += '<polygon points="' + Ax + ',' + Ay.toFixed(1) + ' ' + Bx.toFixed(1) + ',' + By + ' ' + Cx + ',' + Cy + '" fill="rgba(42,120,214,.08)" stroke="#121317" stroke-width="2"/>';
    s += '<polyline points="' + Cx + ',' + (Cy - 14) + ' ' + (Cx + 14) + ',' + (Cy - 14) + ' ' + (Cx + 14) + ',' + Cy + '" fill="none" stroke="#121317" stroke-width="1.5"/>';
    s += '<text x="' + (Ax - 18) + '" y="' + (Ay + 4).toFixed(1) + '" font-size="15" font-weight="700">A</text><text x="' + (Bx + 6).toFixed(1) + '" y="' + (By + 6) + '" font-size="15" font-weight="700">B</text><text x="' + (Cx - 18) + '" y="' + (Cy + 16) + '" font-size="15" font-weight="700">C</text>';
    s += '<text x="' + (Cx - 30) + '" y="' + ((Ay + Cy) / 2 + 4).toFixed(1) + '" font-size="13" fill="#2a78d6" font-weight="700">' + a1 + '</text>';
    s += '<text x="' + ((Cx + Bx) / 2 - 6).toFixed(1) + '" y="' + (Cy + 20) + '" font-size="13" fill="#2a78d6" font-weight="700">' + b1 + '</text>';
    s += '<text x="' + ((Ax + Bx) / 2 + 10).toFixed(1) + '" y="' + ((Ay + By) / 2 - 6).toFixed(1) + '" font-size="14" fill="#eb6834" font-weight="800">?</text>';
    return s + '</svg>';
  }

  /* ---------------- UI ---------------- */
  let fam = 'chart', cur = null, counter = 0;
  const seen = new Set(), history = [];

  // JSON with every array of scalars (and each row of nested arrays) kept on one line.
  function ser(v, ind) {
    const pad = '  '.repeat(ind);
    if (Array.isArray(v)) {
      if (v.every(x => !Array.isArray(x) && typeof x !== 'object')) return JSON.stringify(v).replace(/,/g, ', ');
      return '[\n' + v.map(x => pad + '  ' + ser(x, ind + 1)).join(',\n') + '\n' + pad + ']';
    }
    if (v && typeof v === 'object') return '{\n' + Object.entries(v).map(([k, x]) => pad + '  "' + k + '": ' + ser(x, ind + 1)).join(',\n') + '\n' + pad + '}';
    return JSON.stringify(v);
  }
  function zHTML(z) {
    const json = ser(z, 0);
    return esc(json)
      .replace(/"([^"]+)":/g, '<span class="k">"$1"</span>:')
      .replace(/: "([^"]*)"/g, ': <span class="s">"$1"</span>')
      .replace(/\b(\d+)\b/g, '<span class="n">$1</span>');
  }

  function norm(x) { return String(x).trim().toLowerCase().replace(/^\\boxed\{(.*)\}$/, '$1').replace(/[°\s]/g, ''); }

  function reward() {
    const box = $('fg-rwd');
    if (!cur) return;
    const v = $('fg-in').value;
    const fmt = $('fg-box').checked ? 1 : 0, stop = ($('fg-stop').checked && fmt) ? 0 : -1;   // r_stop = 0 only for a normal ending with a final boxed answer
    const ans = v.trim() === '' ? null : (norm(v) === norm(cur.a) ? 1 : 0);
    const cell = (k, val, cls) => '<div class="' + (cls || '') + '"><small>' + k + '</small><b>' + val + '</b></div>';
    if (ans === null) { box.innerHTML = cell('r_ans', '—') + cell('r_fmt', fmt) + cell('r_stop', stop) + cell('total r', '—', 'tot'); return; }
    const tot = ans + 0.1 * fmt + 0.3 * stop;
    box.innerHTML = cell('r_ans', ans) + cell('r_fmt', fmt) + cell('r_stop', stop) + cell('total r', tot.toFixed(2), 'tot');
  }

  function generate() {
    counter++;
    const seed = (Date.now() ^ (counter * 2654435761)) >>> 0;
    cur = T[fam](seed);
    const key = fam + ':' + JSON.stringify(cur.z);
    const fresh = !seen.has(key);
    cur.checks.push(['Fresh: configuration not in this session\'s history', fresh]);
    const ok = cur.checks.every(c => c[1]);
    $('fg-id').textContent = cur.gen + '-' + String(counter).padStart(4, '0') + ' · seed ' + seed;
    $('fg-img').innerHTML = cur.svg;
    $('fg-q').textContent = cur.q;
    $('fg-z').innerHTML = '<span class="c">// z ~ p_τ, sampled parameters → configuration s(z)</span>\n' + zHTML(cur.z);
    const g = $('fg-gold');
    g.textContent = String(cur.a);
    g.classList.remove('show');
    $('fg-reveal').textContent = 'Reveal';
    $('fg-eqn').textContent = '';
    $('fg-checks').innerHTML = cur.checks.map(c => '<li class="' + (c[1] ? 'ok' : 'no') + '"><span class="m">' + (c[1] ? '✓' : '✗') + '</span>' + esc(c[0]) + '</li>').join('');
    const vd = $('fg-verdict');
    vd.className = 'verdict ' + (ok ? 'ok' : 'no');
    vd.textContent = ok ? 'Admitted to the candidate reservoir. Its answer is stored with the generator id and seed for reconstruction.' : 'Rejected candidate. It never enters a training pool; sample again.';
    $('fg-adm').textContent = ok ? 'admitted' : 'rejected';
    if (ok) {
      seen.add(key);
      history.push(fam);
      if (history.length > 48) history.shift();
      const LET = { geo: 'G', chart: 'C', table: 'T', count: 'N' };
      $('fg-hist').innerHTML = history.map(f => '<span style="background:' + COL[f] + '" title="' + f + '">' + LET[f] + '</span>').join('');
      $('fg-hist').setAttribute('aria-label', 'admitted tasks: ' + Object.keys(LET).map(k => k + ' ' + history.filter(x => x === k).length).join(', '));
    }
    $('fg-in').value = '';
    reward();
  }

  $('fg-fam').addEventListener('click', e => {
    const b = e.target.closest('.chip');
    if (!b) return;
    fam = b.dataset.f;
    document.querySelectorAll('#fg-fam .chip').forEach(x => x.classList.toggle('on', x === b));
    generate();
  });
  $('fg-gen').addEventListener('click', generate);
  $('fg-reveal').addEventListener('click', () => {
    const g = $('fg-gold');
    const on = g.classList.toggle('show');
    $('fg-reveal').textContent = on ? 'Hide' : 'Reveal';
    $('fg-eqn').textContent = on ? cur.eqn : '';
  });
  ['fg-in', 'fg-box', 'fg-stop'].forEach(id => $(id).addEventListener('input', reward));
  $('fg-in').addEventListener('keydown', e => { if (e.key === 'Enter') reward(); });

  generate();
})();
