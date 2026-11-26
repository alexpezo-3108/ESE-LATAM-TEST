/* Detalle de producto: capacidad (actualiza características) + color (cambia la foto) */

(() => {
  const root = document.querySelector('[data-pd]');
  if (!root) return;
  const SPECS = {
    80: ['32 kg', '7,8 kg', 'Caucho macizo Ø 200 mm'], 120: ['48 kg', '9,5 kg', 'Caucho macizo Ø 200 mm'],
    140: ['56 kg', '10,2 kg', 'Caucho macizo Ø 200 mm'], 180: ['72 kg', '11,5 kg', 'Caucho macizo Ø 200 mm'],
    240: ['96 kg', '12,8 kg', 'Caucho macizo Ø 200 mm'], 360: ['144 kg', '16,5 kg', 'Caucho macizo Ø 300 mm'],
  };
  const $$ = (s) => [...root.querySelectorAll(s)];
  const swap = (el, text) => { if (!el) return; el.classList.add('is-swapping'); setTimeout(() => { el.textContent = text; el.classList.remove('is-swapping'); }, 180); };
  const radio = (group, btn) => { group.forEach((b) => b.setAttribute('aria-checked', String(b === btn))); };
  const keys = (group, pick) => group.forEach((b, i) => b.addEventListener('keydown', (e) => {
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!d) return; e.preventDefault(); const n = group[(i + d + group.length) % group.length]; n.focus(); pick(n);
  }));

  const caps = $$('[data-cap]');
  const pickCap = (b) => {
    radio(caps, b);
    const c = +b.dataset.cap, sp = typeof window.__pdSpecs === 'function' ? window.__pdSpecs(+b.dataset.vi) : SPECS[c];
    if (sp) {
      swap(root.querySelector('[data-spec="load"]'), sp[0]);
      swap(root.querySelector('[data-spec="weight"]'), sp[1]);
      swap(root.querySelector('[data-spec="wheels"]'), sp[2]);
    }
    // Cada capacidad tiene su propia foto por color (y puede no tener todos los colores)
    if (window.__pdVariant) window.__pdVariant(b);
    let cur = root.querySelector('[data-color][aria-checked="true"]');
    if (!cur || cur.hidden) cur = root.querySelector('[data-color]:not([hidden])');
    if (cur && window.__pdPickColor) window.__pdPickColor(cur, true);
  };
  caps.forEach((b) => b.addEventListener('click', () => pickCap(b)));
  keys(caps, pickCap);

  const colors = $$('[data-color]'), name = root.querySelector('[data-color-name]');
  let img = root.querySelector('[data-pd-img]');
  const pickColor = (b, force) => {
    if (!force && b.getAttribute('aria-checked') === 'true') return;
    radio(colors, b);
    name.textContent = b.dataset.color;
    const src = b.dataset.img;
    const capBtn = root.querySelector('[data-cap][aria-checked="true"]');
    const alt = (window.__pdName || 'Contenedor 2 ruedas CL') + ' ' + (capBtn ? (capBtn.dataset.label || capBtn.dataset.cap + ' L') : '') + (b.dataset.color ? ', color ' + b.dataset.color.toLowerCase() : '');
    const apply = (el) => { el.srcset = src + '-400.webp 400w, ' + src + '-800.webp 800w'; el.src = src + '-800.webp'; };
    // Variante sin foto: placeholder en lugar de la imagen
    const ph = root.querySelector('[data-pd-ph]');
    if (!src) { root.querySelectorAll('.pd-img--next').forEach((n) => n.remove()); img.hidden = true; if (ph) ph.hidden = false; return; }
    if (img.hidden) { img.hidden = false; if (ph) ph.hidden = true; apply(img); img.alt = alt; return; }
    // Barrido diagonal: el nuevo color entra sobre el anterior desde la esquina superior izquierda
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !img.animate) { apply(img); img.alt = alt; return; }
    root.querySelectorAll('.pd-img--next').forEach((n) => n.remove());
    const next = img.cloneNode(false);
    next.removeAttribute('data-pd-img'); next.removeAttribute('id');
    next.classList.add('pd-img--next'); next.alt = ''; next.setAttribute('aria-hidden', 'true');
    next.style.clipPath = 'polygon(-40% -40%, -40% -40%, -40% -40%, -40% -40%)'; // oculto hasta que arranque el barrido (sin parpadeo)
    apply(next);
    img.after(next);
    const run = () => {
      const anim = next.animate(
        [{ clipPath: 'polygon(-40% -40%, -40% -40%, -40% -40%, -40% -40%)' }, { clipPath: 'polygon(-40% -40%, 320% -40%, 320% -40%, -40% 320%)' }],
        { duration: 700, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' });
      // El producto anterior se recorta con la misma diagonal: nunca se ven los dos superpuestos
      const out = img.animate(
        [{ clipPath: 'polygon(-40% -40%, 320% -40%, 320% 320%, -40% 320%, -40% -40%)' }, { clipPath: 'polygon(320% -40%, 320% -40%, 320% 320%, -40% 320%, -40% 320%)' }],
        { duration: 700, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' });
      // Al terminar, el clon pasa a ser la foto principal (sin volver a cargar la imagen → sin parpadeo)
      anim.onfinish = () => {
        const old = img;
        next.style.clipPath = ''; anim.cancel();
        next.classList.remove('pd-img--next'); next.removeAttribute('aria-hidden');
        next.setAttribute('data-pd-img', ''); if (old.id) next.id = old.id; next.alt = alt;
        img = next; old.remove();
      };
    };
    next.decode ? next.decode().then(run, run) : run();
  };
  window.__pdPickColor = pickColor;
  colors.forEach((b) => b.addEventListener('click', () => pickColor(b)));
  keys(colors, pickColor);

  /* Barra fija */
  const bar = document.querySelector('[data-pd-bar]'), actions = root.querySelector('.pd-actions');
  const barMeta = bar && bar.querySelector('[data-pd-bar-meta]'), barImg = bar && bar.querySelector('[data-pd-bar-img]');
  const syncBar = () => {
    if (!bar) return;
    const cap = root.querySelector('[data-cap][aria-checked="true"]'), col = root.querySelector('[data-color][aria-checked="true"]');
    barMeta.textContent = [cap && (cap.dataset.label || cap.dataset.cap + ' L'), col && col.dataset.color, window.__pdMat || 'HDPE virgen'].filter(Boolean).join(' · ');
    const s = col && col.dataset.img;
    if (s) { barImg.src = s + '-400.webp'; barImg.style.visibility = ''; } else barImg.style.visibility = 'hidden';
  };
  root.addEventListener('click', (e) => { if (e.target.closest('[data-cap], [data-color]')) setTimeout(syncBar, 0); });
  root.addEventListener('keydown', () => setTimeout(syncBar, 0));
  if (bar && actions && 'IntersectionObserver' in window) {
    let past = false, atFooter = false;
    const apply = () => {
      const show = past && !atFooter;
      bar.classList.toggle('is-visible', show);
      bar.setAttribute('aria-hidden', String(!show));
      bar.querySelectorAll('a').forEach((a) => { a.tabIndex = show ? 0 : -1; });
    };
    // El hero queda fijo (stack), así que "Cotizar" nunca sale de pantalla: la barra entra
    // cuando la sección de pruebas empieza a asomar por abajo
    const tests = document.querySelector('.s-tests');
    const check = () => {
      const r = tests ? tests.getBoundingClientRect() : actions.getBoundingClientRect();
      const on = tests ? r.top < window.innerHeight * 0.55 : r.bottom < 0;
      if (on !== past) { past = on; apply(); }
    };
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    check();
    const foot = document.querySelector('.site-footer');
    if (foot) new IntersectionObserver(([en]) => { atFooter = en.isIntersecting; apply(); }).observe(foot);
  }

  if (matchMedia('(hover: hover)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.addEventListener('pointermove', (e) => {
      root.style.setProperty('--mx', ((e.clientX / innerWidth) * 2 - 1).toFixed(3));
      root.style.setProperty('--my', ((e.clientY / innerHeight) * 2 - 1).toFixed(3));
    });
  }
})();

/* Tope del sticky: la base del bloque se alinea con el borde inferior de la pantalla */
(() => {
  const pd = document.querySelector('.pd-stack > .pd');
  if (!pd) return;
  const set = () => pd.style.setProperty('--pd-top', Math.min(0, window.innerHeight - pd.offsetHeight) + 'px');
  set();
  window.addEventListener('resize', set);
  if ('ResizeObserver' in window) new ResizeObserver(set).observe(pd);
})();

/* En terreno: centra verticalmente el bloque fijo de la izquierda */
(() => {
  const a = document.querySelector('.s-field__aside');
  if (!a) return;
  const set = () => {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--header-h').trim();
    const hh = (parseFloat(v) || 5) * (/px$/.test(v) ? 1 : 16);
    a.style.setProperty('--aside-top', Math.max(hh + 16, (innerHeight - a.offsetHeight) / 2) + 'px');
  };
  new ResizeObserver(set).observe(a);
  addEventListener('resize', set);
})();

/* Entrada de los hexágonos: aparecen uno a uno, en cadena, al cargar */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const hexes = [...document.querySelectorAll('.pd-hex > g')];
  if (!hexes.length || !hexes[0].animate) return;
  // Orden: del centro hacia afuera
  const box = document.querySelector('.pd-hex').getBBox?.();
  const cx = box ? box.x + box.width / 2 : 0, cy = box ? box.y + box.height / 2 : 0;
  const d = (g) => { try { const b = g.getBBox(); return Math.hypot(b.x + b.width / 2 - cx, b.y + b.height / 2 - cy); } catch { return 0; } };
  hexes.map((g) => [g, d(g)]).sort((a, b) => a[1] - b[1]).forEach(([g], i) => {
    g.animate([{ opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1.12, offset: 0.7 }, { opacity: 1, scale: 1 }], { duration: 550, delay: 350 + i * 70, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' });
  });
})();

/* Encendido de Características al entrar en pantalla (una vez por visita a la sección) */
(() => {
  const list = document.querySelector('.pd-specs');
  if (!list || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) {
      list.classList.remove('is-lit'); void list.offsetWidth;
      setTimeout(() => list.classList.add('is-lit'), 450);
    } else if (e.intersectionRatio === 0) list.classList.remove('is-lit');
  }), { threshold: [0, 0.6] });
  io.observe(list);
})();
