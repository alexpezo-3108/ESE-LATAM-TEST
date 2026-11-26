/* ==========================================================================
   Confeti lento — window.eseConfetti({ origin, count, duration, gravity })
   Estalla desde un punto (por defecto, arriba al centro) y cae despacio,
   balanceándose. Colores de la marca. Sin dependencias.
   ========================================================================== */
(() => {
  const COLORS = ['#009FDF', '#66C5EC', '#1A4099', '#001E60', '#12A150', '#F2924A', '#CCECF9'];
  window.eseConfetti = (opts = {}) => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const { count = 140, duration = 5200, gravity = 0.05, spread = 1 } = opts;
    const cv = document.createElement('canvas');
    cv.className = 'confetti-canvas';
    cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const size = () => { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size(); addEventListener('resize', size);
    const o = opts.origin || { x: innerWidth / 2, y: innerHeight * 0.35 };
    const parts = Array.from({ length: count }, () => {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1 * spread;
      const v = 6 + Math.random() * 7;
      return {
        x: o.x + (Math.random() - 0.5) * 40, y: o.y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        w: 6 + Math.random() * 6, h: 8 + Math.random() * 8,
        r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.2,
        sway: Math.random() * Math.PI * 2, sw: 0.02 + Math.random() * 0.03,
        c: COLORS[(Math.random() * COLORS.length) | 0], round: Math.random() < 0.25,
      };
    });
    const t0 = performance.now();
    const tick = (now) => {
      const t = now - t0;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      const fade = t > duration - 1200 ? Math.max(0, (duration - t) / 1200) : 1;
      parts.forEach((p) => {
        p.vx *= 0.975; p.vy = p.vy * 0.975 + gravity;
        if (p.vy > 1.6) p.vy = 1.6; // caída lenta, tipo papel
        p.sway += p.sw; p.x += p.vx + Math.sin(p.sway) * 0.8; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.globalAlpha = fade; ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx.fill(); }
        else { ctx.scale(1, Math.cos(p.sway * 2)); ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
        ctx.restore();
      });
      if (t < duration) requestAnimationFrame(tick);
      else { removeEventListener('resize', size); cv.remove(); }
    };
    requestAnimationFrame(tick);
  };
})();
