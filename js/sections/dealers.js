/* ==========================================================================
   Distribuidores (página): filtros (búsqueda, país, sector), cards, paginación,
   hoja de país en mobile y globo con marcadores sincronizados.
   Datos: window.DISTRIBUTORS (js/data/distributors.js)
   ========================================================================== */
(() => {
  const root = document.querySelector('[data-dealers]');
  if (!root) return;
  const ITEMS = window.DISTRIBUTORS || [];
  const $ = (s, el = root) => el.querySelector(s);
  const $$ = (s, el = root) => [...el.querySelectorAll(s)];
  const norm = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const uniq = (a) => [...new Set(a)].sort((x, y) => x.localeCompare(y, 'es'));
  const plural = (n, s, p) => n + ' ' + (n === 1 ? s : p);
  const mobile = matchMedia('(max-width: 47.99em)');
  const per = () => Infinity; // todos los distribuidores visibles, sin "Ver más"
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const COUNTRIES = uniq(ITEMS.map((d) => d.country));
  const OPTS = {
    country: [['', 'Todos los países'], ...COUNTRIES.map((c) => [c, c, ITEMS.filter((d) => d.country === c).length])],
    sector: [['', 'Todos los sectores'], ...uniq(ITEMS.flatMap((d) => d.sectors)).map((s) => [s, s, ITEMS.filter((d) => d.sectors.includes(s)).length])],
  };
  const state = { q: '', country: '', sector: '', page: 1, hover: null };

  const filtered = () => {
    const q = norm(state.q.trim());
    return ITEMS.filter((d) =>
      (!q || norm([d.name, d.city, d.country, d.rep].join(' ')).includes(q)) &&
      (!state.country || d.country === state.country) &&
      (!state.sector || d.sectors.includes(state.sector)));
  };

  /* ---------- Card ---------- */
  const info = (icon, label, value) => `<div class="dealer-info"><span class="dealer-info__icon" aria-hidden="true"><i class="ph ph-${icon}"></i></span><dl><dt>${label}</dt><dd>${value}</dd></dl></div>`;
  const host = (u) => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  const card = (d) => `<li><article class="dealer-card" data-id="${d.id}">
    <header class="dealer-card__head">
      <span class="dealer-card__logo"><img src="${d.logo}" width="240" height="240" alt="${esc(d.name)}" loading="lazy" decoding="async"></span>
      <div><p class="dealer-card__place">${d.city ? esc(d.city) + ', ' : ''}${esc(d.country)}</p><h2 class="dealer-card__name">${esc(d.name)}</h2></div>
    </header>
    <div class="dealer-card__info">
      ${info('user', 'Representante', esc(d.rep))}
      ${info('phone', 'Teléfono', `<a href="tel:${d.phone.replace(/\s/g, '')}">${esc(d.phone)}</a>`)}
      ${info('envelope-simple', 'Correo', `<a href="mailto:${d.email}">${esc(d.email)}</a>`)}
      ${info('globe', 'Sitio web', d.web ? `<a href="${d.web}" target="_blank" rel="noopener" title="${esc(host(d.web))}">${esc(host(d.web))}</a>` : '—')}
    </div>
    ${d.web || d.wa ? `<div class="dealer-card__actions">
      ${d.web ? `<a class="btn btn--ghost btn--sm" href="${d.web}" target="_blank" rel="noopener">Visitar web</a>` : ''}
      ${d.wa ? `<a class="btn btn--whatsapp btn--sm" href="https://wa.me/${d.wa}" target="_blank" rel="noopener"><span class="btn__icon btn__icon--start"><i class="ph-light ph-whatsapp-logo" aria-hidden="true"></i></span>WhatsApp</a>` : ''}
    </div>` : ''}
  </article></li>`;

  /* ---------- Render ---------- */
  const list = $('[data-dlist]'), more = $('[data-dmore]'), empty = $('[data-dempty]'), note = $('[data-dnote]');
  const count = $('[data-dcount]'), chips = $('[data-dchips]');
  const render = () => {
    const res = filtered();
    const PER = per();
    const shown = res.slice(0, state.page * PER);
    list.innerHTML = shown.map(card).join('');
    if (!reduced) $$('.dealer-card', list).slice(-(shown.length - (state.page - 1) * PER)).forEach((c, i) => c.animate?.([{ opacity: 0, transform: 'translateY(1rem)' }, { opacity: 1, transform: 'none' }], { duration: 600, delay: i * 60, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'backwards' }));
    const rest = res.length - shown.length;
    more.hidden = rest <= 0;
    more.textContent = 'Ver más distribuidores (' + rest + ')';
    empty.hidden = res.length > 0;
    const nC = new Set(res.map((d) => d.country)).size;
    const q = state.q.trim();
    count.textContent = !res.length && q ? '0 resultados para «' + q + '»'
      : state.country ? plural(res.length, 'distribuidor', 'distribuidores') + ' en ' + state.country
      : plural(res.length, 'distribuidor', 'distribuidores') + ' en ' + plural(nC, 'país', 'países');
    chips.innerHTML = ['country', 'sector'].filter((k) => state[k]).map((k) => `<li><button class="blog-chip" type="button" data-chip="${k}" aria-label="Quitar filtro ${esc(state[k])}">${esc(state[k])}<i class="ph ph-x" aria-hidden="true"></i></button></li>`).join('');
    const dirty = !!(q || state.country || state.sector);
    $$('.dealers-bar [data-dreset]').forEach((b) => (b.hidden = !dirty));
    note.hidden = !state.country || !res.length;
    note.textContent = state.country ? 'Mostrando los distribuidores de ' + state.country + '. Quita el filtro o elige otro país en el globo para ver más.' : '';
    syncDD();
    syncGlobe();
  };
  // Al filtrar (globo, país, sector) la lista se acorta: si estábamos más abajo, volvemos al inicio de resultados
  // ANTES de renderizar, para que el navegador no recorte el scroll y deje la página en el footer.
  const layoutEl = document.querySelector('.dealers-layout') || list;
  const resultsTop = () => { let y = 0; for (let n = layoutEl; n; n = n.offsetParent) y += n.offsetTop; const hd = document.querySelector('.site-header'); return Math.max(0, y - ((hd && hd.offsetHeight) || 85) - 24); };
  const set = (patch) => {
    const filterChange = ['country', 'sector'].some((k) => k in patch && patch[k] !== state[k]);
    const cur = window.lenis ? window.lenis.scroll : scrollY, top = resultsTop();
    Object.assign(state, { page: 1 }, patch);
    if (filterChange && cur > top) { window.scrollTo(0, top); window.lenis?.scrollTo(top, { immediate: true, force: true }); }
    render();
  };
  more.addEventListener('click', () => { state.page++; render(); });
  $$('[data-dreset]').forEach((b) => b.addEventListener('click', reset));
  function reset() { $('[data-dq]').value = ''; set({ q: '', country: '', sector: '' }); }
  chips.addEventListener('click', (e) => { const k = e.target.closest('[data-chip]')?.dataset.chip; if (k) set({ [k]: '' }); });
  let qt; $('[data-dq]').addEventListener('input', (e) => { clearTimeout(qt); qt = setTimeout(() => {
    const v = e.target.value; const hit = COUNTRIES.find((c) => norm(c) === norm(v.trim()));
    set(hit ? { q: '', country: hit } : { q: v });
    if (hit) e.target.value = '';
  }, 220); });

  /* ---------- Dropdowns (.dd) ---------- */
  const dds = $$('[data-dd]').map((wrap) => {
    const k = wrap.dataset.dd, box = $('.dd', wrap), btn = $('.dd__btn', wrap), ul = $('.dd__list', wrap), val = $('.dd__value', wrap);
    ul.innerHTML = OPTS[k].map((o, i) => `<li class="dd__opt" role="option" id="dd-${k}-${i}" data-v="${esc(o[0])}" aria-selected="false"><span class="dd__text">${esc(o[1])}</span>${o[2] != null ? `<span class="dd__count">${o[2]}</span>` : ''}<i class="ph ph-check dd__check" aria-hidden="true"></i></li>`).join('');
    const close = () => { box.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); };
    btn.addEventListener('click', () => {
      if (k === 'country' && mobile.matches) { openSheet(); return; }
      const open = !box.classList.contains('is-open');
      dds.forEach((d) => d.close()); if (open) { box.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); ul.focus({ preventScroll: true }); }
    });
    ul.addEventListener('click', (e) => { const o = e.target.closest('.dd__opt'); if (!o) return; set({ [k]: o.dataset.v }); close(); btn.focus(); });
    ul.addEventListener('keydown', (e) => { if (e.key === 'Escape') { close(); btn.focus(); } });
    const sync = () => { val.textContent = OPTS[k].find((o) => o[0] === state[k])?.[1] || OPTS[k][0][1]; $$('.dd__opt', ul).forEach((o) => o.setAttribute('aria-selected', String(o.dataset.v === state[k]))); };
    return { close, sync, box };
  });
  function syncDD() { dds.forEach((d) => d.sync()); }
  document.addEventListener('click', (e) => dds.forEach((d) => { if (!d.box.contains(e.target)) d.close(); }));

  /* ---------- Hoja de país (mobile) ---------- */
  const sheet = $('[data-dsheet]'), sheetList = $('[data-dsheet-list]'), apply = $('[data-dsheet-apply]');
  let pick = '';
  const drawSheet = () => {
    sheetList.innerHTML = OPTS.country.map((o) => `<li><button class="dealers-sheet__opt" type="button" role="radio" aria-checked="${o[0] === pick}" data-v="${esc(o[0])}"><span class="dealers-sheet__radio" aria-hidden="true"></span>${esc(o[1])}${o[2] != null ? `<span class="dealers-sheet__count">(${o[2]})</span>` : ''}</button></li>`).join('');
    const n = ITEMS.filter((d) => (!pick || d.country === pick) && (!state.sector || d.sectors.includes(state.sector))).length;
    apply.textContent = 'Ver ' + plural(n, 'distribuidor', 'distribuidores');
  };
  function openSheet() { pick = state.country; drawSheet(); sheet.hidden = false; document.body.classList.add('is-locked'); window.lenis?.stop(); sheetList.querySelector('[aria-checked="true"]')?.focus(); }
  const closeSheet = () => { sheet.hidden = true; document.body.classList.remove('is-locked'); window.lenis?.start(); $('[data-dd="country"] .dd__btn').focus({ preventScroll: true }); };
  sheetList.addEventListener('click', (e) => { const o = e.target.closest('[data-v]'); if (!o) return; pick = o.dataset.v; drawSheet(); sheetList.querySelector('[aria-checked="true"]')?.focus(); });
  $$('[data-dsheet-close]').forEach((b) => b.addEventListener('click', closeSheet));
  $('[data-dsheet-reset]').addEventListener('click', () => { pick = ''; drawSheet(); });
  apply.addEventListener('click', () => { set({ country: pick }); closeSheet(); });
  sheet.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });

  /* ---------- Globo ---------- */
  const map = $('.dealers-map'), stage = $('[data-globe]'), layer = $('[data-globe-markers]');
  const pop = $('[data-dpop]'), popStatic = $('[data-dpop-static]');
  const D2R = Math.PI / 180;
  let globe = null, vec = null, tmp = null;
  const points = ITEMS.map((d) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'globe-marker';
    b.setAttribute('aria-label', d.country + ': ver distribuidores');
    b.innerHTML = `<span class="tooltip tooltip--light" aria-hidden="true">${esc(d.country)}</span>`;
    b.addEventListener('click', () => { $('[data-dq]').value = ''; set({ q: '', country: state.country === d.country ? '' : d.country }); });
    layer.append(b);
    return { d, el: b, local: null, x: 0, y: 0 };
  });
  const activeCountry = () => state.hover?.country || state.country || '';
  const popHTML = (c) => {
    const ds = ITEMS.filter((d) => d.country === c);
    return `<div class="dealers-pop__head"><p class="dealers-pop__country">${esc(c)}</p><span class="dealers-pop__count">${plural(ds.length, 'distribuidor', 'distribuidores')}</span></div>
      <ul class="dealers-pop__list" role="list">${ds.map((d) => `<li class="dealers-pop__item"><img src="${d.logo}" width="28" height="28" alt=""><span><span class="dealers-pop__name">${esc(d.name)}</span><span class="dealers-pop__city">${esc(d.city || d.country)}</span></span></li>`).join('')}</ul>`;
  };
  let popFor = null;
  function syncGlobe() {
    const c = activeCountry();
    const first = points.find((p) => p.d.country === c);
    points.forEach((p) => { p.el.classList.toggle('is-active', p.d.country === c); p.el.classList.toggle('is-label', p === first); });
    if (popFor !== c) {
      popFor = c;
      pop.hidden = popStatic.hidden = !c;
      if (c) pop.innerHTML = popStatic.innerHTML = popHTML(c);
    }
    $$('.dealer-card', list).forEach((el) => el.classList.toggle('is-active', !!state.hover && +el.dataset.id === state.hover.id));
    const target = state.hover || first?.d;
    if (globe && target) globe.focus(target.lat, target.lon);
    placePop();
  }
  function placePop() {
    const c = activeCountry(); if (!c || pop.hidden) return;
    const ps = points.filter((p) => p.d.country === c && !p.el.classList.contains('is-hidden'));
    if (!ps.length) return;
    const x = layer.offsetLeft + ps.reduce((s, p) => s + p.x, 0) / ps.length;
    const y = layer.offsetTop + Math.min(...ps.map((p) => p.y));
    const W = map.clientWidth, H = map.clientHeight, w = pop.offsetWidth, h = pop.offsetHeight, m = 16;
    const px = Math.max(m, Math.min(W - w - m, x - w * 0.45));
    const py = Math.max(m, Math.min(H - h - m, y - h - 28));
    pop.style.setProperty('--px', px + 'px'); pop.style.setProperty('--py', py + 'px');
  }
  const toLocal = (THREE, lat, lon) => {
    const phi = (lon + 180) * D2R, theta = (90 - lat) * D2R;
    return new THREE.Vector3(-Math.cos(phi) * Math.sin(theta), Math.cos(theta), Math.sin(phi) * Math.sin(theta)).multiplyScalar(1.003);
  };
  const place = () => {
    if (!globe || !vec) return;
    const { camera, spin } = globe.three;
    spin.updateMatrixWorld();
    const w = stage.clientWidth, h = stage.clientHeight;
    points.forEach((p) => {
      vec.copy(p.local).applyMatrix4(spin.matrixWorld);
      const facing = vec.dot(tmp.copy(camera.position).sub(vec)) > 0.02;
      vec.project(camera);
      p.x = ((vec.x + 1) / 2) * w; p.y = ((1 - vec.y) / 2) * h;
      p.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
      p.el.classList.toggle('is-hidden', !facing);
    });
    placePop();
  };
  const init = async () => {
    if (!window.PlanetaGlobe) return;
    try {
      globe = await window.PlanetaGlobe.create(stage, { lat: 0, lon: -75, colorMap: 'assets/globe/earth-color.jpg', roughnessMap: 'assets/globe/earth-roughness.jpg', rotMin: -125, rotMax: -40, onRender: place });
      const { THREE } = globe.three;
      vec = new THREE.Vector3(); tmp = new THREE.Vector3();
      points.forEach((p) => { p.local = toLocal(THREE, p.d.lat, p.d.lon); });
      syncGlobe(); place();
    } catch (err) { console.error(err); }
  };
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); init(); } }, { rootMargin: '400px 0px' });
  io.observe(stage);

  /* Hover en cards (desktop): ubica el distribuidor en el globo */
  let ht;
  list.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const el = e.target.closest('.dealer-card'); if (!el) return;
    const d = ITEMS.find((x) => x.id === +el.dataset.id);
    if (state.hover === d) return;
    clearTimeout(ht); state.hover = d; syncGlobe();
  });
  list.addEventListener('pointerleave', () => { ht = setTimeout(() => { state.hover = null; syncGlobe(); }, 250); });
  addEventListener('resize', placePop);

  /* Llegada desde el buscador: ?d=<id> → filtra por su país, lo ubica en el globo y resalta su card */
  const qd = ITEMS.find((x) => x.id === +new URLSearchParams(location.search).get('d'));
  if (qd) { state.country = qd.country; state.hover = qd; }
  render();
  if (qd) {
    syncDD();
    const go = () => {
      const el = list.querySelector('.dealer-card[data-id="' + qd.id + '"]'); if (!el) return;
      const y = el.getBoundingClientRect().top + scrollY - innerHeight * 0.3;
      if (window.lenis) window.lenis.scrollTo(y, { immediate: reduced }); else scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
      el.classList.add('is-found'); setTimeout(() => el.classList.remove('is-found'), 2200);
    };
    setTimeout(go, 500);
  }
})();
