/* Circulogic — ciclo de vida: rueda que gira 72° por etapa */
(() => {
  document.querySelectorAll('[data-cycle]').forEach((root) => {
    const nodes = [...root.querySelectorAll('[data-cyc-node]')];
    const panels = [...root.querySelectorAll('[data-cyc-panel]')];
    const imgs = [...root.querySelectorAll('[data-cyc-img]')];
    const bgs = [...root.querySelectorAll('[data-cyc-bg]')];
    const segs = [...root.querySelectorAll('.cyc__seg')];
    const cur = root.querySelector('[data-cyc-current]');
    const arc = root.querySelector('.cyc__arc');
    const n = nodes.length;
    let index = 0;
    let steps = 0; // giro acumulado: la rueda siempre sigue el mismo sentido

    const render = (prev) => {
      root.dataset.stage = String(index + 1);
      nodes.forEach((el, k) => {
        el.style.setProperty('--a', (k - steps) * 72 + 'deg');
        el.classList.toggle('is-active', k === index);
      });
      bgs.forEach((el, k) => el.classList.toggle('is-active', k === index));
      imgs.forEach((el, k) => el.classList.toggle('is-active', k === index));
      segs.forEach((el, k) => el.classList.toggle('is-done', k <= index));
      panels.forEach((el, k) => {
        const on = k === index;
        el.classList.toggle('is-leaving', k === prev);
        el.classList.toggle('is-active', on);
        el.hidden = !on;
      });
      if (cur) cur.textContent = String(index + 1).padStart(2, '0');
      // Reinicia el trazo para que salga desde la nueva etapa activa
      if (arc) { arc.classList.remove('is-running'); void arc.getBoundingClientRect(); arc.classList.add('is-running'); }
    };

    // Enfriamiento: mientras dura la transición se ignoran clics/teclas/swipes extra
    const COOLDOWN = 800;
    let busy = false;
    const go = (dir) => {
      if (busy) return;
      busy = true;
      setTimeout(() => { busy = false; }, COOLDOWN);
      const prev = index;
      steps += dir;
      index = ((steps % n) + n) % n;
      render(prev);
    };

    root.querySelector('[data-cyc-prev]')?.addEventListener('click', () => go(-1));
    root.querySelector('[data-cyc-next]')?.addEventListener('click', () => go(1));
    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    });

    /* Swipe en táctil */
    let x0 = null;
    root.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') x0 = e.clientX; });
    root.addEventListener('pointerup', (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    });

    render();
  });
})();
