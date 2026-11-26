/* Casos reales: dots del carrusel en tablet/mobile */
(() => {
  document.querySelectorAll('[data-cases]').forEach((root) => {
    const track = root.querySelector('[data-cases-track]');
    const dotsEl = root.querySelector('[data-cases-dots]');
    if (!track || !dotsEl) return;
    const items = [...track.children];
    const dots = items.map((_, k) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'dots__item';
      b.setAttribute('aria-label', 'Caso ' + (k + 1));
      b.addEventListener('click', () => track.scrollTo({ left: items[k].offsetLeft - track.offsetLeft - parseFloat(getComputedStyle(track).paddingLeft), behavior: 'smooth' }));
      li.appendChild(b);
      dotsEl.appendChild(li);
      return b;
    });
    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      const p = max > 0 ? track.scrollLeft / max : 0;
      const k = Math.round(p * (items.length - 1));
      dots.forEach((d, i) => d.setAttribute('aria-current', i === k ? 'true' : 'false'));
    };
    track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    update();
  });
})();

