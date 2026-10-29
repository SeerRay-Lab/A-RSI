/* Case study: the paper's Section "Case Study" (A1, A2, B1, B2) and Appendix cases C1-C10.
   Text, quotes, answers, and token counts are excerpted from the manuscript. The grey lines in the
   response replay only stand for generated text; the quoted excerpt is the real one.
   Image annotations mark the regions the paper's descriptions of each response refer to. */
(function () {
  'use strict';
  const Q = 'Qwen3-VL-8B', M = 'MiMo-VL-7B';
  const LIMIT = 8192;
  const C = [
    { id: 'A1', kind: 'fin', title: 'An answer, but no ending!', bench: 'PhyX #1314', topic: 'CO bond length', model: Q, img: 'sci_phyx_mc_1314_0', tag: 'truncation → completion',
      task: 'Use the rotational spectrum to determine the CO bond length.', gold: 'C · 1.1×10⁻¹⁰ m', bAns: null, aAns: 'C',
      bh: 'circles back, then gets cut off', b: 'The base response mentions the known CO bond length but repeatedly revisits the calculation. It reaches the limit without a final answer.',
      ah: 'commits and stops', a: 'The trained response invokes the known bond length, selects C, and ends normally.', aq: 'I recall that the bond length of CO is 1.128 Å', ak: '\\(\\boxed{\\mathrm{C}}\\)',
      tok: [8192, 1759], trunc: true,
      what: 'Less unresolved repetition and an explicit final answer. The spectrum is still misread, so this example does not establish better visual reasoning.' },
    { id: 'A2', kind: 'fin', title: 'Stuck, then able to stop!', bench: 'MATH-Vision #703', topic: 'square areas', model: Q, img: 'mathvision_703_0', tag: 'truncation → completion',
      task: 'A rectangle contains seven squares. How many times is the area of the largest square K that of the smallest L?', gold: '25', bAns: null, aAns: '25',
      bh: 'tries one layout after another', b: 'The base response repeatedly reconstructs incompatible layouts. It reaches the limit without a final answer.',
      ah: 'gives an answer within budget', a: 'The trained response still struggles with the layout, but eventually commits.', aq: 'I think I have to accept that the area of K is 25 times the area of L.', ak: '\\(\\boxed{25}\\)',
      tok: [8192, 5140], trunc: true,
      what: 'Completion and a correct final answer. The derivation remains inconsistent; this is an example of finishing, not a verified reasoning improvement.' },
    { id: 'B1', kind: 'cor', title: 'The missing slice matters!', bench: 'MathVerse #2042', topic: 'perimeter', model: Q, img: 'mathverse_2042_0', tag: 'diagram interpretation',
      task: 'Find the perimeter to two decimal places.', gold: '60.68 cm', bAns: '21.59', aAns: '60.68',
      bh: 'measures the missing piece', b: 'The base response treats the labeled 40° as the angle of the required sector. It finishes with \\(\\boxed{21.59}\\), the perimeter of the small sector.',
      ah: 'identifies the remaining shape', a: 'The trained response uses the 320° arc and both radii.', aq: 'it is a circle with a sector of 40 degrees removed.', ak: '\\[P=2(8)+\\tfrac{320}{360}\\,2\\pi(8)\\approx\\boxed{60.68}\\]',
      tok: [1634, 374],
      ann: { b: [[33, 12, 26, 41, 'the 40° gap']], a: [[10, 3, 49, 91, 'the remaining 320° shape']] },
      what: 'The interpretation of the diagram is corrected, followed by a consistent calculation. Both responses finish normally, so avoiding truncation cannot explain this item\'s score change.' },
    { id: 'B2', kind: 'cor', title: 'Look at the bottom!', bench: 'CharXiv #494', topic: 'spatial color reading', model: Q, img: 'sci_charxiv_494_0', tag: 'where colors appear',
      task: 'In the parallel column, which W subscript has the brighter sphere at its bottom center?', gold: '1', bAns: '2', aAns: '1',
      bh: 'reverses the color gradient', b: 'The base response describes the bottom of \\(W_2\\) as bright yellow and finishes with \\(\\boxed{2}\\).',
      ah: 'reads color at the right position', a: 'The trained response correctly locates the dark region in \\(W_2\\); the orange bottom of \\(W_1\\) is brighter.', aq: 'The bottom center of the sphere is dark purple', ak: '\\(\\boxed{1}\\)',
      tok: [1403, 187],
      ann: { b: [[69, 81, 17, 9, 'W₂ bottom read as “bright yellow”']], a: [[69, 31, 17, 9, 'W₁ bottom: orange'], [69, 81, 17, 9, 'W₂ bottom: dark purple']] },
      what: 'The visual description and answer both become correct. Both versions finish normally; the correction concerns where the colors appear in the image.' },
    { id: 'C1', kind: 'cor', title: 'Include both relevant groups!', bench: 'ChartQA #627', model: Q, img: 'ChartQA_627_0', tag: 'category aggregation',
      task: 'What percentage would spend time in Poland?', gold: '73', bAns: 'only 66%', aAns: '73',
      b: 'The base response counts only the 66 percent who choose Poland exclusively.', bq: 'The category "Only in Poland" directly answers the question',
      a: 'The later response also includes the 7 percent who choose both Poland and abroad.', aq: 'So, I add the two relevant percentages: 66% + 7% = 73%.', ak: '\\(66+7=\\boxed{73}\\)',
      tok: [118, 149],
      ann: { b: [[73, 61, 19, 8, 'only this group']], a: [[73, 61, 19, 8, '66%'], [8, 15, 23, 8, '+ 7%']] },
      what: 'The labels are read correctly in both responses; the correction is which categories belong in the requested total.' },
    { id: 'C2', kind: 'cor', title: 'A branch is not one resistor!', bench: 'SCEMQA-MC #652', model: Q, img: 'sci_scemqa_mc_652_0', tag: 'component-level calculation',
      task: 'Find the voltage across the 50 Ω resistor.', gold: 'C · 3.0 V', bAns: 'full 9 V', aAns: '3 V',
      b: 'The base identifies the series branch but incorrectly assigns its full 9 V to the 50-ohm component.', bq: 'both are equal to the battery voltage.',
      a: 'The later response distinguishes branch voltage from component voltage and applies the divider rule.', aq: 'this voltage is divided between the two resistors according to their resistance values.', ak: '\\(V_{50}=9\\,\\tfrac{50}{50+100}=\\boxed{3\\,\\mathrm{V}}\\)',
      tok: [247, 349], what: 'The circuit interpretation is retained while the component-level calculation is repaired.' },
    { id: 'C3', kind: 'cor', title: 'Read the hits, then solve!', bench: 'MATH-Vision #585', model: Q, img: 'mathvision_585_0', tag: 'visual grounding, then arithmetic',
      task: 'Three darts score 12, then 15 points. What is the third score?', gold: '21', bAns: '12', aAns: '21',
      b: 'The base reverses the first target\'s hit locations, assigns 4 points to the inner field, and answers 12.', bq: 'In the first shot, 3 darts hit the inner blue circle',
      a: 'The later response correctly distinguishes the outer and inner hits and solves for their separate scores.', aq: 'In the first scenario, all three darts hit the outer ring', ak: '\\(3x=12,\\ 2x+y=15\\ \\Rightarrow\\ 3y=\\boxed{21}\\)',
      tok: [1350, 234],
      ann: { b: [[14, 43, 13, 24, 'read as inner hits']], a: [[10, 31, 20, 14, 'tips land in the outer ring']] },
      what: 'Correct visual grounding makes the same simple algebra produce the right answer.' },
    { id: 'C4', kind: 'cor', title: 'Count the shaded pieces!', bench: 'MATH-Vision #2555', model: Q, img: 'mathvision_2555_0', tag: 'visual grounding, then arithmetic',
      task: 'Find the shaded area of a right triangle with legs 8 and 16 congruent pieces.', gold: '20', bAns: '24', aAns: '20',
      b: 'The base eventually assumes four white pieces and twelve shaded pieces, giving 24.', bq: 'So the shaded area is 24.',
      a: 'The later response counts ten shaded pieces and uses the area of one piece.', aq: 'By examining the image, we can see that there are 10 shaded small triangles.', ak: '\\(A=\\tfrac{\\frac12(8)(8)}{16}\\,(10)=\\boxed{20}\\)',
      tok: [4555, 241], what: 'The correction concerns the visual count; the total-area formula was already available to the base.' },
    { id: 'C5', kind: 'cor', title: 'Use the supplementary angle!', bench: 'MathVerse #226', model: Q, img: 'mathverse_226_0', tag: 'interpreting the marked geometry',
      task: 'With AB ∥ CD and angle A = 70°, find angle 1.', gold: 'D · 110°', bAns: '70°', aAns: '110°',
      b: 'The base treats the marked angle as corresponding to the given angle and selects 70 degrees.', bq: 'so it\'s a corresponding angle.',
      a: 'The later response identifies the adjacent linear pair at the lower parallel line.', aq: 'Angle 1 and this 70° angle are on a straight line, so they are supplementary.', ak: '\\(\\angle 1=180^\\circ-70^\\circ=\\boxed{110^\\circ}\\)',
      tok: [234, 353], what: 'The marked region is interpreted correctly before applying the parallel-line relation.' },
    { id: 'C6', kind: 'cor', title: 'A loop is half a wavelength!', bench: 'PhyX #1353', model: M, img: 'sci_phyx_mc_1353_0', tag: 'interpreting the marked geometry',
      task: 'A standing wave spans 60 cm and oscillates at 100 Hz. Find its speed.', gold: 'D · 30 m/s', bAns: '15 m/s', aAns: '30 m/s',
      b: 'The base counts the four standing-wave loops as four full wavelengths and obtains 15 m/s.', bq: 'there are 4 full wavelengths in this distance.',
      a: 'After revising its count, the later response ends with the diagram-consistent two-wavelength explanation.', aq: 'there are 2 full wavelengths.', ak: '\\(\\lambda=\\tfrac{0.60}{2}=0.30\\,\\mathrm{m},\\ v=100\\lambda=\\boxed{30\\,\\mathrm{m/s}}\\)',
      tok: [927, 1185], what: 'The final explanation repairs the wavelength count. Its intermediate reasoning still contains revisions.' },
    { id: 'C7', kind: 'cor', title: 'Compare the full object length!', bench: 'VisNumBench #1547', model: M, img: 'visnumbench_1547_0', tag: 'visual comparison',
      task: 'Which object, A–D from left to right, has the greatest length?', gold: 'd · scissors', bAns: 'A · mouse', aAns: 'D · scissors',
      b: 'The base selects the mouse even though the scissors extend farther along their long axis.', bq: 'The mouse (A) seems to be the longest among them.',
      a: 'The later response compares the full object extents and selects the rightmost scissors.', aq: 'Scissors are longer than the others.',
      tok: [127, 207],
      ann: { b: [[9, 21, 18, 49, 'A · mouse']], a: [[73, 15, 27, 58, 'D · scissors']] },
      what: 'The visual comparison changes from A to D; both outputs already submit an explicit answer.' },
    { id: 'C8', kind: 'cor', title: 'Locate the quietest marking!', bench: 'MMMU-Pro (4 options) #1008', model: M, img: 'mmmu_pro_4_options_1008_0', tag: 'symbol localization',
      task: 'Is bar 8 the quietest bar in the displayed music?', gold: 'A · True', bAns: 'False', aAns: 'True',
      b: 'The base recognizes pianissimo but places the marking outside bar 8 and answers False.', bq: 'So bar 8 is not the quietest.',
      a: 'The later response associates the displayed pianissimo marking with bar 8 and answers True.', aq: 'Bar 8 features the pp marking.',
      tok: [590, 299],
      ann: { a: [[83, 55, 15, 32, 'bar 8 · pp']] },
      what: 'The correction links a known musical symbol to its location. Here pp is the softest marking shown, not a universal minimum dynamic.' },
    { id: 'C9', kind: 'cor', title: 'Account for all three effects!', bench: 'MMMU #442', model: M, img: 'MMMU_442_0', tag: 'system scope',
      task: 'What is the total capacity of the forward-feed evaporator?', gold: 'A · E₁+E₂+E₃', bAns: 'C · E₁', aAns: 'E₁+E₂+E₃',
      b: 'The base focuses on the first feed stage and chooses its evaporation term alone.', bq: 'Option C is E1. So the answer should be C.',
      a: 'The later final explanation treats capacity as total evaporation across the three-effect system.', aq: 'each effect contributes to removing water from the feed.', ak: '\\(E_{\\mathrm{total}}=\\boxed{E_1+E_2+E_3}\\)',
      tok: [252, 825], what: 'The system boundary changes from one effect to the full apparatus. The base\'s raw text selects C, so this is not solely a formatting repair.' },
    { id: 'C10', kind: 'cor', title: 'Read the value, not the footer!', bench: 'ChartQA #714', model: Q, img: 'ChartQA_714_0', tag: 'answer acceptance',
      task: 'How many female murder offenders were there in 2019?', gold: '1,408', bAns: 'no answer', aAns: '1,408',
      b: 'The base mistakes the 2021 copyright footer for the data year and withholds an answer despite mentioning 1,408.', bq: 'it is not possible to determine the number of female murder offenders in 2019 from this image.',
      a: 'The later response answers from the Female label. The image itself does not separately print the data year.', aq: 'the value associated with the "Female" category is 1,408.',
      tok: [108, 132],
      ann: { b: [[82, 86, 16, 7, '“2021” footer']], a: [[7, 59, 15, 7, 'Female 1,408']] },
      what: 'This is a correction of answer acceptance and date interpretation, rather than newly learned arithmetic.' }
  ];

  const $ = id => document.getElementById(id);
  const wall = $('case-wall'), view = $('case-view');
  let cur = 0, filter = 'all', raf = null;
  const fmt = n => n.toLocaleString('en-US');

  function chip(ok, txt) { return '<span class="vchip ' + (ok ? 'y' : 'n') + '">' + (ok ? '✓ ' : '✗ ') + txt + '</span>'; }

  function renderWall() {
    wall.innerHTML = C.map((c, i) => {
      const hide = filter === 'fin' ? c.kind !== 'fin' : filter === 'cor' ? c.kind !== 'cor' : filter === 'qwen' ? c.model !== Q : filter === 'mimo' ? c.model !== M : false;
      return '<button type="button" class="cw' + (i === cur ? ' on' : '') + (hide ? ' hide' : '') + ' ' + c.kind + '" data-i="' + i + '" aria-label="' + c.id + ': ' + c.title + '">' +
        '<span class="cw-img"><img src="assets/cases/' + c.img + '.webp" alt="" loading="lazy"></span>' +
        '<span class="cw-b"><span class="cw-k">' + c.id + ' · ' + (c.kind === 'fin' ? 'finishing' : 'correcting') + '</span>' +
        '<span class="cw-t">' + c.title + '</span>' +
        '<span class="cw-m">' + c.bench + ' · ' + c.model + '</span>' +
        '<span class="cw-v">' + (c.bAns === null ? '<span class="vchip n">✂ cut off</span>' : chip(false, c.bAns)) + '<span class="cw-arrow">→</span>' + chip(true, c.aAns) + '</span></span></button>';
    }).join('');
  }

  function boxes(c, which) {
    const list = (c.ann && c.ann[which]) || [];
    return list.map(b => '<span class="ann ' + which + '" style="left:' + b[0] + '%;top:' + b[1] + '%;width:' + b[2] + '%;height:' + b[3] + '%"><em>' + b[4] + '</em></span>').join('');
  }

  function lane(c, side) {
    const before = side === 'b';
    const tok = c.tok[before ? 0 : 1];
    const cut = before && c.trunc;
    const ans = before ? c.bAns : c.aAns;
    return '<div class="lane ' + side + '" data-tok="' + tok + '">' +
      '<div class="lane-h"><b>' + (before ? 'Before · S<sub>0</sub>' : 'After · S<sub>32</sub>') + '</b><span class="lane-c"><span class="cnt">0</span> tokens</span></div>' +
      '<div class="lane-bar"><i></i><span class="lim" title="8,192-token limit"></span></div>' +
      '<div class="lines"></div>' +
      '<div class="lane-end">' + (cut
        ? '<span class="cutoff">✂ Hit the 8,192-token limit. No final answer.</span>'
        : ((before ? c.bq : c.aq) ? '<q>' + (before ? c.bq : c.aq) + '</q>' : '') + (ans !== null ? '<span class="final ' + (before ? 'n' : 'y') + '">' + (before ? '✗ ' : '✓ ') + ans + '</span>' : '')) +
      '</div></div>';
  }

  function show(i, scroll) {
    cur = i;
    const c = C[i];
    renderWall();
    const fin = c.kind === 'fin';
    const hasAnn = c.ann && (c.ann.b || c.ann.a);
    view.innerHTML = '<div class="cv ' + c.kind + '">' +
      '<div class="cv-head"><div><div class="ttl">' + c.id + ' · ' + (fin ? 'from truncation to completion' : 'from completed-but-wrong to completed-and-correct') + ' · <span class="tagx">' + c.tag + '</span></div>' +
      '<h3>' + c.title + '</h3><div class="meta">' + c.bench + (c.topic ? ' · ' + c.topic : '') + ' · ' + c.model + ' · S<sub>0</sub> → S<sub>32</sub> · same 8,192-token limit</div></div>' +
      '<div class="cv-nav"><button type="button" class="btn-g" data-step="-1" aria-label="previous case">←</button><button type="button" class="btn-g" data-step="1" aria-label="next case">→</button></div></div>' +
      '<div class="cv-grid"><div class="cv-left">' +
      '<div class="img"><div class="imgbox"><img src="assets/cases/' + c.img + '.webp" alt="' + c.bench + ': ' + c.task.replace(/"/g, '&quot;') + '" data-zoom>' + boxes(c, 'b') + boxes(c, 'a') + '</div></div>' +
      (hasAnn ? '<div class="seg ann-seg" role="group" aria-label="annotations"><button type="button" data-a="b"' + (c.ann.b ? '' : ' disabled') + '>What S<sub>0</sub> read</button><button type="button" data-a="a" class="on">What S<sub>32</sub> read</button><button type="button" data-a="none">Clean image</button></div>' : '') +
      '<div class="task"><b>Task.</b> ' + c.task + '</div>' +
      '<div class="verdict3"><div><small>Reference</small><b>' + c.gold + '</b></div><div class="n"><small>Before S<sub>0</sub></small><b>' + (c.bAns === null ? '✂ none' : '✗ ' + c.bAns) + '</b></div><div class="y"><small>After S<sub>32</sub></small><b>✓ ' + c.aAns + '</b></div></div>' +
      '</div><div class="cv-right">' +
      '<div class="race-h"><span class="small muted">Response replay (' + (/^[AB]/.test(c.id) ? 'decode seed 0' : 'primary decoding') + '), both on one clock. Grey lines stand in for generated text; quotes are verbatim.</span><button type="button" class="btn-g" id="cv-replay">↻ Replay</button></div>' +
      '<div class="race">' + lane(c, 'b') + lane(c, 'a') + '</div>' +
      '<div class="ba b"><div class="h">Before: ' + (c.bh || 'completed but incorrect') + '</div>' + c.b + '</div>' +
      '<div class="ba a"><div class="h">After: ' + (c.ah || 'completed and correct') + '</div>' + c.a + (c.ak ? '<div class="k">' + c.ak + '</div>' : '') + '</div>' +
      '<div class="changed"><b>What changed?</b> ' + c.what + '</div>' +
      '</div></div></div>';
    if (window.ARSI_renderMath) window.ARSI_renderMath(view);
    setAnn(hasAnn ? 'a' : 'none');
    view.querySelectorAll('.ann-seg button').forEach(b => b.addEventListener('click', () => setAnn(b.dataset.a)));
    view.querySelectorAll('.cv-nav button').forEach(b => b.addEventListener('click', () => step(+b.dataset.step)));
    $('cv-replay').addEventListener('click', race);
    const img = view.querySelector('img[data-zoom]');
    img.addEventListener('click', () => { const lb = $('lightbox'); lb.querySelector('img').src = img.src; lb.querySelector('img').alt = img.alt; lb.classList.add('on'); });
    if (scroll) view.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (visible) race();
  }

  function setAnn(which) {
    view.querySelectorAll('.ann').forEach(a => a.classList.toggle('show', a.classList.contains(which)));
    view.querySelectorAll('.ann-seg button').forEach(b => { const on = b.dataset.a === which; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  }

  function step(d) {
    const vis = C.map((c, i) => i).filter(i => !wall.children[i].classList.contains('hide'));
    const k = vis.indexOf(cur);
    show(vis[(k + d + vis.length) % vis.length], false);
  }

  // Both lanes share one clock: 8,192 tokens take ~4.2 s, so relative lengths stay honest.
  function race() {
    cancelAnimationFrame(raf);
    const lanes = [...view.querySelectorAll('.lane')];
    const MS = 4200 / LIMIT, t0 = performance.now();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    lanes.forEach(l => {
      l.classList.remove('done');
      l.querySelector('.lines').innerHTML = '';
      l._n = 0; l._lines = Math.max(2, Math.round(12 * (+l.dataset.tok) / LIMIT));
      l._seed = l.classList.contains('b') ? 3 : 11;
    });
    function frame(now) {
      let running = false;
      lanes.forEach(l => {
        const tok = +l.dataset.tok, el = reduce ? 1e9 : Math.max(0, now - t0);
        const t = Math.min(tok, Math.round(el / MS));
        l.querySelector('.cnt').textContent = fmt(t);
        l.querySelector('.lane-bar i').style.width = (t / LIMIT * 100) + '%';
        const want = Math.ceil(l._lines * t / tok);
        const box = l.querySelector('.lines');
        while (l._n < want) {
          l._seed = (l._seed * 9301 + 49297) % 233280;
          const s = document.createElement('span');
          s.style.width = (42 + (l._seed / 233280) * 54).toFixed(0) + '%';
          box.appendChild(s);
          l._n++;
        }
        if (t < tok) running = true; else l.classList.add('done');
      });
      if (running) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
  }

  wall.addEventListener('click', e => { const b = e.target.closest('.cw'); if (b) show(+b.dataset.i, true); });
  document.getElementById('case-filter').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    filter = b.dataset.f;
    document.querySelectorAll('#case-filter button').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
    renderWall();
    if (wall.children[cur].classList.contains('hide')) show(C.findIndex((c, i) => !wall.children[i].classList.contains('hide')), false);
  });

  let visible = false;
  new IntersectionObserver(es => {
    const was = visible;
    visible = es[0].isIntersecting;
    if (visible && !was) race();
  }, { threshold: 0.25 }).observe(view);

  window.addEventListener('load', () => { if (window.ARSI_renderMath) window.ARSI_renderMath(view); });
  show(0, false);
})();
