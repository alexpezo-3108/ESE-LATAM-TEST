/* Objetivos: cada card se fija centrada; la de atrás se reduce y oscurece levemente */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('[data-goals]').forEach((root) => {
    const cards = [...root.querySelectorAll('[data-goal]')];
    const inners = cards.map((c) => c.querySelector('.goal__inner'));
    const measure = () => {
      const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) * 16 || 80;
      cards.forEach((c) => {
        const h = c.offsetHeight;
        // Centrada en la pantalla; si no entra, se fija bajo el header
        // Si no entra, se fija cuando su base (el CTA) llega al borde inferior
        const top = h > innerHeight - header ? innerHeight - h : Math.max(header, (innerHeight - h) / 2);
        c.style.setProperty('--goal-top', top + 'px');
      });
      update();
    };
    const update = () => {
      cards.forEach((c, i) => {
        const next = cards[i + 1];
        if (!next) return;
        const r = c.getBoundingClientRect();
        const nr = next.getBoundingClientRect();
        // 0 → la siguiente aún no llega; 1 → la siguiente la cubre por completo
        const p = Math.min(1, Math.max(0, 1 - (nr.top - r.top) / r.height));
        inners[i].style.setProperty('--goal-scale', String(1 - p * 0.05));
        inners[i].style.setProperty('--goal-dim', String(1 - p * 0.08));
      });
    };
    addEventListener('scroll', update, { passive: true });
    let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(measure, 120); });
    measure();
  });
})();
