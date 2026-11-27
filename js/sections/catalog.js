/* ==========================================================================
   Productos — carrusel del hero catálogo
   [data-catalog] · [data-cat-item] (data-title-light/-bold, data-cap, data-color, data-hex, data-mat, data-href)
   [data-cat-prev/next] · [data-cat-dots] · [data-cat-title] · [data-cat-chips] · [data-cat-link]
   ========================================================================== */
(() => {
  const COOLDOWN = 600;
  document.querySelectorAll('[data-catalog]').forEach((root) => {
    const items = [...root.querySelectorAll('[data-cat-item]')];
    const n = items.length;
    if (!n) return;
    const title = root.querySelector('[data-cat-title]');
    const chips = root.querySelector('[data-cat-chips]');
    const link = root.querySelector('[data-cat-link]');
    const dotsBox = root.querySelector('[data-cat-dots]');
    const stage = root.querySelector('[data-cat-stage]');
    let index = 0, busy = false;

    const offset = (i) => { let d = ((i - index) % n + n) % n; if (d > n / 2) d -= n; return d; };

    const layout = () => {
      items.forEach((el, i) => {
        const d = offset(i);
        const pos = Math.abs(d) > 2 ? 'far' : String(d);
        const prev = el._d;
        // si salta de lado (o entra/sale de "far" cruzando), se reubica sin transición
        if (prev !== undefined && Math.abs(d - prev) > 1) {
          el.classList.add('no-anim');
          requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('no-anim')));
        }
        el._d = d;
        el.dataset.pos = pos;
        el.dataset.side = d < 0 ? 'l' : 'r';
        el.setAttribute('aria-hidden', String(d !== 0));
        const hit = el.querySelector('.s-cat__hit');
        if (hit) hit.tabIndex = -1;
      });
      dotsBox?.querySelectorAll('.dots__item').forEach((b, i) => b.setAttribute('aria-current', String(i === index)));
    };

    const swap = (el) => {
      const it = items[index];
      el.classList.add('is-swapping');
      clearTimeout(el._t);
      el._t = setTimeout(() => {
        if (el === title) {
          title.innerHTML = '<span class="s-cat__name-in">' + it.dataset.titleLight + ' <strong>' + it.dataset.titleBold + '</strong></span>';
        } else {
          el.querySelector('[data-chip="cap"]').textContent = it.dataset.cap;
          el.querySelector('[data-chip="color"]').innerHTML = '<span class="s-cat__swatch" style="background:' + it.dataset.hex + '" aria-hidden="true"></span><span>' + it.dataset.color + '</span>';
          el.querySelector('[data-chip="mat"]').textContent = it.dataset.mat;
        }
        el.offsetWidth;
        el.classList.remove('is-swapping');
      }, 220);
    };

    const goTo = (i) => {
      if (busy) return;
      const next = ((i % n) + n) % n;
      if (next === index) return;
      busy = true;
      setTimeout(() => { busy = false; }, COOLDOWN);
      index = next;
      layout();
      if (title) swap(title);
      if (chips) swap(chips);
      if (link) link.href = items[index].dataset.href || '#';
      if (items[index].dataset.theme) root.dataset.theme = items[index].dataset.theme;
      const pop = root.querySelector('.s-cat__pop');
      if (pop) { pop.classList.remove('is-pop'); void pop.offsetWidth; pop.classList.add('is-pop'); }
    };

    if (dotsBox) {
      dotsBox.innerHTML = '<ul class="dots dots--light" role="list">' + items.map((_, i) =>
        '<li><button class="dots__item" type="button" aria-label="Producto ' + (i + 1) + '"></button></li>').join('') + '</ul>';
      dotsBox.querySelectorAll('.dots__item').forEach((b, i) => b.addEventListener('click', () => goTo(i)));
    }
    root.querySelector('[data-cat-prev]')?.addEventListener('click', () => goTo(index - 1));
    root.querySelector('[data-cat-next]')?.addEventListener('click', () => goTo(index + 1));
    items.forEach((el, i) => el.querySelector('.s-cat__hit')?.addEventListener('click', () => goTo(i)));

    /* Swipe */
    let sx = null, sy = 0;
    stage?.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; });
    stage?.addEventListener('pointerup', (e) => {
      if (sx === null) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      sx = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) goTo(index + (dx < 0 ? 1 : -1));
    });
    root.addEventListener('keydown', (e) => {
      if (e.target.closest('input, textarea, select')) return;
      if (e.key === 'ArrowRight') goTo(index + 1);
      if (e.key === 'ArrowLeft') goTo(index - 1);
    });

    if (items[0].dataset.theme) root.dataset.theme = items[0].dataset.theme;
    // Nombre, chips y enlace iniciales salen del primer ítem (no del HTML fijo)
    { const it = items[0];
      if (title && it.dataset.titleLight) title.innerHTML = '<span class="s-cat__name-in">' + it.dataset.titleLight + ' <strong>' + it.dataset.titleBold + '</strong></span>';
      if (chips) {
        const cap = chips.querySelector('[data-chip="cap"]'), col = chips.querySelector('[data-chip="color"]'), mat = chips.querySelector('[data-chip="mat"]');
        if (cap && it.dataset.cap) cap.textContent = it.dataset.cap;
        if (col && it.dataset.color) col.innerHTML = '<span class="s-cat__swatch" style="background:' + it.dataset.hex + '" aria-hidden="true"></span><span>' + it.dataset.color + '</span>';
        if (mat && it.dataset.mat) mat.textContent = it.dataset.mat;
      }
      if (link && it.dataset.href) link.href = it.dataset.href; }
    // Posición inicial sin transición (antes estaban todos apilados al centro y se abrían en abanico)
    items.forEach((el) => el.classList.add('no-anim'));
    layout();
    void root.offsetWidth;
    requestAnimationFrame(() => items.forEach((el) => el.classList.remove('no-anim')));
    /* Entrada: cada producto sube desde abajo en su lugar; primero el central, luego los laterales */
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach((el) => {
        const d = Math.abs(el._d);
        if (d > 2) return;
        const to = getComputedStyle(el).opacity;
        el.animate([{ translate: '0 35%', opacity: 0 }, { translate: '0 0', opacity: to }],
          { duration: 1000, delay: 350 + d * 130, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'backwards' });
      });
    }

    /* Parallax de hojas con el mouse */
    if (matchMedia('(hover: hover)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const stack = root.closest('.cat-stack') || root;
      root.addEventListener('pointermove', (e) => {
        stack.style.setProperty('--mx', ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3));
        stack.style.setProperty('--my', ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3));
      });
      root.addEventListener('pointerleave', () => { stack.style.setProperty('--mx', 0); stack.style.setProperty('--my', 0); });
    }

    /* Scroll: la sección siguiente sube sobre el hero fijo; el contenido se apaga suave */
    const inner = root.querySelector('.s-cat__inner');
    const clouds = document.querySelector('.s-pgrid__clouds');
    if (inner && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      let raf = 0;
      const onScroll = () => {
        raf = 0;
        const p = Math.min(1, Math.max(0, window.scrollY / root.offsetHeight));
        inner.style.opacity = String(1 - p * 0.7);
        if (clouds) clouds.style.transform = 'translate3d(0,' + (p * -110).toFixed(1) + 'px,0)';
        inner.style.transform = 'translate3d(0,' + (p * -40).toFixed(1) + 'px,0) scale(' + (1 - p * 0.04).toFixed(3) + ')';
      };
      window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(onScroll); }, { passive: true });
      onScroll();
    }
  });
})();
