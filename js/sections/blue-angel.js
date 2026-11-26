/* ==========================================================================
   Estándar Blue Angel — las etapas rotan por el arco (automático + clic)
   ========================================================================== */
(() => {
  const root = document.querySelector('[data-ba]');
  if (!root) return;
  const steps = [...root.querySelectorAll('[data-ba-step]')];
  const n = steps.length;
  const cap = root.querySelector('.s-ba__caption'), nameEl = root.querySelector('[data-ba-name]'), descEl = root.querySelector('[data-ba-desc]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // offset respecto a la activa → slot: las etapas previas quedan a la izquierda y las siguientes a la derecha
  // (como el arco: reciclaje → control → fabricación → serie → inspección). Al avanzar, la siguiente entra al centro desde la derecha.
  const SLOT = { [n - 2]: 0, [n - 1]: 1, 0: 2, 1: 3, 2: 4 };
  let active = 2, timer = null, inView = false, hover = false;

  const layout = (first) => {
    steps.forEach((s, i) => {
      const off = (i - active + n) % n;
      const slot = SLOT[off];
      const prev = s.dataset.slot;
      // la que pasa del extremo izquierdo al derecho no cruza el arco: aparece directo
      // se desvanece en su lugar, salta al otro extremo sin desplazarse y reaparece
      if (!first && prev === '0' && slot === 4) {
        s.classList.add('is-fading');
        setTimeout(() => {
          s.classList.add('is-wrapping'); s.dataset.slot = slot; void s.offsetWidth;
          s.classList.remove('is-fading');
          requestAnimationFrame(() => requestAnimationFrame(() => s.classList.remove('is-wrapping')));
        }, 380);
      } else s.dataset.slot = slot;
      s.querySelector('button').setAttribute('aria-current', String(off === 0));
    });
    const s = steps[active];
    const write = () => { nameEl.textContent = s.dataset.name; descEl.textContent = s.dataset.desc; cap.classList.remove('is-swapping'); };
    if (first) write(); else { cap.classList.add('is-swapping'); setTimeout(write, 300); }
  };
  const pulse = root.querySelector('[data-ba-pulse]'), chev = root.querySelector('[data-ba-chev]');
  const sweep = () => {
    if (reduced || !pulse.animate) return;
    pulse.animate([
      { strokeDashoffset: 0.14, opacity: 0 },
      { opacity: 1, offset: 0.15 },
      { opacity: 1, offset: 0.8 },
      { strokeDashoffset: -1.06, opacity: 0 },
    ], { duration: 1100, easing: 'cubic-bezier(0.45, 0, 0.25, 1)' });
    chev.animate([
      { transform: 'translateX(0)', opacity: 1 },
      { transform: 'translateX(10px)', opacity: 0.4, offset: 0.45 },
      { transform: 'translateX(0)', opacity: 1 },
    ], { duration: 900, delay: 300, easing: 'ease-in-out' });
  };
  const go = (i) => { active = (i + n) % n; layout(false); sweep(); };
  const tick = () => go(active + 1);
  const play = () => { clearInterval(timer); if (!reduced && inView && !hover) timer = setInterval(tick, 3800); };

  steps.forEach((s, i) => s.querySelector('button').addEventListener('click', () => { if (i !== active) { go(i); play(); } }));
  root.addEventListener('pointerenter', () => { hover = true; clearInterval(timer); });
  root.addEventListener('pointerleave', () => { hover = false; play(); });
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; inView ? play() : clearInterval(timer); }, { threshold: 0.35 }).observe(root);
  layout(true);
})();
