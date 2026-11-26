/* ¿Cómo trabajamos?: slider de 3 pasos con autoplay y barras de progreso */
(() => {
  const DURATION = 7000;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-proc]').forEach((root) => {
    const card = root.querySelector('.proc');
    const slides = [...root.querySelectorAll('[data-proc-slide]')];
    const bgs = [...root.querySelectorAll('[data-proc-bg]')];
    const bars = [...root.querySelectorAll('[data-proc-bar] i')];
    const counter = root.querySelector('[data-proc-current]');
    let i = 0, t0 = 0, raf = 0, visible = false, paused = false, elapsed = 0;

    const paint = (p) => bars.forEach((b, j) => b.style.setProperty('--p', j < i ? 1 : j === i ? p : 0));
    const go = (next) => {
      next = (next + slides.length) % slides.length;
      if (next === i) return;
      slides[i].classList.add('is-leaving');
      const prev = slides[i];
      setTimeout(() => prev.classList.remove('is-leaving'), 800);
      i = next;
      slides.forEach((s, j) => { s.classList.toggle('is-active', j === i); s.setAttribute('aria-hidden', String(j !== i)); });
      bgs.forEach((b, j) => b.classList.toggle('is-active', j === i));
      card.dataset.tone = slides[i].dataset.tone;
      counter.textContent = String(i + 1).padStart(2, '0');
      elapsed = 0; t0 = performance.now(); paint(0);
    };
    const tick = (now) => {
      if (visible && !paused && !reduced) {
        const p = Math.min(1, (elapsed + now - t0) / DURATION);
        paint(p);
        if (p >= 1) go(i + 1);
      }
      raf = requestAnimationFrame(tick);
    };
    const pause = () => { if (!paused) { elapsed += performance.now() - t0; paused = true; } };
    const resume = () => { if (paused) { t0 = performance.now(); paused = false; } };

    root.querySelector('[data-proc-next]').addEventListener('click', () => go(i + 1));
    root.querySelector('[data-proc-prev]').addEventListener('click', () => go(i - 1));
    card.addEventListener('pointerenter', pause);
    card.addEventListener('pointerleave', resume);
    card.addEventListener('focusin', pause);
    card.addEventListener('focusout', resume);
    card.dataset.tone = slides[0].dataset.tone;
    paint(0);
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) { t0 = performance.now(); if (!raf) raf = requestAnimationFrame(tick); }
      else if (!paused) elapsed += performance.now() - t0;
    }, { threshold: 0.35 }).observe(root);
  });
})();
