/* Tarjeta de producto — UN solo componente (.product-card) para todo el sitio:
   grilla de Productos, carrusel del home, relacionados y Municipalidades.
   En WordPress equivale a un único template part. Todo sale del dataset (window.PRODUCTS).
   Uso: ProductCard.html(producto, { current, href, sizes, lazy })
        <ul data-pc-fill='{"categoria":["id",…]}' data-products-track> → slides del carrusel
        <div data-pc-card="id"></div> → tarjeta suelta */
(() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const byId = (id) => (window.PRODUCTS || []).find((p) => p.id === id);

  const capRange = (p) => {
    const vs = p.variants.filter((v) => v.cap);
    if (!vs.length) return '—';
    if (vs.length === 1) return vs[0].label;
    const a = vs[0].label, b = vs[vs.length - 1].label, unit = b.replace(/^[\d.,\s]+/, '');
    return a.replace(unit, '').trim() + ' – ' + b;
  };

  // Ítem de lista: "id" · "id:cap" · "id:cap:clips" → producto + variante fija
  const parse = (key) => {
    const [id, cap, ver] = String(key).split(':');
    const p = byId(id); if (!p) return null;
    const c = cap ? parseInt(cap, 10) : null;
    return { p, cap: c && p.variants.some((v) => v.cap === c) ? c : null, clips: ver === 'clips' };
  };
  const pickVariant = (p, cap, clips) => {
    const CO = window.ESE_COLORS;
    const v = p.variants.find((x) => x.cap === cap);
    if (!v) return null;
    const pool = v.colors.filter((c) => c.img && (!CO || CO.isCombo(c.name) === !!clips));
    const fv = !clips && window.featuredVariant ? window.featuredVariant(p, { cap }) : null;
    return fv && fv.v === v ? fv : (pool[0] ? { v, c: pool[0] } : null);
  };
  const html = (p, o = {}) => {
    if (!p) return '';
    const cur = o.current || (o.cap && pickVariant(p, o.cap, o.clips)) || (window.featuredVariant ? window.featuredVariant(p) : null);
    let href = o.href || (window.CardSwatches ? window.CardSwatches.fichaHref(p, o.clips && cur && cur.c ? cur.c.name : null) : 'producto.html?id=' + p.id);
    if (o.cap && !o.href) href += (href.includes('?') ? '&' : '?') + 'cap=' + o.cap;
    const img = cur && cur.c && cur.c.img;
    const alt = p.name + (cur && cur.v && cur.v.label ? ' ' + cur.v.label : '') + (cur && cur.c && cur.c.name ? ', ' + cur.c.name.toLowerCase() : '');
    const media = img
      ? `<img src="${img}-400.webp" srcset="${img}-400.webp 400w, ${img}-800.webp 800w" sizes="${o.sizes || '(min-width: 64em) 260px, 220px'}" width="400" height="500" alt="${esc(alt)}"${o.lazy === false ? '' : ' loading="lazy"'} decoding="async" draggable="false">`
      : '<div class="placeholder product-card__ph" aria-hidden="true"><span class="placeholder__label">imagen pendiente</span></div>';
    const sw = window.CardSwatches ? window.CardSwatches.html(p, cur) : '';
    return `<article class="product-card${o.dark ? ' product-card--dark' : ''}" data-theme="${esc(p.theme || 'azul')}" data-pc-ready data-pc-href="${esc(href)}">
  <div class="product-card__media"><span class="product-card__sparks" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span><div class="product-card__img">${media}</div></div>
  <div class="product-card__body">
    <div class="product-card__head">
      <p class="product-card__cat">${esc(p.destacado || p.line)}</p>
      <h3 class="product-card__title" aria-label="${esc(p.name)}">${p.titulo1 && p.titulo2 ? `<span class="product-card__type">${esc(p.titulo1)}</span><span class="product-card__model">${esc(p.titulo2)}</span>` : esc(p.name)}</h3>
      ${sw}
    </div>
    <dl class="product-card__specs"><div><dt>Litraje</dt><dd>${esc(o.cap && cur && cur.v ? cur.v.label : capRange(p))}</dd></div></dl>
  </div>
  <a class="product-card__cta" href="${esc(href)}">Ver ficha y cotizar<span class="product-card__arrow" aria-hidden="true"><i class="ph ph-arrow-right"></i></span></a>
</article>`;
  };

  /* Carruseles y tarjetas sueltas: se completan antes de que corra el carrusel (scripts defer en orden) */
  const fill = () => {
    document.querySelectorAll('[data-pc-fill]').forEach((track) => {
      let groups = {}; try { groups = JSON.parse(track.dataset.pcFill); } catch (e) {}
      // data-pc-sector="municipalidades" → lista de window.SECTOR_RECO
      const sec = track.dataset.pcSector && window.SECTOR_RECO && window.SECTOR_RECO[track.dataset.pcSector];
      if (sec) groups = { reco: sec.items };
      track.innerHTML = Object.entries(groups).map(([cat, ids]) => ids.map(parse).filter(Boolean).map((it) =>
        `<li class="s-products__slide" data-product data-category="${esc(cat)}">${html(it.p, { dark: track.dataset.pcVariant === 'dark', cap: it.cap, clips: it.clips })}</li>`).join('')).join('');
    });
    document.querySelectorAll('[data-pc-card]').forEach((el) => { el.outerHTML = html(byId(el.dataset.pcCard)); });
  };
  window.ProductCard = { html, capRange, fill };
  fill();
})();
