/* Preloader integrado: máscara SVG en grilla sobre el hero real (#pl-clip).
   Carga real → celdas que se abren en orden aleatorio, % y países → al 100 % la
   grilla se une y se expande a pantalla completa → 'preloader:done' (entra el texto). */
(() => {
  const root = document.documentElement;
  const pre = document.querySelector('[data-preloader]');
  const svgClip = document.getElementById('pl-clip');
  const hero = document.querySelector('.s-hero--scene');
  const scene = hero && hero.querySelector('.s-hero__scene');
  const cleanup = () => { if (pre) pre.remove(); const s = svgClip && svgClip.closest('svg'); if (s) s.remove(); };
  if (!pre || !root.classList.contains('is-intro') || !scene) { root.classList.remove('is-intro'); cleanup(); return; }
  pre.classList.add('is-active');
  scrollTo(0, 0);

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = matchMedia('(max-width: 47.99em)').matches;
  const num = pre.querySelector('.preloader__num');
  const countries = [...pre.querySelectorAll('.preloader__list li')];
  const COLS = mobile ? 4 : 5, ROWS = mobile ? 6 : 4, N = COLS * ROWS;
  const NS = 'http://www.w3.org/2000/svg';
  const rects = [], veils = [];
  const veil = document.createElementNS(NS, 'svg');
  veil.setAttribute('class', 'preloader__veil'); veil.setAttribute('aria-hidden', 'true');
  pre.insertBefore(veil, pre.firstChild);
  for (let i = 0; i < N; i++) {
    const r = document.createElementNS(NS, 'rect'); svgClip.appendChild(r); rects.push(r);
    const v = document.createElementNS(NS, 'rect'); veil.appendChild(v); veils.push(v);
  }
  const order = rects.map((_, i) => i).sort(() => Math.random() - 0.5);
  const born = new Array(N).fill(-1);   // momento en que se abrió cada celda


  // Miniatura de la escena completa: misma proporción que la ventana del hero,
  // centrada en el espacio libre entre el logo (arriba) y el % / países (abajo)
  const sceneSize = () => ({ w: scene.offsetWidth || innerWidth, h: scene.offsetHeight || innerHeight });
  const gridBox = () => {
    const W = innerWidth, H = innerHeight, { w: sw, h: sh } = sceneSize(), ar = sw / sh;
    const top = mobile ? 5.5 * 16 : 6 * 16, bottom = H - (mobile ? 13 : 11) * 16;
    const w = Math.min(mobile ? W - 48 : W * 0.5, (bottom - top) * ar), h = w / ar;
    return { x: (W - w) / 2, y: top + (bottom - top - h) / 2, w, h };
  };
  scene.style.transformOrigin = '0 0';
  const GAP0 = mobile ? 6 : 8;
  let gap = GAP0, rad = 8, outer = 8, expand = 0, pre_s = 1;
  // Contorno redondeado de toda la imagen (intersección con las celdas): conserva las esquinas
  // exteriores aunque las celdas pierdan su radio al unirse, y se reduce a 0 al posarse
  const round = document.querySelector('#pl-round rect');
  const lerp = (a, b, t) => a + (b - a) * t;
  const draw = (now) => {
    const hr = hero.getBoundingClientRect();
    const { w: sw, h: sh } = sceneSize();
    const g = gridBox(), full = { x: hr.left, y: hr.top, w: sw, h: sh };
    const B = { x: lerp(g.x, full.x, expand), y: lerp(g.y, full.y, expand), w: lerp(g.w, full.w, expand), h: lerp(g.h, full.h, expand) };
    const s = B.w / sw;                                   // escala uniforme de toda la escena
    scene.style.transform = `translate3d(${(B.x - hr.left).toFixed(2)}px, ${(B.y - hr.top).toFixed(2)}px, 0) scale(${s.toFixed(5)})`;
    // todo lo que sigue, en px de pantalla relativos a B → local = pantalla / s
    const cw = (B.w - gap * (COLS - 1)) / COLS, ch = (B.h - gap * (ROWS - 1)) / ROWS;
    if (round) {
      round.setAttribute('x', 0); round.setAttribute('y', 0);
      round.setAttribute('width', sw.toFixed(1)); round.setAttribute('height', sh.toFixed(1));
      round.setAttribute('rx', (outer / s).toFixed(2));
    }
    rects.forEach((r, i) => {
      const c = i % COLS, rw = Math.floor(i / COLS);
      const t0 = born[i];
      const k = t0 < 0 ? 0 : Math.min(1, (now - t0) / CELL);
      const e = 1 - Math.pow(1 - k, 4);
      const f = 1 - Math.pow(1 - Math.min(1, k * 1.15), 2);
      const w = cw * e + (e > 0 ? 0.6 : 0), h = ch * e + (e > 0 ? 0.6 : 0);
      const x = c * (cw + gap) + (cw - w) / 2, y = rw * (ch + gap) + (ch - h) / 2;   // relativos a B
      r.setAttribute('x', (x / s).toFixed(2)); r.setAttribute('y', (y / s).toFixed(2));
      r.setAttribute('width', (Math.max(0, w) / s).toFixed(2)); r.setAttribute('height', (Math.max(0, h) / s).toFixed(2));
      r.setAttribute('rx', ((rad * e) / s).toFixed(2));
      const v = veils[i];
      if (f >= 1 || t0 < 0) { if (v.getAttribute('opacity') !== '0') v.setAttribute('opacity', '0'); }
      else {
        v.setAttribute('x', (B.x + x).toFixed(1)); v.setAttribute('y', (B.y + y).toFixed(1));
        v.setAttribute('width', Math.max(0, w).toFixed(1)); v.setAttribute('height', Math.max(0, h).toFixed(1));
        v.setAttribute('rx', (rad * e).toFixed(1)); v.setAttribute('opacity', (1 - f).toFixed(3));
      }
    });
  };

  // Carga real del hero (y nada más): sus imágenes decodificadas (cielo, skyline, nubes,
  // isla, hojas, aves), las fuentes y los scripts diferidos (hero.js, hero-birds.js…).
  // No espera al resto del Home: eso se precarga después, en segundo plano.
  const imgs = [...hero.querySelectorAll('img')];
  const total = imgs.length + 2; let loaded = 0;
  const tick = () => { loaded++; };
  const ready = (im) => (im.decode ? im.decode().catch(() => {}) : Promise.resolve()).then(tick);
  imgs.forEach((im) => { if (im.complete) ready(im); else { im.addEventListener('load', () => ready(im), { once: true }); im.addEventListener('error', tick, { once: true }); } });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(tick);
  if (document.readyState !== 'loading') tick(); else addEventListener('DOMContentLoaded', tick, { once: true }); // scripts diferidos ejecutados
  const MAX = 4000;   // tope: con conexión lenta entra al hero con lo que ya cargó

  if (window.lenis) window.lenis.stop();
  const t0 = performance.now(), MIN = reduce ? 0.4 : 1.85;  // mínimo para que se aprecie el llenado (s)
  const CELL = 750;                                          // aparición de cada celda (ms)
  let lastT = t0;
  let cur = 0, shown = -1, phase = 'load', joinAt = 0, expAt = 0;
  const bez = (x1, y1, x2, y2) => (x) => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    let t = x; for (let i = 0; i < 8; i++) { const f = ((ax * t + bx) * t + cx) * t - x, d = (3 * ax * t + 2 * bx) * t + cx; if (Math.abs(f) < 1e-5 || !d) break; t -= f / d; }
    return ((ay * t + by) * t + cy) * t;
  };
  const ease = bez(0.83, 0, 0.17, 1);       // ease-in-out-quint: arranca suave, acelera, se posa lento
  const soft = (t) => 1 - Math.pow(1 - t, 2);
  const JOIN = 260, BREATH = 100, EXP = 800;      // tiempo 1 (unión) · micro-respiro · tiempo 2 (expansión) ≈ 1,16 s

  const frame = (now) => {
    if (phase === 'load') {
      const target = (loaded >= total || now - t0 >= MAX) ? 1 : Math.min(0.97, loaded / total);
      // Avance continuo y parejo: sigue a la carga real pero con velocidad máxima limitada,
      // así nunca salta aunque los recursos terminen de golpe (celdas, % y países juntos)
      const dt = Math.min(64, now - lastT); lastT = now;
      const cap = Math.min(1, (now - t0) / 1000 / MIN);
      const goal = Math.min(cap, target);
      const vmax = (dt / 1000) / MIN * 1.25;
      cur = Math.min(goal, cur + Math.min(vmax, Math.max(0, goal - cur)));
      const p = Math.round(cur * 100);
      if (p !== shown) {
        shown = p; num.textContent = p;
        const n = Math.round(cur * N);
        order.forEach((idx, i) => { if (i < n && born[idx] < 0) born[idx] = now; });
        const k = Math.round(cur * countries.length);
        countries.forEach((li, i) => li.classList.toggle('is-on', i < k));
      }
      if (cur >= 1 && (reduce || born.every((b) => b >= 0 && now - b >= CELL))) { if (reduce) { finish(true); return; } phase = 'hold'; joinAt = now; pre.classList.add('is-done'); root.classList.add('is-pl-reveal'); }
    } else if (phase === 'hold') {
      // Tiempo 1: la grilla (a su tamaño, sin encogerse) cierra espacios y esquinas → una sola imagen
      const k = Math.min(1, (now - joinAt) / JOIN), s = ease(k);
      gap = GAP0 * (1 - s); rad = 8 * (1 - s);
      if (now - joinAt >= JOIN + BREATH) { phase = 'expand'; expAt = now; }   // micro-respiro como una sola imagen
    } else if (phase === 'expand') {
      // Tiempo 2: la imagen se expande a pantalla completa y se posa
      const k = Math.min(1, (now - expAt) / EXP), e = ease(k);
      expand = e; gap = 0; rad = 0; outer = 8 * (1 - e);   // las esquinas se cuadran recién al posarse
      if (k >= 0.86 && !window.__preDone) { window.__preDone = true; dispatchEvent(new Event('preloader:done')); }  // el texto entra en la desaceleración final
      if (k >= 1) { finish(false); return; }
    }
    if (!reduce) draw(now);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  // Después del preloader: precarga en segundo plano (prioridad baja) del resto de imágenes
  // del Home, que en el HTML ya son loading="lazy". Mismo srcset/sizes → mismo archivo WebP en caché.
  const warm = () => {
    const queue = [...document.querySelectorAll('main img[loading="lazy"]')].filter((im) => !im.complete && !hero.contains(im));
    const idle = window.requestIdleCallback || ((f) => setTimeout(() => f({ timeRemaining: () => 8 }), 200));
    const step = (dl) => {
      while (queue.length && dl.timeRemaining() > 2) {
        const src = queue.shift(), im = new Image();
        im.fetchPriority = 'low'; im.decoding = 'async';
        if (src.sizes) im.sizes = src.sizes;
        if (src.srcset) im.srcset = src.srcset; else im.src = src.currentSrc || src.src;
      }
      if (queue.length) idle(step);
    };
    idle(step);
  };
  let ended = false;
  function finish(fade) {
    if (ended) return; ended = true;
    try { sessionStorage.setItem('ese-intro', '1'); } catch (e) {}
    pre.classList.add('is-done', 'is-out');
    const release = () => {
      scene.style.transform = ''; scene.style.transformOrigin = '';
      root.classList.remove('is-intro', 'is-pl-reveal');   // quita máscara y fondo azul; aparece el navbar
      if (window.lenis) window.lenis.start();
      if (!window.__preDone) { window.__preDone = true; dispatchEvent(new Event('preloader:done')); }
      window.__preEnd = true;
      dispatchEvent(new Event('preloader:end'));            // imagen expandida y hero posado
      setTimeout(cleanup, 600);
      setTimeout(warm, 800);
    };
    if (fade) setTimeout(release, reduce ? 450 : 0); else requestAnimationFrame(release); // suelta la máscara un frame después de cubrir todo
  }
  // Sin «Saltar intro»: el scroll no hace nada mientras dura el preloader
  const block = (e) => { if (!ended) e.preventDefault(); };
  const KEYS = new Set([' ', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End']);
  const blockKey = (e) => { if (!ended && KEYS.has(e.key)) e.preventDefault(); };
  addEventListener('wheel', block, { passive: false });
  addEventListener('touchmove', block, { passive: false });
  addEventListener('keydown', blockKey);
  addEventListener('preloader:end', () => {
    removeEventListener('wheel', block); removeEventListener('touchmove', block); removeEventListener('keydown', blockKey);
  }, { once: true });
})();
