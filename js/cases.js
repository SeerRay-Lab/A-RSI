/* Case gallery: the paper's Section "Case Study" (A1, A2, B1, B2) and Appendix cases C1-C10.
   All text is excerpted from the manuscript; S0 = public starting model, S32 = Pool 3, window 2. */
(function () {
  'use strict';
  const Q = 'Qwen3-VL-8B-Instruct', M = 'MiMo-VL-7B-SFT';
  const C = [
    { id: 'A1', kind: 'fin', title: 'An answer, but no ending!', bench: 'PhyX #1314 · CO bond length', model: Q, img: 'sci_phyx_mc_1314_0',
      task: 'Use the rotational spectrum to determine the CO bond length. Gold: option C, \\(1.1\\times10^{-10}\\) m.',
      bh: 'circles back, then gets cut off', b: 'The base response mentions the known CO bond length but repeatedly revisits the calculation. It reaches the limit without a final answer.',
      ah: 'commits and stops', a: 'The trained response invokes the known bond length, selects C, and ends normally.', aq: 'I recall that the bond length of CO is 1.128 Å', ak: '\\(\\boxed{\\mathrm{C}}\\)',
      tok: [8192, 1759], trunc: true,
      what: 'Less unresolved repetition and an explicit final answer. The spectrum is still misread, so this example does not establish better visual reasoning.' },
    { id: 'A2', kind: 'fin', title: 'Stuck, then able to stop!', bench: 'MATH-Vision #703 · square areas', model: Q, img: 'mathvision_703_0',
      task: 'A rectangle contains seven squares. How many times is the area of the largest square K that of the smallest L? Gold: 25.',
      bh: 'tries one layout after another', b: 'The base response repeatedly reconstructs incompatible layouts. It reaches the limit without a final answer.',
      ah: 'gives an answer within budget', a: 'The trained response still struggles with the layout, but eventually commits.', aq: 'I think I have to accept that the area of K is 25 times the area of L.', ak: '\\(\\boxed{25}\\)',
      tok: [8192, 5140], trunc: true,
      what: 'Completion and a correct final answer. The derivation remains inconsistent; this is an example of finishing, not a verified reasoning improvement.' },
    { id: 'B1', kind: 'cor', title: 'The missing slice matters!', bench: 'MathVerse #2042 · perimeter', model: Q, img: 'mathverse_2042_0',
      task: 'Find the perimeter to two decimal places. Gold: 60.68 cm.',
      bh: 'measures the missing piece', b: 'The base response treats the labeled 40° as the angle of the required sector. It finishes with \\(\\boxed{21.59}\\), the perimeter of the small sector.',
      ah: 'identifies the remaining shape', a: 'The trained response uses the 320° arc and both radii.', aq: 'it is a circle with a sector of 40 degrees removed.', ak: '\\[P=2(8)+\\tfrac{320}{360}\\,2\\pi(8)\\approx\\boxed{60.68}\\]',
      tok: [1634, 374],
      what: 'The interpretation of the diagram is corrected, followed by a consistent calculation. Both responses finish normally, so avoiding truncation cannot explain this item\'s score change.' },
    { id: 'B2', kind: 'cor', title: 'Look at the bottom!', bench: 'CharXiv #494 · spatial color reading', model: Q, img: 'sci_charxiv_494_0',
      task: 'In the parallel column, which W subscript has the brighter sphere at its bottom center? Gold: 1.',
      bh: 'reverses the color gradient', b: 'The base response describes the bottom of \\(W_2\\) as bright yellow and finishes with \\(\\boxed{2}\\).',
      ah: 'reads color at the right position', a: 'The trained response correctly locates the dark region in \\(W_2\\); the orange bottom of \\(W_1\\) is brighter.', aq: 'The bottom center of the sphere is dark purple', ak: '\\(\\boxed{1}\\)',
      tok: [1403, 187],
      what: 'The visual description and answer both become correct. Both versions finish normally; the correction concerns where the colors appear in the image.' },
    { id: 'C1', kind: 'cor', title: 'Include both relevant groups!', bench: 'ChartQA #627', model: Q, img: 'ChartQA_627_0',
      task: 'What percentage would spend time in Poland? Reference: 73.',
      b: 'The base response counts only the 66 percent who choose Poland exclusively.', bq: 'The category "Only in Poland" directly answers the question',
      a: 'The later response also includes the 7 percent who choose both Poland and abroad.', aq: 'So, I add the two relevant percentages: 66% + 7% = 73%.', ak: '\\(66+7=\\boxed{73}\\)',
      tok: [118, 149], what: 'The labels are read correctly in both responses; the correction is which categories belong in the requested total.' },
    { id: 'C2', kind: 'cor', title: 'A branch is not one resistor!', bench: 'SCEMQA-MC #652', model: Q, img: 'sci_scemqa_mc_652_0',
      task: 'Find the voltage across the 50 Ω resistor. Reference: C, 3.0 V.',
      b: 'The base identifies the series branch but incorrectly assigns its full 9 V to the 50-ohm component.', bq: 'both are equal to the battery voltage.',
      a: 'The later response distinguishes branch voltage from component voltage and applies the divider rule.', aq: 'this voltage is divided between the two resistors according to their resistance values.', ak: '\\(V_{50}=9\\,\\tfrac{50}{50+100}=\\boxed{3\\,\\mathrm{V}}\\)',
      tok: [247, 349], what: 'The circuit interpretation is retained while the component-level calculation is repaired.' },
    { id: 'C3', kind: 'cor', title: 'Read the hits, then solve!', bench: 'MATH-Vision #585', model: Q, img: 'mathvision_585_0',
      task: 'Three darts score 12, then 15 points. What is the third score? Reference: 21.',
      b: 'The base reverses the first target\'s hit locations, assigns 4 points to the inner field, and answers 12.', bq: 'In the first shot, 3 darts hit the inner blue circle',
      a: 'The later response correctly distinguishes the outer and inner hits and solves for their separate scores.', aq: 'In the first scenario, all three darts hit the outer ring', ak: '\\(3x=12,\\ 2x+y=15\\ \\Rightarrow\\ 3y=\\boxed{21}\\)',
      tok: [1350, 234], what: 'Correct visual grounding makes the same simple algebra produce the right answer.' },
    { id: 'C4', kind: 'cor', title: 'Count the shaded pieces!', bench: 'MATH-Vision #2555', model: Q, img: 'mathvision_2555_0',
      task: 'Find the shaded area of a right triangle with legs 8 and 16 congruent pieces. Reference: 20.',
      b: 'The base eventually assumes four white pieces and twelve shaded pieces, giving 24.', bq: 'So the shaded area is 24.',
      a: 'The later response counts ten shaded pieces and uses the area of one piece.', aq: 'By examining the image, we can see that there are 10 shaded small triangles.', ak: '\\(A=\\tfrac{\\frac12(8)(8)}{16}\\,(10)=\\boxed{20}\\)',
      tok: [4555, 241], what: 'The correction concerns the visual count; the total-area formula was already available to the base.' },
    { id: 'C5', kind: 'cor', title: 'Use the supplementary angle!', bench: 'MathVerse #226', model: Q, img: 'mathverse_226_0',
      task: 'With AB ∥ CD and angle A = 70°, find angle 1. Reference: D, 110°.',
      b: 'The base treats the marked angle as corresponding to the given angle and selects 70 degrees.', bq: 'so it\'s a corresponding angle.',
      a: 'The later response identifies the adjacent linear pair at the lower parallel line.', aq: 'Angle 1 and this 70° angle are on a straight line, so they are supplementary.', ak: '\\(\\angle 1=180^\\circ-70^\\circ=\\boxed{110^\\circ}\\)',
      tok: [234, 353], what: 'The marked region is interpreted correctly before applying the parallel-line relation.' },
    { id: 'C6', kind: 'cor', title: 'A loop is half a wavelength!', bench: 'PhyX #1353', model: M, img: 'sci_phyx_mc_1353_0',
      task: 'A standing wave spans 60 cm and oscillates at 100 Hz. Find its speed. Reference: D, 30 m/s.',
      b: 'The base counts the four standing-wave loops as four full wavelengths and obtains 15 m/s.', bq: 'there are 4 full wavelengths in this distance.',
      a: 'After revising its count, the later response ends with the diagram-consistent two-wavelength explanation.', aq: 'there are 2 full wavelengths.', ak: '\\(\\lambda=\\tfrac{0.60}{2}=0.30\\,\\mathrm{m},\\ v=100\\lambda=\\boxed{30\\,\\mathrm{m/s}}\\)',
      tok: [927, 1185], what: 'The final explanation repairs the wavelength count. Its intermediate reasoning still contains revisions.' },
    { id: 'C7', kind: 'cor', title: 'Compare the full object length!', bench: 'VisNumBench #1547', model: M, img: 'visnumbench_1547_0',
      task: 'Which object, A–D from left to right, has the greatest length? Reference: d, the scissors.',
      b: 'The base selects the mouse even though the scissors extend farther along their long axis.', bq: 'The mouse (A) seems to be the longest among them.',
      a: 'The later response compares the full object extents and selects the rightmost scissors.', aq: 'Scissors are longer than the others.',
      tok: [127, 207], what: 'The visual comparison changes from A to D; both outputs already submit an explicit answer.' },
    { id: 'C8', kind: 'cor', title: 'Locate the quietest marking!', bench: 'MMMU-Pro (4 options) #1008', model: M, img: 'mmmu_pro_4_options_1008_0',
      task: 'Is bar 8 the quietest bar in the displayed music? Reference: A, True.',
      b: 'The base recognizes pianissimo but places the marking outside bar 8 and answers False.', bq: 'So bar 8 is not the quietest.',
      a: 'The later response associates the displayed pianissimo marking with bar 8 and answers True.', aq: 'Bar 8 features the pp marking.',
      tok: [590, 299], what: 'The correction links a known musical symbol to its location. Here pp is the softest marking shown, not a universal minimum dynamic.' },
    { id: 'C9', kind: 'cor', title: 'Account for all three effects!', bench: 'MMMU #442', model: M, img: 'MMMU_442_0',
      task: 'What is the total capacity of the forward-feed evaporator? Reference: A, \\(E_1+E_2+E_3\\).',
      b: 'The base focuses on the first feed stage and chooses its evaporation term alone.', bq: 'Option C is E1. So the answer should be C.',
      a: 'The later final explanation treats capacity as total evaporation across the three-effect system.', aq: 'each effect contributes to removing water from the feed.', ak: '\\(E_{\\mathrm{total}}=\\boxed{E_1+E_2+E_3}\\)',
      tok: [252, 825], what: 'The system boundary changes from one effect to the full apparatus. The base\'s raw text selects C, so this is not solely a formatting repair.' },
    { id: 'C10', kind: 'cor', title: 'Read the value, not the footer!', bench: 'ChartQA #714', model: Q, img: 'ChartQA_714_0',
      task: 'How many female murder offenders were there in 2019? Reference: 1,408.',
      b: 'The base mistakes the 2021 copyright footer for the data year and withholds an answer despite mentioning 1,408.', bq: 'it is not possible to determine the number of female murder offenders in 2019 from this image.',
      a: 'The later response answers from the Female label. The image itself does not separately print the data year.', aq: 'the value associated with the "Female" category is 1,408.',
      tok: [108, 132], what: 'This is a correction of answer acceptance and date interpretation, rather than newly learned arithmetic.' }
  ];

  const nav = document.getElementById('case-nav'), view = document.getElementById('case-view');
  let cur = 0;
  nav.innerHTML = '<span class="small muted" style="align-self:center;margin-right:4px">Finishing</span>' +
    C.map((c, i) => (c.id === 'B1' ? '<span class="small muted" style="align-self:center;margin:0 4px 0 10px">Correcting</span>' : '') +
      '<button type="button" class="' + (c.kind === 'fin' ? 'fin' : '') + '" data-i="' + i + '">' + c.id + '</button>').join('');

  function show(i) {
    cur = i;
    const c = C[i];
    nav.querySelectorAll('button').forEach(b => b.classList.toggle('on', +b.dataset.i === i));
    const max = Math.max(c.tok[0], c.tok[1]);
    const fin = c.kind === 'fin';
    view.innerHTML = '<div class="case">' +
      '<div><div class="img"><img src="assets/cases/' + c.img + '.webp" alt="' + c.bench + '" data-zoom></div>' +
      '<div class="tok"><div class="lab">Generated tokens' + (/^[AB]/.test(c.id) ? ' (decode seed 0)' : ' (primary decoding)') + '</div>' +
      '<div class="tb"><span>Before S<sub>0</sub></span><span class="tr"><i style="width:0;background:#f3b893" data-w="' + (c.tok[0] / max * 100) + '"></i></span><b>' + c.tok[0].toLocaleString('en-US') + (c.trunc ? ' · cut' : '') + '</b></div>' +
      '<div class="tb"><span>After S<sub>32</sub></span><span class="tr"><i style="width:0;background:#9bbad2" data-w="' + (c.tok[1] / max * 100) + '"></i></span><b>' + c.tok[1].toLocaleString('en-US') + '</b></div></div></div>' +
      '<div><div class="ttl">' + c.id + ' · ' + (fin ? 'from truncation to completion' : 'from completed-but-wrong to completed-and-correct') + '</div>' +
      '<h3>' + c.title + '</h3><div class="meta">' + c.bench + ' · ' + c.model + ' · S<sub>0</sub> → S<sub>32</sub> · 8,192-token limit</div>' +
      '<div class="task"><b>Task.</b> ' + c.task + '</div>' +
      '<div class="ba b"><div class="h">Before' + (c.bh ? ': ' + c.bh : ': completed but incorrect') + '</div>' + c.b + (c.bq ? '<q>' + c.bq + '</q>' : '') + '</div>' +
      '<div class="ba a"><div class="h">After' + (c.ah ? ': ' + c.ah : ': completed and correct') + '</div>' + c.a + (c.aq ? '<q>' + c.aq + '</q>' : '') + (c.ak ? '<div class="k">' + c.ak + '</div>' : '') + '</div>' +
      '<div class="changed"><b>What changed?</b> ' + c.what + '</div></div></div>';
    if (window.ARSI_renderMath) window.ARSI_renderMath(view);
    requestAnimationFrame(() => view.querySelectorAll('.tr i').forEach(x => (x.style.width = x.dataset.w + '%')));
    const img = view.querySelector('img[data-zoom]');
    img.addEventListener('click', () => { const lb = document.getElementById('lightbox'); lb.querySelector('img').src = img.src; lb.querySelector('img').alt = img.alt; lb.classList.add('on'); });
  }
  nav.addEventListener('click', e => { const b = e.target.closest('button'); if (b) show(+b.dataset.i); });
  window.addEventListener('load', () => show(cur));
  show(0);
})();
