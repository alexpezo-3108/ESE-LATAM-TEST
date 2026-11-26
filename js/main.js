/* ==========================================================================
   Main — header (pill / ocultar), dropdowns, menú mobile y búsqueda
   ========================================================================== */
(() => {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const desktop = matchMedia('(min-width: 64em)');
  const hoverable = matchMedia('(hover: hover)');
  const isOpen = (cls) => header.classList.contains(cls);
  // Al bloquear el scroll desaparece la barra: se compensa su ancho para que el header (y el botón menú/cerrar) no se muevan
  const lockScroll = (lock) => {
    const sb = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--sb-comp', lock && sb > 0 ? sb + 'px' : '0px');
    document.body.classList.toggle('is-locked', lock);
    if (window.lenis) lock ? window.lenis.stop() : window.lenis.start();
  };

  /* ---------- Secciones fijas (pin/sticky con scroll controlado) ----------
     Una sección está "fija" cuando su elemento sticky está pegado a su tope, su contenedor
     aún no terminó y es lo que ocupa el centro de la pantalla (no está tapado por la siguiente).
     Estado compartido: <html class="is-pinned"> + evento "pinchange". Añadir [data-pin] a cualquier
     sticky nuevo para que la barra lo respete. */
  const PIN_SEL = '[data-pin], .s-mv__sticky, .pd-stack > .pd, .goal';
  // El hero de Productos (.s-cat) es sticky solo para que el catálogo lo cubra al bajar: no cuenta como pin
  const pins = [...document.querySelectorAll(PIN_SEL)];
  let pinned = false;
  const checkPinned = () => {
    if (!pins.length) return false;
    const vh = window.innerHeight;
    const mid = document.elementFromPoint(window.innerWidth / 2, vh / 2);
    return pins.some((el) => {
      const cs = getComputedStyle(el);
      if (cs.position !== 'sticky') return false;
      const r = el.getBoundingClientRect(), pr = el.parentElement.getBoundingClientRect();
      const top = parseFloat(cs.top) || 0;
      const d = r.top - top;
      const stuck = Math.abs(d) < 1.5 && pr.top < r.top - 1 && pr.bottom > r.bottom + 1;
      // Se activa un poco ANTES del pin (cuando faltan ~alto de barra + 40px) para que la barra nunca lo cubra
      const approaching = d > 0.5 && d < header.offsetHeight + 40 && pr.bottom > r.bottom + 1;
      return (stuck || approaching) && !!mid && el.contains(mid);
    });
  };
  /* ---------- Blur inferior: aparece tras el hero, se apaga en el footer ---------- */
  const edge = document.createElement('div');
  edge.className = 'scroll-edge';
  edge.setAttribute('aria-hidden', 'true');
  edge.innerHTML = '<span></span><span></span><span></span>';
  document.body.appendChild(edge);
  const heroEl = document.querySelector('main > section:first-of-type, main > :first-child');
  const footEl = document.querySelector('.site-footer');
  function updateEdge(y) {
    const vh = window.innerHeight;
    // Entra gradualmente desde el primer scroll del hero; llega a 100% a mitad del hero
    const heroH = heroEl ? heroEl.offsetHeight : vh;
    const o = Math.min(1, Math.max(0, y / (heroH * 0.2)));
    const footTop = footEl ? footEl.getBoundingClientRect().top : Infinity;
    const on = o > 0 && footTop > vh - 8;
    edge.style.setProperty('--edge-o', o.toFixed(3));
    edge.classList.toggle('is-on', on);
  }

  /* ---------- Header: pill al bajar (azul claro translúcido) · siempre visible ---------- */
  let lastY = window.scrollY;
  let ticking = false;
  const PILL_AT = 24;

  const updatePill = () => {
    header.classList.toggle('is-pill', window.scrollY > PILL_AT || (isOpen('is-search-open') && desktop.matches));
    header.classList.toggle('is-scrolled', window.scrollY > PILL_AT);
  };

  const onScroll = () => {
    const y = window.scrollY;
    // Solo el foco de teclado mantiene visible el header (tras un clic, el foco queda en el link)
    const busy = isOpen('is-nav-open') || isOpen('is-search-open') || !!header.querySelector(':focus-visible');
    updatePill();
    // Sticky: el header acompaña siempre al usuario (ya no se oculta al bajar)
    // Se oculta al bajar (pasado el borde superior) y reaparece al subir
    const wasPinned = pinned;
    pinned = checkPinned();
    if (pinned !== wasPinned) {
      document.documentElement.classList.toggle('is-pinned', pinned);
      window.dispatchEvent(new CustomEvent('pinchange', { detail: { pinned } }));
    }
    if (pinned) header.classList.add('is-hidden');                     // prioridad total: oculta durante el pin
    else if (busy) header.classList.remove('is-hidden');
    else if (wasPinned && y < lastY) header.classList.remove('is-hidden'); // se soltó saliendo por arriba
    else if (y < lastY || y <= PILL_AT * 4) header.classList.remove('is-hidden');
    else if (y > lastY + 2) header.classList.add('is-hidden');
    updateEdge(y);
    lastY = y;
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  header.addEventListener('focusin', () => { if (header.querySelector(':focus-visible')) header.classList.remove('is-hidden'); });

  /* ---------- Dropdowns ---------- */
  const items = [...header.querySelectorAll('.nav__item--has-sub')];

  const setSub = (item, open) => {
    item.classList.toggle('is-open', open);
    item.querySelector('.nav__toggle')?.setAttribute('aria-expanded', String(open));
  };
  const closeSubs = (except) => items.forEach((i) => i !== except && setSub(i, false));

  items.forEach((item) => {
    const toggle = item.querySelector('.nav__toggle');
    let timer;

    toggle.addEventListener('click', () => {
      const open = !item.classList.contains('is-open');
      if (desktop.matches) closeSubs(item);
      setSub(item, open);
    });
    item.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse' || !desktop.matches || !hoverable.matches) return;
      clearTimeout(timer);
      closeSubs(item);
      setSub(item, true);
    });
    item.addEventListener('pointerleave', (e) => {
      if (e.pointerType !== 'mouse' || !desktop.matches) return;
      timer = setTimeout(() => setSub(item, false), 140);
    });
    item.addEventListener('focusout', (e) => {
      if (desktop.matches && !item.contains(e.relatedTarget)) setSub(item, false);
    });
  });

  document.addEventListener('click', (e) => {
    if (desktop.matches && !e.target.closest('.nav__item--has-sub')) closeSubs();
  });

  /* ---------- Menú mobile ---------- */
  const burger = header.querySelector('.nav-toggle');

  const syncBurger = () => {
    const open = isOpen('is-nav-open') || isOpen('is-search-open');
    burger?.setAttribute('aria-expanded', String(open));
    burger?.setAttribute('aria-label', open ? 'Cerrar' : 'Abrir menú');
  };

  const setNav = (open) => {
    header.classList.toggle('is-nav-open', open);
    header.classList.remove('is-hidden');
    syncBurger();
    lockScroll(open);
  };

  burger?.addEventListener('click', () => {
    if (isOpen('is-search-open')) return setSearch(false);
    setNav(!isOpen('is-nav-open'));
  });

  header.querySelectorAll('.nav a').forEach((a) => {
    a.addEventListener('click', () => { if (!desktop.matches) setNav(false); });
  });

  /* ---------- Búsqueda ---------- */
  const search = header.querySelector('.search');
  const input = search?.querySelector('.search__input');
  const results = search?.querySelector('.search__results');
  const clear = search?.querySelector('.search__clear');
  const toggles = header.querySelectorAll('[data-search-toggle], [data-search-open]');
  const backdrop = header.querySelector('.search-backdrop');
  const emptyTpl = document.getElementById('tpl-search-empty');
  const idleTpl = document.getElementById('tpl-search-idle');

  /* Índice real (js/search.js): se carga recién al usar el buscador */
  let engine = null;
  const loadEngine = () => engine || (engine = new Promise((res) => {
    if (window.ESE_SEARCH) return res(window.ESE_SEARCH);
    const s = document.createElement('script'); s.src = 'js/search.js';
    s.onload = () => res(window.ESE_SEARCH); s.onerror = () => res(null);
    document.head.appendChild(s);
  }));
  const LIMIT = { Productos: 4, Sectores: 2, Distribuidores: 2, 'Páginas': 2, Blog: 2 };

  const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const query = async (q) => { const en = await loadEngine(); return en ? en.query(q) : []; };

  // Resalta cada palabra buscada (sin tildes ni mayúsculas)
  const highlight = (text, q) => {
    const ws = q.split(/\s+/).map(norm).filter((w) => w.length > 1);
    const n = norm(text), marks = new Array(text.length).fill(false);
    ws.forEach((w) => { let i = -1; while ((i = n.indexOf(w, i + 1)) > -1) for (let k = i; k < i + w.length; k++) marks[k] = true; });
    let out = '', open = false;
    for (let k = 0; k < text.length; k++) {
      if (marks[k] && !open) { out += '<mark>'; open = true; }
      if (!marks[k] && open) { out += '</mark>'; open = false; }
      out += esc(text[k]);
    }
    return out + (open ? '</mark>' : '');
  };

  const itemHTML = (r, q, active) => `
    <li><a class="search-item${active ? ' is-active' : ''}" href="${r.url}">
      <span class="search-item__thumb" aria-hidden="true">${r.thumb ? `<img src="${r.thumb}" alt="" width="56" height="56" loading="lazy">` : esc(r.group[0])}</span>
      <span class="search-item__body">
        <span class="search-item__title">${highlight(r.title, q)}</span>
        <span class="search-item__meta">${esc(r.meta)}</span>
      </span>
      <i class="search-item__arrow ph-light ph-arrow-up-right" aria-hidden="true"></i>
    </a></li>`;

  const render = async () => {
    const q = input.value.trim();
    if (q.length < 2) { results.innerHTML = idleTpl ? idleTpl.innerHTML : ''; return; }
    const found = await query(q);
    if (q !== input.value.trim()) return;

    if (!found.length) {
      results.innerHTML = emptyTpl.innerHTML.replace('{q}', esc(q));
      return;
    }
    const groups = {};
    found.forEach((r) => (groups[r.group] ||= []).push(r));
    let first = true;
    results.innerHTML = Object.entries(groups).map(([name, list]) => `
      <section class="search__group">
        <h3 class="search__eyebrow">${name} (${list.length})</h3>
        <ul class="search__list" role="list">
          ${list.slice(0, LIMIT[name] || 2).map((r) => { const h = itemHTML(r, q, first); first = false; return h; }).join('')}
        </ul>
      </section>`).join('') + `
      <div class="search__foot">
        <a href="productos.html?q=${encodeURIComponent(q)}#catalogo">Ver productos para «${esc(q)}» en el catálogo <i class="ph-light ph-arrow-right" aria-hidden="true"></i></a>
      </div>
      <a class="btn btn--ghost btn--lg btn--block search__all" href="productos.html?q=${encodeURIComponent(q)}#catalogo">Ver productos en el catálogo</a>`;
  };

  let debounce;
  input?.addEventListener('input', () => { clearTimeout(debounce); debounce = setTimeout(render, 120); });

  /* Navegación con flechas entre resultados */
  input?.addEventListener('keydown', (e) => {
    const items = [...results.querySelectorAll('.search-item')];
    if (!items.length) return;
    let i = items.findIndex((x) => x.classList.contains('is-active'));
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      i = e.key === 'ArrowDown' ? Math.min(items.length - 1, i + 1) : Math.max(0, i - 1);
      items.forEach((x, k) => x.classList.toggle('is-active', k === i));
      const r = items[i].getBoundingClientRect(), box = results.getBoundingClientRect();
      if (r.bottom > box.bottom || r.top < box.top) results.scrollTop += r.top - box.top - box.height / 2;
    } else if (e.key === 'Enter' && i > -1) {
      e.preventDefault();
      window.location.href = items[i].href;
    }
  });

  clear?.addEventListener('click', () => { input.value = ''; render(); input.focus(); });

  // Chips de sugerencia
  results?.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-suggest]');
    if (!chip) return;
    input.value = chip.dataset.suggest;
    render();
    input.focus();
  });

  function setSearch(open) {
    if (!search) return;
    if (open && isOpen('is-nav-open')) header.classList.remove('is-nav-open');
    header.classList.toggle('is-search-open', open);
    header.classList.remove('is-hidden');
    closeSubs();
    toggles.forEach((t) => t.matches('[data-search-toggle]') && t.setAttribute('aria-expanded', String(open)));
    updatePill();
    syncBurger();
    lockScroll(open);
    if (open) { render(); setTimeout(() => input.focus({ preventScroll: true }), 60); }
  }

  // precarga del índice al abrir (o al pasar el mouse por la lupa)
  toggles.forEach((t) => t.addEventListener('pointerenter', loadEngine, { once: true }));
  toggles.forEach((t) => t.addEventListener('click', () => {
    setSearch(t.matches('[data-search-open]') ? true : !isOpen('is-search-open'));
  }));
  backdrop?.addEventListener('click', () => setSearch(false));

  /* ---------- Teclado / resize ---------- */
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeSubs();
    if (isOpen('is-search-open')) { setSearch(false); header.querySelector('[data-search-toggle]')?.focus(); }
    else if (isOpen('is-nav-open')) { setNav(false); burger?.focus(); }
  });

  desktop.addEventListener('change', () => { setNav(false); setSearch(false); closeSubs(); });
})();

