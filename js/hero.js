/* Hero: replays the Qwen main trajectory window by window with the paper's logged values.
   Lit cells = U_w (distinct logged prompts with mixed rewards). The count is from the paper;
   which cells are lit is illustrative. Windows whose U the paper does not report are never interpolated. */
(function () {
  'use strict';
  const D = window.ARSI;
  const $ = id => document.getElementById(id);
  const grid = $('lp-grid'), ring = $('lp-ring'), tl = $('lp-tl'), spark = $('lp-spark');
  const NS = 'http://www.w3.org/2000/svg';
  const CIRC = 326.7;
  const steps = D.hero;
  const poolNames = ['Pool 1 · old · 500 tasks', 'Pool 2 · fresh · 400 tasks', 'Pool 3 · fresh · 400 tasks'];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  let cells = [], perm = [], lit = 0;
  function fillPool(p) {
    grid.innerHTML = '';
    const mix = p === 0 ? D.oldPool : D.quota;
    let fam = [];
    for (const [f, k] of Object.entries(mix)) for (let i = 0; i < k; i++) fam.push(f);
    fam = shuffle(fam);
    const frag = document.createDocumentFragment();
    cells = fam.map((f, i) => {
      const e = document.createElement('i');
      e.className = f + ' unlogged' + (p ? ' out' : '');
      frag.appendChild(e);
      if (p) setTimeout(() => e.classList.remove('out'), reduce ? 0 : 6 + i * 2);
      return e;
    });
    grid.appendChild(frag);
    perm = shuffle([...cells.keys()]);
    lit = -1;
  }
  function setLit(u) {
    cells.forEach(c => c.classList.remove('unlogged'));
    const on = new Set(perm.slice(0, u));
    cells.forEach((c, i) => c.classList.toggle('dim', !on.has(i)));
    lit = u;
  }
  function countTo(target) {
    const node = $('lp-u');
    const from = parseInt(node.textContent, 10);
    if (isNaN(from) || reduce) { node.textContent = target; return; }
    const t0 = performance.now();
    (function f(now) { const k = Math.max(0, Math.min(1, (now - t0) / 500)); node.textContent = Math.round(from + (target - from) * k); if (k < 1) requestAnimationFrame(f); })(t0);
  }

  // sparkline of the current pool's logged U, with the 85% line once window 1 is logged
  function drawSpark(pool, upto) {
    spark.innerHTML = '';
    const W = 220, H = 86, m = { l: 26, r: 12, t: 16, b: 18 };
    const vals = steps.filter((s, i) => i <= upto && s.pool === pool && s.win >= 1);
    const X = w => m.l + 18 + (w - 1) / 2 * (W - m.l - m.r - 18), Y = u => m.t + (1 - (u - 130) / 120) * (H - m.t - m.b);
    const mk = (tag, a, txt) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); if (txt !== undefined) e.textContent = txt; spark.appendChild(e); return e; };
    [1, 2, 3].forEach(w => mk('text', { x: X(w), y: H - 4, 'text-anchor': 'middle', 'font-size': 9, fill: '#6f7886' }, 'w' + w));
    [150, 200, 250].forEach(u => { mk('line', { x1: m.l, x2: W - m.r, y1: Y(u), y2: Y(u), stroke: '#262b33' }); mk('text', { x: m.l - 4, y: Y(u) + 3, 'text-anchor': 'end', 'font-size': 8.5, fill: '#6f7886' }, u); });
    const first = vals.find(s => s.win === 1 && s.U);
    if (first) {
      const thr = 0.85 * first.U;
      mk('line', { x1: m.l, x2: W - m.r, y1: Y(thr), y2: Y(thr), stroke: '#ffb27a', 'stroke-dasharray': '4 3', 'stroke-width': 1.3 });
      mk('text', { x: W - m.r, y: Y(thr) + 11, 'text-anchor': 'end', 'font-size': 9, fill: '#ffb27a' }, '85% of w1 = ' + thr.toFixed(0));
    }
    const pts = vals.filter(s => s.U).map(s => [s.win, s.U]);
    if (pts.length > 1) mk('polyline', { points: pts.map(p => X(p[0]) + ',' + Y(p[1])).join(' '), fill: 'none', stroke: '#c4cad4', 'stroke-width': 1.6, 'stroke-dasharray': pts.length === 2 && pts[1][0] - pts[0][0] > 1 ? '3 4' : '' });
    pts.forEach(p => { mk('circle', { cx: X(p[0]), cy: Y(p[1]), r: 4, fill: first && p[1] <= 0.85 * first.U ? '#ff6900' : '#e9ecf1' }); mk('text', { x: X(p[0]), y: Y(p[1]) - 7, 'text-anchor': 'middle', 'font-size': 9.5, fill: '#fff', 'font-weight': 700 }, p[1]); });
    vals.filter(s => !s.U).forEach(s => mk('text', { x: X(s.win), y: m.t - 5, 'text-anchor': 'middle', 'font-size': 9, fill: '#6f7886' }, 'not reported'));
    if (!vals.length) mk('text', { x: W / 2, y: H / 2, 'text-anchor': 'middle', 'font-size': 10, fill: '#6f7886' }, 'no window logged yet');
  }

  // timeline ticks
  steps.forEach((s, i) => {
    const t = document.createElement('div');
    t.className = 'tick' + (steps[i - 1] && steps[i - 1].dec && steps[i - 1].dec.fire ? ' refresh' : '');
    t.innerHTML = '<b>' + s.lab.replace(/^S(\d)(\d)$/, 'S<sub>$1$2</sub>').replace('S_t', 'S<sub>t</sub>') + '</b>' + s.score.toFixed(2);
    tl.appendChild(t);
  });
  const ticks = [...tl.children];
  function setTicks(i) { ticks.forEach((t, k) => { t.classList.toggle('done', k < i); t.classList.toggle('now', k === i); }); }
  function setRing(frac) { ring.style.strokeDashoffset = (CIRC * (1 - frac)).toFixed(1); }
  function setAcc(dec) {
    const ab = $('lp-accbar');
    if (!dec) { $('lp-acc').textContent = '—'; ab.style.width = '0'; return; }
    $('lp-acc').textContent = '+' + dec.da.toFixed(2) + ' pp';
    ab.style.width = Math.min(100, dec.da / 20 * 100) + '%';
    ab.style.background = dec.da >= 10 ? 'var(--accent)' : '#4c5564';
  }
  function say(html, fire) { const d = $('lp-dec'); d.innerHTML = html; d.classList.toggle('fire', !!fire); }

  let fresh = 0, idx = 0, playing = true, timer = null, visible = true, batch = 0, pendingRefresh = false;

  function show(i) {
    const s = steps[i];
    $('lp-win').innerHTML = s.lab === 'S_t' ? 'S<sub>t</sub>' : 'S<sub>' + s.lab.slice(1) + '</sub>';
    $('lp-step').textContent = s.lab === 'S_t' ? 'start' : 'pool ' + (s.pool + 1) + ' · win ' + s.win;
    $('lp-score').textContent = s.score.toFixed(2);
    $('lp-pool').textContent = poolNames[s.pool];
    setTicks(i);
    drawSpark(s.pool, i);
    if (s.U) { setLit(s.U); countTo(s.U); $('lp-ucap').innerHTML = 'prompts still teaching (U<sub>w</sub>) of ' + cells.length; }
    else if (s.win) { cells.forEach(c => { c.classList.remove('dim'); c.classList.add('unlogged'); }); lit = cells.length; $('lp-u').textContent = '—'; $('lp-ucap').innerHTML = 'U<sub>w</sub> not reported for this window'; }
    else { $('lp-u').textContent = '—'; $('lp-ucap').innerHTML = 'not yet logged'; }
    if (s.lab === 'S_t') { say('<b>S<sub>t</sub> = 57.77.</b> Qwen3-VL-8B after 100 GRPO updates on the old pool. Every policy starts here.'); setAcc(null); return; }
    if (s.dec) {
      setAcc(s.dec);
      say(i === 3
        ? '<b>Refresh.</b> Only ' + s.dec.U1 + ' prompts still get mixed rewards, down from ' + s.dec.U0 + ' two windows ago (' + s.dec.ret.toFixed(1) + '% ≤ 85%). Swap in 400 unused tasks; the weights carry on.'
        : '<b>Refresh.</b> ' + s.dec.U0 + ' → ' + s.dec.U1 + ' (' + s.dec.ret.toFixed(1) + '% ≤ 85%). Like the first refresh it came after three windows, where a three-window schedule would also refresh.', true);
      return;
    }
    setAcc(null);
    if (s.end) { say('<b>Endpoint S<sub>32</sub> = 61.05.</b> Eight continuation windows, 800 fresh tasks, and the controller never read a test score.', true); return; }
    say((s.U ? '<b>' + s.U + '</b> prompts still get mixed rewards. ' : 'U<sub>w</sub> is not reported for this window. ') + 'Window ' + s.win + ' of at least 3 on this pool, too early to decide.');
  }

  function doRefresh() {
    if (!pendingRefresh) return;
    pendingRefresh = false;
    fresh += 400;
    const next = steps[idx + 1];
    fillPool(next.pool);
    $('lp-pool').textContent = poolNames[next.pool];
    $('lp-fresh').innerHTML = 'fresh tasks: <b class="num">' + fresh + '</b>';
    $('lp-u').textContent = '—';
    $('lp-ucap').innerHTML = 'fresh pool, not yet logged';
    drawSpark(next.pool, idx);
    setAcc(null);
    setRing(0);
    say(next.pool === 1
      ? '<b>Fresh pool in.</b> Training accuracy: .57 at the end of the old pool, .35 on the fresh pool. These are tasks the model has not yet mastered.'
      : '<b>Fresh pool in.</b> 400 unused tasks under the same family quotas; the weights carry on and a new optimizer starts.');
  }
  function resume(delay) {
    clearTimeout(timer);
    if (pendingRefresh) { doRefresh(); timer = setTimeout(tick, 1600); }
    else timer = setTimeout(tick, delay);
  }

  // one window = 50 generation batches of 8 prompt groups, 100 updates
  function tick() {
    if (!playing || !visible) return;
    const next = idx + 1;
    if (next >= steps.length) { timer = setTimeout(restart, 6000); return; }
    batch++;
    setRing(batch / 50);
    if (lit > 0) for (let k = 0; k < 4; k++) {
      const c = cells[perm[Math.floor(rnd() * lit)]];
      c.classList.add('hot');
      setTimeout(() => c.classList.remove('hot'), 240);
    }
    if (batch < 50) { timer = setTimeout(tick, 52); return; }
    batch = 0; idx = next; show(idx);
    const s = steps[idx];
    if (s.dec && s.dec.fire) {
      pendingRefresh = true;
      timer = setTimeout(() => { doRefresh(); timer = setTimeout(tick, 2600); }, 3000);
    } else {
      timer = setTimeout(() => { setRing(0); tick(); }, s.end ? 0 : 1300);
    }
  }

  function restart() {
    clearTimeout(timer); fresh = 0; idx = 0; batch = 0; seed = 7; pendingRefresh = false;
    $('lp-fresh').innerHTML = 'fresh tasks: <b class="num">0</b>';
    fillPool(0); setRing(0); show(0);
    timer = setTimeout(tick, 1600);
  }

  $('lp-play').addEventListener('click', () => {
    playing = !playing;
    $('lp-play').textContent = playing ? 'Pause' : 'Play';
    if (playing) resume(0); else clearTimeout(timer);
  });
  $('lp-restart').addEventListener('click', () => { playing = true; $('lp-play').textContent = 'Pause'; restart(); });
  new IntersectionObserver(es => {
    visible = es[0].isIntersecting;
    if (visible && playing) resume(300);
  }).observe($('loop'));

  fillPool(0); show(0);
  if (reduce) { playing = false; $('lp-play').textContent = 'Play'; }
  else timer = setTimeout(tick, 1600);
})();
