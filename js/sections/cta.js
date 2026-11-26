/* ==========================================================================
   CTA — el título se "enciende" palabra por palabra con el scroll
   [data-light-text] en el título; las palabras se envuelven en spans.
   ========================================================================== */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('[data-light-text]').forEach((title) => {
    // Envuelve cada palabra conservando <strong> u otro marcado inline
    const wrap = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const s = document.createElement('span');
            s.className = 's-cta__word';
            s.textContent = part;
            frag.append(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) wrap(n);
      });
    };
    wrap(title);
    const words = [...title.querySelectorAll('.s-cta__word')];
    const section = title.closest('section') || title;

    if (reduced) { words.forEach((w) => w.classList.add('is-lit')); return; }

    let ticking = false;
    const update = () => {
      ticking = false;
      const r = section.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 cuando la sección asoma al 85% del viewport, 1 cuando su centro llega al 45%
      const start = vh * 0.85;
      const end = vh * 0.45 - r.height / 2;
      const p = Math.min(1, Math.max(0, (start - r.top) / (start - end)));
      const lit = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('is-lit', i < lit));
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  });
})();
