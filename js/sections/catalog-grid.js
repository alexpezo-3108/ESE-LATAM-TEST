/* Productos: dropdowns propios (con conteo), pills en la hoja mobile, chips, orden y paginación */
(() => {
  const root = document.querySelector('[data-pgrid]');
  const grid = document.querySelector('[data-pgrid-list]');
  if (!root || !grid) return;
  // Un card por producto; cada producto trae variantes (capacidad × color) con su imagen
  const CO = window.ESE_COLORS;
  const fam = (n) => (CO ? CO.family(n) : (n && n.startsWith('Gris oscuro') ? 'Gris oscuro' : n));
  const csort = (list) => (CO ? CO.sort(list) : list);
  const LINES = [...new Set((window.PRODUCTS || []).map((p) => p.line))];
  const ITEMS = (window.PRODUCTS || []).map((p) => {
    const vs = p.variants.filter((v) => v.cap);
    const caps = vs.map((v) => v.cap);
    const colors = []; p.variants.forEach((v) => v.colors.forEach((c) => { if (c.name && !colors.some((x) => x.name === c.name)) colors.push(c); }));
    const fams = [...new Set(csort(colors).map((c) => fam(c.name)))];
    return { ...p, caps, colors: csort(colors), fams, variants: p.variants.map((v) => ({ ...v, colors: csort(v.colors) })), cap: caps.length ? Math.min(...caps) : 0 };
  });
  const FHEX = {}; ITEMS.forEach((p) => p.colors.forEach((c) => { if (!c.hex2 && !FHEX[fam(c.name)]) FHEX[fam(c.name)] = c.hex; }));
  const capRange = (p) => {
    const vs = p.variants.filter((v) => v.cap);
    if (!vs.length) return 'Por definir';
    if (vs.length === 1) return vs[0].label;
    const a = vs[0].label, b = vs[vs.length - 1].label, unit = b.replace(/^[\d.,\s]+/, '');
    return a.replace(unit, '').trim() + ' – ' + b;
  };
  // Imagen del card: respeta los filtros de color / capacidad activos
  const pickImg = (p) => {
    const src = (window.PRODUCTS || []).find((x) => x.id === p.id) || p;
    if (!state.color && !state.cap && window.featuredVariant) { const fv = window.featuredVariant(src); if (fv) return fv; }
    if (state.cap && !state.color && window.featuredVariant && src.featured && src.featured.color) {
      const r = RANGES.find((x) => x[0] === state.cap);
      for (const v of src.variants) if (v.cap >= r[3] && v.cap <= r[4]) { const c = v.colors.find((x) => x.name === src.featured.color && x.img); if (c) return { v, c }; }
    }
    const inCap = (v) => !state.cap || (() => { const r = RANGES.find((x) => x[0] === state.cap); return v.cap >= r[3] && v.cap <= r[4]; })();
    for (const v of p.variants.filter(inCap)) for (const c of v.colors) if (c.img && (!state.color || fam(c.name) === state.color)) return { v, c };
    for (const v of p.variants) for (const c of v.colors) if (c.img) return { v, c };
    return null;
  };
  const dotStyle = (c) => CO ? `background:${CO.swatch(c.name, c.hex)}` : c.hex2 ? `background:linear-gradient(135deg, ${c.hex2} 0 50%, ${c.hex} 50% 100%)` : `background:${c.hex}`;
  const PER = 12;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const lit = (n) => n.toLocaleString('es-PE').replace(/,/g, '.') + ' L';
  const uniq = (arr) => [...new Set(arr)].sort((a, b) => a.localeCompare(b, 'es'));
  const RANGES = [['hasta-120', 'Hasta 120 L', '≤ 120 L', 0, 120], ['121-360', '121 – 360 L', '121 – 360 L', 121, 360], ['361-1100', '361 – 1.100 L', '361 – 1.100 L', 361, 1100], ['mas-1100', 'Más de 1.100 L', '+1.100 L', 1101, Infinity]];
  const HEX = CO ? { ...FHEX, ...CO.HEX } : FHEX;
  const match = {
    line: (p, v) => p.line === v,
    sector: (p, v) => p.sectors.includes(v),
    cap: (p, v) => { const r = RANGES.find((x) => x[0] === v); return p.caps.some((c) => c >= r[3] && c <= r[4]); },
    color: (p, v) => p.fams.includes(v),
  };
  // Opciones: [valor, texto, texto corto (pill), conteo]
  const OPTS = {
    line: [['', 'Todas las líneas'], ...uniq(ITEMS.map((p) => p.line)).map((v) => [v, v, v.replace(/^Contenedores /, '')])],
    sector: [['', 'Todos los sectores'], ...uniq(ITEMS.flatMap((p) => p.sectors)).map((v) => [v, v])],
    cap: [['', 'Todas'], ...RANGES.map((r) => [r[0], r[1], r[2]])],
    color: [['', 'Todos'], ...(CO ? CO.sort([...new Set(ITEMS.flatMap((p) => p.fams))], (x) => x) : uniq(ITEMS.flatMap((p) => p.fams))).map((v) => [v, v])],
  };
  Object.entries(OPTS).forEach(([k, list]) => list.forEach((o) => { if (o[0]) o[3] = ITEMS.filter((p) => match[k](p, o[0])).length; }));
  const KEYS = Object.keys(OPTS);
  const state = { q: '', line: '', sector: '', cap: '', color: '', sort: 'dest', page: 1 }; // entra por Destacados
  const text = (k, v) => OPTS[k].find((o) => o[0] === v)?.[1] || '';
  const dot = (k, v) => k !== 'color' ? '' : v ? `<span class="dd__dot" style="background:${HEX[v]}" aria-hidden="true"></span>` : '<span class="dd__dot dd__dot--all" aria-hidden="true"></span>';

  const card = (p) => {
    const pk = pickImg(p);
    const media = pk
      ? `<img src="${pk.c.img}-400.webp" srcset="${pk.c.img}-400.webp 400w, ${pk.c.img}-800.webp 800w" sizes="(min-width: 80em) 22vw, (min-width: 48em) 30vw, 80vw" width="400" height="500" alt="${esc(p.name)}${pk.v.label ? ' ' + esc(pk.v.label) : ''}${pk.c.name ? ', ' + esc(pk.c.name.toLowerCase()) : ''}" loading="lazy" decoding="async">`
      : '<div class="placeholder product-card__ph" aria-hidden="true"><span class="placeholder__label">imagen pendiente</span></div>';
    // Tag de color como antes: punto + nombre del color mostrado; el resto como "+N"
    const cur = (pk && pk.c.name) ? p.colors.find((c) => c.name === pk.c.name) : p.colors[0];
    const dots = cur ? `<span class="product-card__dot" style="${dotStyle(cur)}" aria-hidden="true"></span><span class="product-card__cname">${esc(cur.name)}</span>` : '';
    const more = p.colors.length > 1 ? `<span class="product-card__more">+${p.colors.length - 1}</span>` : '';
    const src = (window.PRODUCTS || []).find((x) => x.id === p.id) || p;
    return `<li data-pkey="${esc(p.href)}">${window.ProductCard.html(src, { current: pk, href: p.href, sizes: '(min-width: 80em) 22vw, (min-width: 48em) 30vw, 80vw' })}</li>`;
  };

  const filtered = () => {
    const q = norm(state.q.trim());
    let list = ITEMS.filter((p) =>
      (!q || norm(p.name + ' ' + p.line + ' ' + p.colors.map((c) => c.name).join(' ') + ' ' + p.variants.map((v) => v.label).join(' ') + ' ' + p.sectors.join(' ')).includes(q)) &&
      KEYS.every((k) => !state[k] || match[k](p, state[k])));
    // Por defecto: categoría → modelo → litraje (el color ya viene ordenado dentro de cada producto)
    if (state.sort === 'rel') list.sort((a, b) => LINES.indexOf(a.line) - LINES.indexOf(b.line) || a.name.localeCompare(b.name, 'es', { numeric: true }) || a.cap - b.cap);
    if (state.sort === 'dest') { const rank = (x) => ((window.PRODUCTS || []).find((p) => p.id === x.id)?.orden_destacado ?? 999); list.sort((a, b) => rank(a) - rank(b) || a.cap - b.cap); }
    if (state.sort === 'cap-asc') list.sort((a, b) => a.cap - b.cap);
    if (state.sort === 'cap-desc') list.sort((a, b) => b.cap - a.cap);
    if (state.sort === 'az') list.sort((a, b) => a.name.localeCompare(b.name, 'es') || a.cap - b.cap);
    return list;
  };

  /* Dropdowns */
  const dds = $$('[data-dd]', root).map((wrap) => {
    const k = wrap.dataset.dd, box = $('.dd', wrap), btn = $('.dd__btn', wrap), list = $('.dd__list', wrap);
    list.innerHTML = OPTS[k].map((o, i) => `<li class="dd__opt" role="option" id="dd-${k}-${i}" data-v="${esc(o[0])}" aria-selected="false">${dot(k, o[0])}<span class="dd__text">${esc(o[1])}</span>${o[3] != null ? `<span class="dd__count">${o[3]}</span>` : ''}<i class="ph ph-check dd__check" aria-hidden="true"></i></li>`).join('');
    const opts = $$('.dd__opt', list);
    let fi = 0;
    const focusOpt = (i) => { fi = (i + opts.length) % opts.length; opts.forEach((o, j) => o.classList.toggle('is-focus', j === fi)); list.setAttribute('aria-activedescendant', opts[fi].id); if (opts[fi].offsetTop < list.scrollTop || opts[fi].offsetTop > list.scrollTop + list.clientHeight - 40) list.scrollTop = Math.max(0, opts[fi].offsetTop - list.clientHeight / 2); };
    const open = (on) => {
      if (on) dds.forEach((d) => d !== api && d.open(false));
      else if (!box.classList.contains('is-open')) return;
      box.classList.toggle('is-open', on);
      btn.setAttribute('aria-expanded', String(on));
      if (on) { focusOpt(Math.max(0, opts.findIndex((o) => o.dataset.v === state[k]))); list.focus({ preventScroll: true }); }
    };
    const pick = (v) => { open(false); btn.focus({ preventScroll: true }); set({ [k]: v }); };
    btn.addEventListener('click', () => open(!box.classList.contains('is-open')));
    btn.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); open(true); } });
    list.addEventListener('click', (e) => { const o = e.target.closest('.dd__opt'); if (o) pick(o.dataset.v); });
    list.addEventListener('mousemove', (e) => { const o = e.target.closest('.dd__opt'); if (o) focusOpt(opts.indexOf(o)); });
    list.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); focusOpt(fi + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); focusOpt(fi - 1); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(opts[fi].dataset.v); }
      else if (e.key === 'Escape' || e.key === 'Tab') { open(false); if (e.key === 'Escape') btn.focus(); }
    });
    const sync = () => {
      $('.dd__value', wrap).textContent = text(k, state[k]);
      opts.forEach((o) => o.setAttribute('aria-selected', String(o.dataset.v === state[k])));
      const sw = $('[data-dd-swatch]', wrap);
      if (sw) { sw.classList.toggle('dd__dot--all', !state[k]); sw.style.background = state[k] ? HEX[state[k]] : ''; }
    };
    const api = { open, sync, box };
    return api;
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.dd')) dds.forEach((d) => d.open(false)); });

  /* Pills (hoja mobile) */
  $$('[data-pills]', root.ownerDocument).forEach((box) => {
    const k = box.dataset.pills;
    box.innerHTML = OPTS[k].filter((o) => o[0]).map((o) => `<button class="pill" type="button" data-pill-k="${k}" data-v="${esc(o[0])}" aria-pressed="false">${dot(k, o[0]).replace('dd__dot', 'pill__dot')}${esc(o[2] || o[1])}</button>`).join('');
  });
  document.addEventListener('click', (e) => { const p = e.target.closest('[data-pill-k]'); if (p) set({ [p.dataset.pillK]: state[p.dataset.pillK] === p.dataset.v ? '' : p.dataset.v }); });

  const pagerBtn = (n) => `<button class="pager__btn" type="button" data-ppage="${n}"${n === state.page ? ' aria-current="page"' : ''} aria-label="Página ${n}">${n}</button>`;

  const render = (animate) => {
    const list = filtered();
    pages = Math.max(1, Math.ceil(list.length / PER));
    state.page = Math.min(state.page, pages);
    const slice = list.slice((state.page - 1) * PER, state.page * PER);
    grid.innerHTML = slice.map(card).join('');
    grid.hidden = !list.length;
    $('[data-pempty]').hidden = list.length > 0;
    $('[data-presults]').textContent = list.length ? `Mostrando ${slice.length} de ${list.length} productos` : '';
    if (animate) { grid.classList.remove('is-updating'); void grid.offsetWidth; grid.classList.add('is-updating'); }
    const active = KEYS.filter((k) => state[k]);
    $('[data-pchips]').innerHTML = active.map((k) => { const t = OPTS[k].find((o) => o[0] === state[k]); const lbl = t[2] || t[1]; return `<li><button class="blog-chip" type="button" data-pclear="${k}" aria-label="Quitar filtro ${esc(lbl)}">${esc(lbl)}<i class="ph ph-x" aria-hidden="true"></i></button></li>`; }).join('');
    $('[data-pfilters-label]').textContent = active.length ? `Filtros (${active.length})` : 'Filtros';
    $$('[data-preset]').forEach((b) => { if (b.closest('.blog-bar')) b.hidden = !(active.length || state.q); });
    $$('[data-pill-k]').forEach((p) => p.setAttribute('aria-pressed', String(state[p.dataset.pillK] === p.dataset.v)));
    const ap = $('[data-papply]'); if (ap) ap.textContent = list.length ? `Ver ${list.length} productos` : 'Sin resultados';
    dds.forEach((d) => d.sync());
    const pager = $('[data-ppager]');
    pager.innerHTML = pages < 2 ? '' :
      `<button class="pager__btn pager__btn--arrow" type="button" data-ppage="${state.page - 1}" aria-label="Página anterior"${state.page === 1 ? ' disabled' : ''}><i class="ph ph-caret-left"></i></button>
       <span class="pager__nums">${Array.from({ length: pages }, (_, i) => pagerBtn(i + 1)).join('')}</span>
       <button class="pager__btn pager__btn--arrow" type="button" data-ppage="${state.page + 1}" aria-label="Página siguiente"${state.page === pages ? ' disabled' : ''}><i class="ph ph-caret-right"></i></button>`;
  };

  /* Volver al inicio de resultados (filtros + contador) */
  const tools = root.querySelector('.blog-tools') || root;
  const count = $('[data-presults]');
  if (count) { count.removeAttribute('aria-live'); count.tabIndex = -1; }
  const live = Object.assign(document.createElement('span'), { className: 'visually-hidden' });
  live.setAttribute('aria-live', 'polite'); live.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap';
  root.append(live);
  const layoutTop = (el) => { let y = 0; for (let n = el; n; n = n.offsetParent) y += n.offsetTop; return y; };
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const toResults = (focus) => {
    const header = document.querySelector('.site-header');
    const off = (header ? header.offsetHeight : 0) + 24;
    const top = layoutTop(tools) - window.scrollY;
    const done = () => { if (focus && count) count.focus({ preventScroll: true }); };
    if (top >= off - 2 && top < innerHeight * 0.6) return done(); // ya está a la vista
    if (window.lenis) window.lenis.scrollTo(layoutTop(tools) - off, { immediate: reduced(), lock: true, onComplete: done });
    else { window.scrollTo({ top: top + scrollY - off, behavior: reduced() ? 'auto' : 'smooth' }); setTimeout(done, reduced() ? 0 : 600); }
  };
  let pages = 1;
  // Filtros, orden y página en la URL: compartible y compatible con "atrás"
  const PARAM = { q: 'q', line: 'categoria', sector: 'sector', cap: 'litraje', color: 'color', sort: 'orden', page: 'page' };
  const readUrl = () => {
    const s = new URLSearchParams(location.search);
    Object.entries(PARAM).forEach(([k, name]) => { const v = s.get(name); state[k] = k === 'page' ? (parseInt(v, 10) || 1) : k === 'sort' ? (v || 'dest') : (v || ''); });
  };
  const syncControls = () => {
    $$('[data-pfilter]').forEach((el) => { if (el.value !== state.q) el.value = state.q; });
    $$('[data-psort]').forEach((el) => { el.value = state.sort; });
  };
  const syncUrl = (push) => {
    const u = new URL(location.href);
    Object.entries(PARAM).forEach(([k, name]) => { const v = state[k]; if (v && !(k === 'sort' && v === 'dest') && !(k === 'page' && v < 2)) u.searchParams.set(name, v); else u.searchParams.delete(name); });
    if (u.href !== location.href) history[push ? 'pushState' : 'replaceState']({ page: state.page }, '', u);
  };
  const set = (patch) => {
    Object.assign(state, patch, patch.page ? {} : { page: 1 });
    $$('[data-pfilter]').forEach((el) => { if (el.value !== state.q) el.value = state.q; });
    $$('[data-psort]').forEach((el) => { el.value = state.sort; });
    render(true);
    if (!patch.page) { syncUrl(false); if (!('q' in patch) && !('sort' in patch) && !(sheet && sheet.classList.contains('is-open'))) toResults(false); }
  };

  let qt;
  $$('[data-pfilter]').forEach((el) => el.addEventListener('input', () => { clearTimeout(qt); qt = setTimeout(() => set({ q: el.value }), 200); }));
  $$('[data-psort]').forEach((el) => el.addEventListener('change', () => set({ sort: el.value })));
  document.addEventListener('click', (e) => {
    const c = e.target.closest('[data-pclear]'); if (c) set({ [c.dataset.pclear]: '' });
    if (e.target.closest('[data-preset]')) set({ q: '', line: '', sector: '', cap: '', color: '' });
    const pg = e.target.closest('[data-ppage]');
    if (pg && !pg.disabled) {
      set({ page: +pg.dataset.ppage });
      syncUrl(true);
      live.textContent = `Página ${state.page} de ${pages}`;
      toResults(true);
    }
  });

  /* Hoja de filtros (mobile) */
  const sheet = $('[data-psheet]'), toggle = $('[data-psheet-open]');
  const scrim = Object.assign(document.createElement('div'), { className: 'blog-scrim', hidden: true });
  document.body.append(scrim);
  // La hoja vive en <body>: dentro de la sección quedaba atrapada bajo el scrim (contexto de apilamiento)
  if (sheet) document.body.append(sheet);
  const openSheet = (open) => {
    sheet.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    if (open) { scrim.hidden = false; requestAnimationFrame(() => scrim.classList.add('is-open')); setTimeout(() => $('.pill', sheet)?.focus(), 300); }
    else { scrim.classList.remove('is-open'); setTimeout(() => { scrim.hidden = true; }, 300); toggle.focus({ preventScroll: true }); }
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (window.lenis) open ? window.lenis.stop() : window.lenis.start();
  };
  toggle.addEventListener('click', () => openSheet(true));
  $$('[data-psheet-close]').forEach((b) => b.addEventListener('click', () => openSheet(false)));
  scrim.addEventListener('click', () => openSheet(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && sheet.classList.contains('is-open')) openSheet(false); });

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (location.hash === '#catalogo' || performance.getEntriesByType?.('navigation')[0]?.type === 'back_forward') window.scrollTo(0, 0);
  /* Volver desde una ficha: misma posición, mismos filtros y tarjeta resaltada */
  const KEY = 'ese:catalog';
  const store = { get: () => { try { return JSON.parse(sessionStorage.getItem(KEY)); } catch (e) { return null; } }, set: (v) => { try { sessionStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }, clear: () => { try { sessionStorage.removeItem(KEY); } catch (e) {} } };
  grid.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]'); if (!a) return;
    store.set({ search: location.search, y: window.lenis ? window.lenis.scroll : scrollY, key: a.closest('[data-pkey]')?.dataset.pkey || '' });
  });
  const highlight = (key) => {
    const li = key && [...grid.querySelectorAll('[data-pkey]')].find((x) => x.dataset.pkey === key);
    const card = li && li.querySelector('.product-card'); if (!card) return;
    card.classList.add('is-return');
    (card.querySelector('a[href]') || card).focus({ preventScroll: true });
    setTimeout(() => card.classList.remove('is-return'), 1200);
  };
  const shown = () => requestAnimationFrame(() => document.documentElement.classList.remove('is-jumping'));
  const jump = (y) => { window.scrollTo(0, y); if (window.lenis) window.lenis.scrollTo(y, { immediate: true, force: true }); shown(); };
  const restore = () => {
    const nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    const saved = store.get();
    if (nav && nav.type === 'back_forward' && saved) {
      jump(saved.y); highlight(saved.key);
      requestAnimationFrame(() => jump(saved.y));
      return;
    }
    store.clear(); // entrada nueva: comportamiento normal
    if (location.hash !== '#catalogo') shown();
    if (location.hash === '#catalogo') {
      const header = document.querySelector('.site-header');
      const off = (header ? header.offsetHeight : 0) + 24;
      const go = () => { const hd = document.querySelector('.site-header'); jump(layoutTop(tools) - ((hd && hd.offsetHeight) || 85) - 24); };
      go(); requestAnimationFrame(go);
      if (document.readyState !== 'complete') addEventListener('load', () => requestAnimationFrame(go), { once: true }); // tras imágenes/fuentes
    }
  };
  readUrl(); syncControls();
  render(false);
  restore();
  // bfcache: la página vuelve intacta, solo resaltamos
  addEventListener('pageshow', (e) => { if (e.persisted) { const s = store.get(); if (s) highlight(s.key); } });
  addEventListener('popstate', () => {
    const prev = state.page; readUrl(); syncControls(); render(true);
    if (state.page !== prev) live.textContent = `Página ${state.page} de ${pages}`;
    toResults(false);
  });
  // "Ver productos" en la hoja mobile: al cerrar, volver a resultados
  $$('[data-papply]').forEach((b) => b.addEventListener('click', () => setTimeout(() => toResults(false), 320)));
})();
