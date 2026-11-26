/* Contacto: validación, estado "enviando", éxito con check animado + confeti.
   El envío real se conecta en WP (reemplazar el setTimeout por el fetch). */
(() => {
  const form = document.querySelector('[data-contact]');
  if (!form) return;
  const done = document.querySelector('[data-contact-done]');
  const alertBox = form.querySelector('[data-contact-alert]');
  const alertText = form.querySelector('[data-contact-alert-text]');
  const btn = form.querySelector('[type="submit"]');
  const label = btn.querySelector('[data-contact-label]');
  const icon = btn.querySelector('[data-contact-icon]');
  const fields = [...form.querySelectorAll('[required]')];
  const wrap = (el) => el.closest('.field, .check');
  const msgFor = (el) => el.dataset.msg || (el.validity.typeMismatch || el.validity.customError ? 'Ingresa un valor válido.' : 'Completa este campo.');
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const strict = (el) => { if (el.type === 'email') el.setCustomValidity(el.value && !EMAIL.test(el.value) ? (el.dataset.msg || 'Correo no válido') : ''); return el; };
  const show = (el) => {
    const ok = strict(el).checkValidity();
    const err = document.getElementById(el.id + '-error');
    wrap(el)?.classList.toggle('is-invalid', !ok);
    el.setAttribute('aria-invalid', ok ? 'false' : 'true');
    if (err) { err.hidden = ok; err.textContent = ok ? '' : msgFor(el); }
    return ok;
  };
  const updateAlert = () => {
    if (alertBox.hidden) return;
    const n = fields.filter((el) => !strict(el).checkValidity()).length;
    if (!n) { alertBox.hidden = true; return; }
    alertText.textContent = 'Revisa ' + (n === 1 ? 'el campo marcado' : 'los ' + n + ' campos marcados') + ' para enviar tu solicitud.';
  };
  fields.forEach((el) => {
    const re = () => { if (el.dataset.touched) { show(el); updateAlert(); } };
    el.addEventListener('input', re);
    el.addEventListener('change', () => { el.dataset.touched = '1'; re(); });
    el.addEventListener('blur', () => { el.dataset.touched = '1'; re(); });
  });
  const scrollTo = (el) => { const y = el.getBoundingClientRect().top + scrollY - 140; (window.lenis ? window.lenis.scrollTo(y) : window.scrollTo({ top: y, behavior: 'smooth' })); };
  const setBusy = (busy) => {
    btn.setAttribute('aria-busy', busy ? 'true' : 'false');
    label.textContent = busy ? 'Enviando solicitud…' : 'Solicitar asesoría';
    icon.className = busy ? 'ph ph-circle-notch' : 'ph ph-arrow-right';
  };
  const celebrate = () => {
    const r = done.querySelector('.contact-done__check').getBoundingClientRect();
    setTimeout(() => window.eseConfetti?.({ origin: { x: r.left + r.width / 2, y: r.top + r.height / 2 } }), 250);
  };
  const showDone = () => {
    const first = (form.nombre.value.trim().split(/\s+/)[0] || '');
    done.querySelector('[data-contact-name]').textContent = first ? ', ' + first : '';
    done.querySelector('[data-contact-mail]').textContent = form.correo.value || 'tu correo';
    form.hidden = true;
    done.hidden = false;
    done.classList.remove('is-in'); void done.offsetWidth; done.classList.add('is-in');
    scrollTo(done);
    setTimeout(() => { done.focus({ preventScroll: true }); celebrate(); }, 350);
  };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    fields.forEach((el) => (el.dataset.touched = '1'));
    const bad = fields.filter((el) => !show(el));
    if (bad.length) {
      alertBox.hidden = false; updateAlert();
      scrollTo(alertBox);
      bad[0].focus({ preventScroll: true });
      return;
    }
    alertBox.hidden = true;
    setBusy(true);
    setTimeout(() => { setBusy(false); showDone(); }, 1600);
  });
  const reset = () => {
    form.reset();
    fields.forEach((el) => { el.setCustomValidity(''); delete el.dataset.touched; wrap(el)?.classList.remove('is-invalid'); el.removeAttribute('aria-invalid'); const err = document.getElementById(el.id + '-error'); if (err) err.hidden = true; });
    alertBox.hidden = true; setBusy(false);
    done.hidden = true; done.classList.remove('is-in'); form.hidden = false;
  };
  done.querySelector('[data-contact-again]').addEventListener('click', () => { reset(); scrollTo(form); form.nombre.focus({ preventScroll: true }); });

  // Panel de demo (quitar en producción)
  const demo = document.querySelector('[data-contact-demo]');
  demo?.addEventListener('click', (e) => {
    const k = e.target.closest('[data-demo]')?.dataset.demo;
    if (!k) return;
    if (k === 'confetti') { window.eseConfetti?.(); return; }
    reset();
    if (k === 'reset') return;
    const set = (n, v) => { form[n].value = v; };
    if (k === 'ok') {
      set('nombre', 'María Torres'); set('empresa', 'Municipalidad de San Isidro'); set('correo', 'mtorres@munisanisidro.gob.pe'); set('telefono', '+51 987 654 321');
      set('pais', 'Perú'); set('sector', 'Municipalidades y gobiernos locales'); set('producto', 'Contenedor de 4 ruedas · 1.100 L');
      set('mensaje', 'Necesitamos 40 contenedores de 1.100 L para el nuevo sistema de recolección del distrito.'); form.acepto.checked = true;
    } else {
      set('correo', 'mtorres@munisanisidro'); set('telefono', '+51 987 654 321'); set('pais', 'Perú');
      set('mensaje', 'Necesitamos 40 contenedores de 1.100 L para el nuevo sistema de recolección del distrito.');
    }
    form.requestSubmit();
  });
})();
