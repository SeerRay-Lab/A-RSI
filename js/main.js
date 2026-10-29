/* Page shell: math, navigation, tabs, lightbox, reveal-on-scroll, citation copy. */
(function () {
  'use strict';

  // KaTeX: render every math span once the deferred scripts are ready.
  function renderMath(root) {
    if (!window.renderMathInElement) return false;
    window.renderMathInElement(root || document.body, {
      delimiters: [
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false }
      ],
      throwOnError: false
    });
    return true;
  }
  window.ARSI_renderMath = renderMath;
  window.addEventListener('load', () => renderMath());

  // Scroll spy for both navs.
  const ids = ['abstract', 'overview', 'demo', 'method', 'results', 'analysis', 'cases', 'citation'];
  const links = [...document.querySelectorAll('#topnav a, #sidenav a')];
  function spy() {
    let cur = null;
    const y = window.scrollY + window.innerHeight * 0.3;
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el && el.offsetTop <= y) cur = id;
    }
    links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + cur));
  }
  window.addEventListener('scroll', spy, { passive: true });
  spy();

  // Reveal on scroll.
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.rv').forEach(el => io.observe(el));

  // Demo tabs (deep-linkable: #demo-forge, #demo-ctrl, #demo-policy).
  function openTab(name) {
    const t = document.querySelector('.tab[data-tab="' + name + '"]');
    if (!t) return false;
    document.querySelectorAll('.tab').forEach(x => { x.classList.toggle('on', x === t); x.setAttribute('aria-selected', x === t); });
    document.querySelectorAll('.panel').forEach(p => p.classList.toggle('on', p.id === 'panel-' + name));
    window.dispatchEvent(new CustomEvent('arsi:tab', { detail: name }));
    return true;
  }
  document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
    openTab(t.dataset.tab);
    history.replaceState(null, '', '#demo-' + t.dataset.tab);
  }));
  function fromHash() {
    const m = location.hash.match(/^#demo-(\w+)$/);
    if (m && openTab(m[1])) document.getElementById('demo').scrollIntoView();
  }
  window.addEventListener('hashchange', fromHash);
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#demo-"]');
    if (!a) return;
    const name = a.getAttribute('href').slice(6);
    if (!document.querySelector('.tab[data-tab="' + name + '"]')) return;
    e.preventDefault();
    openTab(name);
    history.replaceState(null, '', '#demo-' + name);
    document.getElementById('demo').scrollIntoView({ behavior: 'smooth' });
  });
  window.addEventListener('load', fromHash);

  // Mobile navigation.
  const mt = document.getElementById('menu-toggle'), tn = document.getElementById('topnav');
  if (mt) {
    mt.addEventListener('click', () => { const open = tn.classList.toggle('open'); mt.setAttribute('aria-expanded', open); });
    tn.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { tn.classList.remove('open'); mt.setAttribute('aria-expanded', false); }));
  }
  // "Next" buttons inside demo panels.
  document.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => {
    openTab(b.dataset.open);
    history.replaceState(null, '', '#demo-' + b.dataset.open);
    document.querySelector('#demo .tabs').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));

  // Segmented toggles: one active button per group, change event with data-m.
  window.ARSI_seg = function (id, cb) {
    const g = document.getElementById(id);
    if (!g) return;
    g.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      g.querySelectorAll('button').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
      cb(b.dataset.m);
    });
  };

  // Lightbox for figures.
  const lb = document.getElementById('lightbox');
  document.querySelectorAll('img[data-zoom]').forEach(img => img.addEventListener('click', () => {
    lb.querySelector('img').src = img.src;
    lb.querySelector('img').alt = img.alt;
    lb.classList.add('on');
  }));
  lb.addEventListener('click', () => lb.classList.remove('on'));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') lb.classList.remove('on'); });

  // Citation copy.
  const copy = document.getElementById('bib-copy');
  copy.addEventListener('click', () => {
    const txt = document.getElementById('bib').innerText.replace(/^Copy\s*/, '').replace(/^Copied\s*/, '');
    navigator.clipboard.writeText(txt).then(() => {
      copy.textContent = 'Copied';
      setTimeout(() => (copy.textContent = 'Copy'), 1500);
    });
  });
})();
