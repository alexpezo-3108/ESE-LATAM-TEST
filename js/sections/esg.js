/* Método Circulogic: elegir un pilar expande su card y cambia el video (barrido izq → der) */
(() => {
  document.querySelectorAll('[data-esg]').forEach((root) => {
    const pillars = [...root.querySelectorAll('[data-pillar]')];
    const videos = [...root.querySelectorAll('[data-pillar-video]')];
    const btns = pillars.map((p) => p.querySelector('button'));
    let current = -1;
    const play = (i) => videos.forEach((v, j) => {
      const el = v.querySelector('video');
      if (!el) return;
      if (j === i) { el.preload = 'auto'; el.play().catch(() => {}); } else el.pause();
    });
    const select = (i, focus) => {
      if (i === current) return;
      current = i;
      pillars.forEach((p, j) => p.classList.toggle('is-active', j === i));
      btns.forEach((b, j) => { b.setAttribute('aria-selected', String(j === i)); b.tabIndex = j === i ? 0 : -1; });
      videos.forEach((v, j) => v.classList.toggle('is-active', j === i));
      root.querySelector('[role="tabpanel"]').setAttribute('aria-labelledby', 'pillar-tab-' + i);
      if (focus) btns[i].focus();
      if (visible) play(i);
    };
    btns.forEach((b, i) => {
      b.addEventListener('click', () => select(i));
      b.addEventListener('keydown', (e) => {
        const k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (k) { e.preventDefault(); select((current + k + btns.length) % btns.length, true); }
      });
    });
    let visible = false;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? play(current) : play(-1); }, { threshold: 0.25 }).observe(root);
    select(1);
  });
})();
