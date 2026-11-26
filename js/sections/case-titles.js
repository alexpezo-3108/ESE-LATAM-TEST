/* Marca las tarjetas cuyo título ocupa 4 líneas o más (se mide sin recorte) */
(() => {
  const mark = () => document.querySelectorAll('.case').forEach((card) => {
    const t = card.querySelector('.case__title'); if (!t) return;
    const probe = t.cloneNode(true);
    Object.assign(probe.style, { position: 'absolute', visibility: 'hidden', webkitLineClamp: 'unset', display: 'block', width: t.clientWidth + 'px', pointerEvents: 'none' });
    t.parentNode.appendChild(probe);
    const lh = parseFloat(getComputedStyle(probe).lineHeight) || 1;
    const n = Math.round(probe.scrollHeight / lh);
    card.dataset.titleLines = String(n);
    card.classList.toggle('is-long-title', n >= 4);
    probe.remove();
  });
  const run = () => requestAnimationFrame(mark);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(run); else run();
  let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(run, 150); });
  let mt; new MutationObserver((ms) => { if (ms.some((m) => [...m.addedNodes].some((n) => n.nodeType === 1 && (n.matches('.case') || n.querySelector?.('.case'))))) { clearTimeout(mt); mt = setTimeout(run, 50); } }).observe(document.body, { childList: true, subtree: true });
})();
