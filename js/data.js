/* Every number on this page comes from the A-RSI manuscript (tables and appendix)
   or from the figure data shipped with the manuscript source. */
window.ARSI = {
  // Table 2 / Table 3: eleven full benchmarks, 8,192 tokens.
  cols: ['S0', 'S11', 'S12', 'S13', 'S21', 'S22', 'S23', 'S31', 'S32', 'S33'],
  bench: {
    qwen: {
      name: 'Qwen3-VL-8B-Instruct',
      rows: [
        ['MMSI', 1000, [27.10, 27.90, 26.70, 28.10, 28.50, 28.70, 30.70, 28.80, 29.30, 31.00]],
        ['MathVerse', 3940, [62.03, 62.01, 62.39, 62.46, 63.40, 64.06, 63.38, 63.25, 63.48, 63.81]],
        ['MathVision', 3040, [45.92, 47.27, 47.20, 47.66, 48.98, 50.07, 50.62, 51.45, 51.45, 52.53]],
        ['MMMU-Pro (4)', 1592, [58.42, 59.23, 58.79, 59.74, 60.24, 62.63, 62.06, 61.31, 63.19, 63.00]],
        ['VisNumBench', 1913, [49.03, 52.74, 53.84, 54.47, 55.36, 54.68, 55.62, 54.05, 55.99, 56.19]],
        ['MMMU-Pro (10)', 1592, [50.75, 51.19, 52.64, 52.32, 52.70, 53.45, 52.32, 54.27, 53.96, 54.52]],
        ['MMMU-Pro (vision)', 1730, [50.06, 49.36, 50.46, 50.58, 51.62, 51.21, 51.04, 51.39, 53.76, 52.72]],
        ['MMMU', 895, [60.56, 62.68, 62.57, 63.24, 65.25, 65.14, 64.25, 65.36, 64.36, 65.92]],
        ['ChartQA', 2500, [81.24, 82.48, 82.20, 81.88, 84.40, 83.32, 84.52, 84.28, 84.96, 85.00]],
        ['PhyX', 3000, [63.50, 66.93, 67.07, 68.30, 70.00, 70.97, 72.03, 71.73, 74.17, 73.33]],
        ['SCEMQA-MC', 840, [74.52, 77.02, 76.90, 77.50, 77.74, 77.14, 77.86, 76.79, 76.90, 77.86]]
      ],
      macro: [56.65, 58.08, 58.25, 58.75, 59.84, 60.12, 60.40, 60.24, 61.05, 61.44],
      poolMean: [58.36, 60.12, 60.91]
    },
    mimo: {
      name: 'MiMo-VL-7B-SFT',
      rows: [
        ['MMSI', 1000, [31.50, 30.20, 31.30, 30.10, 30.00, 29.00, 29.30, 31.10, 30.70, 30.00]],
        ['MathVerse', 3940, [70.10, 72.34, 72.23, 72.11, 71.88, 71.80, 71.42, 71.83, 72.39, 71.93]],
        ['MathVision', 3040, [53.95, 54.51, 55.69, 55.46, 55.62, 55.82, 56.35, 56.78, 56.41, 55.30]],
        ['MMMU-Pro (4)', 1592, [57.10, 59.23, 59.92, 59.80, 59.67, 60.24, 60.80, 60.05, 59.42, 59.74]],
        ['VisNumBench', 1913, [48.93, 48.77, 48.30, 48.09, 49.71, 49.76, 50.91, 50.03, 49.24, 49.71]],
        ['MMMU-Pro (10)', 1592, [49.94, 50.06, 51.01, 52.01, 51.19, 52.58, 52.32, 52.95, 52.01, 51.44]],
        ['MMMU-Pro (vision)', 1730, [48.21, 48.73, 49.60, 49.65, 48.96, 49.36, 50.00, 48.15, 49.19, 48.73]],
        ['MMMU', 895, [60.56, 62.91, 63.24, 62.23, 62.23, 63.46, 64.47, 61.68, 62.23, 61.79]],
        ['ChartQA', 2500, [88.12, 87.88, 88.52, 88.16, 88.28, 88.44, 88.08, 88.20, 88.32, 88.72]],
        ['PhyX', 3000, [65.67, 67.27, 68.27, 69.13, 68.97, 69.80, 70.57, 69.57, 69.13, 68.87]],
        ['SCEMQA-MC', 840, [75.83, 77.62, 76.90, 77.14, 77.86, 77.50, 77.26, 76.90, 78.81, 77.62]]
      ],
      macro: [59.08, 59.96, 60.45, 60.35, 60.40, 60.71, 61.04, 60.66, 60.71, 60.35],
      poolMean: [60.25, 60.72, 60.57]
    }
  },

  // Figure 4(a) / Table 4 (Qwen) and Table "tab:mimo" (MiMo): Macro11 by continuation window.
  arms: [
    { id: 'ours', name: 'A-RSI', rule: 'Training-log trigger', sel: 'Random' },
    { id: 'cont', name: 'Continuous', rule: 'Every window', sel: 'Adaptive difficulty' },
    { id: 'periodic', name: 'Periodic', rule: 'Every two windows', sel: 'Frontier' },
    { id: 'front', name: 'Frontier', rule: 'Training-log trigger', sel: 'Frontier' },
    { id: 'nr', name: 'No-Refresh', rule: 'Never', sel: 'None' }
  ],
  policy: {
    qwen: {
      label: 'Qwen3-VL-8B · Macro11 (%)',
      shared: [[0, 57.77]],
      x: [0, 2, 4, 6, 8],
      y: {
        ours: [57.77, 58.25, 59.84, 60.40, 61.05],
        cont: [57.77, 58.14, 59.47, 59.74, 60.64],
        periodic: [57.77, 58.25, 59.22, 59.91, 59.89],
        front: [57.77, 58.25, 59.76, 59.83, 59.59],
        nr: [57.77, 58.25, 58.48, 58.35, null]
      },
      startNote: 'window 0 = S<sub>t</sub>, 57.77',
      halted: 'No-Refresh halted at S31 after its health gate failed twice.',
      tasks: { ours: 800, front: 800, periodic: 1200, cont: 3200, nr: 0 },
      per1k: { ours: 4.09, front: 2.28, periodic: 1.77, cont: 0.90 }
    },
    mimo: {
      label: 'MiMo-VL-7B · Macro11 (%)',
      x: [0, 1, 2, 3, 4, 6, 8],
      shared: [[0, 59.08], [1, 59.96], [2, 60.45], [3, 60.35]],
      y: {
        ours: [59.08, 59.96, 60.45, 60.35, 60.40, 61.04, 60.71],
        cont: [59.08, 59.96, 60.45, 60.35, 61.04, 61.07, 60.69],
        periodic: [59.08, 59.96, 60.45, 60.35, 60.87, 60.44, 60.53],
        nr: [59.08, 59.96, 60.45, 60.35, 60.97, 60.19, 60.01]
      },
      startNote: 'windows 0–3 shared: S<sub>0</sub> 59.08 → old-pool checkpoint 60.35',
      vsNR: { ours: 0.70, cont: 0.68, periodic: 0.52 }
    }
  },

  // Figure 3: training pools through S32 (each fresh block = 400 tasks).
  schedule: [
    { id: 'ours', blocks: [[1, 3, 'old'], [4, 6, 'rand', 'pool 1'], [7, 8, 'rand', 'pool 2']], fires: [3.5, 6.5], fresh: 800 },
    { id: 'front', blocks: [[1, 3, 'old'], [4, 6, 'front', 'pool 1'], [7, 8, 'front', 'pool 2']], fires: [3.5, 6.5], fresh: 800 },
    { id: 'periodic', blocks: [[1, 2, 'old'], [3, 4, 'front', 'pool 1'], [5, 6, 'front', 'pool 2'], [7, 8, 'front', 'pool 3']], fires: [], fresh: 1200 },
    { id: 'cont', blocks: [1, 2, 3, 4, 5, 6, 7, 8].map(w => [w, w, 'adapt', 'pool ' + w]), fires: [], fresh: 3200 },
    { id: 'nr', blocks: [[1, 6, 'old'], [7, 8, 'halt']], fires: [], fresh: 0 }
  ],

  // Table 5: replacement selection (Macro11, 8,192 tokens).
  selection: [
    { block: 'Four windows, every-window refresh', control: 60.29, items: [
      ['Failure-prioritized sampling', 57.67, -2.63], ['Learnable-band sampling', 58.39, -1.90],
      ['Always-wrong sampling', 57.89, -2.40], ['Ladder controller', 59.47, -0.82],
      ['Always-increase controller', 59.81, -0.48], ['Truncation-aware controller', 60.24, -0.05],
      ['All-tier sampling', 59.10, -1.19]] },
    { block: 'Eight windows, detector-triggered refresh (S32)', control: 61.05, items: [['Frontier selection', 59.59, -1.45]] }
  ],

  // Table "tab:vtype": visual-type results at S32.
  vtypes: {
    head: [['Geometry', 4588], ['Chart', 2960], ['Table', 1181], ['Counting', 447]],
    rows: [
      ['S_t (start)', [56.19, 18.64, 79.63, 1.69, 70.96, 13.80, 54.81, 13.20]],
      ['Frontier', [57.65, 10.48, 81.32, 1.05, 72.14, 10.16, 57.94, 6.71]],
      ['Periodic', [57.85, 12.69, 82.23, 1.11, 73.58, 11.35, 59.06, 10.07]],
      ['Continuous', [59.70, 9.94, 81.15, 0.71, 74.26, 9.40, 57.94, 5.82]],
      ['A-RSI', [59.83, 4.80, 81.66, 0.81, 72.99, 6.60, 61.74, 2.46]]
    ],
    change: [3.64, -13.84, 2.03, -0.88, 2.03, -7.20, 6.94, -10.74]
  },

  // Table "tab:adaptive-pool-decisions": controller feedback per pool stage.
  controller: {
    Qwen: [
      { pool: 'Initial pool', w: [1, 3], U: [239, null, 195], da: 7.00, action: 'refresh', status: 'Executed' },
      { pool: 'Replacement 1', w: [4, 6], U: [196, null, 163], da: 9.47, action: 'refresh', status: 'Executed' },
      { pool: 'Replacement 2', w: [7, 9], U: [181, 168, 152], da: 6.59, action: 'refresh', status: 'Offline replay' }
    ],
    MiMo: [
      { pool: 'Initial pool', w: [1, 3], U: [245, 194, 153], da: 14.28, action: 'refresh', status: 'Executed' },
      { pool: 'Replacement 1', w: [4, 6], U: [199, null, 143], da: 14.50, action: 'refresh', status: 'Executed' },
      { pool: 'Replacement 2', w: [7, 9], U: [152, 154, 150], da: 6.63, action: 'keep', status: 'Offline replay' }
    ]
  },

  // Replacement-pool family quotas k = (geo, chart, table, count), sum 400.
  quota: { geo: 194, chart: 131, table: 54, count: 21 },

  // Hero: Qwen main trajectory (Table 2 Macro11; S_t = 57.77).
  hero: [
    { lab: 'S_t', score: 57.77, pool: 0, win: 0 },
    { lab: 'S11', score: 58.08, pool: 0, win: 1, U: 239 },
    { lab: 'S12', score: 58.25, pool: 0, win: 2 },
    { lab: 'S13', score: 58.75, pool: 0, win: 3, U: 195, dec: { U0: 239, U1: 195, ret: 81.59, da: 7.00, fire: true } },
    { lab: 'S21', score: 59.84, pool: 1, win: 1, U: 196 },
    { lab: 'S22', score: 60.12, pool: 1, win: 2 },
    { lab: 'S23', score: 60.40, pool: 1, win: 3, U: 163, dec: { U0: 196, U1: 163, ret: 83.16, da: 9.47, fire: true } },
    { lab: 'S31', score: 60.24, pool: 2, win: 1, U: 181 },
    { lab: 'S32', score: 61.05, pool: 2, win: 2, U: 168, end: true }
  ]
};
