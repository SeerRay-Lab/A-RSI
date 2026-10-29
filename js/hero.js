/* Hero: replays the Qwen main trajectory window by window with the paper's logged values. */
(function () {
  'use strict';
  const D = window.ARSI;
  const $ = id => document.getElementById(id);
  const grid = $('lp-grid'), ring = $('lp-ring'), tl = $('lp-tl');
  const CIRC = 326.7;
  const steps = D.hero;
  const poolNames = ['Old pool · 500 tasks', 'Replacement 1 · 400 fresh tasks', 'Replacement 2 · 400 fresh tasks'];

  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  function fillPool(kind) {
    grid.innerHTML = '';
    let cells = [];
    if (kind === 'old') cells = Array(500).fill('old');
    else {
      for (const [f, k] of Object.entries(D.quota)) for (let i = 0; i < k; i++) cells.push(f);
      for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
    }
    const frag = document.createDocumentFragment();
    cells.forEach((c, i) => {
      const el = document.createElement('i');
      el.className = c + (kind === 'old' ? '' : ' out');
      frag.appendChild(el);
      if (kind !== 'old') setTimeout(() => el.classList.remove('out'), 6 + i * 2);
    });
    grid.appendChild(frag);
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
  function setGauge(dec) {
    if (!dec) {
      $('lp-ret').textContent = '—'; $('lp-acc').textContent = '—';
      $('lp-retbar').style.width = '0'; $('lp-accbar').style.width = '0';
      return;
    }
    $('lp-ret').textContent = dec.ret.toFixed(1) + '%';
    $('lp-acc').textContent = '+' + dec.da.toFixed(2) + ' pp';
    const rb = $('lp-retbar'), ab = $('lp-accbar');
    rb.style.width = dec.ret + '%';
    rb.style.background = dec.ret <= 85 ? 'var(--accent)' : '#4c5564';
    ab.style.width = Math.min(100, dec.da / 20 * 100) + '%';
    ab.style.background = dec.da >= 10 ? 'var(--accent)' : '#4c5564';
  }
  function say(html, fire) { const d = $('lp-dec'); d.innerHTML = html; d.classList.toggle('fire', !!fire); }

  let fresh = 0, idx = 0, playing = true, timer = null, visible = true, batch = 0, pendingRefresh = false;

  // swap in the next prepared pool; idempotent per detector firing
  function doRefresh() {
    if (!pendingRefresh) return;
    pendingRefresh = false;
    fresh += 400;
    fillPool('fresh');
    $('lp-pool').textContent = poolNames[steps[idx + 1].pool];
    $('lp-fresh').innerHTML = 'Fresh tasks introduced: <b style="width:auto;height:auto;background:none;color:#fff">' + fresh + '</b>';
    setRing(0);
  }
  // resume after pause / scrolling back: finish a refresh that was cut short first
  function resume(delay) {
    clearTimeout(timer);
    if (pendingRefresh) { doRefresh(); timer = setTimeout(tick, 1200); }
    else timer = setTimeout(tick, delay);
  }
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function show(i) {
    const s = steps[i];
    $('lp-win').innerHTML = s.lab === 'S_t' ? 'S<sub>t</sub>' : 'S<sub>' + s.lab.slice(1) + '</sub>';
    $('lp-step').textContent = s.lab === 'S_t' ? 'start' : 'pool ' + (s.pool + 1) + ' · win ' + s.win;
    $('lp-score').textContent = s.score.toFixed(2);
    $('lp-pool').textContent = poolNames[s.pool];
    $('lp-fresh').innerHTML = 'Fresh tasks introduced: <b style="width:auto;height:auto;background:none;color:#fff">' + fresh + '</b>';
    setTicks(i);
    if (s.lab === 'S_t') { say('<b>S<sub>t</sub> = 57.77.</b> Qwen3-VL-8B after 100 GRPO updates on the old pool. Every policy starts here.'); setGauge(null); return; }
    if (s.dec) {
      setGauge(s.dec);
      say('<b>' + (s.dec.fire ? 'Refresh.' : 'Keep.') + '</b> U fell ' + s.dec.U0 + ' → ' + s.dec.U1 + ' (' + s.dec.ret.toFixed(1) + '% ≤ 85%), accuracy +' + s.dec.da.toFixed(2) + ' pp. Swap in 400 unused tasks; the weights carry on.', s.dec.fire);
      return;
    }
    setGauge(null);
    if (s.end) { say('<b>Endpoint S<sub>32</sub> = 61.05.</b> Eight continuation windows, 800 fresh tasks, no test score ever read by the controller.', true); return; }
    say((s.U ? 'U<sub>w</sub> = <b>' + s.U + '</b> distinct prompts still carry a nonzero advantage. ' : 'Logging rewards and advantages. ') + 'Window ' + s.win + ' of at least 3 on this pool, too early to decide.');
  }

  // one window = 50 generation batches of 8 prompt groups, 100 updates
  function tick() {
    if (!playing || !visible) return;
    const next = idx + 1;
    if (next >= steps.length) { timer = setTimeout(restart, 5200); return; }
    batch++;
    setRing(batch / 50);
    const cells = grid.children;
    for (let k = 0; k < 8 && cells.length; k++) {
      const c = cells[Math.floor(rnd() * cells.length)];
      c.style.background = '#ffffff';
      setTimeout(() => (c.style.background = ''), 260);
    }
    if (batch < 50) { timer = setTimeout(tick, 52); return; }
    batch = 0; idx = next; show(idx);
    const s = steps[idx];
    if (s.dec && s.dec.fire) {
      pendingRefresh = true;
      timer = setTimeout(() => { doRefresh(); timer = setTimeout(tick, 1500); }, 2600);
    } else {
      timer = setTimeout(() => { setRing(0); tick(); }, s.end ? 0 : 900);
    }
  }

  function restart() {
    clearTimeout(timer); fresh = 0; idx = 0; batch = 0; seed = 7; pendingRefresh = false;
    fillPool('old'); setRing(0); show(0);
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

  fillPool('old'); show(0);
  if (reduce) { playing = false; $('lp-play').textContent = 'Play'; }
  else timer = setTimeout(tick, 1600);
})();
