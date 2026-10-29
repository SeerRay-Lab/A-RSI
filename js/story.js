/* Story visuals: zero-advantage explainer, signal sawtooth (Qwen vs MiMo), benchmark sparklines,
   visual-type dumbbells, length-budget toggle, full-suite gain split, and the claims ledger.
   Every number comes from the A-RSI manuscript (see js/data.js and the comments below). */
(function () {
  'use strict';
  const D = window.ARSI;
  const $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const ORANGE = '#eb6834', NAVY = '#0f4c75', INK = '#0b0b0b', INK2 = '#52514e', GREY = '#8f8e88';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el = (tag, attrs, parent, text) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (text !== undefined) e.textContent = text; if (parent) parent.appendChild(e); return e; };
  const sgn = (v, d = 2) => (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(v).toFixed(d);
  const onView = (node, fn, thr) => {
    if (!node) return;
    const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); fn(); } }, { threshold: thr || 0.3 });
    io.observe(node);
  };
  function tip(host) { const t = document.createElement('div'); t.className = 'tip'; host.appendChild(t); return t; }
  function place(t, host, ev) {
    const hb = host.getBoundingClientRect();
    const x = ev.clientX - hb.left, y = ev.clientY - hb.top;
    t.style.left = Math.max(6, Math.min(host.clientWidth - t.offsetWidth - 6, x + 14)) + 'px';
    t.style.top = Math.max(6, y - 10) + 'px';
  }

  /* ---------- 1.1 zero-advantage explainer (illustration of the definition) ---------- */
  (function logSees() {
    const host = $('log-sees');
    if (!host) return;
    // rewards from r = r_ans + 0.1 r_fmt + 0.3 r_stop (coefficients: appendix)
    const R = { y: 1.1, n: 0.1, c: -0.3 };
    const G = [
      { k: 'Mixed', d: 'yyyyynnn', v: 'Rewards differ → nonzero advantage → counts toward U<sub>w</sub>.', live: true },
      { k: 'All right', d: 'yyyyyyyy', v: 'Identical rewards → zero advantage, no gradient.', live: false },
      { k: 'All wrong', d: 'nnnnnnnn', v: 'Silent too. Silent is not the same as mastered.', live: false },
      { k: '7 wrong, 1 cut off', d: 'nnnnnnnc', v: 'Still counts: same correctness, but the format and stopping rewards differ.', live: true }
    ];
    const sym = { y: '✓', n: '✗', c: '✂' };
    host.innerHTML = '<div class="ls-grid">' + G.map((g, gi) => {
      const rs = [...new Set(g.d.split('').map(c => R[c].toFixed(1)))];
      return '<div class="ls-card ' + (g.live ? 'live' : 'silent') + '"><div class="ls-k">' + g.k + '<span class="ls-tag">' + (g.live ? 'teaching' : 'silent') + '</span></div>' +
        '<div class="ls-dots">' + g.d.split('').map((c, i) => '<i class="' + c + '" style="--i:' + (gi * 8 + i) + '">' + sym[c] + '</i>').join('') + '</div>' +
        '<div class="ls-r">rewards: ' + rs.join(' / ') + '</div><div class="ls-v">' + g.v + '</div></div>';
    }).join('') + '</div>' +
      '<div class="ls-rule"><b>The rule.</b> After at least 3 windows on a pool, refresh if U<sub>w</sub> falls to 85% of its value two windows earlier, or training accuracy rises 10 points. <span class="muted">Qwen, Pool 1: 239 → 195 = 81.6% → refresh.</span></div>' +
      '<p class="small muted ls-foot">Illustration of the definition, not logged data. ✓ correct, boxed, finished (1.1) · ✗ wrong, boxed, finished (0.1) · ✂ cut off before a final boxed answer (−0.3).</p>';
    onView(host, () => host.classList.add('play'), 0.35);
  })();

  /* ---------- 4.2 signal sawtooth: one rule, different decisions ---------- */
  (function sawtooth() {
    const host = $('sig-chart');
    if (!host) return;
    const models = [['Qwen', 'Qwen3-VL-8B'], ['MiMo', 'MiMo-VL-7B']];
    host.innerHTML = '<div class="saw-wrap"></div><p class="small muted saw-cap">Logged U<sub>w</sub> per window. Dashed segments: 85% of the pool\'s first window. Missing markers are windows the paper does not report; nothing is interpolated. Open circles: third-pool values used by the offline replay.</p>';
    const wrap = host.querySelector('.saw-wrap');
    const t = tip(host);
    const anims = [];
    models.forEach(([key, label]) => {
      const pools = D.controller[key];
      const W = 520, H = 260, m = { l: 40, r: 14, t: 28, b: 64 };
      const X = w => m.l + (w - 0.5) / 9 * (W - m.l - m.r), Y = u => m.t + (1 - (u - 120) / (250 - 120)) * (H - m.t - m.b);
      const box = document.createElement('div'); box.className = 'saw-panel plot-scroll'; wrap.appendChild(box);
      const svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'plot', role: 'img', 'aria-label': label + ' logged U per window' }, box);
      el('text', { x: m.l, y: 16, class: 'lbl-t', 'font-weight': 800, fill: INK }, svg, label);
      [130, 160, 190, 220, 250].forEach(u => {
        el('line', { x1: m.l, x2: W - m.r, y1: Y(u), y2: Y(u), stroke: '#eceae5' }, svg);
        el('text', { x: m.l - 6, y: Y(u) + 4, 'text-anchor': 'end', class: 'lbl-t' }, svg, u);
      });
      for (let w = 1; w <= 9; w++) el('text', { x: X(w), y: H - m.b + 16, 'text-anchor': 'middle', class: 'lbl-t' }, svg, w);
      el('text', { x: (m.l + W - m.r) / 2, y: H - m.b + 30, 'text-anchor': 'middle', class: 'lbl-t', fill: INK2 }, svg, 'continuation window');
      pools.forEach((p, pi) => {
        const g = el('g', { class: 'saw-pool', style: 'opacity:' + (reduce ? 1 : 0) }, svg);
        const w0 = p.w[0], x0 = X(w0) - (X(2) - X(1)) / 2, x1 = X(w0 + 2) + (X(2) - X(1)) / 2;
        el('rect', { x: x0, y: m.t, width: x1 - x0, height: H - m.t - m.b, fill: pi % 2 ? '#f6f5f1' : '#fbfaf7' }, g, undefined);
        el('text', { x: (x0 + x1) / 2, y: m.t + 12, 'text-anchor': 'middle', class: 'lbl-t', fill: INK2, 'font-size': 10 }, g, 'Pool ' + (pi + 1) + (pi === 2 ? ' · replay' : ''));
        const thr = 0.85 * p.U[0];
        el('line', { x1: X(w0) - 8, x2: X(w0 + 2) + 8, y1: Y(thr), y2: Y(thr), stroke: GREY, 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }, g);
        if (pi === 0 && key === 'Qwen') el('text', { x: X(w0) - 8, y: Y(thr) + 13, class: 'lbl-t', fill: INK2, 'font-size': 9.5 }, g, '85% of window ' + w0);
        const pts = p.U.map((u, k) => [w0 + k, u]);
        // connectors: solid between consecutive reported windows, dashed across a gap
        for (let k = 0; k < 2; k++) {
          const a = pts[k], b = pts[k + 1];
          if (a[1] !== null && b[1] !== null) el('line', { x1: X(a[0]), y1: Y(a[1]), x2: X(b[0]), y2: Y(b[1]), stroke: INK, 'stroke-width': 2 }, g);
        }
        if (p.U[1] === null) el('line', { x1: X(pts[0][0]), y1: Y(pts[0][1]), x2: X(pts[2][0]), y2: Y(pts[2][1]), stroke: INK, 'stroke-width': 1.5, 'stroke-dasharray': '3 4' }, g);
        pts.forEach(([w, u], k) => {
          if (u === null) return;
          const c = el('circle', { cx: X(w), cy: Y(u), r: 5, fill: pi === 2 ? '#fff' : INK, stroke: INK, 'stroke-width': 2 }, g);
          const hit = el('circle', { cx: X(w), cy: Y(u), r: 12, fill: 'transparent' }, g);
          hit.addEventListener('mousemove', ev => {
            const ret = (u / p.U[0] * 100).toFixed(2);
            t.innerHTML = '<div class="h">' + label + ' · window ' + w + '</div><div class="r"><span>U<sub>w</sub></span><b>' + u + '</b></div>' + (k ? '<div class="r"><span>of window ' + w0 + '</span><b>' + ret + '%</b></div>' : '') +
              (k === 2 ? '<div class="r"><span>Δa</span><b>+' + p.da.toFixed(2) + ' pp</b></div><div class="r"><span>action</span><b>' + p.action + ' · ' + p.status.toLowerCase() + '</b></div>' : '') +
              (key === 'Qwen' && pi === 1 && k === 2 ? '<div class="small muted" style="margin-top:4px;max-width:230px">Counting only correctness variation gives 166 → 155 (93.4%), which would not fire: this refresh relied on format and stopping-reward variation.</div>' : '');
            t.style.opacity = 1; place(t, host, ev); c.setAttribute('r', 6.5);
          });
          hit.addEventListener('mouseleave', () => { t.style.opacity = 0; c.setAttribute('r', 5); });
        });
        // end-of-pool decision pill
        const fire = p.action === 'refresh', ret = (p.U[2] / p.U[0] * 100).toFixed(2);
        const px = (x0 + x1) / 2, py = H - m.b + 44;
        const pill = el('g', { class: 'saw-pill' }, g);
        const txt = (fire ? '↻ refresh ' : 'keep ') + ret + '%';
        const pw = txt.length * 6.2 + 14;
        el('rect', { x: px - pw / 2, y: py - 12, width: pw, height: 18, rx: 9, fill: fire ? '#fff0e6' : '#e7f0f7' }, pill);
        el('text', { x: px, y: py + 1, 'text-anchor': 'middle', class: 'lbl-t', 'font-weight': 800, fill: fire ? '#b34700' : NAVY, 'font-size': 10.5 }, pill, txt);
        el('text', { x: px, y: py + 17, 'text-anchor': 'middle', class: 'lbl-t', fill: INK2, 'font-size': 9.5 }, pill, 'Δa +' + p.da.toFixed(2) + ' pp');
        anims.push(g);
      });
    });
    onView(host, () => anims.forEach((g, i) => setTimeout(() => { g.style.transition = 'opacity .5s'; g.style.opacity = 1; }, reduce ? 0 : 350 * (i % 3) + 120 * Math.floor(i / 3))), 0.3);
  })();

  /* ---------- 4.5 benchmark sparklines ---------- */
  const ST = D.stQwen;
  let spModel = 'qwen';
  function sparks() {
    const host = $('spark-grid');
    if (!host) return;
    const B = D.bench[spModel];
    $('sp-sub').innerHTML = spModel === 'qwen'
      ? 'Qwen3-VL-8B. Points: S<sub>0</sub>, S<sub>t</sub>, then nine continuation windows; bands are the three pools, the orange dot is S<sub>32</sub>. Change shown vs S<sub>t</sub> (appendix table).'
      : 'MiMo-VL-7B continues directly from its public S<sub>0</sub> (no S<sub>t</sub>). Change shown vs S<sub>0</sub>, computed from the table values.';
    host.innerHTML = '';
    B.rows.forEach(([name, n, v]) => {
      const seq = spModel === 'qwen' ? [['S0', v[0]], ['St', ST[name][0]]].concat(D.cols.slice(1).map((c, i) => [c, v[i + 1]])) : D.cols.map((c, i) => [c, v[i]]);
      const d = spModel === 'qwen' ? ST[name][1] : +(v[8] - v[0]).toFixed(2);
      const W = 180, H = 56, pad = 5;
      const ys = seq.map(s => s[1]), lo = Math.min(...ys) - 0.6, hi = Math.max(...ys) + 0.6;
      const X = i => pad + i / (seq.length - 1) * (W - 2 * pad), Y = y => pad + (1 - (y - lo) / (hi - lo)) * (H - 2 * pad);
      const card = document.createElement('div');
      card.className = 'spk rv';
      card.innerHTML = '<div class="spk-h"><span>' + name + '</span><b class="' + (d >= 0 ? 'up' : 'dn') + '">' + sgn(d) + '</b></div>';
      const svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'spk-svg', role: 'img', 'aria-label': name + ' trajectory' }, null);
      const off = spModel === 'qwen' ? 2 : 1;
      [0, 1, 2].forEach(p => {
        const a = X(off + 3 * p) - 4, b = X(off + 3 * p + 2) + 4;
        el('rect', { x: a, y: 0, width: b - a, height: H, fill: p % 2 ? '#f3f2ee' : '#f8f7f3' }, svg);
      });
      el('polyline', { points: seq.map((s, i) => X(i).toFixed(1) + ',' + Y(s[1]).toFixed(1)).join(' '), fill: 'none', stroke: '#8f8e88', 'stroke-width': 1.6, 'stroke-linejoin': 'round' }, svg);
      seq.forEach((s, i) => {
        const end = s[0] === 'S32', st = s[0] === 'St';
        const c = el('circle', { cx: X(i), cy: Y(s[1]), r: end ? 4 : st ? 3 : 2, fill: end ? ORANGE : st ? '#fff' : '#8f8e88', stroke: end ? '#fff' : st ? '#52514e' : 'none', 'stroke-width': end ? 1.5 : 1.2 }, svg);
        el('title', {}, c, (s[0] === 'St' ? 'S_t' : s[0]) + ': ' + s[1].toFixed(2));
      });
      card.appendChild(svg);
      const foot = document.createElement('div');
      foot.className = 'spk-f';
      foot.innerHTML = (spModel === 'qwen' ? 'S<sub>t</sub> ' + ST[name][0].toFixed(2) : 'S<sub>0</sub> ' + v[0].toFixed(2)) + ' → S<sub>32</sub> <b>' + v[8].toFixed(2) + '</b>' + (name === 'MathVision' && spModel === 'qwen' ? '<br><span class="muted">8.36% truncation vs 18–22% for the other refreshing arms</span>' : '');
      card.appendChild(foot);
      host.appendChild(card);
      requestAnimationFrame(() => card.classList.add('in'));
    });
  }
  window.ARSI_seg('bm-model', m => { spModel = m; sparks(); });
  sparks();

  /* ---------- 4.5b visual-type dumbbells ---------- */
  (function dumbbells() {
    const host = $('vt-dumb');
    if (!host) return;
    const V = D.vtypes;
    const rowsBy = Object.fromEntries(V.rows.map(r => [r[0], r[1]]));
    const others = ['Frontier', 'Periodic', 'Continuous'];
    host.innerHTML = '';
    V.head.forEach(([type, nItems], ti) => {
      const card = document.createElement('div');
      card.className = 'dmb';
      card.innerHTML = '<div class="dmb-h"><b>' + type + '</b><span>' + nItems.toLocaleString('en-US') + ' items</span></div>';
      [['Accuracy', 0, true], ['Truncation', 1, false]].forEach(([lab, off, higher]) => {
        const s = rowsBy['S_t (start)'][ti * 2 + off], a = rowsBy['A-RSI'][ti * 2 + off];
        const os = others.map(o => [o, rowsBy[o][ti * 2 + off]]);
        const all = [s, a].concat(os.map(o => o[1]));
        const lo = higher ? Math.floor(Math.min(...all) - 1) : 0, hi = Math.ceil(Math.max(...all) + 1);
        const W = 260, H = 40, L = 8, Rr = 8;
        const X = v => L + (v - lo) / (hi - lo) * (W - L - Rr);
        const svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'dmb-svg', role: 'img', 'aria-label': type + ' ' + lab.toLowerCase() }, null);
        el('line', { x1: L, x2: W - Rr, y1: 22, y2: 22, stroke: '#eceae5', 'stroke-width': 2 }, svg);
        os.forEach(([o, v]) => { const tk = el('line', { x1: X(v), x2: X(v), y1: 15, y2: 29, stroke: '#b9b7b0', 'stroke-width': 2 }, svg); el('title', {}, tk, o + ': ' + v.toFixed(2)); });
        el('line', { class: 'dmb-bar', x1: X(s), x2: X(s), y1: 22, y2: 22, stroke: ORANGE, 'stroke-width': 3, 'data-x2': X(a) }, svg);
        const cs = el('circle', { cx: X(s), cy: 22, r: 5, fill: '#fff', stroke: INK2, 'stroke-width': 2 }, svg); el('title', {}, cs, 'S_t: ' + s.toFixed(2));
        const ca = el('circle', { class: 'dmb-dot', cx: X(s), cy: 22, r: 6, fill: ORANGE, 'data-x': X(a) }, svg); el('title', {}, ca, 'A-RSI: ' + a.toFixed(2));
        const d = a - s, good = higher ? d > 0 : d < 0;
        const row = document.createElement('div');
        row.className = 'dmb-row';
        row.innerHTML = '<div class="dmb-l"><span>' + lab + (higher ? '' : ' (lower is better)') + '</span><b class="' + (good ? 'up' : 'dn') + '">' + s.toFixed(2) + ' → ' + a.toFixed(2) + '</b></div>';
        row.appendChild(svg);
        card.appendChild(row);
      });
      host.appendChild(card);
    });
    onView(host, () => host.querySelectorAll('svg').forEach(svg => {
      const dot = svg.querySelector('.dmb-dot'), bar = svg.querySelector('.dmb-bar');
      const go = () => { dot.setAttribute('cx', dot.dataset.x); bar.setAttribute('x2', bar.dataset.x2); };
      if (reduce) go(); else { dot.style.transition = bar.style.transition = 'all .7s cubic-bezier(.2,.7,.2,1)'; requestAnimationFrame(go); }
    }), 0.25);
  })();

  /* ---------- 5.1 length-budget toggle (appendix length-budget table) ---------- */
  (function budget() {
    const host = $('budget-viz');
    if (!host) return;
    // gain over base at the same limit; truncation rates (%)
    const rows = [
      { n: 'A-RSI, S32', g: [4.08, 3.25], tr: [6.82, 3.44], us: true },
      { n: 'MM-Zero v5 (released)', g: [4.18, 2.45], tr: [2.84, 0.87] }
    ];
    const base = { tr: [20.10, 14.42] };
    let k = 0;
    host.innerHTML = '<div class="viz-head"><div><div class="viz-title">Gain over the base model at the same output limit</div><div class="viz-sub">Matched-budget readout of fixed weights; not comparable with the Macro11 table.</div></div><div class="seg" id="bg-seg"><button class="on" data-k="0" type="button">4,096 tokens</button><button data-k="1" type="button">8,192 tokens</button></div></div><div class="bg-rows"></div>' +
      '<div class="bg-base"><b>Untrained base model:</b> <span id="bg-base">+2.00 from moving 4,096 → 8,192 tokens alone, no training.</span></div>' +
      '<p class="small muted" style="margin:8px 2px 0">MM-Zero\'s gain is not spurious: at 8,192 the same weights are still +2.45 above the base. A-RSI exceeds it by +0.79 (58.16 vs 57.37), which is within the estimated training noise.</p>';
    const box = host.querySelector('.bg-rows');
    function draw() {
      const max = 4.4;
      box.innerHTML = rows.map(r => '<div class="bg-row' + (r.us ? ' us' : '') + '"><div class="bg-n">' + r.n + '</div><div class="bg-track"><i style="width:' + (r.g[k] / max * 100).toFixed(1) + '%"></i><span class="bg-ghost" style="left:' + (r.g[0] / max * 100).toFixed(1) + '%"></span></div><div class="bg-v">+' + r.g[k].toFixed(2) + (k ? ' <span class="muted">(' + Math.round(r.g[1] / r.g[0] * 100) + '% kept)</span>' : '') + '</div><div class="bg-t">truncation ' + r.tr[k].toFixed(2) + '%</div></div>').join('') +
        '<div class="bg-row base"><div class="bg-n">Base model</div><div class="bg-track"></div><div class="bg-v">—</div><div class="bg-t">truncation ' + base.tr[k].toFixed(2) + '%</div></div>';
      host.querySelectorAll('#bg-seg button').forEach(b => b.classList.toggle('on', +b.dataset.k === k));
    }
    host.querySelector('#bg-seg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { k = +b.dataset.k; draw(); } });
    draw();
    onView(host, () => { if (!reduce) setTimeout(() => { k = 1; draw(); }, 1200); }, 0.4);
  })();

  /* ---------- 6.1 full-suite gain split (appendix "Full-suite output decomposition") ---------- */
  (function gainSplit() {
    const host = $('gain-split');
    if (!host) return;
    const DATA = {
      primary: [
        { n: 'Qwen · S<sub>t</sub> → S<sub>32</sub>', tot: 3.27, both: -0.71, other: 3.98 },
        { n: 'Qwen · S<sub>0</sub> → S<sub>32</sub> <span class="muted">(includes initialization)</span>', tot: 4.40, both: -0.75, other: 5.15, chip: 'ChartQA alone: 127 wrong→right vs 51 right→wrong among both-finished, +3.04' },
        { n: 'MiMo · S<sub>0</sub> → S<sub>32</sub>', tot: 1.63, both: 0.99, other: 0.64, chip: '1,460 wrong→right vs 1,235 right→wrong among both-finished' }
      ],
      repeat: [
        { n: 'Qwen · S<sub>t</sub> → S<sub>32</sub>', na: true },
        { n: 'Qwen · S<sub>0</sub> → S<sub>32</sub> <span class="muted">(includes initialization)</span>', tot: 4.85, both: -0.31, other: 5.16, chip: 'ChartQA alone: 131 vs 56, +3.00' },
        { n: 'MiMo · S<sub>0</sub> → S<sub>32</sub>', tot: 2.21, both: 1.69, other: 0.52, chip: '1,483 wrong→right vs 1,169 right→wrong among both-finished' }
      ]
    };
    let mode = 'primary';
    const lo = -1.2, hi = 5.4, P = v => ((v - lo) / (hi - lo) * 100);
    function draw(animate) {
      const rows = DATA[mode];
      host.innerHTML = '<div class="gs-legend"><span><i style="background:' + NAVY + '"></i>both responses finished</span><span><i style="background:#d9a441"></i>other completion strata (incl. answers that now finish)</span><span><i class="tick"></i>total gain</span></div>' +
        '<div class="gs-rows">' + rows.map(r => {
          if (r.na) return '<div class="gs-row na"><div class="gs-n">' + r.n + '</div><div class="gs-track"><span class="gs-zero" style="left:' + P(0) + '%"></span><em>no repeat decoding reported</em></div><div class="gs-v">—</div></div>';
          const segs = [];
          if (r.both < 0) {
            segs.push('<i class="b" style="left:' + P(r.both) + '%;width:' + (P(0) - P(r.both)) + '%;transform-origin:right"></i>');
            segs.push('<i class="o" style="left:' + P(0) + '%;width:' + (P(r.other) - P(0)) + '%"></i>');
          } else {
            segs.push('<i class="b" style="left:' + P(0) + '%;width:' + (P(r.both) - P(0)) + '%"></i>');
            segs.push('<i class="o" style="left:' + P(r.both) + '%;width:' + (P(r.both + r.other) - P(r.both)) + '%"></i>');
          }
          return '<div class="gs-row"><div class="gs-n">' + r.n + '</div><div class="gs-track"><span class="gs-zero" style="left:' + P(0) + '%"></span>' + segs.join('') +
            '<span class="gs-tot" style="left:' + P(r.tot) + '%"></span></div><div class="gs-v"><b>' + sgn(r.tot) + '</b> = ' + sgn(r.both) + ' + ' + r.other.toFixed(2) + '</div>' +
            (r.chip ? '<div class="gs-chip">' + r.chip + '</div>' : '') + '</div>';
        }).join('') + '</div>' +
        '<div class="gs-axis"><span style="left:' + P(-1) + '%">−1</span><span style="left:' + P(0) + '%">0</span><span style="left:' + P(1) + '%">+1</span><span style="left:' + P(2) + '%">+2</span><span style="left:' + P(3) + '%">+3</span><span style="left:' + P(4) + '%">+4</span><span style="left:' + P(5) + '%">+5</span></div>' +
        '<div class="gs-facts"><div><b>14.34% → 4.16%</b><span>Qwen truncation, pooled over 22,042 items, S<sub>t</sub> → S<sub>32</sub></span></div><div><b>82.84 → 84.96</b><span>ChartQA accuracy while its truncation stays below 1% (0.60% → 0.56%)</span></div></div>' +
        '<p class="small muted" style="margin:10px 2px 0">Completion strata are post-training outcomes, so this split is descriptive, not a causal fraction of reasoning improvement. Qwen\'s aggregate both-finished contribution is negative in both decodings, while MiMo\'s is positive.</p>';
      if (animate && !reduce) {
        host.querySelectorAll('.gs-track i').forEach(x => x.classList.add('grow0'));
        requestAnimationFrame(() => requestAnimationFrame(() => host.querySelectorAll('.gs-track i').forEach(x => x.classList.remove('grow0'))));
      }
    }
    window.ARSI_seg('gs-dec', m => { mode = m; draw(true); });
    draw(false);
    host.querySelectorAll('.gs-track i').forEach(x => x.classList.add('grow0'));
    onView(host, () => host.querySelectorAll('.gs-track i').forEach(x => x.classList.remove('grow0')), 0.35);
  })();

  /* ---------- 5.3 claims ledger: all eleven rows of the paper's claims table, verbatim ---------- */
  (function claims() {
    const host = $('claims');
    if (!host) return;
    const C = [
      ['A training log alone, with no test set, can tell that a pool is learned out. It lags the benchmark by about one window, fires on the old pool and on two replacement pools, and the half-life of a 400-task pool is three windows.', 'That the detector finds the best refresh time.'],
      ['After the detector fires, random fresh tasks reach 61.05 with 800 new tasks, against 60.64 for replacing every window with 3,200 (4.09 against 0.90 points per thousand tasks).', 'That the +0.40 point estimate establishes a detector-timing advantage.'],
      ['Choosing the replacement by difficulty frontier or by the model\'s rollouts is not better than random (three experiments: −2.63, −0.82, −1.45).', 'That difficulty control or state-based selection improves the benchmark.'],
      ['The old pool is learned out and the plateau is real: No-Refresh scores 58.48 and 58.35 before running out of signal; at window 6 every refreshing arm is 1.39 to 2.05 above No-Refresh.', 'That the pre-registered primary endpoint (Frontier − No-Refresh) holds: No-Refresh halted, so there is no reading.'],
      ['On Macro11, every-window random refresh − original-pool continuation is +1.82 (stable +1.66, LJ +1.87).', 'Any "significant" improvement; every arm was trained once.'],
      ['Difficulty is quantifiable as monotone tiers and learnable in domain (tier 2 of one ladder .58 to .93).', 'Multi-hop training transfers specifically (MathVision −0.30; against a matched control −0.37).'],
      ['State must be measured: self-assessment AUC ≈ 0.50.', 'A stronger model writes better tasks (a fixed writer did no worse).'],
      ['The mean gain over S_t in seven earlier chains is retained (+1.18 → +1.17) when their 4096-truncated answers are regenerated at 16k; differences between selection rules largely shrink.', 'The MLLM-operated difficulty tool adds real capability (−0.13 at 16k).'],
      ['Part of MM-Zero v5\'s headline gain is termination: its gain over base falls from +4.18 to +2.45 with the limit, and the untrained base gains +2.00.', 'That MM-Zero\'s gain is spurious or that A-RSI significantly exceeds it (+0.79, within noise).'],
      ['On the same eleven-benchmark outputs, format-corrected scoring preserves a gain of +3.27 versus +3.33 with original answer matching; ChartQA improves +2.12 with truncation below 1%; all eleven benchmarks and all four retained visual-type subsets improve.', 'Open-ended recursive self-improvement or unbounded gain (trained to window 8; fixed-pool continuation to window 12).'],
      ['On MiMo-VL the detector fires at window 3, as on Qwen, and random refresh exceeds original-pool continuation by +0.70 at window 8.', 'That the small MiMo endpoint margins (+0.02 over Continuous and +0.18 over Periodic) establish a timing advantage.']
    ];
    host.innerHTML = '<div class="claim head"><div class="y">✓ Supported</div><div class="n">✗ Not supported</div></div>' +
      C.map(c => '<div class="claim"><div class="y">' + c[0].replace('S_t', 'S<sub>t</sub>') + '</div><div class="n">' + c[1] + '</div></div>').join('');
  })();
})();
