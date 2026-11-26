/* ==========================================================================
   Hero del home — escena por capas [data-hero-scene]
   · Entrada única: cielo y nubes → isla emerge → (textos vía data-reveal)
   · Parallax de mouse (solo desktop/laptop con puntero fino) por profundidad
   · Parallax de scroll: data-sy (factor del scroll) y data-ox/oy (apertura
     hacia los bordes al salir del hero, en px)
   · Loops en CSS; se pausan cuando el hero sale de pantalla
   Solo se animan transform y opacity.
   ========================================================================== */
(() => {
  const hero = document.querySelector('.s-hero--scene');
  const scene = hero && hero.querySelector('[data-hero-scene]');
  if (!scene) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(min-width: 64em) and (hover: hover) and (pointer: fine)');
  const layers = [...scene.querySelectorAll('.hl')].map((el) => ({
    el,
    d: parseFloat(el.dataset.depth) || 0,
    sy: parseFloat(el.dataset.sy) || 0,
    ox: parseFloat(el.dataset.ox) || 0,
    oy: parseFloat(el.dataset.oy) || 0,
    last: '',
  }));

  /* ---------- Entrada (una sola vez) ---------- */
  const island = scene.querySelector('[data-hero-island]');
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    void hero.offsetWidth; // fija el estado inicial antes de transicionar
    hero.classList.add('is-entered');
    if (reduce.matches) { hero.classList.add('is-falls', 'is-loops'); return; }
    setTimeout(() => hero.classList.add('is-falls'), 1200);   // la cascada arranca cuando la isla se asentó
    setTimeout(() => hero.classList.add('is-loops'), 2200);   // loops ambientales tras la entrada
  };
  // Volver al Home en la misma sesión: todo ya está en su lugar, como cualquier interna
  if (document.documentElement.classList.contains('is-return')) {
    hero.classList.add('is-entered', 'is-falls', 'is-loops'); started = true;
    const drop = () => setTimeout(() => document.documentElement.classList.remove('is-return'), 1000);
    if (document.readyState === 'complete') drop(); else addEventListener('load', drop, { once: true });
  }
  const boot = () => { if (island && island.decode) island.decode().then(start, start); else start(); setTimeout(start, 900); };
  if (document.documentElement.classList.contains('is-intro') && !window.__preDone) addEventListener('preloader:done', boot, { once: true }); else boot();
  const float = () => { if (!reduce.matches) hero.classList.add('is-floating'); };
  if (document.documentElement.classList.contains('is-intro') && !window.__preEnd) addEventListener('preloader:end', float, { once: true }); else float();

  /* ---------- Parallax ---------- */
  let mx = 0, my = 0, tx = 0, ty = 0, raf = 0, visible = true;
  const mobQ = matchMedia('(max-width: 63.99em)');
  const onMove = (e) => {
    if (!fine.matches || reduce.matches) return;
    const r = hero.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    kick();
  };
  const onLeave = () => { tx = 0; ty = 0; kick(); };

  const frame = () => {
    raf = 0;
    if (reduce.matches) { layers.forEach((l) => { if (l.last) { l.el.style.transform = ''; l.last = ''; } }); return; }
    mx += (tx - mx) * 0.06;
    my += (ty - my) * 0.06;
    const y = Math.max(0, window.scrollY);
    const H = hero.offsetHeight || innerHeight;
    const p = Math.min(1, y / H);
    const mob = mobQ.matches;
    layers.forEach((l) => {
      const x = -mx * l.d + l.ox * p;
      // Mobile: las nubes del frente (sy < 0) no suben al scrollear → siempre pegadas al borde inferior, sin hueco
      const sy = mob && l.sy < 0 ? 0 : l.sy;
      const yy = -my * l.d + y * sy + l.oy * p;
      const t = `translate3d(${x.toFixed(2)}px, ${yy.toFixed(2)}px, 0)`;
      if (t !== l.last) { l.el.style.transform = t; l.last = t; }
    });
    if (Math.abs(tx - mx) > 0.002 || Math.abs(ty - my) > 0.002) kick();
  };
  const kick = () => { if (!raf && visible) raf = requestAnimationFrame(frame); };

  hero.addEventListener('pointermove', onMove, { passive: true });
  hero.addEventListener('pointerleave', onLeave);
  addEventListener('scroll', kick, { passive: true });
  if (window.lenis && window.lenis.on) window.lenis.on('scroll', kick);
  addEventListener('resize', kick);
  reduce.addEventListener('change', kick);
  kick(); // las capas llevan transform desde el primer frame (sin cambio de capa al terminar la intro)

  /* ---------- Pausa fuera de pantalla ---------- */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      hero.classList.toggle('is-off', !visible);
      if (visible) kick();
    }).observe(hero);
  }
  kick();

  /* Contador de la tarjeta «100 %»: sube rápido (0 → 100 en ~0,9 s) justo cuando la tarjeta entra */
  const num = hero.querySelector('[data-hero-count]');
  const card = num && num.closest('[data-reveal]');
  if (num && card) {
    const to = parseFloat(num.dataset.heroCount) || 0;
    const set = (v) => { num.textContent = Math.round(v) + '%'; };
    if (reduce.matches || document.documentElement.classList.contains('is-return')) set(to);
    else {
      let started = false;
      const run = () => {
        if (started) return; started = true;
        const t0 = performance.now() + 150, D = 900;
        const step = (now) => {
          const k = Math.min(1, Math.max(0, (now - t0) / D));
          set(to * (1 - Math.pow(1 - k, 3)));
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      };
      const on = () => card.classList.contains('is-revealing') || card.classList.contains('is-revealed');
      if (on()) run();
      else {
        const mo = new MutationObserver(() => { if (on()) { mo.disconnect(); run(); } });
        mo.observe(card, { attributes: true, attributeFilter: ['class'] });
      }
      // red de seguridad: si la tarjeta nunca se revela, igual cuenta (nunca se queda en 0 %)
      const late = () => setTimeout(run, 3000);
      if (document.documentElement.classList.contains('is-intro') && !window.__preEnd) addEventListener('preloader:end', late, { once: true }); else late();
    }
  }
})();
