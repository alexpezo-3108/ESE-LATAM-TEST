/* ==========================================================================
   Nosotros (home) — panal de hexágonos que se "enciende" donde pasa el cursor.
   Las celdas no se mueven: solo una zona de luz suave con inercia las revela. Solo con mouse.
   ========================================================================== */
(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('.s-about .bento-card:not(.bento-card--blue)').forEach((card) => {
    const el = document.createElement('span');
    el.className = 'bento-hex';
    el.setAttribute('aria-hidden', 'true');
    card.prepend(el);

    const k = reduce ? 1 : 0.06;
    const t = { x: 0, y: 0 }, p = { x: 0, y: 0 };
    let inside = false, raf = 0;

    const tick = () => {
      p.x += (t.x - p.x) * k;
      p.y += (t.y - p.y) * k;
      el.style.setProperty('--hx', `${p.x}px`);
      el.style.setProperty('--hy', `${p.y}px`);
      raf = inside || Math.abs(t.x - p.x) + Math.abs(t.y - p.y) > 0.5 ? requestAnimationFrame(tick) : 0;
    };
    const set = (e) => { const r = card.getBoundingClientRect(); t.x = e.clientX - r.left; t.y = e.clientY - r.top; };

    card.addEventListener('pointerenter', (e) => {
      set(e); p.x = t.x; p.y = t.y; inside = true;
      card.classList.add('is-hex');
      if (!raf) raf = requestAnimationFrame(tick);
    });
    card.addEventListener('pointermove', (e) => { set(e); if (!raf) raf = requestAnimationFrame(tick); });
    card.addEventListener('pointerleave', () => { inside = false; card.classList.remove('is-hex'); });
  });
})();
