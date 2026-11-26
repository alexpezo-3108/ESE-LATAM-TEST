/* ==========================================================================
   Footer — luz suave que sigue al cursor (con inercia). Solo con mouse.
   ========================================================================== */
(() => {
  const footer = document.querySelector('.site-footer');
  const glow = footer?.querySelector('.site-footer__glow');
  if (!glow || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const k = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 0.08;
  const target = { x: 0, y: 0 };
  const light = { x: 0, y: 0 };
  let inside = false;
  let raf = 0;

  const tick = () => {
    light.x += (target.x - light.x) * k;
    light.y += (target.y - light.y) * k;
    const r = footer.getBoundingClientRect();
    glow.style.setProperty('--mx', `${light.x - r.left}px`);
    glow.style.setProperty('--my', `${light.y - r.top}px`);
    const settled = Math.abs(target.x - light.x) < 0.3 && Math.abs(target.y - light.y) < 0.3;
    raf = inside || !settled ? requestAnimationFrame(tick) : 0;
  };

  footer.addEventListener('pointerenter', (e) => {
    inside = true;
    target.x = e.clientX; target.y = e.clientY;
    if (!light.x) { light.x = target.x; light.y = target.y; }
    if (!raf) raf = requestAnimationFrame(tick);
  });
  footer.addEventListener('pointermove', (e) => {
    target.x = e.clientX; target.y = e.clientY;
    if (!raf) raf = requestAnimationFrame(tick);
  });
  footer.addEventListener('pointerleave', () => { inside = false; });
})();
