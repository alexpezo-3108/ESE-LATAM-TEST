/* ==========================================================================
   Pruebas de rigurosidad — selector de videos [data-tests]
   ========================================================================== */
/* Pruebas de rigurosidad */
(() => {
  const box = document.querySelector('[data-tests]');
  if (!box) return;
  const tabs = [...box.querySelectorAll('[data-test]')], count = box.querySelector('[data-tests-count]'), video = box.querySelector('[data-tests-video]');
  const mobile = matchMedia('(max-width: 47.99em)');
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  /* Partículas: deriva lenta y aleatoria; al cambiar de prueba aceleran (también aleatorio) y vuelven a calmarse */
  const layer = document.createElement('div'); layer.className = 'pd-video__dots'; layer.setAttribute('aria-hidden', 'true');
  const R = (a, b) => a + Math.random() * (b - a);
  const COLORS = ['#66C5EC', '#66C5EC', '#009FDF', '#FFFFFF'];
  const dots = Array.from({ length: 34 }, () => {
    const el = document.createElement('span'); el.className = 'pd-dot';
    el.style.setProperty('--s', R(2, 7) + 'px'); el.style.setProperty('--c', COLORS[Math.floor(R(0, 4))]); el.style.setProperty('--a', R(0.45, 0.95).toFixed(2));
    layer.appendChild(el);
    const ang = R(0, Math.PI * 2), sp = R(6, 16);
    return { el, x: Math.random(), y: Math.random(), ang, sp, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp };
  });
  video.prepend(layer);
  let W = 0, H = 0, boost = 0, last = 0, raf = 0, onScreen = false;
  const measure = () => { W = video.clientWidth; H = video.clientHeight; };
  const tick = (t) => {
    const dt = Math.min((t - (last || t)) / 1000, 0.05); last = t;
    boost *= Math.exp(-dt * 1.8);
    const mult = 1 + boost;
    dots.forEach((d) => {
      d.ang += R(-1.6, 1.6) * dt * (1 + boost * 0.4);
      const tx = Math.cos(d.ang) * d.sp * mult, ty = Math.sin(d.ang) * d.sp * mult;
      const k = Math.min(1, dt * (boost > 1 ? 14 : 3)); d.vx += (tx - d.vx) * k; d.vy += (ty - d.vy) * k;
      let px = d.x * W + d.vx * dt, py = d.y * H + d.vy * dt;
      if (px < -8) px = W + 8; else if (px > W + 8) px = -8;
      if (py < -8) py = H + 8; else if (py > H + 8) py = -8;
      d.x = px / W; d.y = py / H;
      d.el.style.transform = 'translate(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px)';
    });
    raf = requestAnimationFrame(tick);
  };
  const start = () => { if (raf || still.matches) return; measure(); last = 0; raf = requestAnimationFrame(tick); };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  if (still.matches) { measure(); dots.forEach((d) => { d.el.style.transform = 'translate(' + d.x * W + 'px,' + d.y * H + 'px)'; }); }
  new ResizeObserver(measure).observe(video);
  new IntersectionObserver(([en]) => { onScreen = en.isIntersecting; onScreen ? start() : stop(); }).observe(video);
  const burst = () => {
    if (still.matches) return;
    boost = R(28, 40);
    dots.forEach((d) => { d.ang = R(0, Math.PI * 2); d.sp = R(6, 16); });
  };
  tabs.forEach((t, i) => t.addEventListener('click', () => {
    if (t.classList.contains('is-active')) { if (mobile.matches) box.classList.toggle('is-open'); return; }
    tabs.forEach((x) => { x.classList.toggle('is-active', x === t); x.setAttribute('aria-pressed', String(x === t)); });
    box.classList.remove('is-open');
    count.textContent = (i + 1) + ' de ' + tabs.length + ' pruebas';
    video.setAttribute('aria-label', 'Video: ' + t.querySelector('.pd-test__title').textContent);
    burst();
    video.classList.add('is-swapping'); setTimeout(() => video.classList.remove('is-swapping'), 250);
  }));
})();
