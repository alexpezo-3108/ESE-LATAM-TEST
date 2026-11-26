/* ==========================================================================
   Pasos que se iluminan — [data-lit] con [data-lit-step]: se enciende el paso
   más cercano al centro de la pantalla; los demás quedan atenuados.
   ========================================================================== */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('[data-lit]').forEach((root) => {
    const steps = [...root.querySelectorAll('[data-lit-step]')];
    if (!steps.length) return;
    root.classList.add('is-lit-ready');
    let raf = 0;
    const update = () => {
      raf = 0;
      const mid = innerHeight * 0.5;
      let best = null, bestD = Infinity;
      steps.forEach((s) => {
        const r = s.getBoundingClientRect();
        const d = r.top <= mid && r.bottom >= mid ? 0 : Math.min(Math.abs(r.top - mid), Math.abs(r.bottom - mid));
        if (d < bestD) { bestD = d; best = s; }
      });
      steps.forEach((s) => s.classList.toggle('is-lit', s === best));
    };
    const req = () => { if (!raf) raf = requestAnimationFrame(update); };
    addEventListener('scroll', req, { passive: true });
    addEventListener('resize', req);
    update();
  });
})();
