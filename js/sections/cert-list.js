/* ==========================================================================
   Certificaciones — filtro por categoría (tabs en desktop, select en mobile)
   y "Ver más" en mobile (muestra 4 al inicio)
   ========================================================================== */
(() => {
  const root = document.querySelector('[data-certlist]');
  if (!root) return;
  const items = [...root.querySelectorAll('.cert-card-item')];
  const tabs = root.querySelector('[data-tabs]');
  const sel = root.querySelector('[data-certlist-select]');
  const more = root.querySelector('[data-certlist-more]');
  const mq = matchMedia('(max-width: 47.99em)');
  const LIMIT = 4;
  let cat = 'todas', expanded = false;

  const render = (animate) => {
    const match = items.filter((i) => cat === 'todas' || i.dataset.cat === cat);
    const limit = mq.matches && !expanded ? LIMIT : Infinity;
    items.forEach((i) => { i.hidden = true; i.classList.remove('is-entering'); });
    match.forEach((i, n) => {
      if (n >= limit) return;
      i.hidden = false;
      if (animate) { i.style.animationDelay = (n * 50) + 'ms'; void i.offsetWidth; i.classList.add('is-entering'); }
    });
    root.classList.toggle('is-all-shown', match.length <= limit);
    if (more) more.setAttribute('aria-expanded', String(expanded));
  };
  const set = (v) => {
    if (v === cat) return;
    cat = v; expanded = false;
    if (sel) sel.value = v;
    if (tabs && tabs.tabsSelect) tabs.tabsSelect(v, { silent: true });
    render(true);
  };
  tabs && tabs.addEventListener('tabs:change', (e) => set(e.detail.value));
  sel && sel.addEventListener('change', () => set(sel.value));
  more && more.addEventListener('click', () => { expanded = true; render(true); });
  mq.addEventListener('change', () => render(false));
  render(false);
})();

/* Popup de detalle: navegación anterior / siguiente entre las 8 certificaciones */
(() => {
  const dlg = document.querySelector('[data-cert-modal]');
  if (!dlg || !dlg.showModal) return;
  const cards = [...document.querySelectorAll('.cert-card')];
  const $ = (s) => dlg.querySelector(s);
  const head = $('.cert-modal__head'), body = $('[data-cm-body]');
  const data = cards.map((c) => ({
    name: c.querySelector('.cert-card__name').textContent.trim(),
    tag: c.querySelector('.cert-card__tag').textContent.trim(),
    desc: c.querySelector('.cert-card__desc').textContent.trim(),
    logo: c.querySelector('.cert-card__logo').innerHTML,
    body: c.querySelector('.cert-card__detail')?.innerHTML || '<p>Contenido pendiente.</p>',
  }));
  let i = 0, opener = null;
  const fill = () => {
    const d = data[i], n = data.length;
    $('[data-cm-logo]').innerHTML = d.logo.replace(/loading="lazy"/, '');
    $('[data-cm-tag]').textContent = d.tag;
    $('[data-cm-name]').textContent = d.name;
    $('[data-cm-desc]').textContent = d.desc;
    body.innerHTML = d.body;
    $('[data-cm-prev-name]').textContent = data[(i - 1 + n) % n].name;
    $('[data-cm-next-name]').textContent = data[(i + 1) % n].name;
    $('[data-cm-count]').textContent = (i + 1) + ' de ' + n;
  };
  const go = (step) => {
    i = (i + step + data.length) % data.length;
    [head, body].forEach((el) => el.classList.add('is-swapping'));
    setTimeout(() => { fill(); [head, body].forEach((el) => el.classList.remove('is-swapping')); }, 180);
  };
  const close = () => { dlg.close(); };
  cards.forEach((c, k) => c.addEventListener('click', () => {
    i = k; opener = c; fill(); dlg.showModal();
    window.lenis && window.lenis.stop();
  }));
  dlg.addEventListener('close', () => { window.lenis && window.lenis.start(); opener && opener.focus({ preventScroll: true }); });
  $('[data-cm-close]').addEventListener('click', close);
  $('[data-cm-prev]').addEventListener('click', () => go(-1));
  $('[data-cm-next]').addEventListener('click', () => go(1));
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
  dlg.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1); });
})();
