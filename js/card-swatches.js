/* Swatches de color en tarjetas de producto (grilla, home, Municipalidades, relacionados).
   Se generan desde las variantes del producto (window.PRODUCTS) y el orden global (window.ESE_COLORS):
   si se agrega un color en WordPress aparece solo, en su posición. Sin valores fijos en el HTML. */
(() => {
  const MAX = 7;
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fine = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
  const byId = (id) => (window.PRODUCTS || []).find((p) => p.id === id);
  const CO = () => window.ESE_COLORS;

  // Colores únicos del producto, en el orden global, con la foto representativa (mismo litraje si existe)
  const colorsOf = (p, cap) => {
    const map = new Map();
    p.variants.forEach((v) => v.colors.forEach((c) => {
      if (!c.name) return;
      const prev = map.get(c.name);
      const better = c.img && (!prev || !prev.img || (v.cap === cap && prev.cap !== cap));
      if (!prev || better) map.set(c.name, { name: c.name, hex: c.hex, img: c.img, cap: v.cap });
    }));
    const list = [...map.values()];
    return CO() ? CO().sort(list) : list;
  };
  const fichaHref = (p, color) => {
    const u = new URLSearchParams({ id: p.id });
    if (color) { u.set('color', color); if (CO() && CO().isCombo(color)) u.set('version', 'clips'); }
    return 'producto.html?' + u.toString();
  };

  const html = (p, current) => {
    if (!p) return '';
    const cols = colorsOf(p, current && current.v && current.v.cap);
    if (!cols.length) {
      // Sin variantes de color: "N tamaños" (o nada si tiene uno solo); el litraje ya está en el chip de rango
      const n = p.variants.length;
      return `<div class="pc-sw pc-sw--none">${n > 1 ? `<span class="pc-sw__note">${n} tamaños</span>` : ''}</div>`;
    }
    const curName = current && current.c && current.c.name;
    // El color activo siempre visible: si cae después del 6.º, entra en lugar del último (manteniendo el orden global)
    let shown = cols.slice(0, MAX);
    if (curName && !shown.some((c) => c.name === curName)) { const cur = cols.find((c) => c.name === curName); if (cur) shown = cols.filter((c) => shown.slice(0, MAX - 1).includes(c) || c === cur); }
    const rest = cols.length - shown.length;
    // En reposo ningún punto se marca (la foto muestra el color destacado)
    return `<div class="pc-sw" role="group" aria-label="Colores disponibles" data-pc-sw="${esc(p.id)}">${shown.map((c, i) => {
      return `<a class="pc-sw__dot" href="${fichaHref(p, c.name)}" aria-label="Ver en ${esc(c.name)}" tabindex="${i === 0 ? 0 : -1}" data-color="${esc(c.name)}" data-img="${esc(c.img || '')}" style="--sw:${CO() ? CO().swatch(c.name, c.hex) : c.hex}"></a>`;
    }).join('')}${rest > 0 ? `<a class="pc-sw__more" href="${fichaHref(p)}" aria-label="${rest} colores más" tabindex="-1">+${rest}</a>` : ''}</div>`;
  };

  /* ---- Comportamiento (delegado, una sola vez) ----
     El último color sobre el que se pasa (o se toca) queda activo; no se resetea al salir.
     Solo vuelve al destacado al recargar. La ficha abre con ese color. */
  const imgOf = (card) => card.querySelector('.product-card__img img');
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sizeOf = (img) => (/-800\.webp/.test(img.currentSrc || img.src) ? 800 : 400);
  const cache = new Map(); // src → Promise (precarga + decode)
  const load = (url) => {
    if (!cache.has(url)) { const im = new Image(); im.decoding = 'async'; im.src = url; cache.set(url, (im.decode ? im.decode() : Promise.resolve()).catch(() => {})); }
    return cache.get(url);
  };
  // Precarga las variantes al entrar a la tarjeta
  const preload = (card) => {
    if (card.dataset.swPre) return; card.dataset.swPre = '1';
    const img = imgOf(card); if (!img) return;
    const w = sizeOf(img);
    card.querySelectorAll('.pc-sw__dot[data-img]').forEach((d) => { if (d.dataset.img) load(`${d.dataset.img}-${w}.webp`); });
  };
  const setImg = (card, src) => {
    const img = imgOf(card); if (!img || !src) return;
    const w = sizeOf(img), url = `${src}-${w}.webp`;
    card._swWant = src;
    // Mantiene la imagen actual hasta que la nueva esté decodificada
    load(url).then(() => {
      if (card._swWant !== src) return;
      img.srcset = `${src}-400.webp 400w, ${src}-800.webp 800w`;
      img.src = url;
      if (!reduced() && img.animate) img.animate([{ transform: 'translateY(5px)' }, { transform: 'translateY(0)' }], { duration: 260, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
    });
  };
  const select = (dot) => {
    const card = dot.closest('.product-card'), row = dot.closest('.pc-sw'); if (!card || !row) return;
    if (dot.classList.contains('is-hover')) return;
    row.querySelectorAll('.pc-sw__dot').forEach((d) => d.classList.toggle('is-hover', d === dot));
    if (dot.dataset.img) setImg(card, dot.dataset.img);
    // La tarjeta y su CTA abren la ficha con ese color
    const href = dot.getAttribute('href');
    card.dataset.pcHref = href;
    const cta = card.querySelector('.product-card__cta'); if (cta) cta.href = href;
  };
  // Área de hover = toda la fila (incluidos los espacios): se elige el punto más cercano
  const nearest = (row, x) => { let best = null, bd = Infinity; row.querySelectorAll('.pc-sw__dot').forEach((d) => { const r = d.getBoundingClientRect(), dx = Math.abs(r.left + r.width / 2 - x); if (dx < bd) { bd = dx; best = d; } }); return best; };
  document.addEventListener('pointerover', (e) => {
    const card = e.target.closest('.product-card'); if (card && e.pointerType === 'mouse') preload(card);
  });
  document.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || !fine()) return;
    const row = e.target.closest('.pc-sw[data-pc-sw]'); if (!row) return;
    const dot = nearest(row, e.clientX); if (dot) select(dot);
  });
  document.addEventListener('pointerdown', (e) => {
    const slide = e.target.closest('.s-products__slide');
    if (slide) { if (slide.classList.contains('is-active')) slide.dataset.pcWasActive = '1'; else delete slide.dataset.pcWasActive; }
    const card = e.target.closest('.product-card'); if (card) preload(card);
  }, true);
  document.addEventListener('focusin', (e) => { const dot = e.target.closest('.pc-sw__dot'); if (dot) { preload(dot.closest('.product-card')); select(dot); } });
  // Flechas entre colores (Tab entra a la fila en el punto actual)
  document.addEventListener('keydown', (e) => {
    const dot = e.target.closest('.pc-sw__dot'); if (!dot) return;
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!d) return;
    e.preventDefault();
    const dots = [...dot.closest('.pc-sw').querySelectorAll('.pc-sw__dot')];
    const next = dots[(dots.indexOf(dot) + d + dots.length) % dots.length];
    dots.forEach((x) => { x.tabIndex = x === next ? 0 : -1; });
    next.focus();
  });
  document.addEventListener('click', (e) => {
    // Táctil: tap en un punto cambia el color, no navega
    const dot = e.target.closest('.pc-sw__dot');
    if (dot && !fine()) { e.preventDefault(); select(dot); return; }
    // Clic en el resto de la tarjeta → ficha (con el color elegido)
    const card = e.target.closest('.product-card[data-pc-href]');
    if (!card || e.target.closest('a, button, input, select, label')) return;
    const slide = card.closest('.s-products__slide');
    if (slide && !slide.dataset.pcWasActive) return; // en carruseles, el clic en una inactiva solo la trae al centro
    location.href = card.dataset.pcHref;
  });

  /* ---- Tarjetas fijas (home, Municipalidades, relacionados): se completan desde los datos ---- */
  const enhance = (root = document) => {
    root.querySelectorAll('.product-card:not([data-pc-ready])').forEach((card) => {
      const link = card.querySelector('a[href*="producto.html"]'); if (!link) return;
      const id = new URLSearchParams(link.getAttribute('href').split('?')[1] || '').get('id');
      const p = byId(id);
      card.dataset.pcReady = '';
      if (!p) { const t = card.querySelector('.product-card__title'); if (t && !card.querySelector('.pc-sw')) t.insertAdjacentHTML('afterend', '<div class="pc-sw" aria-hidden="true"></div>'); return; }
      card.dataset.pcHref = fichaHref(p);
      if (card.querySelector('.pc-sw')) return;
      const src = (imgOf(card)?.getAttribute('src') || '').replace(/-(400|800)\.webp$/, '');
      let cur = null;
      p.variants.forEach((v) => v.colors.forEach((c) => { if (!cur && c.img && src.endsWith(c.img)) cur = { v, c }; }));
      if (!cur && window.featuredVariant) cur = window.featuredVariant(p);
      const title = card.querySelector('.product-card__title'); if (!title) return;
      title.insertAdjacentHTML('afterend', html(p, cur));
      const row = card.querySelector('.pc-sw[data-pc-sw]'); if (row && cur) row.dataset.default = cur.c.name;
    });
  };
  window.CardSwatches = { html, enhance, fichaHref };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => enhance()); else enhance();
})();
