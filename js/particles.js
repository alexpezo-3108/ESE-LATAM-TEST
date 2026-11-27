/* ==========================================================================
   Partículas — [data-particles] con un <canvas> dentro.
   Avance infinito de izquierda a derecha. data-particles="40" = cantidad.
   Se pausa fuera de pantalla; con reduced-motion se dibuja estático.
   ========================================================================== */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches; // mobile: canvas más liviano

  document.querySelectorAll('[data-particles]').forEach((box) => {
    const canvas = box.querySelector('canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const count = parseInt(box.dataset.particles, 10) || 40;
    const color = getComputedStyle(document.documentElement).getPropertyValue('--color-blue-100').trim() || '#CCECF9';
    let w = 0, h = 0, dpr = 1, running = false, last = 0, parts = [];

    const rand = (a, b) => a + Math.random() * (b - a);
    const make = (x) => ({ x: x ?? rand(0, w), y: rand(0, h), r: rand(0.6, 2.2), v: rand(8, 34), a: rand(0.15, 0.7), drift: rand(-4, 4) });

    const resize = () => {
      const r = box.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.25 : 2);
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!parts.length) parts = Array.from({ length: count }, () => make());
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = color;
      parts.forEach((p) => {
        ctx.globalAlpha = p.a;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    };

    const tick = (t) => {
      if (!running) return;
      const dt = Math.min((t - last) / 1000, 0.05);
      last = t;
      parts.forEach((p, i) => {
        p.x += p.v * dt;
        p.y += p.drift * dt;
        if (p.x - p.r > w || p.y < -4 || p.y > h + 4) parts[i] = make(-p.r * 2);
      });
      draw();
      requestAnimationFrame(tick);
    };

    resize();
    draw();
    let lw = 0;
    new ResizeObserver(([e]) => { const nw = Math.round(e.contentRect.width); if (coarse && nw === lw) return; lw = nw; resize(); draw(); }).observe(box);
    if (reduced) return;

    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !running) { running = true; last = performance.now(); requestAnimationFrame(tick); }
      else if (!e.isIntersecting) running = false;
    }).observe(box);
  });
})();
