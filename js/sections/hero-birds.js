/* Aves del hero: animación Lottie «Bird Flock» (Richard Sahala Hartanto · LottieFiles,
   Lottie Simple License) reproducida con lottie-web (renderer SVG, admite sus capas 3D).
   Color por ave según el fondo: azul atmosférico sobre el cielo, oscuro sobre la isla/edificios; opacidad 85 %.
   · Bandada principal (14 aves + 2 rezagadas) + 1–2 bandadas pequeñas que la siguen
     justo después, un poco más abajo, con retraso, tamaño y altura distintos en cada pasada (orgánico).
   · Primera pasada ~0,5 s después de que el hero se posa; luego una nueva 5 s después de cada cruce.
   · Cruzan de izquierda a derecha por delante de la isla, a la altura de sus edificios.
   · Se pausa cuando el hero sale de pantalla. Con movimiento reducido no hay aves. */
(() => {
  const main = document.querySelector('[data-flock]');
  const hero = main && main.closest('.s-hero');
  if (!main || !window.lottie || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const mob = matchMedia('(max-width: 63.99em)');
  const rnd = (a, b) => a + Math.random() * (b - a);
  const load = (container, file) => lottie.loadAnimation({
    container, renderer: 'svg', loop: true, autoplay: false,
    path: 'assets/lottie/' + (file || 'bird-flock') + '.json',
    rendererSettings: { preserveAspectRatio: 'xMidYMid meet', progressiveLoad: true },
  });
  const part = (parent, k) => { const d = document.createElement('div'); d.className = 's-hero__flock-part s-hero__flock-part--' + k; parent.appendChild(d); return d; };

  // Bandada = un contenedor que cruza + una o más instancias Lottie dentro
  const makeFlock = (el, keys) => {
    const anims = keys.map((k) => load(part(el, k), k === 'c' ? 'bird-pair' : null));
    return {
      el, anims, pass: null,
      loaded: () => anims.every((a) => a.isLoaded),
      onLoaded: (fn) => { let n = 0; anims.forEach((a) => (a.isLoaded ? ++n : a.addEventListener('DOMLoaded', () => { if (++n === anims.length) fn(); }))); if (n === anims.length) fn(); },
      play() { anims.forEach((a) => a.play()); }, pause() { anims.forEach((a) => a.pause()); },
      start() {
        anims.forEach((a, i) => { a.setSpeed(rnd(0.6, 0.78)); a.goToAndPlay(Math.floor(rnd(0, a.totalFrames || 180) + i * 70) % (a.totalFrames || 180), true); });
      },
    };
  };
  // Bandadas que siguen a la principal (2), creadas junto a ella
  const trails = [0, 1].map(() => {
    const d = document.createElement('div');
    d.className = 's-hero__flock s-hero__flock--trail'; d.setAttribute('aria-hidden', 'true');
    main.parentNode.appendChild(d);
    return makeFlock(d, ['a']);
  });
  const A = makeFlock(main, ['a', 'b', 'c']);   // 14 aves + 2 rezagadas detrás

  let timer = 0, trailTimers = [], visible = true, waiting = 0;
  const cross = (f, y0, scale, dur) => {
    const W = hero.clientWidth, size = f.el.offsetWidth;
    const y1 = y0 - hero.clientHeight * rnd(0, 0.012);   // subida mínima durante el cruce
    f.start();
    // Cada subgrupo deriva por su cuenta durante el cruce (se adelanta, se atrasa, sube o baja)
    f.el.querySelectorAll('.s-hero__flock-part').forEach((p) => {
      const dx = () => (rnd(-0.45, 0.45) * size).toFixed(1), dy = () => (rnd(-0.05, 0.05) * size).toFixed(1);   // deriva vertical casi imperceptible
      p.animate([
        { transform: 'translate(0, 0)' },
        { transform: `translate(${dx()}px, ${dy()}px)`, offset: rnd(0.3, 0.5) },
        { transform: `translate(${dx()}px, ${dy()}px)`, offset: rnd(0.65, 0.8) },
        { transform: `translate(${dx()}px, ${dy()}px)` },
      ], { duration: dur, easing: 'ease-in-out', fill: 'both' });
    });
    f.pass = f.el.animate([
      { transform: `translate3d(${-size}px, ${y0}px, 0) scale(${scale})`, opacity: 0 },
      { opacity: 0.85, offset: 0.08 },
      { opacity: 0.85, offset: 0.92 },
      { transform: `translate3d(${W + size * 0.2}px, ${y1}px, 0) scale(${scale * rnd(1, 1.08)})`, opacity: 0 },
    ], { duration: dur, easing: 'linear', fill: 'both' });
    return f.pass;
  };

  const fly = () => {
    if (!visible) { waiting = 1; return; }
    const H = hero.clientHeight, size = main.offsetWidth;
    const isl = hero.querySelector('[data-hero-island]');
    const ir = isl ? isl.getBoundingClientRect() : null, hr = hero.getBoundingClientRect();
    const islTop = ir ? ir.top - hr.top + ir.height * (mob.matches ? 0.17 : 0.15) : H * 0.35;
    const y0 = Math.max(H * 0.1, islTop + size * rnd(-0.2, 0.3) - size / 2);
    if (A.pass) { schedule(1500); return; }   // la principal todavía en vuelo: reintenta pronto
    const dur = mob.matches ? rnd(9400, 11000) : rnd(12700, 15400);   // desktop: más lentas
    watch();
    cross(A, y0, rnd(0.88, 1), dur).onfinish = () => { A.pause(); A.pass = null; };
    // Desktop: flujo más constante → la siguiente bandada sale mientras esta aún cruza
    schedule(mob.matches ? dur + 5000 : dur * rnd(0.55, 0.7));
    // Flujo: 1–2 bandadas pequeñas justo después, más abajo, con retraso/tamaño/ritmo propios
    trailTimers.forEach(clearTimeout); trailTimers = [];
    let t = rnd(900, 2800);
    trails.forEach((T, i) => {
      if (i > 0 && Math.random() < (mob.matches ? 0.3 : 0.1)) return;              // a veces solo pasa una
      const delay = t; t += rnd(800, 2600);
      trailTimers.push(setTimeout(() => {
        if (!visible || T.pass) return;
        const y = y0 + size * (i ? rnd(0.1, 0.5) : rnd(0.45, 0.9));
        watch();
        cross(T, y, rnd(0.55, 0.78), dur * rnd(0.82, 1.15)).onfinish = () => { T.pause(); T.pass = null; };
      }, delay));
    });
  };
  const schedule = (ms) => { clearTimeout(timer); timer = setTimeout(fly, ms); };

  /* ---------- Color según el fondo de cada ave ----------
     Mapa de opacidad de la isla y del skyline (mismo origen → se puede leer el canvas).
     Ave sobre píxeles opacos de esas capas = edificios/isla → tono oscuro; si no, cielo → azul. */
  const SKY = '#4F75A3', DARK = '#33455E';
  const maps = [hero.querySelector('[data-hero-island]'), hero.querySelector('.hl--skyline img')].filter(Boolean).map((img) => {
    const m = { img, data: null, w: 0, h: 0 };
    const build = () => {
      try {
        m.w = 320; m.h = Math.round(320 * img.naturalHeight / img.naturalWidth);
        const cv = document.createElement('canvas'); cv.width = m.w; cv.height = m.h;
        const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0, m.w, m.h);
        m.data = cx.getImageData(0, 0, m.w, m.h).data;
      } catch (e) { m.data = null; }
    };
    if (img.complete && img.naturalWidth) build(); else img.addEventListener('load', build, { once: true });
    return m;
  });
  const solidAt = (x, y) => maps.some((m) => {
    if (!m.data) return false;
    const r = m.img.getBoundingClientRect();
    if (x < r.left || x > r.right || y < r.top || y > r.bottom) return false;
    const px = Math.floor((x - r.left) / r.width * m.w), py = Math.floor((y - r.top) / r.height * m.h);
    return m.data[(py * m.w + px) * 4 + 3] > 140;
  });
  let tint = 0, lastTint = 0;
  const recolor = (now) => {
    const flocks = [A, ...trails].filter((f) => f.pass);
    if (!flocks.length) { tint = 0; return; }
    if (now - lastTint > 110) {
      lastTint = now;
      flocks.forEach((f) => f.el.querySelectorAll('svg > g > g').forEach((g) => {
        if (!g.dataset.bird) g.dataset.bird = '1';
        const r = g.getBoundingClientRect();
        if (!r.width) return;
        const c = solidAt(r.left + r.width / 2, r.top + r.height / 2) ? DARK : SKY;
        if (g.dataset.bc !== c) { g.dataset.bc = c; g.style.setProperty('--bc', c); }
      }));
    }
    tint = requestAnimationFrame(recolor);
  };
  const watch = () => { if (!tint) tint = requestAnimationFrame(recolor); };

  // Pausa fuera de pantalla (animaciones y pasadas en curso)
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      [A, ...trails].forEach((f) => { if (f.pass) { if (visible) { f.pass.play(); f.play(); } else { f.pass.pause(); f.pause(); } } });
      if (visible) watch(); else if (tint) { cancelAnimationFrame(tint); tint = 0; }
      if (!A.pass && visible && waiting) { waiting = 0; schedule(1200); }
    }).observe(hero);
  }

  // Primera pasada: ~0,5 s después de que el hero se posa (tras el preloader o carga directa)
  const ready = () => { let n = 0; const all = [A, ...trails]; all.forEach((f) => f.onLoaded(() => { if (++n === all.length) schedule(500); })); };
  if (document.documentElement.classList.contains('is-intro') && !window.__preEnd) addEventListener('preloader:end', ready, { once: true });
  else if (hero.classList.contains('is-entered')) ready();
  else {
    const mo = new MutationObserver(() => { if (hero.classList.contains('is-entered')) { mo.disconnect(); ready(); } });
    mo.observe(hero, { attributes: true, attributeFilter: ['class'] });
  }
})();
