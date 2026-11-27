/* Ficha de producto: llena la plantilla de producto.html con los datos de PRODUCTS (?id=…).
   Solo cambia contenido (nombre, descripción, litrajes, colores, imágenes); el diseño es el de la plantilla. */
(() => {
  const root = document.querySelector('[data-pd]'), P = window.PRODUCTS;
  if (!root || !P) return;
  const id = new URLSearchParams(location.search).get('id') || 'cl';
  const p = P.find((x) => x.id === id) || P[0];
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const $ = (s, el = document) => el.querySelector(s);
  window.__pdName = p.name;

  // Título: parte delgada + parte en negrita
  const m = p.name.match(/^(Contenedor \d ruedas|Papelera Urbana)\s+(.+)$/);
  const w = p.name.split(' ');
  const [light, bold] = m ? [m[1], m[2]] : w.length > 1 ? [w[0], w.slice(1).join(' ')] : ['', p.name];
  const line = $('#pd-title [data-line]');
  const l1 = p.titulo1 || light, l2 = p.titulo2 || bold;
  if (line) line.innerHTML = (l1 ? '<span class="pd-title__l1">' + esc(l1) + '</span> ' : '') + '<strong class="pd-title__l2">' + esc(l2) + '</strong>';
  // Escalón de tamaño según la línea más larga (≤16 · 17–22 · ≥23)
  $('#pd-title')?.setAttribute('data-len', String(Math.max(l1.length, l2.length)));
  $('#pd-title')?.setAttribute('data-size', Math.max(l1.length, l2.length) >= 23 ? 's' : Math.max(l1.length, l2.length) >= 17 ? 'm' : 'l');
  // Ajuste fino: si una línea del título no cabe en la columna, se reduce lo justo (margen 16px)
  const titleEl = $('#pd-title');
  const fitTitle = () => {
    if (!titleEl) return;
    titleEl.style.removeProperty('font-size');
    const info = titleEl.closest('.s-pd__info');
    if (!info || innerWidth < 1024) return;
    const avail = info.getBoundingClientRect().width - 16;
    const widest = Math.max(...[...titleEl.querySelectorAll('.pd-title__l1, .pd-title__l2')].map((s) => s.scrollWidth));
    if (widest > avail) titleEl.style.fontSize = (parseFloat(getComputedStyle(titleEl).fontSize) * avail / widest).toFixed(2) + 'px';
  };
  fitTitle();
  document.fonts?.ready.then(fitTitle);
  let fitT; addEventListener('resize', () => { clearTimeout(fitT); fitT = setTimeout(fitTitle, 120); });
  document.title = p.name + ' — ESE Latam';
  $('meta[name="description"]')?.setAttribute('content', p.desc || '');
  const pdRoot = document.querySelector('[data-pd]');
  if (pdRoot) pdRoot.dataset.theme = p.theme || 'azul';
  const crumb = $('.s-pd .breadcrumb [aria-current="page"]');
  if (crumb) crumb.textContent = p.name;
  const lead = $('.pd-lead', root);
  if (lead) lead.textContent = p.desc || '';

  // Capacidades
  const capsBox = $('.pd-caps', root);
  const hasCombo = (v) => v.colors.some((c) => window.ESE_COLORS && window.ESE_COLORS.isCombo(c.name));
  // Variante inicial: la del color destacado (o la primera con foto)
  const fv = window.featuredVariant ? window.featuredVariant(p) : null;
  let baseVi = fv ? p.variants.indexOf(fv.v) : Math.max(0, p.variants.findIndex((v) => v.colors.some((c) => c.img)));
  { const qc = parseInt(new URLSearchParams(location.search).get('cap'), 10); const qi = p.variants.findIndex((v) => v.cap === qc); if (qi >= 0) baseVi = qi; }
  let vi = new URLSearchParams(location.search).get('version') === 'clips' && p.variants.some(hasCombo) && !hasCombo(p.variants[baseVi]) ? p.variants.findIndex(hasCombo) : baseVi;
  capsBox.innerHTML = p.variants.map((v, i) =>
    `<button class="pd-cap" type="button" role="radio" aria-checked="${i === vi}" data-cap="${esc(v.cap ?? '')}" data-label="${esc(v.label ?? '')}" data-vi="${i}">${esc(v.label ?? '')}</button>`).join('');
  if (p.variants.length === 1 && !p.variants[0].label) capsBox.closest('fieldset').hidden = true;

  // Colores: todos los que existen en alguna capacidad; cada capacidad oculta los que no tiene
  const CO = window.ESE_COLORS;
  let all = [];
  p.variants.forEach((v) => v.colors.forEach((c) => { if (!all.some((a) => a.name === c.name)) all.push(c); }));
  if (CO) all = CO.sort(all);
  const noColor = all.length === 1 && !all[0].name;
  const colorsBox = $('.pd-colors', root);
  const bg = (c) => CO ? CO.swatch(c.name, c.hex) : (c.hex2 ? `linear-gradient(135deg, ${c.hex2} 0 50%, ${c.hex} 50% 100%)` : c.hex);
  const btn = (c) => `<button class="pd-color" type="button" role="radio" aria-checked="false" aria-label="${esc(c.name)}" data-color="${esc(c.name)}" data-img="" style="--c:${bg(c)}"></button>`;
  // Una sola fila de color; las variantes con clips/tapa se eligen con el selector de VERSIÓN
  const isCombo = (n) => !!(CO && CO.isCombo(n));
  colorsBox.innerHTML = all.map(btn).join('');
  const colorSet = colorsBox.closest('fieldset');
  const verBox = document.createElement('fieldset');
  verBox.className = 'pd-opt pd-opt--version';
  verBox.hidden = true;
  verBox.innerHTML = '<legend class="pd-opt__label">Versión</legend><div class="pd-caps pd-vers" role="radiogroup" aria-label="Versión">'
    + '<button class="pd-cap pd-ver" type="button" role="radio" aria-checked="true" data-ver="solido">Color sólido</button>'
    + '<button class="pd-cap pd-ver" type="button" role="radio" aria-checked="false" data-ver="clips" data-ver-label></button></div>';
  colorSet.before(verBox);
  const help = document.createElement('p');
  help.className = 'pd-opt__help';
  help.hidden = true;
  const params = new URLSearchParams(location.search);
  let ver = params.get('version') === 'clips' ? 'clips' : 'solido';
  if (!all.length || noColor) colorsBox.closest('fieldset').hidden = true;
  if (p.colorLabel) { const lg = colorsBox.closest('fieldset').querySelector('legend'); if (lg) lg.textContent = p.colorLabel; }

  let curVi = vi;
  const setVariant = (i) => {
    curVi = i;
    const v = p.variants[i];
    const combos = v.colors.filter((c) => isCombo(c.name));
    const kind = combos.some((c) => /con tapa/i.test(c.name)) ? 'tapa' : 'clips';
    verBox.hidden = !combos.length;
    if (!combos.length) ver = 'solido';
    verBox.querySelector('[data-ver-label]').textContent = kind === 'tapa' ? 'Gris con tapa de color' : 'Gris con clips de color';
    verBox.querySelectorAll('[data-ver]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.ver === ver)));
    help.textContent = 'Cuerpo gris oscuro con ' + (kind === 'tapa' ? 'tapa' : 'clips') + ' de color para identificar cada tipo de residuo.';
    help.hidden = ver !== 'clips';
    colorsBox.querySelectorAll('[data-color]').forEach((b) => {
      const c = v.colors.find((x) => x.name === b.dataset.color);
      b.hidden = !c || isCombo(b.dataset.color) !== (ver === 'clips');
      b.dataset.img = (c && c.img) || '';
    });
  };
  // Si el panel cambia de alto (aparece/desaparece Versión), lo hace con un desplazamiento suave
  const panel = colorsBox.closest('.pd-options');
  let hAnim;
  const animH = (fn) => {
    if (!panel || matchMedia('(prefers-reduced-motion: reduce)').matches || !panel.animate) return fn();
    const h0 = panel.getBoundingClientRect().height;
    hAnim?.cancel();
    fn();
    const h1 = panel.getBoundingClientRect().height;
    if (Math.abs(h1 - h0) < 1) return;
    panel.style.overflow = 'hidden';
    hAnim = panel.animate([{ height: h0 + 'px' }, { height: h1 + 'px' }], { duration: 420, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
    hAnim.onfinish = hAnim.oncancel = () => { panel.style.overflow = ''; };
    const ver0 = verBox;
    if (!ver0.hidden) ver0.animate([{ opacity: 0, transform: 'translateY(-0.5rem)' }, { opacity: 1, transform: 'none' }], { duration: 360, delay: 80, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' });
  };
  window.__pdVariant = (btn) => { const was = verBox.hidden; animH(() => setVariant(+btn.dataset.vi)); if (was === verBox.hidden) verBox.getAnimations().forEach((a) => a.cancel()); };
  setVariant(vi);
  const syncUrl = () => {
    const q = new URLSearchParams(location.search);
    if (verBox.hidden || ver === 'solido') q.set('version', 'solido'); else q.set('version', 'clips');
    history.replaceState(null, '', location.pathname + '?' + q.toString() + location.hash);
  };
  verBox.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ver]');
    if (!b || b.dataset.ver === ver) return;
    ver = b.dataset.ver;
    setVariant(curVi);
    // Primer color disponible según el orden global (grises primero)
    const firstC = colorsBox.querySelector('[data-color]:not([hidden])');
    if (firstC && window.__pdPickColor) window.__pdPickColor(firstC, true);
    syncUrl();
  });
  document.addEventListener('click', (e) => { if (e.target.closest('[data-cap]')) setTimeout(syncUrl, 0); });

  // Color inicial
  const vis = [...colorsBox.querySelectorAll('[data-color]:not([hidden])')];
  const urlColor = new URLSearchParams(location.search).get('color');
  const featC = p.featured && p.featured.color;
  const first = (urlColor && vis.find((b) => b.dataset.color === urlColor && b.dataset.img)) || (featC && vis.find((b) => b.dataset.color === featC && b.dataset.img)) || vis.find((b) => b.dataset.img) || vis[0];
  if (first) first.setAttribute('aria-checked', 'true');
  const nameEl = $('[data-color-name]', root);
  if (nameEl) nameEl.textContent = first ? first.dataset.color : '';

  // Imagen (o placeholder si la variante aún no tiene foto)
  const img = $('[data-pd-img]', root);
  const ph = document.createElement('div');
  ph.className = 'placeholder pd-ph';
  ph.setAttribute('data-pd-ph', '');
  ph.setAttribute('aria-hidden', 'true');
  ph.innerHTML = '<span class="placeholder__label">imagen pendiente</span>';
  ph.hidden = true;
  img.after(ph);
  const src = (first && first.dataset.img) || (vis.length ? '' : (p.variants[vi].colors[0]?.img || ''));
  const cap = p.variants[vi].label;
  if (src) {
    img.src = src + '-800.webp';
    img.srcset = src + '-400.webp 400w, ' + src + '-800.webp 800w';
    img.alt = p.name + (cap ? ' ' + cap : '') + (first && first.dataset.color ? ', color ' + first.dataset.color.toLowerCase() : '');
  } else {
    img.hidden = true; img.removeAttribute('src'); img.removeAttribute('srcset'); img.alt = '';
    ph.hidden = false;
  }

  // Características: los valores de la plantilla son del CL; para el resto quedan por confirmar
  // Características: del Excel de la clienta, por litraje
  const sp = p.specs;
  window.__pdMat = (sp && sp.material) || p.material || '';
  window.__pdSpecs = (i) => sp ? [sp.load[i], sp.weight[i], sp.wheels[i]] : ['Por confirmar', 'Por confirmar', 'Por confirmar'];
  const s0 = window.__pdSpecs(vi);
  const setDD = (k, t) => { const dd = document.querySelector('[data-spec="' + k + '"]'); if (dd) dd.textContent = t; };
  setDD('load', s0[0]); setDD('weight', s0[1]); setDD('wheels', s0[2]);
  document.querySelectorAll('.pd-spec').forEach((el) => { if (/material/i.test(el.querySelector('dt')?.textContent || '')) el.querySelector('dd').textContent = window.__pdMat || 'Por confirmar'; });

  // Barra fija + modal de compra (lee nombre y meta de la barra)
  const barName = $('.pd-bar__name');
  if (barName) barName.textContent = p.name;
  const barMeta = $('[data-pd-bar-meta]');
  if (barMeta) barMeta.textContent = [cap, first && first.dataset.color, window.__pdMat].filter(Boolean).join(' · ');
  const barImg = $('[data-pd-bar-img]');
  if (barImg) { if (src) { barImg.src = src + '-400.webp'; barImg.style.visibility = ''; } else barImg.style.visibility = 'hidden'; }
})();

/* Volver al catálogo con los filtros que traía, directo a la grilla */
(() => {
  let s = null; try { s = JSON.parse(sessionStorage.getItem('ese:catalog')); } catch (e) {}
  const href = 'productos.html' + ((s && s.search) || '') + '#catalogo';
  document.querySelectorAll('main a[href="productos.html"]').forEach((a) => { a.href = href; });
})();

/* Ficha técnica (PDF) de la capacidad elegida */
(() => {
  const id = new URLSearchParams(location.search).get('id') || 'cl';
  const p = (window.PRODUCTS || []).find((x) => x.id === id); if (!p) return;
  const sync = () => {
    const b = document.querySelector('[data-pd] [data-cap][aria-checked="true"]');
    const v = (b && p.variants[+b.dataset.vi]) || p.variants[0];
    document.querySelectorAll('[data-pd-pdf]').forEach((a) => {
      const ok = !!(v && v.pdf);
      if (ok) { a.href = v.pdf; a.setAttribute('download', v.pdf.split('/').pop()); a.removeAttribute('aria-disabled'); a.title = 'Ficha técnica ' + p.name + ' ' + v.label; }
      else { a.removeAttribute('href'); a.removeAttribute('download'); a.setAttribute('aria-disabled', 'true'); a.title = 'Ficha técnica disponible pronto'; }
    });
  };
  document.addEventListener('click', (e) => { if (e.target.closest('[data-pd] [data-cap]')) setTimeout(sync, 0); });
  sync();
})();

/* Documentos del producto: catálogo PDF de su familia + opciones (p. ej. BIO SELECT) */
(() => {
  const id = new URLSearchParams(location.search).get('id') || 'cl';
  const p = (window.PRODUCTS || []).find((x) => x.id === id);
  const btn = document.querySelector('[data-pd] [data-pd-pdf]');
  if (!p || !btn) return;
  const CAT = { 'Contenedores 2 ruedas': 'cat-2-ruedas', 'Contenedores 3 ruedas': 'cat-3-ruedas', 'Contenedores 4 ruedas': 'cat-4-ruedas', 'Papeleras': 'cat-papeleras', 'Soterrados': 'cat-semi-soterrados', 'Contenedores biológicos': 'cat-biologicos', 'Contenedores domésticos': 'cat-domesticos' };
  const anchor = /split/.test(p.id) ? 'cat-4-ruedas-spl' : (CAT[p.line] || 'cat-general');
  const box = document.createElement('ul'); box.className = 'pd-docs'; box.setAttribute('role', 'list');
  box.innerHTML = `<li><a href="catalogos.html#${anchor}"><i class="ph ph-download-simple" aria-hidden="true"></i>Descargar catálogo (PDF)</a></li>` +
    (p.docs || []).map((d) => `<li><a href="${d.href}" download><i class="ph ph-file-pdf" aria-hidden="true"></i>${d.label}</a></li>`).join('');
  const row = btn.closest('.pd-actions') || btn.parentElement;
  row.appendChild(box);
})();