/* ==========================================================================
   Tabs genéricos — [data-tabs] con botones [role="tab"][data-value]
   Emite "tabs:change" ({ detail: { value } }). API: el.tabsSelect(value)
   ========================================================================== */
(() => {
  document.querySelectorAll('[data-tabs]').forEach((tabs) => {
    const ind = tabs.querySelector('.tabs__indicator');
    const btns = [...tabs.querySelectorAll('[role="tab"]')];

    const sync = () => {
      const a = btns.find((b) => b.getAttribute('aria-selected') === 'true');
      if (!a || !ind || !ind.offsetWidth) return;
      const l = a.offsetLeft - ind.offsetLeft;
      const r = ind.offsetWidth - (l + a.offsetWidth);
      ind.style.setProperty('--tab-l', `${l}px`);
      ind.style.setProperty('--tab-r', `${r}px`);
    };

    const select = (b, { focus = false, silent = false } = {}) => {
      if (!b) return;
      btns.forEach((x) => {
        x.setAttribute('aria-selected', String(x === b));
        x.tabIndex = x === b ? 0 : -1;
      });
      sync();
      if (focus) b.focus();
      if (!silent) tabs.dispatchEvent(new CustomEvent('tabs:change', { bubbles: true, detail: { value: b.dataset.value } }));
    };

    btns.forEach((b) => b.addEventListener('click', () => select(b)));
    tabs.addEventListener('keydown', (e) => {
      const i = btns.findIndex((b) => b.getAttribute('aria-selected') === 'true');
      if (e.key === 'ArrowRight') select(btns[(i + 1) % btns.length], { focus: true });
      if (e.key === 'ArrowLeft') select(btns[(i - 1 + btns.length) % btns.length], { focus: true });
    });

    tabs.tabsSelect = (value) => select(btns.find((b) => b.dataset.value === value), { silent: true });
    sync();
    document.fonts?.ready.then(sync);
    new ResizeObserver(sync).observe(tabs);
  });
})();

/* Hero home: "Transformar" se ajusta al ancho de "Contener para" */
(() => {
  const t = document.querySelector('.s-hero__title');
  if (!t) return;
  const a = t.querySelector('.s-hero__title-light'), b = t.querySelector('.s-hero__title-bold');
  const measure = (el) => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect().width; };
  const fit = () => {
    t.style.setProperty('--fit', 1);
    const wa = measure(a), wb = measure(b);
    if (wa && wb) t.style.setProperty('--fit', (wa / wb).toFixed(4));
  };
  (document.fonts?.ready || Promise.resolve()).then(fit);
  let w = innerWidth;
  addEventListener('resize', () => { if (innerWidth !== w) { w = innerWidth; fit(); } });
})();
