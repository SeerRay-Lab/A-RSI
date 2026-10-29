/* Charts and tables. One hero series (A-RSI, brand orange); comparison policies are
   neutral ink with distinct dash patterns and direct labels, highlighted in blue on hover. */
(function () {
  'use strict';
  const D = window.ARSI;
  const $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const ORANGE = '#eb6834', BLUE = '#2a78d6', INK = '#0b0b0b', INK2 = '#52514e', NEUTRAL = '#8f8e88';
  const DASH = { ours: '', cont: '7 4', periodic: '2 4', front: '10 3 2 3', nr: '1 5' };
  const NAME = Object.fromEntries(D.arms.map(a => [a.id, a.name]));
  const f2 = v => (v === null || v === undefined ? '—' : v.toFixed(2));
  const sgn = v => (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(v).toFixed(2);

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function wrap(host) {
    const w = document.createElement('div');
    w.className = 'plot-scroll';
    host.appendChild(w);
    return w;
  }
  function tipBox(host) {
    const t = document.createElement('div');
    t.className = 'tip';
    host.appendChild(t);
    return t;
  }
  function placeTip(tip, host, x, y) {
    const hw = host.clientWidth, tw = tip.offsetWidth;
    tip.style.left = Math.max(6, Math.min(hw - tw - 6, x + 14)) + 'px';
    tip.style.top = Math.max(6, y - 10) + 'px';
  }
  const swatch = id => '<svg viewBox="0 0 22 10"><line x1="1" y1="5" x2="21" y2="5" stroke="' + (id === 'ours' ? ORANGE : NEUTRAL) + '" stroke-width="' + (id === 'ours' ? 3 : 2) + '" stroke-dasharray="' + DASH[id] + '" stroke-linecap="round"/></svg>';

  /* ---------------- policy line chart ---------------- */
  let pModel = 'qwen';
  const hidden = new Set();
  const reveal = { done: false, started: false, pending: null };
  function policyChart() {
    const P = D.policy[pModel];
    const host = $('pe-chart');
    const ids = Object.keys(P.y);
    host.innerHTML = '<div class="viz-head"><div><div class="viz-title">' + P.label + '</div><div class="viz-sub">' + P.startNote + ' · 8,192 tokens · one run per policy</div></div><div class="legend" id="pe-leg">' +
      ids.map(id => '<button class="lg' + (hidden.has(id) ? ' off' : '') + '" data-id="' + id + '" type="button" aria-pressed="' + !hidden.has(id) + '">' + swatch(id) + NAME[id] + '</button>').join('') + '</div></div>';
    const W = 700, H = 340, m = { l: 46, r: 178, t: 22, b: 36 };
    const xs = P.x, xmax = xs[xs.length - 1];
    const all = ids.flatMap(id => P.y[id]).filter(v => v !== null);
    const lo = Math.floor(Math.min(...all) * 2) / 2 - 0.25, hi = Math.ceil(Math.max(...all) * 2) / 2 + 0.25;
    const X = x => m.l + (x / xmax) * (W - m.l - m.r), Y = v => m.t + (1 - (v - lo) / (hi - lo)) * (H - m.t - m.b);
    const svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'plot', role: 'img', 'aria-label': P.label });
    wrap(host).appendChild(svg);
    const g = el('g', { class: 'grid' }, svg), ax = el('g', { class: 'axis' }, svg);
    for (let v = Math.ceil(lo * 2) / 2; v <= hi; v += 0.5) {
      el('line', { x1: m.l, x2: W - m.r + 8, y1: Y(v), y2: Y(v) }, g);
      el('text', { x: m.l - 8, y: Y(v) + 4, 'text-anchor': 'end' }, ax).textContent = v.toFixed(1);
    }
    for (let x = 0; x <= xmax; x++) {
      el('text', { x: X(x), y: H - m.b + 18, 'text-anchor': 'middle' }, ax).textContent = x;
    }
    el('text', { x: (m.l + W - m.r) / 2, y: H - 4, 'text-anchor': 'middle' }, ax).textContent = 'continuation window';
    if (pModel === 'mimo') {
      el('rect', { x: X(0), y: m.t, width: X(3) - X(0), height: H - m.t - m.b, fill: '#f3f2ee' }, g);
      el('text', { x: (X(0) + X(3)) / 2, y: m.t + 14, 'text-anchor': 'middle', class: 'lbl-t' }, svg).textContent = 'shared old-pool trajectory';
    }
    const qwen = pModel === 'qwen';
    if (qwen && !hidden.has('nr')) {
      el('rect', { x: X(2), y: Y(58.85), width: X(6) - X(2), height: Y(57.95) - Y(58.85), rx: 6, fill: 'rgba(143,142,136,.13)' }, g);
      el('text', { x: (X(2) + X(6)) / 2, y: Y(57.95) - 5, 'text-anchor': 'middle', class: 'lbl-t', fill: INK2, 'font-size': 10 }, svg).textContent = 'No-Refresh plateau';
    }
    if (qwen) {
      [3, 6].forEach(x => el('text', { x: X(x), y: H - m.b - 6, 'text-anchor': 'middle', fill: '#b34700', 'font-size': 13, 'font-weight': 800 }, svg).textContent = '↻');
      el('text', { x: m.l + 4, y: 12, class: 'lbl-t', fill: '#b34700', 'font-size': 10.5 }, svg).textContent = '↻ = detector-triggered refresh (A-RSI, Frontier)';
    }
    const defs = el('defs', {}, svg);
    const clipId = 'pe-clip-' + pModel;
    const clipRect = el('rect', { x: 0, y: 0, width: (reveal.done || reveal.started) ? W : 0, height: H }, el('clipPath', { id: clipId }, defs));
    const layer = el('g', { 'clip-path': 'url(#' + clipId + ')' }, svg);
    const order = ids.filter(id => id !== 'ours').concat(['ours']);
    const ends = [];
    const lines = {};
    order.forEach(id => {
      if (hidden.has(id)) return;
      const pts = P.y[id].map((v, i) => [xs[i], v]).filter(p => p[1] !== null);
      const gid = el('g', { 'data-id': id }, layer);
      const col = id === 'ours' ? ORANGE : NEUTRAL;
      el('path', { d: pts.map((p, i) => (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1)).join(' '), fill: 'none', stroke: col, 'stroke-width': id === 'ours' ? 3 : 2, 'stroke-dasharray': DASH[id], 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, gid);
      pts.forEach(p => el('circle', { cx: X(p[0]), cy: Y(p[1]), r: id === 'ours' ? 4.5 : 3.5, fill: id === 'ours' ? ORANGE : '#fcfcfb', stroke: id === 'ours' ? '#fcfcfb' : col, 'stroke-width': 2 }, gid));
      const last = pts[pts.length - 1];
      ends.push({ id, x: X(last[0]), y: Y(last[1]), v: last[1], halted: id === 'nr' && pModel === 'qwen', tasks: qwen && P.tasks[id] ? P.tasks[id] : null });
      lines[id] = gid;
    });
    // direct labels, de-collided
    ends.sort((a, b) => a.y - b.y);
    for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 14) ends[i].y = ends[i - 1].y + 14;
    ends.forEach(e => {
      const t = el('text', { x: e.x + 8, y: e.y + 4, class: 'lbl-t', 'font-weight': e.id === 'ours' ? 700 : 500, fill: INK }, svg);
      t.textContent = NAME[e.id] + ' ' + f2(e.v) + (e.halted ? ' · halted at S31' : e.tasks ? ' · ' + e.tasks.toLocaleString('en-US') + ' tasks' : '');
      t.setAttribute('data-id', e.id);
    });
    if (qwen && !hidden.has('ours') && !hidden.has('nr')) {
      const bx = X(6) - 14, y1 = Y(60.40), y2 = Y(58.35);
      const br = el('g', { class: 'pe-ann' }, svg);
      el('path', { d: 'M ' + (bx + 5) + ' ' + y1 + ' H ' + bx + ' V ' + y2 + ' H ' + (bx + 5), fill: 'none', stroke: INK, 'stroke-width': 1.5 }, br);
      el('text', { x: bx - 6, y: (y1 + y2) / 2 + 5, 'text-anchor': 'end', 'font-size': 15, 'font-weight': 800, fill: ORANGE }, br).textContent = '+2.05';
    }
    if (!reveal.done && !reveal.started) reveal.pending = () => {
      reveal.started = true;
      const t0 = performance.now(), dur = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 1100;
      (function f(now) { const k = Math.max(0, Math.min(1, (now - t0) / dur)); clipRect.setAttribute('width', (W * (1 - Math.pow(1 - k, 3))).toFixed(1)); if (k < 1) requestAnimationFrame(f); else reveal.done = true; })(t0);
    };
    // hover layer
    const cross = el('line', { y1: m.t, y2: H - m.b, stroke: '#c9c7c0', 'stroke-width': 1, opacity: 0 }, svg);
    const hit = el('rect', { x: m.l - 10, y: m.t, width: W - m.l - m.r + 20, height: H - m.t - m.b, fill: 'transparent' }, svg);
    const tip = tipBox(host);
    hit.addEventListener('mousemove', ev => {
      const r = svg.getBoundingClientRect();
      const px = (ev.clientX - r.left) * (W / r.width);
      let bi = 0;
      xs.forEach((x, i) => { if (Math.abs(X(x) - px) < Math.abs(X(xs[bi]) - px)) bi = i; });
      cross.setAttribute('x1', X(xs[bi])); cross.setAttribute('x2', X(xs[bi])); cross.setAttribute('opacity', 1);
      const rows = ids.filter(id => !hidden.has(id)).map(id => [id, P.y[id][bi]]).sort((a, b) => (b[1] ?? -1) - (a[1] ?? -1));
      tip.innerHTML = '<div class="h">Window ' + xs[bi] + '</div>' + rows.map(([id, v]) => '<div class="r"><span><i style="background:' + (id === 'ours' ? ORANGE : NEUTRAL) + '"></i>' + NAME[id] + '</span><b>' + (v === null ? 'halted' : f2(v)) + '</b></div>').join('');
      tip.style.opacity = 1;
      placeTip(tip, host, (ev.clientX - host.getBoundingClientRect().left), (ev.clientY - host.getBoundingClientRect().top));
    });
    hit.addEventListener('mouseleave', () => { tip.style.opacity = 0; cross.setAttribute('opacity', 0); });
    // legend: toggle + highlight
    host.querySelectorAll('.lg').forEach(b => {
      b.addEventListener('click', () => { const id = b.dataset.id; hidden.has(id) ? hidden.delete(id) : (ids.length - hidden.size > 1 && hidden.add(id)); policyChart(); });
      b.addEventListener('mouseenter', () => highlight(b.dataset.id, true));
      b.addEventListener('mouseleave', () => highlight(b.dataset.id, false));
    });
    function highlight(id, on) {
      if (id === 'ours' || !lines[id]) return;
      lines[id].querySelectorAll('path, circle').forEach(n => n.setAttribute('stroke', on ? BLUE : NEUTRAL));
      if (on) layer.appendChild(lines[id]); else layer.insertBefore(lines[id], lines.ours || null);
    }
    barsPanel();
  }

  function barsPanel() {
    const host = $('pe-bars');
    const P = D.policy[pModel];
    let rows, title, sub, fmt;
    if (pModel === 'qwen') {
      rows = ['ours', 'front', 'periodic', 'cont'].map(id => [id, P.per1k[id], P.tasks[id], P.y[id][4]]);
      title = 'Gain per 1,000 fresh tasks';
      sub = 'Gain over S<sub>t</sub> at window 8, divided by fresh tasks used';
      fmt = r => '+' + r[1].toFixed(2);
    } else {
      rows = ['ours', 'cont', 'periodic'].map(id => [id, P.vsNR[id], null, P.y[id][6]]);
      title = 'Window 8 minus No-Refresh';
      sub = 'Macro11 points over continued reuse of the old pool';
      fmt = r => '+' + r[1].toFixed(2);
    }
    const W = 400, rowH = 46, m = { l: 92, r: 54, t: 6 }, H = m.t + rows.length * rowH + 8;
    const max = Math.max(...rows.map(r => r[1])) * 1.05;
    host.innerHTML = '<div class="viz-head"><div><div class="viz-title">' + title + '</div><div class="viz-sub">' + sub + '</div></div></div>';
    const svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'plot', role: 'img', 'aria-label': title });
    wrap(host).appendChild(svg);
    const tip = tipBox(host);
    rows.forEach((r, i) => {
      const y = m.t + i * rowH, w = (r[1] / max) * (W - m.l - m.r);
      el('text', { x: m.l - 10, y: y + 18, 'text-anchor': 'end', class: 'lbl-t', 'font-weight': r[0] === 'ours' ? 700 : 500, fill: INK }, svg).textContent = NAME[r[0]];
      if (r[2] !== null) el('text', { x: m.l - 10, y: y + 32, 'text-anchor': 'end', class: 'lbl-t', fill: INK2, 'font-size': 10 }, svg).textContent = r[2].toLocaleString('en-US') + ' tasks';
      const bar = el('rect', { x: m.l, y: y + 8, width: Math.max(2, w), height: 22, rx: 4, fill: r[0] === 'ours' ? ORANGE : '#c9c7c0' }, svg);
      el('text', { x: m.l + w + 6, y: y + 23, class: 'lbl-t', 'font-weight': 700, fill: INK }, svg).textContent = fmt(r);
      const hitR = el('rect', { x: 0, y: y, width: W, height: rowH, fill: 'transparent' }, svg);
      hitR.addEventListener('mousemove', ev => {
        tip.innerHTML = '<div class="h">' + NAME[r[0]] + '</div><div class="r"><span>Macro11 at window 8</span><b>' + f2(r[3]) + '</b></div>' + (r[2] !== null ? '<div class="r"><span>fresh tasks</span><b>' + r[2].toLocaleString('en-US') + '</b></div>' : '') + '<div class="r"><span>' + title.toLowerCase() + '</span><b>' + fmt(r) + '</b></div>';
        tip.style.opacity = 1;
        const hb = host.getBoundingClientRect();
        placeTip(tip, host, ev.clientX - hb.left, ev.clientY - hb.top);
        bar.setAttribute('opacity', .85);
      });
      hitR.addEventListener('mouseleave', () => { tip.style.opacity = 0; bar.setAttribute('opacity', 1); });
    });
    const foot = document.createElement('p');
    foot.className = 'small muted';
    foot.style.margin = '6px 2px 0';
    foot.textContent = pModel === 'qwen'
      ? 'No-Refresh halted at S31 and has no window-8 score. Policies differ in both timing and selection, so these ratios do not isolate either.'
      : 'MiMo pools for Continuous and Periodic were selected at Qwen\'s difficulty frontier. Margins over them are small (+0.02, +0.18) and come from one run each.';
    host.appendChild(foot);
  }

  /* ---------------- pool schedule (Figure 3) ---------------- */
  function schedule() {
    const host = $('pe-sched');
    const FILL = { old: '#e6e8eb', rand: '#ffd9bf', front: '#cfe0f6', adapt: '#c9efe0', halt: 'none' };
    const TXT = { old: 'old pool', rand: '', front: '', adapt: '', halt: 'halted' };
    host.innerHTML = '<div class="viz-head"><div><div class="viz-title">Training pools through S<sub>32</sub> (Qwen)</div><div class="viz-sub">Each fresh block holds 400 tasks; its width shows how long the pool is used. Triangles mark detector-triggered replacements.</div></div>' +
      '<div class="legend"><span class="lg" style="cursor:default"><svg viewBox="0 0 22 10"><rect x="1" y="1" width="20" height="8" rx="2" fill="#ffd9bf"/></svg>random sampling</span><span class="lg" style="cursor:default"><svg viewBox="0 0 22 10"><rect x="1" y="1" width="20" height="8" rx="2" fill="#cfe0f6"/></svg>frontier selection</span><span class="lg" style="cursor:default"><svg viewBox="0 0 22 10"><rect x="1" y="1" width="20" height="8" rx="2" fill="#c9efe0"/></svg>adaptive difficulty</span></div></div>';
    const W = 900, rowH = 40, m = { l: 110, r: 96, t: 26 }, H = m.t + D.schedule.length * rowH + 4;
    const cw = (W - m.l - m.r) / 8;
    const svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'plot', role: 'img', 'aria-label': 'pool schedule' });
    wrap(host).appendChild(svg);
    ['S11', 'S12', 'S13', 'S21', 'S22', 'S23', 'S31', 'S32'].forEach((s, i) => {
      const t = el('text', { x: m.l + (i + 0.5) * cw, y: 14, 'text-anchor': 'middle', class: 'lbl-t', fill: INK2 }, svg);
      t.innerHTML = 'S<tspan baseline-shift="sub" font-size="9">' + s.slice(1) + '</tspan>';
    });
    el('text', { x: W - m.r / 2, y: 14, 'text-anchor': 'middle', class: 'lbl-t', fill: INK2 }, svg).textContent = 'fresh tasks';
    D.schedule.forEach((row, r) => {
      const y = m.t + r * rowH;
      el('text', { x: m.l - 12, y: y + 15, 'text-anchor': 'end', class: 'lbl-t', 'font-weight': row.id === 'ours' ? 800 : 600, fill: INK }, svg).textContent = NAME[row.id];
      el('text', { x: m.l - 12, y: y + 29, 'text-anchor': 'end', class: 'lbl-t', 'font-size': 10, fill: INK2 }, svg).textContent = { ours: 'random draw', front: 'frontier', periodic: 'frontier', cont: 'adaptive difficulty', nr: 'never refreshes' }[row.id];
      row.blocks.forEach(b => {
        const x0 = m.l + (b[0] - 1) * cw + 3, w = (b[1] - b[0] + 1) * cw - 6;
        el('rect', { x: x0, y: y + 4, width: w, height: 26, rx: 5, fill: FILL[b[2]], stroke: b[2] === 'halt' ? '#a7a59e' : 'none', 'stroke-dasharray': b[2] === 'halt' ? '4 3' : '' }, svg);
        el('text', { x: x0 + w / 2, y: y + 21, 'text-anchor': 'middle', class: 'lbl-t', fill: b[2] === 'halt' ? INK2 : INK, 'font-style': b[2] === 'halt' ? 'italic' : 'normal' }, svg).textContent = b[3] || TXT[b[2]];
      });
      row.fires.forEach(fx => {
        const cx = m.l + (fx - 0.5) * cw;
        el('path', { d: 'M ' + (cx - 5) + ' ' + (y - 1) + ' L ' + (cx + 5) + ' ' + (y - 1) + ' L ' + cx + ' ' + (y + 7) + ' Z', fill: INK }, svg);
      });
      el('text', { x: W - m.r / 2, y: y + 21, 'text-anchor': 'middle', class: 'lbl-t', 'font-weight': row.id === 'ours' ? 800 : 600, fill: INK }, svg).textContent = row.fresh.toLocaleString('en-US');
    });
  }

  /* ---------------- benchmark table ---------------- */
  let bModel = 'qwen', bCol = null;
  function shade(d) {
    const a = Math.min(1, Math.abs(d) / 6) * 0.5;
    return d >= 0 ? 'rgba(235,104,52,' + a.toFixed(3) + ')' : 'rgba(42,120,214,' + a.toFixed(3) + ')';
  }
  // Qwen gets an S_t column (appendix "tab:twelve"); shading is relative to the start of continuation.
  function benchTable() {
    const B = D.bench[bModel];
    const qwen = bModel === 'qwen', ST = D.stQwen;
    const cols = qwen ? ['S0', 'St'].concat(D.cols.slice(1)) : D.cols.slice();
    const base = qwen ? 1 : 0, s32 = cols.indexOf('S32');
    if (bCol === null || bCol >= cols.length) bCol = s32;
    const sub = c => c === 'S0' ? 'S<sub>0</sub>' : c === 'St' ? 'S<sub>t</sub>' : 'S<sub>' + c.slice(1) + '</sub>';
    let h = '<table class="t"><thead><tr class="grp"><th></th><th></th><th></th>' + (qwen ? '<th></th>' : '') + '<th colspan="3">Pool 1</th><th colspan="3">Pool 2</th><th colspan="3">Pool 3</th></tr><tr><th>Benchmark</th><th>n</th>' +
      cols.map((c, i) => '<th data-c="' + i + '" class="' + (i === bCol ? 'cur' : '') + '" role="button" tabindex="0" aria-pressed="' + (i === bCol) + '" aria-label="compare ' + c + ' with ' + cols[base] + '">' + sub(c) + '</th>').join('') + '</tr></thead><tbody>';
    let up = 0;
    B.rows.forEach(([nm, n, v]) => {
      const row = qwen ? [v[0], ST[nm][0]].concat(v.slice(1)) : v;
      if (row[bCol] > row[base]) up++;
      h += '<tr><td>' + nm + '</td><td>' + n.toLocaleString('en-US') + '</td>' + row.map((x, i) => '<td class="heat' + (i === bCol ? ' cur' : '') + '" style="background:' + (i > base ? shade(x - row[base]) : 'transparent') + '" title="' + nm + ' · ' + cols[i] + ': ' + x.toFixed(2) + '">' + x.toFixed(2) + '</td>').join('') + '</tr>';
    });
    const macro = qwen ? [B.macro[0], 57.77].concat(B.macro.slice(1)) : B.macro;
    h += '<tr class="hl"><td>Macro11</td><td>—</td>' + macro.map((x, i) => '<td class="' + (i === bCol ? 'cur' : '') + '">' + x.toFixed(2) + '</td>').join('') + '</tr>';
    h += '<tr><td>Pool mean</td><td>—</td><td>' + B.macro[0].toFixed(2) + '</td>' + (qwen ? '<td>57.77</td>' : '') + B.poolMean.map(x => '<td colspan="3" style="text-align:center;font-weight:700">' + x.toFixed(2) + '</td>').join('') + '</tr></tbody></table>';
    h += '<p class="small muted" style="margin:10px 12px">' + (bCol <= base ? sub(cols[bCol]) + (qwen && bCol === 1 ? ' is S<sub>0</sub> after 100 GRPO updates on the old pool; continuation starts here.' : ' is the public starting model.') : sub(cols[bCol]) + ': Macro11 ' + macro[bCol].toFixed(2) + ' vs ' + macro[base].toFixed(2) + ' at ' + sub(cols[base]) + '; higher on ' + up + ' of 11 benchmarks.') +
      ' Shading: change from ' + sub(cols[base]) + '. Click a column to compare. S<sub>32</sub> is the eight-window endpoint; S<sub>33</sub> is one further window.' + (qwen ? ' S<sub>t</sub> values: appendix per-benchmark table.' : ' MiMo continues directly from its public S<sub>0</sub> = 59.08.') + '</p>';
    $('bm-table').innerHTML = h;
    $('bm-table').querySelectorAll('th[data-c]').forEach(th => {
      const go = () => { bCol = +th.dataset.c; benchTable(); const n = $('bm-table').querySelector('th[data-c="' + bCol + '"]'); if (n) n.focus(); };
      th.addEventListener('click', go);
      th.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
  }

  /* ---------------- selection ablation ---------------- */
  function selectionChart() {
    const host = $('sel-chart');
    host.innerHTML = '<div class="viz-head"><div><div class="viz-title">Replacement selection vs a random draw</div><div class="viz-sub">Macro11 difference from the random control in the same block, 8,192 tokens</div></div></div>';
    const rows = [];
    D.selection.forEach(b => { rows.push({ head: b.block, control: b.control }); b.items.forEach(it => rows.push({ name: it[0], v: it[1], d: it[2], control: b.control })); });
    const W = 660, rowH = 28, m = { l: 190, r: 86, t: 8 }, H = m.t + rows.length * rowH + 24;
    const min = -3, X = d => m.l + ((d - min) / (0 - min)) * (W - m.l - m.r);
    const svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'plot', role: 'img', 'aria-label': 'replacement selection ablation' });
    wrap(host).appendChild(svg);
    const tip = tipBox(host);
    const g = el('g', { class: 'grid' }, svg), ax = el('g', { class: 'axis' }, svg);
    for (let d = -3; d <= 0; d += 0.5) {
      el('line', { x1: X(d), x2: X(d), y1: m.t, y2: H - 22 }, g);
      el('text', { x: X(d), y: H - 6, 'text-anchor': 'middle' }, ax).textContent = d === 0 ? '0 = random' : d.toFixed(1);
    }
    rows.forEach((r, i) => {
      const y = m.t + i * rowH;
      if (r.head) {
        el('text', { x: 0, y: y + 19, class: 'lbl-t', 'font-weight': 800, fill: INK }, svg).textContent = r.head;
        el('text', { x: W - m.r + 12, y: y + 19, class: 'lbl-t', fill: INK2 }, svg).textContent = 'random ' + r.control.toFixed(2);
        return;
      }
      el('text', { x: m.l - 10, y: y + 19, 'text-anchor': 'end', class: 'lbl-t', fill: INK }, svg).textContent = r.name;
      const bar = el('rect', { x: X(r.d), y: y + 6, width: Math.max(2, X(0) - X(r.d)), height: 18, rx: 4, fill: '#8f8e88', class: 'selbar', style: 'transform-box: fill-box; transform-origin: right center; transform: ' + (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'none' : 'scaleX(0)') }, svg);
      el('text', { x: X(r.d) - 6, y: y + 19, 'text-anchor': 'end', class: 'lbl-t', 'font-weight': 700, fill: INK }, svg).textContent = sgn(r.d);
      el('text', { x: W - m.r + 12, y: y + 19, class: 'lbl-t', fill: INK2 }, svg).textContent = r.v.toFixed(2);
      const hit = el('rect', { x: 0, y, width: W, height: rowH, fill: 'transparent' }, svg);
      hit.addEventListener('mousemove', ev => {
        tip.innerHTML = '<div class="h">' + r.name + '</div><div class="r"><span>Macro11</span><b>' + r.v.toFixed(2) + '</b></div><div class="r"><span>random control</span><b>' + r.control.toFixed(2) + '</b></div><div class="r"><span>difference</span><b>' + sgn(r.d) + '</b></div>';
        tip.style.opacity = 1;
        const hb = host.getBoundingClientRect();
        placeTip(tip, host, ev.clientX - hb.left, ev.clientY - hb.top);
        bar.setAttribute('fill', '#52514e');
      });
      hit.addEventListener('mouseleave', () => { tip.style.opacity = 0; bar.setAttribute('fill', '#8f8e88'); });
    });
    el('line', { x1: X(0), x2: X(0), y1: m.t, y2: H - 22, stroke: ORANGE, 'stroke-width': 2 }, svg);
  }

  /* ---------------- visual types ---------------- */
  function vtTable() {
    const V = D.vtypes;
    let h = '<table class="t"><thead><tr class="grp"><th></th>' + V.head.map(([n, c]) => '<th colspan="2">' + n + ' (' + c.toLocaleString('en-US') + ')</th>').join('') + '</tr><tr><th>Arm</th>' + V.head.map(() => '<th>Acc.</th><th>Trunc.</th>').join('') + '</tr></thead><tbody>';
    V.rows.forEach(([nm, v]) => {
      h += '<tr class="' + (nm === 'A-RSI' ? 'hl' : '') + '"><td>' + nm.replace('S_t', 'S<sub>t</sub>') + '</td>' + v.map(x => '<td>' + x.toFixed(2) + '</td>').join('') + '</tr>';
    });
    h += '<tr><td><i>Change from S<sub>t</sub></i></td>' + V.change.map((x, i) => {
      const good = i % 2 === 0 ? x > 0 : x < 0;
      return '<td class="' + (good ? 'gain-up' : 'gain-dn') + '">' + (good ? '▲ ' : '▼ ') + sgn(x) + '</td>';
    }).join('') + '</tr></tbody></table><p class="small muted" style="margin:10px 12px">Accuracy and truncation rate (%) pooled within each annotated visual type at S<sub>32</sub>, 8,192 tokens. ▲ marks an improvement: higher accuracy or less truncation.</p>';
    $('vt-table').innerHTML = h;
  }

  window.ARSI_seg('pe-model', m => {
    pModel = m; hidden.clear(); reveal.done = true; policyChart();
    $('pe-call').textContent = m === 'qwen' ? '+2.05' : '+0.70';
    $('pe-eyebrow').textContent = (m === 'qwen' ? 'Qwen3-VL-8B' : 'MiMo-VL-7B') + ' · eleven full benchmarks · 8,192 tokens';
    $('pe-h3').textContent = m === 'qwen' ? 'A spent pool stalls; fresh pools keep climbing' : 'Refreshing arms end above continued reuse, by small single-run margins';
    $('pe-callcap').textContent = m === 'qwen' ? 'vs continued reuse at window 6 (60.40 vs 58.35)' : 'vs continued reuse at window 8 (60.71 vs 60.01)';
    $('pe-hedge').textContent = m === 'qwen'
      ? 'One training run per policy. Replacement also shrinks the active pool from 500 to 400 tasks, so +2.05 is evidence for the combined policy, not for freshness alone.'
      : 'One run per arm. MiMo\'s margins over Continuous and Periodic (+0.02, +0.18) do not establish a timing advantage; those two arms used pools selected at Qwen\'s difficulty frontier.';
    $('pe-intro').textContent = (m === 'qwen' ? 'Five refresh policies' : 'Four refresh policies (MiMo has no Frontier arm)') + ', aligned by training updates. Hover the chart for exact scores, click a legend entry to hide or show a policy.';
  });
  window.ARSI_seg('bm-model', m => { bModel = m; bCol = null; benchTable(); });
  policyChart(); schedule(); benchTable(); selectionChart(); if ($('vt-table')) vtTable();
  new IntersectionObserver((es, io) => { if (es[0].isIntersecting) { io.disconnect(); if (reveal.pending) reveal.pending(); } }, { threshold: 0.35 }).observe($('pe-chart'));
  new IntersectionObserver((es, io) => {
    if (!es[0].isIntersecting) return;
    io.disconnect();
    $('sel-chart').querySelectorAll('rect.selbar').forEach((r, i) => { r.style.transition = 'transform .6s cubic-bezier(.2,.7,.2,1) ' + (i * 45) + 'ms'; r.style.transform = 'scaleX(1)'; });
  }, { threshold: 0.3 }).observe($('sel-chart'));
})();
