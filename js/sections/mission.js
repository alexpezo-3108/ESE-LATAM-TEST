/* Misión / Visión: la sección se fija y, con el scroll, el grupo imagen + card
   se desliza a la izquierda mientras entra el siguiente desde la derecha. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-mv]').forEach((root) => {
    const sticky = root.querySelector('.s-mv__sticky');
    const viewport = root.querySelector('.s-mv__viewport');
    const track = root.querySelector('[data-mv-track]');
    const slides = [...root.querySelectorAll('[data-mv-slide]')];
    if (!track) return;
    let state = -1, raf = 0, lastT = 0;
    const A = 0.1, B = 0.72; // tramo del recorrido donde ocurre el deslizamiento
    const clamp = (v) => Math.min(1, Math.max(0, v));
    const ease = (t) => t * t * (3 - 2 * t); // smoothstep: arranca y frena suave

    const measure = () => {
      const h = sticky.offsetHeight;
      root.style.setProperty('--mv-h', h + 'px');
      root.style.setProperty('--mv-top', Math.min(0, innerHeight - h) + 'px');
      update();
    };
    const update = () => {
      raf = 0;
      const r = root.getBoundingClientRect();
      const travel = root.offsetHeight - sticky.offsetHeight;
      const top = parseFloat(getComputedStyle(root).getPropertyValue('--mv-top')) || 0;
      const p = travel > 0 ? clamp((top - r.top) / travel) : 0;
      // Pausa breve al inicio y algo mayor al final (Visión queda quieta antes de soltarse)
      const t = reduced ? (p > 0.5 ? 1 : 0) : ease(clamp((p - A) / (B - A)));
      lastT = t;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const dist = viewport.offsetWidth + gap;
      track.style.transform = 'translate3d(' + (-t * dist).toFixed(2) + 'px,0,0)';
      // Parallax interno de las imágenes
      slides.forEach((s, i) => s.style.setProperty('--mv-px', ((t - i) * dist * 0.08).toFixed(2) + 'px'));
      const st = t > 0.5 ? 1 : 0;
      if (st !== state) {
        state = st; root.dataset.state = String(st);
        slides.forEach((s, i) => { s.inert = i !== st; s.setAttribute('aria-hidden', String(i !== st)); });
      }
    };
    /* Imán suave: si el scroll se detiene a mitad del deslizamiento,
       se acomoda en Misión o Visión (la más cercana). No bloquea el scroll. */
    let idle;
    const snap = () => {
      if (reduced || lastT <= 0.02 || lastT >= 0.98) return;
      const travel = root.offsetHeight - sticky.offsetHeight;
      const top = parseFloat(getComputedStyle(root).getPropertyValue('--mv-top')) || 0;
      const start = root.getBoundingClientRect().top + scrollY - top; // scrollY donde p = 0
      const target = start + travel * (lastT < 0.5 ? A : B);
      if (window.lenis?.scrollTo) window.lenis.scrollTo(target, { duration: 0.7, easing: (x) => 1 - Math.pow(1 - x, 3) });
      else scrollTo({ top: target, behavior: 'smooth' });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
      clearTimeout(idle); idle = setTimeout(snap, 180);
    };
    addEventListener('scroll', onScroll, { passive: true });
    if (window.lenis) window.lenis.on?.('scroll', onScroll);
    let tm; addEventListener('resize', () => { clearTimeout(tm); tm = setTimeout(measure, 120); });
    let lastH = 0;
    new ResizeObserver(() => requestAnimationFrame(() => {
      if (sticky.offsetHeight !== lastH) { lastH = sticky.offsetHeight; measure(); }
    })).observe(sticky);
    measure();
  });
})();
