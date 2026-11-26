/* ==========================================================================
   Desafíos (sector) — [data-dc]
   Desktop: el progreso de scroll dentro de la sección fija elige el desafío activo.
   Mobile: flechas y swipe horizontal (el vertical sigue siendo scroll de página).
   ========================================================================== */
(() => {
  const root = document.querySelector('[data-dc]');
  if (!root) return;
  const track = root.querySelector('[data-dc-track]');
  const items = [...root.querySelectorAll('[data-dc-item]')];
  const N = items.length;
  const titles = [...root.querySelectorAll('[data-dc-title]')];
  const nums = [...root.querySelectorAll('[data-dc-num]')];
  const body = root.querySelector('[data-dc-body]');
  const pEl = root.querySelector('[data-dc-problem]');
  const sEl = root.querySelector('[data-dc-solution]');
  const cur = root.querySelector('[data-dc-cur]');
  const segSets = [root.querySelectorAll('.s-dc__bar .s-dc__seg'), root.querySelectorAll('.s-dc__msegs .s-dc__seg')];
  const prev = root.querySelector('[data-dc-prev]');
  const next = root.querySelector('[data-dc-next]');
  const mqDesk = matchMedia('(min-width: 64em)') // breakpoint global desktop/mobile;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
  const n2 = (i) => String(i + 1).padStart(2, '0');
  let idx = 0;

  /* Transiciones cortas e interrumpibles: se cancela lo que esté en curso y entra el nuevo directo */
  const stop = (el) => el.getAnimations && el.getAnimations().forEach((a) => a.cancel());
  /* Si el título no cabe sobre la imagen (desde su inicio fuera de ella hasta el borde del panel),
     se reduce lo justo, con mínimo 96px desktop / 72px laptop */
  const media = root.querySelector('.s-dc__media');
  const navy = root.querySelector('.s-dc__title--navy');
  const fitTitle = () => {
    media.style.setProperty('--dc-k', '1');
    if (!mqDesk.matches) return;
    const cs = getComputedStyle(root);
    const over = parseFloat(cs.getPropertyValue('--dc-over')) || 0;
    const fs = parseFloat(getComputedStyle(navy).fontSize) || 1;
    const min = (parseFloat(cs.getPropertyValue('--dc-title-min')) || 0) * parseFloat(getComputedStyle(document.documentElement).fontSize);
    const avail = over + media.clientWidth - 24;
    const w = navy.scrollWidth;
    if (w > avail) media.style.setProperty('--dc-k', Math.max(min / fs, avail / w).toFixed(4));
  };
  const swapTitle = (text, dir) => titles.forEach((el) => {
    stop(el);
    el.innerHTML = text.split('|').map((s) => s.replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]))).join('<br>');
    if (el === titles[0]) fitTitle();
    if (reduce.matches || !el.animate) return;
    el.animate([{ transform: `translateY(${dir > 0 ? 60 : -60}%)`, opacity: 0.2 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 200, easing: EASE });
  });
  const swapPanel = (it, dir) => {
    stop(body);
    pEl.textContent = it.dataset.problem;
    sEl.textContent = it.dataset.solution;
    if (reduce.matches || !body.animate) return;
    body.animate([{ opacity: 0, transform: `translateY(${dir > 0 ? 6 : -6}px)` }, { opacity: 1, transform: 'translateY(0)' }], { duration: 180, easing: EASE });
  };

  const set = (i, force) => {
    i = Math.max(0, Math.min(N - 1, i));
    if (i === idx && !force) return;
    const dir = i >= idx ? 1 : -1;
    idx = i;
    const it = items[i];
    items.forEach((b, k) => { b.classList.toggle('is-active', k === i); if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    swapTitle(it.dataset.title || it.querySelector('.s-dc__iname').textContent, dir);
    swapPanel(it, dir);
    nums.forEach((el) => { el.textContent = `.${n2(i)}`; });
    cur.textContent = n2(i);
    segSets.forEach((set) => set.forEach((s, k) => s.classList.toggle('is-on', k <= i)));
    prev.disabled = i === 0;
    next.disabled = i === N - 1;
  };

  /* ---------- Desktop: scroll → desafío activo ---------- */
  const fromScroll = () => {
    if (!mqDesk.matches) return;
    const r = track.getBoundingClientRect();
    const span = Math.max(1, r.height - innerHeight);
    const p = Math.min(0.9999, Math.max(0, -r.top / span));
    set(Math.floor(p * N));
  };
  let raf = 0;
  const onScroll = () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; fromScroll(); }); };
  addEventListener('scroll', onScroll, { passive: true });
  if (window.lenis && window.lenis.on) window.lenis.on('scroll', onScroll);

  items.forEach((b, i) => b.addEventListener('click', () => {
    if (!mqDesk.matches) { set(i); return; }
    const r = track.getBoundingClientRect();
    const span = r.height - innerHeight;
    const y = window.scrollY + r.top + span * ((i + 0.5) / N);
    if (window.lenis) window.lenis.scrollTo(y, { duration: 0.9 }); else window.scrollTo({ top: y, behavior: reduce.matches ? 'auto' : 'smooth' });
  }));

  /* ---------- Mobile: flechas + swipe horizontal ---------- */
  const go = (i) => set(i); // sin enfriamiento
  prev.addEventListener('click', () => go(idx - 1));
  next.addEventListener('click', () => go(idx + 1));
  root.querySelectorAll('[data-dc-swipe]').forEach((el) => {
    let sx = 0, sy = 0, down = false;
    el.addEventListener('pointerdown', (e) => { if (mqDesk.matches) return; down = true; sx = e.clientX; sy = e.clientY; });
    el.addEventListener('pointerup', (e) => {
      if (!down) return; down = false;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) go(idx + (dx < 0 ? 1 : -1));
    });
    el.addEventListener('pointercancel', () => { down = false; });
  });

  /* Panel mobile: alto fijo = el del desafío más largo, para que los controles no se muevan */
  const fixPanel = () => {
    body.style.minHeight = '';
    if (mqDesk.matches) return;
    const keep = [pEl.textContent, sEl.textContent];
    let max = 0;
    items.forEach((it) => { pEl.textContent = it.dataset.problem; sEl.textContent = it.dataset.solution; max = Math.max(max, body.offsetHeight); });
    [pEl.textContent, sEl.textContent] = keep;
    if (max > 0) body.style.minHeight = `${max}px`;
  };
  let rt;
  const apply = () => { fixPanel(); fitTitle(); fromScroll(); };
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(apply, 150); });
  mqDesk.addEventListener('change', apply);
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(apply);
  addEventListener('load', apply);
  if ('ResizeObserver' in window) { let w = 0; new ResizeObserver(([e]) => { const nw = Math.round(e.contentRect.width); if (nw && nw !== w) { w = nw; fixPanel(); } }).observe(body); }
  set(0, true);
  apply();
})();
