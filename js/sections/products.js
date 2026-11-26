/* ==========================================================================
   Productos — filtro por categoría + carrusel coverflow
   [data-products] · [data-products-track] · [data-product][data-category]
   [data-products-select] · [data-products-prev/next] · [data-products-dots]
   ========================================================================== */
(() => {
  const desktop = matchMedia('(min-width: 64em)');
  const SCALES = [1, 0.68, 0.53];
  const OVERLAP = 0.12; // solape entre la 2ª y 3ª card (× ancho)

  document.querySelectorAll('[data-products]').forEach((root) => {
    const track = root.querySelector('[data-products-track]');
    const all = [...track.querySelectorAll('[data-product]')];
    const tabs = root.querySelector('[data-tabs]');
    const select = root.querySelector('[data-products-select]');
    const dotsBox = root.querySelector('[data-products-dots]');
    let list = [];
    let index = 0;
    let category = null;

    /* Distancia circular para que siempre haya cards a ambos lados */
    const wrap = (d) => { const n = list.length; let x = ((d % n) + n) % n; if (x > n / 2) x -= n; return x; };
    const offset = (i) => wrap(i - index);

    /* Cinta continua: una sola posición (pos, decimal) que se desliza; cada tarjeta calcula
       desplazamiento, escala y profundidad según su distancia a pos → avance orgánico, sin cruces. */
    let pos = 0, raf = 0; // raf: animación de la cinta
    const lerp = (A, k) => { const f = Math.min(Math.floor(k), A.length - 2); const t = Math.min(k - f, 1); return A[f] + (A[f + 1] - A[f]) * t; };
    const paint = (p) => {
      const desk = desktop.matches, n = list.length;
      const near = ((Math.round(p) % n) + n) % n;
      const L = Math.min(2, n / 2 - 0.5); // última posición visible a cada lado
      list.forEach((s, i) => {
        const d = wrap(i - p), a = Math.abs(d), on = i === near;
        s.classList.toggle('is-active', on);
        s.querySelector('.product-card')?.classList.toggle('product-card--inactive', desk && !on);
        if (!desk) { s.style.removeProperty('transform'); s.style.removeProperty('z-index'); s.style.removeProperty('opacity'); s.style.removeProperty('transition'); s.classList.remove('is-far'); s.inert = false; return; }
        const W = s.offsetWidth;
        const x1 = (W / 2) * (1 + SCALES[1]) - W * 0.05;
        const x2 = x1 + (W * SCALES[1]) / 2 + (W * SCALES[2]) / 2 - W * OVERLAP;
        const X = [0, x1, x2, x2 + W * SCALES[2] * 0.6];
        const S = [SCALES[0], SCALES[1], SCALES[2], SCALES[2] * 0.85];
        const x = lerp(X, Math.min(a, 3)) * Math.sign(d), sc = lerp(S, Math.min(a, 3));
        // Más allá de la última posición visible se apaga (allí es donde da la vuelta, fuera de vista)
        const op = Math.max(0, Math.min(1, (L + 0.5 - a) / 0.5));
        s.style.transition = 'none';
        s.style.transform = `translate3d(${x}px, 0, 0) scale(${sc})`;
        s.style.opacity = String(op);
        s.style.zIndex = String(Math.round(100 - a * 10));
        s.classList.toggle('is-far', op === 0);
        s.inert = op === 0 || !on && a > L;
      });
      dotsBox?.querySelectorAll('.dots__item').forEach((bt, i) => bt.setAttribute('aria-current', String(i === near)));
    };
    const layout = () => { cancelAnimationFrame(raf); pos = index; paint(pos); };
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const slideBy = (delta) => {
      cancelAnimationFrame(raf);
      const from = pos, to = pos + delta, dur = 600 + 250 * (Math.abs(delta) - 1), t0 = performance.now();
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { pos = to; paint(pos); return; }
      const tick = (now) => {
        const t = Math.min(1, (now - t0) / dur);
        pos = from + (to - from) * ease(t);
        paint(pos);
        if (t < 1) raf = requestAnimationFrame(tick); else { pos = index; paint(pos); }
      };
      raf = requestAnimationFrame(tick);
    };

    /* Desktop: enfriamiento entre pasos. Los clics durante la transición se ignoran (sin cambio visual) */
    const COOLDOWN = 600;
    let busy = false;
    const step = (dir) => {
      if (!desktop.matches) return goTo(index + dir);
      if (busy) return;
      busy = true;
      goTo(index + dir);
      setTimeout(() => { busy = false; }, COOLDOWN);
    };

    const goTo = (i) => {
      const next = ((i % list.length) + list.length) % list.length;
      if (desktop.matches) {
        const delta = wrap(next - index);
        index = next;
        if (delta) slideBy(delta);
        return;
      }
      index = next;
      layout();
      if (!desktop.matches) {
        const s = list[index];
        track.scrollTo({ left: s.offsetLeft - (track.clientWidth - s.offsetWidth) / 2, behavior: 'smooth' });
      }
    };

    const buildDots = () => {
      if (!dotsBox) return;
      dotsBox.innerHTML = '<ul class="dots" role="list">' + list.map((s, i) =>
        `<li><button class="dots__item" type="button" aria-label="Producto ${i + 1}"></button></li>`).join('') + '</ul>';
      dotsBox.querySelectorAll('.dots__item').forEach((b, i) => b.addEventListener('click', () => goTo(i)));
    };

    /* ---- Composición para categorías con pocos productos (≤ COMPACT_MAX): bloque editorial + tarjetas ---- */
    const COMPACT_MAX = 3;
    const stage = root.querySelector('.s-products__stage');
    const dotsWrap = root.querySelector('[data-products-dots]');
    let fillMap = null; try { fillMap = JSON.parse(track.dataset.pcFill || 'null'); } catch (e) {}
    let compact = null;
    // Pocas tarjetas: juntas y centradas, todas activas, sin flechas (mismo ancho y gap que el carrusel)
    const renderCompact = (cat) => {
      const ids = (fillMap && fillMap[cat]) || [];
      const ps = ids.map((id) => (window.PRODUCTS || []).find((p) => p.id === id)).filter(Boolean);
      if (!compact) { compact = document.createElement('ul'); compact.className = 's-products__compact'; compact.setAttribute('role', 'list'); stage.after(compact); }
      compact.innerHTML = ps.map((p) => `<li class="s-products__compact-item">${window.ProductCard ? window.ProductCard.html(p) : ''}</li>`).join('');
    };

    const wide = matchMedia('(min-width: 64em)');
    wide.addEventListener('change', () => { const c = category; category = null; setCategory(c, false); });
    const setCategory = (cat, animate = true) => {
      if (cat === category) return;
      category = cat;
      list = all.filter((s) => s.dataset.category === cat);
      // Solo desktop: en mobile siempre el mismo carrusel (el select nunca se mueve)
      const isCompact = !!fillMap && wide.matches && list.length > 0 && list.length <= COMPACT_MAX;
      const wasCompact = root.classList.contains('is-compact');
      root.classList.toggle('is-compact', isCompact);
      if (isCompact) {
        renderCompact(cat);
        stage.hidden = true; if (dotsWrap) dotsWrap.hidden = true; compact.hidden = false;
        if (animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
          compact.animate?.([{ transform: 'translateY(3rem)' }, { transform: 'none' }], { duration: 900, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
        }
        if (select) select.value = cat;
        tabs?.tabsSelect?.(cat);
        return;
      }
      if (compact) compact.hidden = true;
      stage.hidden = false; if (dotsWrap) dotsWrap.hidden = false;
      if (wasCompact) animate = true;
      all.forEach((s) => { s._d = undefined; });
      all.forEach((s) => { s.hidden = !list.includes(s); });
      index = 0;
      root.classList.remove('is-ready');
      buildDots();
      layout();
      track.scrollLeft = 0;
      if (select) select.value = cat;
      tabs?.tabsSelect?.(cat);
      requestAnimationFrame(() => root.classList.add('is-ready'));
      if (animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        track.animate?.(
          [{ transform: 'translateY(3rem)' }, { transform: 'none' }],
          { duration: 900, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
        );
      }
    };

    root.addEventListener('tabs:change', (e) => setCategory(e.detail.value));
    select?.addEventListener('change', () => setCategory(select.value));
    root.querySelector('[data-products-prev]')?.addEventListener('click', () => step(-1));
    root.querySelector('[data-products-next]')?.addEventListener('click', () => step(1));

    track.addEventListener('click', (e) => {
      const s = e.target.closest('[data-product]');
      if (!s || !desktop.matches) return;
      const i = list.indexOf(s);
      if (i !== index) {
        e.preventDefault();
        if (busy) return;
        // La cinta se desliza de corrido hasta ella (pasa por las posiciones intermedias)
        const steps = Math.abs(offset(i));
        busy = true;
        goTo(i);
        setTimeout(() => { busy = false; }, COOLDOWN + 250 * (steps - 1));
      }
    });

    /* Mobile: dots siguen al scroll nativo */
    let sraf;
    track.addEventListener('scroll', () => {
      if (desktop.matches) return;
      cancelAnimationFrame(sraf);
      sraf = requestAnimationFrame(() => {
        const mid = track.scrollLeft + track.clientWidth / 2;
        let best = 0;
        list.forEach((s, i) => {
          if (Math.abs(s.offsetLeft + s.offsetWidth / 2 - mid) < Math.abs(list[best].offsetLeft + list[best].offsetWidth / 2 - mid)) best = i;
        });
        if (best !== index) { index = best; layout(); }
      });
    }, { passive: true });

    let t;
    window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(layout, 120); });
    desktop.addEventListener('change', () => { track.scrollLeft = 0; index = 0; layout(); });

    setCategory(select?.value || all[0]?.dataset.category, false);
  });
})();
