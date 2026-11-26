/* ==========================================================================
   Modal "¿Dónde comprarlo?" — [data-buy-open] abre · selector de país → distribuidores
   ========================================================================== */
(() => {
  const DATA = [{"code":"pe","name":"Perú","d":[{"name":"Plásticos Roca","city":"Lima","logo":"assets/img/distribuidores/plasticos-roca.png","web":"https://plasticosroca.com.pe/","contact":"Daniel Pérez","phone":"+51 999 335 633","email":"info@plasticosroca.com.pe"},{"name":"Soluciones Ambientales","city":"Arequipa","logo":"assets/img/distribuidores/soluciones-ambientales.png","web":"","contact":"Víctor Vargas","phone":"+51 958 319 700","email":"avc.gerenciacomercial@gmail.com"}]},{"code":"cl","name":"Chile","d":[{"name":"General Trade","city":"Santiago","logo":"assets/img/distribuidores/general-trade.png","web":"https://generaltrade.cl/","phone":"+56 2 2940 9000","email":"info@generaltrade.cl"}]},{"code":"co","name":"Colombia","d":[{"name":"A1Bioseguridad","city":"Bogotá","logo":"assets/img/distribuidores/a1bioseguridad.png","web":"https://www.a1bioseguridad.com/"},{"name":"Outselling","city":"Barranquilla, Atlántico","logo":"assets/img/distribuidores/outselling.png","web":"https://outselling.com.co/"}]},{"code":"ar","name":"Argentina","d":[{"name":"Grupo Tigre","city":"Buenos Aires","logo":"assets/img/distribuidores/grupo-tigre.png","web":"https://grupotigre.com/"}]},{"code":"mx","name":"México","d":[{"name":"Cointer","city":"Ciudad de México","logo":"assets/img/distribuidores/cointer.png","web":"https://www.cointer.net/"},{"name":"Zing México","city":"Ciudad de México","logo":"assets/img/distribuidores/zing-mexico.png","web":"http://zingmexico.mx/"}]},{"code":"cr","name":"Costa Rica","d":[{"name":"Ecosoluciones Costa Rica","city":"San José, Moravia","logo":"assets/img/distribuidores/ecosoluciones.png","web":""}]},{"code":"ec","name":"Ecuador","d":[{"name":"Rentelkoi","city":"Ibarra","logo":"assets/img/distribuidores/rentelkoi.png","web":"https://www.rentelkoi.com/"}]},{"code":"sv","name":"El Salvador","d":[{"name":"Recycle","city":"San Salvador","logo":"assets/img/distribuidores/recycle.png","web":"https://www.recyclehonduras.com/"}]},{"code":"gt","name":"Guatemala","d":[{"name":"Repelsa","city":"Ciudad de Guatemala","logo":"assets/img/distribuidores/repelsa.png","web":"https://www.repelsa.com/"}]},{"code":"hn","name":"Honduras","d":[{"name":"Recycle","city":"Ticamaya, Choloma, Cortés","logo":"assets/img/distribuidores/recycle.png","web":"https://www.recyclehonduras.com/"}]},{"code":"py","name":"Paraguay","d":[{"name":"Parpack","city":"Mariano Roque Alonso","logo":"assets/img/distribuidores/parpack.png","web":"http://www.parpack.com.py/"}]},{"code":"do","name":"República Dominicana","d":[{"name":"Open Clean","city":"Santo Domingo","logo":"assets/img/distribuidores/open-clean.png","web":"https://opencleanrd.net/"}]},{"code":"uy","name":"Uruguay","d":[{"name":"Quinquin","city":"Montevideo","logo":"assets/img/distribuidores/quinquin.png","web":"https://www.quinquin.com.uy/"}]}];
  const dlg = document.querySelector('[data-buy]');
  if (!dlg) return;
  const $ = (s) => dlg.querySelector(s);
  const sel = $('[data-buy-country]'), list = $('[data-buy-list]'), empty = $('[data-buy-empty]');
  const lead = $('[data-buy-lead]'), hint = $('[data-buy-hint]'), count = $('[data-buy-count]');
  const total = DATA.reduce((n, c) => n + c.d.length, 0);
  $('[data-buy-total]').textContent = `Tenemos ${total} distribuidores autorizados en ${DATA.length} países de Latinoamérica.`;
  [...DATA].sort((a, b) => a.name.localeCompare(b.name, 'es')).forEach((c) => sel.add(new Option(c.name, c.code)));
  const esc = (s) => String(s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[m]);
  const arrow = '<span class="btn__icon"><i class="ph ph-arrow-right" aria-hidden="true"></i></span>';

  function product() {
    const name = document.querySelector('.pd-bar__name')?.textContent.trim() || '';
    const meta = document.querySelector('[data-pd-bar-meta]')?.textContent.trim() || '';
    return { name, meta };
  }

  function render() {
    const c = DATA.find((x) => x.code === sel.value);
    dlg.classList.toggle('has-country', !!c);
    empty.hidden = !!c; hint.hidden = !!c; list.hidden = !c;
    lead.textContent = c ? 'Te conectamos con el distribuidor autorizado de ESE en tu país.' : 'Selecciona tu país para ver los distribuidores autorizados de ESE.';
    count.hidden = !c || c.d.length < 2;
    if (!c) { list.innerHTML = ''; return; }
    count.textContent = `${c.d.length} distribuidores en ${c.name}`;
    const p = product();
    const msg = encodeURIComponent(`Hola, quiero cotizar: ${p.name} (${p.meta}). Lo vi en la web de ESE.`);
    list.innerHTML = c.d.map((d, i) => {
      const wa = d.phone ? `<a class="btn btn--primary btn--split btn--split-tint buy-card__wa" href="https://wa.me/${d.phone.replace(/\D/g, '')}?text=${msg}" target="_blank" rel="noopener"><span class="btn__label">Cotizar por WhatsApp</span>${arrow}</a>` : '';
      const web = d.web ? `<a class="btn btn--primary buy-card__web" href="${esc(d.web)}" target="_blank" rel="noopener">Visitar web</a>` : '';
      const mail = !d.phone && d.email ? `<a class="btn btn--primary btn--split btn--split-tint" href="mailto:${esc(d.email)}?subject=${encodeURIComponent('Cotización: ' + p.name)}"><span class="btn__label">Cotizar por correo</span>${arrow}</a>` : '';
      const fb = !d.phone && !d.email && !d.web ? `<a class="btn btn--primary btn--split btn--split-tint" href="index.html#contacto"><span class="btn__label">Contactar a ESE</span>${arrow}</a>` : '';
      const info = [d.contact, d.phone, d.email].filter(Boolean).map((t) => `<span>${esc(t)}</span>`).join('');
      return `<li class="buy-card${i === 0 && c.d.length > 1 ? ' is-near' : ''}${i === 0 ? ' is-first' : ''}">
        <div class="buy-card__head">
          <span class="buy-card__logo">${d.logo ? `<img src="${esc(d.logo)}" width="240" height="240" alt="" loading="lazy">` : '<i class="ph ph-storefront" aria-hidden="true"></i>'}</span>
          <span class="buy-card__titles"><span class="buy-card__city">${esc(d.city)}, ${esc(c.name)}</span><span class="buy-card__name">${esc(d.name)}</span></span>
          ${i === 0 && c.d.length > 1 ? '<span class="buy-card__badge">Más cercano</span>' : ''}
        </div>
        ${info ? `<p class="buy-card__info">${info}</p>` : ''}
        <div class="buy-card__actions">${wa}${mail}${fb}${web}</div>
      </li>`;
    }).join('');
  }

  function guess() {
    const langs = navigator.languages || [navigator.language || ''];
    for (const l of langs) {
      const r = (l.split('-')[1] || '').toLowerCase();
      if (DATA.some((c) => c.code === r)) return r;
    }
    return '';
  }

  let lastFocus = null;
  function open(e) {
    e?.preventDefault();
    lastFocus = document.activeElement;
    const p = product();
    $('[data-buy-name]').textContent = p.name;
    $('[data-buy-meta]').textContent = p.meta;
    const img = document.querySelector('[data-pd-bar-img]');
    if (img) $('[data-buy-img]').src = img.currentSrc || img.src;
    if (!sel.dataset.touched) sel.value = guess();
    render();
    dlg.showModal();
    document.documentElement.classList.add('is-modal-open');
    window.lenis?.stop?.();
    requestAnimationFrame(() => dlg.classList.add('is-open'));
  }
  function close() {
    dlg.classList.remove('is-open');
    document.documentElement.classList.remove('is-modal-open');
    window.lenis?.start?.();
    setTimeout(() => { dlg.close(); lastFocus?.focus?.(); }, 280);
  }
  sel.addEventListener('change', () => { sel.dataset.touched = '1'; render(); });
  document.querySelectorAll('[data-buy-open]').forEach((b) => b.addEventListener('click', open));
  dlg.querySelector('[data-buy-close]').addEventListener('click', close);
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });

  /* Swipe hacia abajo en la hoja mobile */
  const sheet = $('.buy__panel');
  let y0 = null, dy = 0;
  $('.buy__grip').addEventListener('pointerdown', (e) => { y0 = e.clientY; dy = 0; sheet.style.transition = 'none'; e.target.setPointerCapture(e.pointerId); });
  $('.buy__grip').addEventListener('pointermove', (e) => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); sheet.style.translate = `0 ${dy}px`; });
  $('.buy__grip').addEventListener('pointerup', () => { sheet.style.transition = ''; sheet.style.translate = ''; if (dy > 90) close(); y0 = null; });
})();
