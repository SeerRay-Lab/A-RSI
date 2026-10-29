/* Refresh controller: re-evaluates the paper's trigger on the logged U and accuracy
   values of every pool stage (appendix table "Training feedback and controller actions"). */
(function () {
  'use strict';
  const D = window.ARSI.controller;
  const $ = id => document.getElementById(id);
  let model = 'Qwen';

  function decide(p, rho, eta) {
    const ret = p.U[2] / p.U[0];
    const byU = ret <= rho, byA = p.da >= eta;
    return { ret, byU, byA, fire: byU || byA };
  }

  function render() {
    const rho = +$('ct-rho').value / 100, eta = +$('ct-eta').value;
    $('ct-rho-v').textContent = Math.round(rho * 100) + '%';
    $('ct-eta-v').textContent = eta.toFixed(1) + ' pp';
    const pools = D[model];
    $('ct-pools').innerHTML = pools.map((p, i) => {
      const d = decide(p, rho, eta);
      const seq = p.U.map((u, k) => (u === null ? '<span title="not reported">·</span>' : '<b style="font-size:' + (k === 1 ? '1.05rem' : '1.5rem') + '">' + u + '</b>')).join('<span>→</span>');
      const rec = p.action;
      const mine = d.fire ? 'refresh' : 'keep';
      const same = mine === rec;
      const why = d.fire ? (d.byU && d.byA ? 'both conditions' : d.byU ? 'signal decline' : 'accuracy rise') : 'neither condition';
      return '<div class="pool' + (d.fire ? ' fire' : '') + '">' +
        '<div class="nm">' + p.pool + '</div><div class="ws">windows ' + p.w[0] + '–' + p.w[1] + ' · U<sub>first</sub> → U<sub>last</sub></div>' +
        '<div class="u">' + seq + '</div>' +
        '<div class="mini"><div class="lab"><span>retained U<sub>last</sub>/U<sub>first</sub></span><b>' + (d.ret * 100).toFixed(2) + '%</b></div>' +
        '<div class="mtrack"><div class="f' + (d.byU ? ' hit' : '') + '" style="width:' + Math.min(100, d.ret * 100) + '%"></div><div class="t" style="left:' + rho * 100 + '%"></div></div></div>' +
        '<div class="mini"><div class="lab"><span>accuracy rise Δa</span><b>+' + p.da.toFixed(2) + ' pp</b></div>' +
        '<div class="mtrack"><div class="f' + (d.byA ? ' hit' : '') + '" style="width:' + Math.min(100, p.da / 20 * 100) + '%"></div><div class="t" style="left:' + eta / 20 * 100 + '%"></div></div></div>' +
        '<div class="act"><span><span class="pill ' + (d.fire ? 'r' : 'k') + '">' + (d.fire ? 'Refresh' : 'Keep') + '</span> <span class="small muted">' + why + '</span></span>' +
        '<span class="match ' + (same ? 'y' : 'n') + '">' + (same ? '✓' : '✗') + ' paper: ' + rec + ' · ' + p.status.toLowerCase() + '</span></div>' +
        '</div>';
    }).join('');
    const atPaper = Math.abs(rho - 0.85) < 1e-9 && Math.abs(eta - 10) < 1e-9;
    const q3 = decide(D.Qwen[2], rho, eta).fire, m3 = decide(D.MiMo[2], rho, eta).fire;
    let note;
    if (atPaper) {
      note = model === 'Qwen'
        ? '<b>Qwen</b>: the signal falls below 85% on every pool, so the rule fires each time; the accuracy condition never fires alone. On its second replacement pool Qwen keeps 83.98% and the replay requests a refresh, while <b>MiMo</b> keeps 98.68% at the same stage and the replay keeps its pool. A fixed three-window schedule would have replaced both.'
        : '<b>MiMo</b>: the first two pools lose far more signal (62.45% and 71.86% retained) and both conditions hold. On the second replacement pool the count barely moves (152 → 150) and accuracy rises only 6.63 points, so the same fixed rule keeps the pool. Equal periods of reuse produce different decisions.';
    } else {
      note = 'With ρ = ' + Math.round(rho * 100) + '% and η = ' + eta.toFixed(1) + ' pp the final-stage replay would ' + (q3 ? 'refresh' : 'keep') + ' Qwen and ' + (m3 ? 'refresh' : 'keep') + ' MiMo. ' +
        (q3 !== m3 ? 'The two models still get different actions from one fixed rule.' : q3 ? 'Here both models are refreshed, as a fixed three-window schedule would also do.' : 'Here both models keep their pools, whereas a fixed three-window schedule would have replaced both.') +
        ' The paper fixes ρ = 85% and η = 10 points before training, for every stage and model.';
    }
    $('ct-note').innerHTML = note;
  }

  window.ARSI_seg('ct-model', m => { model = m; render(); });
  ['ct-rho', 'ct-eta'].forEach(id => $(id).addEventListener('input', render));
  $('ct-reset').addEventListener('click', () => { $('ct-rho').value = 85; $('ct-eta').value = 10; render(); });
  render();
})();
