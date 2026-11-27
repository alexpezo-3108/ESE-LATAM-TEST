/* Blog: filtros, chips, orden, paginación y hoja de filtros en mobile */
(() => {
  const root = document.querySelector('[data-blog]');
  const grid = document.querySelector('[data-grid]');
  if (!root || !grid) return;
  const POSTS = window.BLOG_POSTS || [];
  const PER = 8;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const state = { q: '', cat: '', sector: '', tag: '', sort: 'new', page: 1 };
  const KEYS = { cat: 'cat', sector: 'sector', tag: 'tag' };
  const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // Opciones de los selects desde los datos
  Object.entries(KEYS).forEach(([k, field]) => {
    const sel = $('[data-filter="' + k + '"]');
    [...new Set(POSTS.map((p) => p[field]))].sort((a, b) => a.localeCompare(b, 'es')).forEach((v) => sel.add(new Option(v, v)));
  });

  // Misma card que "Casos reales" (sector-municipalidades)
  const card = (p) => `<li class="case"><a class="case__link" href="${p.href}">
    <div class="case__media" aria-hidden="true">${p.img ? `<img src="${p.img}" alt="" loading="lazy" decoding="async">` : '<div class="placeholder"></div>'}</div>
    <div class="case__tags">
      <span class="case__tag${p.cat === 'Caso de éxito' ? ' case__tag--accent' : ''}">${esc(p.cat)}</span>
      ${p.country ? `<span class="case__tag">${esc(p.country)}</span>` : ''}
    </div>
    <div class="case__bottom">
      ${p.stats ? `<div class="case__stats">${p.stats.map(([n, l]) => `<div><span class="case__stat-n">${esc(n)}</span><span class="case__stat-l">${esc(l)}</span></div>`).join('')}</div>` : ''}
      <div class="case__foot">
        <div class="case__copy">
          <h2 class="case__title">${esc(p.title)}</h2>
          <div class="case__more"><p class="case__desc">${esc(p.desc || '')}</p></div>
        </div>
        <span class="case__arrow" aria-hidden="true"><i class="ph-bold ph-arrow-up-right"></i></span>
      </div>
    </div>
  </a></li>`;

  const filtered = () => {
    const q = norm(state.q.trim());
    let list = POSTS.filter((p) =>
      (!q || norm(p.title + ' ' + p.cat + ' ' + p.sector + ' ' + p.tag + ' ' + (p.country || '')).includes(q)) &&
      (!state.cat || p.cat === state.cat) && (!state.sector || p.sector === state.sector) && (!state.tag || p.tag === state.tag));
    if (state.sort === 'new') list.sort((a, b) => b.date.localeCompare(a.date));
    if (state.sort === 'old') list.sort((a, b) => a.date.localeCompare(b.date));
    if (state.sort === 'az') list.sort((a, b) => a.title.localeCompare(b.title, 'es'));
    return list;
  };

  const pagerBtn = (n) => `<button class="pager__btn" type="button" data-page="${n}"${n === state.page ? ' aria-current="page"' : ''} aria-label="Página ${n}">${n}</button>`;

  const render = (animate) => {
    const list = filtered();
    const pages = Math.max(1, Math.ceil(list.length / PER));
    state.page = Math.min(state.page, pages);
    const slice = list.slice((state.page - 1) * PER, state.page * PER);
    grid.innerHTML = slice.map(card).join('');
    $('[data-empty]').hidden = list.length > 0;
    $('[data-results-count]').textContent = list.length ? `Mostrando ${slice.length} de ${list.length} artículos` : '';
    if (animate) { grid.classList.remove('is-updating'); void grid.offsetWidth; grid.classList.add('is-updating'); }

    const active = Object.keys(KEYS).filter((k) => state[k]);
    $('[data-chips]').innerHTML = active.map((k) => `<li><button class="blog-chip" type="button" data-clear="${k}" aria-label="Quitar filtro ${esc(state[k])}">${esc(state[k])}<i class="ph ph-x" aria-hidden="true"></i></button></li>`).join('');
    $('[data-filters-label]').textContent = active.length ? `Filtros (${active.length})` : 'Filtros';
    $$('[data-reset]').forEach((b) => { if (b.closest('.blog-bar')) b.hidden = !(active.length || state.q); });

    const pager = $('[data-pager]');
    pager.innerHTML = pages < 2 ? '' :
      `<button class="pager__btn pager__btn--arrow" type="button" data-page="${state.page - 1}" aria-label="Página anterior"${state.page === 1 ? ' disabled' : ''}><i class="ph ph-arrow-left" aria-hidden="true"></i><span class="pager__label">Anterior</span></button>
       <span class="pager__nums">${Array.from({ length: pages }, (_, i) => pagerBtn(i + 1)).join('')}</span>
       <button class="pager__btn pager__btn--arrow" type="button" data-page="${state.page + 1}" aria-label="Página siguiente"${state.page === pages ? ' disabled' : ''}><span class="pager__label">Siguiente</span><i class="ph ph-arrow-right" aria-hidden="true"></i></button>`;
  };

  const sync = () => {
    $$('[data-filter]').forEach((el) => { el.value = state[el.dataset.filter]; });
    $$('[data-sort]').forEach((el) => { el.value = state.sort; });
  };
  const set = (patch) => { Object.assign(state, patch, patch.page ? {} : { page: 1 }); sync(); render(true); };

  let qt;
  $$('[data-filter]').forEach((el) => el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', () => {
    if (el.tagName === 'INPUT') { clearTimeout(qt); qt = setTimeout(() => set({ q: el.value }), 200); }
    else set({ [el.dataset.filter]: el.value });
  }));
  $$('[data-sort]').forEach((el) => el.addEventListener('change', () => set({ sort: el.value })));
  document.addEventListener('click', (e) => {
    const c = e.target.closest('[data-clear]'); if (c) set({ [c.dataset.clear]: '' });
    if (e.target.closest('[data-reset]')) set({ q: '', cat: '', sector: '', tag: '' });
    const pg = e.target.closest('[data-page]');
    if (pg && !pg.disabled) {
      set({ page: +pg.dataset.page });
      // Al inicio de la grilla. Con Lenis activo hay que usar su scroll (window.scrollTo se pisa y requería 2 clics)
      const hd = document.querySelector('.site-header');
      const off = (hd ? hd.offsetHeight : 80) + 24;
      const y = Math.max(0, grid.getBoundingClientRect().top + (window.lenis ? window.lenis.scroll : window.scrollY) - off);
      const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (window.lenis) window.lenis.scrollTo(y, { immediate: still, force: true, lock: true, duration: 0.9 });
      else window.scrollTo({ top: y, behavior: still ? 'auto' : 'smooth' });
    }
  });

  // Hoja de filtros (mobile)
  const sheet = $('[data-sheet]'), toggle = $('[data-sheet-open]');
  const scrim = Object.assign(document.createElement('div'), { className: 'blog-scrim', hidden: true });
  document.body.append(scrim);
  // En desktop la hoja es display: contents (contiene los filtros); en mobile se lleva a <body>
  // mientras está abierta para que no quede atrapada bajo el scrim, y luego vuelve a su lugar
  const home = document.createComment('blog-sheet');
  sheet.before(home);
  let back = null;
  const openSheet = (open) => {
    clearTimeout(back);
    if (open && sheet.parentElement !== document.body) { document.body.append(sheet); sheet.getBoundingClientRect(); }
    if (!open) back = setTimeout(() => home.after(sheet), 320);
    sheet.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    if (open) { scrim.hidden = false; requestAnimationFrame(() => scrim.classList.add('is-open')); setTimeout(() => $('select', sheet)?.focus(), 300); }
    else { scrim.classList.remove('is-open'); setTimeout(() => { scrim.hidden = true; }, 300); toggle.focus({ preventScroll: true }); }
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (window.lenis) open ? window.lenis.stop() : window.lenis.start();
  };
  toggle.addEventListener('click', () => openSheet(true));
  $$('[data-sheet-close]').forEach((b) => b.addEventListener('click', () => openSheet(false)));
  scrim.addEventListener('click', () => openSheet(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && sheet.classList.contains('is-open')) openSheet(false); });

  render(false);
})();
