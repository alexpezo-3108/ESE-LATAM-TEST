/* ==========================================================================
   Sectores — carrusel
   data-carousel (sección) · data-carousel-track · data-carousel-prev/next
   data-carousel-current (contador) · data-carousel-dot
   ========================================================================== */
(() => {
  const desktop = matchMedia('(min-width: 64em)');
  const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
  const pad = (n) => String(n).padStart(2, '0');

  document.querySelectorAll('[data-carousel]').forEach((root) => {
    const track = root.querySelector('[data-carousel-track]');
    const viewport = track.parentElement;
    const slides = [...track.children];
    const dots = [...root.querySelectorAll('[data-carousel-dot]')];
    const current = root.querySelector('[data-carousel-current]');
    const n = slides.length;
    let index = 0;
    /* Enfriamiento: ignora clics mientras dura la transición (igual que el resto de carruseles) */
    const COOLDOWN = 600;
    let lockUntil = 0;
    const locked = () => performance.now() < lockUntil;

    /* ---------- Desktop: posiciones por transform ---------- */
    const layout = () => {
      if (!desktop.matches) {
        slides.forEach((s) => s.style.removeProperty('transform'));
        return;
      }
      const W = slides[0].offsetWidth;
      const G = parseFloat(getComputedStyle(track).columnGap) || 0;
      const S = parseFloat(getComputedStyle(root).getPropertyValue('--card-scale')) || 1;
      const step = W * S + G;
      slides.forEach((s, i) => {
        const d = i - index;
        const x = d === 0 ? 0 : d > 0 ? W + G + (d - 1) * step : d * step;
        s.style.transform = `translate3d(${x}px, 0, 0) scale(${d === 0 ? 1 : S})`;
      });
    };

    const setActive = (i, dir = 1) => {
      const changed = i !== index;
      index = i;
      slides.forEach((s, k) => s.classList.toggle('is-active', k === i));
      dots.forEach((d, k) => d.setAttribute('aria-current', String(k === i)));
      if (current && changed) {
        current.textContent = pad(i + 1);
        current.animate?.(
          [{ transform: `translateY(${dir * 100}%)` }, { transform: 'translateY(0)' }],
          { duration: 700, easing: EASE }
        );
      }
    };

    const goTo = (i, dir) => {
      const next = (i + n) % n;
      if (next === index || locked()) return;
      lockUntil = performance.now() + COOLDOWN;
      setActive(next, dir ?? (next >= index ? 1 : -1));
      if (desktop.matches) layout();
      else track.scrollTo({ left: slides[next].offsetLeft - slides[0].offsetLeft, behavior: 'smooth' });
    };

    root.querySelector('[data-carousel-prev]')?.addEventListener('click', () => goTo(index - 1, -1));
    root.querySelector('[data-carousel-next]')?.addEventListener('click', () => goTo(index + 1, 1));
    dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));

    /* Click en una card inactiva: la activa en lugar de navegar */
    let fromPointer = false;
    slides.forEach((s, i) => {
      s.addEventListener('pointerdown', () => { fromPointer = true; });
      s.addEventListener('click', (e) => {
        fromPointer = false;
        if (desktop.matches && i !== index) { e.preventDefault(); goTo(i); }
      });
      s.addEventListener('focusin', () => {
        viewport.scrollLeft = 0;
        if (desktop.matches && !fromPointer && i !== index) goTo(i);
      });
    });

    root.addEventListener('keydown', (e) => {
      if (!desktop.matches) return;
      if (e.key === 'ArrowRight') goTo(index + 1, 1);
      if (e.key === 'ArrowLeft') goTo(index - 1, -1);
    });

    /* ---------- Mobile: sincroniza dots con el scroll nativo ---------- */
    let raf;
    track.addEventListener('scroll', () => {
      if (desktop.matches) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const step = slides[1].offsetLeft - slides[0].offsetLeft;
        const i = Math.min(n - 1, Math.round(track.scrollLeft / step));
        if (i !== index) setActive(i);
      });
    }, { passive: true });

    let resizeT;
    let lastW = innerWidth;
    window.addEventListener('resize', () => { if (innerWidth === lastW) return; lastW = innerWidth; clearTimeout(resizeT); resizeT = setTimeout(layout, 120); });
    desktop.addEventListener('change', () => { track.scrollLeft = 0; setActive(0); layout(); });

    setActive(0);
    layout();
    requestAnimationFrame(() => root.classList.add('is-ready'));
  });
})();
