/* ==========================================================================
   Revelado desde esquina — [data-corner-reveal="top-left|top-right"].
   La imagen crece desde la esquina siguiendo el scroll; al llegar a ~60 %
   se completa sola y ya no vuelve a ocultarse (entrada única).
   ========================================================================== */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const els = [...document.querySelectorAll('[data-corner-reveal]')];
  if (!els.length) return;
  const AUTO = 0.85;
  const START = 0; // nace en el punto de la esquina
  const live = new Set(els);
  els.forEach((el) => { el.classList.add('is-cr-ready'); el.style.setProperty('--p', START + ''); });
  let raf = 0;
  if (window.lenis && window.lenis.on) window.lenis.on('scroll', () => req());
  const update = () => {
    raf = 0;
    const vh = innerHeight;
    live.forEach((el) => {
      const r = el.getBoundingClientRect();
      // 0 cuando el borde superior está al 85 % de la pantalla; avanza lento a lo largo de un alto de pantalla
      const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (vh * 1.4)));
      if (p >= AUTO) {
        el.classList.add('is-cr-done');
        setTimeout(() => el.style.setProperty('--p', '1'), 20);
        live.delete(el);
      } else {
        el.style.setProperty('--p', START + (p / AUTO) * (AUTO - START) + '');
      }
    });
    if (!live.size) { removeEventListener('scroll', req); removeEventListener('resize', req); }
  };
  const req = () => { if (!raf) { raf = 1; update(); } };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  update();
})();
